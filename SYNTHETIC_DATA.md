# Synthetic Data Generation

This document describes the synthetic data generation system for the AI Math Learning Platform.

## Overview

The synthetic data generator (`backend/prisma/seed-synthetic.ts`) creates realistic test data simulating real user behavior over the last 20 days. This is useful for:

- Development and testing without real user data
- Demonstrating the platform functionality
- Validating data analysis and export pipelines
- Training and onboarding new developers

## Quick Start

```bash
cd backend
npm run seed:synthetic
```

This generates **65 users** with complete usage histories spanning the last 20 days.

## User Distribution

### Trajectory Types

The generator creates three types of user trajectories to simulate realistic dropout patterns:

1. **Complete Flow (42 users, 65%)**
   - Consent → Pretest → Practice sessions → Posttest → Survey
   - Represents committed users who complete the full study

2. **Pretest Only (12 users, 18%)**
   - Consent → Pretest only
   - Represents users who register but don't engage further

3. **Partial Flow (11 users, 17%)**
   - Consent → Pretest → Practice sessions (no posttest)
   - Represents users who practice but don't complete final assessment

### Group Assignment

- **50% GE (Experimental Group)** - Users with chatbot/AI tutor access
- **50% GC (Control Group)** - Users without AI features

## Generated Data Details

### User Profiles

Each user includes:
- Realistic Peruvian names (e.g., "María Fernanda Rojas Paredes")
- Ages: 18-55 years
- Education levels: high school or university
- Math levels: beginner, intermediate, or advanced
- Goals related to mathematics learning
- Location references (Lima districts: Los Olivos, Comas, etc.)

**Credentials:**
- Password (all users): `password123`
- Email format: `{firstname}.{lastname}{number}@example.com`

### Practice Sessions

For users with practice data:
- **2-4 sessions** per user (optimized from 3-7)
- **3-8 exercises** per session (optimized from 5-15)
- **15-40 minutes** duration per session
- Sessions distributed across multiple days
- Progressive improvement in accuracy (40-85%)

### Assessments

**Pretest (all 65 users):**
- 24 items from the v1 item bank
- Scores: 4-11 correct (varied skill levels)
- Duration: 15-35 minutes

**Posttest (42 complete-flow users):**
- 24 items from the exit_v1 item bank
- Realistic improvement patterns:
  - 85% show improvement (5-30% gain)
  - 15% show minimal or no improvement
- Duration: 15-35 minutes

### AI Feedback

For GE (experimental) group users only:
- Contextual hints when users make mistakes
- ~40% probability of requesting hint after incorrect answer
- Token counts: 50-150 per message
- Message types: hints, explanations, motivation

### Telemetry Events

Comprehensive event tracking including:
- `session_start` / `session_end`
- `correct` / `incorrect` answer events
- `hint` requests (GE group only)
- `streak` achievements
- Theory module progress events

**Total events generated:** ~2,400+ across all users

### Surveys

TAM (Technology Acceptance Model) surveys for complete-flow users:
- 8 items per survey
- Likert scale 1-5
- 70% positive responses (4-5)
- 30% neutral/mixed responses (2-3)

## Date Distribution

- **Range:** Last 20 days from current date
- **Registration dates:** Distributed throughout the period
- **Activity progression:**
  - Day 0: User registration + consent
  - Day 1: Pretest
  - Days 2-15: Practice sessions (spread across multiple days)
  - Days 16-19: Posttest (for complete-flow users)

## Database Impact

Running the script generates approximately:

| Table | Records |
|-------|---------|
| Users | 65 |
| Consents | 65 |
| Assignments | 65 |
| Feature Flags | 65 |
| Infrastructure | 65 |
| Assessments | 148 (83 pre + 65 post) |
| Assessment Responses | 3,552 (148 × 24 items) |
| Sessions | ~255 |
| Practice Generated | ~1,795 |
| Practice Attempts | ~1,795 |
| Events | ~2,474 |
| AI Feedback | ~169 (GE only) |
| Survey Submissions | 59 |
| Survey Responses | 472 (59 × 8 items) |

**Total records:** ~11,000+

## Verification

After generation, verify the data:

```bash
npx tsx verify-data.ts
```

This outputs:
- Total user count
- Group distribution (GE/GC)
- Assessment completion rates
- Practice statistics
- Event counts
- Survey completion
- Date ranges

## Customization

To modify the generation parameters, edit `backend/prisma/seed-synthetic.ts`:

```typescript
const totalUsers = 65;                           // Total users to generate
const completeFlowUsers = 42;                    // 65% complete flow
const pretestOnlyUsers = 12;                     // 18% pretest only
const practiceWithoutPosttestUsers = 11;         // 17% partial flow

const numPracticeSessions = 2 + Math.floor(Math.random() * 3);  // 2-4 sessions
const numExercises = 3 + Math.floor(Math.random() * 6);         // 3-8 exercises
```

## Performance

- Generation time: ~10-15 minutes (optimized version)
- Database size impact: ~5-10 MB for 65 users
- Can be run multiple times (creates new users each time)

## Notes

- The script does NOT delete existing data
- Running multiple times will add more users to the database
- Use `npx prisma migrate reset` to start fresh (WARNING: deletes all data)
- Synthetic data is marked with realistic but fictional information
- No real PII is generated or stored

## Related Files

- `backend/prisma/seed-synthetic.ts` - Main generation script
- `backend/verify-data.ts` - Verification script
- `backend/prisma/seed.ts` - Item bank seeding (prerequisite)
- `backend/package.json` - NPM scripts configuration
