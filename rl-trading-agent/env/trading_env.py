"""
Gym-compatible trading environment.

Wraps the portfolio and reward modules into an OpenAI Gymnasium interface
so that standard RL training loops (self-play, PPO, etc.) can interact
with historical market data through a consistent API.

Episode flow:
  1. reset() → pick a random start in training data, init portfolio
  2. step(action) → execute trade, advance one bar, return (obs, reward, done, info)
  3. Episode terminates after N steps or if drawdown exceeds threshold
"""

import logging
from typing import Any, Dict, Optional, Tuple

import gymnasium as gym
import numpy as np
from gymnasium import spaces

from env.portfolio import Portfolio
from env.reward import create_reward_function
from models.policy_value_net import TRADE_DIRECTIONS, POSITION_SIZES, N_ACTIONS, decode_action

logger = logging.getLogger(__name__)


class TradingEnv(gym.Env):
    """
    Gymnasium-compatible trading environment operating on pre-processed
    OHLCV + indicator sliding windows.

    Observation space: dict with 'ohlcv' and 'indicators' arrays.
    Action space: Discrete(20) — 5 directions × 4 position sizes.
    """

    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        ohlcv_data: np.ndarray,
        indicator_data: np.ndarray,
        price_data: np.ndarray,
        initial_cash: float = 100_000.0,
        transaction_cost: float = 0.001,
        max_steps: int = 500,
        max_drawdown: float = 0.20,
        reward_type: str = "differential_sharpe",
        window_size: int = 60,
    ):
        """
        Args:
            ohlcv_data: Full OHLCV array of shape (n_bars, 5).
            indicator_data: Full indicator array of shape (n_bars, n_indicators).
            price_data: Close prices for trade execution, shape (n_bars,).
            initial_cash: Starting portfolio cash.
            transaction_cost: Cost per trade as fraction of trade value.
            max_steps: Maximum bars per episode before forced termination.
            max_drawdown: Drawdown threshold (fraction) for early stopping.
            reward_type: Reward function type ('differential_sharpe', 'log_return', 'risk_adjusted').
            window_size: Lookback window for observations.
        """
        super().__init__()

        self.ohlcv_data = ohlcv_data
        self.indicator_data = indicator_data
        self.price_data = price_data
        self.initial_cash = initial_cash
        self.transaction_cost = transaction_cost
        self.max_steps = max_steps
        self.max_drawdown_threshold = max_drawdown
        self.reward_type = reward_type
        self.window_size = window_size

        # Determine feature dimensions from data
        self.n_indicators = indicator_data.shape[1] if indicator_data.ndim > 1 else 1

        # Action space: 20 discrete actions (5 directions × 4 sizes)
        self.action_space = spaces.Discrete(N_ACTIONS)

        # Observation space: windowed OHLCV + indicators
        self.observation_space = spaces.Dict({
            "ohlcv": spaces.Box(
                low=-np.inf, high=np.inf,
                shape=(window_size, 5), dtype=np.float32,
            ),
            "indicators": spaces.Box(
                low=-np.inf, high=np.inf,
                shape=(window_size, self.n_indicators), dtype=np.float32,
            ),
            "portfolio_state": spaces.Box(
                low=-np.inf, high=np.inf,
                shape=(4,), dtype=np.float32,  # [cash_ratio, position_dir, position_size_ratio, unrealized_pnl_ratio]
            ),
        })

        # Internal state — initialised by reset()
        self.portfolio: Optional[Portfolio] = None
        self.reward_fn = None
        self.current_step = 0
        self.start_idx = 0
        self.episode_steps = 0

    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[Dict] = None,
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, Any]]:
        """
        Reset the environment for a new episode.

        Picks a random start index in the training data (ensuring enough
        room for window_size lookback + max_steps forward).

        Returns:
            Tuple of (observation, info_dict).
        """
        super().reset(seed=seed)

        # Initialise portfolio and reward function
        self.portfolio = Portfolio(
            initial_cash=self.initial_cash,
            transaction_cost_pct=self.transaction_cost,
        )
        self.reward_fn = create_reward_function(self.reward_type)

        # Pick random starting point with enough room for a full episode
        max_start = len(self.price_data) - self.window_size - self.max_steps
        max_start = max(max_start, self.window_size)
        self.start_idx = self.np_random.integers(self.window_size, max_start)
        self.current_step = self.start_idx
        self.episode_steps = 0

        obs = self._get_observation()
        info = {"portfolio": self.portfolio.summary(), "step": self.episode_steps}
        return obs, info

    def step(
        self, action: int
    ) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict[str, Any]]:
        """
        Execute one trading step.

        Args:
            action: Integer action in [0, N_ACTIONS).

        Returns:
            Tuple of (observation, reward, terminated, truncated, info).
        """
        # Decode flat action into direction and position size
        direction_str, size = decode_action(action)
        direction_map = {
            "strong_sell": -1, "sell": -1, "hold": 0, "buy": 1, "strong_buy": 1
        }
        direction = direction_map[direction_str]

        # Get current close price for trade execution
        current_price = float(self.price_data[self.current_step])
        prev_value = self.portfolio.total_value(current_price)

        # Execute the trade
        self.portfolio.execute_trade(direction, size, current_price, self.episode_steps)

        # Advance to next bar
        self.current_step += 1
        self.episode_steps += 1
        next_price = float(self.price_data[self.current_step])
        new_value = self.portfolio.total_value(next_price)

        # Compute reward based on configured reward function
        portfolio_return = (new_value - prev_value) / max(prev_value, 1e-8)
        if self.reward_type == "differential_sharpe":
            reward = self.reward_fn.calculate(portfolio_return)
        elif self.reward_type == "log_return":
            reward = self.reward_fn.calculate(new_value, prev_value)
        elif self.reward_type == "risk_adjusted":
            drawdown = self.portfolio.current_drawdown(next_price)
            reward = self.reward_fn.calculate(portfolio_return, drawdown)
        else:
            reward = portfolio_return

        # Check termination conditions
        terminated = False
        truncated = False

        # Drawdown exceeds threshold → terminate
        if self.portfolio.current_drawdown(next_price) > self.max_drawdown_threshold:
            terminated = True
            logger.info(
                "Episode terminated: drawdown %.2f%% exceeds threshold",
                self.portfolio.current_drawdown(next_price) * 100,
            )

        # Max steps reached → truncate
        if self.episode_steps >= self.max_steps:
            truncated = True

        # Ran out of data → truncate
        if self.current_step >= len(self.price_data) - 1:
            truncated = True

        obs = self._get_observation()
        info = {
            "portfolio": self.portfolio.summary(),
            "step": self.episode_steps,
            "action_taken": direction_str,
            "position_size": size,
            "price": next_price,
            "portfolio_value": new_value,
        }

        return obs, float(reward), terminated, truncated, info

    def _get_observation(self) -> Dict[str, np.ndarray]:
        """
        Build the current observation: windowed OHLCV + indicators + portfolio state.

        Returns:
            Dict with 'ohlcv', 'indicators', and 'portfolio_state' arrays.
        """
        start = max(self.current_step - self.window_size, 0)
        end = self.current_step

        ohlcv_window = self.ohlcv_data[start:end].astype(np.float32)
        indicator_window = self.indicator_data[start:end].astype(np.float32)

        # Pad if window is shorter than expected (at the start of data)
        if len(ohlcv_window) < self.window_size:
            pad_len = self.window_size - len(ohlcv_window)
            ohlcv_window = np.pad(ohlcv_window, ((pad_len, 0), (0, 0)), mode="edge")
            indicator_window = np.pad(indicator_window, ((pad_len, 0), (0, 0)), mode="edge")

        # Portfolio state vector (normalised ratios for network input)
        current_price = float(self.price_data[self.current_step])
        total_val = self.portfolio.total_value(current_price)
        cash_ratio = self.portfolio.cash / max(total_val, 1e-8)
        pos_dir = 0.0
        pos_size_ratio = 0.0
        unrealized_ratio = 0.0
        if self.portfolio.position is not None:
            pos_dir = float(self.portfolio.position.direction)
            pos_size_ratio = self.portfolio.position.market_value(current_price) / max(total_val, 1e-8)
            unrealized_ratio = self.portfolio.position.unrealized_pnl(current_price) / max(total_val, 1e-8)

        portfolio_state = np.array(
            [cash_ratio, pos_dir, pos_size_ratio, unrealized_ratio],
            dtype=np.float32,
        )

        return {
            "ohlcv": ohlcv_window,
            "indicators": indicator_window,
            "portfolio_state": portfolio_state,
        }

    def get_state(self) -> dict:
        """
        Return full state dictionary for MCTS simulation.

        Provides everything the policy-value network and MCTS need to
        evaluate and expand nodes.
        """
        obs = self._get_observation()
        return {
            "ohlcv_window": obs["ohlcv"],
            "indicator_window": obs["indicators"],
            "portfolio": self.portfolio.copy() if self.portfolio else None,
            "step_idx": self.current_step,
            "portfolio_state": obs["portfolio_state"],
        }
