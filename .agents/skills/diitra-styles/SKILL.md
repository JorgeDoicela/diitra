---
name: diitra-styles
description: >
  Activa esta skill para cualquier tarea que involucre el sistema de diseno visual de DIITRA:
  estilos CSS, tokens de diseno, paleta de colores, tipografia, animaciones, nuevos componentes
  visuales, correccion de inconsistencias de diseno o alineacion con el estilo Vercel Geist.
  Tambien activala cuando el usuario reporte que algo se ve mal o pida mejorar la apariencia
  de cualquier elemento de la interfaz.
---

# DIITRA Design System — Skill de Estilos

Esta skill define las reglas, patrones y convenciones **exclusivas y obligatorias** para todo trabajo
visual en el proyecto DIITRA, basado fielmente en el **Vercel Geist Design System**.

> Antes de modificar cualquier estilo, leer la referencia completa en:
> - `references/tokens.md` — Tokens de color, tipografia y escala de grises.
> - `references/components.md` — Catalogo de clases de componentes disponibles.
> - `references/patterns.md` — Patrones de diseno establecidos y anti-patrones a evitar.

---

## 1. Regla de Oro: No Introducir Estilos Ad-Hoc

**Prohibido** usar valores de color, tamano o espaciado hardcodeados directamente en los componentes
cuando existe un token CSS disponible. Ejemplo:

```tsx
// MAL — valor hardcoded, rompe la coherencia del sistema
<div style={{ color: '#888888', fontSize: '9px' }}>

// BIEN — usa el token del sistema de diseno
<div className="section-label">
```

Si una necesidad visual no esta cubierta por una clase existente, **primero evalua** si corresponde
anadir la utilidad al archivo CSS del sistema (`misc.css`, `cards.css`, etc.) antes de escribir
un `style` inline ad-hoc.

---

## 2. Jerarquia de Archivos CSS (Arquitectura Modular)

```
src/
index.css                    <- Punto de entrada global (fuentes + imports)
styles/
  theme.css                  <- Tokens CSS (:root + [data-theme="light"])
  base.css                   <- Reset global, Tailwind v4 @theme, TipTap, scrollbars
  animations.css             <- @keyframes + clases de animacion (.skeleton-item, etc.)
  components.css             <- Indice de imports de subcarpeta components/
  components/
    buttons.css              <- .btn-vercel-primary / secondary / .btn-brand
    cards.css                <- .bento-card, .vercel-grid, .bg-glow
    inputs.css               <- .input-vercel, autofill fixes
    alerts.css               <- .badge-vercel-*, .callout-vercel-*, .toast-vercel
    modals.css               <- .modal-overlay, .modal-card, .popover-vercel
    misc.css                 <- .tabs-vercel, .section-label, .stat-number,
                                .custom-scrollbar, .dot-*, .icon-circle-*, .kbd-vercel
```

**Regla de modularidad:** Cada archivo de componente **no debe superar 400 lineas**. Si se supera,
extraer en un nuevo archivo dentro de `components/`.

Modulos CSS especificos de paginas:
- `src/pages/Calendario/CalendarioPage.css` — modulo de calendario y kanban.
- `src/pages/Settings/components/SignatureProfileCard.css` — firma digital con tipografias cursivas.

---

## 3. Sistema de Temas (Dark / Light)

DIITRA usa un sistema de temas basado en `data-theme` (NO en `prefers-color-scheme`).
El tema predeterminado **es oscuro** (sin atributo o con `data-theme="dark"`).
El tema claro se activa explicitamente con `data-theme="light"` en el `<html>`.

- Para sobrescribir en tema claro: `[data-theme="light"] .mi-clase { ... }`
- Para sobrescribir en tema oscuro: `[data-theme="dark"] .mi-clase { ... }`
- **Nunca** usar `@media (prefers-color-scheme: dark)` — no esta integrado en el sistema.

---

## 4. Integracion con Tailwind CSS v4

El proyecto usa **Tailwind CSS v4** importado en `base.css` mediante `@import "tailwindcss"`.
Los tokens estan mapeados en el bloque `@theme` generando clases como:
`bg-surface`, `text-brand`, `text-text-dim`, `bg-bg-deep`, etc.

**Regla de uso:** Tailwind es **complementario**. Usarlo para layout (flex, grid, padding, margin).
Para colores, bordes y tipografia visual, usar las clases semanticas del sistema de diseno.

---

## 5. Tipografia

| Familia      | Variable CSS         | Clase Tailwind | Uso                          |
|--------------|----------------------|----------------|------------------------------|
| Geist Sans   | `var(--font-sans)`   | `font-sans`    | Cuerpo, UI, labels           |
| Geist Mono   | `var(--font-mono)`   | `font-mono`    | Numeros, IDs, codigo         |

Escala tipografica del sistema:

| Uso                  | Tamano             | Peso    | Notas                                          |
|----------------------|--------------------|---------|------------------------------------------------|
| Labels de seccion    | `9.5px`            | 500     | `.section-label`, UPPERCASE, letter-spacing 0.3em |
| Badges / status      | `8-9px`            | 500-700 | UPPERCASE, letter-spacing 0.05-0.15em          |
| Texto cuerpo         | `0.75rem-0.875rem` | 400-500 |                                                |
| Titulos de pagina    | `1.5rem-1.875rem`  | 600     | `.page-header-title`, letter-spacing -0.025em  |
| Numeros estadistica  | `3rem-3.75rem`     | 600     | `.stat-number`, font-mono, letter-spacing -0.04em |

---

## 6. Animaciones y Transiciones

La curva easing estandar del sistema es `cubic-bezier(0.16, 1, 0.3, 1)` (spring suave de Vercel).

Clases de animacion disponibles:

| Clase                           | Descripcion                                       |
|---------------------------------|---------------------------------------------------|
| `animate-fade-in-up`            | Aparicion desde abajo con escala (dropdowns, modales) |
| `skeleton-item` + `skeleton-pulse` | Skeletons shimmer de carga                     |
| `dot-pulse`                     | Indicador de estado pulsante                      |
| `animate-conic-spin-slow/fast`  | Giratorio conico para loaders decorativos         |
| `progress-bar-fill`             | Transicion de progreso de ancho (1000ms)          |
| `progress-circle-fill`          | Transicion de progreso circular (stroke-dashoffset) |

---

## 7. Checklist de Validacion Visual

Antes de finalizar cualquier trabajo de estilos, verificar:

- [ ] Todos los colores usan variables CSS (var(--brand), var(--fg), etc.) — sin hex hardcodeados.
- [ ] Contenedores con scroll interno tienen clase `custom-scrollbar`.
- [ ] Los estados hover tienen transicion `0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
- [ ] Los elementos interactivos tienen `cursor: pointer` y `:active` con `transform: scale(0.97)`.
- [ ] El tema claro `[data-theme="light"]` esta cubierto cuando el componente usa fondos fijos.
- [ ] Badges y toasts usan las clases del sistema (`badge-vercel-*`, `callout-vercel-*`).
- [ ] No se usa `!important` salvo en casos justificados con comentario explicativo.
- [ ] Los archivos CSS nuevos no superan 400 lineas.

Ver referencia detallada: `references/tokens.md`, `references/components.md`, `references/patterns.md`
