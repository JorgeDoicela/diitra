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
            var recipientContact = user?.EmailInstitucional ?? "";
            var recipientName = user?.Nombre ?? "Usuario";

            await DispatchToDriversAsync(userId, recipientContact, recipientName, title, body, url, extraData);
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

            var recipients = await query
                .Select(u => new
                {
                    u.IdUsuario,
                    u.EmailInstitucional,
                    u.Nombre
                })
                .ToListAsync();

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
                    await DispatchToDriversAsync(
                        user.IdUsuario,
                        user.EmailInstitucional ?? "",
                        user.Nombre ?? "Usuario",
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
                .Take(20)
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
    }
}
