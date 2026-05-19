using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Security
{
    public class AuditService : IAuditService
    {
        private readonly DiitraContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(DiitraContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActionAsync(int? affectedUserId, string action, string details, string? modulo = null, string? before = null, string? after = null)
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context == null) return;

                // 1. Obtener la identidad del usuario actual (el que realiza la acción)
                // Usamos NameIdentifier que es donde AuthService.GenerateToken guarda el IdSigafi
                var adminIdentifier = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                int adminId;
                if (string.IsNullOrEmpty(adminIdentifier))
                {
                    // Si la acción es LOGIN o similar y no hay sesión autenticada en HttpContext,
                    // usamos affectedUserId como el realizador de la acción si está disponible.
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

                // 2. Obtener Metadata de Red
                var ip = context.Connection?.RemoteIpAddress?.ToString();
                var ua = context.Request?.Headers["User-Agent"].ToString();

                // 3. Crear Registro
                var audit = new InvAuditAdmin
                {
                    IdUsuarioAdmin = adminId,
                    IdUsuarioAfectado = affectedUserId ?? adminId, // Si no hay afectado, el mismo usuario
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
                // La auditoría no debe romper el flujo principal de la aplicación
                // En producción, aquí se loguearía a un archivo o Serilog
                System.Diagnostics.Debug.WriteLine($"Error en Auditoría: {ex.Message}");
            }
        }
    }
}
