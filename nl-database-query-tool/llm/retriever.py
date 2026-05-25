"""
RAG retriever – orchestrates the end-to-end flow from user question to SQL.

Ties together schema introspection, vector search (FAISS), prompt
assembly, and LLM generation into a single callable pipeline.
"""

import logging

from db.connection import get_schema_info
from llm.client import OllamaClient
from llm.embeddings import OllamaEmbeddings
from llm.prompts import (
    SYSTEM_PROMPT,
    build_query_prompt,
    build_explanation_prompt,
    build_suggested_questions_prompt,
)
from security.validator import sanitize_sql
from vectordb.faiss_index import FaissIndex

logger = logging.getLogger(__name__)


def _format_schema(schema_info: list[dict]) -> str:
    """
    Convert raw schema metadata into a human-readable text block.

    Groups columns by table and lists their type and nullability.
    """
    tables: dict[str, list[str]] = {}
    for col in schema_info:
        tname = col["table_name"]
        nullable = "NULL" if col["is_nullable"] == "YES" else "NOT NULL"
        line = f"  {col['column_name']}  {col['data_type']}  {nullable}"
        tables.setdefault(tname, []).append(line)

    parts = []
    for table, columns in sorted(tables.items()):
        parts.append(f"Table: {table}")
        parts.extend(columns)
        parts.append("")  # blank line separator

    return "\n".join(parts)


class Retriever:
    """
    High-level RAG retriever for converting natural language to SQL.

    Attributes:
        llm: The Ollama LLM client for text generation.
        embeddings: The Ollama embedding client for vector search.
        index: The FAISS vector index for document retrieval.
    """

    def __init__(
        self,
        llm: OllamaClient | None = None,
        embeddings: OllamaEmbeddings | None = None,
        index: FaissIndex | None = None,
    ):
        self.llm = llm or OllamaClient()
        self.embeddings = embeddings or OllamaEmbeddings()
        self.index = index

    def generate_sql(self, question: str) -> str:
        """
        Convert a natural language question into a SQL query.

        Steps:
          1. Fetch the live database schema.
          2. Optionally retrieve relevant RAG documents.
          3. Build the prompt with schema + RAG context.
          4. Call the LLM to generate SQL.
          5. Sanitize the output.

        Args:
            question: The user's natural language question.

        Returns:
            A sanitized SQL SELECT query string.
        """
        # Step 1: get live schema
        schema_info = get_schema_info()
        schema_text = _format_schema(schema_info)

        # Step 2: retrieve RAG context if index is available
        rag_context = ""
        if self.index is not None:
            try:
                query_vec = self.embeddings.embed_text(question)
                results = self.index.search(query_vec)
                if results:
                    rag_context = "\n\n".join(
                        [doc["text"] for doc in results]
                    )
            except Exception as exc:
                logger.warning("RAG retrieval failed, proceeding without: %s", exc)

        # Step 3: assemble prompt
        prompt = build_query_prompt(question, schema_text, rag_context)

        # Step 4: generate
        logger.info("Generating SQL for question: %s", question)
        raw_sql = self.llm.generate(prompt, system=SYSTEM_PROMPT)

        # Step 5: sanitize
        sql = sanitize_sql(raw_sql)
        logger.info("Generated SQL: %s", sql)
        return sql

    def explain_results(self, sql: str, results_text: str) -> str:
        """
        Generate a plain-English explanation of a SQL query and its results.
        """
        prompt = build_explanation_prompt(sql, results_text)
        return self.llm.generate(prompt)

    def suggest_questions(self, count: int = 5) -> str:
        """
        Generate suggested analytical questions based on the current schema.
        """
        schema_info = get_schema_info()
        schema_text = _format_schema(schema_info)
        prompt = build_suggested_questions_prompt(schema_text, count)
        return self.llm.generate(prompt)
