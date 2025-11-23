# AI Math Learning Platform

> **Project:** AI-driven Math Learning Platform
> **Purpose:** Research-grade GE vs GC study evaluating impact on autonomous learning and motivation (pre-post design with TAM as moderator)
> **Key Output:** Reproducible dataset `/exports/ancova-dataset` with full traceability (consent, assignment, instrument versions, telemetry)

---

## 1. Project Overview

AI-driven math learning platform that supports a research-grade experimental study (GE vs GC) for autonomous learning and motivation. The repository hosts a tri-service stack with shared designs and documentation tailored to thesis workflow.

### Quick Start

```bash
# One-shot local development (starts all services)
./dev.sh

# Or start each service individually:
# Backend (Express + Prisma)
cd backend && npm install && npm run dev  # port 8080

# Frontend (React + Tailwind)
cd frontend && npm install && npm start   # port 3000

# AI Module (FastAPI + Gemini/OpenAI)
cd ai_module && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --reload  # port 8001
```

---

## 2. Architecture

```
flowchart LR
  UI[React/Next: Onboarding, Pre/Post, Practice, Chatbot, Surveys, Reports]
  API[Node/Express + Prisma]
  AI[FastAPI: TutorAgent, PlannerAgent, Guardrails]
  DB[(PostgreSQL)]
  UI <--> API
  API <--> DB
  API <--> AI
```

### Modules

| Module | Path | Description |
|--------|------|-------------|
| **Frontend** | `frontend/` | Create React App with Tailwind dashboards, study flows, adaptive exercises, surveys, feature-flag-aware chatbot |
| **Backend** | `backend/` | Express + TypeScript API with Prisma/PostgreSQL. Auth, consent, randomization, feature gating, assessments, telemetry, exports |
| **AI Module** | `ai_module/` | FastAPI service (Gemini/OpenAI). Hints, tutoring responses, planner guardrails |
| **Designs** | `designs/` | HTML + PNG design mocks and UI references |

### Key Views (Frontend)

- `/study/consent` - Informed consent with document download
- `/study/pretest` - Pre-assessment (no AI)
- `/study/exit-test` - Post-assessment (no AI)
- `/dashboard` - Main interface with GE/GC gating
- Satisfaction survey (redesigned)

---

## 3. Prerequisites & Setup

### Requirements

- Node.js 20+, npm 10+
- Python 3.11+
- PostgreSQL (Neon/Supabase/Vercel Postgres recommended)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Configure DATABASE_URL, JWT_SECRET, API keys
npx prisma format
npx prisma migrate deploy
npx prisma db seed     # Populates assessment + survey item banks
npm run dev            # Runs on port 8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm start    # Runs on port 3000
```

Set `REACT_APP_API_URL` in `.env.local` if backend runs on different host.

### AI Module Setup

```bash
cd ai_module
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Configure GEMINI/OpenAI keys
uvicorn main:app --reload  # Runs on port 8001
pytest                 # Smoke tests with mocked models
```

### Environment Variables

```env
DATABASE_URL=postgres://...
JWT_SECRET=...
AI_PROVIDER=openai          # openai|gemini
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
PII_REDACTION=true
FEATURE_FLAGS_DEFAULT=false
AI_SERVICE_URL=http://localhost:8001
```

---

## 4. Agents (Behavior)

### 4.1 TutorAgent

- **GE mode**: Graduated hints -> step-by-step explanation -> solution on request
- **GC mode**: **Disabled** (UI and API reject requests)
- **Logs**: `feedback_ia` table (type: hint/explanation/motivation), no PII

### 4.2 PlannerAgent / TheoryGen

- Uses pretest, domain errors, and telemetry (`eventos`) to plan next exercises (adaptive difficulty)
- Delivers session goals (e.g., ">=3 sessions/week")
- Generates personalized theory modules via FastAPI + Gemini (`/study/theory/generate`) for **GE** participants
- **GC** cohorts or AI failures: serves static module library (6 rotating templates) with curated theory, examples, visualizations, and checkpoints; records indicate `version=control-v1` or `fallback`

### 4.3 PracticeGen Agent

- `/activities/exercise` and `/activities/exercise/submit` generate on-demand items with LLM (Gemini or OpenAI per `AI_PROVIDER`)
- Master prompt produces JSON with immediate feedback (`explain_correct`, `explain_incorrect`)
- Validated and persisted in `PracticeGenerated` and `PracticeAttempt` for traceability and reuse
- **GC** cohorts (or AI failures): delivers curated set (`practice_v1`) with 10+ manual items

### 4.4 AssessmentAgent

- Pre/Post **without AI**: Items from versioned bank; timer; anti-copy
- Saves **item-level responses** for psychometrics (alpha, difficulty, discrimination)

### 4.5 ExportAgent

- Builds consolidated view (**one row per user**) for ANCOVA/moderation/dose-response analysis

---

## 5. Database Schema (PostgreSQL + Prisma)

> **Design keys**: `asignaciones`, `consentimientos`, **item-level** in tests/surveys, `eventos` (telemetry), **instrument versioning**

### Core Tables

| Table | Purpose |
|-------|---------|
| `User` | Identity with `participant_code` (pseudonym for exports), demographics, study role |
| `Consent` | IRB acceptance per document version |
| `Assignment` | Experimental grouping (GE/GC), method (azar/emparejamiento), seed |
| `FeatureFlag` | Per-user gating toggles (`chatbot`, `adaptativo`) |
| `AssessmentItem` | Versioned item bank with domain/competency metadata |
| `Assessment` | Pre/post attempts with version, timestamps, total score |
| `AssessmentResponse` | Item-level answers linked to submission and source item |
| `Activity` | Adaptive practice aggregates |
| `PracticeGenerated` | AI-generated practice items |
| `PracticeAttempt` | User attempts on practice items |
| `Session` | Authenticated usage windows |
| `Event` | High-frequency telemetry |
| `AIFeedback` | TutorAgent emissions with `prompt_hash` (PII scrubbed) |
| `SurveyItem` | Likert statements per instrument/version |
| `SurveySubmission` | Completed instruments |
| `SurveyResponse` | Item-level scores (1-5) |
| `Infrastructure` | Device/connection constraints from onboarding |

### Key Enums

- `AssignmentGroup`: `GE`, `GC`
- `AssignmentMethod`: `azar`, `emparejamiento`
- `AssessmentType`: `pretest`, `posttest`
- `SurveyInstrument`: `motivacion`, `autonomia`, `tam`, `satisfaccion`
- `EventType`: `session_start`, `session_end`, `hint`, `correct`, `incorrect`, `streak`, `goal_met`
- `DifficultyLevel`: `basic`, `intermediate`, `advanced`

### Export Views

```sql
-- Pre/Post compact
vw_prepost: id_usuario, pretest, postest

-- Usage aggregates (dose)
vw_usage: id_usuario, sesiones, minutos_totales, ejercicios_resueltos, porc_aciertos

-- TAM subscale averages
vw_tam_scores: id_usuario, tam_utilidad, tam_facilidad

-- Full ANCOVA/moderation export
vw_ancova_base: id_usuario, grupo, pretest, postest, tam_utilidad, tam_facilidad, edad, nivel_estudio
```

### Migration Workflow

```bash
npx prisma migrate dev --name <label>   # Local development
npx prisma db seed                       # Populate item banks
npx prisma migrate deploy                # Production deployment
npx prisma generate                      # Regenerate client
```

---

## 6. API Endpoints

### Authentication & Study Setup

```http
POST   /auth/register
POST   /study/consent               # body: {documentVersion, accepted}
POST   /study/randomize             # admin-only; assigns GE/GC and feature flags
GET    /study/randomize/summary     # admin-only; shows assigned vs pending
GET    /study/feature-flags         # returns flags + assigned group
```

### Assessments

```http
GET    /evaluations/items?type=pretest|posttest  # Versioned item bank (no AI)
POST   /evaluations                               # Save score + item-level
GET    /evaluations                               # Participant history
```

### Practice & Tutoring

```http
GET    /activities/exercise         # Adaptive exercise
POST   /activities/exercise/submit  # Save result
POST   /ai/hint                     # TutorAgent (GE only), logs to feedback_ia
POST   /events                      # Fine-grained telemetry
GET    /events                      # Retrieve recent events
```

### Surveys

```http
GET    /survey/items?instrument=... # Likert catalog (item-level)
POST   /survey/submit               # Save item-level submission
```

### Admin & Export

```http
GET    /admin/export?type=ancova    # Consolidated CSV
GET    /admin/export/report         # JSON report (summary + dataset)
PATCH  /admin/users/:id/feature-flags  # Toggle tutor/chatbot (admin)
```

### Export Response Format (`/exports/ancova-dataset`)

```json
{
  "id_usuario": "UUID-ANON",
  "grupo": "GE",
  "pretest": 48,
  "postest": 68,
  "tam_utilidad": 4.2,
  "tam_facilidad": 4.3,
  "mot_pre": 3.1,
  "mot_post": 3.6,
  "auto_pre": 3.0,
  "auto_post": 3.5,
  "sesiones_semana": 3,
  "minutos_totales": 430,
  "ejercicios_resueltos": 220,
  "porc_aciertos": 0.72,
  "edad": 24,
  "nivel_estudio": "secundaria"
}
```

---

## 7. Experimental Protocol (Screen Flow)

1. **Consent** -> `POST /auth/consent` -> creates `consentimientos`
2. **Registration** -> automatic **round-robin** assignment (GE/GC) with auto-creation of `feature_flags`; immediately forces **Pretest** (no AI), saves `evaluaciones` + `respuestas_test`
3. **Manual Randomization** (`/study/randomize`) -> optional for admins; rebalance and regenerate `asignaciones` and **feature_flags**:
   - GE: `chatbot=true`, `adaptativo=true`
   - GC: `chatbot=false`, `adaptativo=false` (UI shows equivalent resources)
4. **Intervention (8-10 weeks)**
   - GE: adaptive practice (LLM) + TutorAgent (hints/explanations) + AI modules
   - GC: standard practice (`practice_v1` bank) + static `control-v1` modules
   - Telemetry in `eventos` + aggregates in `actividades`
5. **Posttest** (blocks AI)
6. **Surveys**: Motivation/Autonomy + **TAM** (item-level)
7. **Export**: `/exports/ancova-dataset` or `/admin/export/report` for analysis

### UI Gating Rules

- **Assessments (pre/post)**: No chatbot, no hints, no copy/paste, visible timer
- **Mandatory pretest after login**: Redirect to `/study/pretest` until complete
- **GE vs GC**: Conditional buttons/actions per `feature_flags`
- **Daily Learning**: Adherence bar and goal >=3 sessions/week
- **Progress Report**: Shows "dose" (minutes, exercises, accuracy, streaks)

---

## 8. Synthetic Data Generation

For testing and development without real user data:

```bash
cd backend
npm run seed:synthetic    # Generate 65 users with complete histories
npx tsx verify-data.ts    # Verify generated data
```

### Distribution

- **65% complete flow** (42 users): consent -> pretest -> practice -> posttest -> survey
- **18% pretest only** (12 users): registered but didn't practice
- **17% partial flow** (11 users): pretest + practice, no posttest
- **50/50 GE/GC** group assignment

### Generated Data Includes

- Realistic Peruvian names and demographics
- 2-4 practice sessions per active user (3-8 exercises each)
- Realistic improvement patterns (posttest > pretest for most)
- AI tutor feedback (GE only)
- Telemetry events (~2,400+ total)
- TAM survey responses

### Test Credentials

- Password (all users): `password123`
- Email format: `{firstname}.{lastname}{number}@example.com`
- Example: `maria.rojas1@example.com`

---

## 9. Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend development server |
| `npm start` | Frontend development server |
| `npx tsc --noEmit` | Type-check backend |
| `npm run build` | Production frontend build |
| `npx prisma format` | Format Prisma schema |
| `npx prisma migrate dev --name <label>` | Create migration |
| `npx prisma db seed` | Seed item banks |
| `npm run seed:synthetic` | Generate synthetic users |
| `npx tsx verify-data.ts` | Verify synthetic data |
| `pytest` | AI module tests |

---

## 10. Ethics, Privacy & Guardrails

- **Pseudonymization** in exports (no email)
- **PII separation** (User table vs analytic views)
- **No PII in prompts**: Hash stored in `feedback_ia.prompt_hash`
- **Retention**: Define TTL for raw `eventos` if size grows
- **Transparency in UI**: "AI active" label (GE), data policy, withdrawal rights
- **Ethical approval** required before data collection

### Guardrail Example (FastAPI)

```python
def redact(text: str) -> str:
    patterns = [r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", r"\+?\d[\d\-\s]{7,}"]
    for p in patterns:
        text = re.sub(p, "[REDACTED]", text)
    return text
```

---

## 11. Deployment Checklist

1. Configure `DATABASE_URL` for production; run `npx prisma migrate deploy` then `npx prisma db seed` (if fresh)
2. Set env vars per service (`JWT_SECRET`, API keys, feature flags)
3. Build frontend (`npm run build`) and deploy to Vercel/static host
4. Deploy backend (Railway/Render). Confirm `/health` endpoint and secure CORS origins
5. Deploy AI module (Railway). Update `AI_SERVICE_URL` as needed
6. Smoke-test: consent -> pretest -> dashboard -> survey -> export flow on staging

---

## 12. QA Acceptance Criteria

- [ ] **Randomization** creates correct `asignaciones` and `feature_flags`
- [ ] **Consent** saved with `version_documento`
- [ ] **Pre/Post** register items and score; AI blocked
- [ ] **Surveys** save item-level; subscale calculation in views
- [ ] **Telemetry** registers `eventos` and `actividades`
- [ ] **Export** returns exactly defined fields with **N rows = N users with posttest**
- [ ] **PII** doesn't appear in views or exports

---

## 13. Development Roadmap

- **Sprint 1:** DB migrations + consent + randomization + pretest
- **Sprint 2:** Practice + TutorAgent (GE) + gating (GC) + basic telemetry
- **Sprint 3:** Posttest + item-level surveys + SQL views + export
- **Sprint 4:** Adaptive planner + reports + adherence reminders
- **Sprint 5:** QA, security, analysis documentation (R/SPSS notebooks)

---

## 14. Admin Operations

- Admin panel at `/admin` allows:
  - Consulting metrics
  - Downloading complete reports (`Reporte completo`)
  - Toggling AI tutor/chatbot per participant (`PATCH /admin/users/:id/feature-flags`)
- Enabling AI tutor automatically reassigns to **GE**; disabling returns to **GC**

---

## Appendix A: Randomization Example

```typescript
// POST /randomize
const users = await prisma.usuarios.findMany({ where: { randomized: false } });
shuffleWithSeed(users, seed);
for (const [i, u] of users.entries()) {
  const grupo = i % 2 === 0 ? "GE" : "GC";
  await prisma.asignaciones.create({
    data: { id_usuario: u.id_usuario, grupo, metodo: "azar", seed },
  });
  await prisma.feature_flags.create({
    data: {
      id_usuario: u.id_usuario,
      chatbot: grupo === "GE",
      adaptativo: grupo === "GE",
    },
  });
}
```

---

## File Structure

```
tesis_ai_math_app/
├── frontend/          # React + Tailwind (CRA)
├── backend/           # Express + Prisma + TypeScript
│   └── prisma/        # Schema, migrations, seeds
├── ai_module/         # FastAPI (Python)
├── designs/           # UI mocks (HTML + PNG)
├── dev.sh             # One-shot dev launcher
└── README.md          # This documentation
```
