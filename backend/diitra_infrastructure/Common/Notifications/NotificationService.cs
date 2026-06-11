using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.Extensions.Logging;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Common.Notifications
{
    public class NotificationService : INotificationService
    {
        private readonly DiitraContext _context;
        private readonly IEnumerable<INotificationDriver> _drivers;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            DiitraContext context, 
            IEnumerable<INotificationDriver> drivers,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _drivers = drivers;
            _logger = logger;
        }

        public async Task NotifyUserAsync(int userId, string title, string body, string category = "SISTEMA", string? url = null, Dictionary<string, string>? extraData = null)
        {
            var notif = new InvNotificacion
            {
                Uuid = Guid.NewGuid(),
                Destinatario = userId,
                Titulo = title,
                Mensaje = body,
                Categoria = category,
                UrlAccion = url,
                FechaEnvio = DateTime.UtcNow,
                Leido = false
            };

            _context.InvNotificaciones.Add(notif);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                var resolved = await ResolveUserEmailAndNameAsync(user);
                await DispatchToDriversAsync(userId, resolved.Email ?? "", resolved.Name, title, body, url, extraData);
            }
        }

        public async Task BroadcastAsync(string title, string body, string? role = null, string? url = null, Dictionary<string, string>? extraData = null)
        {
            _logger.LogInformation("Iniciando Broadcast: {Title} (Filtro Rol: {Role})", title, role ?? "TODOS");

            IQueryable<User> query = _context.Users;

            if (!string.IsNullOrEmpty(role))
            {
                var tablaSigafi = MapRoleToTablaSigafi(role);
                if (tablaSigafi != null)
                {
                    query = query.Where(u => u.TablaSigafi == tablaSigafi);
                }
                else
                {
                    _logger.LogWarning("Rol desconocido '{Role}' en Broadcast, se notificara a todos los usuarios", role);
                }
            }

            var recipients = await query.ToListAsync();

            if (recipients.Count == 0)
            {
                _logger.LogWarning("Broadcast sin destinatarios para rol: {Role}", role);
                return;
            }

            var notifications = recipients.Select(u => new InvNotificacion
            {
                Uuid = Guid.NewGuid(),
                Destinatario = u.IdUsuario,
                Titulo = title,
                Mensaje = body,
                Categoria = "INVESTIGACION",
                UrlAccion = url,
                FechaEnvio = DateTime.UtcNow,
                Leido = false
            }).ToList();

            _context.InvNotificaciones.AddRange(notifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notificaciones internas creadas para {Count} usuarios. Iniciando envio externo...", recipients.Count);

            var failedCount = 0;
            foreach (var user in recipients)
            {
                try
                {
                    var resolved = await ResolveUserEmailAndNameAsync(user);
                    await DispatchToDriversAsync(
                        user.IdUsuario,
                        resolved.Email ?? "",
                        resolved.Name,
                        title,
                        body,
                        url,
                        extraData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error critico en broadcast para usuario {UserId}", user.IdUsuario);
                    failedCount++;
                }

                await Task.Delay(100);
            }

            _logger.LogInformation(
                "Broadcast completado: {Total} destinatarios, {Exitosos} exitosos, {Fallidos} con error",
                recipients.Count,
                recipients.Count - failedCount,
                failedCount);
        }

        public async Task NotifyByRoleCodesAsync(string title, string body, IEnumerable<string> roleCodes, string? url = null, Dictionary<string, string>? extraData = null)
        {
            var roleCodesList = roleCodes.ToList();

            _logger.LogInformation("Iniciando NotifyByRoleCodes: {Title} (Roles: {Roles})", title, string.Join(", ", roleCodesList));

            var recipients = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Where(ur => roleCodesList.Contains(ur.Role.CodigoRol) && (ur.EsActivo ?? true))
                .Where(ur => ur.User != null && ur.User.Activo)
                .Select(ur => ur.User)
                .Distinct()
                .ToListAsync();

            if (recipients.Count == 0)
            {
                _logger.LogWarning("NotifyByRoleCodes sin destinatarios para roles: {Roles}", string.Join(", ", roleCodesList));
                return;
            }

            var notifications = recipients.Select(u => new InvNotificacion
            {
                Uuid = Guid.NewGuid(),
                Destinatario = u.IdUsuario,
                Titulo = title,
                Mensaje = body,
                Categoria = "INVESTIGACION",
                UrlAccion = url,
                FechaEnvio = DateTime.UtcNow,
                Leido = false
            }).ToList();

            _context.InvNotificaciones.AddRange(notifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notificaciones internas creadas para {Count} admins. Iniciando envio externo...", recipients.Count);

            foreach (var user in recipients)
            {
                try
                {
                    var resolved = await ResolveUserEmailAndNameAsync(user);
                    await DispatchToDriversAsync(
                        user.IdUsuario,
                        resolved.Email ?? "",
                        resolved.Name,
                        title,
                        body,
                        url,
                        extraData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error en NotifyByRoleCodes para usuario {UserId}", user.IdUsuario);
                }

                await Task.Delay(100);
            }
        }

        private async Task<(string? Email, string Name)> ResolveUserEmailAndNameAsync(User user)
        {
            var name = user.Nombre ?? "Usuario";
            var email = user.EmailInstitucional?.Trim();
            if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                return (email, name);

            var sigafiId = user.IdSigafi?.Trim() ?? "";
            if (user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(sigafiId))
            {
                var p = await _context.Profesores.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.IdProfesor.Trim() == sigafiId);
                if (p != null)
                {
                    email = (p.EmailInstitucional ?? p.Email)?.Trim();
                    var profName = $"{p.PrimerNombre} {p.PrimerApellido}".Replace("  ", " ").Trim();
                    if (!string.IsNullOrWhiteSpace(profName)) name = profName;
                }
            }
            else if (user.TablaSigafi == "alumno" && !string.IsNullOrEmpty(sigafiId))
            {
                var a = await _context.Alumnos.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.IdAlumno.Trim() == sigafiId);
                if (a != null)
                {
                    email = (a.EmailInstitucional ?? a.Email)?.Trim();
                    var alumName = $"{a.PrimerNombre} {a.ApellidoPaterno}".Replace("  ", " ").Trim();
                    if (!string.IsNullOrWhiteSpace(alumName)) name = alumName;
                }
            }
            else if (user.TablaSigafi == "otros" && sigafiId.Contains('@'))
            {
                email = sigafiId;
            }

            if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                return (email, name);

            return (null, name);
        }

        private async Task DispatchToDriversAsync(
            int userId,
            string recipientContact,
            string recipientName,
            string title,
            string body,
            string? url,
            Dictionary<string, string>? extraData)
        {
            foreach (var driver in _drivers)
            {
                try
                {
                    string contact = driver.Name == "Email" ? recipientContact : userId.ToString();

                    if (string.IsNullOrEmpty(contact) && driver.Name == "Email")
                    {
                        _logger.LogWarning("Usuario {UserId} sin email institucional, omitiendo envio Email", userId);
                        continue;
                    }

                    await driver.SendAsync(contact, title, body, url, recipientName, extraData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error enviando notificacion via driver {Driver} a usuario {UserId}", driver.Name, userId);
                }
            }
        }

        private static string? MapRoleToTablaSigafi(string role)
        {
            return role.ToUpperInvariant() switch
            {
                "DOCENTE" => "profesor",
                "ESTUDIANTE" => "alumno",
                "EXTERNO" => "otros",
                _ => null
            };
        }

        public async Task<IEnumerable<object>> GetMyNotificationsAsync(int userId)
        {
            return await _context.InvNotificaciones
                .Where(n => n.Destinatario == userId)
                .OrderByDescending(n => n.FechaEnvio)
                .Select(n => new
                {
                    uuid = n.Uuid,
                    titulo = n.Titulo,
                    mensaje = n.Mensaje,
                    categoria = n.Categoria,
                    fecha_envio = n.FechaEnvio,
                    leido = n.Leido,
                    url_accion = n.UrlAccion
                })
                .ToListAsync();
        }

        public async Task<bool> MarkAsReadAsync(string uuid)
        {
            if (!Guid.TryParse(uuid, out var guid)) return false;
            
            var notif = await _context.InvNotificaciones.FirstOrDefaultAsync(n => n.Uuid == guid);
            if (notif == null) return false;

            notif.Leido = true;
            notif.FechaLectura = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await _context.InvNotificaciones
                .Where(n => n.Destinatario == userId && !n.Leido)
                .ToListAsync();

            foreach (var notif in unread)
            {
                notif.Leido = true;
                notif.FechaLectura = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
        
        public async Task SubscribeUserAsync(int userId, string deviceToken, string plataforma)
        {
            // 1. Limpieza de tokens obsoletos (dispositivos inactivos por más de 30 días)
            // Esto asegura que la base de datos se mantenga limpia de forma autogestionada
            var limiteInactividad = DateTime.UtcNow.AddDays(-30);
            var tokensObsoletos = await _context.InvDispositivosTokens
                .Where(t => t.UltimaSincronizacion < limiteInactividad)
                .ToListAsync();

            if (tokensObsoletos.Any())
            {
                _logger.LogInformation("Limpiando {Count} tokens de push obsoletos sin sincronización por más de 30 días", tokensObsoletos.Count);
                _context.InvDispositivosTokens.RemoveRange(tokensObsoletos);
            }

            // 2. Registrar o reasignar el token del dispositivo activo
            var existing = await _context.InvDispositivosTokens
                .FirstOrDefaultAsync(t => t.DeviceToken == deviceToken);

            if (existing != null)
            {
                // Si el dispositivo ya existía pero estaba asignado a otro usuario (ej: prestaron la laptop)
                // reasignamos el token de forma segura al nuevo usuario activo y actualizamos la sincronización
                existing.IdUsuario = userId;
                existing.UltimaSincronizacion = DateTime.UtcNow;
                existing.Plataforma = plataforma;
            }
            else
            {
                // Si es un dispositivo o navegador completamente nuevo, lo registramos normalmente
                var token = new InvDispositivoToken
                {
                    IdUsuario = userId,
                    DeviceToken = deviceToken,
                    Plataforma = plataforma,
                    UltimaSincronizacion = DateTime.UtcNow
                };
                _context.InvDispositivosTokens.Add(token);
            }

            await _context.SaveChangesAsync();
        }

        public async Task UnsubscribeUserAsync(int userId, string deviceToken)
        {
            var tokens = await _context.InvDispositivosTokens
                .Where(t => t.IdUsuario == userId && t.DeviceToken == deviceToken)
                .ToListAsync();

            if (tokens.Any())
            {
                _context.InvDispositivosTokens.RemoveRange(tokens);
                await _context.SaveChangesAsync();
            }
        }
    }
}
