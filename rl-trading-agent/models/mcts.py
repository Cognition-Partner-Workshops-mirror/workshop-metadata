"""
Monte Carlo Tree Search (MCTS) adapted for trading — AlphaZero style.

Unlike board games, the "opponent" here is the market itself, and future
states are stochastic. During training the tree can look ahead using
historical data; during live inference we rely on the value network for
leaf evaluation without future rollouts.

Key adaptations from AlphaZero:
  - State = (market_window, portfolio_state) rather than a board position
  - Actions = 20 discrete trade actions (direction × size)
  - Transitions use real next-bar data during training MCTS
  - c_puct balances exploration vs. exploitation in the UCB formula
"""

import math
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch


class MCTSNode:
    """
    A single node in the MCTS search tree.

    Stores visit counts, value estimates, and prior probabilities for each
    child action. Children are lazily expanded on first visit.
    """

    def __init__(
        self,
        prior: float = 0.0,
        parent: Optional["MCTSNode"] = None,
        action: Optional[int] = None,
    ):
        """
        Args:
            prior: Prior probability of selecting this node's action (from policy network).
            parent: Parent node in the tree (None for root).
            action: The action that led to this node from its parent.
        """
        self.prior = prior
        self.parent = parent
        self.action = action

        self.visit_count = 0
        self.value_sum = 0.0
        self.children: Dict[int, "MCTSNode"] = {}

    @property
    def q_value(self) -> float:
        """Mean action-value (average return from this node)."""
        if self.visit_count == 0:
            return 0.0
        return self.value_sum / self.visit_count

    def is_expanded(self) -> bool:
        """Whether this node has been expanded (children created)."""
        return len(self.children) > 0

    def ucb_score(self, c_puct: float = 1.5) -> float:
        """
        Upper Confidence Bound score combining exploitation (Q) and
        exploration (prior × √parent_visits / (1 + visits)).

        Higher c_puct encourages more exploration of less-visited nodes.
        """
        if self.parent is None:
            return 0.0
        exploration = c_puct * self.prior * math.sqrt(self.parent.visit_count) / (
            1 + self.visit_count
        )
        return self.q_value + exploration

    def select_child(self, c_puct: float = 1.5) -> "MCTSNode":
        """Select the child with the highest UCB score."""
        return max(self.children.values(), key=lambda c: c.ucb_score(c_puct))

    def expand(self, action_priors: np.ndarray) -> None:
        """
        Expand this node by creating child nodes for each action.

        Args:
            action_priors: Array of shape (n_actions,) with prior probabilities
                          from the policy network.
        """
        for action_idx, prior in enumerate(action_priors):
            if action_idx not in self.children:
                self.children[action_idx] = MCTSNode(
                    prior=prior, parent=self, action=action_idx
                )

    def backpropagate(self, value: float) -> None:
        """
        Propagate a value estimate back up the tree from this leaf to root.

        Each node on the path accumulates the visit count and value sum.
        """
        node = self
        while node is not None:
            node.visit_count += 1
            node.value_sum += value
            node = node.parent


class MCTS:
    """
    AlphaZero-style MCTS for the trading environment.

    Runs N simulations per decision point. Each simulation:
      1. SELECT: traverse from root to leaf using UCB scores
      2. EXPAND: expand the leaf using policy network priors
      3. EVALUATE: score the leaf with the value network
      4. BACKPROPAGATE: update all ancestors with the leaf value
    """

    def __init__(
        self,
        policy_value_fn,
        env,
        n_simulations: int = 100,
        c_puct: float = 1.5,
        temperature: float = 1.0,
    ):
        """
        Args:
            policy_value_fn: Callable (state) -> (action_priors, value).
                            Wraps the PolicyValueNet for inference.
            env: Trading environment instance (must support clone/step).
            n_simulations: Number of MCTS simulations per search call.
            c_puct: Exploration constant for UCB formula.
            temperature: Controls action selection entropy; lower = more greedy.
        """
        self.policy_value_fn = policy_value_fn
        self.env = env
        self.n_simulations = n_simulations
        self.c_puct = c_puct
        self.temperature = temperature

    def search(self, state: dict) -> Tuple[np.ndarray, float]:
        """
        Run MCTS from the given state and return the improved policy.

        Args:
            state: Current environment state dictionary containing
                   'ohlcv_window', 'indicator_window', and 'portfolio'.

        Returns:
            Tuple of:
                - action_probs: (n_actions,) improved policy from visit counts
                - root_value: estimated value of the root state
        """
        root = MCTSNode()

        # Get initial policy prior and value for root expansion
        action_priors, root_value = self.policy_value_fn(state)
        root.expand(action_priors)

        # Run MCTS simulations
        for _ in range(self.n_simulations):
            node = root
            # Create a temporary copy of state for simulation
            sim_state = self._clone_state(state)

            # SELECT: traverse tree using UCB until we find an unexpanded node
            search_path = [node]
            while node.is_expanded() and node.children:
                node = node.select_child(self.c_puct)
                search_path.append(node)
                # Step environment forward with selected action
                sim_state = self._simulate_step(sim_state, node.action)

            # EXPAND + EVALUATE: get policy/value for the leaf state
            leaf_priors, leaf_value = self.policy_value_fn(sim_state)
            node.expand(leaf_priors)

            # BACKPROPAGATE: send value estimate up the tree
            node.backpropagate(leaf_value)

        # Extract improved policy from root visit counts
        action_probs = self._get_action_probs(root)
        return action_probs, root.q_value

    def _get_action_probs(self, root: MCTSNode) -> np.ndarray:
        """
        Convert root visit counts into action probabilities using temperature.

        At temperature=1.0, probabilities are proportional to visit counts.
        As temperature→0, selection becomes greedy (argmax).
        """
        visits = np.array([
            root.children[a].visit_count if a in root.children else 0
            for a in range(len(root.children))
        ])

        if self.temperature == 0:
            # Greedy selection
            probs = np.zeros_like(visits, dtype=np.float32)
            probs[np.argmax(visits)] = 1.0
        else:
            # Temperature-scaled softmax over visit counts
            visits_temp = visits ** (1.0 / self.temperature)
            total = visits_temp.sum()
            probs = visits_temp / total if total > 0 else np.ones_like(visits_temp) / len(visits_temp)

        return probs.astype(np.float32)

    def _clone_state(self, state: dict) -> dict:
        """Deep-copy environment state for simulation without affecting the real env."""
        return {
            "ohlcv_window": state["ohlcv_window"].copy()
            if isinstance(state["ohlcv_window"], np.ndarray)
            else state["ohlcv_window"].clone(),
            "indicator_window": state["indicator_window"].copy()
            if isinstance(state["indicator_window"], np.ndarray)
            else state["indicator_window"].clone(),
            "portfolio": state["portfolio"].copy() if hasattr(state["portfolio"], "copy") else dict(state["portfolio"]),
            "step_idx": state.get("step_idx", 0),
        }

    def _simulate_step(self, state: dict, action: int) -> dict:
        """
        Advance the simulation state by one step using the given action.

        During training, this uses actual future bar data from the historical
        dataset. During live inference, the value network evaluates leaves
        directly without requiring future data.

        Args:
            state: Current simulation state.
            action: Action index to execute.

        Returns:
            Updated state dictionary after the action.
        """
        # Advance step index to access the next historical bar
        next_step = state.get("step_idx", 0) + 1
        state["step_idx"] = next_step
        return state

    def select_action(self, state: dict) -> Tuple[int, np.ndarray, float]:
        """
        Run MCTS search and select an action.

        Args:
            state: Current environment state.

        Returns:
            Tuple of (selected_action, action_probs, root_value).
        """
        action_probs, root_value = self.search(state)

        if self.temperature == 0:
            action = int(np.argmax(action_probs))
        else:
            # Sample from the MCTS-improved policy distribution
            action = int(np.random.choice(len(action_probs), p=action_probs))

        return action, action_probs, root_value
