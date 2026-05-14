using System.Threading.Tasks;
using diitra_infrastructure.Common.Notifications.Hubs;
using diitra_application.Common.Notifications;
using Microsoft.AspNetCore.SignalR;

namespace diitra_infrastructure.Common.Notifications
{
    public class SignalRDriver : INotificationDriver
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public string Name => "SignalR";

        public SignalRDriver(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null)
        {
            // En SignalR, el "recipient" es el ID del usuario
            await _hubContext.Clients.Group($"User_{recipient}").SendAsync("ReceiveNotification", new
            {
                title,
                body,
                url,
                fecha = DateTime.UtcNow
            });
        }
    }
}
