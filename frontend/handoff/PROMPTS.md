# Prompts para Claude Code · aplicar Terminal Tutor

Pegá cada bloque en orden. Esperá que Claude Code termine cada uno antes de seguir.
**Hacé commit después de cada tanda** para poder volver atrás si algo se rompe.

---

## TANDA 0 · Setup base

```
Voy a aplicar un nuevo sistema de diseño llamado "Terminal Tutor" al frontend.
Tengo todo el material en `handoff/`. Por favor:

1. Leé estos archivos en orden, sin saltarte ninguno:
   - handoff/README.md
   - handoff/DESIGN_TOKENS.md
   - handoff/COMPONENT_INVENTORY.md
   - handoff/SCREEN_MAP.md

2. Confirmame que entendiste:
   - paleta principal (grafito cálido + ámbar fósforo + cyan)
   - tipografía 100% mono (JetBrains Mono)
   - cero rounded corners, cero gradientes, cero emojis
   - voz en minúsculas, botones como ./comandos
   - inputs con label `> name` arriba en ámbar pequeño
   - cajas con header "─── TÍTULO ───────────"

3. NO toques código todavía. Devolveme un resumen de 5 líneas y esperá.
```

---

## TANDA 1 · Tokens y componentes base

```
Ahora aplicá los tokens y componentes base:

1. Copiá `handoff/components/*.tsx` y `tokens.ts` a `frontend/src/components/terminal/`.
   Copiá también `index.ts`.
2. Mergeá `handoff/tokens/tailwind.config.cjs` con `frontend/tailwind.config.*`
   (sumá los colores `tm.*` y la familia `mono` al `theme.extend`, sin pisar lo
   que ya exista).
3. Importá `handoff/tokens/theme.css` desde `frontend/src/index.css`
   (copialo a `frontend/src/styles/terminal-theme.css` y `@import` desde index.css).
4. Verificá que `npm run dev` arranca sin errores.

Devolveme la lista de archivos creados/modificados.
```

---

## TANDA 2 · Login (referencia exacta)

```
Refactorizá `frontend/src/pages/Login.tsx` siguiendo EXACTAMENTE el ejemplo en
`handoff/examples/Login.example.tsx`. Mantené la lógica de autenticación intacta
(useAuth, navigate, manejo de errores). Solo cambiá la presentación.

Después corré la app, abrí /login, y describime visualmente lo que ves para que
yo pueda confirmar que está bien antes de seguir.
```

---

## TANDA 3 · Register, Consent, PasswordChange

```
Aplicá el mismo tratamiento a estas pantallas estilo formulario centrado:

- frontend/src/pages/Register.tsx
- frontend/src/pages/Consent.tsx
- frontend/src/pages/PasswordChange.tsx

Todas usan TMFrame SIN TMNav (mirá Login.example.tsx). Contenido centrado, ancho
máximo ~460px. Mantené toda la lógica intacta.

Para Consent usá <TMBox> para las secciones "QUÉ ESTAMOS ESTUDIANDO" / "QUÉ
RECOLECTAMOS" / "TUS DERECHOS" con accent ámbar/cyan alternados.

Para PasswordChange agregá una caja "STRENGTH" con 4 segmentos coloreados
(usá flex con segmentos de 6px de alto).

Confirmame cuando esté listo.
```

---

## TANDA 4 · Dashboard, Theory, Practice

```
Estas pantallas SI usan el shell completo: TMFrame + TMNav + contenido scrollable.
Refactorizá:

- frontend/src/pages/Dashboard.tsx
- frontend/src/pages/Theory.tsx
- frontend/src/pages/Exercises.tsx

Patrón general:
1. <TMFrame title="mathlab" subtitle="~/ruta/actual">
2. <TMNav active="dash|theory|practice" onNav={(id) => navigate(...)} />
3. <main padding 26 height calc(100vh - 80px) overflow auto>
4. <TMPrompt> arriba con un comando descriptivo
5. Título con `<span color={TM.amber}>&gt;</span> texto`
6. Subtítulo en `// dim text`
7. Contenido en <TMBox> con accent rotando entre amber y cyan

En Theory: si hay fórmulas, renderizalas con KaTeX. Si hay glosario, ponelo en una
TMBox lateral con accent cyan y items "[x]" verdes.

En Exercises: input para respuesta con border-left ámbar, botón ./solve, después
de responder mostrar caja "VERIFICACIÓN" con [x] verde si OK o [ ] rojo si mal,
y debajo una caja "TUTOR.AI" con pasos del razonamiento (cada paso con prefijo ↳).

Mantené la lógica intacta. Confirmame.
```

---

## TANDA 5 · Tests (Intro y Exit)

```
Refactorizá:
- frontend/src/pages/IntroductoryTest.tsx
- frontend/src/pages/ExitTest.tsx

Patrón:
- TMFrame sin TMNav (modo "examen", el usuario no debería navegarse de acá)
- header sticky con prompt "$ ./pretest --calibrate" o "$ ./posttest --formal"
  + timer visible a la derecha en cyan
- Pregunta numerada "Q3 / 8" en ámbar
- Opciones de múltiple choice como "[ ] opción A" / "[x] opción A" cuando seleccionada
- Footer con TMBtn ghost "./back" y TMBtn amber "./next →"
- En ExitTest agregá una "hoja de respuestas" lateral con todas las preguntas
  como cuadrados ░ vacío / ▒ contestado / ▓ marcada para revisar.

Mantené la lógica del estudio (timing, persistencia, randomización si la hay).
```

---

## TANDA 6 · Profile, Chatbot, Survey

```
Aplicá el shell completo a:

- frontend/src/pages/Profile.tsx
  Layout 2 columnas: izq sidebar con avatar (cuadrado ámbar con inicial),
  stats del user, botones ./change_password / ./export_data / ./logout.
  Der: cajas DATOS / OBJETIVO / PREFERENCIAS con TMField y checkboxes.

- frontend/src/pages/Chatbot.tsx
  Layout 2 columnas: izq chat (ocupa el grueso), der sidebar 220px.
  Mensajes user: alineados a la derecha, fondo cyan, texto bg-deep.
  Mensajes tutor: alineados a la izq, fondo panel, border-left ámbar 2px.
  Pasos del tutor (assistant-step): sin fondo, indentados 24px, prefijo ↳ cyan.
  Input abajo con border-left ámbar + botón ./send.
  Sidebar: TMBox CONTEXT (topic, session, last_err) + TMBox QUICK ASKS con
  preguntas precargadas clickeables.

- frontend/src/pages/Survey.tsx
  Likert 1-5 como botones cuadrados (no radios redondos). Cada pregunta en una
  TMBox. Al final un textarea con border-left cyan para frase abierta.
  Botón ./submit ámbar.

Confirmame cuando esté.
```

---

## TANDA 7 · Admin Dashboard

```
frontend/src/pages/AdminDashboard.tsx

Estructura:
- TMFrame con titlebar "mathlab.admin" y subtitle "~/admin/dashboard"
- Sub-header propio (no TMNav normal): "▒▓ ADMIN" en ámbar bold + "role: researcher · access: full" en dim, y a la derecha botones ghost "refresh" y amber "./export csv"
- Grid 4 KPIs en TMBox: USERS / SESSIONS / AVG_MASTERY / DROPOFF, cada uno con número grande en su color y delta debajo en dim.
- Grid 2 cols 1.4fr/1fr con:
  · MASTERY · GROUP A vs B: dos sparklines (ámbar grupo A con tutor, cyan grupo B control). Para sparklines podés usar SVG inline o instalar `react-sparklines`.
  · STUDY HEALTH: barras horizontales de consent / pretest / active 7d / posttest / survey con porcentajes.
- Tabla USERS · LATEST 6 con cols: id (ámbar), group (A=ámbar B=cyan), days, sessions, mastery (verde/ámbar/rojo según %), last_seen (dim).

Mantené la lógica de fetch de admin (getUsers, fetchAdminReport, exportData).

Verificá login como admin y abrir /admin.
```

---

## TANDA 8 · QA pasada final

```
Pasada de QA visual. Andá pantalla por pantalla y para cada una:

1. Capturá un screenshot.
2. Compará con el prototipo en `index.html` (artboard correspondiente, ver
   handoff/SCREEN_MAP.md).
3. Listame discrepancias en formato:
   - pantalla X: <discrepancia> → severidad alta/media/baja
4. NO arregles nada todavía. Devolveme la lista entera primero.

Al final, identificá qué textos quedaron en mayúsculas o con emojis y
recordame la regla: minúsculas, sin emojis, voz didáctica informal.
```

---

## Cuando termines

Hacé un commit final con mensaje:

```
feat(ui): apply Terminal Tutor design system

- new design tokens (tm.* colors, JetBrains Mono)
- 6 base components in src/components/terminal/
- 15 pages refactored to monospaced terminal aesthetic
- spanish rioplatense voice, no emojis, command-style buttons
```
