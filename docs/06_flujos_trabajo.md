# Flujos y Diagramas Transaccionales (BPMN / Sequence)

En ecosistemas complejos, detallar textualmente no es suficiente. El sistema procesa los modelos de dominio según secuencias predefinidas de actor/validación.

## Sequence: Ejecución "Double Blind Peer Review"

El componente más crítico académicamente. Exige validación, seguridad asincrónica vía "Magic Token" y resolución de estados.

```mermaid
sequenceDiagram
    autonumber
    actor DR as Director
    participant GW as API Gateway (.NET)
    participant DB as MariaDB/MySQL
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
