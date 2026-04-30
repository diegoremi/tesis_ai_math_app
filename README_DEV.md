# README_DEV.md

> Guia de setup local para desarrolladores del proyecto tesis_ai_math_app.

## Requisitos

- Node.js 20+ y npm 10+
- Python 3.11+
- PostgreSQL (Neon, Vercel Postgres, o local)

## Estructura del monorepo

```
tesis_ai_math_app/
├── backend/       Express + TypeScript + Prisma + PostgreSQL (puerto 8080)
├── frontend/      Create React App + React 19 + Tailwind v3 (puerto 3000)
├── ai_module/     FastAPI + Gemini (puerto 8001)
└── dev.sh         Script para levantar los 3 servicios
```

## Setup rapido (recomendado)

```bash
# 1. Clonar o navegar al repo
cd tesis_ai_math_app

# 2. Copiar archivos de entorno
cp backend/.env.example backend/.env
cp ai_module/.env.example ai_module/.env
cp frontend/.env.example frontend/.env

# 3. Rellenar las variables en los .env (ver seccion Variables de Entorno)

# 4. Levantar todos los servicios
./dev.sh
```

Esto iniciara:
- Backend en http://localhost:8080
- Frontend en http://localhost:3000
- AI module en http://localhost:8001

Presiona `Ctrl+C` para detener todos los servicios.

## Setup manual (si dev.sh falla)

### Backend

```bash
cd backend
npm install

# Asegurate de tener DATABASE_URL y JWT_SECRET en .env
npx prisma migrate deploy
npx prisma db seed        # carga items de prueba y encuestas
npm run dev               # nodemon + tsx en puerto 8080
```

### Frontend

```bash
cd frontend
npm install
npm start                 # CRA dev server en puerto 3000
```

### AI Module

```bash
cd ai_module
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## Variables de Entorno

### backend/.env

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `DATABASE_URL` | Si | PostgreSQL connection string |
| `DIRECT_URL` | Si* | Direct connection para Prisma migrations (Neon) |
| `JWT_SECRET` | Si | Secret para firmar tokens JWT |
| `AI_SERVICE_URL` | No | URL del AI module (default: http://localhost:8001) |
| `AI_PROVIDER` | No | gemini u openai (default: gemini) |
| `GEMINI_API_KEY` | Si** | API key de Gemini |
| `OPENAI_API_KEY` | No | API key de OpenAI (si usas AI_PROVIDER=openai) |
| `RECAPTCHA_SECRET_KEY` | No | Secret de reCAPTCHA v2 |
| `PORT` | No | Puerto del backend (default: 8080) |
| `LOG_LEVEL` | No | debug, info, warn, error (default: info) |
| `NODE_ENV` | No | development o production (default: development) |

*Requerida si usas Neon o Vercel Postgres con connection pooler.
**Requerida si usas Gemini como proveedor IA.

### ai_module/.env

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | Si | API key de Gemini |

### frontend/.env

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `REACT_APP_RECAPTCHA_SITE_KEY` | No | Site key de reCAPTCHA v2 |
| `REACT_APP_API_BASE_URL` | No | URL del backend (default: http://localhost:8080/api) |

## Scripts utiles

### Backend

```bash
npm run dev               # Desarrollo con nodemon + tsx
npm run start             # Produccion-like con tsx
npm run seed:synthetic    # Genera 60 usuarios sinteticos para pruebas ANCOVA
npm run db:reset-users    # Limpia datos de usuarios (preserva bancos de items)
npx prisma migrate deploy # Aplica migraciones pendientes
npx prisma db seed        # Carga bancos de items (ejecutar despues de migrate)
npx prisma studio         # UI visual de la base de datos
```

> **Orden importante para DB nueva:** `migrate deploy` -> `db seed` -> opcionalmente `seed:synthetic`

### Frontend

```bash
npm start                 # Servidor de desarrollo
npm run build             # Build de produccion
npm test                  # Test runner interactivo
```

### AI Module

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001   # Desarrollo
python -m pytest tests/                                 # Tests de Python
```

## Troubleshooting

### Error: Port already in use

```bash
# Ver que proceso usa el puerto
lsof -i :8080   # backend
lsof -i :3000   # frontend
lsof -i :8001   # ai_module

# Matar el proceso
kill -9 <PID>
```

### Error: Database connection failed

- Verifica que `DATABASE_URL` y `DIRECT_URL` esten correctos.
- Si usas Neon, asegurate de incluir `?sslmode=require`.
- Verifica que la base de datos exista y el usuario tenga permisos.

### Error: PrismaClientInitializationError

- Ejecuta `npx prisma generate` para regenerar el cliente de Prisma.
- Verifica que `npx prisma migrate deploy` haya corrido sin errores.

### Error: JWT_SECRET missing

- El backend necesita `JWT_SECRET` definido en `.env`.
- Genera uno aleatorio: `openssl rand -base64 32`

### Error: AI module no responde

- Verifica que `GEMINI_API_KEY` este configurada en `ai_module/.env`.
- El backend usa `AI_SERVICE_URL=http://localhost:8001` por defecto.

### Error: venv no encontrado

```bash
cd ai_module
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Error: node_modules inconsistentes

```bash
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## Notas importantes

- **No versionar .env files:** Los archivos `.env` estan en `.gitignore`. Solo `.env.example` debe estar en el repo.
- **No versionar venv:** `ai_module/venv/` y `ai_module/.venv/` estan en `.gitignore`.
- **Backend ESM:** Todas las importaciones locales deben usar extension `.js` (ej. `import app from './app.js'`), incluso para archivos `.ts`.
- **tsx en devDependencies:** El runner `tsx` esta en `devDependencies`. En produccion se usa `npm run start`.
