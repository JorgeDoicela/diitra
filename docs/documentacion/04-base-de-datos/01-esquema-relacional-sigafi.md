# Esquema Relacional de Base de Datos y Persistencia

## 1. Visión General del Modelo de Datos

La capa de persistencia de DIITRA utiliza el motor de base de datos **MariaDB 10.5+ / MySQL 8.0+** sobre el esquema de base de datos **`sigafi_es`** (expuesto en el puerto por defecto `3307`).

El mapeo objeto-relacional (ORM) es administrado por **Entity Framework Core 9.0** a través del conector `Pomelo.EntityFrameworkCore.MySql`. La base de datos almacena las entidades del dominio de investigación, la estructura de usuarios y permisos, el motor documental, la bitácora de auditoría inmutable y las tablas de sincronización colaborativa.

---

## 2. Diagrama Entidad-Relación (DER Principal)

```mermaid
erDiagram
    USERS ||--o{ PROJECT_TEAM : pertenece
    USERS ||--o{ AUDIT_LOGS : genera
    USERS ||--o{ DOCUMENT_SIGNATURES : firma

    PROJECTS ||--|{ PROJECT_TEAM : incluye
    PROJECTS ||--o{ DOCUMENT_INSTANCES : vincula
    PROJECTS ||--o{ INFORMES_AVANCE : genera
    PROJECTS ||--o{ RESEARCH_PRODUCTS : produce

    DOCUMENT_TEMPLATES ||--o{ DOCUMENT_INSTANCES : instacia
    DOCUMENT_INSTANCES ||--o{ COWORK_DOCUMENTOS : sincroniza
    DOCUMENT_INSTANCES ||--o{ DOCUMENT_SIGNATURES : contiene

    USERS {
        string uuid PK
        string email
        string password_hash
        string names
        string surnames
        bool is_active
    }

    PROJECTS {
        string uuid PK
        string code
        string title
        string state
        decimal total_budget
        int trl_level
        datetime created_at_utc
    }

    DOCUMENT_INSTANCES {
        string uuid PK
        string template_code FK
        string entity_type
        string entity_uuid
        longtext data_snapshot_json
        string sha256_hash
        string state
    }

    COWORK_DOCUMENTOS {
        bigint id PK
        string entidad_uuid FK
        string campo_nombre
        longtext content_html
        datetime updated_at_utc
    }
```

---

## 3. Tablas Clave del Sistema

### 3.1. Dominio de Investigación y Proyectos

* **`inv_proyectos` (`Projects`):** Almacena la entidad principal de las propuestas de investigación (código, título, resumen, línea de investigación, presupuesto total, estado del workflow y nivel TRL).
* **`inv_proyecto_miembros` (`ProjectTeam`):** Relación N:M entre usuarios y proyectos, especificando el rol dentro del equipo (Director, Co-Investigador, Ayudante), porcentaje de dedicación horaria y estado de adscripción.
* **`inv_proyecto_cambios_equipo` (`ProjectTeamChange`):** Registro de solicitudes formales de adscripción o salida de miembros durante la ejecución del proyecto.
* **`inv_informes_avance` (`InformesAvance`):** Registro de informes periódicos de cumplimiento técnico/financiero y entregables.

### 3.2. Dominio Documental y Forense

* **`document_templates` (`DocumentTemplate`):** Registro de plantillas de documentos (código de plantilla, versión, marcado HTML base, esquema de metadatos JSON y estado de activación).
* **`document_instances` (`DocumentInstance`):** Registro de cada documento instanciado (UUID, tipo de entidad vinculada, snapshot `data_snapshot_json`, hash SHA-256, código de trazabilidad QR y estado).
* **`inv_cowork_documentos` (`InvCoworkDocumento`):** Tabla de edición colaborativa que guarda el marcado HTML resultante de las secciones editadas en tiempo real mediante Yjs.
* **`document_signatures` (`DocumentSignature`):** Bitácora de firmas electrónicas aplicadas a una instancia documental (firmante, rol, hash SHA-256 y timestamp UTC).

### 3.3. Dominio de Seguridad y Gobernanza

* **`users` (`User`):** Catálogo de usuarios institucionales (UUID, cédula, nombres, apellidos, correo institucional, password_hash BCrypt).
* **`roles` / `permissions` / `role_permissions`:** Estructura RBAC para asignación de roles y permisos de grano fino.
* **`audit_logs` (`AuditLog`):** Tabla inmutable que registra cada operación `INSERT`, `UPDATE` o `DELETE` con snapshots en JSON del estado anterior y posterior de los datos.
* **`lopdp_consents` / `lopdp_arco_requests`:** Registro de consentimientos informados y atención a solicitudes de derechos ARCO.

---

## 4. Convenciones de Columna y Estrategia de Indexación

1. **Identificadores Únicos (UUID v4):** Las entidades principales de negocio utilizan identificadores `VARCHAR(36)` generados en la capa de aplicación (`Guid.NewGuid()`), evitando el uso de claves secuenciales expuestas en la API.
2. **Columnas de Auditoría Estándar:**
   * `created_at_utc DATETIME NOT NULL`: Fecha de creación en formato UTC.
   * `updated_at_utc DATETIME NULL`: Fecha de última modificación.
   * `is_deleted BOOLEAN NOT NULL DEFAULT FALSE`: Indicador de borrado lógico (Soft Delete).
   * `deleted_at_utc DATETIME NULL`: Fecha de eliminación lógica.
3. **Estrategia de Índices:**
   * Índices B-Tree únicos sobre `uuid`, `code` y `email`.
   * Índices compuestos en `document_instances(entity_uuid, entity_type)` para optimizar las consultas del orquestador documental.
   * Índices en `audit_logs(entity_uuid, timestamp_utc)` para la generación de trazas de auditoría.
