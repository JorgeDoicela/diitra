using System;
using System.Collections.Generic;

namespace Diitra.Application.Research.Dtos
{
    public class CronogramaResumenDto
    {
        public int TotalActividades { get; set; }
        public int ActividadesCompletadas { get; set; }
        public int ActividadesEnCurso { get; set; }
        public int ActividadesAtrasadas { get; set; }
        public decimal PorcentajeAvanceGlobal { get; set; }
        public string SemaforoPlazos { get; set; } = "VERDE"; // VERDE, AMARILLO, ROJO
        public int HitosCacesTotales { get; set; }
        public int HitosCacesCumplidos { get; set; }
        public bool PuedeEditar { get; set; }
        public string EstadoProyecto { get; set; } = string.Empty;

        public List<ActividadCronogramaItemDto> Actividades { get; set; } = new();
    }

    public class ActividadCronogramaItemDto
    {
        public int IdActividad { get; set; }
        public string Uuid { get; set; } = string.Empty;
        public int IdProyecto { get; set; }
        public int IdObjetivo { get; set; }
        public string? ObjetivoDescripcion { get; set; }
        public int NumeroActividad { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public string? RecursosNecesarios { get; set; }
        public string? Responsable { get; set; }
        public string? Entregable { get; set; }
        public string? FechaInicioPrevista { get; set; }
        public string? FechaFinPrevista { get; set; }
        public decimal Progreso { get; set; }
        public decimal Ponderacion { get; set; }
        public bool EsEntregableCaces { get; set; }
        public string ColorHex { get; set; } = "#0070f3";
        public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE, EN_CURSO, COMPLETADA, ATRASADA
        public List<bool> Semanas { get; set; } = new();
    }

    public class ActualizarProgresoActividadRequest
    {
        public decimal Progreso { get; set; }
        public string? Entregable { get; set; }
        public string? Observaciones { get; set; }
    }

    public class GuardarActividadRequest
    {
        public int? IdActividad { get; set; }
        public int? IdObjetivo { get; set; }
        public int NumeroActividad { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public string? RecursosNecesarios { get; set; }
        public string? Responsable { get; set; }
        public string? Entregable { get; set; }
        public string? FechaInicioPrevista { get; set; }
        public string? FechaFinPrevista { get; set; }
        public decimal? Progreso { get; set; }
        public decimal? Ponderacion { get; set; }
        public bool EsEntregableCaces { get; set; }
        public string? ColorHex { get; set; }
    }
}
