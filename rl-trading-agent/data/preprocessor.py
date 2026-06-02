"""
Data preprocessing module.

Handles z-score normalization (rolling, non-stationary-aware), sliding window
creation for sequence models, and walk-forward train/val/test splitting that
prevents data leakage.
"""

import logging
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class WalkForwardSplit:
    """Container for a single walk-forward split window."""
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame
    split_index: int  # ordinal position in the walk-forward sequence


def rolling_zscore_normalize(
    df: pd.DataFrame,
    window: int = 60,
    min_periods: int = 20,
) -> pd.DataFrame:
    """
    Apply rolling z-score normalization to each numeric column.

    Uses a rolling window rather than global statistics because financial
    markets are non-stationary — global z-scores would leak future information.

    Args:
        df: Input DataFrame with numeric columns.
        window: Rolling window size for mean/std computation.
        min_periods: Minimum observations required for a valid z-score.

    Returns:
        DataFrame of the same shape with z-score normalised values.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    rolling_mean = df[numeric_cols].rolling(window=window, min_periods=min_periods).mean()
    rolling_std = df[numeric_cols].rolling(window=window, min_periods=min_periods).std()

    # Replace zero-std with 1.0 to avoid division by zero (flat series → z=0)
    rolling_std = rolling_std.replace(0, 1.0)

    normalized = (df[numeric_cols] - rolling_mean) / rolling_std
    # Preserve any non-numeric columns unchanged
    result = df.copy()
    result[numeric_cols] = normalized
    return result


def create_sliding_windows(
    data: np.ndarray,
    window_size: int = 60,
    stride: int = 1,
) -> np.ndarray:
    """
    Create overlapping sliding windows from a 2D array.

    Args:
        data: Input array of shape (n_timesteps, n_features).
        window_size: Number of timesteps per window.
        stride: Step size between consecutive windows.

    Returns:
        Array of shape (n_windows, window_size, n_features).
    """
    if len(data) < window_size:
        raise ValueError(
            f"Data length ({len(data)}) is shorter than window_size ({window_size})"
        )
    n_windows = (len(data) - window_size) // stride + 1
    windows = np.array([
        data[i * stride : i * stride + window_size]
        for i in range(n_windows)
    ])
    logger.debug("Created %d sliding windows (size=%d, stride=%d)", n_windows, window_size, stride)
    return windows


def walk_forward_split(
    df: pd.DataFrame,
    n_splits: int = 5,
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
) -> List[WalkForwardSplit]:
    """
    Generate walk-forward train/val/test splits.

    Unlike random splitting, walk-forward preserves temporal ordering and
    prevents look-ahead bias. The window slides forward so that each split
    trains on earlier data and validates/tests on later data.

    Split layout per fold:
        |--- train (70%) ---|--- val (15%) ---|--- test (15%) ---|
        Then the entire window shifts forward by `step_size` rows.

    Args:
        df: Full dataset ordered chronologically.
        n_splits: Number of walk-forward folds.
        train_ratio: Fraction of each fold used for training.
        val_ratio: Fraction of each fold used for validation.

    Returns:
        List of WalkForwardSplit objects.
    """
    test_ratio = 1.0 - train_ratio - val_ratio
    n_total = len(df)

    # Each fold covers this many rows; the folds overlap by sliding forward
    fold_size = int(n_total / (n_splits + 1) * 2)
    step_size = (n_total - fold_size) // max(n_splits - 1, 1)

    splits: List[WalkForwardSplit] = []

    for i in range(n_splits):
        start = i * step_size
        end = min(start + fold_size, n_total)
        fold_len = end - start

        train_end = start + int(fold_len * train_ratio)
        val_end = train_end + int(fold_len * val_ratio)

        split = WalkForwardSplit(
            train=df.iloc[start:train_end].copy(),
            val=df.iloc[train_end:val_end].copy(),
            test=df.iloc[val_end:end].copy(),
            split_index=i,
        )
        splits.append(split)
        logger.info(
            "Split %d: train[%d:%d] val[%d:%d] test[%d:%d]",
            i, start, train_end, train_end, val_end, val_end, end,
        )

    return splits


def prepare_features(
    df: pd.DataFrame,
    ohlcv_cols: List[str] = None,
    indicator_cols: List[str] = None,
    window_size: int = 60,
    normalize: bool = True,
    norm_window: int = 60,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Full preprocessing pipeline: normalize → separate OHLCV and indicator
    features → create sliding windows.

    Args:
        df: DataFrame with OHLCV + indicator columns.
        ohlcv_cols: Column names for raw price data. Defaults to standard OHLCV.
        indicator_cols: Column names for computed indicators. Auto-detected if None.
        window_size: Lookback window length for sequences.
        normalize: Whether to apply rolling z-score normalization.
        norm_window: Rolling window for z-score computation.

    Returns:
        Tuple of (ohlcv_windows, indicator_windows) as numpy arrays,
        each of shape (n_windows, window_size, n_features).
    """
    if ohlcv_cols is None:
        ohlcv_cols = ["open", "high", "low", "close", "volume"]
    if indicator_cols is None:
        # Auto-detect indicator columns (everything except OHLCV)
        indicator_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c not in ohlcv_cols]

    # Drop rows with NaN values introduced by indicators or rolling windows
    df_clean = df.dropna()

    if normalize:
        df_clean = rolling_zscore_normalize(df_clean, window=norm_window)
        # Drop NaN rows created by the rolling normalization warm-up period
        df_clean = df_clean.dropna()

    ohlcv_data = df_clean[ohlcv_cols].values
    indicator_data = df_clean[indicator_cols].values

    ohlcv_windows = create_sliding_windows(ohlcv_data, window_size=window_size)
    indicator_windows = create_sliding_windows(indicator_data, window_size=window_size)

    logger.info(
        "Prepared features: %d windows, OHLCV shape=%s, indicators shape=%s",
        len(ohlcv_windows),
        ohlcv_windows.shape,
        indicator_windows.shape,
    )
    return ohlcv_windows, indicator_windows
