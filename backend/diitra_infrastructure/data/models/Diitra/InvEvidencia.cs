using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvEvidencia
{
    public int IdEvidencia { get; set; }
    public int IdInforme { get; set; }
    public string NombreArchivo { get; set; } = null!;
    public string RutaArchivo { get; set; } = null!;
    public string? TipoEvidencia { get; set; }
    public DateTime? FechaSubida { get; set; }

    public virtual InvInformeAvance IdInformeNavigation { get; set; } = null!;
}
