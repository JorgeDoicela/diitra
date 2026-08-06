# Centro de Documentación Técnica - DIITRA

Este directorio constituye la fuente centralizada de conocimiento técnico y funcional de la plataforma **DIITRA** (*Departamento de Investigación e Innovación Traversari*).

---

## 1. Guía de Lectura según Perfil

| Perfil del Consultante | Documentos Prioritarios Recomendados |
| :--- | :--- |
| **Desarrollador Backend (.NET 8)** | [01-macro-arquitectura-clean-arch.md](./01-arquitectura/01-macro-arquitectura-clean-arch.md), [01-especificacion-api-rest.md](./02-backend-servicios/01-especificacion-api-rest.md), [02-autenticacion-sso-y-rbac.md](./02-backend-servicios/02-autenticacion-sso-y-rbac.md) |
| **Desarrollador Frontend (React)** | [01-arquitectura-react-vite.md](./05-frontend-web/01-arquitectura-react-vite.md), [02-componentes-ui-y-builder-shell.md](./05-frontend-web/02-componentes-ui-y-builder-shell.md), [03-integracion-api-y-resiliencia.md](./05-frontend-web/03-integracion-api-y-resiliencia.md) |
| **Ingeniero de Base de Datos / DBA** | [01-esquema-relacional-sigafi.md](./04-base-de-datos/01-esquema-relacional-sigafi.md), [02-catalogos-normativa-ecuador.md](./04-base-de-datos/02-catalogos-normativa-ecuador.md), [03-gobernanza-lopdp-y-auditoria.md](./02-backend-servicios/03-gobernanza-lopdp-y-auditoria.md) |
| **Auditor Externa / Par CACES** | [02-guia-acreditacion-caces-2026.md](./07-despliegue-y-operaciones/02-guia-acreditacion-caces-2026.md), [01-motor-documental-pdf.md](./03-motores-especializados/01-motor-documental-pdf.md), [04-motor-firma-digital-y-sellos.md](./03-motores-especializados/04-motor-firma-digital-y-sellos.md) |
| **Ingeniero de Operaciones / DevOps** | [01-instalacion-entorno-local.md](./07-despliegue-y-operaciones/01-instalacion-entorno-local.md) |

---

## 2. Mapa Completo de Secciones Mapeadas

### Sección 01: Arquitectura de Sistemas
* [01. Macro-Arquitectura del Sistema y Clean Architecture](./01-arquitectura/01-macro-arquitectura-clean-arch.md): Clean Architecture en .NET 8, diagramas C4 (Contexto y Contenedores) y stack técnico.
* [02. Micro-Arquitecturas Internas, Patrones y Motores Especializados](./01-arquitectura/02-micro-arquitecturas-patrones.md): Patrones *Metadata-Driven*, *Provider/Strategy*, *Snapshot Forensic SHA-256*, *State Machine* y *CRDT CoWork*.

### Sección 02: Backend y Servicios REST
* [01. Especificación de API REST y Enlace de Datos](./02-backend-servicios/01-especificacion-api-rest.md): Catálogo de los 23 controladores de la API, rutas HTTP y políticas de casing (`lower_snake_case` vs `camelCase` vs `PascalCase`).
* [02. Arquitectura de Autenticación, SSO y Control de Acceso (RBAC)](./02-backend-servicios/02-autenticacion-sso-y-rbac.md): Autenticación JWT Bearer, hashing BCrypt, SSO Microsoft 365 / Entra ID, Magic Links y permisos RBAC.
* [03. Gobernanza de Datos, Protección LOPDP y Bitácora de Auditoría](./02-backend-servicios/03-gobernanza-lopdp-y-auditoria.md): Cumplimiento LOPDP, derechos ARCO, bitácora inmutable `audit_logs` y Soft Delete.
* [04. Ciclo de Vida de Proyectos, Workflow y Seguimiento TRL](./02-backend-servicios/04-workflow-proyectos-y-trl.md): Transiciones de estados, *State Locking*, formulación asistida, equipos y niveles TRL 1-9.

### Sección 03: Motores Especializados
* [01. Motor de Generación Documental PDF e Integridad Forense](./03-motores-especializados/01-motor-documental-pdf.md): Pipeline `DocumentEngine`, plantillas Handlebars/Scriban, iText 9 y códigos QR.
* [02. Motor Colaborativo en Tiempo Real (CoWork)](./03-motores-especializados/02-motor-colaborativo-cowork.md): `CollaborationHub` SignalR, compresión GZip, sincronización Yjs CRDT y bloqueos de sección (`SectionBlockGuard`).
* [03. Motor de Evaluación por Pares Ciegos](./03-motores-especializados/03-motor-evaluacion-pares-ciegos.md): Evaluación *Double-Blind Peer Review*, anonimización de datos y rúbricas cuantitativas.
* [04. Motor de Firma Digital, Criptografía y Sellos](./03-motores-especializados/04-motor-firma-digital-y-sellos.md): Certificados PKCS#12, firmas criptográficas, sellos de tiempo UTC y marcado gráfico en PDF.
* [05. Motor de Notificaciones Multicanal](./03-motores-especializados/05-motor-notificaciones-multicanal.md): WebSockets in-app (`SignalRDriver`), notificaciones push VAPID (`PushDriver`) y correos HTML (`EmailMasterLayoutRenderer`).

### Sección 04: Base de Datos y Catálogos
* [01. Esquema Relacional de Base de Datos y Persistencia](./04-base-de-datos/01-esquema-relacional-sigafi.md): Modelo DER de MariaDB/MySQL en base `sigafi_es`, DbContext de EF Core, tablas e indexación.
* [02. Catálogos Institucionales y Normativa Ecuador](./04-base-de-datos/02-catalogos-normativa-ecuador.md): Árbol UNESCO, Plan Nacional de Desarrollo (PND), ODS ONU y catálogos SIGAFI.

### Sección 05: Frontend Web (React SPA)
* [01. Arquitectura Frontend Web (React SPA + Vite)](./05-frontend-web/01-arquitectura-react-vite.md): Estructura de carpetas `src/`, React Router, rutas protegidas y gestión de estado.
* [02. Componentes UI Especializados y Shell del Constructor (DIITRABuilder)](./05-frontend-web/02-componentes-ui-y-builder-shell.md): Shell (`DIITRABuilderShell`), `SectionBlockGuard`, `CollaborationSidebar` y modales de firma.
* [03. Integración con API, Resiliencia y Tolerancia a Discrepancias](./05-frontend-web/03-integracion-api-y-resiliencia.md): Cliente Axios, interceptores JWT, *Local Fallback Pattern* (`||`) y `ErrorBoundary`.
* [04. Guía de Extensibilidad y Creación de Nuevos Bloques Documentales](./05-frontend-web/04-creacion-y-extensibilidad-de-bloques.md): Guía de integración de bloques modulares (TypeScript, Catálogo, Lienzo A4, Workspace Yjs y Motor Handlebars PDF).

### Sección 06: Aplicación Móvil
* [01. Arquitectura de Aplicación Móvil Docente](./06-aplicacion-movil/01-arquitectura-movil-docente.md): Arquitectura de `diitra_mobile`, integración REST, almacenamiento seguro de tokens y escáner de códigos QR.

### Sección 07: Despliegue y Operaciones
* [01. Guía de Instalación y Configuración en Entorno Local](./07-despliegue-y-operaciones/01-instalacion-entorno-local.md): Requisitos de desarrollo (.NET 8, Node 18, MySQL 3306), scripts SQL iniciales y variables de entorno.
* [02. Guía de Cumplimiento e Integridad Forense para Acreditación CACES 2026](./07-despliegue-y-operaciones/02-guia-acreditacion-caces-2026.md): Matriz de evidencias técnicas para los indicadores de acreditación institucionales.
