"""
Document ingestion pipeline for the RAG vector store.

Supports 5 document types that provide contextual knowledge to the LLM:
  1. Schema descriptions – human-readable notes about tables/columns
  2. SQL examples – example question-to-SQL pairs
  3. Business glossary – domain-specific term definitions
  4. Query patterns – common analytical query templates
  5. Documentation – free-form reference documentation

Each document type is ingested, chunked, embedded, and stored in the
FAISS index for retrieval-augmented generation.
"""

import logging
from dataclasses import dataclass, field

from llm.embeddings import OllamaEmbeddings
from vectordb.faiss_index import FaissIndex

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported document types (the 5 types for RAG)
# ---------------------------------------------------------------------------
DOC_TYPE_SCHEMA = "schema_description"
DOC_TYPE_SQL_EXAMPLE = "sql_example"
DOC_TYPE_GLOSSARY = "business_glossary"
DOC_TYPE_PATTERN = "query_pattern"
DOC_TYPE_DOCUMENTATION = "documentation"

SUPPORTED_DOC_TYPES = [
    DOC_TYPE_SCHEMA,
    DOC_TYPE_SQL_EXAMPLE,
    DOC_TYPE_GLOSSARY,
    DOC_TYPE_PATTERN,
    DOC_TYPE_DOCUMENTATION,
]


@dataclass
class Document:
    """
    A single document to be ingested into the vector store.

    Attributes:
        text: The main content of the document.
        doc_type: One of the 5 supported document types.
        source: Optional source identifier (file path, URL, etc.).
        metadata: Additional key-value pairs stored alongside the text.
    """
    text: str
    doc_type: str
    source: str = ""
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Serialize to a dict for storage in the docstore."""
        return {
            "text": self.text,
            "doc_type": self.doc_type,
            "source": self.source,
            **self.metadata,
        }


# ---------------------------------------------------------------------------
# Predefined seed documents – loaded on first run to bootstrap the RAG store
# ---------------------------------------------------------------------------
SEED_DOCUMENTS = [
    # --- Schema descriptions ---
    Document(
        text=(
            "The 'employees' table stores employee information including "
            "name, email, department, hire_date, and salary. It is the "
            "primary table for HR analytics."
        ),
        doc_type=DOC_TYPE_SCHEMA,
        source="seed",
    ),
    Document(
        text=(
            "The 'departments' table contains department names and their "
            "managers. It links to employees via a department_id foreign key."
        ),
        doc_type=DOC_TYPE_SCHEMA,
        source="seed",
    ),
    # --- SQL examples ---
    Document(
        text=(
            "Question: How many employees are in each department?\n"
            "SQL: SELECT d.name AS department, COUNT(e.id) AS employee_count "
            "FROM employees e JOIN departments d ON e.department_id = d.id "
            "GROUP BY d.name ORDER BY employee_count DESC;"
        ),
        doc_type=DOC_TYPE_SQL_EXAMPLE,
        source="seed",
    ),
    Document(
        text=(
            "Question: What is the average salary by department?\n"
            "SQL: SELECT d.name AS department, AVG(e.salary) AS avg_salary "
            "FROM employees e JOIN departments d ON e.department_id = d.id "
            "GROUP BY d.name ORDER BY avg_salary DESC;"
        ),
        doc_type=DOC_TYPE_SQL_EXAMPLE,
        source="seed",
    ),
    # --- Business glossary ---
    Document(
        text=(
            "FTE (Full-Time Equivalent): A unit that measures the workload "
            "of an employed person in a way that makes workloads comparable. "
            "1.0 FTE = full-time, 0.5 FTE = half-time."
        ),
        doc_type=DOC_TYPE_GLOSSARY,
        source="seed",
    ),
    Document(
        text=(
            "Headcount: The total number of active employees in the "
            "organization or a specific department at a given point in time."
        ),
        doc_type=DOC_TYPE_GLOSSARY,
        source="seed",
    ),
    # --- Query patterns ---
    Document(
        text=(
            "Pattern: Top-N analysis\n"
            "Template: SELECT column, AGG(metric) FROM table "
            "GROUP BY column ORDER BY AGG(metric) DESC LIMIT N;\n"
            "Use when: The user asks for 'top', 'highest', 'most', or 'best'."
        ),
        doc_type=DOC_TYPE_PATTERN,
        source="seed",
    ),
    Document(
        text=(
            "Pattern: Time-series trend\n"
            "Template: SELECT DATE_TRUNC('month', date_col) AS period, "
            "AGG(metric) FROM table GROUP BY period ORDER BY period;\n"
            "Use when: The user asks about trends, changes over time, or "
            "monthly/yearly breakdowns."
        ),
        doc_type=DOC_TYPE_PATTERN,
        source="seed",
    ),
    # --- Documentation ---
    Document(
        text=(
            "The Natural Language Database Query tool converts plain English "
            "questions into SQL queries. It uses a retrieval-augmented "
            "generation (RAG) approach: relevant context documents are "
            "fetched from a FAISS vector index and included in the LLM "
            "prompt alongside the live database schema."
        ),
        doc_type=DOC_TYPE_DOCUMENTATION,
        source="seed",
    ),
    Document(
        text=(
            "Security policy: Only SELECT queries are allowed. All generated "
            "SQL passes through a validator that blocks DDL/DML keywords, "
            "comment injection, and multiple statements. A configurable row "
            "limit is enforced to prevent runaway queries."
        ),
        doc_type=DOC_TYPE_DOCUMENTATION,
        source="seed",
    ),
]


class IngestionPipeline:
    """
    Pipeline for ingesting documents into the FAISS vector store.

    Handles embedding generation and batch insertion. Supports both
    individual and bulk document ingestion.

    Attributes:
        index: The FAISS vector index instance.
        embeddings: The Ollama embedding client.
    """

    def __init__(
        self,
        index: FaissIndex,
        embeddings: OllamaEmbeddings | None = None,
    ):
        self.index = index
        self.embeddings = embeddings or OllamaEmbeddings()

    def ingest(self, documents: list[Document]) -> int:
        """
        Embed and store a batch of documents.

        Args:
            documents: List of Document objects to ingest.

        Returns:
            The number of documents successfully ingested.
        """
        if not documents:
            return 0

        # Validate document types
        for doc in documents:
            if doc.doc_type not in SUPPORTED_DOC_TYPES:
                logger.warning(
                    "Unknown doc_type '%s' – ingesting anyway", doc.doc_type
                )

        # Generate embeddings for all document texts
        texts = [doc.text for doc in documents]
        logger.info("Embedding %d documents...", len(texts))
        vectors = self.embeddings.embed_batch(texts)

        # Store in FAISS + docstore
        doc_dicts = [doc.to_dict() for doc in documents]
        self.index.add(vectors, doc_dicts)

        # Persist to disk
        self.index.save()

        logger.info("Ingested %d documents", len(documents))
        return len(documents)

    def ingest_seed_documents(self) -> int:
        """
        Load the predefined seed documents into the index.

        Only runs if the index is empty (to avoid duplicate seeds).

        Returns:
            Number of seed documents ingested (0 if skipped).
        """
        if self.index.total_vectors > 0:
            logger.info(
                "Index already has %d vectors – skipping seed ingestion",
                self.index.total_vectors,
            )
            return 0

        logger.info("Ingesting %d seed documents...", len(SEED_DOCUMENTS))
        return self.ingest(SEED_DOCUMENTS)

    def ingest_text(
        self,
        text: str,
        doc_type: str = DOC_TYPE_DOCUMENTATION,
        source: str = "manual",
    ) -> int:
        """
        Convenience method to ingest a single text string.
        """
        doc = Document(text=text, doc_type=doc_type, source=source)
        return self.ingest([doc])
