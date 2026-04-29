using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvBibliografiaProyecto
{
    public int IdBibliografia { get; set; }
    public int IdProyecto { get; set; }
    public string Descripcion { get; set; } = null!;
    public int? Orden { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
