using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Cronograma moderno de actividades (Sección 7 del formulario V3)
/// </summary>
public partial class InvCronograma
{
    public int IdActividad { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdProyecto { get; set; }
    public int IdObjetivo { get; set; }
    public int NumeroActividad { get; set; }
    public string Descripcion { get; set; } = null!;
    public string? RecursosNecesarios { get; set; }
    public string? Responsable { get; set; }
    public string? Entregable { get; set; }
    public DateOnly? FechaInicioPrevista { get; set; }
    public DateOnly? FechaFinPrevista { get; set; }
    public decimal Progreso { get; set; } = 0;
    public decimal Ponderacion { get; set; } = 0;
    public bool EsEntregableCaces { get; set; } = false;
    public int? IdActividadPadre { get; set; }
    public string ColorHex { get; set; } = "#0070f3";

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvObjetivoProyecto IdObjetivoNavigation { get; set; } = null!;
    public virtual InvCronograma? IdActividadPadreNavigation { get; set; }
    public virtual ICollection<InvCronograma> InverseIdActividadPadreNavigation { get; set; } = new List<InvCronograma>();
}
