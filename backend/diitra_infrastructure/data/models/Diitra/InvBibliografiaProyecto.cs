using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Bibliografía estructurada del proyecto (Sección 8 del formulario V3)
/// </summary>
public partial class InvBibliografiaProyecto
{
    public int IdBibliografia { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdProyecto { get; set; }
    public string CitaApa { get; set; } = null!;
    public string? Doi { get; set; }
    public string? Isbn { get; set; }
    public string? Autores { get; set; }
    public int? AnioPublicacion { get; set; }
    public string? TituloFuente { get; set; }
    public string? Url { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
}
