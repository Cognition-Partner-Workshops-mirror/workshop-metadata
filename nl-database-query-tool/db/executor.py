"""
Safe SQL query execution layer.

Wraps raw SQL execution with row-limit enforcement and error handling.
All generated SQL should be executed through this module so that the
security validator is always applied.
"""

import pandas as pd
from sqlalchemy import text

from config.settings import SQL_MAX_ROWS
from db.connection import get_engine
from security.validator import validate_sql


class QueryExecutionError(Exception):
    """Raised when a query fails validation or execution."""
    pass


def execute_query(sql: str) -> pd.DataFrame:
    """
    Validate and execute a SQL query, returning results as a DataFrame.

    Steps:
      1. Run the SQL through the security validator.
      2. Append a LIMIT clause if one is not already present.
      3. Execute against the database.
      4. Return results as a pandas DataFrame.

    Raises QueryExecutionError on validation failure or database errors.
    """
    # --- Step 1: security validation ---
    is_valid, message = validate_sql(sql)
    if not is_valid:
        raise QueryExecutionError(f"SQL validation failed: {message}")

    # --- Step 2: enforce row limit ---
    sql_with_limit = _apply_row_limit(sql)

    # --- Step 3: execute ---
    try:
        with get_engine().connect() as conn:
            result = conn.execute(text(sql_with_limit))
            # Fetch column names and rows
            columns = list(result.keys())
            rows = result.fetchall()
    except Exception as exc:
        raise QueryExecutionError(f"Database execution error: {exc}") from exc

    # --- Step 4: convert to DataFrame ---
    df = pd.DataFrame(rows, columns=columns)
    return df


def execute_query_raw(sql: str) -> list[dict]:
    """
    Same as execute_query but returns a list of dicts instead of a DataFrame.

    Useful when pandas is not needed (e.g., for JSON serialization).
    """
    df = execute_query(sql)
    return df.to_dict(orient="records")


def _apply_row_limit(sql: str) -> str:
    """
    Append a LIMIT clause to the SQL if none is present.

    Prevents accidentally fetching millions of rows from the database.
    """
    stripped = sql.strip().rstrip(";")
    # Simple heuristic: check if LIMIT already exists (case-insensitive)
    if "limit" not in stripped.lower().split("--")[0]:
        stripped += f" LIMIT {SQL_MAX_ROWS}"
    return stripped
