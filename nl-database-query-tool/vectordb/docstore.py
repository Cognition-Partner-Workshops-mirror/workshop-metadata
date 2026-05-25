"""
Document store for FAISS vector index.

Maintains a parallel mapping from integer FAISS IDs to document metadata.
The store is persisted as a JSON file alongside the FAISS index.
"""

import json
import logging
import os

logger = logging.getLogger(__name__)


class DocStore:
    """
    Simple JSON-backed document store keyed by integer FAISS vector IDs.

    Each document is a dict with at least a "text" key. Additional metadata
    fields (doc_type, source, etc.) are preserved as-is.

    Attributes:
        index_dir: Directory where the docstore JSON file is written.
        store: In-memory dict mapping string IDs to document dicts.
    """

    FILENAME = "docstore.json"

    def __init__(self, index_dir: str):
        self.index_dir = index_dir
        self.store: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        """
        Load the docstore from disk if the file exists.
        """
        path = os.path.join(self.index_dir, self.FILENAME)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                self.store = json.load(f)
            logger.info("Loaded docstore with %d documents", len(self.store))

    def add(self, doc_id: int, document: dict) -> None:
        """
        Add a document to the store.

        Args:
            doc_id: Integer ID matching the FAISS vector index position.
            document: Dict containing at least a "text" key.
        """
        self.store[str(doc_id)] = document

    def get(self, doc_id: int) -> dict | None:
        """
        Retrieve a document by its FAISS vector ID.

        Returns None if the ID is not found.
        """
        return self.store.get(str(doc_id))

    def save(self) -> None:
        """
        Persist the entire docstore to disk as JSON.
        """
        path = os.path.join(self.index_dir, self.FILENAME)
        os.makedirs(self.index_dir, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.store, f, indent=2, ensure_ascii=False)
        logger.info("Docstore saved (%d documents)", len(self.store))

    def clear(self) -> None:
        """
        Remove all documents from the store (in memory and on disk).
        """
        self.store.clear()
        path = os.path.join(self.index_dir, self.FILENAME)
        if os.path.exists(path):
            os.remove(path)
        logger.info("Docstore cleared")

    @property
    def count(self) -> int:
        """Return the number of documents in the store."""
        return len(self.store)
