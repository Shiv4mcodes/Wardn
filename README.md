# Wardn — Zero-Touch Issue Resolution

**Autonomous Triage. Zero Human Touch.**

Wardn is an end-to-end autonomous system for facility and infrastructure issue resolution. It eliminates human triage entirely — from the moment an issue is reported, every decision (classification, deduplication, prioritization, assignment, and escalation) is made and executed by the system itself, with zero manual intervention.

Built for [Hackathon Name] under the theme: *"Build a system that doesn't just assist humans in completing a task — make the system capable of completing the task automatically."*

---

## The Problem

Every day, across any campus, office, or facility, people report broken things — leaking pipes, faulty wiring, damaged equipment. Today, that report goes into a WhatsApp group, a register, or an inbox, and then a **human** has to manually read it, figure out what it is, decide how urgent it is, decide who to tell, and remember to follow up. That manual chain is slow, inconsistent, and things get forgotten or duplicated.

**Wardn replaces that entire human decision chain with an autonomous agent.** The person only reports — the system does everything else.

---

## How It Works (End-to-End Flow)
Photo + description submitted
↓
Vision + LLM extraction → structured ticket (category, location, description, severity)
↓
Duplicate check (TF-IDF + cosine similarity against all open tickets)
→ if duplicate: merge, increment reported_count
→ if new: continue
↓
Priority scoring (LLM reasoning: HIGH / MEDIUM / LOW + explanation)
↓
Workload-balanced auto-assignment (routes to least-loaded person in the relevant role)
↓
Ticket enters workflow: ASSIGNED → IN_PROGRESS → RESOLVED → VERIFIED
↓
Background watcher auto-escalates if unresolved past threshold
(severity bumped, escalation flag set, decision trail updated)

No human makes any classification, routing, or urgency decision at any point in this flow.

---

## Core Features

### 1. Autonomous Multi-Modal Intake
Accepts photo uploads and text descriptions. Vision-capable LLM (Groq or Gemini Flash, configurable via `.env`) analyzes the image; a text LLM combines the visual analysis with the user's description into structured JSON (category, location, description, severity, reasoning).

### 2. Dynamic TF-IDF Deduplication
Refits a `TfidfVectorizer` on `[all currently open tickets + the new ticket]` on every submission, then computes cosine similarity to detect near-duplicate reports. Matches above threshold (0.85) are merged into the existing ticket instead of creating a new card — `reported_count` increments instead.

### 3. Workload-Balanced Auto-Assignment
Each issue category maps to a small roster of named handlers (e.g. Plumbing → Raj, Suresh, Manoj). New tickets are routed to whichever person in that role currently has the fewest open tickets — real load-balancing, not a static lookup — and this reasoning is logged in the ticket's decision trail.

### 4. Full Decision Audit Trail
Every ticket stores a complete, transparent, timestamped record of every automated decision made about it:
- ✓ Classification (category + extraction source)
- ✓ Deduplication check (similarity score against existing tickets)
- ✓ Priority scoring (severity + one-line reasoning)
- ✓ Assignment (who, and why — workload comparison)
- ✓ Status transitions
- ⚠ Auto-escalation events (if triggered)

Viewable per-ticket via the "View Decision Trail" expandable panel — this is the visible proof that the system is reasoning, not just labeling.

### 5. Auto-Escalation Engine
A background async task checks all `ASSIGNED`/`IN_PROGRESS` tickets on a fixed interval. Any ticket unresolved past a configurable threshold is automatically escalated: severity is bumped one level, an `escalated` flag is set, and the event is logged — with zero human trigger. (Threshold set short for live demo purposes; production would use hours/days.)

### 6. Simulate Field Update
A demo-safe control on each ticket that mimics a real technician status update, progressing a ticket through ASSIGNED → IN_PROGRESS → RESOLVED with realistic status text at each stage, so the full lifecycle can be demonstrated live without waiting on real-world time.

### 7. Analytics Dashboard
A dedicated view showing system-wide metrics: average time-to-resolution, escalation rate, tickets handled today, category breakdown (bar chart), and severity distribution (donut chart) — evidence of impact and scalability beyond a single ticket.

### 8. Daily Report Export
One-click download of a structured summary report (CSV) — total tickets, category/severity breakdown, escalated tickets list, and average resolution time.

### 9. Load-Tested for Concurrency
Handles 10+ simultaneous ticket submissions without race conditions in workload assignment, with an efficient single-query escalation check rather than per-ticket polling, and graceful degradation (clear error state, not a crash) if the LLM API is rate-limited.

### 10. Premium UI
Custom-designed dark theme with warm amber/orange gradient hero, glass-panel cards, live escalation countdown per ticket, and a fully cohesive visual language from landing hero through to the live Kanban board.

---

## Tech Stack

- **Backend**: Python, FastAPI
- **Frontend**: React (Vite), Tailwind CSS, lucide-react icons, recharts (analytics)
- **Database**: SQLite
- **AI**: Groq (`llama-3.3-70b-versatile` for text; vision-capable Groq model, with Gemini Flash fallback if unavailable — configurable via `.env`)
- **Deduplication**: `scikit-learn` TF-IDF + cosine similarity (lightweight, no heavy embedding models)

---

## Quickstart Setup

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm
- A Groq API key (and optionally a Gemini API key as vision fallback)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your GROQ_API_KEY (and GEMINI_API_KEY if using vision fallback) to .env

# Seed demo data — populates realistic sample tickets across different
# states, including one close to auto-escalating live
python seed_demo_data.py

# Start the API server
python -m uvicorn main:app --reload --port 8000
```

Backend runs on `http://localhost:8000`.

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

npm install
npm run dev
```

Frontend runs on `http://localhost:3000` (or the port Vite assigns).

### 3. (Optional) Load Test

To verify the system holds up under rapid concurrent submissions before a live demo, use the dev-only "Load Test: Submit 10 Sample Tickets" control to fire off a batch of varied sample tickets and confirm assignment balancing, deduplication, and stability.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required. Used for text classification/reasoning and (if available) vision analysis. |
| `GEMINI_API_KEY` | Optional. Used as vision fallback if Groq's vision model is unavailable. |
| `VISION_PROVIDER` | `groq` or `gemini` — selects which provider handles image analysis. |
| `ESCALATION_THRESHOLD_SECONDS` | Time before an unresolved ticket auto-escalates. Set low (e.g. 45s) for demo purposes. |

---

## Demo Script

1. **Open the dashboard** — pre-seeded tickets are visible across all workflow stages, including one nearing auto-escalation.
2. **Submit a real issue** — photograph something broken, add a short description, submit. Watch it get classified, scored, and assigned within seconds — all automatically.
3. **Submit a near-duplicate** — show it merges into the existing ticket instead of creating a new card, with the reported count incrementing.
4. **Click "View Decision Trail"** on any ticket — show the full automated reasoning chain: classification → dedup check → priority scoring → assignment, each with an explanation.
5. **Watch the escalation countdown** on a pre-seeded ticket tick down to zero — the card auto-escalates live, no human action taken.
6. **Use "Simulate Field Update"** to show a ticket progressing through its full lifecycle to Resolved and Verified.
7. **Switch to the Analytics tab** — show system-wide metrics as evidence of scale (resolution time, escalation rate, category breakdown).
8. **Close** with the core line: *"The human only reported. Everything after that — classification, deduplication, prioritization, routing, and escalation — happened automatically. That's the difference between a system that assists and a system that completes the task."*

---

## What This Solves

Real, everyday pain: broken infrastructure/equipment reports get lost in noisy group chats or physical registers, duplicate reports waste effort, urgent issues don't get prioritized over trivial ones, and unresolved issues silently rot with no follow-up. Wardn turns "I reported it, nothing happened" into a tracked, self-prioritizing, self-escalating process — with no one having to manually triage a single ticket.
