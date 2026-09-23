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

## 6. Adaptación de Diseños de Fábrica a Producción: Interactividad Total y Expansión Obligatoria de Bloques

Al transformar, estilizar, refinar o alinear cualquier bloque de fábrica (`canvasRenderers/` como `RenderProjectGeneralSection`, `RenderResearchersTable`, `RenderSections`, etc.) para llevarlo al diseño final formal de producción (normativa institucional ISTPET, formatos CACES, PDF oficial o Word):

### 6.1. Preservación Innegociable de Propiedades y Controles de Edición
* **PROHIBIDO VOLVER ESTÁTICOS LOS BLOQUES:** Queda terminantemente prohibido eliminar, aplanar o sustituir campos de edición activa por etiquetas HTML estáticas (`<p>`, `<span>`, `<div>` de texto plano hardcodeado).
* **Conservación del 100% de la Reactividad:**
  - Todo input (`<input>`, `<textarea>`, `<select>`, `<CoWorkField>`), estado local (`useState`), hook y callback (`onUpdateConfig`, `onChange`, `onBlur`) debe mantenerse plenamente operativo.
  - Los botones de acción dinámicos (**+ Agregar fila/investigador/sección**, **Eliminar**, **Reordenar con flechas**, **Selector de variantes**, **Toggles**, **Modales** y **Popovers de configuración**) deben permanecer accesibles e interactivos en el lienzo/editor.
  - Las propiedades de configuración (`config.xxx`) deben poderse seguir editando tanto desde el lienzo interactivo como desde el panel lateral de propiedades (`PropertiesPanel`).
* **Regla para Salidas de Exportación/Impresión:**
  - Si un botón de control no debe aparecer en el documento final impreso, debe ocultarse exclusivamente mediante clases de impresión (ej. `print:hidden`) o flags condicionales de exportación (`isExportingMode`), **NUNCA eliminándolo ni deshabilitándolo en el componente React del editor**.

### 6.2. Regla Fundamental de Expansión (El Bloque Crece, Jamás se Reduce ni Comprime)
* **Expansión Vertical Libre y Holgada (`h-auto`, `min-h-fit`):**
  - Si para acomodar el formato oficial de producción, nuevas columnas, tablas institucionales complejas, metadatos o herramientas de edición se requiere más espacio, **el bloque DEBE EXPANDIRSE verticalmente hacia abajo todo lo necesario**.
  - No hay límites artificiales de altura: el contenedor del bloque debe fluir de forma natural adaptándose al volumen del contenido y a sus herramientas de edición.
* **Prohibición Estricta de Encogimiento, Asfixia y Compresión:**
  - **Cero Alturas Rígidas o Fijas:** Queda prohibido forzar alturas arbitrarias (`h-[400px]`, `h-[500px]`) que encierren el contenido en un tamaño prefijado.
  - **Cero Scroll Interno Asfixiante en Bloques:** Queda prohibido aplicar `max-h-[...] overflow-y-auto` en el cuerpo de los bloques del lienzo para "hacerlos caber". El lienzo completo es el que hace scroll; los bloques no deben ser cajas comprimidas con barras de scroll individuales que entorpezcan la edición.
  - **Cero Reducción Artificial de Tipografía:** Prohibido reducir el tamaño de fuentes a escalas ilegibles (`text-[8px]`, `text-[9px]`, `text-[10px]`) con la excusa de hacer entrar más datos en menos espacio vertical. Los estándares de legibilidad se respetan y el bloque crece hacia abajo.
  - **Cero Supresión de Márgenes o Paddings:** No comprimir los paddings (`py-1`, `gap-0.5`) para ahorrar píxeles. La ergonomía visual y la comodidad de interacción requieren márgenes de respiración adecuados (`py-3`, `gap-3` o superior).
  - **Cero Truncamientos (`truncate`, `line-clamp`):** En áreas de edición activa, está estrictamente prohibido cortar texto con puntos suspensivos o `overflow: hidden`. El usuario debe ver y editar el contenido completo.
* **Cero Eliminación de Controles por Falta de Espacio:**
  - Jamás se debe omitir un campo, una columna o un botón con el pretexto de "falta de espacio". Si el bloque requiere más elementos, **el bloque se expande hacia abajo; nunca se reduce ni se mutila**.

### 6.3. Separación de Capas y Manejo de Paginación
1. **Lienzo de Edición (`canvasRenderers/`):** Es un entorno de trabajo 100% interactivo, reactivo y de altura libremente expansible. No debe forzarse a simular cortes de página rígidos que mutilen o compriman los componentes.
2. **Workspace Colaborativo (`components/DIITRA/sections/`):** Colaboración en tiempo real con `<CoWorkField>` y Yjs, con altura dinámica según el volumen redactado por los investigadores.
3. **Motor de Documentos (`DocumentEngine` C# / Print CSS):** Es el único responsable de la paginación formal A4, saltos de página y generación final estática de PDF/Word con firmas electrónicas.

### 6.4. Matriz de Patrones: Anti-Patrón vs Patrón Correcto

| Aspecto | Anti-Patrón (Prohibido) | Patrón Correcto (Obligatorio) |
| :--- | :--- | :--- |
| **Interactividad** | Convertir inputs a `<p>` o `<span>` para que "se vea como el PDF final". | Mantener inputs, textareas y bindings reactivos con estilo visual de alta fidelidad. |
| **Botones de Acción** | Quitar "+ Agregar fila" o botones de borrado para "limpiar la vista". | Mantener todos los botones de acción en el canvas; usar `print:hidden` para ocultarlos al exportar. |
| **Altura del Bloque** | Usar `h-[350px] overflow-y-auto` para que no ocupe mucho en el lienzo. | Usar `h-auto min-h-fit` permitiendo que el bloque se expanda naturalmente hacia abajo. |
| **Densidad y Espacio** | Achicar fuentes a `text-[9px]` o quitar padding para que "quepa en una hoja". | Mantener tipografía legible y espaciado ergonómico; el bloque crece verticalmente. |
| **Manejo de Textos** | Usar `truncate` o `line-clamp-2` ocultando texto del usuario en edición. | Mostrar todo el texto sin truncamientos, expandiendo la altura del campo automáticamente. |

* **Regla de Oro:** Todo rediseño hacia producción se realiza mejorando el CSS, la tipografía y los tokens visuales, **garantizando que el bloque conserve intactas todas sus capacidades de edición y crezca holgadamente hacia abajo sin jamás comprimirse ni reducirse**.

## 7. Sistema de Portapapeles Estructurado para IA (core/clipboard)

> **Activar siempre** que se agregue una sección nueva, bloque o documento al workspace colaborativo.
> Permite copiar el contenido de cualquier sección al portapapeles en formato optimizado para IA
> con clic derecho (desktop) o pulsación larga (móvil).

### 7.1. Arquitectura del módulo

```
src/core/clipboard/
├── index.ts                          ← Barrel export (importar siempre desde aquí)
├── types/promptClipboard.types.ts    ← PromptClipboardContextData, CopyMode
├── hooks/usePromptClipboard.ts       ← copyToClipboard(), copiedMessage
├── components/
│   ├── BlockClipboardWrapper.tsx     ← Wrapper UI (clic derecho / long-press)
│   └── PromptContextMenu.tsx         ← Menú flotante con los 5 modos
└── utils/promptClipboardEngine.ts    ← Motor: buildClipboardPayload, resolveContentString,
                                         formatStructuredCollection, buildFullDocumentMarkdown
```

**Flujo:**
```
[clic derecho sobre sección]
   → BlockClipboardWrapper → PromptContextMenu → usuario elige CopyMode
   → usePromptClipboard.copyToClipboard(mode, contextData, globalFormData)
   → buildClipboardPayload() → portapapeles
```

### 7.2. Los 5 modos de copiado (CopyMode)

| Modo | Qué copia |
|:---|:---|
| `structured` | Contexto institucional + instrucciones + borrador actual — **modo principal** |
| `clean_content` | Solo el texto redactado (sin etiquetas HTML) |
| `instructions` | Solo la consigna y requisitos normativos |
| `project_summary` | Metadatos globales del proyecto (título, carrera, línea, tipo) |
| `full_document` | Documento completo estructurado en Markdown |

### 7.3. Cómo integrar en una sección nueva

**Caso A — Contenido HTML / CoWorkField (automático, no requiere serializer):**
```tsx
// SectionBlockGuard ya envuelve con BlockClipboardWrapper — solo añadir los props
<SectionBlockGuard
    id="antecedentes"
    title="1. Antecedentes de la Problemática"
    fieldKey="Antecedentes"
    instructions="Describir el contexto histórico y científico del problema..."
    requirementText="Mínimo 800 palabras. Incluir al menos 10 citas APA 7."
    showInlineLock={true}
>
    {/* contenido */}
</SectionBlockGuard>
```

**Caso B — Arrays de objetos (requiere contentSerializer):**
```tsx
<SectionBlockGuard
    id="mi_seccion"
    title="X. Mi Sección"
    fieldKey="MiCampoEnFormData"
    instructions="..."
    requirementText="..."
    contentSerializer={(_data: unknown) =>
        // IMPORTANTE: _data NO se usa — los datos vienen de variables locales del componente
        (misItems as Record<string, unknown>[]).map((item, i) => {
            const nombre  = String(item.titulo || item.nombre || `Ítem ${i + 1}`);
            const detalle = String(item.detalle || '');
            return [
                `${i + 1}. ${nombre}`,
                detalle ? `   • Detalle: ${detalle}` : '',
            ].filter(Boolean).join('\n');
        }).join('\n\n')
    }
>
    {/* contenido */}
</SectionBlockGuard>
```

**Caso C — Campos planos con prefijo (ej: `Impacto_social`, `Impacto_cientifico`):**
```tsx
contentSerializer={(_data: unknown) => {
    const formRecord = globalFormData as Record<string, unknown> | null;
    return Object.keys(formRecord ?? {})
        .filter(k => k.startsWith('MiPrefijo_'))
        .map(k => {
            const label = k.replace('MiPrefijo_', '');
            const val = typeof formRecord?.[k] === 'string' ? (formRecord[k] as string).replace(/<[^>]+>/g, '').trim() : '';
            return val ? `• ${label}: ${val}` : null;
        })
        .filter(Boolean)
        .join('\n');
}}
```

### 7.4. ¿Cuándo usar contentSerializer?

| Tipo de contenido | ¿Serializer? | Razón |
|:---|:---:|:---|
| Texto HTML (CoWorkField) | No | `stripHtml()` automático |
| Array con campos `nombre`/`descripcion` estándar | Opcional | Solo si hay campos clave no estándar |
| Array con campo `titulo` en vez de `nombre` | Sí | El heurístico no lo detecta |
| Array con campos propios (`ActividadesEjecutadas`, `PorcentajeAvance`, etc.) | Sí | Heurístico falla |
| Campos planos con prefijo (`Impacto_*`) | Sí | No son arrays — el engine no los agrupa |

**Reglas del serializer:**
1. Firma siempre: `(_data: unknown) => string` — el parámetro no se usa, los datos vienen de variables locales
2. Cast interno: `as Record<string, unknown>[]` + `String(item.campo || '')` para cada valor
3. **Nunca `any`** — viola `@typescript-eslint/no-explicit-any`. Usar `unknown` + cast

### 7.5. Registrar en buildFullDocumentMarkdown (modo full_document)

Cada sección nueva **también debe agregarse** en `promptClipboardEngine.ts → buildFullDocumentMarkdown()`:

```ts
// Para texto HTML — usar helper fd():
const miCampo = fd(formData, 'MiCampo', 'mi_campo_snake');
if (miCampo) sections.push(`\n## N. NOMBRE DE SECCIÓN\n${miCampo}`);

// Para array de objetos:
const misItems = formData.MisItems || formData.mis_items;
if (Array.isArray(misItems) && misItems.length > 0) {
    const texto = (misItems as DataRecord[]).map((item, i) =>
        `${i + 1}. ${String(item.nombre || item.titulo || `Ítem ${i + 1}`)}`
    ).join('\n\n');
    sections.push(`\n## N. NOMBRE DE SECCIÓN\n${texto}`);
}

// Para campos planos con prefijo:
const camposPlanos = Object.keys(formData).filter(k => k.startsWith('MiPrefijo_'));
if (camposPlanos.length > 0) {
    const texto = camposPlanos
        .map(k => { const v = stripHtml(formData[k]); return v ? `• ${k.replace('MiPrefijo_', '')}: ${v}` : null; })
        .filter(Boolean).join('\n');
    if (texto) sections.push(`\n## N. NOMBRE\n${texto}`);
}
```

### 7.6. Estado de implementación — Secciones con clipboard

**Implementado y completo:**

| Sección / Vista | Rol soportado | Serializer | Documento / Pantalla |
|:---|:---|:---|:---|
| TechnicalSection (Antecedentes, Justificación, Objetivos, etc.) | `'author'` | No (automático) | Protocolo / Plan APE |
| BibliographySection | `'author'` | No (automático) | Protocolo / Plan APE |
| ImpactSection | `'author'` | Explícito (`impactSerializer`) | Protocolo |
| ExpectedProductsSection | `'author'` | Explícito | Protocolo |
| LearningPlanSection — Prerrequisitos | `'author'` | Explícito | Plan APE |
| LearningPlanSection — Actividades APE | `'author'` | Explícito | Plan APE |
| ProgressReportSection — Actividades Ejecutadas | `'author'` | Explícito | Informe de Avance |
| **InteractiveSections (Vista Revisión Técnica Admin)** | **`'reviewer'`** | Serializers dedicados (presupuesto, entregables, impactos) | **Revisión Técnica Administrador** |
| **PreproposalAdminView (Revisión Prepropuesta Admin)** | **`'reviewer'`** | No (automático / valores formateados) | **Revisión Prepropuesta Administrador** |

**Pendiente de implementar (usar este checklist al hacerlo):**

| Sección / Bloque | Documento | Tipo esperado | Prioridad |
|:---|:---|:---|:---|
| InvestigatorsSection (Equipo de investigación) | Protocolo | Array `Investigadores` | Alta |
| BudgetSection / PresupuestoSection (Editor Investigador) | Protocolo | Array de rubros presupuestarios | Alta |
| ChronogramSection / CronogramaSection (Editor Investigador) | Protocolo | Array de actividades con fechas | Alta |
| GanttSection | Plan APE / Informe | Array de tareas Gantt | Media |
| EvaluationSection | Plan APE | Campos de evaluación de actividades | Media |
| ConsolidatedReport / Conclusiones / Recomendaciones | Informe de Avance | HTML + arrays mixtos | Media |
| Informe Final, Artículo Científico, Memoria Técnica | Nuevos documentos | TBD según estructura | A definir |

### 7.6.1. Soporte de Roles: Autor (`'author'`) vs Revisor / Auditor (`'reviewer'`)

El sistema es polimórfico mediante el prop `role?: 'author' | 'reviewer'` en `BlockClipboardWrapper`:
- **`role="author"` (por defecto):** Orientado a redacción, expansión y corrección de estilo para docentes e investigadores.
- **`role="reviewer"`:** Orientado a auditoría metodológica, detección de vacíos técnicos, cumplimiento normativo CACES y formulación de observaciones formales para evaluadores y administradores.
  - En el menú contextual: muestra títulos claros como *"Copiar para Auditar Sección con IA"* y *"Copiar Protocolo Completo (Dictamen)"*.
  - En el motor de prompts: genera consignas de auditoría técnica con pautas institucionales para emisión de observaciones y dictámenes.

### 7.7. Checklist de integración (nueva sección, bloque o documento)

```
1. ANALIZAR el shape real de los datos:
   [ ] ¿HTML/texto? → solo agregar fieldKey + instructions al SectionBlockGuard
   [ ] ¿Array de objetos? → anotar los nombres reales de cada campo (no asumir 'nombre')
   [ ] ¿Campos planos con prefijo? → patrón Object.keys().filter(k => k.startsWith(...))

2. EN EL COMPONENTE (.../sections/MiSeccion.tsx):
   [ ] Verificar que usa SectionBlockGuard o BlockClipboardWrapper
   [ ] Agregar: id, title, fieldKey, instructions, requirementText
   [ ] Si array/campos complejos: agregar contentSerializer={(_data: unknown) => ...}
   [ ] Usar datos locales del componente dentro del serializer, no el parámetro _data
   [ ] Tipos: Record<string, unknown>[] + String() — nunca any[]

3. EN promptClipboardEngine.ts → buildFullDocumentMarkdown():
   [ ] Agregar bloque de la nueva sección con número de sección correcto
   [ ] Texto HTML: usar helper fd(); arrays: cast DataRecord[] + map

4. VERIFICAR CALIDAD:
   [ ] npx tsc --noEmit → 0 errores
   [ ] npx eslint [archivo modificado] → 0 errores nuevos
   [ ] Probar clic derecho sobre la sección en el navegador (dev server)
   [ ] Verificar los 3 modos clave: structured, clean_content, full_document

5. ACTUALIZAR ESTA SKILL:
   [ ] Mover la sección de "Pendiente" a "Implementado" en la tabla 7.6
```

### 7.8. Reglas ESLint activas del proyecto (relevantes para el clipboard)

```js
// eslint.config.js — configurado en el proyecto
'@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',   // parámetros con prefijo _ NO generan error
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
}]
```

- `any` explícito **siempre viola** ESLint → usar `unknown` / `Record<string, unknown>` / `Record<string, unknown>[]`
- Parámetros no usados → prefijo `_` (ej: `_data`)
- Hooks → `useMemo`/`useState`/`useCallback` **siempre ANTES** de cualquier `return` condicional (Rules of Hooks)


