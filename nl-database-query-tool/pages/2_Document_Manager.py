"""
Document Manager page – manage the RAG knowledge base.

Allows users to add, view, and remove documents from the FAISS vector
store. Supports all 5 document types used by the retrieval system.
"""

import streamlit as st

from config.settings import APP_TITLE
from llm.embeddings import OllamaEmbeddings
from vectordb.faiss_index import FaissIndex
from vectordb.ingestion import (
    IngestionPipeline,
    Document,
    SUPPORTED_DOC_TYPES,
    DOC_TYPE_SCHEMA,
    DOC_TYPE_SQL_EXAMPLE,
    DOC_TYPE_GLOSSARY,
    DOC_TYPE_PATTERN,
    DOC_TYPE_DOCUMENTATION,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title=f"{APP_TITLE} – Document Manager",
    page_icon="\U0001F4DA",
    layout="wide",
)

st.title("\U0001F4DA Document Manager")
st.markdown(
    "Manage the knowledge base used for retrieval-augmented generation (RAG). "
    "Add context documents to improve SQL generation quality."
)

# ---------------------------------------------------------------------------
# Cached resources
# ---------------------------------------------------------------------------


@st.cache_resource
def get_index() -> FaissIndex:
    """Return the shared FAISS index instance."""
    return FaissIndex()


@st.cache_resource
def get_embeddings() -> OllamaEmbeddings:
    """Return the shared Ollama embeddings client."""
    return OllamaEmbeddings()


# ---------------------------------------------------------------------------
# Document type descriptions for the UI
# ---------------------------------------------------------------------------
DOC_TYPE_DESCRIPTIONS = {
    DOC_TYPE_SCHEMA: (
        "Schema descriptions – human-readable notes about tables, columns, "
        "relationships, and data semantics."
    ),
    DOC_TYPE_SQL_EXAMPLE: (
        "SQL examples – pairs of natural language questions and their "
        "corresponding SQL queries. Format: 'Question: ...\\nSQL: ...'"
    ),
    DOC_TYPE_GLOSSARY: (
        "Business glossary – definitions of domain-specific terms, "
        "acronyms, and business concepts."
    ),
    DOC_TYPE_PATTERN: (
        "Query patterns – common analytical query templates with "
        "descriptions of when to apply them."
    ),
    DOC_TYPE_DOCUMENTATION: (
        "Documentation – any additional reference material, notes, "
        "or policies relevant to the database or queries."
    ),
}


def render_document_manager() -> None:
    """Render the document management interface."""
    index = get_index()

    # ---------------------------------------------------------------------------
    # Status section
    # ---------------------------------------------------------------------------
    st.subheader("Index Status")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Vectors", index.total_vectors)
    with col2:
        st.metric("Documents", index.docstore.count)
    with col3:
        # Show if embeddings are available
        embeddings = get_embeddings()
        embed_status = "Available" if embeddings.is_available() else "Unavailable"
        st.metric("Embeddings", embed_status)

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Add document section
    # ---------------------------------------------------------------------------
    st.subheader("Add Document")

    # Document type selector with description
    doc_type = st.selectbox(
        "Document Type",
        options=SUPPORTED_DOC_TYPES,
        format_func=lambda x: x.replace("_", " ").title(),
    )
    st.caption(DOC_TYPE_DESCRIPTIONS.get(doc_type, ""))

    # Source identifier
    source = st.text_input("Source (optional)", placeholder="e.g. data_dictionary.md")

    # Document text
    doc_text = st.text_area(
        "Document Content",
        height=200,
        placeholder="Enter the document text here...",
    )

    # Submit button
    if st.button("Add Document", type="primary", use_container_width=True):
        if not doc_text.strip():
            st.error("Document content cannot be empty.")
        else:
            try:
                pipeline = IngestionPipeline(index=index, embeddings=get_embeddings())
                doc = Document(
                    text=doc_text.strip(),
                    doc_type=doc_type,
                    source=source or "manual",
                )
                count = pipeline.ingest([doc])
                st.success(f"Successfully ingested {count} document(s).")
                st.rerun()
            except Exception as exc:
                st.error(f"Ingestion failed: {exc}")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Seed documents section
    # ---------------------------------------------------------------------------
    st.subheader("Seed Documents")
    st.markdown(
        "Load predefined seed documents to bootstrap the knowledge base. "
        "Only runs if the index is empty."
    )
    if st.button("Load Seed Documents", use_container_width=True):
        try:
            pipeline = IngestionPipeline(index=index, embeddings=get_embeddings())
            count = pipeline.ingest_seed_documents()
            if count > 0:
                st.success(f"Loaded {count} seed documents.")
            else:
                st.info("Index already has data – seed loading skipped.")
            st.rerun()
        except Exception as exc:
            st.error(f"Seed ingestion failed: {exc}")

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Browse documents section
    # ---------------------------------------------------------------------------
    st.subheader("Browse Documents")
    if index.docstore.count == 0:
        st.info("No documents in the store yet.")
    else:
        # Display all documents from the docstore
        for doc_id, doc in sorted(index.docstore.store.items(), key=lambda x: int(x[0])):
            dtype = doc.get("doc_type", "unknown")
            text_preview = doc.get("text", "")[:200]
            with st.expander(f"[{dtype}] {text_preview}...", expanded=False):
                st.markdown(f"**Type:** {dtype}")
                st.markdown(f"**Source:** {doc.get('source', 'N/A')}")
                st.text(doc.get("text", ""))

    st.markdown("---")

    # ---------------------------------------------------------------------------
    # Clear index section
    # ---------------------------------------------------------------------------
    st.subheader("Danger Zone")
    st.warning("Clearing the index will remove all documents and vectors.")
    if st.button("Clear Entire Index", type="secondary"):
        index.clear()
        index.save()
        st.success("Index and docstore cleared.")
        st.rerun()


# Run the page
render_document_manager()
