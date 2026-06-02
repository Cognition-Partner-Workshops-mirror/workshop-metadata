# RL Trading Agent

A reinforcement learning trading system combining **Transformer encoders**, **AlphaZero-style Monte Carlo Tree Search (MCTS)**, and **Fusion Transformers** for live market trading.

## Architecture Overview

```
OHLCV Sequence  → CandlestickEncoder (4-layer Transformer) → ┐
                                                               ├→ FusionTransformer (cross-attention) → PolicyValueNet
Indicator Sequence → IndicatorEncoder (4-layer Transformer)  → ┘       ↓                    ↓
                                                                  Policy Head          Value Head
                                                               (20 actions)       (expected return)
                                                                       ↓
                                                                MCTS (AlphaZero-style)
                                                                       ↓
                                                                 Trade Decision
```

### Key Components

| Module | Description |
|--------|-------------|
| **CandlestickEncoder** | Transformer encoder for OHLCV price sequences (d_model=128, 8 heads, 4 layers) |
| **IndicatorEncoder** | Separate Transformer encoder for technical indicator time series |
| **FusionTransformer** | Bidirectional cross-attention to fuse price and indicator embeddings |
| **PolicyValueNet** | Dual-head network: policy (20 discrete actions) + value (scalar return estimate) |
| **MCTS** | AlphaZero-adapted tree search where the "opponent" is the market |

### Action Space

20 discrete actions = 5 trade directions × 4 position sizes:

- **Directions**: strong_sell, sell, hold, buy, strong_buy
- **Position sizes**: 10%, 25%, 50%, 100% of portfolio

## Project Structure

```
rl-trading-agent/
├── data/
│   ├── fetcher.py              # Market data ingestion (OHLCV via ccxt or yfinance)
│   ├── indicators.py           # Technical indicator computation (pandas-ta)
│   └── preprocessor.py         # Normalization, windowing, walk-forward splits
├── models/
│   ├── candlestick_encoder.py  # Transformer encoder for OHLCV sequences
│   ├── indicator_encoder.py    # Transformer encoder for indicator time series
│   ├── fusion_transformer.py   # Cross-attention fusion of both embeddings
│   ├── policy_value_net.py     # Dual-head policy + value network
│   └── mcts.py                 # AlphaZero-style MCTS adapted for trading
├── env/
│   ├── trading_env.py          # Gym-compatible trading environment
│   ├── portfolio.py            # Portfolio state tracking (positions, cash, PnL)
│   └── reward.py               # Reward functions (Sharpe, Sortino, risk-adjusted)
├── training/
│   ├── self_play.py            # Self-play loop generating training data via MCTS
│   ├── trainer.py              # AlphaZero-style training orchestration
│   └── evaluation.py           # Walk-forward backtesting and metrics
├── live/
│   ├── broker_api.py           # Broker integration (Alpaca, ccxt/Binance)
│   ├── inference.py            # Real-time inference pipeline
│   └── risk_manager.py         # Position sizing, drawdown stops, volatility scaling
├── config/
│   └── config.yaml             # All hyperparameters and configuration
├── requirements.txt
└── README.md
```

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd rl-trading-agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### 1. Data Pipeline

```python
from data.fetcher import MarketDataFetcher
from data.indicators import compute_indicators
from data.preprocessor import prepare_features

# Fetch historical data
fetcher = MarketDataFetcher(source="yfinance")
df = fetcher.fetch("AAPL", timeframe="1h", period="2y")

# Compute technical indicators
df = compute_indicators(df)

# Prepare windowed features for model input
ohlcv_windows, indicator_windows = prepare_features(df, window_size=60)
```

### 2. Training

```python
import torch
from models.policy_value_net import PolicyValueNet
from env.trading_env import TradingEnv
from training.self_play import run_self_play_batch, ReplayBuffer
from training.trainer import AlphaZeroTrainer

# Initialize model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PolicyValueNet(n_indicators=15).to(device)

# Create environment with historical data
env = TradingEnv(ohlcv_data, indicator_data, price_data)

# AlphaZero training loop
trainer = AlphaZeroTrainer(model, learning_rate=1e-4)
replay_buffer = ReplayBuffer(capacity=500_000)

for iteration in range(50):
    # 1. Self-play: generate training data via MCTS
    replay_buffer = run_self_play_batch(env, model, device, n_episodes=1000,
                                        replay_buffer=replay_buffer)

    # 2. Train on replay buffer
    metrics = trainer.train_on_buffer(replay_buffer, n_epochs=10)

    # 3. Evaluate and accept/reject
    if iteration % 5 == 0:
        trainer.save_checkpoint(iteration, metrics)
```

### 3. Evaluation

```python
from training.evaluation import evaluate_model, plot_evaluation_results

# Walk-forward backtest on unseen data
metrics = evaluate_model(model, test_env, device, n_episodes=10)
print(f"Sharpe: {metrics['sharpe_ratio_mean']:.4f}")
print(f"Max DD: {metrics['max_drawdown_mean']:.2%}")
```

### 4. Live Trading

```python
from live.broker_api import create_broker
from live.inference import LiveInferencePipeline
from live.risk_manager import RiskManager

# Connect to broker (paper trading first!)
broker = create_broker("alpaca", api_key="...", secret_key="...",
                       base_url="https://paper-api.alpaca.markets")
broker.connect()

# Set up risk management
risk_mgr = RiskManager(max_position_pct=0.25, max_daily_drawdown=0.05)

# Run live inference
pipeline = LiveInferencePipeline(model, broker, risk_mgr, fetcher, symbol="AAPL")
pipeline.run_loop(interval_seconds=3600)
```

## Configuration

All hyperparameters are in `config/config.yaml`. Key settings:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `model.d_model` | 128 | Transformer embedding dimension |
| `model.n_heads` | 8 | Attention heads |
| `mcts.n_simulations_train` | 100 | MCTS simulations during training |
| `mcts.n_simulations_live` | 50 | MCTS simulations during live (reduced for speed) |
| `training.n_iterations` | 50 | AlphaZero training iterations |
| `risk.max_position_pct` | 0.25 | Max position size (25% of portfolio) |
| `risk.max_daily_drawdown` | 0.05 | Halt if daily loss > 5% |

## Training Pipeline

The system follows the **AlphaZero training paradigm** adapted for financial markets:

1. **Self-Play**: Agent trades against historical data using MCTS-guided decisions
2. **Data Collection**: (state, MCTS_policy, actual_return) tuples stored in replay buffer
3. **Network Training**: MSE(value) + CrossEntropy(policy) + L2 regularisation
4. **Evaluation**: Walk-forward backtest comparing new model vs. previous best
5. **Accept/Reject**: New model accepted only if Sharpe ratio improves on validation

### Key Adaptation: Market as Opponent

Unlike board games, the market is stochastic. The MCTS handles this by:
- **Training**: Using actual future bars for tree search (generating training targets, not features)
- **Live**: Using the value network for leaf evaluation without future rollouts

## Risk Management

Built-in protections for live trading:

- **Position sizing**: Max 25% of portfolio per position
- **Daily drawdown stop**: Halts trading if daily loss exceeds 5%
- **Portfolio drawdown stop**: Halts trading if total drawdown exceeds 20%
- **Volatility scaling**: Automatically reduces position size in high-vol regimes
- **Trade frequency limit**: Max 50 trades per day

## Data Leakage Prevention

Critical safeguard: the neural network inputs **never** include future data. While MCTS can look ahead in historical data during training (analogous to AlphaZero using game outcomes), the policy-value network sees only the current window. The MCTS search generates supervised training targets, not input features.

## Reward Functions

| Function | Formula | Best For |
|----------|---------|----------|
| **Differential Sharpe** (default) | Incremental Sharpe update | Stable training, risk-adjusted |
| **Log Return** | log(V_t / V_{t-1}) | Simple, additive |
| **Risk Adjusted** | return - λ × drawdown | Drawdown-sensitive |

## Dependencies

- Python 3.9+
- PyTorch 2.0+
- pandas, numpy, pandas-ta
- ccxt (crypto) / yfinance (equities)
- gymnasium
- matplotlib, tensorboard

## Important Notes

1. **Paper trade first**: Run in paper trading mode for 1-3 months before live trading
2. **Non-stationarity**: Markets change — retrain or fine-tune monthly
3. **Transaction costs**: Default 0.1% per trade; adjust for your broker
4. **Logging**: Every trade decision, MCTS statistics, and portfolio state is logged

## License

This project is for educational and research purposes.
