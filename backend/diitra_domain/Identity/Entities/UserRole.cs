using System;

namespace diitra_domain.Identity.Entities;

public class UserRole
{
    public int IdUsuarioRol { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public DateTime? FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public bool EsActivo { get; set; } = true;

    // Relaciones
    public Role Role { get; set; } = null!;
    public User User { get; set; } = null!;
}
