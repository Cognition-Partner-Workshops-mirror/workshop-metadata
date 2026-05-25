"""
Embedding generation via Ollama.

Uses the Ollama /api/embeddings endpoint to convert text into dense
vector representations suitable for FAISS similarity search.
"""

import logging
from typing import Union

import numpy as np
import requests

from config.settings import OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL

logger = logging.getLogger(__name__)


class OllamaEmbeddings:
    """
    Generate text embeddings using an Ollama embedding model.

    Attributes:
        base_url: Base URL for the Ollama API.
        model: Name of the embedding model (e.g. nomic-embed-text).
    """

    def __init__(
        self,
        base_url: str = OLLAMA_BASE_URL,
        model: str = OLLAMA_EMBED_MODEL,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate an embedding vector for a single text string.

        Args:
            text: The input text to embed.

        Returns:
            A 1-D numpy array of float32 values.
        """
        payload = {"model": self.model, "prompt": text}
        try:
            resp = requests.post(
                f"{self.base_url}/api/embeddings",
                json=payload,
                timeout=30,
            )
            resp.raise_for_status()
            embedding = resp.json().get("embedding", [])
            return np.array(embedding, dtype=np.float32)
        except requests.RequestException as exc:
            logger.error("Embedding request failed: %s", exc)
            raise

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.

        Ollama does not natively support batch embedding, so this method
        iterates over the texts individually.

        Args:
            texts: List of input strings.

        Returns:
            A 2-D numpy array of shape (len(texts), embedding_dim).
        """
        embeddings = [self.embed_text(t) for t in texts]
        return np.vstack(embeddings)

    def get_dimension(self) -> int:
        """
        Determine the embedding dimension by embedding a probe string.

        Returns:
            The integer dimension of the embedding vector.
        """
        probe = self.embed_text("dimension probe")
        return probe.shape[0]

    def is_available(self) -> bool:
        """
        Check if the embedding model is reachable and functional.
        """
        try:
            vec = self.embed_text("test")
            return vec.shape[0] > 0
        except Exception:
            return False
