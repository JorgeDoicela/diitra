using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvTransferencia
{
    public int IdTransferencia { get; set; }
    public int IdProyecto { get; set; }
    public string Tipo { get; set; } = null!;
    public string Entidad { get; set; } = null!;
    public decimal Monto { get; set; }
    public string? NumeroComprobante { get; set; }
    public DateOnly Fecha { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
