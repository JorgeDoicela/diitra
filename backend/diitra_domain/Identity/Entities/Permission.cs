using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class Permission
{
    public int IdPermiso { get; set; }
    public string Modulo { get; set; } = string.Empty;
    public string CodigoName { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    // Relaciones
    public ICollection<Role> Roles { get; set; } = new List<Role>();
}
