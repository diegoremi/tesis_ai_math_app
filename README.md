# AI Math Learning Platform

> **Tesis:** Impacto de una plataforma educativa basada en inteligencia artificial en el aprendizaje autónomo de matemáticas en jóvenes y adultos del distrito Los Olivos, Lima, 2025.
>
> **Diseño:** Investigación aplicada, nivel explicativo, diseño cuasi-experimental (GE vs GC), pretest–postest, análisis ANCOVA.
>
> **Dataset principal:** `/admin/export?type=ancova` con trazabilidad completa (consentimiento, asignación, versiones de instrumentos, telemetría).

---

## 1. Contexto del Estudio

### 1.1 Diseño de Investigación

| Aspecto | Descripción |
|---------|-------------|
| **Tipo** | Investigación aplicada, nivel explicativo |
| **Diseño** | Cuasi-experimental con grupo experimental (GE) y grupo control (GC) |
| **Análisis** | Pretest–postest con ANCOVA ajustando por pretest |
| **Población** | Jóvenes y adultos (≥ 18 años) del distrito Los Olivos, Lima |
| **Muestra objetivo** | ~100 participantes (GE ≈ 50, GC ≈ 50) |
| **Duración** | 8–10 semanas de intervención |

### 1.2 Variables del Estudio

| Variable | Tipo | Descripción |
|----------|------|-------------|
| **Uso de plataforma IA** | Independiente (VI) | Condición GE vs GC; exposición a funcionalidades IA |
| **Rendimiento en matemáticas** | Dependiente (VD1) | Medido mediante pretest/postest |
| **Aprendizaje autónomo** | Dependiente (VD2) | Subescala de la Escala de Aprendizaje Autónomo y Motivación |
| **Motivación** | Dependiente (VD3) | Subescala de la Escala de Aprendizaje Autónomo y Motivación |
| **Aceptación tecnológica** | Adicional | Modelo TAM: utilidad percibida y facilidad de uso |
| **Condiciones de implementación** | Moderador | Infraestructura, conectividad, dispositivo, entorno de estudio |

### 1.3 Mapeo Variables ↔ Instrumentos ↔ Tablas/Vistas

> **Nota de naming:** El término *evaluación* en la tesis corresponde a las tablas/modelos `Assessment*` en la base de datos y en el código. Esta convención sigue el estándar técnico en inglés mientras mantiene la terminología académica en español en la documentación.

| Variable | Instrumento | Tabla BD | Campos Export |
|----------|-------------|----------|---------------|
| Rendimiento (VD1) | Prueba de logro (pre/post) | `Assessment`, `AssessmentResponse`, `AssessmentItem` | `pretest`, `postest` |
| Autonomía (VD2) | Escala Aprendizaje Autónomo y Motivación (subescala autonomía) | `SurveySubmission`, `SurveyResponse` (instrument=`autonomia`) | `auto_pre`, `auto_post` |
| Motivación (VD3) | Escala Aprendizaje Autónomo y Motivación (subescala motivación) | `SurveySubmission`, `SurveyResponse` (instrument=`motivacion`) | `mot_pre`, `mot_post` |
| Aceptación TAM | Escala TAM | `SurveySubmission`, `SurveyResponse` (instrument=`tam`) | `tam_utilidad`, `tam_facilidad` |
| Condiciones (Moderador) | Ficha de condiciones de implementación | `Infrastructure` | `device`, `internet_connection` |
| Uso/Dosis | Telemetría de uso | `Event`, `Session`, `PracticeAttempt` | `sesiones_semana`, `minutos_totales`, `ejercicios_resueltos`, `porc_aciertos` |

### 1.4 Flujo Experimental

```
Consentimiento → Randomización 1:1 (GE/GC) → Pretest → Intervención (8-10 sem) → Postest → Encuestas → Export
```

---

## 2. Overview del Proyecto

Plataforma de aprendizaje de matemáticas impulsada por IA que soporta un estudio experimental de grado investigativo (GE vs GC) evaluando el impacto en el aprendizaje autónomo y la motivación.

### Quick Start

```bash
# Inicio rápido (levanta todos los servicios)
./dev.sh

# O iniciar cada servicio individualmente:
cd backend && npm install && npm run dev  # puerto 8080
cd frontend && npm install && npm start   # puerto 3000
cd ai_module && source .venv/bin/activate && uvicorn main:app --reload  # puerto 8001
```

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  UI (React/Tailwind)                                            │
│  Onboarding, Pre/Post, Practice, Chatbot, Surveys, Reports      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  API (Node/Express + Prisma)                                   │
│  Auth, Consent, Randomization, Gating, Assessments, Exports    │
└─────────────────┬───────────────────────────┬─────────────────┘
                  │                           │
                  ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │  PostgreSQL     │         │  AI Module      │
        │  (Neon/Vercel)  │         │  (FastAPI)      │
        └─────────────────┘         └─────────────────┘
```

### Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Frontend** | `frontend/` | React + Tailwind: dashboards, flujo de estudio, ejercicios, encuestas, chatbot (feature-flag) |
| **Backend** | `backend/` | Express + TypeScript + Prisma: auth, consentimiento, randomización, gating GE/GC, assessments, telemetría, exports |
| **AI Module** | `ai_module/` | FastAPI (Gemini/OpenAI): hints, tutoring, generación de ejercicios, módulos de teoría |

---

## 4. MVP vs Backlog

### ✅ MVP (Requerido para el experimento)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Registro y autenticación | ✅ | JWT, roles (student/facilitator/admin) |
| Consentimiento informado | ✅ | Descarga de documento, aceptación versionada |
| Randomización 1:1 GE/GC | ✅ | Asignación automática balanceada |
| Feature flags GE/GC | ✅ | Gating de chatbot y funciones adaptativas |
| Pretest (sin IA) | ✅ | Items versionados, timer, anti-copy |
| Práctica con ejercicios | ✅ | GE: LLM-generated / GC: banco estático |
| TutorAgent (hints) | ✅ | Solo GE, hints graduados |
| Módulos de teoría | ✅ | GE: generados / GC: estáticos |
| Postest (sin IA) | ✅ | Items versionados, timer, anti-copy |
| Encuesta Autonomía/Motivación | ✅ | Item-level, timepoints pre/post |
| Encuesta TAM | ✅ | Item-level, utilidad y facilidad |
| Ficha de infraestructura | ✅ | Dispositivo, conectividad |
| Telemetría de eventos | ✅ | Sesiones, aciertos, streaks |
| Export ANCOVA | ✅ | CSV con todas las variables |
| Panel admin | ✅ | Métricas, toggle flags, exports |

### 📋 Backlog (Mejoras futuras)

| Funcionalidad | Prioridad | Descripción |
|---------------|-----------|-------------|
| Recordatorios por email | Media | Notificaciones de adherencia |
| Planner adaptativo avanzado | Baja | ML para secuenciación óptima |
| Dashboard de facilitador | Media | Vista de progreso por cohorte |
| Reports estadísticos in-app | Baja | Gráficos de distribución |
| Tests automatizados E2E | Media | Cypress/Playwright |

---

## 5. Instrumentos y Enums

### 5.1 SurveyInstrument

```prisma
enum SurveyInstrument {
  motivacion    // Subescala motivación (Escala Aprendizaje Autónomo y Motivación)
  autonomia     // Subescala autonomía (Escala Aprendizaje Autónomo y Motivación)
  tam           // Escala TAM (utilidad percibida + facilidad de uso)
  satisfaccion  // Variable exploratoria secundaria (NO variable principal)
}
```

**Notas:**

- **`autonomia` y `motivacion`**: Dos instrumentos lógicos que forman parte de una misma escala global de "Aprendizaje Autónomo y Motivación". Se almacenan por separado por razones técnicas, pero conceptualmente se reportan juntos con subdimensiones.

- **`tam`**: Escala de Aceptación Tecnológica basada en el modelo TAM, con subdimensiones `tam_utilidad` (perceived usefulness) y `tam_facilidad` (perceived ease of use).

- **`satisfaccion`**: Variable exploratoria secundaria. **NO es variable principal de la tesis ni forma parte del modelo ANCOVA**. Se mantiene implementada para análisis complementarios opcionales, pero no se incluye en el export principal (`/admin/export?type=ancova`). Si se requiere en el futuro, puede agregarse como análisis post-hoc.

### 5.2 Infrastructure (Moderador)

La tabla `Infrastructure` captura las **condiciones de implementación** (variable moderadora):

| Campo | Valores | Descripción |
|-------|---------|-------------|
| `device` | `PC`, `mobile`, `tablet` | Tipo de dispositivo |
| `internet_connection` | `high`, `medium`, `low` | Calidad de conexión |
| `observations` | Texto libre | Notas sobre entorno de estudio |

### 5.3 Otros Enums Clave

```prisma
enum AssignmentGroup { GE, GC }
enum AssignmentMethod { azar, emparejamiento }
enum AssessmentType { pretest, posttest }
enum SurveyTimepoint { pre, post, exit, follow_up }
```

**Uso en este estudio vs. valores reservados:**

| Enum | Valores usados en esta tesis | Valores reservados (futuros) |
|------|------------------------------|------------------------------|
| `AssignmentMethod` | `azar` (randomización 1:1) | `emparejamiento` (matching por covariables) |
| `SurveyTimepoint` | `pre`, `post` | `exit`, `follow_up` (seguimiento longitudinal) |
| `AssignmentGroup` | `GE`, `GC` | — (todos usados) |
| `AssessmentType` | `pretest`, `posttest` | — (todos usados) |

> **Nota:** Los valores reservados están implementados en el schema para extensibilidad futura, pero **no se utilizan en los análisis de esta tesis**. El export ANCOVA solo incluye datos de timepoints `pre` y `post`.

---

## 6. Randomización

### Implementación

La asignación a grupos es una **randomización 1:1 simple controlada por software**, implementada operativamente como un **algoritmo round-robin** con opción de rebalanceo, equivalente a una aleatorización simple balanceada.

```typescript
// POST /study/randomize (admin) o automático en registro
for (const [i, user] of users.entries()) {
  const grupo = i % 2 === 0 ? "GE" : "GC";  // Round-robin 1:1
  await prisma.assignment.create({ data: { user_id, group: grupo, method: "azar" } });
  await prisma.featureFlag.create({
    data: { user_id, chatbot: grupo === "GE", adaptativo: grupo === "GE" },
  });
}
```

### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/study/randomize` | POST | Admin: asigna usuarios pendientes a GE/GC |
| `/study/randomize/summary` | GET | Admin: resumen asignados vs pendientes |
| `/study/feature-flags` | GET | Usuario: obtiene sus flags y grupo |

### Feature Flags por Grupo

| Grupo | `chatbot` | `adaptativo` | Experiencia |
|-------|-----------|--------------|-------------|
| **GE** | `true` | `true` | IA completa: hints, ejercicios LLM, teoría generada |
| **GC** | `false` | `false` | Recursos estándar: banco estático, teoría manual |

---

## 7. Agentes (Comportamiento)

### 7.1 TutorAgent
- **GE**: Hints graduados → explicación paso a paso → solución bajo demanda
- **GC**: Deshabilitado (UI y API rechazan requests)
- **Logs**: Tabla `AIFeedback` (type: hint/explanation/motivation), sin PII

### 7.2 PlannerAgent / TheoryGen
- Usa pretest, errores por dominio y telemetría para planificar ejercicios
- **GE**: Genera módulos de teoría personalizados vía Gemini
- **GC**: Sirve biblioteca estática (6 templates) con `version=control-v1`

### 7.3 PracticeGen Agent
- Genera items on-demand con LLM (Gemini/OpenAI)
- **GC** (o fallas IA): Entrega set curado `practice_v1`

### 7.4 AssessmentAgent
- Pre/Post **sin IA**: Items de banco versionado; timer; anti-copy
- Guarda **respuestas item-level** para psicometría

---

## 8. Base de Datos (PostgreSQL + Prisma)

### Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `User` | Identidad con `participant_code` (pseudónimo), demografía, rol |
| `Consent` | Aceptación IRB por versión de documento |
| `Assignment` | Asignación GE/GC, método (azar/emparejamiento) |
| `FeatureFlag` | Toggles por usuario (`chatbot`, `adaptativo`) |
| `AssessmentItem` | Banco de items versionado |
| `Assessment` | Intentos pre/post con versión, timestamps, score |
| `AssessmentResponse` | Respuestas item-level |
| `SurveyItem` | Reactivos Likert por instrumento/versión |
| `SurveySubmission` | Instrumentos completados |
| `SurveyResponse` | Respuestas item-level (1-5) |
| `Infrastructure` | Condiciones de implementación (moderador) |
| `Event` | Telemetría de alta frecuencia |
| `Session` | Ventanas de uso autenticado |
| `AIFeedback` | Emisiones del TutorAgent |
| `PracticeGenerated` | Items de práctica generados |
| `PracticeAttempt` | Intentos del usuario |

---

## 9. API Endpoints

### Autenticación y Estudio

```http
POST   /auth/register
POST   /study/consent
POST   /study/randomize             # admin
GET    /study/randomize/summary     # admin
GET    /study/feature-flags
```

### Assessments

```http
GET    /evaluations/items?type=pretest|posttest
POST   /evaluations
GET    /evaluations
```

### Práctica y Tutoría

```http
GET    /activities/exercise
POST   /activities/exercise/submit
POST   /ai/hint                     # GE only
POST   /events
```

### Encuestas

```http
GET    /survey/items?instrument=...
POST   /survey/submit
```

### Admin y Export

```http
GET    /admin/export?type=ancova
GET    /admin/export/report
PATCH  /admin/users/:id/feature-flags
```

### Formato Export ANCOVA

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
  "device": "PC",
  "internet_connection": "high",
  "sesiones_semana": 3,
  "minutos_totales": 430,
  "ejercicios_resueltos": 220,
  "porc_aciertos": 0.72,
  "edad": 24,
  "nivel_estudio": "secundaria"
}
```

---

## 10. Protocolo Experimental

1. **Consentimiento** → `POST /study/consent` → crea `Consent`
2. **Registro** → asignación automática round-robin 1:1 (GE/GC) + `FeatureFlag`
3. **Pretest** (sin IA) → guarda `Assessment` + `AssessmentResponse`
4. **Intervención (8-10 semanas)**
   - GE: práctica adaptativa + TutorAgent + módulos IA
   - GC: práctica estándar + módulos estáticos
5. **Postest** (bloquea IA)
6. **Encuestas**: Autonomía/Motivación + TAM (item-level)
7. **Export**: `/admin/export?type=ancova`

### Reglas de Gating UI

- **Assessments**: Sin chatbot, sin hints, sin copy/paste, timer visible
- **Pretest obligatorio**: Redirect hasta completar
- **GE vs GC**: Acciones condicionales según `featureFlag`

---

## 11. Alineación con la Tesis

Este proyecto implementa **exactamente** el diseño de investigación descrito en la tesis:

### Variables Implementadas

| Variable Tesis | Implementación App |
|----------------|-------------------|
| VI: Uso de plataforma IA (GE vs GC) | `Assignment.group` + `FeatureFlag` |
| VD1: Rendimiento matemáticas | `Assessment` (pretest/posttest) + `AssessmentResponse` |
| VD2: Aprendizaje autónomo | `SurveySubmission` (instrument=autonomia) |
| VD3: Motivación | `SurveySubmission` (instrument=motivacion) |
| TAM (variable adicional) | `SurveySubmission` (instrument=tam) |
| Moderador: Condiciones | `Infrastructure` (device, internet_connection) |

### Instrumentos Implementados

| Instrumento Tesis | Tabla/Modelo | Endpoint |
|-------------------|--------------|----------|
| Prueba de logro (pre/post) | `AssessmentItem`, `Assessment`, `AssessmentResponse` | `/evaluations/*` |
| Escala Aprendizaje Autónomo y Motivación | `SurveyItem`, `SurveySubmission`, `SurveyResponse` | `/survey/*` |
| Escala TAM | `SurveyItem`, `SurveySubmission`, `SurveyResponse` | `/survey/*` |
| Ficha condiciones implementación | `Infrastructure` | Onboarding |

### Dataset para Análisis Estadístico

El endpoint `/admin/export?type=ancova` devuelve CSV con los campos necesarios para ANCOVA:

- **Identificación**: `id_usuario` (pseudonimizado)
- **Grupo**: `grupo` (GE/GC)
- **VD1**: `pretest`, `postest`
- **VD2-VD3**: `auto_pre`, `auto_post`, `mot_pre`, `mot_post`
- **TAM**: `tam_utilidad`, `tam_facilidad`
- **Moderador**: `device`, `internet_connection`
- **Dosis**: `sesiones_semana`, `minutos_totales`, `ejercicios_resueltos`, `porc_aciertos`
- **Covariables**: `edad`, `nivel_estudio`

---

## 12. Setup

### Requisitos

- Node.js 20+, npm 10+
- Python 3.11+
- PostgreSQL (Neon/Supabase/Vercel Postgres)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET, API keys
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### AI Module

```bash
cd ai_module
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Variables de Entorno

```env
DATABASE_URL=postgres://...
JWT_SECRET=...
AI_PROVIDER=gemini
GEMINI_API_KEY=...
AI_SERVICE_URL=http://localhost:8001
```

---

## 13. Scripts de Referencia

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Backend desarrollo |
| `npm start` | Frontend desarrollo |
| `npx prisma db seed` | Seed bancos de items |
| `npm run db:reset-users` | Limpiar datos de usuarios (preserva bancos de items) |
| `npm run seed:synthetic` | Generar 60 usuarios sintéticos con patrones ANCOVA |

---

## 13.1. Datos Sintéticos para SPSS/ANCOVA

El script `prisma/seed-synthetic.ts` genera datos realistas para pruebas de hipótesis y verificación del pipeline de análisis.

### Ejecución

```bash
# 1. Limpiar datos existentes (preserva bancos de items)
npm run db:reset-users

# 2. Generar datos sintéticos
npm run seed:synthetic
```

### Características de los Datos Generados

| Aspecto | Implementación |
|---------|----------------|
| **Total usuarios** | 60 (configurable) |
| **Balance GE/GC** | ~52% GE, ~48% GC (round-robin) |
| **Nombres** | 50 apellidos + 50 nombres femeninos + 50 masculinos peruanos |
| **Distritos** | Ponderados (Los Olivos 35%, SMP 15%, etc.) |
| **Emails** | 8 patrones realistas (gmail, hotmail, outlook) |
| **Edades** | Distribución normal μ=28, σ=8, rango [18-55] |

### Patrones Estadísticos (Diseñados para ANCOVA)

```
Pretest:   GE y GC similares (M ≈ 10, SD ≈ 3)
Postest:   GE > GC con efecto moderado-grande
Mejora GE: +5.5 puntos (SD 2.5)
Mejora GC: +2.0 puntos (SD 2.0)
Cohen's d: ~0.5 a 1.2 (efecto moderado a grande)
```

### Trayectorias de Usuario

| Trayectoria | % | Descripción |
|-------------|---|-------------|
| `complete` | 67% | Pretest → Práctica → Postest → Encuestas |
| `pretest_only` | 15% | Solo pretest (abandono temprano) |
| `no_posttest` | 18% | Práctica sin postest |

### Infraestructura como Moderador

El script simula el impacto de las condiciones de implementación:

| Conexión | % Usuarios | Multiplicador Sesiones | Penalización Precisión |
|----------|------------|------------------------|------------------------|
| `high` | 50% | 1.0x | 0% |
| `medium` | 35% | 0.8x | -3% |
| `low` | 15% | 0.5x | -10% |

### Encuestas Generadas

- **Autonomía** (pre/post): 6 items, escala Likert 1-5
- **Motivación** (pre/post): 6 items, escala Likert 1-5
- **TAM** (post): 8 items, subescalas utilidad (3) y facilidad (5)

### Verificación de Estadísticas

Al ejecutar el seed, se muestra un resumen para verificar antes de exportar a SPSS:

```
📈 GRUPO EXPERIMENTAL (GE):
   Pretest:  n=31, M=10.06, SD=2.98
   Postest:  n=19, M=16.95, SD=3.32
   Ganancia: M=6.89

📉 GRUPO CONTROL (GC):
   Pretest:  n=29, M=9.93, SD=2.63
   Postest:  n=21, M=12.76, SD=3.79
   Ganancia: M=2.83

🎯 Cohen's d estimado: 1.18
```

---

## 13.2. Export para SPSS

### Endpoint CSV

```http
GET /admin/export?type=ancova
Authorization: Bearer {token_admin}
```

Devuelve CSV compatible con IBM SPSS con todas las variables del modelo ANCOVA.

### Columnas del Export

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_usuario` | UUID | Código pseudonimizado |
| `grupo` | Categórico | GE / GC |
| `pretest` | Numérico | Puntaje pretest (0-24) |
| `postest` | Numérico | Puntaje postest (0-24) |
| `tam_utilidad` | Numérico | Promedio subescala TAM utilidad (1-5) |
| `tam_facilidad` | Numérico | Promedio subescala TAM facilidad (1-5) |
| `mot_pre` | Numérico | Promedio motivación pre (1-5) |
| `mot_post` | Numérico | Promedio motivación post (1-5) |
| `auto_pre` | Numérico | Promedio autonomía pre (1-5) |
| `auto_post` | Numérico | Promedio autonomía post (1-5) |
| `device` | Categórico | PC / mobile / tablet |
| `internet_connection` | Categórico | high / medium / low |
| `sesiones_semana` | Numérico | Sesiones promedio por semana |
| `minutos_totales` | Numérico | Tiempo total de uso (minutos) |
| `ejercicios_resueltos` | Numérico | Total ejercicios correctos |
| `porc_aciertos` | Numérico | Proporción de aciertos (0-1) |
| `edad` | Numérico | Edad del participante |
| `nivel_estudio` | Categórico | secundaria / universitaria / otro |

### Importar en SPSS

1. **File > Open > Data** → Seleccionar `ancova_dataset.csv`
2. Verificar tipos de variable (numérico vs string)
3. Definir variables categóricas: `grupo`, `device`, `internet_connection`, `nivel_estudio`
4. Ejecutar ANCOVA: **Analyze > General Linear Model > Univariate**
   - Dependiente: `postest`
   - Factor fijo: `grupo`
   - Covariables: `pretest`, `edad`

---

## 14. Ética y Privacidad

- **Pseudonimización** en exports (sin email)
- **Sin PII en prompts**: Hash en `AIFeedback.prompt_hash`
- **Transparencia UI**: Label "IA activa" (GE), política de datos
- **Aprobación ética** requerida antes de recolección

---

## 15. Estructura de Archivos

```
tesis_ai_math_app/
├── frontend/          # React + Tailwind
├── backend/           # Express + Prisma + TypeScript
│   └── prisma/        # Schema, migrations, seeds
├── ai_module/         # FastAPI (Python)
├── designs/           # UI mocks
├── dev.sh             # Lanzador dev
└── README.md
```
