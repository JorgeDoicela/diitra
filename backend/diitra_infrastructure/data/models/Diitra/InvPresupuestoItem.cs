using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvPresupuestoItem
{
    public int IdItem { get; set; }
    public int IdProyecto { get; set; }
    public string Categoria { get; set; } = null!;
    public string? IdPartida { get; set; }
    public string Detalle { get; set; } = null!;
    public decimal Cantidad { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public bool EsGastoCapital { get; set; } = false;

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual ICollection<InvGasto> InvGastos { get; set; } = new List<InvGasto>();
}
