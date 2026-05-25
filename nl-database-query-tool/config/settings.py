"""
Application settings and configuration management.

Centralizes all environment-based configuration for the Natural Language
Database Query tool. Uses environment variables with sensible defaults
for local development.
"""

import os


# ---------------------------------------------------------------------------
# PostgreSQL connection settings
# ---------------------------------------------------------------------------
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_USER = os.getenv("POSTGRES_USER", "nlquery")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "nlquery")
POSTGRES_DB = os.getenv("POSTGRES_DB", "nlquery")

# SQLAlchemy connection URL assembled from the individual components above
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}",
)

# ---------------------------------------------------------------------------
# Ollama LLM settings
# ---------------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Model used for natural-language-to-SQL generation
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3")

# Model used for computing text embeddings (for RAG / FAISS)
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# Temperature controls randomness of LLM output (0 = deterministic)
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.0"))

# ---------------------------------------------------------------------------
# FAISS / vector store settings
# ---------------------------------------------------------------------------
# Directory where the FAISS index and document store are persisted
FAISS_INDEX_DIR = os.getenv("FAISS_INDEX_DIR", "./vectordb/index_store")

# Embedding dimension must match the model output (nomic-embed-text = 768)
FAISS_EMBEDDING_DIM = int(os.getenv("FAISS_EMBEDDING_DIM", "768"))

# Number of documents to retrieve for RAG context
FAISS_TOP_K = int(os.getenv("FAISS_TOP_K", "5"))

# ---------------------------------------------------------------------------
# SQL validation settings
# ---------------------------------------------------------------------------
# Maximum number of rows a generated query is allowed to return
SQL_MAX_ROWS = int(os.getenv("SQL_MAX_ROWS", "1000"))

# Comma-separated list of SQL keywords that are always blocked
SQL_BLOCKED_KEYWORDS = os.getenv(
    "SQL_BLOCKED_KEYWORDS",
    "DROP,DELETE,INSERT,UPDATE,ALTER,CREATE,TRUNCATE,GRANT,REVOKE,EXEC,EXECUTE",
).split(",")

# ---------------------------------------------------------------------------
# Streamlit UI settings
# ---------------------------------------------------------------------------
APP_TITLE = os.getenv("APP_TITLE", "Natural Language Database Query")
APP_ICON = os.getenv("APP_ICON", "\U0001F50D")  # magnifying glass emoji
