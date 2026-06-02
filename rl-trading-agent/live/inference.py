"""
Real-time inference pipeline for live trading.

On each new candlestick close:
  1. Fetch the latest OHLCV window from the data source
  2. Compute technical indicators
  3. Feed through the Fusion Transformer → state embedding
  4. Run MCTS (reduced simulations for latency) → action
  5. Submit order via broker API
  6. Log decision, confidence, and portfolio state

All decisions are logged with model confidence and MCTS statistics
for post-hoc analysis and debugging.
"""

import logging
import time
from datetime import datetime
from typing import Dict, Optional

import numpy as np
import torch

from data.fetcher import MarketDataFetcher
from data.indicators import compute_indicators
from data.preprocessor import rolling_zscore_normalize
from live.broker_api import BrokerAPI, OrderRequest, OrderSide, OrderType
from live.risk_manager import RiskManager
from models.mcts import MCTS
from models.policy_value_net import PolicyValueNet, decode_action, N_ACTIONS
from training.self_play import make_policy_value_fn

logger = logging.getLogger(__name__)


class LiveInferencePipeline:
    """
    Orchestrates real-time trading decisions.

    Connects the data pipeline, model inference, MCTS search, risk management,
    and broker execution into a single loop that runs on each new bar.
    """

    def __init__(
        self,
        model: PolicyValueNet,
        broker: BrokerAPI,
        risk_manager: RiskManager,
        fetcher: MarketDataFetcher,
        symbol: str = "BTC/USDT",
        timeframe: str = "1h",
        window_size: int = 60,
        n_mcts_simulations: int = 50,
        c_puct: float = 1.5,
        indicator_list: Optional[list] = None,
        device: torch.device = None,
    ):
        """
        Args:
            model: Trained PolicyValueNet.
            broker: Connected broker API instance.
            risk_manager: Risk manager for position sizing and limits.
            fetcher: Market data fetcher.
            symbol: Trading pair/ticker symbol.
            timeframe: Candlestick interval.
            window_size: Lookback window for observations.
            n_mcts_simulations: MCTS simulations per decision (reduced for speed).
            c_puct: MCTS exploration constant.
            indicator_list: Technical indicators to compute.
            device: Torch device for model inference.
        """
        self.model = model
        self.broker = broker
        self.risk_manager = risk_manager
        self.fetcher = fetcher
        self.symbol = symbol
        self.timeframe = timeframe
        self.window_size = window_size
        self.n_mcts_simulations = n_mcts_simulations
        self.c_puct = c_puct
        self.indicator_list = indicator_list
        self.device = device or torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.model.to(self.device)
        self.model.eval()

        # Decision log for post-hoc analysis
        self.decision_log = []

    def run_once(self) -> Dict:
        """
        Execute a single inference cycle: fetch → predict → trade.

        Returns:
            Decision record with action, confidence, and execution details.
        """
        timestamp = datetime.utcnow().isoformat()

        # Step 1: Fetch latest OHLCV data
        df = self.fetcher.fetch(self.symbol, timeframe=self.timeframe)
        if len(df) < self.window_size + 50:
            logger.warning("Insufficient data: %d bars (need %d+)", len(df), self.window_size + 50)
            return {"status": "skipped", "reason": "insufficient_data"}

        # Step 2: Compute indicators
        df = compute_indicators(df, self.indicator_list)
        df = df.dropna()

        # Step 3: Prepare observation
        ohlcv_cols = ["open", "high", "low", "close", "volume"]
        indicator_cols = [c for c in df.columns if c not in ohlcv_cols]

        # Rolling z-score normalisation (non-stationary aware)
        df_norm = rolling_zscore_normalize(df, window=self.window_size)
        df_norm = df_norm.dropna()

        if len(df_norm) < self.window_size:
            logger.warning("Not enough normalised data after preprocessing")
            return {"status": "skipped", "reason": "preprocessing_insufficient"}

        # Extract the most recent window
        ohlcv_window = df_norm[ohlcv_cols].iloc[-self.window_size:].values.astype(np.float32)
        indicator_window = df_norm[indicator_cols].iloc[-self.window_size:].values.astype(np.float32)

        # Step 4: Model inference with MCTS
        state = {
            "ohlcv_window": ohlcv_window,
            "indicator_window": indicator_window,
            "portfolio": {},
            "step_idx": 0,
        }

        policy_value_fn = make_policy_value_fn(self.model, self.device)
        action_probs, value_estimate = policy_value_fn(state)

        # Use MCTS for refined action selection
        mcts = MCTS(
            policy_value_fn=policy_value_fn,
            env=None,  # not needed for leaf evaluation only
            n_simulations=self.n_mcts_simulations,
            c_puct=self.c_puct,
            temperature=0.1,  # near-greedy for live trading
        )
        mcts_probs, root_value = mcts.search(state)

        # Select best action from MCTS-improved policy
        action_idx = int(np.argmax(mcts_probs))
        direction_str, position_size = decode_action(action_idx)
        confidence = float(mcts_probs[action_idx])

        logger.info(
            "Decision: %s (size=%.2f), confidence=%.3f, value=%.4f",
            direction_str, position_size, confidence, root_value,
        )

        # Step 5: Risk check and order execution
        current_price = self.broker.get_current_price(self.symbol)
        account = self.broker.get_account()

        # Check risk limits before executing
        risk_check = self.risk_manager.check_trade(
            direction=direction_str,
            size_fraction=position_size,
            current_price=current_price,
            account=account,
        )

        execution_result = None
        if risk_check["approved"]:
            execution_result = self._execute_trade(
                direction_str, position_size, current_price, account
            )
        else:
            logger.warning(
                "Trade REJECTED by risk manager: %s", risk_check.get("reason", "unknown")
            )

        # Step 6: Log the decision
        decision = {
            "timestamp": timestamp,
            "symbol": self.symbol,
            "action": direction_str,
            "position_size": position_size,
            "confidence": confidence,
            "value_estimate": float(root_value),
            "mcts_probs": mcts_probs.tolist(),
            "network_probs": action_probs.tolist(),
            "current_price": current_price,
            "risk_check": risk_check,
            "execution": execution_result,
            "portfolio_value": account.portfolio_value,
        }
        self.decision_log.append(decision)

        return decision

    def _execute_trade(
        self,
        direction: str,
        size_fraction: float,
        price: float,
        account,
    ) -> Optional[Dict]:
        """
        Submit an order to the broker based on the model's decision.

        Args:
            direction: Trade direction string.
            size_fraction: Fraction of portfolio to allocate.
            price: Current market price.
            account: Current account info.

        Returns:
            Execution result dict, or None if no trade needed.
        """
        if direction == "hold":
            return {"status": "hold", "message": "No trade executed"}

        # Calculate quantity based on portfolio value and position size
        trade_value = account.portfolio_value * size_fraction
        quantity = trade_value / price if price > 0 else 0

        if quantity <= 0:
            return {"status": "skipped", "message": "Zero quantity"}

        # Determine order side
        if direction in ("buy", "strong_buy"):
            side = OrderSide.BUY
        elif direction in ("sell", "strong_sell"):
            side = OrderSide.SELL
        else:
            return {"status": "skipped", "message": f"Unknown direction: {direction}"}

        # Submit market order
        order = OrderRequest(
            symbol=self.symbol,
            side=side,
            quantity=quantity,
            order_type=OrderType.MARKET,
        )

        try:
            result = self.broker.submit_order(order)
            logger.info(
                "Order executed: %s %s %.4f @ %.2f (status=%s)",
                result.side.value, result.symbol, result.quantity,
                result.filled_price, result.status,
            )
            return {
                "order_id": result.order_id,
                "filled_price": result.filled_price,
                "quantity": result.quantity,
                "status": result.status,
            }
        except Exception as e:
            logger.error("Order execution failed: %s", e)
            return {"status": "error", "message": str(e)}

    def run_loop(self, interval_seconds: int = 3600) -> None:
        """
        Run the inference pipeline in a continuous loop.

        Waits for each candlestick close before making a decision.
        Designed to be run as a long-lived process for live trading.

        Args:
            interval_seconds: Seconds between inference cycles (matches timeframe).
        """
        logger.info(
            "Starting live trading loop: symbol=%s, interval=%ds",
            self.symbol, interval_seconds,
        )
        while True:
            try:
                decision = self.run_once()
                logger.info("Cycle complete: %s", decision.get("action", "unknown"))
            except Exception as e:
                logger.error("Inference cycle failed: %s", e, exc_info=True)

            # Wait for next candlestick close
            time.sleep(interval_seconds)
