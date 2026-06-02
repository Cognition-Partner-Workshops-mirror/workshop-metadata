"""
Live broker integration — abstract interface with concrete implementations.

Provides a unified API for submitting orders, querying positions, and
fetching account state across multiple brokers (Alpaca for US equities,
Binance/ccxt for crypto). New brokers are added by subclassing BrokerAPI.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class OrderSide(Enum):
    """Trade direction."""
    BUY = "buy"
    SELL = "sell"


class OrderType(Enum):
    """Order execution type."""
    MARKET = "market"
    LIMIT = "limit"


@dataclass
class OrderRequest:
    """Specification for a new order to submit."""
    symbol: str
    side: OrderSide
    quantity: float
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = None


@dataclass
class OrderResult:
    """Outcome of a submitted order."""
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    filled_price: float
    status: str  # 'filled', 'partial', 'rejected', etc.
    timestamp: str


@dataclass
class PositionInfo:
    """Current position in a single asset."""
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    unrealized_pnl: float
    market_value: float


@dataclass
class AccountInfo:
    """Broker account summary."""
    cash: float
    portfolio_value: float
    buying_power: float
    positions: List[PositionInfo]


class BrokerAPI(ABC):
    """
    Abstract broker interface.

    Subclass this for each broker (Alpaca, Binance, etc.) and implement
    the abstract methods. The inference pipeline and risk manager interact
    with brokers exclusively through this interface.
    """

    @abstractmethod
    def connect(self) -> None:
        """Establish connection to the broker API."""
        ...

    @abstractmethod
    def get_account(self) -> AccountInfo:
        """Fetch current account state (cash, positions, portfolio value)."""
        ...

    @abstractmethod
    def get_positions(self) -> List[PositionInfo]:
        """List all open positions."""
        ...

    @abstractmethod
    def submit_order(self, order: OrderRequest) -> OrderResult:
        """Submit an order for execution."""
        ...

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending order. Returns True if successfully cancelled."""
        ...

    @abstractmethod
    def get_current_price(self, symbol: str) -> float:
        """Fetch the latest price for a symbol."""
        ...


class AlpacaBroker(BrokerAPI):
    """
    Alpaca broker implementation for US equities paper/live trading.

    Requires ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables.
    Uses the Alpaca REST API v2 for order management.
    """

    def __init__(
        self,
        api_key: str = "",
        secret_key: str = "",
        base_url: str = "https://paper-api.alpaca.markets",
    ):
        """
        Args:
            api_key: Alpaca API key (from env var or config).
            secret_key: Alpaca secret key.
            base_url: API base URL — use paper-api for paper trading.
        """
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = base_url
        self._session = None

    def connect(self) -> None:
        """Initialise HTTP session with Alpaca authentication headers."""
        import requests
        self._session = requests.Session()
        self._session.headers.update({
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.secret_key,
        })
        logger.info("Connected to Alpaca broker at %s", self.base_url)

    def get_account(self) -> AccountInfo:
        """Fetch Alpaca account information."""
        resp = self._request("GET", "/v2/account")
        positions = self.get_positions()
        return AccountInfo(
            cash=float(resp.get("cash", 0)),
            portfolio_value=float(resp.get("portfolio_value", 0)),
            buying_power=float(resp.get("buying_power", 0)),
            positions=positions,
        )

    def get_positions(self) -> List[PositionInfo]:
        """Fetch all open positions from Alpaca."""
        resp = self._request("GET", "/v2/positions")
        positions = []
        for pos in resp:
            positions.append(PositionInfo(
                symbol=pos["symbol"],
                quantity=float(pos["qty"]),
                avg_entry_price=float(pos["avg_entry_price"]),
                current_price=float(pos["current_price"]),
                unrealized_pnl=float(pos["unrealized_pl"]),
                market_value=float(pos["market_value"]),
            ))
        return positions

    def submit_order(self, order: OrderRequest) -> OrderResult:
        """Submit a market or limit order to Alpaca."""
        payload = {
            "symbol": order.symbol,
            "qty": str(order.quantity),
            "side": order.side.value,
            "type": order.order_type.value,
            "time_in_force": "gtc",
        }
        if order.order_type == OrderType.LIMIT and order.limit_price is not None:
            payload["limit_price"] = str(order.limit_price)

        resp = self._request("POST", "/v2/orders", json=payload)
        return OrderResult(
            order_id=resp["id"],
            symbol=resp["symbol"],
            side=OrderSide(resp["side"]),
            quantity=float(resp.get("filled_qty", order.quantity)),
            filled_price=float(resp.get("filled_avg_price", 0)),
            status=resp["status"],
            timestamp=resp.get("created_at", ""),
        )

    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending Alpaca order."""
        try:
            self._request("DELETE", f"/v2/orders/{order_id}")
            return True
        except Exception as e:
            logger.warning("Failed to cancel order %s: %s", order_id, e)
            return False

    def get_current_price(self, symbol: str) -> float:
        """Fetch latest trade price from Alpaca market data."""
        resp = self._request("GET", f"/v2/stocks/{symbol}/trades/latest")
        return float(resp.get("trade", {}).get("p", 0))

    def _request(self, method: str, endpoint: str, **kwargs):
        """Send authenticated HTTP request to Alpaca API."""
        url = f"{self.base_url}{endpoint}"
        resp = self._session.request(method, url, **kwargs)
        resp.raise_for_status()
        return resp.json()


class CcxtBroker(BrokerAPI):
    """
    Crypto broker implementation using the ccxt library.

    Supports any ccxt-compatible exchange (Binance, Coinbase, Kraken, etc.).
    """

    def __init__(
        self,
        exchange_id: str = "binance",
        api_key: str = "",
        secret: str = "",
        sandbox: bool = True,
    ):
        """
        Args:
            exchange_id: ccxt exchange identifier.
            api_key: Exchange API key.
            secret: Exchange API secret.
            sandbox: If True, use the exchange's testnet/sandbox mode.
        """
        self.exchange_id = exchange_id
        self.api_key = api_key
        self.secret = secret
        self.sandbox = sandbox
        self._exchange = None

    def connect(self) -> None:
        """Initialise ccxt exchange with API credentials."""
        import ccxt
        exchange_class = getattr(ccxt, self.exchange_id)
        self._exchange = exchange_class({
            "apiKey": self.api_key,
            "secret": self.secret,
            "enableRateLimit": True,
        })
        if self.sandbox:
            self._exchange.set_sandbox_mode(True)
        logger.info("Connected to %s (sandbox=%s)", self.exchange_id, self.sandbox)

    def get_account(self) -> AccountInfo:
        """Fetch account balance and positions from exchange."""
        balance = self._exchange.fetch_balance()
        total_value = float(balance.get("total", {}).get("USDT", 0))
        free_cash = float(balance.get("free", {}).get("USDT", 0))
        positions = self.get_positions()
        return AccountInfo(
            cash=free_cash,
            portfolio_value=total_value,
            buying_power=free_cash,
            positions=positions,
        )

    def get_positions(self) -> List[PositionInfo]:
        """Fetch open positions (non-zero balances) from exchange."""
        balance = self._exchange.fetch_balance()
        positions = []
        for currency, amount in balance.get("total", {}).items():
            if float(amount) > 0 and currency != "USDT":
                ticker = self._exchange.fetch_ticker(f"{currency}/USDT")
                current_price = float(ticker["last"])
                positions.append(PositionInfo(
                    symbol=f"{currency}/USDT",
                    quantity=float(amount),
                    avg_entry_price=0.0,  # ccxt doesn't track avg entry
                    current_price=current_price,
                    unrealized_pnl=0.0,
                    market_value=float(amount) * current_price,
                ))
        return positions

    def submit_order(self, order: OrderRequest) -> OrderResult:
        """Submit an order through ccxt."""
        if order.order_type == OrderType.MARKET:
            result = self._exchange.create_market_order(
                order.symbol, order.side.value, order.quantity
            )
        else:
            result = self._exchange.create_limit_order(
                order.symbol, order.side.value, order.quantity, order.limit_price
            )
        return OrderResult(
            order_id=str(result["id"]),
            symbol=result["symbol"],
            side=OrderSide(result["side"]),
            quantity=float(result.get("filled", order.quantity)),
            filled_price=float(result.get("average", 0)),
            status=result["status"],
            timestamp=str(result.get("datetime", "")),
        )

    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending exchange order."""
        try:
            self._exchange.cancel_order(order_id)
            return True
        except Exception as e:
            logger.warning("Failed to cancel order %s: %s", order_id, e)
            return False

    def get_current_price(self, symbol: str) -> float:
        """Fetch latest price via ccxt ticker."""
        ticker = self._exchange.fetch_ticker(symbol)
        return float(ticker["last"])


def create_broker(
    broker_type: str = "alpaca",
    **kwargs,
) -> BrokerAPI:
    """
    Factory function for broker instances.

    Args:
        broker_type: 'alpaca' or 'ccxt'.
        **kwargs: Forwarded to the broker constructor.

    Returns:
        Configured BrokerAPI instance.
    """
    brokers = {
        "alpaca": AlpacaBroker,
        "ccxt": CcxtBroker,
    }
    if broker_type not in brokers:
        raise ValueError(f"Unknown broker type: {broker_type}. Choose from {list(brokers.keys())}")
    return brokers[broker_type](**kwargs)
