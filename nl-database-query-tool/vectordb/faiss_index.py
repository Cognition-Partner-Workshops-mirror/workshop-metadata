"""
FAISS vector index management.

Provides a wrapper around a FAISS flat L2 index for storing and
retrieving document embeddings. Supports persistence to disk so the
index survives application restarts.
"""

import logging
import os

import faiss
import numpy as np

from config.settings import FAISS_EMBEDDING_DIM, FAISS_INDEX_DIR, FAISS_TOP_K
from vectordb.docstore import DocStore

logger = logging.getLogger(__name__)


class FaissIndex:
    """
    FAISS-based vector index with an accompanying document store.

    The index stores embedding vectors while the DocStore holds the
    original text and metadata for each vector. Both are persisted
    together to the same directory.

    Attributes:
        dimension: Embedding vector dimension.
        index_dir: Directory for persisting the index and docstore.
        top_k: Default number of results to return on search.
        index: The underlying FAISS index object.
        docstore: Parallel document metadata store.
    """

    def __init__(
        self,
        dimension: int = FAISS_EMBEDDING_DIM,
        index_dir: str = FAISS_INDEX_DIR,
        top_k: int = FAISS_TOP_K,
    ):
        self.dimension = dimension
        self.index_dir = index_dir
        self.top_k = top_k

        # Ensure the persistence directory exists
        os.makedirs(self.index_dir, exist_ok=True)

        # Initialize or load the FAISS index
        self.index = self._load_or_create_index()
        self.docstore = DocStore(index_dir=self.index_dir)

    def _load_or_create_index(self) -> faiss.IndexFlatL2:
        """
        Load the FAISS index from disk if it exists, otherwise create new.
        """
        index_path = os.path.join(self.index_dir, "faiss.index")
        if os.path.exists(index_path):
            logger.info("Loading existing FAISS index from %s", index_path)
            return faiss.read_index(index_path)
        else:
            logger.info(
                "Creating new FAISS index (dim=%d)", self.dimension
            )
            return faiss.IndexFlatL2(self.dimension)

    def add(self, embeddings: np.ndarray, documents: list[dict]) -> None:
        """
        Add vectors and their associated documents to the index.

        Args:
            embeddings: 2-D array of shape (n, dimension).
            documents: List of dicts, each containing at least a "text" key.
                       Additional metadata keys are preserved.
        """
        if embeddings.shape[0] != len(documents):
            raise ValueError(
                f"Mismatch: {embeddings.shape[0]} vectors vs "
                f"{len(documents)} documents"
            )

        # Record starting ID for the docstore
        start_id = self.index.ntotal
        self.index.add(embeddings.astype(np.float32))

        # Store documents with their corresponding index IDs
        for i, doc in enumerate(documents):
            self.docstore.add(start_id + i, doc)

        logger.info("Added %d vectors (total: %d)", len(documents), self.index.ntotal)

    def search(
        self, query_vector: np.ndarray, top_k: int | None = None
    ) -> list[dict]:
        """
        Search for the nearest neighbors of a query vector.

        Args:
            query_vector: 1-D array of shape (dimension,).
            top_k: Number of results to return (defaults to self.top_k).

        Returns:
            List of document dicts enriched with a "score" key (L2 distance).
        """
        k = top_k or self.top_k
        if self.index.ntotal == 0:
            return []

        # FAISS expects a 2-D input
        query = query_vector.reshape(1, -1).astype(np.float32)
        distances, indices = self.index.search(query, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue  # FAISS returns -1 for empty slots
            doc = self.docstore.get(int(idx))
            if doc is not None:
                doc_copy = dict(doc)
                doc_copy["score"] = float(dist)
                results.append(doc_copy)

        return results

    def save(self) -> None:
        """
        Persist the FAISS index and docstore to disk.
        """
        index_path = os.path.join(self.index_dir, "faiss.index")
        faiss.write_index(self.index, index_path)
        self.docstore.save()
        logger.info("Index saved to %s (%d vectors)", self.index_dir, self.index.ntotal)

    def clear(self) -> None:
        """
        Reset the index and docstore to empty state.
        """
        self.index = faiss.IndexFlatL2(self.dimension)
        self.docstore.clear()
        logger.info("Index cleared")

    @property
    def total_vectors(self) -> int:
        """Return the total number of vectors in the index."""
        return self.index.ntotal
