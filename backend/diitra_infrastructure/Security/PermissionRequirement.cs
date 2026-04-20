using Microsoft.AspNetCore.Authorization;

namespace diitra_infrastructure.Security;

/// <summary>
/// Requerimiento para validar un permiso específico de DIITRA
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
