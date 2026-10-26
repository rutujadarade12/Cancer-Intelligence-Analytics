import sqlite3
import os
from contextlib import contextmanager
from backend.config import DB_PATH

def get_db():
    """Dependency that yields a SQLite connection with Row factory."""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database file not found at {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def query_db(query: str, args=(), one=False):
    """Utility function to execute a query and return dict or list of dicts."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(query, args)
        rv = cur.fetchall()
        return (dict(rv[0]) if rv else None) if one else [dict(r) for r in rv]
