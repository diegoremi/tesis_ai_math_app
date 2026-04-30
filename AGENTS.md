# AGENTS.md

> High-signal repo guidance. If it is obvious from file names, it is not here.

## Architecture

Monorepo with three independent services. No workspace manager (no Turborepo, no Lerna).

| Package | Stack | Entry | Dev port |
|---------|-------|-------|----------|
| `backend/` | Express + TypeScript + Prisma + PostgreSQL | `src/index.ts` | 8080 |
| `frontend/` | Create React App + React 19 + Tailwind v3 | `src/index.js` | 3000 |
| `ai_module/` | FastAPI + Gemini (`gemini-2.0-flash-lite`) | `main.py` | 8001 |

- Backend API prefix: `/api/*` (see `src/app.ts`).
- Frontend proxies to backend in dev via CRA proxy (if configured), otherwise calls directly.
- AI module is a separate HTTP service; backend calls it via `AI_SERVICE_URL`.

## Developer Commands

```bash
# Start all three services at once (recommended)
./dev.sh

# Or individually:
cd backend && npm install && npm run dev      # 8080
cd frontend && npm install && npm start       # 3000
cd ai_module && source .venv/bin/activate && uvicorn main:app --reload  # 8001
```

### Backend-only commands

```bash
npm run dev               # nodemon + tsx (requires .env)
npm run start             # tsx src/index.ts (production-like)
npm run seed:synthetic    # generates 60 synthetic users for ANCOVA testing
npm run db:reset-users    # wipes user data, preserves assessment/survey item banks
npx prisma db seed        # seed item banks (run after migrate)
npx prisma migrate deploy # apply pending migrations
```

> **Order matters for fresh DB:** `migrate deploy` → `db seed` → optionally `seed:synthetic`.

## TypeScript / Module Quirks

- Backend is ESM (`"type": "module"` in `package.json`).
- `tsconfig.json` uses `"module": "nodenext"` + `"moduleResolution": "nodenext"`.
- Strict flags on: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- All local imports must include `.js` extension (e.g., `import app from './app.js'`), even for `.ts` files.
- `ts-node` is in devDependencies but `tsx` is the actual runner used in `npm run dev`.

## Environment & Secrets

Both backend and AI module need `.env` files. `dev.sh` auto-copies from `.env.example` if missing, but you must fill in real values before use.

```bash
cp backend/.env.example backend/.env
cp ai_module/.env.example ai_module/.env
```

Key variables:
- `DATABASE_URL` (and `DIRECT_URL` for Prisma) — PostgreSQL
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `AI_SERVICE_URL=http://localhost:8001`

## Database & Prisma

- Provider: PostgreSQL (tested on Neon/Vercel Postgres).
- Schema: `backend/prisma/schema.prisma`.
- The study uses round-robin 1:1 randomization (`Assignment.group = GE | GC`) and per-user `FeatureFlag` (`chatbot`, `adaptativo`).
- Naming convention: the thesis term *evaluación* maps to the DB/code term `Assessment*` (e.g., `Assessment`, `AssessmentItem`, `AssessmentResponse`).

## Testing

- **Backend:** no tests configured (`npm test` exits with error).
- **Frontend:** standard CRA test runner (`react-scripts test`).
- Synthetic data generation (`npm run seed:synthetic`) is the primary integration smoke test for the ANCOVA export pipeline.

## Study / Domain Constraints

- This is a **quasi-experimental** research app (GE vs GC). Feature gating is business-critical.
- AI endpoints (`/api/ai/*`) must reject or degrade gracefully for GC users.
- Assessments (pre/post) must run **without AI assistance**, with timer and anti-copy UI.
- Export endpoint: `GET /admin/export?type=ancova` returns a CSV aligned to the thesis variables.

## Deployment Notes

- Frontend deploys to Vercel (domains hardcoded in backend CORS allowlist).
- Backend includes `serverless-http` and `@vercel/node` for serverless deployment.
- AI module uses `mangum` for AWS Lambda / ASGI serverless compatibility.

## What to Avoid

- Do not add `.ts` extensions in ESM imports in the backend; use `.js`.
- Do not run `seed:synthetic` on a production dataset; it creates fake users.
- Do not treat `Survey` (legacy aggregate model) as the source of truth for item-level analysis; use `SurveySubmission` + `SurveyResponse`.
- Do not confuse `evaluations` endpoints with `survey` endpoints: evaluations = achievement tests; surveys = Likert scales.
