using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Common.Notifications
{
    public class EmailDriver : INotificationDriver
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailDriver> _logger;

        public string Name => "Email";

        public EmailDriver(IConfiguration configuration, ILogger<EmailDriver> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null)
        {
            // En un entorno profesional, aquí usaríamos una plantilla HTML
            // Para esta versión, generamos un cuerpo HTML básico pero elegante
            
            var htmlBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;'>
                    <h2 style='color: #0070f3;'>DIITRA - Notificación Institucional</h2>
                    <hr />
                    <p><strong>{title}</strong></p>
                    <p>{body}</p>
                    {(url != null ? $"<div style='margin-top: 20px;'><a href='{url}' style='background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Ver Detalle</a></div>" : "")}
                    <hr style='margin-top: 30px;' />
                    <p style='font-size: 10px; color: #888;'>Este es un correo automático generado por el Departamento de Investigación e Innovación Traversari.</p>
                </div>";

            try
            {
                // Configuración desde appsettings.json
                var host = _configuration["Email:Host"];
                var port = int.Parse(_configuration["Email:Port"] ?? "587");
                var user = _configuration["Email:Username"];
                var pass = _configuration["Email:Password"];

                if (string.IsNullOrEmpty(host))
                {
                    _logger.LogWarning($"[MOCK EMAIL] Para: {recipient} | Título: {title}");
                    return;
                }

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(user!),
                    Subject = title,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(recipient);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email enviado con éxito a {recipient}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error enviando email a {recipient}");
            }
        }
    }
}
