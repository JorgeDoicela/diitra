using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvGrupoInvestigacion
{
    public int IdGrupo { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public bool? Activo { get; set; }

    public virtual ICollection<InvProyecto> InvProyectos { get; set; } = new List<InvProyecto>();
}
