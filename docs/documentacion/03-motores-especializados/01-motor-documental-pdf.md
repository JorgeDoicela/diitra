# Motor de Generación Documental PDF e Integridad Forense

## 1. Visión General del Motor

El motor documental de DIITRA (`DocumentEngine`) es el subsistema de infraestructura encargado de transformar estructuras de datos dinámicas en formato JSON y plantillas HTML en documentos PDF de validez legal e institucional.

El componente es agnóstico a los módulos de negocio. Opera mediante la inyección de metadatos en plantillas declarativas, aplicando inyectores de cumplimiento normativo, marcas de agua, sellos de tiempo, firmas criptográficas y códigos QR de verificación pública.

---

## 2. Pipeline de Compilación Documental

La generación de un documento PDF sigue una secuencia de 5 etapas coordinadas por `DocumentEngine`:

```mermaid
graph TD
    Req[Petición DocumentRequest] --> DataOrchestrator[DocumentDataOrchestrator]
    DataOrchestrator -->|Ensambla DTO Maestro| TemplateRegistry[DocumentTemplateRegistry]
    TemplateRegistry -->|Obtiene HTML + JSON Schema| TemplateEngine[Handlebars / Scriban Engine]
    TemplateEngine -->|HTML Evaluado| LegalInjector[LegalComplianceInjector]
    LegalInjector -->|HTML + Encabezados + Pie LOPDP + QR| PDFRenderer[ITextHtmlPdfRenderer]
    PDFRenderer -->|PDF Renderizado| PDFMerger[PdfMergerService]
    PDFMerger -->|Anexos Unificados| AuditRepo[DocumentAuditRepository]
    AuditRepo --> OutputPDF[PDF Final + Snapshot SHA-256]
```

### 2.1. Preparación de Datos (`DocumentDataOrchestrator`)
Resuelve la recopilación de información requerida para la plantilla mediante el patrón Strategy (`IDocumentDataProvider`). Obtiene los datos base de la entidad (proyecto, informe o resolución) y los combina con las secciones editadas en el módulo colaborativo CoWork (`inv_cowork_documentos`).

### 2.2. Evaluación de Plantillas (`HandlebarsTemplateEngine` / `Scriban`)
Sustituye variables, procesa bucles de iteración (ej. miembros del equipo o partidas presupuestarias) y evalúa expresiones condicionales en el marcado HTML de la plantilla seleccionada (`DocumentTemplate`).

### 2.3. Inyección de Cumplimiento Legal (`LegalComplianceInjector`)
Añade al HTML evaluado los elementos normativos requeridos por la institución:
* Encabezado institucional con logotipos oficializados.
* Pie de página con cláusula de protección de datos personales LOPDP.
* Marcadores de posición para firmas de responsabilidad.
* Código QR dinámico generado por la librería `QRCoder`.

### 2.4. Renderizado PDF (`ITextHtmlPdfRenderer`)
Convierte el marcado HTML5 y los estilos CSS2.1/CSS3 a un documento en formato PDF plano utilizando **iText 7** (módulo `pdfHTML`).

### 2.5. Ensamblado de Anexos y Auditoría (`PdfMergerService` / `DocumentAuditRepository`)
Combina el PDF principal con documentos adjuntos (anexos de proyectos o certificados) y registra la transacción en la bitácora `audit_logs` guardando la huella digital SHA-256.

---

## 3. Estructura del Congelamiento Forense (`data_snapshot_json`)

En el momento en que un documento es emitido o firmado, `DocumentEngine` genera una captura inmutable del estado exacto de los datos (`data_snapshot_json`) que se almacena en la tabla `document_instances`.

```json
{
  "instance_uuid": "3a9f1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "template_code": "PROYECTO_INVESTIGACION_BASE",
  "traceability_code": "ISTT-INV-2026-0042",
  "data_snapshot": {
    "titulo": "Implementación de Nodos IoT en Agricultura",
    "director": {
      "nombres": "Juan Carlos",
      "apellidos": "Pérez Gómez",
      "cedula": "1712345678"
    },
    "presupuesto_total": 4500.00,
    "linea_investigacion": "Tecnologías de la Información"
  },
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "issued_at_utc": "2026-07-28T13:40:00Z"
}
```

Este snapshot asegura que variaciones posteriores en la base de datos no alteren la información contenida en el documento emitido en la fecha de corte.

---

## 4. Verificación Pública mediante Código QR

Cada documento generado incluye un código QR que apunta a un endpoint público de validación:

$$\text{URL de Validación} = \texttt{https://diitra.traversari.edu.ec/public/verify/}\text{traceability\_code}$$

### Proceso de Verificación
1. El auditor o tercero escanea el QR del documento impreso o digital.
2. El cliente público consulta el endpoint de verificación de `DocumentInstancesController`.
3. El servidor calcula el hash SHA-256 de la instancia guardada y lo contrasta con el código de trazabilidad.
4. Se presenta en pantalla el estado del documento, la fecha de emisión y los firmantes sin requerir inicio de sesión.
