using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProducto
{
    public int IdProducto { get; set; }
    public int IdProyecto { get; set; }
    public int IdTipoProducto { get; set; }
    public string Titulo { get; set; } = null!;
    public int Cantidad { get; set; }
    public string? UrlProducto { get; set; }
    public bool? EsPropiedadIntelectual { get; set; }
    public string? NumeroRegistro { get; set; }
    public DateOnly? FechaRegistroSenadi { get; set; }
    public string? MetadataJson { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvCatTipoProducto IdTipoProductoNavigation { get; set; } = null!;
}
