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

### 1.2. Propósito Único y Arquitectura de 1 Sola Capa en Modales
* Un modal NUNCA debe duplicar un dashboard complejo ni contener "cajas dentro de cajas" que aplasten los elementos.
* Debe usar una arquitectura de **1 sola capa espaciosa** (ej. tarjetas Bento con micro-interacciones hover) que oriente en 2-3 segundos y ofrezca un CTA principal directo.

### 1.3. Lenguaje Exclusivo del Dominio Académico
* Prohibido mostrar términos de DevOps/Git (`Rama: main`, `Commit -o-`, `Environment: Production`, `GET /api/... 200 OK`).
* Habla en el lenguaje institucional de DIITRA: *Convocatorias*, *Proyectos I+D*, *Carga Horaria*, *Distributivo SIGAFI*, *Acreditación CACES*, *Grupos y Semilleros*.

### 1.4. Cero Truncamientos de Texto (`text-ellipsis`)
* Los textos deben ser concisos y legibles completos, sin cortes forzados (`...`).

### 1.5. Cero Emojis y Cero Iconos SVG Decorativos
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
- [ ] ¿Se evitaron los KPIs gigantes arriba tipo IA genérica, usando listas de resumen o Bento cards de 1 capa?
- [ ] ¿Se evitó el anidamiento de "cajas dentro de cajas" que hace ver las cosas aplastadas?
- [ ] ¿Todos los textos y métricas se leen completos (0% de elipsis o truncamientos)?
- [ ] ¿El lenguaje es 100% del dominio académico (cero jerga de Git/DevOps/APIs)?
- [ ] ¿Hay CERO emojis en títulos, tarjetas y modales?
- [ ] ¿Los botones usan la geometría sobria de Vercel (Negro/Blanco sólido)?
