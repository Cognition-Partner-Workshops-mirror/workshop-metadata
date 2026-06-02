"""
Walk-forward backtesting and evaluation metrics.

Evaluates a trained policy-value network on unseen market data using the
same walk-forward methodology as the data preprocessor. Computes standard
trading performance metrics and generates equity/drawdown visualisations.

Metrics computed:
  - Sharpe ratio (annualised)
  - Sortino ratio (annualised)
  - Maximum drawdown
  - Win rate
  - Profit factor
  - Average trade duration
"""

import logging
from typing import Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")  # non-interactive backend for headless environments
import matplotlib.pyplot as plt
import numpy as np
import torch

from env.trading_env import TradingEnv
from models.policy_value_net import PolicyValueNet

logger = logging.getLogger(__name__)

# Approximate annualisation factor for hourly bars (365 days × 24 hours)
ANNUALIZE_FACTOR_HOURLY = np.sqrt(365 * 24)


def evaluate_model(
    model: PolicyValueNet,
    env: TradingEnv,
    device: torch.device,
    n_episodes: int = 10,
    use_mcts: bool = False,
    mcts_simulations: int = 50,
) -> Dict[str, float]:
    """
    Evaluate a model over multiple episodes and aggregate metrics.

    Args:
        model: Trained PolicyValueNet.
        env: Trading environment (should use validation/test data).
        device: Torch device.
        n_episodes: Number of evaluation episodes.
        use_mcts: Whether to use MCTS for action selection (slower but better).
        mcts_simulations: Number of MCTS simulations if use_mcts=True.

    Returns:
        Dictionary of aggregated performance metrics.
    """
    model.eval()
    all_metrics = []

    for ep in range(n_episodes):
        episode_metrics = _run_evaluation_episode(
            model, env, device, use_mcts, mcts_simulations
        )
        all_metrics.append(episode_metrics)
        logger.info(
            "Eval episode %d/%d: Sharpe=%.4f, return=%.2f%%, max_dd=%.2f%%",
            ep + 1, n_episodes,
            episode_metrics["sharpe_ratio"],
            episode_metrics["total_return_pct"],
            episode_metrics["max_drawdown"] * 100,
        )

    # Aggregate across episodes
    aggregated = {}
    metric_keys = all_metrics[0].keys()
    for key in metric_keys:
        values = [m[key] for m in all_metrics]
        aggregated[f"{key}_mean"] = float(np.mean(values))
        aggregated[f"{key}_std"] = float(np.std(values))

    logger.info("Evaluation summary: %s", {k: f"{v:.4f}" for k, v in aggregated.items() if "_mean" in k})
    return aggregated


def _run_evaluation_episode(
    model: PolicyValueNet,
    env: TradingEnv,
    device: torch.device,
    use_mcts: bool = False,
    mcts_simulations: int = 50,
) -> Dict[str, float]:
    """
    Run a single evaluation episode using greedy (argmax) policy.

    Returns:
        Dict of per-episode trading metrics.
    """
    obs, info = env.reset()
    done = False
    equity_curve = [env.portfolio.initial_cash]

    while not done:
        # Prepare network inputs
        ohlcv = torch.FloatTensor(obs["ohlcv"]).unsqueeze(0).to(device)
        indicators = torch.FloatTensor(obs["indicators"]).unsqueeze(0).to(device)

        # Greedy action selection (no MCTS for speed during evaluation)
        with torch.no_grad():
            logits, _ = model(ohlcv, indicators)
            action = int(torch.argmax(logits, dim=-1).item())

        obs, reward, terminated, truncated, info = env.step(action)
        equity_curve.append(info.get("portfolio_value", equity_curve[-1]))
        done = terminated or truncated

    # Compute comprehensive trading metrics
    return compute_trading_metrics(equity_curve, env.portfolio.trade_history)


def compute_trading_metrics(
    equity_curve: List[float],
    trade_history: list,
) -> Dict[str, float]:
    """
    Compute standard trading performance metrics from an equity curve.

    Args:
        equity_curve: List of portfolio values at each step.
        trade_history: List of TradeRecord objects from the portfolio.

    Returns:
        Dict of named metrics.
    """
    equity = np.array(equity_curve, dtype=np.float64)

    # Per-step returns
    returns = np.diff(equity) / np.maximum(equity[:-1], 1e-8)

    # Total return percentage
    total_return_pct = (equity[-1] / equity[0] - 1) * 100 if equity[0] > 0 else 0.0

    # Sharpe ratio (annualised for hourly data)
    sharpe = _compute_sharpe(returns)

    # Sortino ratio (only penalises downside volatility)
    sortino = _compute_sortino(returns)

    # Maximum drawdown
    max_dd = _compute_max_drawdown(equity)

    # Win rate
    if trade_history:
        wins = sum(1 for t in trade_history if t.pnl > 0)
        win_rate = wins / len(trade_history)

        # Profit factor = gross_profit / gross_loss
        gross_profit = sum(t.pnl for t in trade_history if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in trade_history if t.pnl < 0))
        profit_factor = gross_profit / max(gross_loss, 1e-8)

        # Average trade duration (in steps)
        avg_duration = np.mean([t.exit_step - t.entry_step for t in trade_history])
    else:
        win_rate = 0.0
        profit_factor = 0.0
        avg_duration = 0.0

    return {
        "total_return_pct": float(total_return_pct),
        "sharpe_ratio": float(sharpe),
        "sortino_ratio": float(sortino),
        "max_drawdown": float(max_dd),
        "win_rate": float(win_rate),
        "profit_factor": float(profit_factor),
        "avg_trade_duration": float(avg_duration),
        "n_trades": len(trade_history),
        "final_equity": float(equity[-1]),
    }


def _compute_sharpe(returns: np.ndarray) -> float:
    """Annualised Sharpe ratio from per-step returns."""
    if len(returns) == 0 or np.std(returns) == 0:
        return 0.0
    return float(np.mean(returns) / np.std(returns) * ANNUALIZE_FACTOR_HOURLY)


def _compute_sortino(returns: np.ndarray) -> float:
    """Annualised Sortino ratio — uses only downside deviation."""
    if len(returns) == 0:
        return 0.0
    downside = returns[returns < 0]
    downside_std = np.std(downside) if len(downside) > 0 else 1e-8
    return float(np.mean(returns) / max(downside_std, 1e-8) * ANNUALIZE_FACTOR_HOURLY)


def _compute_max_drawdown(equity: np.ndarray) -> float:
    """Maximum peak-to-trough drawdown as a fraction."""
    if len(equity) == 0:
        return 0.0
    peak = np.maximum.accumulate(equity)
    drawdowns = (peak - equity) / np.maximum(peak, 1e-8)
    return float(np.max(drawdowns))


def plot_evaluation_results(
    equity_curve: List[float],
    trade_history: list,
    save_path: str = "evaluation_results.png",
) -> str:
    """
    Generate and save equity curve + drawdown visualisation.

    Args:
        equity_curve: Portfolio values over time.
        trade_history: List of completed trades.
        save_path: File path for saving the plot.

    Returns:
        Path to the saved figure.
    """
    equity = np.array(equity_curve)
    peak = np.maximum.accumulate(equity)
    drawdown = (peak - equity) / np.maximum(peak, 1e-8) * 100

    fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)

    # Equity curve
    axes[0].plot(equity, linewidth=1.0, color="steelblue")
    axes[0].set_ylabel("Portfolio Value ($)")
    axes[0].set_title("Equity Curve")
    axes[0].grid(True, alpha=0.3)

    # Drawdown
    axes[1].fill_between(range(len(drawdown)), drawdown, alpha=0.4, color="crimson")
    axes[1].set_ylabel("Drawdown (%)")
    axes[1].set_title("Drawdown")
    axes[1].grid(True, alpha=0.3)

    # Trade PnL distribution
    if trade_history:
        pnls = [t.pnl for t in trade_history]
        colors = ["green" if p > 0 else "red" for p in pnls]
        axes[2].bar(range(len(pnls)), pnls, color=colors, alpha=0.7)
        axes[2].set_ylabel("Trade PnL ($)")
        axes[2].set_title("Individual Trade Results")
        axes[2].axhline(y=0, color="black", linewidth=0.5)
        axes[2].grid(True, alpha=0.3)

    axes[-1].set_xlabel("Step")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    logger.info("Evaluation plot saved to: %s", save_path)
    return save_path
