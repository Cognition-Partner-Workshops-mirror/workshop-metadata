"""
Reward functions for the trading environment.

Implements multiple reward formulations for RL training:
  - Differential Sharpe ratio (Moody & Saffell, 1998) — default, most stable
  - Log return — simple log(V_t / V_{t-1})
  - Risk-adjusted return — return / max_drawdown

The differential Sharpe ratio is preferred because it provides a smoother
training signal that directly optimizes the Sharpe ratio incrementally.
"""

import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class DifferentialSharpeReward:
    """
    Incremental Sharpe ratio update (Moody & Saffell, 1998).

    Maintains exponential moving averages of return (A) and squared return (B),
    then computes the marginal contribution of each new return to the
    running Sharpe ratio. This avoids the need to compute Sharpe over the
    full episode, giving dense per-step reward.
    """

    def __init__(self, eta: float = 0.01):
        """
        Args:
            eta: Adaptation rate for the exponential moving averages.
                 Smaller values = longer memory, smoother updates.
        """
        self.eta = eta
        # Running first moment of returns (mean proxy)
        self.A = 0.0
        # Running second moment of returns (variance proxy)
        self.B = 0.0

    def calculate(self, portfolio_return: float) -> float:
        """
        Compute the differential Sharpe ratio for a single-step return.

        Args:
            portfolio_return: R_t = (V_t - V_{t-1}) / V_{t-1}

        Returns:
            Scalar reward approximating the marginal Sharpe improvement.
        """
        delta_A = portfolio_return - self.A
        delta_B = portfolio_return ** 2 - self.B

        # Denominator: variance of returns (B - A^2)
        denominator = (self.B - self.A ** 2)
        if denominator <= 0:
            denominator = 1e-8  # prevent division by zero in early steps

        # Differential Sharpe: dS/dR_t ≈ (B*delta_A - 0.5*A*delta_B) / (B - A^2)^(3/2)
        numerator = self.B * delta_A - 0.5 * self.A * delta_B
        denom_sqrt = abs(denominator) ** 1.5
        reward = numerator / max(denom_sqrt, 1e-8)

        # Update running moments
        self.A += self.eta * delta_A
        self.B += self.eta * delta_B

        return float(reward)

    def reset(self) -> None:
        """Reset running statistics for a new episode."""
        self.A = 0.0
        self.B = 0.0


class LogReturnReward:
    """
    Simple log-return reward: R_t = log(V_t / V_{t-1}).

    Advantages: additive across time, symmetric for gains/losses.
    Disadvantage: ignores risk, so the agent may learn volatile strategies.
    """

    def calculate(
        self, current_value: float, previous_value: float
    ) -> float:
        """
        Compute log return between two portfolio values.

        Args:
            current_value: Portfolio value at step t.
            previous_value: Portfolio value at step t-1.

        Returns:
            Log return scalar.
        """
        if previous_value <= 0:
            return 0.0
        ratio = current_value / previous_value
        # Clamp to avoid log(0) or log(negative)
        ratio = max(ratio, 1e-8)
        return float(np.log(ratio))

    def reset(self) -> None:
        """No state to reset for log return."""
        pass


class RiskAdjustedReward:
    """
    Risk-adjusted reward: return penalised by drawdown.

    reward = portfolio_return - lambda * current_drawdown

    This encourages the agent to avoid large drawdowns while still
    pursuing positive returns.
    """

    def __init__(self, risk_penalty: float = 2.0):
        """
        Args:
            risk_penalty: Multiplier for the drawdown penalty. Higher values
                         make the agent more risk-averse.
        """
        self.risk_penalty = risk_penalty

    def calculate(
        self,
        portfolio_return: float,
        current_drawdown: float,
    ) -> float:
        """
        Compute risk-adjusted reward.

        Args:
            portfolio_return: Single-step return.
            current_drawdown: Current drawdown as a fraction (0 to 1).

        Returns:
            Risk-adjusted reward scalar.
        """
        reward = portfolio_return - self.risk_penalty * current_drawdown
        return float(reward)

    def reset(self) -> None:
        """No state to reset."""
        pass


def create_reward_function(
    reward_type: str = "differential_sharpe",
    **kwargs,
):
    """
    Factory function to create reward calculators by name.

    Args:
        reward_type: One of 'differential_sharpe', 'log_return', 'risk_adjusted'.
        **kwargs: Extra arguments forwarded to the reward constructor.

    Returns:
        Reward calculator instance.
    """
    reward_map = {
        "differential_sharpe": DifferentialSharpeReward,
        "log_return": LogReturnReward,
        "risk_adjusted": RiskAdjustedReward,
    }

    if reward_type not in reward_map:
        raise ValueError(
            f"Unknown reward type '{reward_type}'. "
            f"Choose from: {list(reward_map.keys())}"
        )

    return reward_map[reward_type](**kwargs)
