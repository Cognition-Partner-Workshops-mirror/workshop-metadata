"""
AlphaZero-style training orchestration.

Manages the iterative self-play → training → evaluation loop:
  1. Run N self-play episodes to generate training data
  2. Sample mini-batches from the replay buffer
  3. Optimise the combined loss: MSE(value) + CE(policy) + L2 regularisation
  4. Every K iterations, evaluate the new model against the old model
  5. Accept the new model if it improves the Sharpe ratio on validation data

The loss function follows AlphaZero:
  L = (v - z)² - π·log(p) + c·‖θ‖²
where v = predicted value, z = actual return, π = MCTS policy, p = network policy.
"""

import copy
import logging
import os
from typing import Dict, List, Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim

from models.policy_value_net import PolicyValueNet
from training.self_play import ReplayBuffer, SelfPlaySample

logger = logging.getLogger(__name__)


class AlphaZeroTrainer:
    """
    Orchestrates the full AlphaZero training pipeline for the trading agent.

    Handles loss computation, gradient updates, model checkpointing,
    and the accept/reject logic for new model iterations.
    """

    def __init__(
        self,
        model: PolicyValueNet,
        learning_rate: float = 1e-4,
        weight_decay: float = 1e-4,
        batch_size: int = 256,
        device: torch.device = None,
        checkpoint_dir: str = "checkpoints",
    ):
        """
        Args:
            model: PolicyValueNet to train.
            learning_rate: Adam learning rate.
            weight_decay: L2 regularisation coefficient.
            batch_size: Training mini-batch size.
            device: Torch device (auto-detected if None).
            checkpoint_dir: Directory for saving model checkpoints.
        """
        self.device = device or torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.model = model.to(self.device)
        self.batch_size = batch_size
        self.checkpoint_dir = checkpoint_dir

        # Adam optimiser with weight decay for L2 regularisation
        self.optimizer = optim.Adam(
            self.model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay,
        )

        # Keep a copy of the best model for accept/reject comparison
        self.best_model_state = copy.deepcopy(self.model.state_dict())

        # Training statistics
        self.train_history: List[Dict[str, float]] = []

        os.makedirs(checkpoint_dir, exist_ok=True)

    def train_on_buffer(
        self,
        replay_buffer: ReplayBuffer,
        n_epochs: int = 10,
    ) -> Dict[str, float]:
        """
        Train the model on samples from the replay buffer.

        Runs multiple epochs over randomly sampled mini-batches,
        optimising the combined policy + value + regularisation loss.

        Args:
            replay_buffer: Buffer containing self-play samples.
            n_epochs: Number of passes over the buffer.

        Returns:
            Dict of average losses: {total_loss, policy_loss, value_loss}.
        """
        self.model.train()
        total_losses = []
        policy_losses = []
        value_losses = []

        for epoch in range(n_epochs):
            batch = replay_buffer.sample(self.batch_size)
            loss_dict = self._train_step(batch)

            total_losses.append(loss_dict["total_loss"])
            policy_losses.append(loss_dict["policy_loss"])
            value_losses.append(loss_dict["value_loss"])

        avg_metrics = {
            "total_loss": float(np.mean(total_losses)),
            "policy_loss": float(np.mean(policy_losses)),
            "value_loss": float(np.mean(value_losses)),
        }
        self.train_history.append(avg_metrics)
        logger.info(
            "Training: total_loss=%.4f, policy_loss=%.4f, value_loss=%.4f",
            avg_metrics["total_loss"],
            avg_metrics["policy_loss"],
            avg_metrics["value_loss"],
        )
        return avg_metrics

    def _train_step(self, batch: List[SelfPlaySample]) -> Dict[str, float]:
        """
        Execute a single gradient update on a mini-batch.

        Loss = MSE(value_pred, value_target) + CrossEntropy(policy_pred, mcts_policy)
        (L2 regularisation is handled by the Adam weight_decay parameter.)

        Args:
            batch: List of SelfPlaySample objects.

        Returns:
            Dict with individual loss components.
        """
        # Collate batch into tensors
        ohlcv_batch = torch.FloatTensor(
            np.array([s.ohlcv for s in batch])
        ).to(self.device)
        indicator_batch = torch.FloatTensor(
            np.array([s.indicators for s in batch])
        ).to(self.device)
        mcts_policies = torch.FloatTensor(
            np.array([s.mcts_policy for s in batch])
        ).to(self.device)
        value_targets = torch.FloatTensor(
            np.array([s.value_target for s in batch])
        ).unsqueeze(1).to(self.device)

        # Forward pass
        policy_logits, value_pred = self.model(ohlcv_batch, indicator_batch)

        # Value loss: MSE between predicted and actual returns
        value_loss = F.mse_loss(value_pred, value_targets)

        # Policy loss: cross-entropy between network output and MCTS policy
        log_probs = F.log_softmax(policy_logits, dim=-1)
        policy_loss = -torch.mean(torch.sum(mcts_policies * log_probs, dim=-1))

        # Combined loss (L2 reg handled by optimizer weight_decay)
        total_loss = value_loss + policy_loss

        # Backward pass and update
        self.optimizer.zero_grad()
        total_loss.backward()
        # Gradient clipping to prevent exploding gradients
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
        self.optimizer.step()

        return {
            "total_loss": total_loss.item(),
            "policy_loss": policy_loss.item(),
            "value_loss": value_loss.item(),
        }

    def accept_or_reject(self, new_sharpe: float, old_sharpe: float) -> bool:
        """
        Accept the new model if it outperforms the old one on validation.

        Args:
            new_sharpe: Sharpe ratio of the current (new) model on validation data.
            old_sharpe: Sharpe ratio of the previous best model.

        Returns:
            True if the new model is accepted, False if rejected (rolled back).
        """
        if new_sharpe > old_sharpe:
            # Accept: save new model as best
            self.best_model_state = copy.deepcopy(self.model.state_dict())
            logger.info(
                "New model ACCEPTED: Sharpe %.4f > %.4f", new_sharpe, old_sharpe
            )
            return True
        else:
            # Reject: roll back to previous best
            self.model.load_state_dict(self.best_model_state)
            logger.info(
                "New model REJECTED: Sharpe %.4f <= %.4f — rolling back",
                new_sharpe, old_sharpe,
            )
            return False

    def save_checkpoint(self, iteration: int, metrics: Optional[Dict] = None) -> str:
        """
        Save model checkpoint with iteration number and optional metrics.

        Args:
            iteration: Training iteration number.
            metrics: Optional performance metrics to store alongside weights.

        Returns:
            Path to the saved checkpoint file.
        """
        path = os.path.join(self.checkpoint_dir, f"model_iter_{iteration:04d}.pt")
        checkpoint = {
            "iteration": iteration,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "best_model_state_dict": self.best_model_state,
            "train_history": self.train_history,
        }
        if metrics:
            checkpoint["metrics"] = metrics
        torch.save(checkpoint, path)
        logger.info("Checkpoint saved: %s", path)
        return path

    def load_checkpoint(self, path: str) -> Dict:
        """
        Load a model checkpoint.

        Args:
            path: Path to the checkpoint file.

        Returns:
            Checkpoint dictionary.
        """
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        if "best_model_state_dict" in checkpoint:
            self.best_model_state = checkpoint["best_model_state_dict"]
        if "train_history" in checkpoint:
            self.train_history = checkpoint["train_history"]
        logger.info("Checkpoint loaded: %s (iteration %d)", path, checkpoint.get("iteration", -1))
        return checkpoint
