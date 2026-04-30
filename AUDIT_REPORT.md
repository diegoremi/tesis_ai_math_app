# AUDIT_REPORT.md

> Auditoria integral del monorepo tesis_ai_math_app.
> Fecha: 2026-04-30
> Enfoque: seguridad, validez experimental, mantenibilidad, UX.

## Resumen Ejecutivo

| Categoria | Critico | Alto | Medio | Bajo |
|-----------|---------|------|-------|------|
| Seguridad | 6 | 8 | 4 | 2 |
| Validez Experimental | 4 | 5 | 3 | 1 |
| Deuda Tecnica | 3 | 4 | 8 | 5 |
| UX / Accesibilidad | 1 | 3 | 5 | 4 |
| Infra / DevOps | 4 | 3 | 4 | 2 |

**Bloqueantes para recoleccion de datos reales:**
1. Las respuestas correctas de pre/postest se envian al frontend.
2. El puntaje se calcula en el cliente y el backend lo acepta sin validar.
3. Cualquier usuario puede registrarse como admin.
4. El CORS permite cualquier origen con credentials: true.
5. Hay 12 instancias de PrismaClient que agotaran el pool de conexiones.
6. La randomizacion tiene condicion de carrera.
7. ai_module/venv/ esta versionado en Git (12,000+ archivos).

## Hallazgos Criticos

### C1 - Respuestas correctas expuestas en assessments
- **Archivo:** backend/src/services/evaluation.service.ts:140-147
- **Impacto:** Cualquier estudiante autenticado puede ver correct_key. Invalida la validez del pretest/postest.
- **Fix:** Usar select que excluya correct_key. Backend calcula is_correct y total_score server-side.

### C2 - Puntaje calculado client-side
- **Archivo:** frontend/src/components/study/IntroductoryTest.js, ExitTest.js, backend/src/controllers/evaluation.controller.ts
- **Impacto:** El estudiante puede manipular el payload y enviar puntaje perfecto.
- **Fix:** Frontend envia solo { item_id, answer }. Backend compara con correct_key y calcula el puntaje.

### C3 - Escalacion de privilegios por mass assignment
- **Archivo:** backend/src/services/user.service.ts
- **Impacto:** createUserService acepta role desde el body. updateUserService hace spread de req.body a Prisma.
- **Fix:** Hardcodear role: student en creacion. Whitelist de campos en actualizacion.

### C4 - CORS permite cualquier origen
- **Archivo:** backend/src/app.ts:19-41
- **Impacto:** Fallback callback(null, true) con credentials: true permite credential theft cross-origin.
- **Fix:** Eliminar fallback incondicional.

### C5 - 12+ instancias de PrismaClient
- **Archivo:** Multiples servicios/controllers
- **Impacto:** Agota conexiones PostgreSQL.
- **Fix:** Singleton backend/src/lib/prisma.ts.

### C6 - Condicion de carrera en randomizacion GE/GC
- **Archivo:** backend/src/services/study.service.ts:54-96
- **Impacto:** Conteos fuera de la transaccion. Registros concurrentes rompen balance 1:1.
- **Fix:** Mover conteo dentro de  o usar contador atomico.

### C7 - venv versionado en Git
- **Archivo:** ai_module/venv/ (12,000+ archivos)
- **Fix:** git rm -r --cached ai_module/venv ai_module/__pycache__

### C8 - Export admin filtra password_hash
- **Archivo:** backend/src/controllers/admin.controller.ts:140-144
- **Fix:** Agregar select excluyendo password_hash.

### C9 - PII en logs
- **Archivo:** backend/src/middleware/errorLogger.ts:6,29
- **Fix:** Sanitizar req.body antes de loguear.

### C10 - Llamadas sincronas a Gemini bloquean event loop
- **Archivo:** ai_module/main.py
- **Fix:** Usar asyncio.to_thread() o SDK async.

## Hallazgos de Alto Impacto

| # | Archivo | Issue | Fix |
|---|---------|-------|-----|
| H1 | auth.service.ts, auth.middleware.ts | JWT_SECRET no validado en arranque | Fallar rapido si falta |
| H2 | app.ts | Sin rate limiting en auth/AI | express-rate-limit |
| H3 | ai_module/main.py | PII redaction omitida en /generate_exercise | Aplicar redact() |
| H4 | ai_module/main.py | Sin guardrails pedagogicos en /chat | Prohibir respuestas a preguntas tipo test |
| H5 | theory.service.ts | Respuestas checkpoint expuestas en JSON | Stripear correct del payload |
| H6 | practice.service.ts | Sin verificacion de ownership en answers | Verificar user_id |
| H7 | - | backend/.env.example no existe | Crear archivo |
| H8 | practice.service.ts | Race condition en contadores | Operaciones atomicas Prisma |
| H9 | frontend/src/services/api.js | Sin interceptor 401 | Response interceptor axios |
| H10 | Survey.js | Likert inicializa en 4 | Inicializar en null, bloquear submit incompleto |
| H11 | evaluation.controller.ts | Postest sin verificar desbloqueo | Chequeo server-side |

## Hallazgos Medios

- M1 App.js: Layout roto por App-header
- M2 Assessments: Sin timer ni anti-copy UI
- M3 App.js: Sin React Error Boundary
- M4 Chatbot.js: onKeyPress deprecado en React 19
- M5 datetime.utcnow() deprecado (Python 3.12+)
- M6 random.seed muta estado global
- M7 || vs ?? en export ANCOVA
- M8 Schema Prisma: faltan onDelete: Cascade
- M9 Schema permite multiples assignments por usuario
- M10 Dual-write legacy en Survey + SurveySubmission
- M11 Sin validacion de IDs numericos en params
- M12 AI module: Pydantic sin max_length
- M13 AI module: Sin CORS middleware
- M14 tsx en dependencies en lugar de devDependencies

## Quick Wins (< 30 min cada uno)

1. Eliminar venv de Git
2. Crear backend/.env.example
3. Fix CORS (eliminar fallback)
4. Singleton PrismaClient
5. Strip correct_key de assessment items
6. Whitelist campos en updateUserService
7. Hardcodear role: student
8. Sanitizar logs
9. Fix || -> ?? en ANCOVA
10. Fix passed || undefined en theory
11. Agregar cascades en Prisma
12. Reemplazar onKeyPress por onKeyDown
13. Eliminar layout roto de App.js
14. Fix test roto App.test.js
15. Revocar blob URLs en AdminDashboard
16. max_length en Pydantic models
17. datetime.now(timezone.utc)
18. random.Random(seed) local

## Riesgos si no se corrige

| Riesgo | Probabilidad | Impacto en tesis |
|--------|-------------|------------------|
| Participantes ven respuestas correctas | Alta | Invalida pretest/postest |
| Participantes manipulan puntajes | Alta | Datos falsos en ANCOVA |
| Randomizacion desbalanceada | Media | Poder estadistico reducido |
| Contaminacion GE/GC | Media | Sesgo de tratamiento |
| Fuga de PII | Media | Riesgo etico/legal |
| Abandono por UX rota | Media | Perdida de participantes |
| Pool de DB agotado | Baja | Caida de plataforma |
