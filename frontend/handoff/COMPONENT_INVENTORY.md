# Inventario de componentes

Componentes extraídos en `handoff/components/`. Todos en TypeScript, listos para
copiar a `frontend/src/components/terminal/`.

## TMFrame
Marco contenedor con titlebar estilo macOS (semáforo + título + ruta). Wraps full
viewport. Dos slots: `title` (centro) y `subtitle` (derecha en mono dim).

## TMNav
Top navigation con tabs `▸ activo`. Items default:
`dashboard · teoría · práctica · tutor · perfil`. Acepta `active` y `onNav`.

## TMBox
Caja con header `─── TÍTULO ───────────` y accent vertical izquierdo. Props:
`title`, `accent` (color), `style`, children.

## TMBtn
Botón estilo `./comando`. Variants: `amber` (primario), `cyan` (secundario), `ghost`.
Sizes: `sm`, `md` (default), `lg`. Sin radius.

## TMField
Input con label `> name` en ámbar pequeño arriba. Border-left ámbar 2px.
Props: `label`, `placeholder`, `type`, `value`, `onChange`.

## TMPrompt
Línea decorativa `$ ./cmd --flag`. Útil arriba de cada pantalla y antes de bloques.

## Patrones

### Status badge
```jsx
<span style={{ color: TM.green }}>[x]</span> ítem completo
<span style={{ color: TM.red }}>[ ]</span> ítem pendiente
```

### Inline value
```jsx
<span style={{ color: TM.dim }}>mastery:</span> <span style={{ color: TM.amber }}>68%</span>
```

### KaTeX
Renderizar fórmulas con `katex.render(latex, el, { displayMode: true })`.
Importar CSS desde `katex/dist/katex.min.css` en `index.css`.
