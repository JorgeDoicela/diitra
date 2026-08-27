# patterns.md — DIITRA Design Patterns & Anti-Patterns

Patrones establecidos en el sistema de diseno DIITRA y anti-patrones a evitar.
Fuente: analisis de `src/styles/` y convenciones del proyecto.

---

## PATRONES ESTABLECIDOS

### P1 — Botones: Tipografia Micro + Transformacion Activa

Todos los botones del sistema usan tipografia micro en uppercase con letter-spacing pronunciado.
El efecto `:active` de escala sutil proporciona feedback tactico inmediato.

```css
/* PATRON CORRECTO */
.btn-mi-accion {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-mi-accion:active {
  transform: scale(0.97);
}
```

### P2 — Hover de Superficie: Elevacion Sutil con Sombra

Las tarjetas interactivas se elevan ligeramente en hover. Nunca usar sombras grandes o coloreadas.

```css
/* PATRON CORRECTO */
.mi-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); /* dark */
  border-color: var(--border-hover);
}
[data-theme="light"] .mi-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04); /* light — mucho mas suave */
}
```

### P3 — Focus Ring Vercel para Inputs

El focus de inputs usa un ring de 1px del color del foreground, no el outline azul del navegador.

```css
/* PATRON CORRECTO — ya definido en base.css, no repetir */
.mi-input:focus {
  outline: none;
  border-color: var(--fg);
  box-shadow: 0 0 0 1px var(--fg);
}
```

### P4 — Cuadricula Decorativa Vercel

Para fondos de secciones hero o paneles principales, usar `.vercel-grid` o `.vercel-grid-fade`.
Nunca usar cuadriculas con colores opacos ni tamanos distintos a 32x32px.

### P5 — Skeleton Loaders

Para estados de carga, usar SIEMPRE `.skeleton-item` (no spinners de carga centrales salvo en
operaciones modales criticas). La clase aplica fondo `--accents-2` con efecto shimmer.

```tsx
// PATRON CORRECTO
{loading ? (
  <div className="skeleton-item skeleton-pulse" style={{ height: 48, borderRadius: 8 }} />
) : (
  <div className="bento-card">...</div>
)}
```

### P6 — Scroll Interno de Contenedores

Todo contenedor con `overflow-y: auto` o `overflow-y: scroll` debe tener la clase `custom-scrollbar`.

```tsx
// PATRON CORRECTO
<div className="custom-scrollbar" style={{ overflowY: 'auto', maxHeight: 400 }}>
```

### P7 — Indicadores de Estado con Dots y Badges

Para estados de entidades (proyectos, solicitudes, usuarios) usar:
- `.dot` + `.dot-{estado}` para indicadores compactos inline.
- `.badge-vercel` + `.badge-vercel-{estado}` para pills de estado en tablas y headers.
- `.status-tag` para etiquetas tipo "chip" con borde.

No mezclar los tres estilos en el mismo componente.

### P8 — Animaciones de Entrada para Elementos Dinamicos

Los elementos que aparecen dinamicamente (dropdowns, modales, paneles) deben usar animaciones
de la familia `fadeIn`, `scaleUp` o `slideInFromRight` dependiendo del origen del elemento.

```css
/* Para popovers que aparecen debajo: */
animation: fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;

/* Para paneles laterales derechos: */
animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
```

### P9 — Colores de Estado: Uso Semantico Estricto

| Color     | Significado                               | Prohibido usar para...          |
|-----------|-------------------------------------------|---------------------------------|
| Verde     | Exito, guardado, activo, aprobado         | Informacion neutra, branding    |
| Rojo      | Error, eliminacion, rechazo, fallo        | Advertencias, estados inactivos |
| Amarillo  | Advertencia, pendiente, en revision       | Errores, informacion positiva   |
| Azul      | Informacion neutra, acciones, marca brand | Estados de peligro o exito      |
| Violeta   | Estados especiales, en progreso avanzado  | Errores o exito                 |

---

## ANTI-PATRONES — PROHIBIDOS

### AP1 — Hardcodear Valores de Color

```css
/* MAL */
color: #888888;
background: #0a0a0a;

/* BIEN */
color: var(--text-dim);
background: var(--surface);
```

### AP2 — Usar `prefers-color-scheme`

```css
/* MAL — el sistema de temas usa data-theme, no media queries de SO */
@media (prefers-color-scheme: dark) { ... }

/* BIEN */
[data-theme="dark"] .mi-clase { ... }
```

### AP3 — Ignorar la Curva de Easing Estandar

```css
/* MAL — curvas lineales o ease generico rompen la coherencia visual */
transition: all 0.3s linear;
transition: all 0.2s ease;

/* BIEN — easing spring de Vercel */
transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
```

### AP4 — Crear Variantes de Estado con !important sin Documentar

Si se necesita `!important`, debe ir acompanado de un comentario explicativo.

```css
/* MAL */
.mi-clase { color: red !important; }

/* BIEN */
/* Anula el color aplicado por Tailwind en la clase group-hover */
.mi-clase { color: red !important; }
```

### AP5 — Inventar Clases de Badge o Toast sin Usar el Sistema

```tsx
/* MAL — clase inventada fuera del sistema */
<span className="custom-badge-active">Activo</span>

/* BIEN — clase del sistema de diseno */
<span className="badge-vercel badge-vercel-success">Activo</span>
```

### AP6 — Olvidar la Cobertura del Tema Claro

Si un componente usa fondos fijos (rgba con colores claros u oscuros, no variables CSS),
SIEMPRE agregar su contraparte `[data-theme="light"]`.

```css
/* MAL — solo funciona en dark */
.mi-bloque {
  background: rgba(255, 255, 255, 0.05);
}

/* BIEN */
.mi-bloque {
  background: rgba(255, 255, 255, 0.05);
}
[data-theme="light"] .mi-bloque {
  background: rgba(0, 0, 0, 0.03);
}
```

### AP7 — Importar Tailwind CSS en Archivos CSS de Modulos

`@import "tailwindcss"` SOLO existe en `base.css`. Nunca repetirlo en archivos de modulo o
componentes individuales.

### AP8 — Archivos CSS con Estilos Globales en Componentes Locales

Los archivos CSS de modulos de pagina (como `CalendarioPage.css`) deben contener UNICAMENTE
estilos del modulo. No reutilizar clases globales definiendolas ahi nuevamente.
