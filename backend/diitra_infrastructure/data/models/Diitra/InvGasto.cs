using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvGasto
{
    public int IdGasto { get; set; }
    public int IdProyecto { get; set; }
    public int IdItem { get; set; }
    public DateOnly FechaGasto { get; set; }
    public decimal Monto { get; set; }
    public string? NumeroFactura { get; set; }
    public string? Proveedor { get; set; }
    public string? Descripcion { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvPresupuestoItem IdItemNavigation { get; set; } = null!;
}
