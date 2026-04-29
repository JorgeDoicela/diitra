using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvCatImpacto
{
    public int IdCatImpacto { get; set; }
    public string Nombre { get; set; } = null!;

    public virtual ICollection<InvImpactoProyecto> InvImpactosProyecto { get; set; } = new List<InvImpactoProyecto>();
}
