import sqlite3
import json
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "wardn.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            severity_reasoning TEXT NOT NULL,
            status TEXT NOT NULL,
            assignee TEXT NOT NULL,
            reported_count INTEGER DEFAULT 1,
            escalated BOOLEAN DEFAULT 0,
            image_path TEXT,
            created_at TEXT NOT NULL,
            last_updated TEXT NOT NULL,
            status_history TEXT NOT NULL,
            decision_trail TEXT DEFAULT '[]'
        )
    """)
    conn.commit()
    conn.close()

def row_to_dict(row):
    d = dict(row)
    d["escalated"] = bool(d["escalated"])
    for key in ["status_history", "decision_trail"]:
        if d.get(key):
            try:
                d[key] = json.loads(d[key])
            except Exception:
                d[key] = []
        else:
            d[key] = []
    return d

