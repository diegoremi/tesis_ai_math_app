# ROADMAP.md

> Plan de implementacion por fases.
> Basado en: migrar a Vite+TS, usar OpenRouter como gateway IA, simplificar roles a student/admin.

## FASE 0 - Estabilizacion minima (Branch: fase/0-estabilizacion)

**Objetivo:** El proyecto debe levantar localmente de manera reproducible.

- [ ] Eliminar ai_module/venv/, __pycache__/, .DS_Store del tracking de Git
- [ ] Crear backend/.env.example completo
- [ ] Validar ai_module/.env.example y frontend/.env.example
- [ ] Corregir dev.sh (port conflicts, kill 0, echo formatting)
- [ ] Mover tsx a devDependencies
- [ ] Crear README_DEV.md con setup local paso a paso
- [ ] Verificar que npm install && ./dev.sh levanta los 3 servicios

**Salida:** README_DEV.md + repo limpio.

## FASE 1 - Backend hardening esencial (Branch: fase/1-backend-hardening)

**Objetivo:** Corregir bloqueantes de seguridad e integridad experimental.

- [ ] Prisma singleton: src/lib/prisma.ts
- [ ] Validacion de env: JWT_SECRET, DATABASE_URL requeridos al arranque
- [ ] CORS estricto: allowlist por environment, eliminar fallback
- [ ] Rate limiting: /api/auth/* y /api/ai/*
- [ ] Input validation: Zod en todos los endpoints criticos (auth, users, evaluations, surveys, study, practice)
- [ ] Fix mass assignment: createUserService hardcodea role: student; updateUserService con whitelist
- [ ] Fix assessment integrity: listAssessmentItems sin correct_key; createAssessment calcula puntaje server-side
- [ ] Fix postest unlocking: verificar studyStatus.posttestUnlocked server-side
- [ ] Fix practice ownership: verificar user_id en submitPracticeAnswer
- [ ] Fix theory checkpoint: stripear correct del JSON enviado al cliente
- [ ] Fix randomization race: conteo dentro de 
- [ ] Sanitizar logs: redactar PII en errorLogger.ts
- [ ] Fix admin export: excluir password_hash
- [ ] Fix || -> ?? en ANCOVA
- [ ] Schema fixes: cascades, @@unique([user_id]) en Assignment
- [ ] RBAC simplificado: solo student y admin (eliminar facilitator o dejarlo sin permisos especiales)
- [ ] Middleware de errores centralizado con codigos consistentes

**Salida:** Backend seguro, validaciones robustas, integridad experimental protegida.

## FASE 2 - Frontend: Migracion CRA -> Vite + TypeScript (Branch: fase/2-vite-ts)

**Objetivo:** Base moderna y mantenible.

- [ ] Crear frontend-vite/ con Vite + React 19 + TypeScript + Tailwind
- [ ] Migrar componentes criticos a TS (AuthContext, api client, Login, Register)
- [ ] Crear capa de API typed con axios interceptors (auth, 401 handling, error handling)
- [ ] Replicar routing exacto
- [ ] Verificar que build de produccion funciona
- [ ] Borrar frontend/ CRA y renombrar frontend-vite/ -> frontend/

**Salida:** Frontend en Vite+TS con arquitectura limpia.

## FASE 3 - Frontend: UX y flujos criticos (Branch: fase/3-frontend-ux)

**Objetivo:** UX solida, flujos experimentales respetados.

- [ ] Arquitectura de carpetas: components/, pages/, hooks/, services/, types/, utils/, routes/
- [ ] Fix layout raiz (eliminar App-header wrapper)
- [ ] React Error Boundary
- [ ] JWT expiration check en AuthContext
- [ ] 401 interceptor con redirect a login
- [ ] Timer + anti-copy en pre/postest (visibilitychange, onCopy, onContextMenu)
- [ ] Survey: inicializar en null, validar completitud
- [ ] Chatbot: check interno de featureFlags.chatbot
- [ ] Math rendering robusto (KaTeX error boundary)
- [ ] Loading/error/empty states en todos los flujos
- [ ] Responsive mobile-first
- [ ] Accesibilidad basica (labels, aria-live)

**Salida:** UX coherente, flujos experimentales protegidos en UI.

## FASE 4 - IA y pedagogia (Branch: fase/4-ia-pedagogia)

**Objetivo:** IA util, auditable, segura, con OpenRouter.

- [ ] Consolidar llamadas IA: Backend como gateway unico hacia OpenRouter. ai_module puede mantenerse como fallback o eliminarse gradualmente.
- [ ] Provider abstraction: OpenRouter client con soporte para DeepSeek/Gemini/OpenAI via model parameter
- [ ] Timeouts, retries, circuit breaker simple
- [ ] Validacion de output: schemas Zod/Pydantic para ejercicios, teoria, hints
- [ ] PII redaction robusta: aplicar en TODOS los endpoints (incluyendo ejercicios)
- [ ] Guardrails pedagogicos: system prompt que prohiba respuestas directas a tests
- [ ] Hints progresivos: no revelar respuesta en primer hint
- [ ] Practica adaptativa: usar historial de aciertos/errores por dominio + dificultad gradual
- [ ] GC equivalente: recursos estaticos en tiempo/temario equivalente, sin IA
- [ ] AI module cleanup: async calls, random.Random, datetime.now(timezone.utc), CORS

**Salida:** IA intercambiable, pedagogicamente sound, sin contaminacion GE/GC.

## FASE 5 - Testing (Branch: fase/5-testing)

**Objetivo:** Cobertura de flujos criticos.

- [ ] Backend tests: Vitest/Jest + supertest para endpoints criticos (auth, assessments, surveys, randomization, feature flags)
- [ ] Frontend tests: Vitest + Testing Library para componentes criticos
- [ ] Playwright E2E:
  - Registro -> login -> consentimiento -> randomizacion -> pretest -> dashboard -> practica -> postest -> encuestas
  - GC no puede acceder a chatbot/hints
  - Admin exporta ANCOVA
- [ ] Edge cases: token expirado, doble submit, IA caida, DB sin seed

**Salida:** Suite de tests automatizados que corren en CI.

## FASE 6 - Validez experimental y datos (Branch: fase/6-experimental-data)

**Objetivo:** Dataset robusto para analisis.

- [ ] Revisar trazabilidad: consentimiento -> randomizacion -> pretest -> intervencion -> postest -> encuestas
- [ ] Mejorar randomizacion: guardar seed, metodo, considerar estratificacion
- [ ] Export ANCOVA: mantener funcionando
- [ ] Export ITT/all-participants: incluir abandonos, missingness
- [ ] Diccionario de datos automatico
- [ ] Flags de calidad: completed_pretest, completed_postest, completed_surveys, dropout_stage
- [ ] Tests del export: una fila por usuario, GE/GC correcto, metricas consistentes

**Salida:** Exportes confiables, trazabilidad completa.

## FASE 7 - Admin y analiticas (Branch: fase/7-admin-analytics)

**Objetivo:** Dashboard util para el investigador.

- [ ] Usuarios por grupo, avance, abandonos
- [ ] Pre/post completion rates
- [ ] Metricas de uso (sesiones, ejercicios, aciertos)
- [ ] Calidad de datos: faltantes, inconsistencias
- [ ] Reporte simple: n GE/GC, promedios, tasa abandono, Cohen d estimado
- [ ] Warnings de datos

**Salida:** Panel admin con vision clara del estudio.

## FASE 8 - CI/CD y calidad (Branch: fase/8-cicd)

**Objetivo:** Calidad automatizada.

- [ ] Scripts: lint, typecheck, test, test:e2e, build
- [ ] GitHub Actions:
  - Backend: install -> lint -> typecheck -> test
  - Frontend: install -> lint -> typecheck -> build -> test
  - AI module: pytest
  - Playwright smoke tests
- [ ] Formatting: Prettier, ESLint, ruff/black
- [ ] Pre-commit hooks
- [ ] No merge si tests/build fallan

**Salida:** Pipeline CI/CD funcional.

## Quick Wins Inmediatos (antes de cualquier fase)

1. git rm -r --cached ai_module/venv ai_module/__pycache__
2. Crear backend/.env.example
3. Fix CORS en app.ts
4. Singleton PrismaClient
5. Strip correct_key
6. Hardcodear role: student
7. Sanitizar logs
8. Fix || -> ??
9. Fix onKeyPress -> onKeyDown
10. Fix test roto App.test.js

## Lista de Riesgos del Plan

| Riesgo | Mitigacion |
|--------|-----------|
| Migracion Vite+TS rompe algo invisible | Fase 2 con build paralelo, verificar feature parity antes de switch |
| Cambios backend afectan ANCOVA export | Tests del export antes y despues de cada cambio |
| OpenRouter introduce latencia/costos | Circuit breaker + fallback local + caching |
| Eliminacion de facilitator rompe datos existentes | Migracion de datos: convertir facilitators a admin o student |
| Refactor grande introduce bugs | Fases pequenas, branch por fase, tests obligatorios |
| Timeline se extiende | Priorizar Fases 0,1,5,6 como MVP de recoleccion |
