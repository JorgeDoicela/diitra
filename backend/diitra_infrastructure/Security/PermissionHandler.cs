using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Security;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly DiitraContext _context;

    public PermissionHandler(DiitraContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null) return;

        var username = context.User.Identity?.Name ?? 
                      context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(username)) return;

        // Validar Permiso Modular: Buscamos si existe la relación modular para el usuario
        var hasPermission = await _context.UserRoles
            .Include(ur => ur.User)
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Module)
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Operation)
            .Where(ur => ur.User.Usuario == username && (ur.EsActivo ?? true))
            .SelectMany(ur => ur.Role.RoleModuleOperations)
            .Where(rmo => (rmo.EsActivo ?? true) && rmo.ModuleOperation != null && (rmo.ModuleOperation.EsActivo ?? true))
            .AnyAsync(rmo => 
                (rmo.ModuleOperation.Module.Nombre + ":" + rmo.ModuleOperation.Operation.NombreOperacion).ToUpper() == requirement.Permission.ToUpper());

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
