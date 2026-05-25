"""
Database connection management via SQLAlchemy.

Provides a singleton engine and session factory for PostgreSQL connections.
All database interactions in the application should use the utilities
exposed by this module.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from config.settings import DATABASE_URL

# ---------------------------------------------------------------------------
# Module-level engine (singleton pattern via module caching)
# ---------------------------------------------------------------------------
_engine: Engine | None = None


def get_engine() -> Engine:
    """
    Return the SQLAlchemy engine, creating it on first call.

    Uses connection pooling with sensible defaults:
      - pool_size=5: maintain up to 5 persistent connections
      - max_overflow=10: allow up to 10 additional temporary connections
      - pool_pre_ping=True: verify connections are alive before use
    """
    global _engine
    if _engine is None:
        _engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # avoids stale connection errors
            echo=False,  # set True for SQL debug logging
        )
    return _engine


def get_session() -> Session:
    """
    Create and return a new SQLAlchemy session bound to the engine.

    Callers are responsible for closing the session when done.
    Prefer using this inside a `with` block or try/finally.
    """
    factory = sessionmaker(bind=get_engine())
    return factory()


def test_connection() -> bool:
    """
    Verify that the database is reachable by executing a trivial query.

    Returns True on success, False on any connection error.
    """
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def get_schema_info() -> list[dict]:
    """
    Retrieve metadata about all user-defined tables in the public schema.

    Returns a list of dicts with keys: table_name, column_name, data_type,
    is_nullable, column_default.  This information is used to build the
    schema context that the LLM needs for SQL generation.
    """
    query = text("""
        SELECT
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default
        FROM information_schema.columns c
        JOIN information_schema.tables t
            ON c.table_name = t.table_name
            AND c.table_schema = t.table_schema
        WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
        ORDER BY c.table_name, c.ordinal_position
    """)
    with get_engine().connect() as conn:
        rows = conn.execute(query).mappings().all()
    return [dict(r) for r in rows]


def get_table_names() -> list[str]:
    """
    Return a sorted list of all user-defined table names in the public schema.
    """
    query = text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    with get_engine().connect() as conn:
        rows = conn.execute(query).fetchall()
    return [row[0] for row in rows]
