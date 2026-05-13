using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvCatTipoProducto
{
    public int IdTipoProducto { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string Categoria { get; set; } = null!; // Académico, Tecnológico, Innovación, Transferencia
    public bool? RequiereRegistro { get; set; }
    public bool? Activo { get; set; }

    public virtual ICollection<InvProducto> InvProductos { get; set; } = new List<InvProducto>();
}
