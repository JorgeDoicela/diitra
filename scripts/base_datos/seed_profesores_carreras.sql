-- =====================================================================
-- SCRIPT DE POBLADO DINÁMICO RESILIENTE: profesores_carreras_periodos
-- Propósito: Autodetectar el periodo activo actual del sistema (usando la
--            misma lógica y prioridades del backend) y vincular 
--            automáticamente a todos los docentes con horas de 
--            investigación en dicho periodo.
-- =====================================================================

USE sigafi_es;

-- Deshabilitar temporalmente llaves foráneas para evitar conflictos de integridad
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Descubrir y almacenar el periodo activo exacto usando el algoritmo prioritario del backend:
--    a. Marcado explícitamente como periodo activo del instituto (periodoactivoinstituto = 1)
--    b. Marcado como activo genérico (activo = 1)
--    c. Periodo que cubra la fecha actual del servidor
--    d. Periodo más reciente cronológicamente
SET @periodoActivoId = (
    SELECT idPeriodo 
    FROM periodos 
    ORDER BY 
        (periodoactivoinstituto = 1) DESC,
        (activo = 1) DESC,
        (fecha_inicial <= CURDATE() AND fecha_final >= CURDATE()) DESC,
        fecha_inicial DESC
    LIMIT 1
);

-- Mostrar el periodo autodetectado para confirmar en consola
SELECT CONCAT('PERIODO ACTIVO DETECTADO EN EL SISTEMA: ', IFNULL(@periodoActivoId, 'NINGUNO')) AS Info;

-- 2. Vincular dinámicamente a todos los docentes activos con horas de investigación en dicho periodo.
--    Se distribuyen sus carreras según el dígito final de su cédula/ID.
INSERT INTO profesores_carreras_periodos (idPeriodo, idProfesor, idCarrera, esActivo, sonTodas)
SELECT 
    @periodoActivoId AS idPeriodo,
    p.idProfesor,
    CASE (ASCII(RIGHT(p.idProfesor, 1)) % 5)
        WHEN 0 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1)   -- Software (alias: SOF)
        WHEN 1 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1)  -- Electrónica (alias: ELT)
        WHEN 2 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'EMP' LIMIT 1)   -- Gestión de Procesos (alias: EMP)
        WHEN 3 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'RDT' LIMIT 1)  -- Redes y Ciberseguridad (alias: RDT)
        ELSE (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ATH' LIMIT 1)         -- Gestión del Talento Humano (alias: ATH)
    END AS idCarrera,
    1 AS esActivo,
    0 AS sonTodas
FROM profesores p
WHERE p.activo = 1
  AND EXISTS (
      SELECT 1 FROM profesores_actividades pa 
      WHERE pa.idProfesor = p.idProfesor 
        AND pa.idSubcategoria = 7 
        AND pa.idPeriodo = @periodoActivoId
  )
ON DUPLICATE KEY UPDATE 
    esActivo = 1;

-- 3. Asegurar también una inserción dinámica idéntica para periodos históricos (ej: ABD2025 o previos)
--    por si cambias de periodo en la interfaz y deseas que sigan vinculados
INSERT INTO profesores_carreras_periodos (idPeriodo, idProfesor, idCarrera, esActivo, sonTodas)
SELECT 
    pa.idPeriodo,
    p.idProfesor,
    CASE (ASCII(RIGHT(p.idProfesor, 1)) % 5)
        WHEN 0 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1)
        WHEN 1 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1)
        WHEN 2 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'EMP' LIMIT 1)
        WHEN 3 THEN (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'RDT' LIMIT 1)
        ELSE (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ATH' LIMIT 1)
    END AS idCarrera,
    1 AS esActivo,
    0 AS sonTodas
FROM profesores p
JOIN profesores_actividades pa ON pa.idProfesor = p.idProfesor
WHERE p.activo = 1
  AND pa.idSubcategoria = 7
  AND pa.idPeriodo <> @periodoActivoId
ON DUPLICATE KEY UPDATE 
    esActivo = 1;

-- 4. Establecer un docente transversal para pruebas en el periodo activo
--    (Cambiamos a SonTodas = 1 para el docente de ID más bajo como muestra)
SET @docenteTransversalId = (
    SELECT idProfesor 
    FROM profesores_carreras_periodos 
    WHERE idPeriodo = @periodoActivoId 
    ORDER BY idProfesor ASC 
    LIMIT 1
);

UPDATE profesores_carreras_periodos 
SET sonTodas = 1, idCarrera = NULL 
WHERE idProfesor = @docenteTransversalId AND idPeriodo = @periodoActivoId;

-- Restaurar verificación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- 5. Consulta rápida de validación final
SELECT 
    pcp.idPeriodo AS Periodo,
    pcp.idProfesor AS Cedula,
    CONCAT(p.PrimerNombre, ' ', IFNULL(p.SegundoNombre, ''), ' ', p.PrimerApellido, ' ', IFNULL(p.SegundoApellido, '')) AS NombreDocente,
    IF(pcp.sonTodas = 1, 'Todas (Transversal)', c.Carrera) AS CarreraAsignada,
    pcp.esActivo AS Activo
FROM profesores_carreras_periodos pcp
LEFT JOIN profesores p ON pcp.idProfesor = p.idProfesor
LEFT JOIN carreras c ON pcp.idCarrera = c.idCarrera
WHERE pcp.idPeriodo = @periodoActivoId
ORDER BY NombreDocente ASC;
