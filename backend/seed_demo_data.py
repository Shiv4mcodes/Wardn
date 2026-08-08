import os
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from database import init_db, get_db_connection

def seed_data():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM tickets")
    conn.commit()

    now = datetime.now(timezone.utc)
    
    # Ticket 1: ASSIGNED, ~35 seconds ago (Will auto-escalate live in ~10s!)
    t1_time = (now - timedelta(seconds=35)).isoformat()
    t1_history = [
        {"status": "REPORTED", "timestamp": t1_time, "note": "Water leak reported near server room door."},
        {"status": "ASSIGNED", "timestamp": t1_time, "note": "Auto-assigned to Raj (Plumber) based on category 'plumbing'."}
    ]
    t1_trail = [
        {"step": "Classification", "detail": "Classified as 'Plumbing' (extracted from photo + description)", "timestamp": t1_time, "type": "success"},
        {"step": "Deduplication Check", "detail": "Checked against 2 open tickets — no duplicate found (highest similarity: 0.18)", "timestamp": t1_time, "type": "success"},
        {"step": "Priority Scoring", "detail": "Priority scored MEDIUM — reasoning: \"Water near server room poses moderate risk of equipment damage if uncontained.\"", "timestamp": t1_time, "type": "success"},
        {"step": "Workload-Balanced Assignment", "detail": "Assigned to Raj (Plumber) — workload: 0 open ticket(s) vs Suresh's 1", "timestamp": t1_time, "type": "success"},
        {"step": "Workflow Status", "detail": f"Status set to ASSIGNED at {t1_time}", "timestamp": t1_time, "type": "success"}
    ]

    # Ticket 2: IN_PROGRESS, 15 minutes ago
    t2_time = (now - timedelta(minutes=15)).isoformat()
    t2_history = [
        {"status": "REPORTED", "timestamp": t2_time, "note": "Flickering lights and exposed wiring in 3rd floor corridor."},
        {"status": "ASSIGNED", "timestamp": t2_time, "note": "Auto-assigned to Vikram (Electrician) based on category 'electrical'."},
        {"status": "IN_PROGRESS", "timestamp": (now - timedelta(minutes=5)).isoformat(), "note": "Technician dispatched to inspect junction box."}
    ]
    t2_trail = [
        {"step": "Classification", "detail": "Classified as 'Electrical' (extracted from photo + description)", "timestamp": t2_time, "type": "success"},
        {"step": "Deduplication Check", "detail": "Checked against 1 open ticket — no duplicate found (highest similarity: 0.22)", "timestamp": t2_time, "type": "success"},
        {"step": "Priority Scoring", "detail": "Priority scored HIGH — reasoning: \"Exposed sparking junction box presents immediate electrical and fire hazard.\"", "timestamp": t2_time, "type": "success"},
        {"step": "Workload-Balanced Assignment", "detail": "Assigned to Vikram (Electrician) — workload: 0 open ticket(s) vs Anil's 1", "timestamp": t2_time, "type": "success"},
        {"step": "Workflow Status", "detail": f"Status set to ASSIGNED at {t2_time}", "timestamp": t2_time, "type": "success"},
        {"step": "Deduplication Merge", "detail": "Matched report from 2nd floor employee (similarity: 0.74) — merged report (Total count: 2)", "timestamp": (now - timedelta(minutes=10)).isoformat(), "type": "info"},
        {"step": "Manual Status Transition", "detail": "Status moved to IN_PROGRESS", "timestamp": (now - timedelta(minutes=5)).isoformat(), "type": "info"}
    ]

    # Ticket 3: RESOLVED, 2 hours ago
    t3_time = (now - timedelta(hours=2)).isoformat()
    t3_history = [
        {"status": "REPORTED", "timestamp": t3_time, "note": "HVAC AC unit making loud rattling noise in Conference Room B."},
        {"status": "ASSIGNED", "timestamp": t3_time, "note": "Auto-assigned to Meena (Facilities Team) based on category 'facilities'."},
        {"status": "IN_PROGRESS", "timestamp": (now - timedelta(hours=1, minutes=30)).isoformat(), "note": "Maintenance team replacing fan belt."},
        {"status": "RESOLVED", "timestamp": (now - timedelta(minutes=45)).isoformat(), "note": "Fan belt replaced, AC running quietly."}
    ]
    t3_trail = [
        {"step": "Classification", "detail": "Classified as 'Facilities' (extracted from photo + description)", "timestamp": t3_time, "type": "success"},
        {"step": "Deduplication Check", "detail": "Checked against 0 open tickets — no duplicate found", "timestamp": t3_time, "type": "success"},
        {"step": "Priority Scoring", "detail": "Priority scored LOW — reasoning: \"Comfort issue in non-critical area with no immediate safety risk.\"", "timestamp": t3_time, "type": "success"},
        {"step": "Workload-Balanced Assignment", "detail": "Assigned to Meena (Facilities Team) — workload: 0 open ticket(s) vs Deepak's 1", "timestamp": t3_time, "type": "success"},
        {"step": "Workflow Status", "detail": f"Status set to ASSIGNED at {t3_time}", "timestamp": t3_time, "type": "success"},
        {"step": "Manual Status Transition", "detail": "Status moved to IN_PROGRESS", "timestamp": (now - timedelta(hours=1, minutes=30)).isoformat(), "type": "info"},
        {"step": "Manual Status Transition", "detail": "Status moved to RESOLVED", "timestamp": (now - timedelta(minutes=45)).isoformat(), "type": "info"}
    ]

    sample_tickets = [
        (
            "plumbing",
            "Building A - 2nd Floor Hallway",
            "Active water leak dripping from ceiling pipe near server room door. Risk of water damage to equipment.",
            "MEDIUM",
            "Water near server room poses moderate risk of equipment damage if uncontained.",
            "ASSIGNED",
            "Raj (Plumber)",
            1,
            0,
            "",
            t1_time,
            t1_time,
            json.dumps(t1_history),
            json.dumps(t1_trail)
        ),
        (
            "electrical",
            "3rd Floor East Wing Corridor",
            "Sparking junction box and flickering fluorescent lights causing power drops in adjacent cubicles.",
            "HIGH",
            "Exposed sparking junction box presents immediate electrical and fire hazard.",
            "IN_PROGRESS",
            "Vikram (Electrician)",
            2,
            0,
            "",
            t2_time,
            (now - timedelta(minutes=5)).isoformat(),
            json.dumps(t2_history),
            json.dumps(t2_trail)
        ),
        (
            "facilities",
            "Main Building - Conference Room B",
            "HVAC system blowing hot air and producing loud rattling noise during board meeting.",
            "LOW",
            "Comfort issue in non-critical area with no immediate safety risk.",
            "RESOLVED",
            "Meena (Facilities Team)",
            1,
            0,
            "",
            t3_time,
            (now - timedelta(minutes=45)).isoformat(),
            json.dumps(t3_history),
            json.dumps(t3_trail)
        )
    ]

    cursor.executemany("""
        INSERT INTO tickets 
        (category, location, description, severity, severity_reasoning, status, assignee, reported_count, escalated, image_path, created_at, last_updated, status_history, decision_trail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_tickets)

    conn.commit()
    conn.close()
    print("[Seed Data] Successfully seeded 3 realistic tickets with workload-balanced assignees into wardn.db!")

if __name__ == "__main__":
    seed_data()
