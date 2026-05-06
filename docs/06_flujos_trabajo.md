# Flujos y Diagramas Transaccionales (BPMN / Sequence)

En ecosistemas complejos, detallar textualmente no es suficiente. El sistema procesa los modelos de dominio según secuencias predefinidas de actor/validación.

## Sequence: Ejecución "Double Blind Peer Review"

El componente más crítico académicamente. Exige validación, seguridad asincrónica vía "Magic Token" y resolución de estados.

```mermaid
sequenceDiagram
    autonumber
    actor DR as Director
    participant GW as "API Gateway (.NET)"
    participant DB as "MariaDB/MySQL"
    actor RE as Revisor Externo
    
    rect rgb(200, 230, 240)
        Note over DR,DB: Fase 1: Asignación Ciega
        DR->>GW: Asignar(ProyectoID=12, RevisorID=8, Ciego=True)
        GW->>DB: Generar Scope Token temporal en inv_tokens_acceso
        GW-->>DR: 200 OK (Notificado)
    end
    
    rect rgb(240, 210, 200)
        Note over GW,RE: Fase 2: Distribución Mágica Integrada
        GW->>GW: Worker Envia Correo SMTP
        GW-->>RE: "Inviado a revisar - Clickeable /token?t=xyz"
    end
    
    rect rgb(210, 240, 200)
        Note over RE,DB: Fase 3: Evaluación Auth-less Dinámica
        RE->>GW: GET /ver-proyecto (Cookie Sessionless, HTTP Bearer temporal)
        GW->>DB: Validar Scope/Uso Token == Falso
        DB-->>GW: Result (Valido)
        GW-->>RE: Envía Matriz Rúbrica Anónima
        RE->>GW: POST /enviar-dictamen (Rúbricas cargadas)
        GW->>DB: Actualiza inv_revisiones. Invalida Token.
        GW-->>RE: 201 Created. Redirección a Home de agradecimiento.
    end
```

## Trazabilidad del Proyecto (Diagrama de Estados FSM)

Todo el avance burocrático de un *Proyecto de Innovación* puede resumirse en la máquina de estados gestionada y blindada por backend en su historia.

```mermaid
stateDiagram-v2
    [*] --> Borrador : "Docente crea"
    Borrador --> Enviado : "Docente postula"
    Enviado --> En_Revision : "Director envía a pares"
    En_Revision --> Aprobado : "Peers promedian >70%"
    En_Revision --> Rechazado : "Deficiente técnica"
    Aprobado --> En_Ejecucion : "Inicia cronograma oficial"
    En_Ejecucion --> Finalizado : "Sube firma y audita gastos finales"
    Rechazado --> [*]
    Finalizado --> [*]
```

Estas mutaciones se registran invariablemente en la tabla `inv_proyectos_historial` a manera de event-sourcing lite, previniendo alteraciones silenciadas por administradores o agentes intermedios.

---

## Sequence: Generación de Documento PDF (Motor DIITRA)

Flujo completo desde que un controlador solicita un PDF hasta que el usuario lo descarga.

```mermaid
sequenceDiagram
    autonumber
    actor USR as Usuario / Sistema
    participant CTRL as "Controller (.NET)"
    participant ENG as "DocumentEngine"
    participant DB as "doc_templates (MySQL)"
    participant HB as "Handlebars.Net"
    participant ITXT as "iText7 pdfHTML"
    participant AUDIT as "doc_audit_entries"

    rect rgb(200, 230, 240)
        Note over USR,CTRL: Solicitud de documento
        USR->>CTRL: POST /api/projects/generate-pdf { ProyectoDto }
        CTRL->>ENG: GenerateAsync(DocumentRequest { TemplateCode, Data })
    end

    rect rgb(240, 240, 200)
        Note over ENG,DB: Paso 1 — Carga plantilla
        ENG->>DB: SELECT HtmlContent WHERE Code='PROTOCOLO_INVESTIGACION' AND IsActive=1
        DB-->>ENG: plantilla HTML v2 (9 secciones)
    end

    rect rgb(220, 240, 220)
        Note over ENG,HB: Pasos 2-3 — Compliance + Render HTML
        ENG->>ENG: LegalComplianceInjector → inyecta pie LOPDP
        ENG->>HB: Compile(html) + Render(ProyectoDto serializado)
        HB-->>ENG: HTML final con datos del investigador
    end

    rect rgb(240, 220, 210)
        Note over ENG,ITXT: Paso 4 — Conversión PDF
        ENG->>ITXT: HtmlConverter.ConvertToPdf(htmlFinal)
        ITXT-->>ENG: byte[] PDF (A4, fuentes embebidas)
    end

    rect rgb(230, 210, 240)
        Note over ENG,AUDIT: Paso 5 — Auditoría LOPDP
        ENG->>AUDIT: INSERT (TraceabilityCode, TemplateCode, Version, GeneratedBy, GeneratedAt)
        AUDIT-->>ENG: OK
    end

    ENG-->>CTRL: DocumentResult { PdfBytes, FileName, TraceabilityCode }
    CTRL-->>USR: 200 OK · Content-Type: application/pdf
```

## Flujo: Actualización de Plantilla sin Redespliegue

```mermaid
sequenceDiagram
    actor ADM as Administrador
    participant UI as "Panel Admin (futuro)"
    participant API as "PUT /api/admin/templates/{code}"
    participant DB as "doc_templates (MySQL)"

    ADM->>UI: Edita HTML del formato en editor web
    UI->>API: { htmlContent: "...", updatedBy: "admin@ist.edu" }
    API->>DB: UPDATE doc_templates SET HtmlContent=?, Version=Version+1, UpdatedAt=NOW()
    DB-->>API: OK
    API-->>ADM: "Plantilla actualizada a v3"
    Note over ADM,DB: El próximo PDF generado usará el formato nuevo instantáneamente
```
