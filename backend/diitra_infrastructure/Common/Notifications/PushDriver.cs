using System.Threading.Tasks;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Common.Notifications
{
    public class PushDriver : INotificationDriver
    {
        private readonly ILogger<PushDriver> _logger;

        public string Name => "PushMobile";

        public PushDriver(ILogger<PushDriver> logger)
        {
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null)
        {
            // Este es un cascarón preparado para una futura integración con Firebase Cloud Messaging (FCM)
            // Cuando Dios mediante se cree la versión móvil, aquí se consultarán los tokens de la tabla 
            // 'inv_dispositivos_tokens' y se enviarán mediante el SDK de Firebase.
            
            _logger.LogInformation($"[PUSH MOBILE READY] Simulación de envío a Usuario {recipient}: {title}");
            await Task.CompletedTask;
        }
    }
}
