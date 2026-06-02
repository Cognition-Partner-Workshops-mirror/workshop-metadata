"""
Technical Indicator Transformer Encoder.

Encodes sequences of computed technical indicators into contextual embeddings
using a Transformer encoder with separate weights from the candlestick encoder.
This allows the model to learn indicator-specific temporal patterns independently
before fusing with price data in the Fusion Transformer.
"""

import math

import torch
import torch.nn as nn


class PositionalEncoding(nn.Module):
    """
    Sinusoidal positional encoding — identical implementation to the one in
    candlestick_encoder but maintained separately to keep modules self-contained.
    """

    def __init__(self, d_model: int, max_len: int = 5000, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Add positional encoding to input embeddings."""
        x = x + self.pe[:, : x.size(1), :]
        return self.dropout(x)


class IndicatorEncoder(nn.Module):
    """
    Transformer encoder for technical indicator time series.

    Mirrors the CandlestickEncoder architecture but operates on indicator
    features (RSI, MACD, BB, ATR, etc.) with its own learned weights.
    """

    def __init__(
        self,
        n_indicators: int = 15,
        d_model: int = 128,
        n_heads: int = 8,
        n_layers: int = 4,
        dropout: float = 0.1,
        max_seq_len: int = 5000,
    ):
        """
        Args:
            n_indicators: Number of indicator features per timestep.
            d_model: Transformer embedding dimensionality.
            n_heads: Number of multi-head attention heads.
            n_layers: Depth of the Transformer encoder stack.
            dropout: Dropout probability.
            max_seq_len: Maximum sequence length for positional encoding.
        """
        super().__init__()
        self.n_indicators = n_indicators

        # Project variable-width indicator vector into model dimension
        self.input_projection = nn.Linear(n_indicators, d_model)
        self.positional_encoding = PositionalEncoding(d_model, max_seq_len, dropout)

        # Independent Transformer encoder (separate weights from candlestick encoder)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=n_layers
        )

        self.output_norm = nn.LayerNorm(d_model)

    def forward(
        self, x: torch.Tensor, mask: torch.Tensor = None
    ) -> torch.Tensor:
        """
        Encode a batch of indicator sequences.

        Args:
            x: Input tensor of shape (batch, seq_len, n_indicators).
            mask: Optional padding mask of shape (batch, seq_len).

        Returns:
            Contextual indicator embeddings of shape (batch, seq_len, d_model).
        """
        # Project indicator features into Transformer dimension
        x = self.input_projection(x)
        x = self.positional_encoding(x)
        # Self-attention across the temporal dimension
        x = self.transformer_encoder(x, src_key_padding_mask=mask)
        x = self.output_norm(x)
        return x
