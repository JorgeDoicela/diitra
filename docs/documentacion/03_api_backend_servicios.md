# Especificación Técnica de Backend (.NET 8.0)

La capa de servicios de DIITRA está desarrollada sobre .NET 8.0 LTS, utilizando un diseño de Monolito Modular. El sistema está optimizado para garantizar la fiabilidad transaccional y la seguridad de los datos institucionales.

## Seguridad y Control de Acceso

El sistema implementa mecanismos avanzados de protección basados en estándares OWASP:

1. **Control de Acceso basado en Permisos (PBAC)**: La autorización se gestiona a nivel de permisos específicos vinculados a los perfiles de usuario, evitando la rigidez del modelo basado únicamente en roles.
2. **Blindaje de Sesión**: La autenticación JWT se maneja mediante cookies seguras con atributos HttpOnly y SameSite=Strict para mitigar vectores de ataque como XSS y CSRF.
3. **Validación de Integridad en Orquestadores**: El orquestador de proyectos (`ProjectOrchestrator`) valida de forma mandatoria la propiedad de los recursos y el estado del proyecto antes de permitir cualquier operación de persistencia.

## Arquitectura de Servicios e Inyección de Dependencias

Se utiliza un contenedor de dependencias nativo para gestionar el ciclo de vida de los servicios en modo Scoped, asegurando el aislamiento transaccional por cada solicitud:

- **IProjectOrchestrator**: Encargado de la sincronización atómica del formulario de proyectos y la validación de reglas de negocio.
- **IWorkflowEngineService**: Motor encargado de gestionar las transiciones de estado de forma inmutable.
- **IDocumentEngine**: Motor de generación de documentos PDF basado en plantillas dinámicas e iText9.
- **IAuthService**: Proveedor de servicios de identidad y validación de permisos.

## Persistencia y Transaccionalidad

El Backend utiliza Entity Framework Core como proveedor de ORM. Las operaciones críticas están protegidas por transacciones de base de datos explicitas, garantizando que los cambios en el proyecto, su presupuesto y su cronograma se apliquen de forma atómica.

## Gestión de Flujos Inmutables

La trazabilidad de los proyectos se asegura mediante el registro sistemático de cada cambio de estado. Este proceso incluye el cálculo de un hash de integridad SHA-256 que encadena la transición actual con la anterior, creando una estructura de auditoría inalterable que cumple con las exigencias del CACES y la normativa nacional.

## Comunicación en Tiempo Real

Mediante el uso de SignalR y WebSockets, el sistema mantiene una conexión persistente con los clientes para la gestión de la edición colaborativa y la actualización de indicadores de progreso sin requerir recargas de página, optimizando la experiencia de usuario y la eficiencia del servidor.
