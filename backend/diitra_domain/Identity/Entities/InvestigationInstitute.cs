using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// Catálogo de instituciones y universidades para procesos de investigación
/// </summary>
public class InvestigationInstitute
{
    public int IdInstitucion { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public string Nombre { get; set; } = string.Empty;
    public string? Siglas { get; set; }
    public string? Ruc { get; set; }
    
    /// <summary>
    /// Tipo de institución: Publica, Privada, Internacional, Organismo
    /// </summary>
    public string Tipo { get; set; } = "Publica";
    
    public string Pais { get; set; } = "Ecuador";
    public string? Ciudad { get; set; }
    public string? SitioWeb { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public bool Activo { get; set; } = true;

}
