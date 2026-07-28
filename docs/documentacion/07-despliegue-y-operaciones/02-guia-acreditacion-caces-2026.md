# Guía de Cumplimiento e Integridad Forense para Acreditación CACES 2026

## 1. Visión General del Marco Normativo

Esta guía especifica cómo los subsistemas de la plataforma DIITRA responden a los criterios de evaluación, transparencia, inmutabilidad y control de calidad institucional exigidos por el **Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES)** para los procesos de acreditación 2026 de Institutos Superiores Tecnológicos.

---

## 2. Matriz de Cumplimiento Técnico y Evidencias Auditables

```mermaid
graph TD
    CACESAudit[Auditoría Externa CACES 2026] --> Metric1[1. Trazabilidad e Inmutabilidad]
    CACESAudit --> Metric2[2. Máquina de Estados y State Locking]
    CACESAudit --> Metric3[3. Snapshots Forenses SHA-256]
    CACESAudit --> Metric4[4. Verificación Pública via QR]
    CACESAudit --> Metric5[5. Gobernanza LOPDP y Pares Ciegos]

    Metric1 --> AuditLog[Bitácora audit_logs Append-Only]
    Metric2 --> WFEngine[WorkflowEngineService Bloqueos]
    Metric3 --> SnapDB[data_snapshot_json en DocumentInstances]
    Metric4 --> QRNode[Endpoint Público /public/verify]
    Metric5 --> LopdpAnonym[PeerReviewPortal Anonymizer]
```

---

## 3. Desglose de Criterios de Evaluación CACES

### 3.1. Criterio 1: Trazabilidad Completa del Ciclo de Vida
* **Requerimiento CACES:** Demostrar el rastro inalterable de aprobación y revisión de cada proyecto de investigación.
* **Respuesta Técnica DIITRA:** La tabla `audit_logs` captura atómicamente la identidad del usuario, dirección IP, marca de tiempo UTC y las diferencias en JSON antes y después de cada cambio en la propuesta.

### 3.2. Criterio 2: Control de Transiciones y Congelamiento (*State Locking*)
* **Requerimiento CACES:** Garantizar que los proyectos aprobados no hayan sido modificados posteriormente por los docentes o administradores.
* **Respuesta Técnica DIITRA:** El `WorkflowEngineService` implementa bloqueos automáticos de edición al cambiar el proyecto a estado de evaluación o aprobación, rechazando cualquier intento de actualización HTTP sobre campos congelados.

### 3.3. Criterio 3: Resiliencia Forense mediante Snapshots SHA-256
* **Requerimiento CACES:** Garantizar que el contenido físico impreso coincida exactamente con la información aprobada en la fecha de emisión.
* **Respuesta Técnica DIITRA:** La tabla `document_instances` guarda el objeto `data_snapshot_json` congelado en el momento exacto de la emisión y calcula el hash de integridad **SHA-256** sobre el payload y el PDF renderizado por `iText 9`.

### 3.4. Criterio 4: Nodo de Verificación Pública de Autenticidad (QR)
* **Requerimiento CACES:** Permitir a los pares evaluadores del CACES validar la autenticidad de cualquier acta o resolución firmada sin requerir credenciales internas del sistema.
* **Respuesta Técnica DIITRA:** Cada PDF emitido lleva inyectado un código QR vectorial dinámico que redirige al endpoint público `/public/verify/{traceability_code}`, donde el servidor valida el hash SHA-256 y despliega los metadatos de aprobación en tiempo real.

### 3.5. Criterio 5: Imparcialidad y Gobernanza LOPDP
* **Requerimiento CACES:** Asegurar la objetividad en la evaluación de propuestas y el respeto a la protección de datos personales.
* **Respuesta Técnica DIITRA:** El `PeerReviewPortalService` ejecuta un filtro de anonimización completa (*Blind Mode*) removiendo nombres, correos e instituciones de los autores antes de entregar la propuesta a los pares evaluadores.
