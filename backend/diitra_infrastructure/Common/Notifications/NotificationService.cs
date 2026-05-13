using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.Extensions.Logging;

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

            // 2. Notificación Externa vía Drivers (Email, Push, etc.)
            foreach (var driver in _drivers)
            {
                try
                {
                    // En un sistema real, aquí buscaríamos el email/teléfono del usuario
                    // await driver.SendAsync(userEmail, title, body, url);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error enviando notificación vía driver {driver.Name}");
                }
            }
        }

        public async Task BroadcastAsync(string title, string body, string? role = null)
        {
            // Lógica para enviar a múltiples usuarios
            _logger.LogInformation($"Broadcast: {title}");
            await Task.CompletedTask;
        }
    }
}
