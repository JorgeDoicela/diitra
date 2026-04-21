using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// Investigadores de otras instituciones para evaluaciones por pares
/// </summary>
public class ExternalReviewer
{
    public int IdRevisorExterno { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    public int? IdInstitucion { get; set; }
    public string? TituloAcademico { get; set; }
    public string? Especialidad { get; set; }
    
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public bool Activo { get; set; } = true;

    // Relaciones
    public virtual InvestigationInstitute? Institute { get; set; }
}
