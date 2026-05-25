"""
Prompt templates for the Natural Language Database Query tool.

Contains all prompt engineering templates used by the LLM to convert
natural language questions into SQL queries. Separating prompts into
their own module makes it easy to iterate on prompt quality without
touching application logic.
"""

# ---------------------------------------------------------------------------
# System prompt: sets the persona and constraints for the LLM
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an expert SQL analyst. Your job is to convert
natural language questions into valid PostgreSQL SELECT queries.

Rules you MUST follow:
1. Generate ONLY a single SELECT statement – no DDL, DML, or multi-statement queries.
2. Never use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE, GRANT, REVOKE, EXEC, or EXECUTE.
3. Use only tables and columns from the provided schema.
4. Always qualify ambiguous column names with the table name.
5. If the question cannot be answered with the available schema, say so – do NOT hallucinate tables or columns.
6. Return ONLY the SQL query, no explanations, no markdown fences.
7. End every query with a semicolon.
"""

# ---------------------------------------------------------------------------
# Schema context template: injected per-request with live schema info
# ---------------------------------------------------------------------------
SCHEMA_CONTEXT_TEMPLATE = """
=== DATABASE SCHEMA ===
{schema_text}
=== END SCHEMA ===
"""

# ---------------------------------------------------------------------------
# RAG context template: injected with relevant document snippets
# ---------------------------------------------------------------------------
RAG_CONTEXT_TEMPLATE = """
=== RELEVANT CONTEXT ===
{rag_context}
=== END CONTEXT ===
"""

# ---------------------------------------------------------------------------
# Main query prompt template
# ---------------------------------------------------------------------------
QUERY_PROMPT_TEMPLATE = """Given the database schema and context below, write a PostgreSQL SELECT query to answer the user's question.

{schema_context}

{rag_context}

User question: {question}

SQL query:"""

# ---------------------------------------------------------------------------
# Explanation prompt: used to generate a human-readable explanation of
# the SQL query and its results
# ---------------------------------------------------------------------------
EXPLANATION_PROMPT_TEMPLATE = """You are a helpful data analyst. Explain the following SQL query and its results in plain English. Be concise.

SQL Query:
{sql}

Query Results (first {num_rows} rows):
{results}

Explanation:"""

# ---------------------------------------------------------------------------
# Suggested questions prompt: generates follow-up questions based on schema
# ---------------------------------------------------------------------------
SUGGESTED_QUESTIONS_TEMPLATE = """Given the following database schema, suggest {count} interesting analytical questions that a business user might ask. Return them as a numbered list.

{schema_text}

Suggested questions:"""


def build_query_prompt(
    question: str,
    schema_text: str,
    rag_context: str = "",
) -> str:
    """
    Assemble the full prompt for SQL generation.

    Args:
        question: The user's natural language question.
        schema_text: Formatted database schema information.
        rag_context: Optional RAG context from document retrieval.

    Returns:
        The fully rendered prompt string ready for the LLM.
    """
    schema_section = SCHEMA_CONTEXT_TEMPLATE.format(schema_text=schema_text)
    rag_section = ""
    if rag_context:
        rag_section = RAG_CONTEXT_TEMPLATE.format(rag_context=rag_context)

    return QUERY_PROMPT_TEMPLATE.format(
        schema_context=schema_section,
        rag_context=rag_section,
        question=question,
    )


def build_explanation_prompt(
    sql: str,
    results: str,
    num_rows: int = 10,
) -> str:
    """
    Build the prompt for explaining a SQL query and its results.
    """
    return EXPLANATION_PROMPT_TEMPLATE.format(
        sql=sql, results=results, num_rows=num_rows
    )


def build_suggested_questions_prompt(
    schema_text: str,
    count: int = 5,
) -> str:
    """
    Build the prompt for generating suggested analytical questions.
    """
    return SUGGESTED_QUESTIONS_TEMPLATE.format(
        schema_text=schema_text, count=count
    )
