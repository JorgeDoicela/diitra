-- ============================================================
-- SCRIPT DE MANTENIMIENTO: POBLADO DE UUIDS Y VERSIONES
-- Ejecutar este script si ya existen datos en las tablas 'inv_'
-- ============================================================

SET SQL_SAFE_UPDATES = 0;

-- 1. Poblado de inv_lineas_investigacion
UPDATE inv_lineas_investigacion SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_lineas_investigacion SET version = 1 WHERE version IS NULL OR version = 0;

-- 2. Poblado de inv_convocatorias
UPDATE inv_convocatorias SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_convocatorias SET version = 1 WHERE version IS NULL OR version = 0;

-- 3. Poblado de inv_proyectos
UPDATE inv_proyectos SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_proyectos SET version = 1 WHERE version IS NULL OR version = 0;

-- 4. Poblado de inv_proyectos_profesores
UPDATE inv_proyectos_profesores SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_proyectos_profesores SET version = 1 WHERE version IS NULL OR version = 0;

-- 5. Poblado de inv_proyectos_alumnos
UPDATE inv_proyectos_alumnos SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_proyectos_alumnos SET version = 1 WHERE version IS NULL OR version = 0;

-- 6. Poblado de inv_notificaciones
UPDATE inv_notificaciones SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_notificaciones SET version = 1 WHERE version IS NULL OR version = 0;

-- 7. Poblado de inv_revisiones
UPDATE inv_revisiones SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_revisiones SET version = 1 WHERE version IS NULL OR version = 0;

-- 8. Poblado de inv_revisores_externos
UPDATE inv_revisores_externos SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_revisores_externos SET version = 1 WHERE version IS NULL OR version = 0;

-- 9. Poblado de inv_institutos
UPDATE inv_institutos SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_institutos SET version = 1 WHERE version IS NULL OR version = 0;

-- 10. Poblado de inv_rubricas
UPDATE inv_rubricas SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_rubricas SET version = 1 WHERE version IS NULL OR version = 0;

-- 11. Poblado de inv_revisiones_detalle
UPDATE inv_revisiones_detalle SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_revisiones_detalle SET version = 1 WHERE version IS NULL OR version = 0;

-- 12. Poblado de inv_tokens_acceso
UPDATE inv_tokens_acceso SET uuid = (SELECT UUID()) WHERE uuid IS NULL OR uuid = '';
UPDATE inv_tokens_acceso SET version = 1 WHERE version IS NULL OR version = 0;

-- 13. GENERACIÓN DE METADATA PARA USUARIOS EXISTENTES
-- Crea un registro de metadata con UUID para cada usuario que no lo tenga
INSERT INTO inv_usuarios_metadata (uuid, idUsuario, version)
SELECT UUID(), idUsuario, 1
FROM usuarios
WHERE idUsuario NOT IN (SELECT idUsuario FROM inv_usuarios_metadata);

SET SQL_SAFE_UPDATES = 1;

SELECT 'Mantenimiento completado: Todos los registros tienen UUID y Version.' AS Resultado;
