# Gobernanza y Modelado de la Base de Datos

El sistema de persistencia de DIITRA utiliza un modelo relacional optimizado para MariaDB/MySQL. El diseño prioriza la integridad de los datos, el cumplimiento de la LOPDP y la trazabilidad histórica de los procesos de investigación.

## Arquitectura de Persistencia

La estrategia de datos se fundamenta en la segregación lógica y la inmutabilidad de los registros críticos.

### Segregación de Dominio (Prefijo inv_)
Para evitar conflictos con sistemas preexistentes (SIGAFI), todas las tablas pertenecientes al módulo de investigación están identificadas con el prefijo `inv_`. Esto permite una administración independiente de los esquemas y facilita las operaciones de mantenimiento sin afectar el núcleo institucional.

### Estrategia de Inmutabilidad
El sistema implementa una política de eliminación lógica (Soft Delete) mediante la columna `activo`. Los registros de auditoría y trazabilidad operan bajo un modelo de escritura única (Append-Only), impidiendo la alteración de la historia transaccional del sistema.

## Componentes Nucleares del Esquema

### Motor de Flujos y Estados (inv_config_workflow)
Tabla de configuración dinámica que define las transiciones permitidas entre estados. Permite la adaptabilidad del sistema a cambios normativos sin requerir modificaciones en el código fuente.

### Auditoría Forense (inv_document_audit)
Almacena el registro histórico de cada documento emitido. Incluye el código de trazabilidad, el hash de integridad SHA-256 y el snapshot JSON de los datos de origen. Este componente es vital para la resiliencia del sistema ante auditorías del CACES.

### CoWork Engine (inv_cowork_*)
Tablas destinadas a la persistencia del estado binario de documentos colaborativos (Yjs). Garantizan la consistencia de los datos en sesiones concurrentes y la recuperación del historial de cambios.

## Estándares de Datos

1. **UUIDs**: Se utiliza el estándar UUID v4 para la identificación pública de entidades, mitigando ataques de enumeración y asegurando la portabilidad de los datos.
2. **Charset y Collation**: Configurado en `utf8mb4_unicode_ci` para asegurar el soporte completo de caracteres y la consistencia en las búsquedas.
3. **Relaciones**: Integridad referencial estricta mediante claves foráneas (FK) con políticas de eliminación controladas (Set Null o Cascade según el contexto).

## Gestión de Snapshots Forenses

En el marco de la acreditación 2026, la columna `data_snapshot_json` dentro de la tabla de auditoría permite capturar el estado exacto de la información en el momento de la generación de un documento. Esto asegura la capacidad de reconstrucción histórica independientemente de ediciones posteriores en los registros maestros del proyecto.
