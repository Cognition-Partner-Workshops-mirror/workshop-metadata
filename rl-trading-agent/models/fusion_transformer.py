"""
Fusion Transformer — Cross-Attention Module.

Fuses candlestick and indicator embeddings using bidirectional cross-attention
so that price patterns can attend to indicator signals and vice versa. The
fused representation is then pooled into a fixed-size state vector for the
policy-value heads.
"""

import torch
import torch.nn as nn


class CrossAttentionLayer(nn.Module):
    """
    Single bidirectional cross-attention layer.

    Candlestick embeddings attend to indicator embeddings (and vice versa)
    via multi-head attention, followed by feed-forward networks and residual
    connections with layer normalization.
    """

    def __init__(self, d_model: int = 128, n_heads: int = 8, dropout: float = 0.1):
        super().__init__()

        # Candlestick-to-indicator cross attention (candle queries, indicator keys/values)
        self.cross_attn_candle = nn.MultiheadAttention(
            embed_dim=d_model, num_heads=n_heads, dropout=dropout, batch_first=True
        )
        # Indicator-to-candlestick cross attention (indicator queries, candle keys/values)
        self.cross_attn_indicator = nn.MultiheadAttention(
            embed_dim=d_model, num_heads=n_heads, dropout=dropout, batch_first=True
        )

        # Layer norms for residual connections
        self.norm_candle_1 = nn.LayerNorm(d_model)
        self.norm_candle_2 = nn.LayerNorm(d_model)
        self.norm_indicator_1 = nn.LayerNorm(d_model)
        self.norm_indicator_2 = nn.LayerNorm(d_model)

        # Position-wise feed-forward networks (one per stream)
        self.ffn_candle = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model * 4, d_model),
            nn.Dropout(dropout),
        )
        self.ffn_indicator = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model * 4, d_model),
            nn.Dropout(dropout),
        )

    def forward(
        self,
        candle_emb: torch.Tensor,
        indicator_emb: torch.Tensor,
    ) -> tuple:
        """
        Bidirectional cross-attention between candle and indicator streams.

        Args:
            candle_emb: Candlestick embeddings (batch, seq_len, d_model).
            indicator_emb: Indicator embeddings (batch, seq_len, d_model).

        Returns:
            Tuple of (updated_candle_emb, updated_indicator_emb).
        """
        # Candle attends to indicators
        attn_out_candle, _ = self.cross_attn_candle(
            query=candle_emb, key=indicator_emb, value=indicator_emb
        )
        candle_emb = self.norm_candle_1(candle_emb + attn_out_candle)
        candle_emb = self.norm_candle_2(candle_emb + self.ffn_candle(candle_emb))

        # Indicators attend to candles
        attn_out_indicator, _ = self.cross_attn_indicator(
            query=indicator_emb, key=candle_emb, value=candle_emb
        )
        indicator_emb = self.norm_indicator_1(indicator_emb + attn_out_indicator)
        indicator_emb = self.norm_indicator_2(
            indicator_emb + self.ffn_indicator(indicator_emb)
        )

        return candle_emb, indicator_emb


class FusionTransformer(nn.Module):
    """
    Multi-layer cross-attention fusion of candlestick and indicator streams.

    After cross-attention, both streams are concatenated and mean-pooled
    across the sequence dimension to produce a fixed-size fused state
    embedding of dimension d_fused (= 2 * d_model).
    """

    def __init__(
        self,
        d_model: int = 128,
        n_heads: int = 8,
        n_fusion_layers: int = 2,
        dropout: float = 0.1,
    ):
        """
        Args:
            d_model: Embedding dimension of each encoder stream.
            n_heads: Attention heads per cross-attention layer.
            n_fusion_layers: Number of stacked cross-attention layers.
            dropout: Dropout rate.
        """
        super().__init__()
        self.d_model = d_model
        # d_fused = 2 * d_model because we concatenate both streams
        self.d_fused = d_model * 2

        # Stack of bidirectional cross-attention layers
        self.fusion_layers = nn.ModuleList([
            CrossAttentionLayer(d_model, n_heads, dropout)
            for _ in range(n_fusion_layers)
        ])

        # Final feed-forward layer to mix the concatenated representation
        self.fusion_ff = nn.Sequential(
            nn.Linear(self.d_fused, self.d_fused),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.LayerNorm(self.d_fused),
        )

    def forward(
        self,
        candle_emb: torch.Tensor,
        indicator_emb: torch.Tensor,
    ) -> torch.Tensor:
        """
        Fuse candlestick and indicator embeddings into a single state vector.

        Args:
            candle_emb: (batch, seq_len, d_model) from CandlestickEncoder.
            indicator_emb: (batch, seq_len, d_model) from IndicatorEncoder.

        Returns:
            Fused state embedding of shape (batch, d_fused).
        """
        # Pass through cross-attention layers
        for layer in self.fusion_layers:
            candle_emb, indicator_emb = layer(candle_emb, indicator_emb)

        # Concatenate both streams: (batch, seq_len, 2*d_model)
        fused = torch.cat([candle_emb, indicator_emb], dim=-1)

        # Mean-pool across the temporal dimension → (batch, d_fused)
        fused = fused.mean(dim=1)

        # Final mixing layer
        fused = self.fusion_ff(fused)

        return fused
