# MathLab · Handoff "Terminal Tutor" → Claude Code

Paquete de handoff para aplicar el rediseño **Terminal Tutor** al codebase real
(`frontend/` · React + TypeScript + Tailwind + Vite).

## Contenido

```
handoff/
├── README.md                      ← este archivo (leer todo, incluye prompts)
├── PROMPTS.md                     ← prompts copy-paste para Claude Code, en orden
├── DESIGN_TOKENS.md               ← paleta, tipografía, espaciado, sombras
├── COMPONENT_INVENTORY.md         ← inventario de componentes y patrones
├── SCREEN_MAP.md                  ← mapa pantalla-prototipo → pantalla-real
├── tokens/
│   ├── tailwind.config.cjs        ← drop-in para frontend/tailwind.config.*
│   └── theme.css                  ← variables CSS a importar desde index.css
├── components/
│   ├── TMFrame.tsx                ← marco con titlebar mac
│   ├── TMNav.tsx                  ← top nav con tabs
│   ├── TMBox.tsx                  ← caja con header punteado y accent
│   ├── TMBtn.tsx                  ← botón ./command
│   ├── TMField.tsx                ← input con label `> name`
│   ├── TMPrompt.tsx               ← línea con `$ cmd`
│   └── index.ts
└── examples/
    └── Login.example.tsx          ← Login.tsx reescrito con Terminal Tutor
```

## Cómo trabajar con Claude Code

1. **Abrí tu codebase con Claude Code** en la raíz del proyecto (donde está `frontend/`).
2. **Copiá la primera tanda** de `handoff/PROMPTS.md` (Setup) y pegala en Claude Code.
3. Esperá que termine, **revisá visualmente** una pantalla, y seguí con la siguiente tanda.
4. Las tandas están pensadas para ser independientes — si una sale mal, podés reiniciar.

> El prototipo de referencia está en `index.html` de este proyecto. Abrílo en paralelo
> mientras Claude Code trabaja para chequear que el resultado se parezca.

## Filosofía del rediseño (resumen para el agente)

- **Estética**: terminal pedagógica retro · grafito cálido · ámbar fósforo + cyan eléctrico
- **Tipografía**: 100% monoespaciada (`JetBrains Mono`)
- **Voz**: en minúsculas, breve, didáctica, en español rioplatense informal pero respetuoso
- **Botones** se llaman como comandos: `./next`, `./save`, `./solve`
- **Inputs** llevan el label como `> name` arriba en ámbar pequeño
- **Cajas** tienen un header punteado: `─── TÍTULO ───────────`
- **Cero** rounded corners (todo recto, `rounded: 0`)
- **Cero** gradientes y emojis
- **Sí** scanlines sutiles en backgrounds, ASCII glyphs (▒ ▓ ░ ─ ┤ ├ etc), prompts `$`
