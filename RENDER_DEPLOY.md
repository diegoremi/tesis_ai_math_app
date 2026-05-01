# Deploy en Render

## Estructura del deploy

| Servicio | Plataforma | URL |
|----------|------------|-----|
| Frontend | Vercel | https://tesis-ai-math-app.vercel.app |
| Backend | Render | https://tesis-backend.onrender.com |
| AI Module | Render | https://tesis-ai-module.onrender.com |
| PostgreSQL | Prisma/Neon | (ya configurado) |

---

## 1. Backend en Render

### Crear Web Service

1. Ve a https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Conecta tu repo de GitHub: `diegoremi/tesis_ai_math_app`
4. Configura:

```
Name: tesis-backend
Runtime: Docker
Branch: main
Root Directory: backend
Dockerfile Path: ./Dockerfile
```

### Environment Variables

Agrega estas variables en el dashboard de Render:

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://... (tu URL de Prisma Postgres)
DIRECT_URL=postgresql://... (tu URL directa)
JWT_SECRET=tu_jwt_secret_largo_y_aleatorio
AI_SERVICE_URL=https://tesis-ai-module.onrender.com
AI_PROVIDER=gemini
GEMINI_API_KEY=tu_api_key
LOG_LEVEL=info
```

### Comandos (Render los detecta del Dockerfile)

Build: `docker build -t tesis-backend .`
Start: `docker run -p 8080:8080 tesis-backend`

---

## 2. AI Module en Render

### Crear Web Service

1. Click **New +** → **Web Service**
2. Mismo repo
3. Configura:

```
Name: tesis-ai-module
Runtime: Docker
Branch: main
Root Directory: ai_module
Dockerfile Path: ./Dockerfile
```

### Environment Variables

```
GEMINI_API_KEY=tu_api_key
```

---

## 3. Actualizar Frontend (Vercel)

Ve a tu proyecto en Vercel → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://tesis-backend.onrender.com/api
```

Redeploya el frontend para que tome la nueva variable.

---

## 4. Docker para desarrollo local (opcional)

Si querés probar todo con Docker local:

```bash
# Copiar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con valores locales

# Levantar todo
docker-compose up --build

# En otra terminal, correr migraciones y seed
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

Servicios locales:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- AI Module: http://localhost:8001
- PostgreSQL: localhost:5432

---

## Notas importantes

### Cold starts (Render Free Tier)
Los servicios en Render Free "duermen" tras 15 min de inactividad. El primer request después de eso tendrá un delay de ~30s mientras "despierta". Esto es normal y aceptable para una tesis.

### Para evitar cold starts (opcional pago)
Si necesitás que nunca duerma, podés:
- Render: $7/mes por servicio (nunca duerme)
- Railway: ya lo tenías, pero era de pago
- Fly.io: ~$2-5/mes (más barato, siempre activo)

### Health checks
Ambos servicios tienen endpoints de health:
- Backend: `GET /api/health`
- AI Module: `GET /health`

Render usa estos para saber si el servicio está saludable.

### CORS
El backend ya tiene configurado los origins de Vercel en `backend/src/app.ts`:
```javascript
'https://tesis-ai-math-app.vercel.app',
'https://tesis-ai-math-app-diegoremis-projects.vercel.app',
```

Si Render te da un URL diferente, agrégalo ahí.

---

## Troubleshooting

### "Cannot connect to database"
Verificar que `DATABASE_URL` en Render apunte a una base accesible desde internet (Neon/Prisma Postgres). No funciona PostgreSQL local.

### "AI module not responding"
Verificar `AI_SERVICE_URL` en el backend apunte al URL correcto de Render del AI module.

### "CORS error"
Agregar el dominio de Render del backend al array `allowedOrigins` en `backend/src/app.ts` (aunque no debería ser necesario si el frontend llama directamente al backend).

---

## Alternativas si Render Free no funciona bien

1. **Railway** ($5/mes crédito gratis): Más rápido que Render, menos cold starts
2. **Fly.io** ($5/mes crédito gratis): Siempre activo, muy rápido
3. **Railway + Vercel** (combinación común): Railway para backend, Vercel para frontend

Para una tesis académica, cualquiera de estas opciones es suficiente.
