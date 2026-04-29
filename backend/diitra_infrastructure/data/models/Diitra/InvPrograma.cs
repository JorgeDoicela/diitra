using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvPrograma
{
    public int IdPrograma { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public sbyte? Activo { get; set; }
    public DateTime? FechaRegistro { get; set; }

    public virtual ICollection<InvProyecto> InvProyectos { get; set; } = new List<InvProyecto>();
}
