# 08 - Motor Enterprise de Documentos (Document Engine)

> **Estado:** ✅ En producción · Migración v2 aplicada el 06/05/2026

---

## Visión General

El Motor de Documentos es el subsistema encargado de generar **todos los PDFs institucionales** del DIITRA de forma dinámica, desacoplada y sin necesidad de recompilación. Nació para resolver el problema de la obsolescencia normativa: cuando SENESCYT o el CES actualizan un formato, el administrador edita la plantilla HTML desde el panel web y el cambio aplica inmediatamente.

### Principio de uso (desde cualquier módulo)

```csharp
var result = await _documentEngine.GenerateAsync(new DocumentRequest {
    TemplateCode = "PROTOCOLO_INVESTIGACION",
    Data         = proyectoDto,
    RequestedBy  = User.Identity?.Name
});
return File(result.PdfBytes, "application/pdf", result.FileName);
```

---

## Arquitectura del Pipeline

El motor opera en **5 pasos secuenciales** coordinados por `DocumentEngine.cs`:

```
[CONTROLADOR]
      │
      ▼
1. Cargar plantilla HTML desde BD (doc_templates por Code)
      │
      ▼
2. LegalComplianceInjector → inyecta pie LOPDP + aviso doble ciego si aplica
      │
      ▼
3. ScribanTemplateEngine → Handlebars.Net inyecta variables del DTO en el HTML
      │
      ▼
4. ITextHtmlPdfRenderer → iText7 convierte HTML+CSS → PDF binario (A4)
      │
      ▼
5. DocumentAuditRepository → registra en doc_audit_entries (trazabilidad legal)
      │
      ▼
[DocumentResult { PdfBytes, FileName, TraceabilityCode, TemplateVersion }]
```

---

## Stack Tecnológico

| Herramienta | Rol | Versión | Licencia |
|---|---|---|---|
| **Handlebars.Net** | Motor de plantillas `{{variable}}` | 2.1.6 | MIT ✅ |
| **iText7 + pdfHTML** | HTML → PDF (soporte CSS completo, A4) | 9.6 / 6.3 | AGPL ⚠️ |
| **EF Core + Pomelo** | Persistencia MySQL | 9.0.0 | MIT ✅ |

> [!WARNING]
> **iText7 (AGPL):** Gratuito solo si el proyecto es open source. Para uso institucional privado, la licencia comercial parte de ~$700/año. El motor está diseñado para reemplazar `ITextHtmlPdfRenderer.cs` (un solo archivo) sin afectar ningún otro componente si se decide cambiar a una alternativa MIT como PuppeteerSharp.

---

## Mapa de Archivos

```
diitra_application/Common/
├── IDocumentEngine.cs              ← Contrato público (NUNCA modificar)
│   ├── DocumentRequest             ← Input del motor
│   └── DocumentResult              ← Output del motor

diitra_application/Research/Dtos/
└── ProyectoDto.cs                  ← 30+ campos — cubre las 9 secciones del formato oficial
    ├── InvestigadorDto
    ├── RecursoDisponibleDto / RecursoNecesarioDto
    ├── ProductoEsperadoDto
    ├── ImpactoProyectoDto
    └── ActividadCronogramaDto      ← Incluye List<bool> Semanas (Gantt)

diitra_domain/Common/Documents/
├── DocumentTemplate.cs             ← Entidad plantilla (tabla: doc_templates)
├── DocumentAuditEntry.cs           ← Entidad auditoría (tabla: doc_audit_entries)
└── DocumentCategory.cs             ← Enum de categorías

diitra_infrastructure/Common/Documents/
├── DocumentEngine.cs               ← Orquestador principal
├── DocumentRepositories.cs         ← EF Core
├── DocumentTemplateSeed.cs         ← 10 plantillas base (cargadas en BD)
├── ProyectoInvestigacionTemplate.cs← Formato oficial 9 secciones SENESCYT/ISTPET
└── Engine/
    ├── ScribanTemplateEngine.cs    ← Handlebars: variables, helpers, doble ciego
    ├── ITextHtmlPdfRenderer.cs     ← iText7: HTML→PDF + CSS base institucional
    ├── PdfMergerService.cs         ← Fusión de PDFs + anexos (paquetes CACES)
    └── LegalComplianceInjector.cs  ← Pie LOPDP, aviso peer review

diitra_api/Controllers/
├── ProjectsController.cs           ← POST /api/projects/generate-pdf
└── DocumentTemplatesController.cs  ← API de administración de plantillas

Base de datos (MySQL - sigafi_es):
├── doc_templates                   ← Plantillas HTML editables
└── doc_audit_entries               ← Log inmutable de cada documento emitido
```

---

## Variables Globales (disponibles en TODAS las plantillas)

Inyectadas automáticamente por `ScribanTemplateEngine.cs`:

| Variable | Valor |
|---|---|
| `{{fecha_emision}}` | `06 de mayo de 2026` |
| `{{fecha_emision_corta}}` | `06/05/2026` |
| `{{hora_emision}}` | `14:30` |
| `{{anio_actual}}` | `2026` |
| `{{ciudad}}` | `Quito` |
| `{{pais}}` | `Ecuador` |
| `{{institucion}}` | `DIITRA - Departamento de Investigación e Innovación Traversari` |
| `{{es_doble_ciego}}` | `true` / `false` |

### Helpers disponibles

```handlebars
{{default valor "fallback"}}         → valor o "N/A" si está vacío
{{fecha_larga fecha}}                → "06 de mayo de 2026"
{{moneda cantidad}}                  → "$1,250.00"
{{#each lista}} ... {{/each}}        → iteración sobre arrays
{{#if condicion}} ... {{/if}}        → condicional
{{#unless condicion}} ... {{/unless}}→ condicional inverso
```

---

## Catálogo de Plantillas (10 base en BD)

| Code | Nombre | Doble Ciego | Firma | LOPDP |
|---|---|---|---|---|
| `PROTOCOLO_INVESTIGACION` | Protocolo de Proyecto (9 secciones SENESCYT) | ❌ | ✅ | ✅ |
| `PROTOCOLO_PEER_REVIEW` | Protocolo — Evaluación por Pares | ✅ | ❌ | ✅ |
| `ACTA_APROBACION_PROYECTO` | Acta de Aprobación de Proyecto | ❌ | ✅ | ✅ |
| `INFORME_AVANCE` | Informe de Avance de Investigación | ❌ | ✅ | ✅ |
| `CONSENTIMIENTO_INFORMADO` | Consentimiento Informado (CEISH/LOPDP) | ❌ | ❌ | ✅ |
| `ACTA_SEMILLERO` | Acta de Conformación de Semillero | ❌ | ✅ | ✅ |
| `CERTIFICADO_PARTICIPACION` | Certificado de Participación | ❌ | ✅ | ❌ |
| `CESION_DERECHOS_AUTOR` | Cesión de Derechos Patrimoniales (SENADI) | ❌ | ✅ | ✅ |
| `TDR_COMPRAS` | Términos de Referencia (SERCOP) | ❌ | ✅ | ❌ |
| `REPORTE_DISTRIBUTIVO` | Cruce Distributivo-Investigación (CACES) | ❌ | ✅ | ✅ |

### Formato oficial `PROTOCOLO_INVESTIGACION` (v2 — migrado 06/05/2026)

La plantilla fue migrada del código C# hardcodeado (QuestPDF, `[Obsolete]`) al motor dinámico. Cubre las **9 secciones reglamentarias** del formato oficial SENESCYT/ISTPET:

| Sección | Variables clave |
|---|---|
| 1. Identificación del Proyecto | `{{titulo}}`, `{{codigo_institucional}}`, `{{carrera}}`, `{{tipo_investigacion}}`, `{{dominio}}`, fechas |
| 2. Investigadores | `{{#each investigadores}}` — nombre, cédula, email, nivel, rol |
| 3. Especificación | `{{antecedentes}}`, `{{objetivo_general}}`, `{{#each objetivos_especificos}}`, `{{marco_teorico}}`, `{{metodologia}}`, `{{evaluacion}}` |
| 4. Recursos y Financiamiento | `{{#each recursos_necesarios}}`, `{{moneda costo_total}}`, `{{fuente_financiamiento}}` |
| 5. Productos Esperados | `{{#each productos_esperados}}` |
| 6. Impacto | `{{impacto.social}}`, `{{impacto.cientifico}}`, etc. |
| 7. Cronograma Gantt | `{{#each cronograma}}` → `{{#each semanas}}` → 24 columnas (6 meses × 4 semanas) |
| 8. Bibliografía | `{{#each bibliografia}}` — numeración APA 7ª automática |
| 9. Firmas | `{{nombre_director_firma}}`, `{{nombre_coordinador_firma}}` |

---

## API de Administración

```http
# Listar todas las plantillas activas
GET /api/admin/templates

# Actualizar HTML de una plantilla (sin recompilar)
PUT /api/admin/templates/{code}
Content-Type: application/json
{ "htmlContent": "<div>...</div>", "customCss": "..." }

# Generar PDF del protocolo de investigación
POST /api/projects/generate-pdf
Content-Type: application/json
{ ... ProyectoDto ... }

# Generar versión doble ciego para peer review
POST /api/projects/generate-pdf/blind-review
Content-Type: application/json
{ ... ProyectoDto ... }
```

> [!IMPORTANT]
> Los endpoints de `/api/admin/templates` deben protegerse con `[Authorize(Roles = "Admin")]` antes de salir a producción pública.

---

## Guía de Cambios Comunes

| Cambio | Archivo a tocar |
|---|---|
| Actualizar texto/sección de un formato | `PUT /api/admin/templates/{code}` — sin recompilar |
| Cambiar márgenes o fuente base del PDF | `ITextHtmlPdfRenderer.cs` → constante `InstitutionalBaseCss` |
| Agregar variable global nueva | `ScribanTemplateEngine.cs` → método `BuildContext()` |
| Agregar helper Handlebars | `ScribanTemplateEngine.cs` → constructor, `_handlebars.RegisterHelper(...)` |
| Agregar campo al enmascaramiento doble ciego | `ScribanTemplateEngine.cs` → `fieldsToMask` |
| Nueva plantilla desde cero | `PUT /api/admin/templates/{nuevo_code}` o agregar en `DocumentTemplateSeed.cs` |
| Nuevo campo en ProyectoDto | `ProyectoDto.cs` → agregar prop → actualizar HTML en BD |
| Cambiar renderizador PDF (ej: a PuppeteerSharp) | Reescribir solo `ITextHtmlPdfRenderer.cs` |
| Integrar firma FirmaEC real | Crear `FirmaEcService.cs` + paso 4.5 en `DocumentEngine.cs` |

---

## 5. Auditoría Forense y Snapshots (V3 Resiliente)

Para garantizar que DIITRA sea resistente a auditorías externas (CACES) incluso años después de que los datos del proyecto hayan cambiado, el motor implementa un sistema de **Snapshots de Datos**:

- **Persistencia de Insumos**: En cada generación de PDF, se guarda un snapshot JSON completo en el `DocumentAuditEntry`.
- **Reconstrucción Histórica**: Si se cuestiona un acta de hace 3 años, el administrador puede ver exactamente qué datos se inyectaron en la plantilla, independientemente de si el proyecto fue editado o eliminado posteriormente.
- **Sello de Integridad**: El snapshot se vincula al Hash SHA-256 del archivo físico, creando un vínculo inquebrantable entre el documento y sus datos de origen.

Este sistema cumple con el principio de **No Repudio** exigido para documentos legales en el marco de la LOPDP y las regulaciones académicas vigentes.
