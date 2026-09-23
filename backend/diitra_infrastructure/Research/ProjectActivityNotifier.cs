using System;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.Common.Notifications.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    /// <summary>
    /// Emite eventos de actividad en tiempo real a los clientes conectados
    /// al canal del proyecto a través de SignalR WebSockets.
    /// </summary>
    public class ProjectActivityNotifier : IProjectActivityNotifier
    {
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly ILogger<ProjectActivityNotifier> _logger;

        public ProjectActivityNotifier(
            IHubContext<NotificationHub> notificationHub,
            ILogger<ProjectActivityNotifier> logger)
        {
            _notificationHub = notificationHub;
            _logger = logger;
        }

        public async Task NotifyActivityAsync(string projectUuid, ProyectoActividadDto activity)
        {
            if (string.IsNullOrWhiteSpace(projectUuid) || activity == null) return;

            try
            {
                var cleanUuid = projectUuid.ToLower().Trim();
                var groupName = $"Project_{cleanUuid}";

                await _notificationHub.Clients.Group(groupName).SendAsync("ProjectActivityReceived", activity);

                _logger.LogInformation("[SignalR Activity] Notificación enviada a {Group}: {User} - {Desc}",
                    groupName, activity.NombreUsuario, activity.Descripcion);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[SignalR Activity] Error al emitir telemetría para proyecto {ProjectUuid}", projectUuid);
            }
        }
    }
}
