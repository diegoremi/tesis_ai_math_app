# Design tokens · Terminal Tutor

## Paleta

| Token              | Hex       | Uso                                           |
| ------------------ | --------- | --------------------------------------------- |
| `tm.bg`            | `#1a1714` | Background principal (grafito cálido)         |
| `tm.bg-deep`       | `#100e0c` | Background detrás del marco                   |
| `tm.panel`         | `#211d19` | Panels, inputs, cajas                         |
| `tm.panel-2`       | `#2a2520` | Hover de panels                               |
| `tm.fg`            | `#e8dfd2` | Texto principal (crema)                       |
| `tm.dim`           | `#7d7066` | Texto secundario, comentarios                 |
| `tm.rule`          | `#3a322b` | Bordes, dividers                              |
| `tm.amber`         | `#ffb454` | Accent primario (CTA, headers)                |
| `tm.amber-soft`    | `#cf8a3a` | Variante apagada del ámbar                    |
| `tm.cyan`          | `#7dd3fc` | Accent secundario (info, links, group B)      |
| `tm.green`         | `#9bd454` | Estado correcto, éxito                        |
| `tm.red`           | `#ef6f6c` | Error, destructivo                            |

> Los whites/blacks son cálidos a propósito. **No usar** `#000` ni `#fff` puros.

## Tipografía

- Familia única: **JetBrains Mono** (300 / 400 / 500 / 700)
- Fallback: `'IBM Plex Mono', ui-monospace, Menlo, monospace`

| Escala       | Tamaño  | Uso                                  |
| ------------ | ------- | ------------------------------------ |
| `display`    | 32–40px | Hero `> bienvenida`                  |
| `title`      | 22–26px | Títulos de pantalla                  |
| `body`       | 14px    | Texto base                           |
| `meta`       | 12px    | Comentarios `// blah`, helper text   |
| `label`      | 10px    | Box headers, kbd, labels `> name`    |

- Letter-spacing en labels: `1.5px` (uppercase)
- Headers de cajas: uppercase + `letterSpacing: 1.5`

## Espaciado

Múltiplos de 2px. Uso típico:
`4 · 6 · 8 · 12 · 14 · 18 · 22 · 26 · 36`

## Bordes

- Radio: **0px en todo**. Nada redondeado.
- Width estándar: `1px`
- Accent vertical: `2px solid <amber|cyan>` en el borde **izquierdo** de inputs y cajas.

## Sombras

- No drop shadows. Profundidad por capas de panel + bordes.
- Excepción: `box-shadow: inset 0 0 0 1px <rule>` para destacar.

## Decoradores ASCII

- Box header: `─── TÍTULO ───────────────────────────`
- Prompts: `$ ./command --flag`
- Bullet points: `>`, `↳`, `[x]`, `[ ]`
- Nav active state: prefijo `▸ ` y subrayado `▔▔▔▔`

> No usar `┤ ├` rodeando títulos (queda ruidoso).
