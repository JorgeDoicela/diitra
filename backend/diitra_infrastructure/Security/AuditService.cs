using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Security
{
    public class AuditService : IAuditService
    {
        private readonly DiitraContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<AuditService> _logger;

        public AuditService(DiitraContext context, IHttpContextAccessor httpContextAccessor, ILogger<AuditService> logger)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public async Task LogActionAsync(int? affectedUserId, string action, string details, string? modulo = null, string? before = null, string? after = null)
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null) return;

                var adminIdentifier = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                int adminId;
                if (string.IsNullOrEmpty(adminIdentifier))
                {
                    if (affectedUserId.HasValue)
                    {
                        adminId = affectedUserId.Value;
                    }
                    else
                    {
                        return;
                    }
                }
                else
                {
                    var admin = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == adminIdentifier);
                    if (admin == null) return;
                    adminId = admin.IdUsuario;
                }

                var ip = httpContext.Connection?.RemoteIpAddress?.ToString();
                var ua = httpContext.Request?.Headers["User-Agent"].ToString();

                var audit = new InvAuditAdmin
                {
                    IdUsuarioAdmin = adminId,
                    IdUsuarioAfectado = affectedUserId ?? adminId,
                    Accion = action,
                    Modulo = modulo ?? "SISTEMA",
                    Detalle = details,
                    IpOrigen = ip,
                    UserAgent = ua,
                    ValoresAnteriores = before,
                    ValoresNuevos = after,
                    Fecha = DateTime.UtcNow
                };

                _context.Set<InvAuditAdmin>().Add(audit);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registrando auditoría: Acción={Action}, Módulo={Modulo}, UsuarioAfectado={AffectedUserId}", action, modulo, affectedUserId);
            }
        }
    }
}
