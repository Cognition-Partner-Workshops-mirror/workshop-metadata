"""
SQL validation and security layer.

Ensures that only safe, read-only SELECT queries are executed against the
database.  This module is the primary defense against SQL injection and
accidental data modification from LLM-generated queries.
"""

import re
import sqlparse

from config.settings import SQL_BLOCKED_KEYWORDS, SQL_MAX_ROWS


def validate_sql(sql: str) -> tuple[bool, str]:
    """
    Validate a SQL string for safety.

    Runs a series of checks:
      1. Non-empty input
      2. Single statement only (no statement chaining)
      3. Must be a SELECT statement
      4. No blocked keywords (DDL/DML)
      5. No comment injection (-- or /* */)
      6. No stacked queries via semicolons
      7. LIMIT does not exceed the configured maximum

    Returns:
        (True, "OK") if valid, otherwise (False, "<reason>").
    """
    # Check 1: non-empty
    if not sql or not sql.strip():
        return False, "Empty SQL query"

    cleaned = sql.strip()

    # Check 2: parse with sqlparse and ensure single statement
    parsed = sqlparse.parse(cleaned)
    statements = [s for s in parsed if s.get_type() is not None]
    if len(statements) == 0:
        return False, "No valid SQL statement found"
    if len(statements) > 1:
        return False, "Multiple SQL statements are not allowed"

    stmt = statements[0]

    # Check 3: must be a SELECT
    if stmt.get_type() != "SELECT":
        return False, f"Only SELECT queries are allowed (got {stmt.get_type()})"

    # Check 4: blocked keywords
    upper_sql = cleaned.upper()
    for keyword in SQL_BLOCKED_KEYWORDS:
        # Use word-boundary matching to avoid false positives
        # (e.g., "UPDATED_AT" should not match "UPDATE")
        pattern = rf"\b{keyword.strip()}\b"
        if re.search(pattern, upper_sql):
            return False, f"Blocked keyword detected: {keyword.strip()}"

    # Check 5: no comment injection
    if "--" in cleaned or "/*" in cleaned:
        return False, "SQL comments are not allowed"

    # Check 6: no stacked queries via semicolons mid-string
    # Allow a trailing semicolon but nothing after it
    stripped = cleaned.rstrip(";").strip()
    if ";" in stripped:
        return False, "Multiple statements (semicolons) are not allowed"

    # Check 7: validate LIMIT value if present
    limit_match = re.search(r"\bLIMIT\s+(\d+)", upper_sql)
    if limit_match:
        limit_val = int(limit_match.group(1))
        if limit_val > SQL_MAX_ROWS:
            return False, (
                f"LIMIT {limit_val} exceeds maximum allowed ({SQL_MAX_ROWS})"
            )

    return True, "OK"


def sanitize_sql(sql: str) -> str:
    """
    Light sanitization of LLM-generated SQL.

    Strips markdown code fences, leading/trailing whitespace, and
    trailing semicolons that could cause issues with LIMIT appending.
    """
    # Remove markdown code block wrappers the LLM may include
    cleaned = sql.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag)
        cleaned = re.sub(r"^```\w*\n?", "", cleaned)
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Remove trailing semicolons
    cleaned = cleaned.rstrip(";").strip()

    return cleaned
