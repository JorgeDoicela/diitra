using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoDominio
{
    public int IdProyectoDominio { get; set; }
    public int IdProyecto { get; set; }
    public int IdDominio { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvDominio IdDominioNavigation { get; set; } = null!;
}
