# Flujos de Trabajo y Diagramas Transaccionales

La lógica de DIITRA se describe mediante diagramas de secuencia que detallan la interacción entre los actores, los servicios de aplicación y la capa de persistencia.

## Proceso de Revisión por Pares (Double Blind Peer Review)

Este proceso garantiza la imparcialidad académica mediante la anonimización de datos y el uso de tokens de acceso temporales.

```mermaid
sequenceDiagram
    autonumber
    actor DR as Director de Investigación
    participant GW as API Gateway (.NET)
    participant DB as MariaDB/MySQL
    actor RE as Revisor Externo
    
    DR->>GW: Asignar Revisor (Ciego=True)
    GW->>DB: Generar Token en inv_tokens_acceso
    GW->>RE: Enviar Notificación con Enlace Seguro
    
    RE->>GW: Acceder a Evaluación (Bearer Token)
    GW->>DB: Validar Integridad de Token
    DB-->>GW: Token Válido
    GW-->>RE: Proveer Documentación Anonimizada
    RE->>GW: Registrar Dictamen (Rúbricas)
    GW->>DB: Persistir Evaluación e Invalidar Token
```

## Motor de Estados Dinámico (V3)

DIITRA implementa un motor de flujos basado en reglas configurables en base de datos, lo que permite modificar el ciclo de vida de los proyectos sin intervenciones en el código.

1. **Configuración de Transiciones**: Las reglas se definen en la tabla `inv_config_workflow`, especificando los estados de origen, destino y los roles autorizados.
2. **Encadenamiento SHA-256**: Cada transición genera un registro en `inv_trazabilidad_proyectos`. El sistema calcula un hash que vincula la entrada actual con la anterior, asegurando una cadena de custodia inalterable.
3. **Bloqueo de Integridad**: Al alcanzar estados críticos (ej. Aprobado), el motor activa señales de solo lectura en los orquestadores de datos.

## Generación de Documentación Oficial y Snapshots

El flujo de generación de documentos PDF incorpora la captura de evidencias forenses para auditorías regulatorias.

```mermaid
sequenceDiagram
    autonumber
    actor USR as Sistema/Usuario
    participant ENG as DocumentEngine
    participant DB as inv_document_templates
    participant ITXT as iText9 Renderer
    participant AUDIT as inv_document_audit

    USR->>ENG: Solicitar Generación (TemplateCode, Data)
    ENG->>DB: Recuperar Plantilla HTML
    DB-->>ENG: HTML v.X
    ENG->>ENG: Inyectar Datos y Cláusulas Legales
    ENG->>ITXT: Renderizar a PDF Binario
    ITXT-->>ENG: Archivo PDF
    ENG->>ENG: Calcular Hash SHA-256
    ENG->>AUDIT: Registrar Auditoría + Snapshot JSON
    AUDIT-->>ENG: Registro Confirmado
    ENG-->>USR: Proveer Documento con Sello de Integridad
```

Este proceso asegura que cualquier documento emitido por la institución pueda ser validado años después mediante la comparación del archivo físico con el snapshot de datos almacenado en la base de datos de integridad.
