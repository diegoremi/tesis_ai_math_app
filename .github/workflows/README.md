# GitHub Actions Workflows

## Workflows configurados

### 1. `test-backend.yml` — Tests del backend
**Trigger:** Push/PR en `main` que modifica `backend/**`

**Qué hace:**
- Levanta PostgreSQL 15 en un service container
- Instala dependencias del backend
- Genera Prisma Client
- Corre migraciones
- Seed de datos base
- Ejecuta 25 tests de humo (auth, experimental, access control)

**Requiere:** No necesita secrets (usa PostgreSQL local en CI)

### 2. `build-frontend.yml` — Build del frontend
**Trigger:** Push/PR en `main` que modifica `frontend/**`

**Qué hace:**
- Instala dependencias del frontend
- TypeScript check (`tsc --noEmit`)
- Build de producción con Vite

**Requiere:** No necesita secrets

### 3. `type-check.yml` — TypeScript check general
**Trigger:** Cualquier push/PR en `main`

**Qué hace:**
- Type-check del backend (incluye Prisma generate)
- Type-check del frontend

### 4. `deploy-backend.yml` — Deploy a Render
**Trigger:** Push en `main` que modifica `backend/**`

**Qué hace:**
- Trigger deploy en Render vía webhook

**Requiere:** Secret `RENDER_DEPLOY_HOOK_BACKEND` configurado en GitHub

---

## Configuración de secrets (opcional)

Para habilitar deploy automático en Render:

1. Ve a tu servicio en Render Dashboard
2. Settings → Deploy Hook
3. Copia la URL del webhook
4. En GitHub: Settings → Secrets → New repository secret
5. Nombre: `RENDER_DEPLOY_HOOK_BACKEND`
6. Valor: la URL del webhook

---

## Estado de los workflows

Puedes ver el estado en la pestaña **Actions** del repo de GitHub.

Los checks aparecerán en cada Pull Request como requisitos de merge.
