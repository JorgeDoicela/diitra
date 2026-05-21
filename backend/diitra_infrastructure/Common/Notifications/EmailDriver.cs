using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HandlebarsDotNet;

namespace diitra_infrastructure.Common.Notifications
{
    /// <summary>
    /// DRIVER DE NOTIFICACIÓN VÍA CORREO ELECTRÓNICO (SMTP) - DIITRA
    /// Esta clase se encarga de renderizar plantillas de correo electrónico desacopladas (HTML)
    /// utilizando el motor Handlebars.Net y despacharlas mediante el canal SMTP institucional.
    /// 
    /// =================================================================================
    /// GUÍA TÉCNICA: CÓMO AÑADIR MÁS CORREOS AUTOMÁTICOS Y RICOS EN INFORMACIÓN EN EL FUTURO
    /// =================================================================================
    /// 
    /// Si deseas implementar correos automáticos personalizados (ej. Aceptación de Proyecto, Recordatorios, etc.):
    /// 
    /// MÉTODO A: Enriquecimiento con Detalles Clave (Recomendado y rápido)
    ///    1. Invoca a 'NotifyUserAsync' o 'BroadcastAsync' desde cualquier servicio.
    ///    2. Pasa un diccionario 'extraData' con los datos clave del evento:
    ///       new Dictionary<string, string> { { "Propiedad A", "Valor A" }, { "Propiedad B", "Valor B" } }
    ///    3. El EmailDriver los formateará en forma de tabla interactiva en el correo de manera automática.
    /// 
    /// MÉTODO B: Creación de Plantillas Específicas Anidadas (Para diseños muy distintos)
    ///    1. Crea un nuevo archivo HTML (ej. "Resources/Templates/Email/PropuestaAprobada.html").
    ///    2. Diseña tu HTML específico dentro de ese archivo utilizando llaves simples {{mi_variable}}.
    ///    3. En tu código de servicio de C#, lee este archivo y compílalo usando Handlebars:
    ///          var innerTemplateHtml = await File.ReadAllTextAsync("ruta/al/PropuestaAprobada.html");
    ///          var innerTemplate = Handlebars.Compile(innerTemplateHtml);
    ///          var richBodyHtml = innerTemplate(new { mi_variable = "valor" });
    ///    4. Envía este 'richBodyHtml' como el parámetro 'body' (cuerpo) de la notificación.
    ///    5. Nuestro EmailDriver lo recibirá y lo inyectará de forma impecable en la sección {{{body_text}}}
    ///       de la plantilla maestra 'MasterLayout.html', manteniendo todo el branding y el footer legal LOPDP de ISTPET.
    /// </summary>
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

            // 1. CARGA DINÁMICA DE LA PLANTILLA MAESTRA
            // Obtenemos la ruta del MasterLayout.html en el directorio de ejecución bin/
            var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "MasterLayout.html");
            string htmlBody;

            if (File.Exists(templatePath))
            {
                try
                {
                    var templateHtml = await File.ReadAllTextAsync(templatePath);
                    var handlebars = Handlebars.Create();
                    var template = handlebars.Compile(templateHtml);

                    // Mapear extraData a una lista compatible con Handlebars
                    var formattedExtraData = extraData != null && extraData.Any()
                        ? extraData.Select(item => new { key = item.Key, value = item.Value }).ToList()
                        : null;

                    var context = new
                    {
                        title = title,
                        recipient_name = name,
                        body_text = body,
                        has_extra_data = formattedExtraData != null && formattedExtraData.Any(),
                        extra_data = formattedExtraData,
                        has_action = absoluteUrl != null,
                        action_url = absoluteUrl,
                        action_text = "VER DETALLES EN DIITRA",
                        anio_actual = DateTime.UtcNow.Year
                    };

                    htmlBody = template(context);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al procesar plantilla de correo en {TemplatePath}. Usando fallback.", templatePath);
                    htmlBody = $"<h2>Hola {name},</h2><p>{body}</p>";
                }
            }
            else
            {
                _logger.LogWarning("No se encontro la plantilla de correo en {TemplatePath}. Usando fallback basico.", templatePath);
                htmlBody = $"<h2>Hola {name},</h2><p>{body}</p>";
            }

            var host = _configuration["Email:Host"];
            var port = int.Parse(_configuration["Email:Port"] ?? "587");
            var user = _configuration["Email:Username"];
            var pass = _configuration["Email:Password"];

            if (string.IsNullOrEmpty(host))
            {
                _logger.LogWarning("[MOCK EMAIL] Para: {Recipient} | Titulo: {Title}", recipient, title);
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
            _logger.LogInformation("Email enviado con exito a {Recipient}", recipient);
        }
    }
}
