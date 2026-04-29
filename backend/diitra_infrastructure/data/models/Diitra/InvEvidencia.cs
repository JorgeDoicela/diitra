using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Evidencias documentales y fotográficas vinculadas a informes de avance
/// </summary>
public partial class InvEvidencia
{
    public int IdEvidencia { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdInforme { get; set; }
    public string Tipo { get; set; } = "Imagen"; // Imagen, Documento, Factura, Asistencia, Otros
    public string? Descripcion { get; set; }
    public string RutaArchivo { get; set; } = null!;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public virtual InvInformeAvance IdInformeNavigation { get; set; } = null!;
}
