"""
Natural Language Database Query – main Streamlit application.

This is the entry point for the Streamlit app. It provides:
  - A sidebar with connection status and navigation
  - The main query interface for asking questions in natural language
  - Display of generated SQL, results table, and explanations
  - Chat-style conversation history within the session

Run with: streamlit run app.py
"""

import logging

import pandas as pd
import streamlit as st

from config.settings import APP_TITLE, APP_ICON
from db.connection import test_connection, get_schema_info, get_table_names
from db.executor import execute_query, QueryExecutionError
from llm.client import OllamaClient
from llm.embeddings import OllamaEmbeddings
from llm.retriever import Retriever
from security.validator import sanitize_sql
from vectordb.faiss_index import FaissIndex
from vectordb.ingestion import IngestionPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded",
)


# ---------------------------------------------------------------------------
# Session state initialization
# ---------------------------------------------------------------------------
def init_session_state() -> None:
    """Initialize all required session state variables."""
    if "messages" not in st.session_state:
        # Chat history: list of dicts with role, content, sql, results, etc.
        st.session_state.messages = []
    if "db_connected" not in st.session_state:
        st.session_state.db_connected = False
    if "ollama_available" not in st.session_state:
        st.session_state.ollama_available = False
    if "retriever" not in st.session_state:
        st.session_state.retriever = None
    if "index_initialized" not in st.session_state:
        st.session_state.index_initialized = False


init_session_state()


# ---------------------------------------------------------------------------
# Service initialization
# ---------------------------------------------------------------------------
@st.cache_resource
def get_faiss_index() -> FaissIndex:
    """Create and return the FAISS index (cached across reruns)."""
    return FaissIndex()


@st.cache_resource
def get_llm_client() -> OllamaClient:
    """Create and return the Ollama LLM client (cached across reruns)."""
    return OllamaClient()


@st.cache_resource
def get_embeddings_client() -> OllamaEmbeddings:
    """Create and return the Ollama embeddings client (cached across reruns)."""
    return OllamaEmbeddings()


def initialize_services() -> None:
    """
    Check connectivity to PostgreSQL and Ollama, and initialize the
    retriever and vector index if both are available.
    """
    # Check database connection
    st.session_state.db_connected = test_connection()

    # Check Ollama availability
    llm = get_llm_client()
    st.session_state.ollama_available = llm.is_available()

    # Initialize the retriever if both services are up
    if st.session_state.db_connected and st.session_state.ollama_available:
        index = get_faiss_index()
        embeddings = get_embeddings_client()

        # Seed the vector index on first run
        if not st.session_state.index_initialized:
            try:
                pipeline = IngestionPipeline(index=index, embeddings=embeddings)
                pipeline.ingest_seed_documents()
                st.session_state.index_initialized = True
            except Exception as exc:
                logger.warning("Seed ingestion failed: %s", exc)

        st.session_state.retriever = Retriever(
            llm=llm, embeddings=embeddings, index=index
        )


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
def render_sidebar() -> None:
    """Render the sidebar with connection status and quick info."""
    with st.sidebar:
        st.title(f"{APP_ICON} {APP_TITLE}")
        st.markdown("---")

        # Connection status indicators
        st.subheader("Connection Status")

        # PostgreSQL status
        db_status = (
            "\u2705 Connected" if st.session_state.db_connected else "\u274c Disconnected"
        )
        st.markdown(f"**PostgreSQL:** {db_status}")

        # Ollama status
        llm_status = (
            "\u2705 Available" if st.session_state.ollama_available else "\u274c Unavailable"
        )
        st.markdown(f"**Ollama LLM:** {llm_status}")

        # FAISS index status
        index = get_faiss_index()
        st.markdown(f"**FAISS Index:** {index.total_vectors} vectors")

        st.markdown("---")

        # Database schema overview (if connected)
        if st.session_state.db_connected:
            st.subheader("Database Tables")
            tables = get_table_names()
            if tables:
                for table in tables:
                    st.markdown(f"- `{table}`")
            else:
                st.info("No tables found in the public schema.")

        st.markdown("---")

        # Refresh button
        if st.button("Refresh Status", use_container_width=True):
            initialize_services()
            st.rerun()

        # Clear chat button
        if st.button("Clear Chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()


# ---------------------------------------------------------------------------
# Main query interface
# ---------------------------------------------------------------------------
def render_main() -> None:
    """Render the main content area with chat interface."""
    st.title(f"{APP_ICON} {APP_TITLE}")
    st.markdown(
        "Ask questions about your database in plain English. "
        "The system will generate SQL, execute it, and explain the results."
    )

    # Show warnings if services are not available
    if not st.session_state.db_connected:
        st.warning(
            "PostgreSQL is not connected. Please check your database configuration."
        )
    if not st.session_state.ollama_available:
        st.warning(
            "Ollama LLM is not available. Please ensure the Ollama server is running "
            "and the model is loaded."
        )

    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            # Show SQL if present
            if msg.get("sql"):
                with st.expander("Generated SQL", expanded=False):
                    st.code(msg["sql"], language="sql")
            # Show results table if present
            if msg.get("results") is not None:
                with st.expander("Query Results", expanded=True):
                    st.dataframe(msg["results"], use_container_width=True)
            # Show explanation if present
            if msg.get("explanation"):
                with st.expander("Explanation", expanded=False):
                    st.markdown(msg["explanation"])

    # Chat input
    if prompt := st.chat_input("Ask a question about your data..."):
        # Add user message to history
        st.session_state.messages.append({"role": "user", "content": prompt})

        with st.chat_message("user"):
            st.markdown(prompt)

        # Generate response
        with st.chat_message("assistant"):
            if not st.session_state.retriever:
                st.error(
                    "Cannot process queries – both PostgreSQL and Ollama "
                    "must be available."
                )
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": "Cannot process queries – services unavailable.",
                })
                return

            with st.spinner("Generating SQL..."):
                try:
                    # Generate SQL from natural language
                    sql = st.session_state.retriever.generate_sql(prompt)
                    st.markdown("Here is the generated SQL query:")
                    st.code(sql, language="sql")
                except Exception as exc:
                    error_msg = f"Failed to generate SQL: {exc}"
                    st.error(error_msg)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": error_msg,
                    })
                    return

            # Execute the query
            results_df = None
            with st.spinner("Executing query..."):
                try:
                    results_df = execute_query(sql)
                    st.dataframe(results_df, use_container_width=True)
                    st.success(f"Returned {len(results_df)} rows.")
                except QueryExecutionError as exc:
                    st.error(f"Query execution failed: {exc}")
                except Exception as exc:
                    st.error(f"Unexpected error: {exc}")

            # Generate explanation
            explanation = ""
            if results_df is not None and not results_df.empty:
                with st.spinner("Generating explanation..."):
                    try:
                        results_text = results_df.head(10).to_string()
                        explanation = st.session_state.retriever.explain_results(
                            sql, results_text
                        )
                        with st.expander("Explanation", expanded=True):
                            st.markdown(explanation)
                    except Exception as exc:
                        logger.warning("Explanation generation failed: %s", exc)

            # Save assistant message to history
            st.session_state.messages.append({
                "role": "assistant",
                "content": "Query processed successfully." if results_df is not None else "Query failed.",
                "sql": sql,
                "results": results_df,
                "explanation": explanation,
            })


# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------
initialize_services()
render_sidebar()
render_main()
