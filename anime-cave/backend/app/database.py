"""SQLite persistence for download jobs + cache metadata."""
import sqlite3
import os
import time
import json
from pathlib import Path
from typing import Optional, List, Dict

DB_PATH = os.getenv("DB_PATH", "./anime_cave.db")

CREATE_DOWNLOADS_SQL = """
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    anime_id TEXT,
    episode_id TEXT NOT NULL,
    version TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    progress REAL DEFAULT 0,
    path TEXT,
    url TEXT,
    created_at REAL,
    updated_at REAL,
    error TEXT
);
"""

CREATE_JOBS_INDEX = "CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);"

def get_db(path: str = DB_PATH):
    need_init = not Path(path).exists() or Path(path).stat().st_size == 0
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL for concurrency + crash recovery
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
    except Exception:
        pass
    if need_init:
        init_db(conn)
    else:
        # Ensure table exists
        conn.execute(CREATE_DOWNLOADS_SQL)
        conn.execute(CREATE_JOBS_INDEX)
        conn.commit()
    return conn

def init_db(conn):
    conn.execute(CREATE_DOWNLOADS_SQL)
    conn.execute(CREATE_JOBS_INDEX)
    conn.commit()

# Global connection (lazy)
_db_conn = None

def db() -> sqlite3.Connection:
    global _db_conn
    if _db_conn is None:
        _db_conn = get_db(DB_PATH)
    return _db_conn

def create_job(job_id: str, anime_id: Optional[str], episode_id: str, version: str, url: Optional[str] = None) -> dict:
    now = time.time()
    conn = db()
    conn.execute(
        "INSERT INTO downloads (id, anime_id, episode_id, version, status, progress, created_at, updated_at, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (job_id, anime_id, episode_id, version, "queued", 0, now, now, url),
    )
    conn.commit()
    return get_job(job_id)

def get_job(job_id: str) -> Optional[dict]:
    conn = db()
    cur = conn.execute("SELECT * FROM downloads WHERE id = ?", (job_id,))
    row = cur.fetchone()
    if row:
        return dict(row)
    return None

def list_jobs(status: Optional[str] = None) -> List[dict]:
    conn = db()
    if status:
        cur = conn.execute("SELECT * FROM downloads ORDER BY created_at DESC")
        rows = [dict(r) for r in cur.fetchall() if r["status"] == status]
    else:
        cur = conn.execute("SELECT * FROM downloads ORDER BY created_at DESC")
        rows = [dict(r) for r in cur.fetchall()]
    return rows

def update_job(job_id: str, **fields) -> Optional[dict]:
    if not fields:
        return get_job(job_id)
    fields["updated_at"] = time.time()
    sets = ", ".join(f"{k}=?" for k in fields.keys())
    vals = list(fields.values()) + [job_id]
    conn = db()
    conn.execute(f"UPDATE downloads SET {sets} WHERE id=?", vals)
    conn.commit()
    return get_job(job_id)

def requeue_pending():
    """On startup, re-queue downloading -> queued for crash recovery."""
    conn = db()
    conn.execute("UPDATE downloads SET status='queued', updated_at=? WHERE status='downloading'", (time.time(),))
    conn.commit()
