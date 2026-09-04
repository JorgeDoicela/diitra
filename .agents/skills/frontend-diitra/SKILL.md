---
name: frontend-diitra
description: Extiende la skill global de frontend con convenciones y patrones específicos de DIITRA (Yjs, CoWorkField, snake_case, Axios). Activa esta skill EN COMBINACIÓN CON `desarrollo-frontend` para tareas de UI, componentes React, estilos o integraciones del cliente en DIITRA.
---
# Extensión de Frontend — DIITRA

> **Orquestación:** Esta skill **extiende y complementa** las directrices globales de `desarrollo-frontend`. Debe cargarse siempre junto con los principios globales (estética premium, micro-animaciones, tipografía, tipado estricto).


## 1. Colaboración en Tiempo Real (Yjs / CoWorkField)

* En formularios editables, encapsula los campos de entrada con el componente `<CoWorkField>` configurado con su `name` y el manejador `cowork`.
* Los nombres de campo **deben coincidir exactamente** con la estructura definida en `DocumentTemplateRegistry.ts` (ej: `LineaInvestigacion`, `SublineaInvestigacion`). Un nombre incorrecto rompe la sincronización en tiempo real entre usuarios.

## 2. Serialización API — snake_case

* El backend de DIITRA transforma globalmente todas las propiedades a `snake_case` en la serialización. Al consumir la API desde React, mapea siempre esperando `snake_case` y provee fallbacks duales para evitar fallos de tipado:
  ```ts
  const value = response.has_template_update ?? response.hasTemplateUpdate;
  ```
* Usa **siempre** el cliente Axios configurado (`api`) para todas las llamadas al backend. No uses `fetch` nativo.

## 3. Modularización — Umbral DIITRA

* El umbral de extracción de subcomponentes en DIITRA es de **700 líneas** (más permisivo que el estándar global de 400-500, dado el alto acoplamiento de contexto compartido). Si una página o componente supera las 700 líneas, extrae inmediatamente sus secciones a componentes hijos en una subcarpeta `components/`.

## 4. Convenciones UI — DIITRA

* Usa `custom-scrollbar` como clase CSS estándar del proyecto para barras de scroll discretas.
* Los sidebars colapsables y arrastrables deben persistir su estado de visibilidad con `localStorage`.
* En selects/dropdowns con catálogos relacionales, verifica que cada opción exponga el `id` local y las claves de vinculación externa necesarias (ej: `l.id` y `s.id_linea` para vincular líneas y sublíneas de forma reactiva).

## 5. Sistema de Color y Selector Unificado de Plantillas

* **Componente Compartido (`ColorPickerField`):** Ubicado en `src/pages/Admin/Templates/components/properties/SharedColorPicker.tsx`. Debe usarse como el estándar único en todos los paneles de propiedades para selección de color (permite rueda nativa, entrada `#HEX` directa y presets institucionales ISTPET).
* **Normalización y Contraste Automático:**
  - `resolveHeaderColor(value)`: Asegura compatibilidad transparente con tokens antiguos (`navy`, `gold`, `slate`, `emerald`) convirtiéndolos a HEX utilizable.
  - `getContrastFg(color)`: Calcula por luminancia si el texto del encabezado debe ser blanco (`#ffffff`) u oscuro (`#0f172a`), garantizando siempre legibilidad en exportaciones y previsualizaciones.
* **Sincronización Bidireccional Canvas ↔ Propiedades:** Al hacer clic o arrastrar un elemento en el lienzo (`RenderCover`, etc.), debe emitirse `onUpdateConfig(blockId, '_activeCoverTab', targetTab)` para activar automáticamente la subpestaña correspondiente en el panel lateral de propiedades.

## 6. Preservación Estricta de Interactividad en Canvas de Plantillas y Workspace

* **PROHIBIDO VOLVER ESTÁTICOS LOS BLOQUES DEL DISEÑADOR:** Al estilizar, ajustar o alinear cualquier bloque del lienzo A4 (`canvasRenderers/` como `RenderProjectGeneralSection`, `RenderResearchersTable`, `RenderSections`, etc.) para igualar un formato oficial (Word / PDF / CACES), **queda estrictamente prohibido eliminar o reemplazar inputs, estados locales (`useState`), eventos (`onUpdateConfig`), botones de reordenamiento con flechas, selectores de variantes o controles interactivos por etiquetas HTML estáticas (`<p>`, `<span>`, `<div>` planos)**.
* **Separación de Capas:**
  1. **Lienzo A4 (`canvasRenderers/`):** Es 100% interactivo y configurable directamente en el canvas y desde el panel de propiedades.
  2. **Workspace de Investigación (`components/DIITRA/sections/`):** Es 100% colaborativo y editable con campos `<CoWorkField>` conectados a Yjs.
  3. **Motor PDF (`DocumentEngine` C#):** Es el único responsable de la emisión final estática con firmas electrónicas.
* **Regla de Oro:** Todo cambio de apariencia visual debe realizarse por CSS, estilos o tokens (`themeConfig`), **preservando intactos todos los eventos, hooks y capacidades de edición**.

