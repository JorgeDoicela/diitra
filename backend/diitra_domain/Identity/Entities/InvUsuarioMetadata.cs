using System;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// [SISTEMA] Metadata y preferencias de usuarios en DIITRA (Shadow Profile)
/// </summary>
public partial class InvUsuarioMetadata
{
    public int IdMetadata { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdUsuario { get; set; }
    
    /// <summary>
    /// Configuración en formato JSON (preferencias, temas, etc.)
    /// </summary>
    public string? Configuracion { get; set; }
    
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime? FechaUltimoAcceso { get; set; }
    public int Version { get; set; } = 1;

    // Navegación
    public virtual User User { get; set; } = null!;
}
