using System;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// Metadata adicional para usuarios de DIITRA (Shadow Profile)
/// Permite extender datos del usuario y asignar UUIDs sin modificar
/// la tabla central de identidad de SIGAFI.
/// </summary>
public partial class InvUsuarioMetadata
{
    public int IdMetadata { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdUsuario { get; set; }
    
    // JSON para configuraciones dinámicas (UI, temas, etc)
    public string? Configuracion { get; set; }
    
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime FechaUltimoAcceso { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;

    // Navegación
    public virtual User User { get; set; } = null!;
}
