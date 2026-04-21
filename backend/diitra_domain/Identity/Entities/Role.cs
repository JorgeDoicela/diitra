using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class Role
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoRol { get; set; } = string.Empty;
    public bool EsActivo { get; set; } = true;

    // Relaciones
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RoleModuleOperation> RoleModuleOperations { get; set; } = new List<RoleModuleOperation>();
}
