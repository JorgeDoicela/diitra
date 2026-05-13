# DIITRA CoWork Engine: Colaboración en Tiempo Real

El motor DIITRA CoWork permite la edición concurrente de protocolos de investigación, garantizando la consistencia de los datos y la ausencia de conflictos entre múltiples usuarios.

## Tecnología de Resolución de Conflictos (CRDTs)

El sistema utiliza Conflict-free Replicated Data Types (CRDTs) mediante la librería Yjs para gestionar la edición simultánea:

- **Fusión Automática**: Los cambios concurrentes se integran de forma matemática, eliminando la necesidad de bloqueos de archivos.
- **Eficiencia de Red**: Transmisión optimizada de deltas de texto, minimizando el consumo de ancho de banda.

## Infraestructura de Comunicación (SignalR)

La sincronización entre clientes y servidor se realiza mediante SignalR sobre WebSockets:

- **Baja Latencia**: Actualización instantánea de los cambios y visualización de la presencia de otros investigadores.
- **Gestión de Sesiones**: Aislamiento de las áreas de trabajo para asegurar que la edición en una sección del documento no afecte a las demás.

## Gestión de Presencia y Privacidad

El motor de colaboración incluye mecanismos de control de presencia:

- **Seguimiento de Cursores**: Identificación visual de los colaboradores en el documento.
- **Anonimización en Revisión**: Capacidad de ocultar la identidad de los editores durante procesos de revisión por pares (Peer Review) para asegurar la integridad científica.

## Persistencia Colaborativa

El estado de los documentos colaborativos se almacena de forma binaria en la base de datos, permitiendo la recuperación del estado de edición y la persistencia de las sesiones a largo plazo.
