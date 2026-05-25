"""
Schema Explorer page – browse the database schema interactively.

Displays all tables, columns, types, and sample data in a searchable
and expandable interface. Helps users understand what data is available
before asking questions.
"""

import streamlit as st
import pandas as pd

from config.settings import APP_TITLE
from db.connection import test_connection, get_schema_info, get_table_names, get_engine
from sqlalchemy import text

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title=f"{APP_TITLE} – Schema Explorer",
    page_icon="\U0001F4CA",
    layout="wide",
)

st.title("\U0001F4CA Schema Explorer")
st.markdown("Browse the database schema to understand available tables and columns.")


def render_schema_explorer() -> None:
    """Render the schema explorer with table details and sample data."""
    # Check connectivity
    if not test_connection():
        st.error("Cannot connect to PostgreSQL. Please check your configuration.")
        return

    # Get table names
    tables = get_table_names()
    if not tables:
        st.info("No user-defined tables found in the public schema.")
        return

    st.markdown(f"**Found {len(tables)} tables:**")

    # Get full schema info
    schema_info = get_schema_info()

    # Group columns by table
    table_columns: dict[str, list[dict]] = {}
    for col in schema_info:
        tname = col["table_name"]
        table_columns.setdefault(tname, []).append(col)

    # Search filter
    search = st.text_input("Filter tables", placeholder="Type to filter...")

    # Display each table in an expander
    for table in tables:
        # Apply search filter
        if search and search.lower() not in table.lower():
            continue

        columns = table_columns.get(table, [])
        with st.expander(f"\U0001F4C1 {table} ({len(columns)} columns)", expanded=False):
            # Column details table
            col_df = pd.DataFrame(columns)
            if not col_df.empty:
                display_cols = ["column_name", "data_type", "is_nullable", "column_default"]
                available_cols = [c for c in display_cols if c in col_df.columns]
                st.dataframe(
                    col_df[available_cols],
                    use_container_width=True,
                    hide_index=True,
                )

            # Sample data preview
            st.markdown("**Sample Data (first 5 rows):**")
            try:
                with get_engine().connect() as conn:
                    # Safe: table name comes from information_schema, not user input
                    sample_df = pd.read_sql(
                        text(f'SELECT * FROM "{table}" LIMIT 5'), conn
                    )
                if sample_df.empty:
                    st.info("Table is empty.")
                else:
                    st.dataframe(sample_df, use_container_width=True, hide_index=True)
            except Exception as exc:
                st.warning(f"Could not preview data: {exc}")


# Run the page
render_schema_explorer()
