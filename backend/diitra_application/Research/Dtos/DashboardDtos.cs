using System;
using System.Collections.Generic;

namespace Diitra.Application.Research.Dtos
{
    /// <summary>
    /// Vista resumida de un proyecto para listas, cards y dashboards.
    /// Optimizado para queries ligeras (sin joins pesados).
    /// </summary>
    public class ProyectoResumenDto
    {
        public string Uuid { get; set; } = string.Empty;
        public string? CodigoInstitucional { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Estado { get; set; } = "Borrador";
        public string? LineaInvestigacion { get; set; }
        public string? TipoInvestigacion { get; set; }
        public string? Carrera { get; set; }
        public decimal? PresupuestoTotal { get; set; }
        public decimal? PresupuestoEjecutado { get; set; }
        public decimal? PuntajeEvaluacion { get; set; }
        public DateTime? FechaRegistro { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public DateOnly? FechaInicio { get; set; }
        public DateOnly? FechaFin { get; set; }
        public string? TiempoEjecucion { get; set; }
        public string? ConvocatoriaTitulo { get; set; }
        public string? RolEnProyecto { get; set; }  // Rol del usuario actual en este proyecto
        public int TotalInvestigadores { get; set; }
        public int TotalProductos { get; set; }
        public int TotalInformes { get; set; }
        public int InformesAprobados { get; set; }
        // TRL para innovación
        public int? TrlActual { get; set; }
        public int? TrlMeta { get; set; }
    }

    /// <summary>
    /// Estadísticas del dashboard por rol.
    /// El backend calcula todo; el frontend solo renderiza.
    /// </summary>
    public class DashboardStatsDto
    {
        // ── Métricas del Investigador (Docente/Estudiante) ──
        public int MisProyectosActivos { get; set; }
        public int MisProyectosBorrador { get; set; }
        public int MisProductosRegistrados { get; set; }
        public int MisInformesPendientes { get; set; }
        public decimal MisHorasInvestigacion { get; set; }

        // ── Métricas Globales (Director/Admin) ──
        public int TotalProyectos { get; set; }
        public int ProyectosBorrador { get; set; }
        public int ProyectosEnRevision { get; set; }
        public int ProyectosAprobados { get; set; }
        public int ProyectosEnEjecucion { get; set; }
        public int ProyectosFinalizados { get; set; }

        public int TotalConvocatoriasAbiertas { get; set; }
        public int TotalInvestigadoresActivos { get; set; }
        public int TotalProductosPeriodo { get; set; }
        public int ArticulosIndexados { get; set; }
        public int Prototipos { get; set; }
        public int Ponencias { get; set; }

        public decimal PresupuestoTotalAsignado { get; set; }
        public decimal PresupuestoTotalEjecutado { get; set; }

        // ── Distribución por Estado (para gráfico de embudo) ──
        public List<EstadoConteoDto> ProyectosPorEstado { get; set; } = new();

        // ── Actividad Reciente ──
        public List<ActividadRecienteDto> ActividadReciente { get; set; } = new();
    }

    public class EstadoConteoDto
    {
        public string Estado { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class ActividadRecienteDto
    {
        public string Tipo { get; set; } = string.Empty;     // "proyecto", "informe", "convocatoria"
        public string Descripcion { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string? Uuid { get; set; }
        public string? Estado { get; set; }
    }
}
