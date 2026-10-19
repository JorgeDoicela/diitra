# Memoria del Proyecto — DIITRA

Este archivo almacena el contexto operativo, decisiones arquitectónicas consolidadas y lecciones aprendidas exclusivas del proyecto DIITRA.

---

## 1. Decisiones Arquitectónicas Consolidadas

* **Frontend:**
  - Instancia Axios centralizada en `api/` (prohibido `fetch` nativo).
  - Serialización estricta en `snake_case` desde el backend: mapear en React esperando `snake_case` con fallback dual defensivo (`has_template_update || hasTemplateUpdate`).
  - Colaboración en tiempo real: integración obligatoria de Yjs mediante `<CoWorkField>`.
  - Estilos: Sistema Geist Design con Tailwind CSS v4 nativo en `base.css`. Prohibido introducir estilos ad-hoc si existe la clase semántica (`.bento-card`, `.btn-vercel-*`, etc.). Mapeo estricto de `--font-mono: "Geist Mono", monospace` y eliminación de importaciones redundantes de tokens (`theme.css`).
  - Paginación y Maquetación Editorial (W3C Paged Media):
    - `BlockCanvas.tsx` segmenta dinámicamente hojas A4 individuales (794px portrait y 1123px landscape para Gantt). Cada hoja incluye cabecera normativa oficial superior derecha y pie de página institucional (`Página X de Y`).
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
