"""
Market data ingestion module.

Fetches OHLCV candlestick data from crypto exchanges (via ccxt) or
equity markets (via yfinance) at configurable timeframes.
"""

import logging
from typing import Optional

import ccxt
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class MarketDataFetcher:
    """Unified interface for fetching OHLCV data from multiple sources."""

    # Standard column names used throughout the pipeline
    OHLCV_COLUMNS = ["timestamp", "open", "high", "low", "close", "volume"]

    def __init__(self, source: str = "yfinance", exchange_id: str = "binance"):
        """
        Args:
            source: Data source backend — 'yfinance' for equities, 'ccxt' for crypto.
            exchange_id: ccxt exchange identifier (only used when source='ccxt').
        """
        self.source = source
        self.exchange_id = exchange_id
        # Lazy-initialise exchange connection to avoid import-time side effects
        self._exchange: Optional[ccxt.Exchange] = None

    def _get_exchange(self) -> ccxt.Exchange:
        """Lazily create and cache the ccxt exchange instance."""
        if self._exchange is None:
            exchange_class = getattr(ccxt, self.exchange_id)
            self._exchange = exchange_class({"enableRateLimit": True})
            logger.info("Initialised ccxt exchange: %s", self.exchange_id)
        return self._exchange

    def fetch_ohlcv_ccxt(
        self,
        symbol: str,
        timeframe: str = "1h",
        since: Optional[int] = None,
        limit: int = 1000,
    ) -> pd.DataFrame:
        """
        Fetch OHLCV data from a crypto exchange via ccxt.

        Args:
            symbol: Trading pair, e.g. 'BTC/USDT'.
            timeframe: Candlestick interval — '1m', '5m', '1h', '1d', etc.
            since: Start timestamp in milliseconds (Unix epoch).
            limit: Maximum number of candles to retrieve per request.

        Returns:
            DataFrame with columns [timestamp, open, high, low, close, volume].
        """
        exchange = self._get_exchange()
        all_candles = []
        fetched_since = since

        # Paginate through history until we run out of data
        while True:
            candles = exchange.fetch_ohlcv(
                symbol, timeframe=timeframe, since=fetched_since, limit=limit
            )
            if not candles:
                break
            all_candles.extend(candles)
            # Advance cursor past the last candle timestamp
            fetched_since = candles[-1][0] + 1
            logger.debug(
                "Fetched %d candles for %s, last ts=%d",
                len(candles),
                symbol,
                candles[-1][0],
            )
            # If we got fewer candles than the limit, we've reached the end
            if len(candles) < limit:
                break

        df = pd.DataFrame(all_candles, columns=self.OHLCV_COLUMNS)
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        df = df.set_index("timestamp")
        logger.info("Total candles fetched for %s: %d", symbol, len(df))
        return df

    def fetch_ohlcv_yfinance(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1h",
    ) -> pd.DataFrame:
        """
        Fetch OHLCV data for equities/ETFs via yfinance.

        Args:
            ticker: Yahoo Finance ticker symbol, e.g. 'AAPL'.
            period: Lookback window — '1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', 'max'.
            interval: Candlestick interval — '1m', '5m', '15m', '1h', '1d'.

        Returns:
            DataFrame with columns [open, high, low, close, volume].
        """
        logger.info("Fetching yfinance data: ticker=%s period=%s interval=%s", ticker, period, interval)
        data = yf.download(ticker, period=period, interval=interval, progress=False)
        # Flatten multi-level columns returned by newer yfinance versions
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
        # Normalise column names to lowercase
        data.columns = [c.lower() for c in data.columns]
        data = data[["open", "high", "low", "close", "volume"]]
        data.index.name = "timestamp"
        logger.info("Fetched %d bars for %s", len(data), ticker)
        return data

    def fetch(
        self,
        symbol: str,
        timeframe: str = "1h",
        period: str = "1y",
        **kwargs,
    ) -> pd.DataFrame:
        """
        Unified fetch interface that dispatches to the configured backend.

        Args:
            symbol: Ticker or trading pair.
            timeframe: Candle interval string.
            period: Lookback period (yfinance only).
            **kwargs: Extra arguments forwarded to the backend method.

        Returns:
            OHLCV DataFrame.
        """
        if self.source == "ccxt":
            return self.fetch_ohlcv_ccxt(symbol, timeframe=timeframe, **kwargs)
        elif self.source == "yfinance":
            return self.fetch_ohlcv_yfinance(symbol, period=period, interval=timeframe, **kwargs)
        else:
            raise ValueError(f"Unsupported data source: {self.source}")
