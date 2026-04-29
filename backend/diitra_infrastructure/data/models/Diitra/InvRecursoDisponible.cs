using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvRecursoDisponible
{
    public int IdRecurso { get; set; }
    public int IdProyecto { get; set; }
    public string Detalle { get; set; } = null!;
    public decimal Cantidad { get; set; }
    public string? Fuente { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
