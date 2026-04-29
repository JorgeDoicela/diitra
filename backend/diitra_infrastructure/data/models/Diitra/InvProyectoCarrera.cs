using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoCarrera
{
    public int IdProyectoCarrera { get; set; }
    public int IdProyecto { get; set; }
    public int IdCarrera { get; set; }
    public string? Modalidad { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Carrera IdCarreraNavigation { get; set; } = null!;
}
