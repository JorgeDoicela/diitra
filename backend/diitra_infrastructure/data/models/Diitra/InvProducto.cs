using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProducto
{
    public int IdProducto { get; set; }
    public int IdProyecto { get; set; }
    public string Tipo { get; set; } = null!;
    public int Cantidad { get; set; }
    public sbyte? EsPatente { get; set; }
    public string? NumeroRegistro { get; set; }
    public DateOnly? FechaExpiracion { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
