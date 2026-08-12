# tokens.md — DIITRA Design Tokens Reference

Referencia completa de todas las variables CSS del sistema de diseno DIITRA (Vercel Geist).
Fuente: `src/styles/theme.css`

---

## Colores Base (Dark Mode — Predeterminado)

| Token                  | Valor                          | Uso                                              |
|------------------------|--------------------------------|--------------------------------------------------|
| `--bg`                 | `#000000`                      | Fondo raiz de la aplicacion                      |
| `--fg`                 | `#ffffff`                      | Texto principal, iconos activos, botones primarios |
| `--surface`            | `#0a0a0a`                      | Tarjetas, contenedores, paneles                  |
| `--surface-hover`      | `#151515`                      | Estado hover de superficies                      |
| `--border`             | `rgba(255,255,255,0.15)`        | Bordes por defecto ultra finos                   |
| `--border-hover`       | `rgba(255,255,255,0.25)`        | Bordes en hover                                  |
| `--text-dim`           | `#888888`                      | Texto secundario, placeholders, labels           |
| `--accent`             | `#ffffff`                      | Color de acento (alias de fg en dark)            |
| `--radius`             | `8px`                          | Border radius estandar del sistema               |
| `--grid-color`         | `rgba(255,255,255,0.05)`        | Cuadricula decorativa Vercel                     |
| `--selection-bg`       | `#0070f3`                      | Fondo de seleccion de texto                      |
| `--selection-fg`       | `#ffffff`                      | Texto de seleccion                               |

## Colores de Marca

| Token            | Valor      | Uso                              |
|------------------|------------|----------------------------------|
| `--brand`        | `#0070f3`  | CTA principal, links, acciones   |
| `--brand-dark`   | `#0051c3`  | Hover de brand                   |
| `--brand-light`  | `#3291ff`  | Degradados, estados activos      |

## Colores de Estado

| Token       | Dark Mode   | Light Mode  | Uso              |
|-------------|-------------|-------------|------------------|
| `--error`   | `#f33`      | `#e11d48`   | Error, peligro   |
| `--success` | `#00e054`   | `#059669`   | Exito            |
| `--warning` | `#f5a623`   | `#d97706`   | Advertencia      |
| `--info`    | `#0070f3`   | `#0284c7`   | Informacion      |

## Variantes Translucidas de Estado (para fondos de badges/callouts)

| Token              | Dark Mode                       | Light Mode                     |
|--------------------|---------------------------------|--------------------------------|
| `--success-subtle` | `rgba(0, 224, 84, 0.08)`        | `rgba(5, 150, 105, 0.06)`      |
| `--error-subtle`   | `rgba(255, 51, 51, 0.08)`       | `rgba(225, 29, 72, 0.06)`      |
| `--warning-subtle` | `rgba(245, 166, 35, 0.08)`      | `rgba(217, 119, 6, 0.06)`      |
| `--info-subtle`    | `rgba(0, 112, 243, 0.08)`       | `rgba(2, 132, 199, 0.06)`      |
| `--brand-subtle`   | `rgba(0, 112, 243, 0.08)`       | `rgba(79, 70, 229, 0.06)`      |

## Escala de Grises Geist

| Token         | Dark Value   | Light Value  | Descripcion                        |
|---------------|--------------|--------------|------------------------------------|
| `--accents-1` | `#111111`    | `#ffffff`    | Superficie mas oscura              |
| `--accents-2` | `#333333`    | `#f4f4f5`    | Fondo alternativo                  |
| `--accents-3` | `#444444`    | `#e4e4e7`    | Bordes sutiles                     |
| `--accents-4` | `#666666`    | `#a1a1aa`    | Texto terciario                    |
| `--accents-5` | `#888888`    | `#71717a`    | Equivalente a `--text-dim`         |
| `--accents-6` | `#999999`    | `#52525b`    | Texto atenuado secundario          |
| `--accents-7` | `#eaeaea`    | `#27272a`    | Texto semi-activo                  |
| `--accents-8` | `#fafafa`    | `#09090b`    | Mas cercano al foreground          |

## Tipografia

| Token          | Valor                                     |
|----------------|-------------------------------------------|
| `--font-sans`  | `"Geist Sans", "Inter", system-ui, sans-serif` |
| `--font-mono`  | `"Geist Mono", "Geist Sans", monospace`   |

Las fuentes son cargadas en `index.css` via CDN de fontsource:
- `@fontsource/geist-sans@5.0.3`
- `@fontsource/geist-mono@5.0.3`

## Light Mode — Diferencias Clave

Selector: `[data-theme="light"], .force-light-theme`

| Token         | Light Value   | Nota                                          |
|---------------|---------------|-----------------------------------------------|
| `--bg`        | `#fafafa`     | Fondo claro neutro (no blanco puro)           |
| `--fg`        | `#09090b`     | Texto oscuro casi negro                       |
| `--surface`   | `#ffffff`     | Tarjetas en blanco puro                       |
| `--brand`     | `#4f46e5`     | Indigo en lugar de azul cobalto               |
| `--border`    | `rgba(0,0,0,0.06)` | Bordes muy tenues en claro                |
