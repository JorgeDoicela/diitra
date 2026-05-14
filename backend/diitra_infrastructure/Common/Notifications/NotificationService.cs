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

        public async Task NotifyUserAsync(int userId, string title, string body, string category = "SISTEMA", string? url = null)
        {
            // 1. Persistencia Interna (In-App Notification)
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

            // 2. Buscar Email del Usuario
            var user = await _context.Users.FindAsync(userId);
            var recipientContact = user?.EmailInstitucional ?? "";

            // 3. Notificación Externa vía Drivers (Email, SignalR, Push)
            foreach (var driver in _drivers)
            {
                try
                {
                    // El driver de SignalR usa el ID, el de Email usa el correo, el de Push usa el ID para buscar tokens
                    string contact = (driver.Name == "Email") ? recipientContact : userId.ToString();
                    
                    if (string.IsNullOrEmpty(contact) && driver.Name == "Email") continue;

                    await driver.SendAsync(contact, title, body, url);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error enviando notificación vía driver {driver.Name}");
                }
            }
        }

        public async Task BroadcastAsync(string title, string body, string? role = null, string? url = null)
        {
            _logger.LogInformation($"Iniciando Broadcast: {title} (Filtro Rol: {role ?? "TODOS"})");

            // 1. Obtener lista de destinatarios
            IQueryable<User> query = _context.Users;
            
            var recipients = await query.ToListAsync();

            // 2. Procesar cada uno
            foreach (var user in recipients)
            {
                await NotifyUserAsync(user.IdUsuario, title, body, "INVESTIGACION", url);
            }
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
