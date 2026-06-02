"""
Portfolio state tracking module.

Tracks cash, open positions, unrealized PnL, and historical performance
metrics. Designed as a pure-state object that the trading environment
mutates on each step.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Position:
    """Represents a single open position in an asset."""

    # Direction: +1 for long, -1 for short
    direction: int
    # Number of units held
    size: float
    # Average entry price
    entry_price: float
    # Timestamp or step index when the position was opened
    entry_step: int

    @property
    def is_long(self) -> bool:
        return self.direction == 1

    @property
    def is_short(self) -> bool:
        return self.direction == -1

    def unrealized_pnl(self, current_price: float) -> float:
        """Calculate unrealized profit/loss at the given market price."""
        return self.direction * self.size * (current_price - self.entry_price)

    def market_value(self, current_price: float) -> float:
        """Current market value of this position."""
        return self.size * current_price


@dataclass
class TradeRecord:
    """Immutable record of a completed trade for logging and analysis."""

    direction: int
    size: float
    entry_price: float
    exit_price: float
    entry_step: int
    exit_step: int
    pnl: float
    transaction_cost: float


class Portfolio:
    """
    Manages portfolio state: cash balance, positions, and trade history.

    Enforces transaction costs and provides portfolio-level metrics
    (total value, drawdown, etc.) that the reward function needs.
    """

    def __init__(
        self,
        initial_cash: float = 100_000.0,
        transaction_cost_pct: float = 0.001,
    ):
        """
        Args:
            initial_cash: Starting cash balance.
            transaction_cost_pct: Cost per trade as a fraction of trade value (e.g., 0.001 = 0.1%).
        """
        self.initial_cash = initial_cash
        self.transaction_cost_pct = transaction_cost_pct

        # Current state
        self.cash = initial_cash
        self.position: Optional[Position] = None

        # Performance tracking
        self.trade_history: List[TradeRecord] = []
        self.equity_curve: List[float] = [initial_cash]
        self.peak_equity = initial_cash
        self.total_transaction_costs = 0.0
        self.current_step = 0

    def total_value(self, current_price: float) -> float:
        """Total portfolio value = cash + unrealized position value."""
        value = self.cash
        if self.position is not None:
            value += self.position.unrealized_pnl(current_price)
        return value

    def max_drawdown(self) -> float:
        """Maximum peak-to-trough drawdown as a fraction (0 to 1)."""
        if self.peak_equity == 0:
            return 0.0
        equity = self.equity_curve[-1] if self.equity_curve else self.initial_cash
        drawdown = (self.peak_equity - equity) / self.peak_equity
        return max(drawdown, 0.0)

    def current_drawdown(self, current_price: float) -> float:
        """Current drawdown relative to peak equity."""
        current_equity = self.total_value(current_price)
        if self.peak_equity == 0:
            return 0.0
        return max((self.peak_equity - current_equity) / self.peak_equity, 0.0)

    def execute_trade(
        self,
        direction: int,
        size_fraction: float,
        current_price: float,
        step: int,
    ) -> float:
        """
        Execute a trade: open, close, or modify position.

        Args:
            direction: +1 for buy/long, -1 for sell/short, 0 for hold.
            size_fraction: Fraction of portfolio to allocate (0.1, 0.25, 0.5, 1.0).
            current_price: Current market price.
            step: Current environment step index.

        Returns:
            Realized PnL from closing any existing position (0 if opening/holding).
        """
        self.current_step = step
        realized_pnl = 0.0

        if direction == 0:
            # Hold — no action, just update equity tracking
            self._update_equity(current_price)
            return 0.0

        # Close existing position if direction is opposite or we're changing
        if self.position is not None:
            if self.position.direction != direction:
                realized_pnl = self._close_position(current_price, step)

        # Open new position if we don't have one in this direction
        if self.position is None and direction != 0:
            self._open_position(direction, size_fraction, current_price, step)

        self._update_equity(current_price)
        return realized_pnl

    def _open_position(
        self, direction: int, size_fraction: float, price: float, step: int
    ) -> None:
        """Open a new position using the specified fraction of available cash."""
        trade_value = self.cash * size_fraction
        # Deduct transaction cost from the trade
        cost = trade_value * self.transaction_cost_pct
        self.total_transaction_costs += cost
        self.cash -= cost

        # Calculate position size in units
        n_units = (trade_value - cost) / price if price > 0 else 0
        self.position = Position(
            direction=direction,
            size=n_units,
            entry_price=price,
            entry_step=step,
        )
        self.cash -= n_units * price * (1 if direction == 1 else 0)
        logger.debug(
            "Opened %s position: %.4f units @ %.2f",
            "LONG" if direction == 1 else "SHORT",
            n_units,
            price,
        )

    def _close_position(self, price: float, step: int) -> float:
        """Close the current position and record the trade."""
        if self.position is None:
            return 0.0

        pnl = self.position.unrealized_pnl(price)
        close_value = self.position.size * price
        cost = close_value * self.transaction_cost_pct
        self.total_transaction_costs += cost

        # Return capital + PnL - cost back to cash
        self.cash += close_value + pnl - cost

        # Record the completed trade
        record = TradeRecord(
            direction=self.position.direction,
            size=self.position.size,
            entry_price=self.position.entry_price,
            exit_price=price,
            entry_step=self.position.entry_step,
            exit_step=step,
            pnl=pnl - cost,
            transaction_cost=cost,
        )
        self.trade_history.append(record)
        logger.debug("Closed position: PnL=%.2f, cost=%.2f", pnl, cost)

        self.position = None
        return pnl - cost

    def _update_equity(self, current_price: float) -> None:
        """Update equity curve and peak tracking."""
        equity = self.total_value(current_price)
        self.equity_curve.append(equity)
        self.peak_equity = max(self.peak_equity, equity)

    def reset(self) -> None:
        """Reset portfolio to initial state for a new episode."""
        self.cash = self.initial_cash
        self.position = None
        self.trade_history = []
        self.equity_curve = [self.initial_cash]
        self.peak_equity = self.initial_cash
        self.total_transaction_costs = 0.0
        self.current_step = 0

    def copy(self) -> "Portfolio":
        """Create a deep copy of the portfolio for MCTS simulation."""
        new_portfolio = Portfolio(
            initial_cash=self.initial_cash,
            transaction_cost_pct=self.transaction_cost_pct,
        )
        new_portfolio.cash = self.cash
        if self.position is not None:
            new_portfolio.position = Position(
                direction=self.position.direction,
                size=self.position.size,
                entry_price=self.position.entry_price,
                entry_step=self.position.entry_step,
            )
        new_portfolio.equity_curve = list(self.equity_curve)
        new_portfolio.peak_equity = self.peak_equity
        new_portfolio.total_transaction_costs = self.total_transaction_costs
        new_portfolio.current_step = self.current_step
        return new_portfolio

    def summary(self) -> dict:
        """Return a summary dictionary of portfolio performance metrics."""
        returns = np.diff(self.equity_curve) / np.array(self.equity_curve[:-1]) if len(self.equity_curve) > 1 else np.array([])
        winning_trades = [t for t in self.trade_history if t.pnl > 0]
        return {
            "total_value": self.equity_curve[-1] if self.equity_curve else self.initial_cash,
            "total_return_pct": (self.equity_curve[-1] / self.initial_cash - 1) * 100 if self.equity_curve else 0,
            "n_trades": len(self.trade_history),
            "win_rate": len(winning_trades) / max(len(self.trade_history), 1),
            "max_drawdown": self.max_drawdown(),
            "total_costs": self.total_transaction_costs,
            "avg_return": float(np.mean(returns)) if len(returns) > 0 else 0.0,
            "std_return": float(np.std(returns)) if len(returns) > 0 else 0.0,
        }
