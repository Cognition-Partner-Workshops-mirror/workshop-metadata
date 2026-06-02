"""
Technical indicator computation module.

Computes a rich set of technical indicators from OHLCV data using pandas_ta.
Indicators are configurable and include RSI, MACD, Bollinger Bands, ATR, EMA,
OBV, Stochastic Oscillator, and Volume Profile.
"""

import logging
from typing import Dict, List, Optional

import pandas as pd
import pandas_ta as ta

logger = logging.getLogger(__name__)

# Default indicator configuration matching config.yaml
DEFAULT_INDICATORS: List[str] = [
    "RSI_14",
    "MACD_12_26_9",
    "BB_20_2",
    "ATR_14",
    "EMA_9",
    "EMA_21",
    "OBV",
    "STOCH_14_3_3",
]


def compute_rsi(df: pd.DataFrame, length: int = 14) -> pd.DataFrame:
    """Relative Strength Index — momentum oscillator measuring speed of price changes."""
    df[f"RSI_{length}"] = ta.rsi(df["close"], length=length)
    return df


def compute_macd(
    df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9
) -> pd.DataFrame:
    """MACD — trend-following momentum indicator with signal line and histogram."""
    macd = ta.macd(df["close"], fast=fast, slow=slow, signal=signal)
    if macd is not None:
        df = pd.concat([df, macd], axis=1)
    return df


def compute_bollinger_bands(
    df: pd.DataFrame, length: int = 20, std: float = 2.0
) -> pd.DataFrame:
    """Bollinger Bands — volatility envelope around a moving average."""
    bbands = ta.bbands(df["close"], length=length, std=std)
    if bbands is not None:
        df = pd.concat([df, bbands], axis=1)
    return df


def compute_atr(df: pd.DataFrame, length: int = 14) -> pd.DataFrame:
    """Average True Range — volatility measure based on high-low-close ranges."""
    df[f"ATR_{length}"] = ta.atr(
        high=df["high"], low=df["low"], close=df["close"], length=length
    )
    return df


def compute_ema(df: pd.DataFrame, length: int = 9) -> pd.DataFrame:
    """Exponential Moving Average — smoothed trend line with recent-weight bias."""
    df[f"EMA_{length}"] = ta.ema(df["close"], length=length)
    return df


def compute_obv(df: pd.DataFrame) -> pd.DataFrame:
    """On Balance Volume — cumulative volume indicator confirming price trends."""
    df["OBV"] = ta.obv(df["close"], df["volume"])
    return df


def compute_stochastic(
    df: pd.DataFrame, k: int = 14, d: int = 3, smooth_k: int = 3
) -> pd.DataFrame:
    """Stochastic Oscillator — overbought/oversold momentum indicator."""
    stoch = ta.stoch(
        high=df["high"],
        low=df["low"],
        close=df["close"],
        k=k,
        d=d,
        smooth_k=smooth_k,
    )
    if stoch is not None:
        df = pd.concat([df, stoch], axis=1)
    return df


def compute_volume_profile(
    df: pd.DataFrame, bins: int = 20
) -> pd.DataFrame:
    """
    Simplified volume profile — distributes volume across price bins.

    Creates a 'volume_profile_rank' column indicating how the current price
    sits relative to the highest-volume price zone.
    """
    price_range = df["close"].max() - df["close"].min()
    if price_range == 0:
        df["volume_profile_rank"] = 0.5
        return df
    # Bin prices and aggregate volume per bin
    bin_size = price_range / bins
    df["price_bin"] = ((df["close"] - df["close"].min()) / bin_size).astype(int).clip(upper=bins - 1)
    vol_by_bin = df.groupby("price_bin")["volume"].sum()
    # Rank current price bin relative to peak volume bin
    peak_bin = vol_by_bin.idxmax()
    df["volume_profile_rank"] = 1.0 - abs(df["price_bin"] - peak_bin) / bins
    df = df.drop(columns=["price_bin"])
    return df


# Dispatcher mapping indicator names to their compute functions
INDICATOR_REGISTRY: Dict[str, callable] = {
    "RSI_14": lambda df: compute_rsi(df, 14),
    "MACD_12_26_9": lambda df: compute_macd(df, 12, 26, 9),
    "BB_20_2": lambda df: compute_bollinger_bands(df, 20, 2.0),
    "ATR_14": lambda df: compute_atr(df, 14),
    "EMA_9": lambda df: compute_ema(df, 9),
    "EMA_21": lambda df: compute_ema(df, 21),
    "EMA_50": lambda df: compute_ema(df, 50),
    "EMA_200": lambda df: compute_ema(df, 200),
    "OBV": compute_obv,
    "STOCH_14_3_3": lambda df: compute_stochastic(df, 14, 3, 3),
    "VOLUME_PROFILE": compute_volume_profile,
}


def compute_indicators(
    df: pd.DataFrame,
    indicator_list: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Compute all requested technical indicators and append them to the DataFrame.

    Args:
        df: OHLCV DataFrame with columns [open, high, low, close, volume].
        indicator_list: List of indicator keys from INDICATOR_REGISTRY.
                        Defaults to DEFAULT_INDICATORS.

    Returns:
        DataFrame augmented with indicator columns.
    """
    if indicator_list is None:
        indicator_list = DEFAULT_INDICATORS

    df = df.copy()
    for indicator_name in indicator_list:
        if indicator_name in INDICATOR_REGISTRY:
            df = INDICATOR_REGISTRY[indicator_name](df)
            logger.debug("Computed indicator: %s", indicator_name)
        else:
            logger.warning("Unknown indicator: %s — skipping", indicator_name)

    return df
