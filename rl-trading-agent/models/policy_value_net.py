"""
Dual-Head Policy-Value Network.

Combines the CandlestickEncoder, IndicatorEncoder, and FusionTransformer
into a single end-to-end model with two output heads:

  - Policy head: outputs a probability distribution over 20 discrete actions
    (5 trade directions × 4 position sizes).
  - Value head: outputs a scalar estimate of expected future return.

Both heads share the Fusion Transformer backbone, following the AlphaZero
architecture pattern where a shared representation feeds both action
selection and state evaluation.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

from models.candlestick_encoder import CandlestickEncoder
from models.indicator_encoder import IndicatorEncoder
from models.fusion_transformer import FusionTransformer


# Trade direction labels × position size labels = 5 × 4 = 20 discrete actions
TRADE_DIRECTIONS = ["strong_sell", "sell", "hold", "buy", "strong_buy"]
POSITION_SIZES = [0.1, 0.25, 0.5, 1.0]
N_ACTIONS = len(TRADE_DIRECTIONS) * len(POSITION_SIZES)


def decode_action(action_idx: int) -> tuple:
    """
    Convert a flat action index into (direction, position_size).

    Args:
        action_idx: Integer in [0, N_ACTIONS).

    Returns:
        Tuple of (direction_str, position_size_float).
    """
    direction_idx = action_idx // len(POSITION_SIZES)
    size_idx = action_idx % len(POSITION_SIZES)
    return TRADE_DIRECTIONS[direction_idx], POSITION_SIZES[size_idx]


def encode_action(direction: str, size: float) -> int:
    """
    Convert (direction, position_size) into a flat action index.

    Args:
        direction: One of TRADE_DIRECTIONS.
        size: One of POSITION_SIZES.

    Returns:
        Integer action index.
    """
    d_idx = TRADE_DIRECTIONS.index(direction)
    s_idx = POSITION_SIZES.index(size)
    return d_idx * len(POSITION_SIZES) + s_idx


class PolicyValueNet(nn.Module):
    """
    Full AlphaZero-style network: shared backbone → dual heads.

    Architecture:
        OHLCV seq  → CandlestickEncoder → ┐
                                           ├→ FusionTransformer → fused_state
        Indicator seq → IndicatorEncoder → ┘       │
                                                    ├→ PolicyHead → action probabilities
                                                    └→ ValueHead  → scalar value
    """

    def __init__(
        self,
        n_indicators: int = 15,
        d_model: int = 128,
        n_heads: int = 8,
        n_encoder_layers: int = 4,
        n_fusion_layers: int = 2,
        dropout: float = 0.1,
        n_actions: int = N_ACTIONS,
    ):
        """
        Args:
            n_indicators: Number of technical indicator features per timestep.
            d_model: Embedding dimension for both Transformer encoders.
            n_heads: Number of attention heads.
            n_encoder_layers: Depth of each Transformer encoder.
            n_fusion_layers: Number of cross-attention fusion layers.
            dropout: Dropout rate.
            n_actions: Size of the discrete action space.
        """
        super().__init__()

        # Shared backbone components
        self.candlestick_encoder = CandlestickEncoder(
            d_model=d_model,
            n_heads=n_heads,
            n_layers=n_encoder_layers,
            dropout=dropout,
        )
        self.indicator_encoder = IndicatorEncoder(
            n_indicators=n_indicators,
            d_model=d_model,
            n_heads=n_heads,
            n_layers=n_encoder_layers,
            dropout=dropout,
        )
        self.fusion_transformer = FusionTransformer(
            d_model=d_model,
            n_heads=n_heads,
            n_fusion_layers=n_fusion_layers,
            dropout=dropout,
        )

        # Fused state dimension is 2 * d_model (candle + indicator streams concatenated)
        d_fused = d_model * 2

        # Policy head: maps fused state to action logits
        self.policy_head = nn.Sequential(
            nn.Linear(d_fused, d_fused),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_fused, n_actions),
        )

        # Value head: maps fused state to scalar return estimate
        self.value_head = nn.Sequential(
            nn.Linear(d_fused, d_fused),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_fused, 1),
            nn.Tanh(),  # bound value prediction to [-1, 1]
        )

        self.n_actions = n_actions

    def forward(
        self,
        ohlcv: torch.Tensor,
        indicators: torch.Tensor,
    ) -> tuple:
        """
        Forward pass through the full network.

        Args:
            ohlcv: OHLCV sequences of shape (batch, seq_len, 5).
            indicators: Indicator sequences of shape (batch, seq_len, n_indicators).

        Returns:
            Tuple of:
                - policy_logits: (batch, n_actions) raw logits before softmax
                - value: (batch, 1) scalar value prediction
        """
        # Encode both streams independently
        candle_emb = self.candlestick_encoder(ohlcv)
        indicator_emb = self.indicator_encoder(indicators)

        # Fuse via cross-attention → single state vector
        fused_state = self.fusion_transformer(candle_emb, indicator_emb)

        # Dual heads
        policy_logits = self.policy_head(fused_state)
        value = self.value_head(fused_state)

        return policy_logits, value

    def predict(
        self,
        ohlcv: torch.Tensor,
        indicators: torch.Tensor,
    ) -> tuple:
        """
        Inference-mode prediction with softmax policy probabilities.

        Args:
            ohlcv: OHLCV sequences of shape (batch, seq_len, 5).
            indicators: Indicator sequences of shape (batch, seq_len, n_indicators).

        Returns:
            Tuple of:
                - policy_probs: (batch, n_actions) softmax action probabilities
                - value: (batch, 1) scalar value prediction
        """
        self.eval()
        with torch.no_grad():
            logits, value = self.forward(ohlcv, indicators)
            probs = F.softmax(logits, dim=-1)
        return probs, value
