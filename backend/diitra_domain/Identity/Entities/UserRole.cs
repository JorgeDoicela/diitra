using System;

namespace diitra_domain.Identity.Entities;

public class UserRole
{
    public int IdUsuarioRol { get; set; }
    public int IdUsuario { get; set; }
    public int IdRol { get; set; }
    // La BD usa DATE (no DATETIME)
    public DateOnly? FechaCreacion { get; set; }
    public DateOnly? FechaModificacion { get; set; }
    public bool? EsActivo { get; set; } = true;

    // Relaciones
    public Role Role { get; set; } = null!;
    public User User { get; set; } = null!;
}
