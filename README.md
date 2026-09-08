# EduNexus AI — Python Track

A full-stack, Python-only adaptive learning platform: a real knowledge-graph
curriculum, a quiz engine that updates mastery scores, an AI career-match
engine, an auto-generated roadmap, and a REPL-style tutor that adapts its
explanation depth to what you actually know.

This is the **core loop, built end to end** — not a mockup. Every button
calls a real API backed by a real database.

```
backend/   FastAPI + SQLAlchemy + JWT auth (SQLite by default, Postgres-ready)
frontend/  React + Vite, talks to the backend over a REST API
```

## What's real vs. what's a deliberate simplification

- **Real**: JWT auth, password hashing, a relational schema, server-side
  scoring/recommendation/roadmap logic, persistent per-user knowledge state,
  CORS, environment-based config.
- **Mock "AI"**: there's no LLM call and no trained ML model. The "AI" is
  deterministic logic — weighted scoring, a prerequisite-graph traversal,
  rule-based recommendations with explicit explanations. This is intentional:
  it's honest, fully explainable, and demoable with zero API keys. Swapping
  in a real model later (e.g. for the tutor) means replacing `tutor_respond()`
  in `backend/app/engine.py` with an LLM call — the rest of the architecture
  doesn't need to change.
- **Trust model for quizzes**: to keep instant feedback (see the correct
  answer and explanation the moment you pick one, like most learning apps),
  the quiz-generation endpoint sends the correct answer to the client, and
  the client reports back which questions it got right. A production
  version handling graded/high-stakes assessments would grade purely
  server-side and never send the answer key to the browser.

## Quick start

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit JWT_SECRET before any real deployment
uvicorn app.main:app --reload --port 8000
```

Or just run `./run.sh` (creates the venv, installs, and starts it).

The API is now at `http://localhost:8000` — interactive docs at
`http://localhost:8000/docs`. On first boot it creates `edunexus.db`
(SQLite) and seeds a demo student automatically.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env             # only needed if the backend isn't on :8000
npm run dev
```

Open `http://localhost:5173`. Click **"Try instant demo"** to log in as a
pre-populated demo student with realistic mastery data, or register a real
account and start from a blank knowledge state.

### Switching to Postgres

Edit `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/edunexus
```

Then uncomment `psycopg2-binary` in `requirements.txt` and reinstall. No
code changes needed — SQLAlchemy handles both dialects identically here.

## What's implemented (core loop, done properly)

- **Auth**: register / login / instant demo login, JWT bearer tokens,
  bcrypt password hashing.
- **Knowledge graph**: 20 Python concepts (syntax → data types → control
  flow → functions → OOP → decorators/algorithms) as a real prerequisite
  DAG, rendered as an interactive node graph.
- **Quiz engine**: 40-question bank across all 20 concepts, filterable by
  topic/difficulty/count, server-recorded attempts, live mastery updates.
- **Career AI**: 5 Python-track roles with weighted skill requirements,
  computed match %, and skill-gap breakdowns.
- **Roadmap**: auto-generated month-by-month plan from the real
  prerequisite closure of whichever career goal you set.
- **Nexus Tutor**: keyword-matches your question to a concept and replies
  at beginner/intermediate/advanced depth based on your mastery of that
  specific topic — with chat history persisted per user.
- **Dashboard**: streak, knowledge score, placement readiness, top career
  match, today's plan, knowledge-decay alerts, and explainable
  recommendations ("why am I seeing this?" shows the actual factors used).

## What's intentionally out of scope for this build

Per the agreed scope, this ships the **core loop only** — dashboard,
knowledge graph, AI tutor, quiz, career match, roadmap. The wider original
spec (marketplace, mentorship, faculty/admin dashboards, resume analyzer,
interview simulator, company-prep modules, etc.) is not built here. The
architecture (routers, engine module, curriculum data) is structured so
those could be added as new routers + frontend pages without restructuring
what exists.

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, startup seeding
    config.py           Env-based settings
    database.py          SQLAlchemy engine/session
    models.py             ORM tables: users, knowledge_states, quiz_attempts, chat_messages
    schemas.py             Pydantic request/response models
    security.py              Password hashing + JWT
    auth.py                    get_current_user dependency
    curriculum.py                Concept DAG, careers, projects, tutor content
    questions.py                  Quiz question bank
    engine.py                      Scoring / recommendation / roadmap / tutor logic
    seed.py                         Demo-user seeding
    routers/                        One router per feature area
  requirements.txt
  .env.example
  run.sh

frontend/
  src/
    api.js              Thin fetch wrapper for the backend
    components.jsx        Shared UI primitives (Panel, ProgressBar, etc.)
    App.jsx                 Auth gate + sidebar nav + tab routing
    styles.css                Editor-dark theme (Python syntax-highlight palette)
    pages/                      One page per feature area
  package.json
  .env.example
```

## Honesty note on testing

This was built and syntax-validated (all backend Python files byte-compile
cleanly; the entire scoring/recommendation/roadmap/tutor engine was
exercised directly against realistic seeded data and produced correct
output) in an environment without outbound network access, so `pip
install` / `npm install` / actually booting the servers together could not
be run here. The code follows standard, current-as-of-writing patterns for
FastAPI + SQLAlchemy + Vite + React, but please treat the first `pip
install` / `npm install` / `uvicorn` / `npm run dev` as the real first
boot, and let me know if anything doesn't come up cleanly so it can be
fixed.
