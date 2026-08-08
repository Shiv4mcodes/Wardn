import os
import json
import asyncio
from datetime import datetime, timezone
import uuid

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import init_db, get_db_connection, row_to_dict
from services.ai_service import process_ticket_ai, get_workload_assignee
from services.duplicate_service import find_duplicate_ticket

load_dotenv()

ESCALATION_THRESHOLD_SECONDS = int(os.getenv("ESCALATION_THRESHOLD_SECONDS", 45))
ESCALATION_CHECK_INTERVAL_SECONDS = int(os.getenv("ESCALATION_CHECK_INTERVAL_SECONDS", 10))

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(title="Wardn API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

SEVERITY_WEIGHT = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

def get_iso_now():
    return datetime.now(timezone.utc).isoformat()

async def escalation_watcher():
    """Background task checking for unresolved tickets past escalation threshold."""
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM tickets 
                WHERE status IN ('ASSIGNED', 'IN_PROGRESS') AND escalated = 0
            """)
            rows = cursor.fetchall()
            now = datetime.now(timezone.utc)

            for row in rows:
                ticket = row_to_dict(row)
                last_updated_dt = datetime.fromisoformat(ticket["last_updated"])
                elapsed_seconds = (now - last_updated_dt).total_seconds()

                if elapsed_seconds > ESCALATION_THRESHOLD_SECONDS:
                    current_sev = ticket["severity"]
                    new_sev = "HIGH" if current_sev in ("MEDIUM", "HIGH") else "MEDIUM"
                    
                    history = ticket["status_history"]
                    history.append({
                        "status": ticket["status"],
                        "timestamp": now.isoformat(),
                        "note": f"Auto-escalated: unresolved past threshold ({ESCALATION_THRESHOLD_SECONDS}s)"
                    })

                    trail = ticket.get("decision_trail", [])
                    trail.append({
                        "step": "Auto-Escalation",
                        "detail": f"⚠ Auto-escalated after {ESCALATION_THRESHOLD_SECONDS}s unresolved — severity bumped {current_sev} → {new_sev}",
                        "timestamp": now.isoformat(),
                        "type": "warning"
                    })

                    cursor.execute("""
                        UPDATE tickets
                        SET escalated = 1, severity = ?, last_updated = ?, status_history = ?, decision_trail = ?
                        WHERE id = ?
                    """, (new_sev, now.isoformat(), json.dumps(history), json.dumps(trail), ticket["id"]))
                    conn.commit()
                    print(f"[Escalation Watcher] Ticket #{ticket['id']} auto-escalated to {new_sev}")

            conn.close()
        except Exception as e:
            print(f"[Escalation Watcher Error] {e}")

        await asyncio.sleep(ESCALATION_CHECK_INTERVAL_SECONDS)

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(escalation_watcher())

@app.get("/")
def read_root():
    return {"message": "Wardn API is operational."}

@app.post("/submit_ticket")
async def submit_ticket(
    image: UploadFile = File(None),
    text_description: str = Form(...)
):
    image_path = ""
    image_bytes = b""

    if image and image.filename:
        file_ext = os.path.splitext(image.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        saved_file_path = os.path.join(UPLOADS_DIR, unique_filename)
        
        image_bytes = await image.read()
        with open(saved_file_path, "wb") as f:
            f.write(image_bytes)
        image_path = f"/uploads/{unique_filename}"

    # Step 1: Vision + LLM Extraction
    ai_result = process_ticket_ai(image_bytes, text_description)

    # Step 2: Fetch open tickets & run duplicate check
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM tickets WHERE status NOT IN ('RESOLVED', 'VERIFIED')
    """)
    open_tickets = [row_to_dict(r) for r in cursor.fetchall()]

    duplicate_match = find_duplicate_ticket(ai_result["description"], open_tickets)
    now_str = get_iso_now()

    if duplicate_match:
        matched_ticket, sim_score = duplicate_match
        new_count = matched_ticket["reported_count"] + 1
        
        history = matched_ticket["status_history"]
        history.append({
            "status": matched_ticket["status"],
            "timestamp": now_str,
            "note": f"Duplicate report merged (Similarity: {sim_score:.2f}, total reports: {new_count})"
        })

        trail = matched_ticket.get("decision_trail", [])
        trail.append({
            "step": "Deduplication Merge",
            "detail": f"Matched open Ticket #{matched_ticket['id']} (TF-IDF similarity: {sim_score:.2f}) — merged report (Total count: {new_count})",
            "timestamp": now_str,
            "type": "info"
        })

        cursor.execute("""
            UPDATE tickets
            SET reported_count = ?, last_updated = ?, status_history = ?, decision_trail = ?
            WHERE id = ?
        """, (new_count, now_str, json.dumps(history), json.dumps(trail), matched_ticket["id"]))
        conn.commit()

        cursor.execute("SELECT * FROM tickets WHERE id = ?", (matched_ticket["id"],))
        updated_row = cursor.fetchone()
        conn.close()

        res_ticket = row_to_dict(updated_row)
        res_ticket["duplicate"] = True
        res_ticket["match_score"] = round(sim_score, 2)
        return res_ticket

    # Step 3: Compute workload-balanced assignee
    assignee, assignee_reasoning = get_workload_assignee(ai_result["category"], open_tickets)
    ai_result["assignee"] = assignee

    max_similarity_str = "no open tickets to compare" if not open_tickets else "highest similarity below threshold"
    
    decision_trail = [
        {
            "step": "Classification",
            "detail": f"Classified as '{ai_result['category'].capitalize()}' (extracted from image + description)",
            "timestamp": now_str,
            "type": "success"
        },
        {
            "step": "Deduplication Check",
            "detail": f"Checked against {len(open_tickets)} open tickets — no duplicate found ({max_similarity_str})",
            "timestamp": now_str,
            "type": "success"
        },
        {
            "step": "Priority Scoring",
            "detail": f"Priority scored {ai_result['severity_guess']} — reasoning: \"{ai_result['severity_reasoning']}\"",
            "timestamp": now_str,
            "type": "success"
        },
        {
            "step": "Workload-Balanced Assignment",
            "detail": assignee_reasoning,
            "timestamp": now_str,
            "type": "success"
        },
        {
            "step": "Workflow Status",
            "detail": f"Status set to ASSIGNED at {now_str}",
            "timestamp": now_str,
            "type": "success"
        }
    ]

    initial_history = [
        {
            "status": "REPORTED",
            "timestamp": now_str,
            "note": "Issue reported via vision/text intake."
        },
        {
            "status": "ASSIGNED",
            "timestamp": now_str,
            "note": f"Auto-assigned to {ai_result['assignee']} based on category '{ai_result['category']}'."
        }
    ]

    cursor.execute("""
        INSERT INTO tickets 
        (category, location, description, severity, severity_reasoning, status, assignee, reported_count, escalated, image_path, created_at, last_updated, status_history, decision_trail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ai_result["category"],
        ai_result["location"],
        ai_result["description"],
        ai_result["severity_guess"],
        ai_result["severity_reasoning"],
        "ASSIGNED",
        ai_result["assignee"],
        1,
        0,
        image_path,
        now_str,
        now_str,
        json.dumps(initial_history),
        json.dumps(decision_trail)
    ))
    conn.commit()
    new_id = cursor.lastrowid

    cursor.execute("SELECT * FROM tickets WHERE id = ?", (new_id,))
    new_row = cursor.fetchone()
    conn.close()

    res_ticket = row_to_dict(new_row)
    res_ticket["duplicate"] = False
    return res_ticket

@app.get("/tickets")
def get_tickets(status: str = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()

    if status:
        cursor.execute("SELECT * FROM tickets WHERE status = ?", (status,))
    else:
        cursor.execute("SELECT * FROM tickets")

    rows = cursor.fetchall()
    conn.close()

    tickets = [row_to_dict(r) for r in rows]

    tickets.sort(
        key=lambda x: (SEVERITY_WEIGHT.get(x["severity"], 0), x["created_at"]),
        reverse=True
    )

    return tickets

@app.patch("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, payload: dict):
    new_status = payload.get("status")
    allowed_statuses = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFIED"]
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {allowed_statuses}")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = row_to_dict(row)
    now_str = get_iso_now()

    custom_note = payload.get("note", f"Status updated to {new_status}")

    history = ticket["status_history"]
    history.append({
        "status": new_status,
        "timestamp": now_str,
        "note": custom_note
    })

    trail = ticket.get("decision_trail", [])
    trail.append({
        "step": "Field Status Update",
        "detail": custom_note,
        "timestamp": now_str,
        "type": "info"
    })

    cursor.execute("""
        UPDATE tickets
        SET status = ?, last_updated = ?, status_history = ?, decision_trail = ?
        WHERE id = ?
    """, (new_status, now_str, json.dumps(history), json.dumps(trail), ticket_id))
    conn.commit()

    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return row_to_dict(updated_row)

from fastapi.responses import Response
import csv
import io

@app.get("/export_report")
def export_report():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets")
    rows = cursor.fetchall()
    conn.close()

    tickets = [row_to_dict(r) for r in rows]

    total_tickets = len(tickets)
    escalated_tickets = [t for t in tickets if t["escalated"]]
    resolved_tickets = [t for t in tickets if t["status"] in ("RESOLVED", "VERIFIED")]

    # Calculate average resolution time
    res_times = []
    for t in resolved_tickets:
        try:
            c_time = datetime.fromisoformat(t["created_at"])
            u_time = datetime.fromisoformat(t["last_updated"])
            mins = (u_time - c_time).total_seconds() / 60.0
            res_times.append(mins)
        except Exception:
            pass
    avg_res_min = (sum(res_times) / len(res_times)) if res_times else 0.0

    # Category breakdown
    cat_counts = {}
    for t in tickets:
        cat_counts[t["category"]] = cat_counts.get(t["category"], 0) + 1

    # Severity breakdown
    sev_counts = {}
    for t in tickets:
        sev_counts[t["severity"]] = sev_counts.get(t["severity"], 0) + 1

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["WARDN DAILY INCIDENT & RESOLUTION SUMMARY REPORT"])
    writer.writerow(["Generated At", datetime.now(timezone.utc).isoformat()])
    writer.writerow([])

    writer.writerow(["METRIC", "VALUE"])
    writer.writerow(["Total Tickets", total_tickets])
    writer.writerow(["Auto-Escalated Count", len(escalated_tickets)])
    writer.writerow(["Resolved / Verified Count", len(resolved_tickets)])
    writer.writerow(["Average Resolution Time (Minutes)", f"{avg_res_min:.1f}"])
    writer.writerow([])

    writer.writerow(["CATEGORY BREAKDOWN"])
    writer.writerow(["Category", "Ticket Count"])
    for cat, cnt in cat_counts.items():
        writer.writerow([cat.capitalize(), cnt])
    writer.writerow([])

    writer.writerow(["SEVERITY BREAKDOWN"])
    writer.writerow(["Severity", "Ticket Count"])
    for sev, cnt in sev_counts.items():
        writer.writerow([sev, cnt])
    writer.writerow([])

    writer.writerow(["ESCALATED TICKETS DETAIL"])
    writer.writerow(["Ticket ID", "Category", "Location", "Assignee", "Severity", "Created At", "Last Updated"])
    for t in escalated_tickets:
        writer.writerow([t["id"], t["category"], t["location"], t["assignee"], t["severity"], t["created_at"], t["last_updated"]])
    writer.writerow([])

    writer.writerow(["ALL TICKETS LIST"])
    writer.writerow(["ID", "Category", "Location", "Description", "Severity", "Status", "Assignee", "Reported Count", "Escalated", "Created At"])
    for t in tickets:
        writer.writerow([t["id"], t["category"], t["location"], t["description"], t["severity"], t["status"], t["assignee"], t["reported_count"], t["escalated"], t["created_at"]])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Wardn_Daily_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

