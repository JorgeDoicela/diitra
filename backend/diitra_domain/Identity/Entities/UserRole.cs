using System;

namespace diitra_domain.Identity.Entities;

public class UserRole
{
    public int IdUsuarioRol { get; set; }
    public string IdReferencia { get; set; } = string.Empty;
    public string TipoReferencia { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;

    // Relaciones
    public Role Role { get; set; } = null!;
}
