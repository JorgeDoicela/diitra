using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>Convocatorias de investigación abiertas por el Director</summary>
public partial class InvConvocatoria
{
    public int IdConvocatoria { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string IdPeriodo { get; set; } = null!;
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
    public string Estado { get; set; } = "borrador";
    public int? MaximoProyectos { get; set; }
    public string? LineaInvestigacion { get; set; }
    public decimal PresupuestoTotal { get; set; }
    public string UsuarioCreo { get; set; } = null!;
    public DateTime FechaRegistro { get; set; }
    public DateTime FechaModificacion { get; set; }
    public sbyte Activo { get; set; } = 1;

    // Navegación
    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;
    public virtual ICollection<InvProyecto> Proyectos { get; set; } = new List<InvProyecto>();
}

