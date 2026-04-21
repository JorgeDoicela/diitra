using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>Convocatorias de investigación abiertas por el Director</summary>
public partial class InvConvocatoria
{
    public int IdConvocatoria { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public string CodigoConvocatoria { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string IdPeriodo { get; set; } = null!;
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
    public string Estado { get; set; } = "borrador";
    public int? MaximoProyectos { get; set; }
    public int? IdLineaInvestigacion { get; set; }

    public virtual InvLineaInvestigacion? IdLineaInvestigacionNavigation { get; set; }
    public decimal PresupuestoTotal { get; set; }
    public string UsuarioCreo { get; set; } = null!;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public sbyte Activo { get; set; } = 1;

    // Navegación
    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;
    public virtual ICollection<InvProyecto> Proyectos { get; set; } = new List<InvProyecto>();
}
