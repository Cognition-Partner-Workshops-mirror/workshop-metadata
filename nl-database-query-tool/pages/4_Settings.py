"""
Settings page – view and manage application configuration.

Displays current configuration values, Ollama model information,
and provides tools for testing connectivity.
"""

import streamlit as st

from config.settings import (
    APP_TITLE,
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_DB,
    OLLAMA_BASE_URL,
    OLLAMA_LLM_MODEL,
    OLLAMA_EMBED_MODEL,
    OLLAMA_TEMPERATURE,
    FAISS_EMBEDDING_DIM,
    FAISS_TOP_K,
    SQL_MAX_ROWS,
    SQL_BLOCKED_KEYWORDS,
)
from db.connection import test_connection, get_table_names
from llm.client import OllamaClient
from llm.embeddings import OllamaEmbeddings

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title=f"{APP_TITLE} – Settings",
    page_icon="\u2699\ufe0f",
    layout="wide",
)

st.title("\u2699\ufe0f Settings")
st.markdown("View current application configuration and test connectivity.")


def render_settings() -> None:
    """Render the settings and diagnostics page."""

    # ---------------------------------------------------------------------------
    # Database configuration
    # ---------------------------------------------------------------------------
    st.subheader("Database Configuration")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"**Host:** `{POSTGRES_HOST}`")
        st.markdown(f"**Port:** `{POSTGRES_PORT}`")
        st.markdown(f"**Database:** `{POSTGRES_DB}`")
    with col2:
        st.markdown(f"**User:** `{POSTGRES_USER}`")
        st.markdown(f"**Max Rows:** `{SQL_MAX_ROWS}`")
        st.markdown(f"**Blocked Keywords:** `{', '.join(SQL_BLOCKED_KEYWORDS)}`")

    # Connection test
    if st.button("Test Database Connection"):
        if test_connection():
            tables = get_table_names()
            st.success(f"Connected! Found {len(tables)} tables.")
        else:
            st.error("Connection failed. Check database settings.")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Ollama configuration
    # ---------------------------------------------------------------------------
    st.subheader("Ollama Configuration")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"**Base URL:** `{OLLAMA_BASE_URL}`")
        st.markdown(f"**LLM Model:** `{OLLAMA_LLM_MODEL}`")
    with col2:
        st.markdown(f"**Embedding Model:** `{OLLAMA_EMBED_MODEL}`")
        st.markdown(f"**Temperature:** `{OLLAMA_TEMPERATURE}`")

    # Model availability test
    if st.button("Test Ollama Connection"):
        llm = OllamaClient()
        if llm.is_available():
            models = llm.list_models()
            st.success(f"Connected! Available models: {', '.join(models)}")
        else:
            st.error("Ollama is not reachable or the model is not loaded.")

    # Embedding test
    if st.button("Test Embeddings"):
        embeddings = OllamaEmbeddings()
        if embeddings.is_available():
            dim = embeddings.get_dimension()
            st.success(f"Embeddings working! Dimension: {dim}")
        else:
            st.error("Embedding service is not available.")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # FAISS configuration
    # ---------------------------------------------------------------------------
    st.subheader("FAISS Configuration")
    st.markdown(f"**Embedding Dimension:** `{FAISS_EMBEDDING_DIM}`")
    st.markdown(f"**Top-K Results:** `{FAISS_TOP_K}`")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Security configuration
    # ---------------------------------------------------------------------------
    st.subheader("Security Configuration")
    st.markdown(f"**Max Rows per Query:** `{SQL_MAX_ROWS}`")
    st.markdown("**Blocked SQL Keywords:**")
    for kw in SQL_BLOCKED_KEYWORDS:
        st.markdown(f"- `{kw.strip()}`")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Environment info
    # ---------------------------------------------------------------------------
    st.subheader("Environment")
    st.markdown(
        "All configuration is managed via environment variables. "
        "See `config/settings.py` for the full list of supported variables."
    )
    st.info(
        "To change settings, update the environment variables in your "
        "`.env` file or Docker Compose configuration and restart the app."
    )


# Run the page
render_settings()
