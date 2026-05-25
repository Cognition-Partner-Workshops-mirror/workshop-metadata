"""
Ollama LLM client wrapper.

Provides a thin abstraction over the Ollama REST API for text generation.
Supports both streaming and non-streaming completions.
"""

import json
import logging
from typing import Generator

import requests

from config.settings import (
    OLLAMA_BASE_URL,
    OLLAMA_LLM_MODEL,
    OLLAMA_TEMPERATURE,
)

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    Client for interacting with an Ollama LLM instance.

    Attributes:
        base_url: Base URL for the Ollama API (e.g. http://localhost:11434).
        model: Name of the model to use for generation.
        temperature: Sampling temperature for generation.
    """

    def __init__(
        self,
        base_url: str = OLLAMA_BASE_URL,
        model: str = OLLAMA_LLM_MODEL,
        temperature: float = OLLAMA_TEMPERATURE,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature

    def generate(self, prompt: str, system: str = "") -> str:
        """
        Send a prompt to Ollama and return the full generated response.

        Args:
            prompt: The user prompt / question.
            system: Optional system-level instruction for the model.

        Returns:
            The model's complete response as a string.
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": self.temperature},
        }
        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
        except requests.RequestException as exc:
            logger.error("Ollama generate request failed: %s", exc)
            raise

    def generate_stream(
        self, prompt: str, system: str = ""
    ) -> Generator[str, None, None]:
        """
        Stream tokens from Ollama as they are generated.

        Yields individual text chunks for real-time display in the UI.
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": True,
            "options": {"temperature": self.temperature},
        }
        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120,
                stream=True,
            )
            resp.raise_for_status()
            for line in resp.iter_lines(decode_unicode=True):
                if line:
                    chunk = json.loads(line)
                    token = chunk.get("response", "")
                    if token:
                        yield token
        except requests.RequestException as exc:
            logger.error("Ollama streaming request failed: %s", exc)
            raise

    def is_available(self) -> bool:
        """
        Check whether the Ollama server is reachable and the model is loaded.

        Returns True if the API responds, False otherwise.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            # Check if the configured model is available
            return any(self.model in m for m in models)
        except requests.RequestException:
            return False

    def list_models(self) -> list[str]:
        """
        Return the list of model names currently available on the Ollama server.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            resp.raise_for_status()
            return [m["name"] for m in resp.json().get("models", [])]
        except requests.RequestException:
            return []
