using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvTipoInvestigacion
{
    public int IdTipo { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public int? IdTipoPadre { get; set; }
    public bool? Activo { get; set; }

    public virtual InvTipoInvestigacion? IdTipoPadreNavigation { get; set; }
    public virtual ICollection<InvTipoInvestigacion> InverseIdTipoPadreNavigation { get; set; } = new List<InvTipoInvestigacion>();
    public virtual ICollection<InvProyecto> InvProyectos { get; set; } = new List<InvProyecto>();
}
