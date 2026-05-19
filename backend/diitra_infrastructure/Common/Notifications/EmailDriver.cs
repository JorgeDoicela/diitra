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
        public async Task SendAsync(string recipient, string title, string body, string? url = null, string? recipientName = null, Dictionary<string, string>? extraData = null)
        {
            var frontendUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            var absoluteUrl = url != null ? (url.StartsWith("http") ? url : $"{frontendUrl}{url}") : null;
            var name = recipientName ?? "Investigador";

            // Construir tabla de datos extras si existen
            var extraDataHtml = "";
            if (extraData != null && extraData.Any())
            {
                extraDataHtml = @"<div style='margin: 30px 0; background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;'>
                                    <h3 style='margin: 0 0 15px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;'>Detalles de la Notificación</h3>
                                    <table width='100%' cellpadding='0' cellspacing='0'>";
                foreach (var item in extraData)
                {
                    extraDataHtml += $@"<tr>
                                            <td style='padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; width: 40%;'>{item.Key}:</td>
                                            <td style='padding: 8px 0; color: #475569; font-size: 14px;'>{item.Value}</td>
                                        </tr>";
                }
                extraDataHtml += "</table></div>";
            }

            var htmlBody = $@"
                <div style='background-color: #f1f5f9; padding: 60px 0; font-family: ""Inter"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Arial, sans-serif;'>
                    <table align='center' border='0' cellpadding='0' cellspacing='0' width='600' style='background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);'>
                        <!-- Header con Branding ISTPET -->
                        <tr>
                            <td align='center' style='padding: 50px 40px; background-color: #1b2141;'>
                                <table width='100%'>
                                    <tr>
                                        <td align='center'>
                                            <div style='background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 16px; display: inline-block;'>
                                                <h1 style='color: white; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase; display: flex; align-items: center;'>
                                                    <span style='color: #b9975b;'>ISTET</span><span style='margin: 0 10px; opacity: 0.5;'>|</span>DIITRA
                                                </h1>
                                            </div>
                                            <p style='color: #94a3b8; margin: 15px 0 0 0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;'>Investigación e Innovación Tecnológica</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Contenido Principal -->
                        <tr>
                            <td style='padding: 50px 60px;'>
                                <h2 style='color: #1e293b; font-size: 24px; margin: 0 0 25px 0; font-weight: 800; line-height: 1.2;'>Hola {name},</h2>
                                <p style='color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;'>{body}</p>

                                {extraDataHtml}

                                { (absoluteUrl != null ? $@"
                                    <div style='text-align: center; margin: 40px 0;'>
                                        <a href='{absoluteUrl}' style='background-color: #1b2141; color: white; padding: 20px 40px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(27, 33, 65, 0.3);'>
                                            VER DETALLES EN DIITRA
                                        </a>
                                    </div>" : "") }

                                <p style='color: #64748b; font-size: 14px; margin-top: 40px;'>Si tienes alguna duda, puedes contactarnos respondiendo a este correo o a través de nuestra plataforma.</p>

                                <!-- Footer Institucional -->
                                <div style='margin-top: 60px; padding-top: 40px; border-top: 1px solid #f1f5f9;'>
                                    <table width='100%'>
                                        <tr>
                                            <td style='text-align: left;'>
                                                <p style='color: #1e293b; font-size: 13px; margin: 0 0 5px 0; font-weight: 700;'>Instituto Superior Tecnológico Traversari</p>
                                                <p style='color: #94a3b8; font-size: 12px; margin: 0;'>Excelencia Académica</p>
                                            </td>
                                            <td style='text-align: right;'>
                                                <div style='color: #b9975b; font-weight: 800; font-size: 12px;'>ISTPET 2026</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- LOPDP Ecuador -->
                                    <div style='margin-top: 30px; background-color: #f8fafc; border-radius: 12px; padding: 20px;'>
                                        <p style='color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;'>
                                            <strong>Protección de Datos Personales:</strong> En cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, le informamos que sus datos son tratados con la finalidad de gestionar su participación en actividades de investigación. Usted puede ejercer sus derechos de acceso, rectificación, cancelación u oposición enviando un correo a <a href='mailto:admisiones@istpet.edu.ec' style='color: #b9975b; text-decoration: none;'>admisiones@istpet.edu.ec</a>.
                                        </p>
                                    </div>

                                    <div style='text-align: center; margin-top: 30px;'>
                                        <p style='color: #cbd5e1; font-size: 10px; margin: 0;'>Av. Matilde Álvarez y Hugo Díaz Romero. Sector Chillogallo. Quito, Ecuador.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                    <div style='text-align: center; padding: 30px 0;'>
                        <p style='color: #94a3b8; font-size: 12px;'>&copy; 2026 Sistema DIITRA. Todos los derechos reservados.</p>
                    </div>
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
