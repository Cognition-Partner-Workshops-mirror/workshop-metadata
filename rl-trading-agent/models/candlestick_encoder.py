"""
Candlestick (OHLCV) Transformer Encoder.

Encodes raw OHLCV sequences into contextual embeddings using a standard
Transformer encoder with learned positional encoding. Each timestep's
5-dim OHLCV vector is projected to d_model dimensions, then processed
through multi-head self-attention layers to capture temporal dependencies.
"""

import math

import torch
import torch.nn as nn


class PositionalEncoding(nn.Module):
    """
    Sinusoidal positional encoding (Vaswani et al., 2017).

    Injects position information into the input embeddings so the
    Transformer can distinguish temporal ordering of candlesticks.
    """

    def __init__(self, d_model: int, max_len: int = 5000, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        # Precompute sinusoidal position encodings
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        # Even indices get sin, odd indices get cos
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        # Shape: (1, max_len, d_model) for batch broadcasting
        pe = pe.unsqueeze(0)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (batch, seq_len, d_model).

        Returns:
            Position-encoded tensor of the same shape.
        """
        x = x + self.pe[:, : x.size(1), :]
        return self.dropout(x)


class CandlestickEncoder(nn.Module):
    """
    Transformer encoder for OHLCV candlestick sequences.

    Projects each 5-dim OHLCV vector into d_model dimensions, applies
    positional encoding, then passes through a stack of Transformer
    encoder layers to produce contextual embeddings.
    """

    # Number of raw OHLCV features: open, high, low, close, volume
    OHLCV_DIM = 5

    def __init__(
        self,
        d_model: int = 128,
        n_heads: int = 8,
        n_layers: int = 4,
        dropout: float = 0.1,
        max_seq_len: int = 5000,
    ):
        """
        Args:
            d_model: Dimensionality of Transformer embeddings.
            n_heads: Number of attention heads.
            n_layers: Number of stacked Transformer encoder layers.
            dropout: Dropout rate applied throughout.
            max_seq_len: Maximum supported sequence length for positional encoding.
        """
        super().__init__()

        # Linear projection from raw OHLCV space to model dimension
        self.input_projection = nn.Linear(self.OHLCV_DIM, d_model)
        self.positional_encoding = PositionalEncoding(d_model, max_seq_len, dropout)

        # Standard PyTorch Transformer encoder stack
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_model * 4,  # standard 4× expansion ratio
            dropout=dropout,
            batch_first=True,  # expect (batch, seq, feature) layout
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer, num_layers=n_layers
        )

        # Layer norm on final output for training stability
        self.output_norm = nn.LayerNorm(d_model)

    def forward(
        self, x: torch.Tensor, mask: torch.Tensor = None
    ) -> torch.Tensor:
        """
        Encode a batch of OHLCV sequences.

        Args:
            x: Input tensor of shape (batch, seq_len, 5).
            mask: Optional source key padding mask of shape (batch, seq_len).

        Returns:
            Contextual embeddings of shape (batch, seq_len, d_model).
        """
        # Project OHLCV features into Transformer dimension
        x = self.input_projection(x)
        # Add positional encoding to preserve temporal order
        x = self.positional_encoding(x)
        # Run through self-attention encoder stack
        x = self.transformer_encoder(x, src_key_padding_mask=mask)
        # Final layer normalization
        x = self.output_norm(x)
        return x
