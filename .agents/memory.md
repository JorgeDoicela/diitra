# Memoria del Proyecto — DIITRA

Este archivo almacena el contexto operativo, decisiones arquitectónicas consolidadas y lecciones aprendidas exclusivas del proyecto DIITRA.

---

## 1. Decisiones Arquitectónicas Consolidadas

* **Frontend:**
  - Instancia Axios centralizada en `api/` (prohibido `fetch` nativo).
  - Serialización estricta en `snake_case` desde el backend: mapear en React esperando `snake_case` con fallback dual defensivo (`has_template_update || hasTemplateUpdate`).
  - Colaboración en tiempo real: integración obligatoria de Yjs mediante `<CoWorkField>`.
  - Estilos: Sistema Geist Design con Tailwind CSS v4 nativo en `base.css`. Prohibido introducir estilos ad-hoc si existe la clase semántica (`.bento-card`, `.btn-vercel-*`, etc.). Mapeo estricto de `--font-mono: "Geist Mono", monospace` y eliminación de importaciones redundantes de tokens (`theme.css`).
  - Paginación y Maquetación Editorial (W3C Paged Media / SSOT):
    - Única Fuente de Verdad (SSOT): La orientación reside exclusivamente a nivel de documento en `themeConfig.layout.pageOrientation` ('portrait' | 'landscape') y sus excepciones por página en `themeConfig.layout.sectionOrientations` (`Record<string, 'portrait' | 'landscape'>` indexado por el ID del primer bloque de la página). Cero dispersión en bloques de contenido (`BlockConfig` no contiene propiedades de orientación, respetando SRP).
    - Alternancia Directa en Canvas: El usuario puede alternar la orientación de cualquier página individual directamente desde el encabezado/separador de página (`PÁGINA X`) en `BlockCanvas.tsx`.
    - Dimensiones Físicas y Orientación Real A4 en Canvas (WYSIWYG 1:1):
      - Geometría A4 Real (96 DPI):
        * Vertical (Portrait): `w-[794px] min-w-[794px] max-w-[794px] min-h-[1123px]`.
        * Horizontal (Landscape): `w-[1123px] min-w-[1123px] max-w-[1123px] min-h-[794px]`.
      - Altura de Portada (Cover Page): En la portada (`RenderCover`), la altura se adapta estrictamente a la orientación (`h-[794px]` en horizontal vs `h-[1123px]` en vertical), eliminando el fallo donde un valor fijo de 1123px forzaba una proporción cuadrada (1123x1123).
      - Tanto el contenedor de página (`PageSheetWrapper`) como los separadores de página (`PageBreakIndicator` y cabecera de Página 1) adaptan su ancho dinámicamente a 1123px en páginas apaisadas, reflejando de forma inmediata y clara la rotación del papel.
      - Escalado Proporcional y Responsivo del Lienzo (Fit-to-Width & Zoom Engine):
        * Mecanismo de Escalado CSS `zoom`: Utiliza `style={{ zoom: effectiveZoom }}` para escalar el árbol DOM recalculando las cajas de flujo, manteniendo el scroll vertical 100% natural y la exactitud de arrastre en `useFreeFormDrag.ts`.
        * ResizeObserver Automático (Modo Fit): `BlockCanvas.tsx` detecta si el documento contiene páginas horizontales (`maxSheetWidth = hasLandscapePage ? 1123 : 794`). Si el ancho disponible en pantalla es inferior a `maxSheetWidth + 32px`, calcula automáticamente el ratio de escala para que la hoja quepa completa en pantalla sin desbordamiento horizontal.
        * Controles de Zoom en Lienzo: Iconos SVG puros (`ZoomOut` y `ZoomIn`) ubicados inmediatamente a la derecha del título de la plantilla en la barra superior del canvas, sin cajas contenedoras ni números de porcentaje. Soporta:
          - `Ctrl + Rueda del ratón` (Wheel Up/Down): Zoom in/out fluido en incrementos de 5%, capturando el evento nativo con `preventDefault()` para evitar el zoom del navegador.
          - `Ctrl + +` / `Ctrl + -`: Zoom in/out por teclado en pasos de 10%.
          - `Ctrl + 0` o doble clic en los iconos: Restablecimiento instantáneo a escala ajustada (*Scale-to-Fit*).
          - Rango de zoom: 35% a 200%.
        * Columnas Laterales Flexibles: En `DocumentTemplatesPage.tsx`, el catálogo y el panel de propiedades adoptan anchos adaptativos (`w-72 xl:w-80` y `w-80 xl:w-96` respectivamente), otorgando hasta 96px adicionales de holgura en pantallas de computadoras portátiles (1366px - 1440px).
    - Cronograma Gantt: Por su naturaleza matricial de 48 columnas, se maqueta en su propia sección horizontal (`w-[1123px] min-h-[794px]` en lienzo y A4 horizontal rotado físico en PDF vía `SplitDocumentParts`).
    - `HtmlGenerator.ts`: Envuelve secciones con orientación divergente en `<!-- START_LANDSCAPE_SECTION -->` / `<!-- START_PORTRAIT_SECTION -->` con contenedores CSS dedicados.
    - Backend iText 7 (`ITextHtmlPdfRenderer.cs`): Detecta `isDocumentGloballyLandscape` y ejecuta `SplitDocumentParts` con soporte bidireccional para secciones Landscape y Portrait, renderizando cada parte en su tamaño de página real (`PageSize.A4` o `PageSize.A4.Rotate()`) y fusionándolas con numeración continua de páginas.
    - Soporta salto semántico directo `pageBreakBefore: true` a nivel de bloque sin necesidad de inyectar bloques auxiliares descartables de tipo `page_break`.
    - Distribución oficial por hojas para Protocolos de Investigación e Innovación:
      * Página 1: Portada Institucional (Cover).
      * Página 2: 1. Identificación del Proyecto + 2. Investigadores (~750px, cabe holgada en A4).
      * Página 3: 3. Especificación del Proyecto (`pageBreakBefore: true`).
      * Página 4: 4. Recursos, Costo y Financiamiento (`pageBreakBefore: true`) + 5. Productos Esperados + 6. Impactos.
      * Página 5: 7. Cronograma de Actividades (Gantt, apaisada 1123x794px).
      * Página 6: 8. Bibliografía + Firmas de Responsabilidad.
    - `useDocumentTemplatesPage.ts` normaliza automáticamente `pageBreakBefore: true` en bloques técnicos y presupuestarios si no están definidos, asegurando que las plantillas cargadas reflejen siempre la separación física A4.
    - Generación HTML modular (`sectionsGenerator.ts`): los saltos de subsección cierran y abren tablas independientes con `<div class="page-break"></div>` a nivel de bloque, eliminando el antipatrón de saltos en `<tr>`.
* **Backend y Persistencia:**
  - ASP.NET Core Web API (.NET 8) con Pomelo MySQL (`sigafi_es`, puerto 3306).
  - Separación de esquemas: tablas del dominio DIITRA llevan prefijo `inv_` (escritura).
  - Frontera SIGAFI: tablas de catálogos institucionales externos son estrictamente de **solo lectura**.
  - Motor de Renderizado PDF (iText 7 pdfHTML):
    - Reglas editoriales estrictas en `InstitutionalBaseCss` y `WrapInFullHtmlDocument`: prevención de encabezados huérfanos (`break-after: avoid !important`), filas de tabla indivisibles (`tr { break-inside: avoid !important }`), repetición automática de cabeceras en páginas subsiguientes (`thead { display: table-header-group !important }`) y control de viudas/huérfanas (`orphans/widows: 3`).
    - Saneamiento de dimensiones CSS: los valores de porcentaje nunca deben contener barras invertidas (`\%`), ya que iText extrae el prefijo numérico como `'100\'` causando `FormatException` en `Single.Parse`. Tanto el pipeline de `DocumentEngine.cs` como `ITextHtmlPdfRenderer.cs` sanitizan defensivamente `\%` a `%`.
  - Código Normativo Oficial e Identidad CACES (`RegulatoryCode`):
    - Ciudadano de Primer Nivel: Se desacopla el código normativo oficial (ej: `F – ISTPET – 001 – INDIV – ABR 2026`) de los estilos cosméticos (`ThemeConfigJson`). Reside en la columna `regulatory_code` indexada en `inv_document_templates` e `inv_documentos_instancias`.
    - Trazabilidad e Historicidad: Al instanciar un documento, se congela el snapshot del código normativo oficial en la instancia para garantizar auditorías CACES inmutables.
    - Cero Switches Quemados: Se eliminan los mapeos hardcodeados en C# y TypeScript; la fuente de la verdad reside en la base de datos y se inicializa mediante el seeder oficial (`DocumentTemplateRegistry.cs`).
    - Búsqueda y Filtros en Tiempo Real: Expuesto nativamente en `DocumentTemplateDto.regulatoryCode`, soportado con query en `GET /api/admin/templates?regulatoryCode=...` y buscable tanto en el Catálogo Oficial de Formatos (`OfficialTemplatesCatalogView.tsx`) como en el Catálogo de Administración (`TemplateCatalog.tsx`).
    - Posicionamiento Libre 2D en Lienzo y PDF (`useFreeFormDrag` / `FreeFormRegulatoryCode`):
      * Posicionamiento Absoluto Determinista (Cero Desplazamientos): Eliminación de transforms relativos (`translate(-10%, 0)`) y escalados elásticos que causaban saltos al hacer hover o editar. Las coordenadas `left: X%` y `top: Y%` son la única fuente de posición en pantalla y coinciden 1:1 con las proyecciones físicas milimétricas del PDF (`HtmlGenerator.ts`).
      * Edición In-Place sin Deformación de Layout: El campo de entrada en edición inline preserva exactamente la misma tipografía mono (`ch` width), tamaño y padding que el texto en reposo. Los botones de acción rápida se presentan en un menú flotante superior (`-top-7`) para no comprimir ni desplazar horizontalmente el texto. Guardado automático con `Enter` o `onBlur`, cancelación con `Esc`.
      * Interacción Minimalista en Lienzo (Cero Barras Invasivas): Se eliminaron barras y popups emergentes sobre el lienzo; la interacción se concentra en el arrastre libre directo a cualquier coordenada 2D y el clic para modificar el texto in-place. La configuración cosmética avanzada (variantes visuales) permanece centralizada en el panel lateral de temas.
      * Claridad Semántica de Restablecimiento: Se diferencian explícitamente en la interfaz:
        - "Restablecer Plantilla" (barra superior): Reconstruye en backend la estructura completa (bloques, secciones oficiales, cronograma y firmas).
        - "Restablecer Estilos" (pestaña lateral Estilos): Resetea exclusivamente la configuración cosmética (paleta de colores, márgenes de página y tipografía), sin tocar bloques ni contenido.

---

## 2. Restricciones y Reglas Específicas

* Umbral máximo de 700 líneas por componente en React antes de modularizar.
* Preservación innegociable de la editabilidad en plantillas V1, trayecto del documento y portapapeles con `SectionBlockGuard`.
* Cero emojis y cero lenguaje publicitario o inflado en código y documentación.

---

## 3. Infraestructura y Operación del Servidor Local (24/7)

* **Gestión de Energía (Always-On):**
  - Planes de energía configurados en corriente alterna (AC) y batería (DC) con tiempo de suspensión (`STANDBYIDLE`), hibernación (`HIBERNATEIDLE`) y apagado de discos (`DISKIDLE`) en 0 (deshabilitados).
  - Acción de cierre de tapa (`LIDACTION`) establecida en 0 (ignorar).
* **Docker Desktop y Contenedores:**
  - Autoarranque habilitado en `settings-store.json` (`AutoStart: true`, `OpenUIOnStartupDisabled: true`).
  - Ahorro de recursos deshabilitado (`UseResourceSaver: false`) para evitar suspensión de la máquina virtual WSL2 tras inactividad.
  - Registro de Windows `HKCU:\...\StartupApproved\Run` habilitado para `Docker Desktop`.
  - Política de reinicio en contenedores establecida en `unless-stopped`.
* **Túnel Cloudflare (`setup_cloudflare_tunnel.ps1`):**
  - Soporte dual: no bloquea ni fuerza elevación UAC en operaciones estándar.
  - Modo Usuario: Auto-arranque mediante launcher silencioso VBScript en `$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Start-Cloudflare-Tunnel.vbs`. Parámetros CLI `-Background`, `-Stop`, `-Check`, `-EnableAutoStart`, `-DisableAutoStart`.
  - Modo Servicio: Opción 4 (`Install-PermanentService`) para ejecución como servicio del sistema operativo 24/7 (`LocalSystem`) que inicia previo al inicio de sesión.
  - Ingress multi-proyecto: `diitra.doicela.dev` (puerto 80 IIS), `ateneo.doicela.dev` (puerto 5173 Docker), `staging-dosier.doicela.dev` (puerto 8080 Docker).
