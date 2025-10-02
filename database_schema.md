# Database Schema – Prisma Postgres

This document mirrors the schema defined in `backend/prisma/schema.prisma` after the research-oriented refactor. All tables live in the same PostgreSQL database managed through Prisma Migrate.

## Users and Identity
- **User** (`user_id`, `participant_code`, `email`, hashed credentials, demographics, study role). `participant_code` is the pseudonym shared with analytic exports. Relations: sessions, activities, assessments, survey submissions, telemetry, consents, assignments, feature flags, AI feedback, practice summaries.
- **Infrastructure** stores access constraints reported during onboarding (device, connection quality, observations).

## Consent, Randomisation, Feature Gating
- **Consent** captures IRB acceptance per document version (`accepted`, `document_version`, timestamp).
- **Assignment** holds experimental grouping (`group`: GE/GC, `method`: azar/emparejamiento, optional seed).
- **FeatureFlag** keeps the per-user gating toggles (`chatbot`, `adaptativo`) that the UI and backend consult before enabling AI functionality.

## Assessment Engine
- **AssessmentItem** is the versioned item bank with domain/competency metadata and multiple-choice options (JSON array) plus the correct key.
- **Assessment** stores each attempt (pre/post) with version tag, optional start/finish timestamps, and total score.
- **AssessmentResponse** keeps item-level answers (`answer`, `is_correct`) linked to both the submission and the source item. Cascade deletes ensure clean removal when an assessment is dropped.

## Practice & Telemetry
- **Activity** retains adaptive practice aggregates (attempt counts, correct answers, difficulty, optional duration/domain metadata).
- **PracticeSummary** allows higher-level dose tracking per modality (`exercise`, `quiz`, `flashcard`).
- **Session** logs authenticated usage windows with device info and total time.
- **Event** is the high-frequency telemetry table (`event_type`, JSON metadata, timestamp) powering adherence analytics.
- **AIFeedback** registers TutorAgent emissions with `prompt_hash` (PII scrubbed) and optional token counts for cost control.

## Surveys
- **SurveyItem** catalogues Likert statements per instrument/version (`motivacion`, `autonomia`, `tam`, `satisfaccion`).
- **SurveySubmission** persists each completed instrument with timestamp and participant reference.
- **SurveyResponse** holds item-level scores (1–5) for every submission, enabling subscale calculations.
- **Survey** (legacy) keeps the original aggregated fields (`perceived_utility`, `ease_of_use`, `motivation`, `autonomy`, `comments`) used by the first MVP; it can be phased out after migrating controllers to the item-level flow.

## Enumerations
Key enums surfaced through Prisma:
- `EducationLevel` (`high_school`, `university`, `other`)
- `Role` (`student`, `facilitator`, `admin`)
- `ActivityType` (`arithmetic`, `algebra`, `problems`, `statistics`, `exercise`, `quiz`, `flashcard`)
- `DifficultyLevel` (`basic`, `intermediate`, `advanced`)
- `Status` (`completed`, `pending`, `in_progress`)
- `AssessmentType` (`pretest`, `posttest`)
- `AssignmentGroup` (`GE`, `GC`)
- `AssignmentMethod` (`azar`, `emparejamiento`)
- `SurveyInstrument` (`motivacion`, `autonomia`, `tam`, `satisfaccion`)
- `EventType` (`session_start`, `session_end`, `hint`, `correct`, `incorrect`, `streak`, `goal_met`)
- `PracticeType` (`exercise`, `quiz`, `flashcard`)
- Plus shared sets for connectivity (`InternetConnection`), device, gender, math level, and AI feedback message class.

## Planned Views & Exports
Once data accumulates, create SQL views (via Prisma `$executeRaw`) aligning with `AGENTS.md`:
- `vw_prepost`: compact pre/post scores per participant.
- `vw_usage`: treatment dose aggregation drawing from `Event` metadata.
- `vw_tam_scores`: subscale averages from `SurveyResponse` + `SurveyItem`.
- `vw_ancova_base`: full export joining assignments, demographics, assessments, and TAM subscales.

## Migration Workflow
1. Update `schema.prisma` and run `npx prisma migrate dev --name <change>` locally.
2. Review the generated SQL (`prisma/migrations/<timestamp>`) and add seeds for item banks or survey catalogs as needed.
3. Populate canonical item banks with `npx prisma db seed` (uses `prisma/seed.ts`).
4. Deploy with `npx prisma migrate deploy` and regenerate the client (`npx prisma generate`).
5. Keep this document in sync whenever the schema evolves.
