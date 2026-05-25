"""
Query History page – review past queries and results.

Displays the conversation history from the current session, including
the original question, generated SQL, results, and explanations.
"""

import streamlit as st
import pandas as pd

from config.settings import APP_TITLE

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title=f"{APP_TITLE} – Query History",
    page_icon="\U0001F4DC",
    layout="wide",
)

st.title("\U0001F4DC Query History")
st.markdown("Review all queries from the current session.")


def render_history() -> None:
    """Render the query history view."""
    messages = st.session_state.get("messages", [])

    if not messages:
        st.info("No queries yet. Go to the main page and ask a question!")
        return

    # Filter to just assistant messages that have SQL
    queries = [
        msg for msg in messages
        if msg.get("role") == "assistant" and msg.get("sql")
    ]

    if not queries:
        st.info("No executed queries in the session history.")
        return

    st.markdown(f"**{len(queries)} queries in this session:**")

    # Display each query in reverse chronological order
    for i, msg in enumerate(reversed(queries), 1):
        # Find the user message that triggered this query
        idx = messages.index(msg)
        user_msg = ""
        if idx > 0 and messages[idx - 1].get("role") == "user":
            user_msg = messages[idx - 1]["content"]

        with st.expander(
            f"Query {len(queries) - i + 1}: {user_msg[:80]}..." if len(user_msg) > 80 else f"Query {len(queries) - i + 1}: {user_msg}",
            expanded=(i == 1),  # expand the most recent
        ):
            # User question
            st.markdown(f"**Question:** {user_msg}")

            # Generated SQL
            st.markdown("**Generated SQL:**")
            st.code(msg["sql"], language="sql")

            # Results
            if msg.get("results") is not None:
                results = msg["results"]
                if isinstance(results, pd.DataFrame):
                    st.markdown(f"**Results:** {len(results)} rows")
                    st.dataframe(results, use_container_width=True, hide_index=True)
                else:
                    st.markdown("**Results:** (not available)")

            # Explanation
            if msg.get("explanation"):
                st.markdown("**Explanation:**")
                st.markdown(msg["explanation"])

    st.markdown("---")

    # Export option
    if st.button("Export History as CSV", use_container_width=True):
        export_data = []
        for msg in queries:
            idx = messages.index(msg)
            user_msg = messages[idx - 1]["content"] if idx > 0 else ""
            row_count = (
                len(msg["results"]) if isinstance(msg.get("results"), pd.DataFrame) else 0
            )
            export_data.append({
                "question": user_msg,
                "sql": msg.get("sql", ""),
                "rows_returned": row_count,
                "explanation": msg.get("explanation", ""),
            })

        export_df = pd.DataFrame(export_data)
        csv = export_df.to_csv(index=False)
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name="query_history.csv",
            mime="text/csv",
            use_container_width=True,
        )


# Run the page
render_history()
