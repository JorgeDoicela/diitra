---
name: styles-diitra
description: >
  Activa esta skill para cualquier tarea que involucre el sistema de diseno visual de DIITRA:
  estilos CSS, tokens de diseno, paleta de colores, tipografia, animaciones, nuevos componentes
  visuales, correccion de inconsistencias de diseno o alineacion estricta con el estilo Vercel.com (Geist).
  Tambien activala cuando el usuario reporte que algo se ve mal o pida mejorar la apariencia
  de cualquier elemento de la interfaz.
---

# DIITRA Design System — Estándar Oficial Vercel.com (Geist)

Esta skill documenta de forma exacta las convenciones de diseño del sistema DIITRA, combinando la precisión minimalista de **Vercel Geist** con los patrones de densidad propios de DIITRA.

---

## 1. Directrices Fundamentales de UX/UI

### 1.1. Prohibido "KPIs Grandes Arriba" (Anti-Patrón de IA Genérica)
* **Anti-patrón:** Poner 3 o 4 tarjetas rectangulares gigantes con números enormes arriba de cada pantalla (esto delata interfaces de plantilla de IA genérica).
* **Patrón Oficial DIITRA (Listas de Resumen de Alta Densidad):** Las métricas y resúmenes se presentan en **bloques de lista horizontal compactos** (`Resumen del Periodo`, `Resumen Institucional`):
  * Título de sección sobrio en `text-[13px] font-semibold text-[#111]`.
  * Filas horizontales: indicador circular/progreso tenue a la izquierda + nombre del concepto (`Mis Proyectos Activos`, `Convocatorias Activas`) + valor tabular alineado a la derecha (`0 proyectos`, `1 vigentes`, `100%`).

### 1.2. Estructura Delimitada y Arquitectura de 1 Sola Capa (Uso Equilibrado de Cajas)
* **Dónde SÍ se usan contenedores y tarjetas Bento:**
  * Para bloques de resumen formal (ej. tarjeta de metadatos de convocatoria con título, tipo y fechas en cuadrícula estructurada).
  * Para controles segmentados de pestañas (`p-1 bg-zinc-100 rounded-xl` con pestaña activa en relieve).
  * Para enmarcar y delimitar listas tabulares con borde exterior fino (`rounded-xl border border-zinc-200/80 divide-y divide-zinc-100`).
* **Lo que está PROHIBIDO (Anidamiento Asfixiante):**
  * Meter "cajas dentro de cajas dentro de cajas" con múltiples bordes y fondos grises apilados que aplastan y encierran visualmente los elementos.
  * Mantener siempre una jerarquía visual limpia de **1 sola capa contenedora directa**, espaciosa y con suficiente margen de respiración.

### 1.3. Jerarquía Tipográfica y Metadatos Clave
* Los datos institucionales de alto impacto (Títulos de Convocatoria/Proyecto, Fechas de Apertura/Cierre, Estados, Tipos) deben tener presencia y jerarquía destacada:
  * Título principal: `text-xl` o `text-2xl font-bold tracking-tight text-zinc-950`.
  * Fechas y metadatos: `text-sm` a `text-[15px] font-bold font-mono text-zinc-900` organizados en cuadrículas limpias de 2 o 3 columnas con labels monospaciados en mayúsculas pequeñas (`text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest`).

### 1.4. Acciones de Selección en Listas (Cero Confusión con Checkboxes Falsos)
* **Prohibido:** Crear botones de acción con iconos de checkbox cuadrados (`[☑ Todos]`, `[☐ Ninguno]`) porque se confunden visualmente con los checkboxes de selección de cada fila.
* **Patrón Correcto:** Usar enlaces o botones de acción textuales transparentes y directos (*"Seleccionar los X visibles"*, *"Deseleccionar todos"*) o un checkbox maestro en cabecera.

### 1.5. Lenguaje Exclusivo del Dominio Académico
* Prohibido mostrar términos de DevOps/Git (`Rama: main`, `Commit -o-`, `Environment: Production`, `GET /api/... 200 OK`).
* Habla en el lenguaje institucional de DIITRA: *Convocatorias*, *Proyectos I+D*, *Carga Horaria*, *Distributivo SIGAFI*, *Acreditación CACES*, *Grupos y Semilleros*.

### 1.6. Cero Truncamientos de Texto (`text-ellipsis`)
* Los textos deben ser concisos y legibles completos, sin cortes forzados (`...`).

### 1.7. Cero Emojis y Cero Iconos SVG Decorativos
* Prohibido el uso de emojis en cualquier parte de la interfaz.
* Prohibidos los iconos SVG decorativos superfluos.

---

## 2. Paleta y Componentes Oficiales

* **Fondo Principal:** `#ffffff` (Canvas claro: `#fafafa` / Dark base: `#000000`).
* **Líneas y Bordes:** `border-zinc-200/80` (1px sólido ultra-delgado).
* **Superficies Hover / Activas:** `rgba(0, 0, 0, 0.04)` para hover; `rgba(0, 0, 0, 0.06)` para selección activa.
* **Botones:**
  * Primario: `bg-zinc-950 text-[#ffffff] text-[13px] font-medium h-10 px-6 rounded-lg hover:bg-black active:scale-[0.98]`.
  * Secundario: `border border-zinc-200 bg-white text-zinc-900 text-[13px] font-medium h-10 px-5 rounded-lg hover:border-zinc-400 active:scale-[0.98]`.

---

## 3. Checklist de Validación Obligatoria

Antes de dar por finalizado cualquier componente visual:
- [ ] ¿Se usaron contenedores Bento y marcos delimitadores donde aportan orden, evitando el anidamiento excesivo de cajas dentro de cajas?
- [ ] ¿Los metadatos clave (título, fechas, tipo) tienen tamaño legible y jerarquía tipográfica grande?
- [ ] ¿Se evitaron botones con iconos de checkbox falsos que causen confusión al usuario?
- [ ] ¿Se evitaron los KPIs gigantes arriba tipo IA genérica, usando listas de resumen o Bento cards de 1 capa?
- [ ] ¿Todos los textos y métricas se leen completos (0% de elipsis o truncamientos)?
- [ ] ¿El lenguaje es 100% del dominio académico (cero jerga de Git/DevOps/APIs)?
- [ ] ¿Hay CERO emojis en títulos, tarjetas y modales?
- [ ] ¿Los botones usan la geometría sobria de Vercel (Negro/Blanco sólido)?
