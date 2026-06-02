"""
Risk management module for live trading.

Enforces position sizing limits, drawdown stops, exposure caps, and
volatility-based adjustments to protect capital during live operation.

Risk rules:
  - Max position size as % of portfolio
  - Max daily loss threshold → halt trading
  - Max portfolio drawdown → halt trading
  - Volatility scaling → reduce size in high-vol regimes
  - Max concurrent correlated positions (future extension)
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import numpy as np

from live.broker_api import AccountInfo

logger = logging.getLogger(__name__)


class RiskManager:
    """
    Pre-trade risk checker that gates all order submissions.

    The inference pipeline must call check_trade() before every order.
    If the check fails, the trade is rejected and the reason is logged.
    """

    def __init__(
        self,
        max_position_pct: float = 0.25,
        max_daily_drawdown: float = 0.05,
        max_portfolio_drawdown: float = 0.20,
        volatility_lookback: int = 20,
        volatility_scale_factor: float = 1.0,
        max_trades_per_day: int = 50,
    ):
        """
        Args:
            max_position_pct: Maximum single position as fraction of portfolio.
            max_daily_drawdown: Daily loss threshold to halt trading.
            max_portfolio_drawdown: Total drawdown threshold to halt trading.
            volatility_lookback: Number of bars for rolling volatility computation.
            volatility_scale_factor: Baseline volatility for scaling; positions are
                                    reduced when current vol exceeds this.
            max_trades_per_day: Maximum number of trades allowed per calendar day.
        """
        self.max_position_pct = max_position_pct
        self.max_daily_drawdown = max_daily_drawdown
        self.max_portfolio_drawdown = max_portfolio_drawdown
        self.volatility_lookback = volatility_lookback
        self.volatility_scale_factor = volatility_scale_factor
        self.max_trades_per_day = max_trades_per_day

        # Intra-session tracking
        self.daily_start_value: Optional[float] = None
        self.daily_start_date: Optional[datetime] = None
        self.peak_portfolio_value: float = 0.0
        self.trades_today: int = 0
        self.is_halted: bool = False
        self.halt_reason: str = ""

        # Recent price history for volatility calculation
        self.recent_prices: List[float] = []

    def check_trade(
        self,
        direction: str,
        size_fraction: float,
        current_price: float,
        account: AccountInfo,
    ) -> Dict:
        """
        Evaluate whether a proposed trade passes all risk checks.

        Args:
            direction: Trade direction ('buy', 'sell', 'hold', etc.).
            size_fraction: Requested position size as fraction of portfolio.
            current_price: Current market price.
            account: Current broker account state.

        Returns:
            Dict with 'approved' (bool), 'adjusted_size' (float),
            and 'reason' (str) if rejected.
        """
        # Update daily tracking
        self._update_daily_tracking(account.portfolio_value)
        self._update_price_history(current_price)

        # Hold actions always pass
        if direction == "hold":
            return {"approved": True, "adjusted_size": 0.0, "reason": "hold"}

        # Check if trading is halted
        if self.is_halted:
            return {
                "approved": False,
                "adjusted_size": 0.0,
                "reason": f"Trading halted: {self.halt_reason}",
            }

        # Check daily trade count limit
        if self.trades_today >= self.max_trades_per_day:
            return {
                "approved": False,
                "adjusted_size": 0.0,
                "reason": f"Daily trade limit reached ({self.max_trades_per_day})",
            }

        # Check daily drawdown
        daily_dd = self._daily_drawdown(account.portfolio_value)
        if daily_dd > self.max_daily_drawdown:
            self.is_halted = True
            self.halt_reason = f"Daily drawdown {daily_dd:.2%} exceeds {self.max_daily_drawdown:.2%}"
            logger.warning("HALTED: %s", self.halt_reason)
            return {
                "approved": False,
                "adjusted_size": 0.0,
                "reason": self.halt_reason,
            }

        # Check total portfolio drawdown
        portfolio_dd = self._portfolio_drawdown(account.portfolio_value)
        if portfolio_dd > self.max_portfolio_drawdown:
            self.is_halted = True
            self.halt_reason = f"Portfolio drawdown {portfolio_dd:.2%} exceeds {self.max_portfolio_drawdown:.2%}"
            logger.warning("HALTED: %s", self.halt_reason)
            return {
                "approved": False,
                "adjusted_size": 0.0,
                "reason": self.halt_reason,
            }

        # Cap position size at maximum allowed
        adjusted_size = min(size_fraction, self.max_position_pct)

        # Apply volatility scaling — reduce size in high-vol regimes
        vol_scalar = self._volatility_scalar()
        adjusted_size *= vol_scalar

        # Ensure minimum meaningful position size
        if adjusted_size < 0.01:
            return {
                "approved": False,
                "adjusted_size": 0.0,
                "reason": "Adjusted size too small after volatility scaling",
            }

        self.trades_today += 1
        logger.info(
            "Trade approved: %s, requested=%.2f, adjusted=%.2f (vol_scalar=%.2f)",
            direction, size_fraction, adjusted_size, vol_scalar,
        )

        return {
            "approved": True,
            "adjusted_size": adjusted_size,
            "reason": "approved",
        }

    def _update_daily_tracking(self, portfolio_value: float) -> None:
        """Reset daily counters at the start of each new trading day."""
        now = datetime.utcnow()
        if self.daily_start_date is None or now.date() > self.daily_start_date.date():
            self.daily_start_value = portfolio_value
            self.daily_start_date = now
            self.trades_today = 0
            self.is_halted = False
            self.halt_reason = ""
            logger.info("New trading day: start_value=%.2f", portfolio_value)

        # Update peak for total drawdown tracking
        self.peak_portfolio_value = max(self.peak_portfolio_value, portfolio_value)

    def _daily_drawdown(self, current_value: float) -> float:
        """Current intra-day drawdown as a fraction."""
        if self.daily_start_value is None or self.daily_start_value == 0:
            return 0.0
        return max((self.daily_start_value - current_value) / self.daily_start_value, 0.0)

    def _portfolio_drawdown(self, current_value: float) -> float:
        """Total peak-to-trough drawdown as a fraction."""
        if self.peak_portfolio_value == 0:
            return 0.0
        return max((self.peak_portfolio_value - current_value) / self.peak_portfolio_value, 0.0)

    def _update_price_history(self, price: float) -> None:
        """Append price and trim to lookback window."""
        self.recent_prices.append(price)
        if len(self.recent_prices) > self.volatility_lookback * 2:
            self.recent_prices = self.recent_prices[-self.volatility_lookback * 2 :]

    def _volatility_scalar(self) -> float:
        """
        Compute volatility-based position scaling factor.

        Returns a value in (0, 1]: 1.0 when volatility is at or below baseline,
        decreasing as volatility rises. This automatically reduces position sizes
        in high-volatility market regimes.
        """
        if len(self.recent_prices) < self.volatility_lookback:
            return 1.0  # not enough data yet, use full size

        prices = np.array(self.recent_prices[-self.volatility_lookback:])
        returns = np.diff(prices) / prices[:-1]
        current_vol = float(np.std(returns))

        if current_vol <= 0 or self.volatility_scale_factor <= 0:
            return 1.0

        # Scale inversely with volatility
        scalar = self.volatility_scale_factor / max(current_vol, self.volatility_scale_factor)
        return float(np.clip(scalar, 0.1, 1.0))

    def reset_daily(self) -> None:
        """Manually reset daily tracking state (for testing)."""
        self.daily_start_value = None
        self.daily_start_date = None
        self.trades_today = 0
        self.is_halted = False
        self.halt_reason = ""

    def summary(self) -> Dict:
        """Return current risk manager state for logging."""
        return {
            "is_halted": self.is_halted,
            "halt_reason": self.halt_reason,
            "trades_today": self.trades_today,
            "daily_start_value": self.daily_start_value,
            "peak_portfolio_value": self.peak_portfolio_value,
            "recent_volatility": self._volatility_scalar(),
        }
