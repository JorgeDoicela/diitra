using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class SystemEntity
{
    public int IdSistema { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Detalle { get; set; } = string.Empty;
    public ICollection<IdentityModule> Modulos { get; set; } = new List<IdentityModule>();
}


public class IdentityModule
{
    public int IdModulos { get; set; }
    public int IdSistema { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool? EsActivo { get; set; } = true;

    public SystemEntity Sistema { get; set; } = null!;
    public ICollection<ModuleOperation> ModuloOperations { get; set; } = new List<ModuleOperation>();
}

public class IdentityOperation
{
    public int IdOperaciones { get; set; }
    public string NombreOperacion { get; set; } = string.Empty;
    public ICollection<ModuleOperation> ModuloOperations { get; set; } = new List<ModuleOperation>();
}

public class ModuleOperation
{
    public int IdModulosOperaciones { get; set; }
    public int IdModulos { get; set; }
    public int IdOperaciones { get; set; }
    // DATE (no DATETIME) en la BD
    public DateOnly? FechaCreacion { get; set; }
    public DateOnly? FechaModificacion { get; set; }
    public bool? EsActivo { get; set; } = true;

    public IdentityModule Module { get; set; } = null!;
    public IdentityOperation Operation { get; set; } = null!;
    public ICollection<RoleModuleOperation> RoleModuleOperations { get; set; } = new List<RoleModuleOperation>();
}

public class RoleModuleOperation
{
    public int IdRolModuloOperacion { get; set; }
    public int IdModulosOperaciones { get; set; }
    public int IdRol { get; set; }
    // DATE (no DATETIME) en la BD
    public DateOnly? FechaAsignacion { get; set; }
    public DateOnly? FechaModificacion { get; set; }
    public DateOnly? FechaDesactivacion { get; set; }
    public bool? EsActivo { get; set; } = true;
    public string UsuarioAsigno { get; set; } = string.Empty; // NOT NULL en BD
    public string? UsuarioDesactivo { get; set; }             // NULL en BD

    public ModuleOperation ModuleOperation { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
