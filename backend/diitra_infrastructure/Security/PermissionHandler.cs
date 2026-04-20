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

        // El ID del usuario en SIGAFI/DIITRA suele ser el 'Name' o un claim personalizado
        var userId = context.User.Identity?.Name ?? 
                     context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return;

        // Verificar si el usuario tiene algún rol que contenga el permiso solicitado
        // Consultamos la jerarquía: UsuariosRoles -> Roles -> Permissions
        var hasPermission = await _context.UserRoles
            .Where(ur => ur.IdReferencia == userId && ur.Activo)
            .Select(ur => ur.Role)
            .SelectMany(r => r.Permissions)
            .AnyAsync(p => p.CodigoName == requirement.Permission);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
