using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public static class CalendarioViewSeeder
    {
        public static async Task EnsureCalendarioViewCreatedAsync(DiitraContext context, ILogger logger)
        {
            try
            {
                const string viewSql = @"
CREATE OR REPLACE VIEW v_calendario_eventos AS

-- 1. Hitos normativos e individuales (inv_calendario_eventos_normativos)
SELECT
    CONCAT('NORM-', idEvento)               AS idEventoCalendario,
    uuid,
    titulo,
    descripcion,
    IF(tipoEvento IN ('Normativo','Academico','Institucional','Feriado'), 'Normativo', 'Personal') AS categoriaGlobal,
    tipoEvento                              AS subcategoria,
    fechaInicio,
    fechaFin,
    esTodoElDia,
    colorHex,
    NULL                                    AS idEntidadOrigen,
    NULL                                    AS uuidEntidadOrigen,
    'CALENDARIO_NORMATIVO'                  AS tipoEntidadOrigen,
    urlAccion,
    rolesVisibles,
    activo,
    esPrivado,
    prioridad,
    estado,
    creadoPor,
    alertaDias,
    recurrenciaAnual
FROM inv_calendario_eventos_normativos

UNION ALL

-- 2. Apertura de convocatorias
SELECT
    CONCAT('CONV-APE-', idConvocatoria),
    uuid,
    CONCAT('Apertura: ', titulo),
    CONCAT('Convocatoria ', codigoConvocatoria, ' - Inicio del período de postulación.'),
    'Convocatoria',
    'AperturaConvocatoria',
    fechaApertura,
    NULL,
    1,
    '#3B82F6',
    idConvocatoria,
    uuid,
    'CONVOCATORIA',
    NULL,
    NULL,
    IF(estado IN ('Borrador','Abierta','Cerrada'), 1, 0),
    0                                       AS esPrivado,
    'Media'                                 AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_convocatorias

UNION ALL

-- 3. Cierre de convocatorias
SELECT
    CONCAT('CONV-CIE-', idConvocatoria),
    uuid,
    CONCAT('Cierre: ', titulo),
    CONCAT('Convocatoria ', codigoConvocatoria, ' - Fecha límite de postulación.'),
    'Convocatoria',
    'CierreConvocatoria',
    fechaCierre,
    NULL,
    1,
    '#F97316',
    idConvocatoria,
    uuid,
    'CONVOCATORIA',
    NULL,
    NULL,
    IF(estado IN ('Borrador','Abierta','Cerrada'), 1, 0),
    0                                       AS esPrivado,
    'Media'                                 AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_convocatorias

UNION ALL

-- 5. Inicio de proyectos activos
SELECT
    CONCAT('PROY-INI-', idProyecto),
    uuid,
    CONCAT('Inicio: ', titulo),
    CONCAT('Fecha de inicio del proyecto ', COALESCE(codigoInstitucional, uuid)),
    'Proyecto',
    'InicioProyecto',
    fechaInicio,
    NULL,
    1,
    '#10B981',
    idProyecto,
    uuid,
    'PROYECTO',
    NULL,
    'DIITRA_ADMIN',
    IF(estado NOT IN ('Borrador','Anulado','Rechazado') AND activo = 1, 1, 0),
    0                                       AS esPrivado,
    'Media'                                 AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_proyectos
WHERE fechaInicio IS NOT NULL

UNION ALL

-- 6. Vencimiento de proyectos activos
SELECT
    CONCAT('PROY-FIN-', idProyecto),
    uuid,
    CONCAT('Vencimiento: ', titulo),
    CONCAT('Fecha de cierre planificada del proyecto ', COALESCE(codigoInstitucional, uuid)),
    'Proyecto',
    'VencimientoProyecto',
    fechaFin,
    NULL,
    1,
    '#EF4444',
    idProyecto,
    uuid,
    'PROYECTO',
    NULL,
    NULL,
    IF(estado IN ('En Ejecución','Aprobado') AND activo = 1, 1, 0),
    0                                       AS esPrivado,
    'Alta'                                  AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_proyectos
WHERE fechaFin IS NOT NULL

UNION ALL

-- 7. Entrega de informes de avance pendientes
SELECT
    CONCAT('INF-', ia.idInforme),
    ia.uuid,
    CONCAT('Informe #', ia.numeroInforme, ': ', p.titulo),
    CONCAT('Entrega del Informe de Avance N° ', ia.numeroInforme),
    'Monitoreo',
    'InformeAvance',
    ia.fechaReporte,
    NULL,
    1,
    '#8B5CF6',
    ia.idProyecto,
    p.uuid,
    'INFORME_AVANCE',
    NULL,
    NULL,
    IF(ia.estado = 'Pendiente', 1, 0),
    0                                       AS esPrivado,
    'Media'                                 AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_informes_avance ia
JOIN inv_proyectos p ON p.idProyecto = ia.idProyecto

UNION ALL

-- 8. Plazos de peer review pendientes
SELECT
    CONCAT('REV-', r.idRevision),
    r.uuid,
    CONCAT('Plazo de evaluación: ', p.titulo),
    'Fecha límite para completar la evaluación por pares del proyecto.',
    'PeerReview',
    'PlazoPeerReview',
    r.fechaLimite,
    NULL,
    1,
    '#EC4899',
    r.idProyecto,
    p.uuid,
    'PEER_REVIEW',
    NULL,
    'DIITRA_ADMIN,DIITRA_REVISOR_EXTERNO',
    IF(r.estado = 'Pendiente', 1, 0),
    0                                       AS esPrivado,
    'Alta'                                  AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_revisiones_pares r
JOIN inv_proyectos p ON p.idProyecto = r.idProyecto

UNION ALL

-- 9. Plazo de subsanación de protocolo (Fase 1/2)
SELECT
    CONCAT('SUB-PROT-', p.idProyecto),
    p.uuid,
    CONCAT('Plazo de Subsanación: ', p.titulo),
    'Fecha límite para corregir y reenviar el protocolo de investigación.',
    'Proyecto',
    'SubsanacionProtocolo',
    p.fechaLimiteSubsanacion,
    NULL,
    1,
    '#F59E0B',
    p.idProyecto,
    p.uuid,
    'PROYECTO',
    CONCAT('/investigacion/workspace/protocolo-investigacion/', p.uuid),
    NULL,
    IF(p.estado IN ('En Corrección', 'En Correccion') AND (p.activo = 1 OR p.activo IS NULL), 1, 0),
    0                                       AS esPrivado,
    'Alta'                                  AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_proyectos p
WHERE p.fechaLimiteSubsanacion IS NOT NULL

UNION ALL

-- 10. Plazo de entrega de informe final (Fase 6)
SELECT
    CONCAT('INF-FIN-', p.idProyecto),
    p.uuid,
    CONCAT('Entrega Informe Final: ', p.titulo),
    'Fecha límite para la consolidación, firma y entrega del informe final.',
    'Proyecto',
    'EntregaInformeFinal',
    COALESCE(p.fechaLimiteSubsanacionFinal, p.fechaLimiteInformeFinal, p.fechaFin),
    NULL,
    1,
    '#3B82F6',
    p.idProyecto,
    p.uuid,
    'PROYECTO',
    CONCAT('/investigacion/workspace/informe-final/', p.uuid),
    NULL,
    IF(p.estado = 'En Ejecución' AND (p.activo = 1 OR p.activo IS NULL), 1, 0),
    0                                       AS esPrivado,
    'Alta'                                  AS prioridad,
    'Pendiente'                             AS estado,
    NULL                                    AS creadoPor,
    NULL                                    AS alertaDias,
    0                                       AS recurrenciaAnual
FROM inv_proyectos p
WHERE (p.fechaLimiteInformeFinal IS NOT NULL OR p.fechaLimiteSubsanacionFinal IS NOT NULL);
";

                await context.Database.ExecuteSqlRawAsync(viewSql);
                logger.LogInformation("DIITRA Calendario: Vista v_calendario_eventos verificada y sincronizada exitosamente.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "DIITRA Calendario: No se pudo auto-sincronizar la vista v_calendario_eventos en el arranque (se reintentará en el próximo ciclo).");
            }
        }
    }
}
