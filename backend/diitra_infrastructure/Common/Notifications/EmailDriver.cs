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
            var frontendUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            var absoluteUrl = url != null ? (url.StartsWith("http") ? url : $"{frontendUrl}{url}") : null;

            var htmlBody = $@"
                <div style='background-color: #f8fafc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <table align='center' border='0' cellpadding='0' cellspacing='0' width='600' style='background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);'>
                        <tr>
                            <td align='center' style='padding: 40px 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);'>
                                <h1 style='color: white; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900; text-transform: uppercase;'>DIITRA</h1>
                                <p style='color: #94a3b8; margin: 5px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;'>Investigación e Innovación</p>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 40px 50px;'>
                                <h2 style='color: #1e293b; font-size: 20px; margin-bottom: 20px; font-weight: 800;'>{title}</h2>
                                <p style='color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;'>{body}</p>
                                
                                { (absoluteUrl != null ? $@"
                                    <div style='text-align: center; margin-top: 40px;'>
                                        <a href='{absoluteUrl}' style='background-color: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; transition: background-color 0.2s;'>
                                            ACCEDER AL DETALLE
                                        </a>
                                    </div>" : "") }
                                
                                <div style='margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;'>
                                    <p style='color: #94a3b8; font-size: 12px; margin: 0;'>Has recibido este mensaje porque eres parte de la red de investigadores DIITRA.</p>
                                    <p style='color: #64748b; font-size: 11px; margin: 10px 0 0 0; font-weight: 600;'>© 2026 Instituto Superior Tecnológico Traversari</p>
                                </div>
                            </td>
                        </tr>
                    </table>
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

                var fromEmail = _configuration["Email:FromEmail"] ?? "no-reply@diitra.istpet.edu.ec";
                var fromName = _configuration["Email:FromName"] ?? "DIITRA Notificaciones";

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
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
