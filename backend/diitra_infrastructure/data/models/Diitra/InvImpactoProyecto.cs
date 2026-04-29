using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvImpactoProyecto
{
    public int IdImpactoProyecto { get; set; }
    public int IdProyecto { get; set; }
    public int IdCatImpacto { get; set; }
    public string Descripcion { get; set; } = null!;

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvCatImpacto IdCatImpactoNavigation { get; set; } = null!;
}
