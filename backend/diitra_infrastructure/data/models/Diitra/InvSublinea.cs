using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvSublinea
{
    public int IdSublinea { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdLinea { get; set; }
    public string Nombre { get; set; } = null!;
    public bool? Activo { get; set; }

    public virtual InvLineaInvestigacion IdLineaNavigation { get; set; } = null!;
    public virtual ICollection<InvProyecto> InvProyectos { get; set; } = new List<InvProyecto>();
}
