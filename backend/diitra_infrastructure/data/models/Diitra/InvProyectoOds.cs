using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoOds
{
    public int IdProyectoOds { get; set; }
    public int IdProyecto { get; set; }
    public int IdOds { get; set; }
    public string ObjetivoEspecificoODS { get; set; } = null!;

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvOds IdOdsNavigation { get; set; } = null!;
}
