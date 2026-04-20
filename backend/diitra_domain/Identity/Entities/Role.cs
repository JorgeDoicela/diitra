using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class Role
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool EsSistema { get; set; }
    public bool Activo { get; set; } = true;

    // Relaciones
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
