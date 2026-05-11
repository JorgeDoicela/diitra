using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

public partial class InvGrupoInvestigacion
{
    public int IdGrupo { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Siglas { get; set; }
    public int? IdCoordinador { get; set; }
    public string? ObjetivoGeneral { get; set; }
    public string? Mision { get; set; }
    public string? Vision { get; set; }
    public string? ResolucionAprobacion { get; set; }
    public DateOnly? FechaCreacion { get; set; }
    public bool? Activo { get; set; }
    public DateTime? FechaRegistro { get; set; }

    public virtual User? IdCoordinadorNavigation { get; set; }
    public virtual ICollection<InvProyecto> InvProyectos { get; set; } = new List<InvProyecto>();
    public virtual ICollection<InvGrupoMiembro> InvGruposMiembros { get; set; } = new List<InvGrupoMiembro>();
    public virtual ICollection<InvLineaInvestigacion> IdLineas { get; set; } = new List<InvLineaInvestigacion>();
}
