# components.md — DIITRA Component Classes Reference

Catalogo completo de todas las clases CSS reutilizables del sistema de diseno DIITRA.
Fuente: `src/styles/components/`

---

## Botones (`buttons.css`)

| Clase                    | Descripcion                                                   |
|--------------------------|---------------------------------------------------------------|
| `.btn-vercel-primary`    | Boton primario: fondo `--fg`, texto `--bg`. Uso principal.    |
| `.btn-vercel-secondary`  | Boton secundario: fondo `--surface`, borde `--border`.        |
| `.btn-brand`             | Boton de marca: fondo `--brand` (azul cobalto), sombra brand. |

**Propiedades comunes de todos los botones:**
- `font-size: 10px`, `text-transform: uppercase`, `letter-spacing: 0.1em`
- `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`
- `:active { transform: scale(0.97) }`

---

## Tarjetas y Fondos (`cards.css`)

| Clase                  | Descripcion                                                       |
|------------------------|-------------------------------------------------------------------|
| `.bento-card`          | Tarjeta estandar del sistema. `--surface`, borde `--border`, hover elevacion. |
| `.bento-card.static`   | Variante sin elevacion hover. Para contenedores que no se clickean. |
| `.bento-card-static`   | Equivalente de `.bento-card.static` como clase independiente.     |
| `.vercel-grid`         | Fondo con cuadricula semitransparente de 32x32px.                 |
| `.vercel-grid-fade`    | Cuadricula con mask radial (se desvanece en los bordes).          |
| `.bg-glow`             | Resplandor radial azul en la parte superior del contenedor.       |
| `.vercel-card-glow`    | Gradiente lineal sutil de blanco a transparente sobre la superficie. |

**Comportamiento hover de `.bento-card`:**
- `border-color: var(--border-hover)`
- `box-shadow: 0 8px 30px rgba(0,0,0,0.12)`
- `transform: translateY(-1px)`

---

## Inputs y Formularios (`inputs.css`)

| Clase                        | Descripcion                                                   |
|------------------------------|---------------------------------------------------------------|
| `.input-vercel`              | Input estandar: fondo `--bg`, borde `--border`, focus con ring `--fg`. |
| `.input-vercel-no-highlight` | Variante sin ring de focus (para campos decorativos).         |

**Estados del `.input-vercel`:**
- `:hover { border-color: var(--border-hover) }`
- `:focus { border-color: var(--fg); box-shadow: 0 0 0 1px var(--fg) }`

El archivo incluye fixes completos de autofill de Chrome/Safari para tema claro y oscuro.

---

## Badges (`alerts.css`)

| Clase                    | Color de texto | Uso semantico       |
|--------------------------|----------------|---------------------|
| `.badge-vercel`          | `--fg`         | Badge neutro base   |
| `.badge-vercel-success`  | `#00e054`      | Exito, activo       |
| `.badge-vercel-error`    | `#ff3333`      | Error, rechazado    |
| `.badge-vercel-warning`  | `#f5a623`      | Advertencia         |
| `.badge-vercel-info`     | `#3291ff`      | Informacion         |
| `.badge-vercel-violet`   | `#c084fc`      | Estado especial     |
| `.badge-vercel-neutral`  | `--text-dim`   | Neutral / inactivo  |

Todos son pildoras (`border-radius: 9999px`), `font-size: 0.75rem`, `font-weight: 500`.

---

## Callouts (`alerts.css`)

| Clase                      | Descripcion                              |
|----------------------------|------------------------------------------|
| `.callout-vercel`          | Callout base neutro                      |
| `.callout-vercel-warning`  | Borde y fondo amarillo translucido       |
| `.callout-vercel-info`     | Borde y fondo azul translucido           |
| `.callout-vercel-success`  | Borde y fondo verde translucido          |
| `.callout-vercel-error`    | Borde y fondo rojo translucido           |
| `.callout-vercel-neutral`  | Borde `--accents-2`, fondo `--accents-1` |

Estructura HTML esperada:
```html
<div class="callout-vercel callout-vercel-warning">
  <Icon />
  <div>
    <p class="callout-vercel-title">Titulo</p>
    <p class="callout-vercel-body">Descripcion del mensaje.</p>
  </div>
</div>
```

---

## Toasts (`alerts.css`)

| Clase                      | Descripcion                                          |
|----------------------------|------------------------------------------------------|
| `.toast-container-vercel`  | Contenedor fijo bottom-left. Unico en la app.        |
| `.toast-vercel`            | Toast individual con animacion `toastSlideIn`.       |
| `.toast-icon-wrapper`      | Circulo de 28px para el icono del toast.             |
| `.toast-icon-success`      | Icono verde en circulo.                              |
| `.toast-icon-error`        | Icono rojo en circulo.                               |
| `.toast-icon-warning`      | Icono amarillo en circulo.                           |
| `.toast-icon-info`         | Icono azul en circulo.                               |

---

## Modales (`modals.css`)

| Clase                  | Descripcion                                                      |
|------------------------|------------------------------------------------------------------|
| `.modal-overlay`       | Overlay oscuro fijo `z-index: 110`, centrado con flex.           |
| `.modal-card`          | Contenedor principal del modal. `max-width: 32rem`.              |
| `.modal-card--lg`      | Variante grande. `max-width: 42rem`.                             |
| `.modal-header`        | Cabecera del modal con borde inferior y fondo `--surface`.       |
| `.modal-body`          | Cuerpo del modal con `overflow-y: auto`.                         |
| `.modal-footer`        | Pie del modal alineado a la derecha con gap.                     |

## Popovers y Dropdowns (`modals.css`)

| Clase                    | Descripcion                                              |
|--------------------------|----------------------------------------------------------|
| `.popover-vercel`        | Contenedor del dropdown. `backdrop-filter: blur(8px)`.   |
| `.popover-header-vercel` | Encabezado de grupo dentro del popover (9px uppercase).  |
| `.popover-item-vercel`   | Item clickeable del popover con hover sutil.             |
| `.divider-vercel`        | Linea divisora horizontal de 1px.                        |

---

## Miscelaneos (`misc.css`)

### Pestanas
| Clase               | Descripcion                                                    |
|---------------------|----------------------------------------------------------------|
| `.tabs-vercel`      | Contenedor de pestanas con borde inferior.                     |
| `.tab-vercel-item`  | Item de pestana. `.active` muestra linea `2px` en el fondo.   |

### Estadisticas y Metricas
| Clase              | Descripcion                                              |
|--------------------|----------------------------------------------------------|
| `.section-label`   | Label tipo "METRICA" en 9.5px uppercase, text-dim.      |
| `.stat-number`     | Numero grande `3rem`, font-mono, color `--fg`.          |
| `.stat-number--lg` | Variante XL `3.75rem`.                                   |
| `.stat-number--sm` | Variante SM `1.5rem`.                                    |
| `.page-header-title` | Titulo de pagina `1.5rem→1.875rem` responsivo.         |

### Indicadores de Estado
| Clase           | Descripcion                      |
|-----------------|----------------------------------|
| `.dot`          | Circulo de 6px de estado.        |
| `.dot-success`  | Punto verde.                     |
| `.dot-warning`  | Punto amarillo.                  |
| `.dot-error`    | Punto rojo.                      |
| `.dot-info`     | Punto azul.                      |
| `.dot-brand`    | Punto de marca (azul).           |
| `.dot-neutral`  | Punto gris.                      |
| `.dot-pulse`    | Animacion pulse sobre el punto.  |

### Iconos Circulos (Override de Tailwind)
| Clase                  | Descripcion                                                      |
|------------------------|------------------------------------------------------------------|
| `.icon-circle`         | Reset de estilos no deseados sobre iconos en contenedores.       |
| `.icon-circle-success` | Color `--success`.                                               |
| `.icon-circle-info`    | Color `--info`.                                                  |
| `.icon-circle-warning` | Color `--warning`.                                               |
| `.icon-circle-error`   | Color `--error`.                                                 |
| `.icon-circle-brand`   | Color `--brand`.                                                 |

### Utilidades
| Clase                  | Descripcion                                                  |
|------------------------|--------------------------------------------------------------|
| `.custom-scrollbar`    | Scrollbar discreto para contenedores. Siempre aplicar en overflow containers. |
| `.status-tag`          | Tag de estado inline: pill con borde, 8px uppercase.         |
| `.empty-state`         | Estado vacio centrado con borde dashed.                      |
| `.kbd-vercel`          | Elemento keyboard shortcut (Cmd+K, etc.).                    |
| `.focus-ring-vercel`   | Focus ring doble para accesibilidad premium.                 |
| `.progress-fill`       | Barra de progreso con transicion.                            |
| `.progress-fill--success` | Degradado verde→brand-light.                             |
| `.progress-fill--brand`   | Degradado brand→brand-light.                             |
| `.text-balance`        | `text-wrap: balance` para titulos.                           |
| `.text-pretty`         | `text-wrap: pretty` para parrafos.                           |
