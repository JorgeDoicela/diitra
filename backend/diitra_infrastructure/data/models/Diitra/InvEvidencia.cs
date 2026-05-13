using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Evidencias documentales y fotográficas vinculadas a informes de avance
/// </summary>
public partial class InvEvidencia
{
    public int IdEvidencia { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdInforme { get; set; }
    public int IdTipoEvidencia { get; set; }
    public string? Descripcion { get; set; }
    public string RutaArchivo { get; set; } = null!;
    public string? MetadataJson { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public virtual InvInformeAvance IdInformeNavigation { get; set; } = null!;
    public virtual InvCatTipoEvidencia IdTipoEvidenciaNavigation { get; set; } = null!;
}
