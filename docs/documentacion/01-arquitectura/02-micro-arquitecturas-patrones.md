# Micro-Arquitecturas Internas, Patrones y Motores Especializados

## 1. Visión General

La plataforma DIITRA integra en su capa de infraestructura y dominio patrones y motores especializados. Estos motores atienden el cumplimiento de normativas de acreditación (CACES 2026), resiliencia forense, protección de datos (LOPDP) y colaboración distribuida en tiempo real.

---

## 2. Metadata-Driven Architecture (Arquitectura Guiada por Metadatos)

El subsistema documental de DIITRA opera de forma agnóstica respecto a las entidades de negocio. En lugar de codificar plantillas rígidas en C#, el motor procesa estructuras dinámicas en formato JSON (`JsonElement`).

```mermaid
graph LR
    Entity[Entidad de Negocio\nProyectos / Informes / Resoluciones] --> Orchestrator[DocumentDataOrchestrator]
    Orchestrator -->|Genera Master JSON Payload| TemplateEngine[Handlebars / Scriban Template Engine]
    Registry[DocumentTemplateRegistry\nHTML Templates + Schema JSON] --> TemplateEngine
    TemplateEngine -->|HTML Enriquecido| LegalInjector[LegalComplianceInjector\nHeaders + Signatures + QR]
    LegalInjector -->|HTML Final| Renderer[ITextHtmlPdfRenderer\niText 9 Engine]
    Renderer --> PDF[Documento PDF Emitido]
```

### Componentes Clave
* **`DocumentTemplateRegistry`:** Registro centralizado de plantillas HTML y esquemas de metadatos.
* **`HandlebarsTemplateEngine` / `Scriban`:** Motores de evaluación que inyectan variables, condicionales y listas iterativas en el marcado HTML de la plantilla.
* **Resiliencia y Escalabilidad:** El motor no requiere modificaciones de código C# para incorporar nuevos formatos documentales institucionales; basta con registrar la nueva plantilla HTML y su contrato de metadatos.

---

## 3. Provider / Strategy Pattern Architecture (Desacoplamiento de Datos)

Para resolver el acoplamiento de datos, el sistema implementa el patrón **Strategy** mediante la interfaz `IDocumentDataProvider`.

```mermaid
classDiagram
    class IDocumentDataProvider {
        <<interface>>
        +CanHandle(string entityType) bool
        +GetDocumentDataAsync(string entityUuid, CancellationToken ct) Task~object~
    }

    class DocumentDataOrchestrator {
        -DiitraContext _db
        -IEnumerable~IDocumentDataProvider~ _providers
        +PrepareRequestAsync(string documentInstanceUuid, string requestedBy) Task~DocumentRequest~
    }

    class ProyectoDataProvider {
        +CanHandle("PROYECTO") bool
        +GetDocumentDataAsync()
    }

    class InformeAvanceDataProvider {
        +CanHandle("INFORME_AVANCE") bool
        +GetDocumentDataAsync()
    }

    IDocumentDataProvider <|.. ProyectoDataProvider
    IDocumentDataProvider <|.. InformeAvanceDataProvider
    DocumentDataOrchestrator --> IDocumentDataProvider
```

### Principio de Funcionamiento
1. El `DocumentDataOrchestrator` recibe una petición de emisión documental identificada por la instancia (`documentInstanceUuid`).
2. Identifica el tipo de entidad origen (`PROYECTO`, `INFORME_AVANCE`, `RESOLUCION`).
3. Selecciona el proveedor adecuado en tiempo de ejecución (`_providers.FirstOrDefault(p => p.CanHandle(entityType))`).
4. Ensambla los datos base con el contenido colaborativo en vivo procedente del módulo CoWork, devolviendo un payload unificado (`DocumentRequest`).

---

## 4. Snapshot Forensic & Cryptographic Verification Architecture

Para responder a auditorías externas del CACES, DIITRA implementa una estrategia de resiliencia forense basada en tres capas de seguridad criptográfica:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend / Usuario
    participant Engine as DocumentEngine
    participant Storage as Base de Datos / Storage
    participant PublicNode as Nodo de Verificación Publica (QR)

    Client->>Engine: Solicitar emisión / firma final del documento
    Engine->>Engine: Capturar congelamiento JSON (data_snapshot_json)
    Engine->>Engine: Calcular Hash SHA-256 sobre el snapshot y PDF
    Engine->>Engine: Inyectar sello de tiempo UTC y firma criptografica
    Engine->>Engine: Generar QR dinámico vectorial (QRCoder)
    Engine->>Storage: Guardar registro inmutable en DocumentInstances & audit_logs
    Engine-->>Client: Devolver PDF final compilado con QR inyectado

    Note over PublicNode: Proceso de Auditoria Externa CACES
    Auditor->>PublicNode: Escanear QR dinámico (sin credenciales)
    PublicNode->>Storage: Validar Hash SHA-256 contra snapshot inmutable
    Storage-->>PublicNode: Confirmar autenticidad e integridad del documento físico/digital
```

### Elementos de Seguridad Forense
* **Inmutabilidad de Datos (`data_snapshot_json`):** Aunque los datos del proyecto varíen en el futuro (ej. cambio de equipo o reestructuración de presupuesto), el documento emitido conserva el snapshot exacto de la fecha de emisión.
* **Firma Criptográfica y Sellado (`SignatureStamper`):** Inyección de la firma de responsabilidad del docente o autoridad y sello de tiempo UTC.
* **Verificación Pública mediante QR:** Permite a terceros validar el documento sin requerir autenticación en el sistema.

---

## 5. State Machine Engine & State Locking (Máquina de Estados)

El ciclo de vida de los proyectos de investigación se administra a través del `WorkflowEngineService`. Las transiciones entre estados están sujetas a reglas de validación.

$$\text{Borrador} \xrightarrow[\text{Técnica}]{\text{Validación}} \text{Evaluación por Pares} \xrightarrow[\text{Comité}]{\text{Aprobación}} \text{Ejecución (TRL 1-9)} \xrightarrow[\text{Final}]{\text{Informe}} \text{Cierre}$$

### Mecanismo de State Locking
Cuando un proyecto avanza a etapas de evaluación por pares o aprobación final, el orquestador activa un bloqueo de escritura (*State Locking*). Las peticiones HTTP que intenten modificar campos del formulario principal durante estos estados son rechazadas por los controladores y servicios de infraestructura.

---

## 6. CRDT Realtime Collaboration Architecture (CoWork Engine)

Para permitir que múltiples docentes investigadores redacten secciones del proyecto de forma concurrente, el sistema utiliza una arquitectura basada en **CRDT (Conflict-free Replicated Data Types)** mediante **Yjs** y **WebSockets**.

```mermaid
graph TD
    UserA["Docente A (Investigador Principal)\nReact SPA"]
    UserB["Docente B (Co-Investigador)\nReact SPA"]

    subgraph SignalRHub [CollaborationHub Backend .NET]
        WsGateway["WebSocket Gateway / SignalR"]
        GZipFilter["Compresor / Descompresor GZip"]
        LockManager["Section Block Guard / Lock Manager"]
    end

    subgraph PersistenciaCoWork [Persistencia Colaborativa]
        InvCoworkDB[("Tabla 'inv_cowork_documentos'\nContenido HTML por Sección")]
    end

    UserA -->|Modificación de Sección A / Sync Yjs| WsGateway
    UserB -->|Modificación de Sección B / Sync Yjs| WsGateway

    WsGateway --> GZipFilter
    GZipFilter --> LockManager
    LockManager -->|Persistencia Atómica| InvCoworkDB
```

### Características Técnicas
* **Compresión GZip (`GZipHelper`):** Los paquetes de actualización de estado enviados por los clientes se comprimen mediante GZip antes de ser retransmitidos al Hub de SignalR, optimizando el uso de ancho de banda.
* **Bloqueo Granular de Secciones (`SectionBlockGuard`):** Bloquea secciones específicas que están siendo editadas activamente por otro usuario para evitar sobrescrituras.

---

## 7. Privacy & Anonymization Architecture (LOPDP & Pares Ciegos)

Para cumplir la Ley Orgánica de Protección de Datos Personales (LOPDP) y mantener la imparcialidad en evaluaciones académicas, el sistema implementa una capa de anonimización.

```mermaid
graph TD
    Request[Petición de Evaluación / Consulta Documental] --> Router[PeerReviewPortalService / LopdpService]
    Router --> CheckMode{¿Es Blind Mode o Auditoría LOPDP?}

    CheckMode -->|Sí: Evaluación Par Ciego| Anonymizer[Anonimizador Dinámico]
    Anonymizer -->|Remueve nombres, correos, adscripciones| NeutralPayload[Payload Anonimizado]

    CheckMode -->|Sí: Solicitud Derecho ARCO| ARCOHandler[Gestor de Derechos ARCO]
    ARCOHandler -->|Anonimización permanentemente registrada| AuditDB[Bitácora de Auditoría LOPDP]

    CheckMode -->|No: Acceso Administrador| FullPayload[Payload Completo con Credenciales]
```

### Modos de Anonimización
1. **Blind Mode (Evaluación por Pares Ciegos):** El `PeerReviewPortalService` remueve automáticamente los nombres de los autores, filiaciones institucionales y correos electrónicos de la propuesta antes de enviarla a los evaluadores.
2. **Cumplimiento LOPDP (`LopdpService`):** Procesa solicitudes de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), gestionando consentimientos informados y anonimización de datos en la base de datos de auditoría.
