# DIITRA - Departamento de Investigación e Innovación Traversari

Sistema de gestión del ciclo de vida de proyectos de investigación, desarrollo tecnológico e innovación en el Instituto Superior Tecnológico Traversari (ISTT). La plataforma administra la formulación, evaluación por pares ciegos, seguimiento de TRL 1-9, control presupuestario y generación documental con integridad forense bajo los criterios del marco de acreditación **CACES 2026**, el Reglamento de Régimen Académico (RRA) y la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.

---

## 1. Visión General de Arquitectura

La plataforma implementa un modelo desacoplado compuesto por un backend API RESTful en .NET 8.0 y un cliente web de página única (SPA) en React 18.

* **Backend API (`diitra_api`):** ASP.NET Core 8.0 estructurado bajo Clean Architecture (Domain, Application, Infrastructure, API).
* **Frontend Web (`diitra_web`):** React 18 SPA compilado con Vite, TypeScript y Axios.
* **Cliente Móvil (`diitra_mobile`):** Aplicación móvil para consulta docente y recepción de notificaciones.
* **Base de Datos (`sigafi_es`):** MariaDB 10.5+ / MySQL 8.0+ en el puerto local `3306`, mapeado vía Entity Framework Core 9.0 (`Pomelo.EntityFrameworkCore.MySql`).

---

## 2. Componentes y Motores del Sistema

1. **Motor Documental PDF (`DocumentEngine`):** Renderizado de plantillas HTML (`Handlebars.Net` / `Scriban`), marcas de agua y generación PDF con **iText 7 / pdfHTML**.
2. **Resiliencia Forense e Inmutabilidad:** Congelamiento de datos en punto de emisión (`data_snapshot_json`), hash de integridad **SHA-256** e inyección de códigos QR vectoriales para verificación pública sin requerir credenciales.
3. **Máquina de Estados y Bloqueo (*State Locking*):** Control del flujo de vida del proyecto con inhabilitación atómica de escrituras en estados avanzados.
4. **Motor Colaborativo en Tiempo Real (CoWork):** Sincronización de edición concurrente basada en **CRDT (Yjs)** sobre **SignalR WebSockets** con compresión GZip y bloqueo de secciones (`SectionBlockGuard`).
5. **Evaluación por Pares Ciegos:** Anonimización automática de propuestas (*Blind Mode*) para evaluación confidencial y rúbricas ponderadas cuantitativas.
6. **Firma Digital y Criptografía:** Verificación de certificados PKCS#12 / PFX (`BouncyCastle`), estampado gráfico de firmas de responsabilidad y sellos de tiempo UTC.
7. **Notificaciones Multicanal:** WebSockets in-app (`SignalRDriver`), notificaciones push VAPID (`PushDriver`) y correos transaccionales HTML (`EmailMasterLayoutRenderer`).

---

## 3. Estructura del Repositorio

```text
diitra/
├── backend/                  # Solución .NET 8.0 (diitra.slnx)
│   ├── diitra_api/           # Controladores REST (23), Middlewares y Swagger
│   ├── diitra_application/   # Casos de Uso, DTOs y FluentValidation
│   ├── diitra_domain/        # Entidades puras y Contratos de Dominio
│   ├── diitra_infrastructure/ # EF Core 9, Engines (PDF, CoWork, Auth, Signatures)
│   └── diitra_tests/         # Pruebas unitarias e integración
├── diitra_web/               # Cliente Web React 18 + Vite + TypeScript
├── diitra_mobile/            # Aplicación Móvil Docente
├── docs/
│   └── documentacion/        # Centro de Documentación Técnica (19 archivos / 7 secciones)
└── scripts/
    └── base_datos/           # Scripts SQL de inicialización y seeds de catálogos
```

---

## 4. Convenciones de Enlace de Datos (API-Frontend Binding)

* **Cuerpo de Peticiones (`[FromBody]`):** Payloads `POST`, `PUT` y `PATCH` transmiten claves JSON en **`lower_snake_case`**.
* **Query Parameters y Formularios (`[FromQuery]`, `[FromForm]`):** Parámetros de consulta y envíos `multipart/form-data` utilizan **`camelCase`**.
* **Metadatos Universales:** Las llamadas a `/documents/instances/{uuid}/metadata` procesan esquemas dinámicos utilizando **`PascalCase`**.
* **Tolerancia a Discrepancias (Local Fallback Pattern):** El frontend lee propiedades dinámicas utilizando operadores de coalescencia (`||`) para tolerar variaciones de casing:
  ```typescript
  const snapshotStr = response.data.data_snapshot_json || response.data.dataSnapshotJson || response.data.DataSnapshotJson;
  ```

---

## 5. Centro de Documentación Técnica

La especificación detallada del sistema se encuentra centralizada en la carpeta **[docs/documentacion/](./docs/documentacion/README.md)**.

Para consultar un área específica, acceda al módulo correspondiente:

* **[Sección 01: Arquitectura de Sistemas y Patrones](./docs/documentacion/01-arquitectura/01-macro-arquitectura-clean-arch.md)**
* **[Sección 02: Backend, APIs y Servicios REST](./docs/documentacion/02-backend-servicios/01-especificacion-api-rest.md)**
* **[Sección 03: Motores Especializados (PDF, CoWork, Firmas, Pares, Notificaciones)](./docs/documentacion/03-motores-especializados/01-motor-documental-pdf.md)**
* **[Sección 04: Base de Datos y Catálogos Normativos](./docs/documentacion/04-base-de-datos/01-esquema-relacional-sigafi.md)**
* **[Sección 05: Frontend Web (React SPA)](./docs/documentacion/05-frontend-web/01-arquitectura-react-vite.md)**
* **[Sección 06: Aplicación Móvil Docente](./docs/documentacion/06-aplicacion-movil/01-arquitectura-movil-docente.md)**
* **[Sección 07: Despliegue y Operaciones (Instalación y CACES 2026)](./docs/documentacion/07-despliegue-y-operaciones/01-instalacion-entorno-local.md)**

---

## 6. Instalación Rápida en Entorno Local

1. **Base de Datos:** Inicie MariaDB/MySQL en el puerto `3306` y ejecute los scripts de `scripts/base_datos/`.
2. **Backend:** En `backend/diitra_api`, ejecute `dotnet run`.
3. **Frontend:** En `diitra_web`, instale con `npm install` e inicie con `npm run dev`.

---

DIITRA Architecture | IST Traversari | Quito, Ecuador
