# tesis_ai_math_app

AI-driven math learning platform that supports a research-grade GE vs GC study for autonomous learning and motivation. The repository hosts a tri-service stack (React frontend, Express/Prisma backend, Python AI microservice) plus shared designs and documentation tailored to the thesis workflow.

## Architecture Overview

- **Frontend** (`frontend/`): Create React App with Tailwind-based dashboards, study flows, adaptive exercises, surveys, and feature-flag-aware chatbot access.
- **Backend** (`backend/`): Express + TypeScript API with Prisma/PostgreSQL. Handles auth, consent randomisation, feature gating, assessments, telemetry, exports, and legacy aggregates.
- **AI Module** (`ai_module/`): FastAPI service (Gemini/OpenAI integration). Used for hints, tutoring responses, and planner guardrails.
- **Docs & designs**: `AGENTS.md`, `database_schema.md`, and `designs/` capture experimental protocol, schema, and UI references.

Refer to `AGENTS.md` for agent behaviours, end-to-end protocol, and sprint roadmap.

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- PostgreSQL database (Neon/Supabase/Vercel Postgres recommended)
- pnpm/yarn optional (project uses npm scripts)

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # create and edit with DATABASE_URL, JWT_SECRET, OPENAI keys, etc.
npx prisma format
npx prisma migrate deploy
npx prisma db seed     # populates assessment + survey item banks
npm run dev            # nodemon + tsx on port 8080
```

Key env vars:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY` / `GEMINI_API_KEY`
- `PII_REDACTION`, feature flags as needed
- `AI_SERVICE_URL` (optional, defaults to `http://localhost:8001`)

### Frontend

```bash
cd frontend
npm install
npm start    # CRA dev server on port 3000
```

Set `REACT_APP_API_URL` in `.env.local` if backend runs on a different host.

### AI Module

```bash
cd ai_module
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure GEMINI/OpenAI keys
uvicorn main:app --reload
pytest                 # run FastAPI smoke tests (uses mocked models)
```

### One-shot local dev

Once dependencies are installed, use the helper script at the repository root:

```bash
./dev.sh
```

This starts:

- FastAPI AI module on `http://localhost:8001`
- Express backend on `http://localhost:8080`
- React frontend on `http://localhost:3000`

Press `Ctrl+C` to stop all processes. The script creates virtualenvs or copies `.env` templates as needed.

## Database Notes

- Prisma schema lives at `backend/prisma/schema.prisma` and includes consent, assignments, feature flags, assessment/survey item banks, telemetry, and exports.
- `npx prisma db seed` (backed by `prisma/seed.ts`) inserts canonical pretest/posttest and satisfaction survey items.
- `database_schema.md` summarises tables and migration workflow.

## Synthetic Data Generation

For testing and development purposes, you can generate realistic synthetic user data:

```bash
cd backend
npm run seed:synthetic
```

This script generates 65 users with varied usage trajectories distributed over the last 20 days:
- **65% complete flow** (pretest → practice sessions → posttest → survey)
- **18% pretest only** (users who registered but didn't practice)
- **17% partial flow** (pretest + practice but no posttest)

**Generated data includes:**
- 50/50 distribution between GE (with chatbot) and GC (control) groups
- 2-4 practice sessions per active user
- 3-8 exercises per practice session
- Realistic improvement patterns (posttest > pretest for most users)
- AI tutor feedback messages (GE group only)
- Telemetry events (session_start, correct/incorrect answers, hints, etc.)
- TAM survey responses for users who completed the flow

**Test credentials:**
- All users have the password: `password123`
- Email format: `{firstname}.{lastname}{number}@example.com`
- Example: `maria.rojas1@example.com`

**Verification:**
```bash
cd backend
npx tsx verify-data.ts
```

This displays statistics about generated data including user counts, practice sessions, assessments completed, and date ranges.

## Study Workflow (Happy Path)

1. **Consent** → `POST /study/consent` → UI at `/study/consent` includes download + navigation to pretest.
2. **Pretest** → UI fetches `/evaluations/items?type=pretest` and submits item-level score to `/evaluations`.
3. **Randomisation** → admin triggers `/study/randomize` (creates assignments + feature flags).
4. **Adaptive practice** → exercises call `/activities/exercise`, `POST /events`, and optional hints via `/ai/hint` gated for GE.
5. **Telemetry & surveys** → `/events`, `/survey/items`, `/survey/submit` capture adherence and TAM/satisfaction.
6. **Exit test** → `/evaluations/items?type=posttest&version=exit_v1` + submission.
7. **Exports** → `/admin/export?type=ancova` builds the dataset defined in `AGENTS.md`.

## Scripts

- Backend dev: `npm run dev`
- Type-check backend: `npx tsc --noEmit`
- Frontend build: `npm run build`
- Prisma format: `npx prisma format`
- Prisma migration (dev): `npx prisma migrate dev --name <label>`
- Prisma seed (item banks): `npx prisma db seed`
- **Synthetic data generation**: `npm run seed:synthetic`
- **Verify synthetic data**: `npx tsx verify-data.ts`

## Testing

Automated suites are minimal; add tests under:
- Backend: `backend/tests/` (Jest/Vitest + Supertest recommended)
- Frontend: `frontend/src/__tests__/` or component co-located `*.test.js`
- AI: `ai_module/tests/` (PyTest with mocked providers)

## Deployment Checklist

1. Ensure `DATABASE_URL` points to production DB; run `npx prisma migrate deploy` then `npx prisma db seed` (if fresh).
2. Configure env vars per service (`JWT_SECRET`, API keys, feature flags).
3. Build frontend (`npm run build`) and deploy to Vercel or static host.
4. Deploy backend (Railway/Render). Confirm `/health` (add if needed) and secure CORS origins.
5. Deploy AI module (Railway). Update `frontend/src/services/api.js` / `.env` with AI host if required.
6. Smoke-test consent → pretest → dashboard → survey → export flow on staging before study sessions.

## Additional Resources

- **Design mocks**: `designs/` (HTML + PNG snapshots)
- **Experimental protocol, agents & roadmap**: `AGENTS.md`
- **Schema reference**: `database_schema.md`

For questions about the research methodology or data exports, start in `AGENTS.md` and align with the thesis documentation.
