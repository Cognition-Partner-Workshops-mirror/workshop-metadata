"""
Self-play loop for AlphaZero-style training.

Generates training data by running the agent against historical market data
using MCTS-guided action selection. Each episode produces (state, MCTS_policy,
outcome) tuples stored in a replay buffer for supervised training of the
policy-value network.

This is the "data generation" phase of the AlphaZero pipeline:
  1. Sample a random historical window
  2. At each step, run MCTS to get improved action probabilities
  3. Execute the MCTS-selected action in the environment
  4. After the episode, compute actual returns and store training tuples
"""

import logging
import random
from collections import deque
from dataclasses import dataclass
from typing import Deque, List, Optional, Tuple

import numpy as np
import torch

from env.trading_env import TradingEnv
from models.mcts import MCTS
from models.policy_value_net import PolicyValueNet, N_ACTIONS

logger = logging.getLogger(__name__)


@dataclass
class SelfPlaySample:
    """Single training sample produced by a self-play episode."""

    # OHLCV observation window
    ohlcv: np.ndarray
    # Indicator observation window
    indicators: np.ndarray
    # Portfolio state vector
    portfolio_state: np.ndarray
    # MCTS-improved policy target (n_actions,)
    mcts_policy: np.ndarray
    # Actual discounted return from this state (training target for value head)
    value_target: float


class ReplayBuffer:
    """
    Fixed-size circular buffer storing self-play training samples.

    When the buffer is full, oldest samples are automatically discarded.
    Supports uniform random sampling for mini-batch training.
    """

    def __init__(self, capacity: int = 500_000):
        """
        Args:
            capacity: Maximum number of samples to retain.
        """
        self.capacity = capacity
        self.buffer: Deque[SelfPlaySample] = deque(maxlen=capacity)

    def push(self, sample: SelfPlaySample) -> None:
        """Add a single sample to the buffer."""
        self.buffer.append(sample)

    def push_batch(self, samples: List[SelfPlaySample]) -> None:
        """Add a batch of samples to the buffer."""
        self.buffer.extend(samples)

    def sample(self, batch_size: int) -> List[SelfPlaySample]:
        """
        Sample a random mini-batch from the buffer.

        Args:
            batch_size: Number of samples to draw.

        Returns:
            List of SelfPlaySample objects.
        """
        batch_size = min(batch_size, len(self.buffer))
        return random.sample(list(self.buffer), batch_size)

    def __len__(self) -> int:
        return len(self.buffer)


def make_policy_value_fn(model: PolicyValueNet, device: torch.device):
    """
    Create a callable that wraps the PolicyValueNet for MCTS use.

    Converts environment state dictionaries into tensor inputs,
    runs the network, and returns numpy arrays.

    Args:
        model: Trained or partially-trained PolicyValueNet.
        device: Torch device for inference.

    Returns:
        Callable (state_dict) -> (action_priors, value).
    """

    def policy_value_fn(state: dict) -> Tuple[np.ndarray, float]:
        """Evaluate state using the neural network."""
        model.eval()
        with torch.no_grad():
            # Prepare tensors from state dict
            ohlcv = torch.FloatTensor(state["ohlcv_window"]).unsqueeze(0).to(device)
            indicators = torch.FloatTensor(state["indicator_window"]).unsqueeze(0).to(device)

            # Forward pass through the full network
            logits, value = model(ohlcv, indicators)

            # Convert logits to probabilities via softmax
            probs = torch.softmax(logits, dim=-1).cpu().numpy().flatten()
            value_scalar = value.cpu().item()

        return probs, value_scalar

    return policy_value_fn


def run_self_play_episode(
    env: TradingEnv,
    model: PolicyValueNet,
    device: torch.device,
    n_simulations: int = 100,
    c_puct: float = 1.5,
    temperature: float = 1.0,
    discount: float = 0.99,
) -> List[SelfPlaySample]:
    """
    Run a single self-play episode, collecting training samples.

    At each step, MCTS produces an improved policy distribution and value
    estimate. After the episode, actual discounted returns are computed
    and paired with the MCTS policies as supervised training targets.

    Args:
        env: Trading environment instance.
        model: PolicyValueNet for MCTS priors and leaf evaluation.
        device: Torch device.
        n_simulations: MCTS simulations per step.
        c_puct: Exploration constant for MCTS UCB.
        temperature: Action selection temperature.
        discount: Discount factor for computing returns.

    Returns:
        List of SelfPlaySample tuples from this episode.
    """
    policy_value_fn = make_policy_value_fn(model, device)

    # Set up MCTS with the current model
    mcts = MCTS(
        policy_value_fn=policy_value_fn,
        env=env,
        n_simulations=n_simulations,
        c_puct=c_puct,
        temperature=temperature,
    )

    # Reset environment
    obs, info = env.reset()
    done = False

    # Collect trajectory: (observation, mcts_policy, reward)
    trajectory = []
    rewards = []

    while not done:
        # Get full state for MCTS
        state = env.get_state()

        # Run MCTS to get improved policy
        action, mcts_policy, _ = mcts.select_action(state)

        # Store pre-action observation and MCTS policy
        trajectory.append({
            "ohlcv": obs["ohlcv"].copy(),
            "indicators": obs["indicators"].copy(),
            "portfolio_state": obs["portfolio_state"].copy(),
            "mcts_policy": mcts_policy.copy(),
        })

        # Execute action in environment
        obs, reward, terminated, truncated, info = env.step(action)
        rewards.append(reward)
        done = terminated or truncated

    # Compute discounted returns from the end of the episode
    returns = _compute_discounted_returns(rewards, discount)

    # Assemble training samples with actual returns as value targets
    samples = []
    for step_data, value_target in zip(trajectory, returns):
        sample = SelfPlaySample(
            ohlcv=step_data["ohlcv"],
            indicators=step_data["indicators"],
            portfolio_state=step_data["portfolio_state"],
            mcts_policy=step_data["mcts_policy"],
            value_target=value_target,
        )
        samples.append(sample)

    logger.info(
        "Self-play episode: %d steps, final value=%.2f, total return=%.4f",
        len(samples),
        info.get("portfolio_value", 0),
        returns[0] if returns else 0,
    )

    return samples


def _compute_discounted_returns(
    rewards: List[float], discount: float
) -> List[float]:
    """
    Compute discounted cumulative returns from a sequence of rewards.

    G_t = r_t + γ*r_{t+1} + γ²*r_{t+2} + ...

    Args:
        rewards: Per-step rewards.
        discount: Discount factor γ.

    Returns:
        List of discounted returns, one per timestep.
    """
    returns = []
    g = 0.0
    for r in reversed(rewards):
        g = r + discount * g
        returns.insert(0, g)
    return returns


def run_self_play_batch(
    env: TradingEnv,
    model: PolicyValueNet,
    device: torch.device,
    n_episodes: int = 100,
    n_simulations: int = 100,
    c_puct: float = 1.5,
    temperature: float = 1.0,
    replay_buffer: Optional[ReplayBuffer] = None,
) -> ReplayBuffer:
    """
    Run multiple self-play episodes and accumulate samples.

    Args:
        env: Trading environment.
        model: Current PolicyValueNet.
        device: Torch device.
        n_episodes: Number of self-play episodes to run.
        n_simulations: MCTS simulations per decision point.
        c_puct: MCTS exploration constant.
        temperature: Action selection temperature.
        replay_buffer: Existing buffer to extend (creates new one if None).

    Returns:
        ReplayBuffer containing all generated samples.
    """
    if replay_buffer is None:
        replay_buffer = ReplayBuffer()

    for ep in range(n_episodes):
        samples = run_self_play_episode(
            env=env,
            model=model,
            device=device,
            n_simulations=n_simulations,
            c_puct=c_puct,
            temperature=temperature,
        )
        replay_buffer.push_batch(samples)

        if (ep + 1) % 10 == 0:
            logger.info(
                "Self-play progress: %d/%d episodes, buffer size=%d",
                ep + 1, n_episodes, len(replay_buffer),
            )

    return replay_buffer
