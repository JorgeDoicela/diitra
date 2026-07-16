using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using diitra_infrastructure.data.models;

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
        private readonly EmailMasterLayoutRenderer _layoutRenderer;
        private readonly DiitraContext _context;

        public string Name => "Email";

        public EmailDriver(
            IConfiguration configuration,
            ILogger<EmailDriver> logger,
            EmailMasterLayoutRenderer layoutRenderer,
            DiitraContext context)
        {
            _configuration = configuration;
            _logger = logger;
            _layoutRenderer = layoutRenderer;
            _context = context;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null, string? recipientName = null, Dictionary<string, string>? extraData = null)
        {
            var frontendUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            var absoluteUrl = url != null 
                ? (url.StartsWith("http", StringComparison.OrdinalIgnoreCase) 
                    ? url 
                    : $"{frontendUrl.TrimEnd('/')}{(url.StartsWith("/") ? url : "/" + url)}") 
                : null;
            var name = recipientName ?? "Investigador";

            try
            {
                var htmlBody = await _layoutRenderer.RenderAsync(title, name, body, absoluteUrl, extraData);

                // En lugar de enviar SMTP directamente bloqueando el hilo de ejecución, 
                // encolamos el correo en inv_email_historial para que el servicio EmailBackgroundProcessorService lo despache de forma asíncrona.
                var emailHistorial = new InvEmailHistorial
                {
                    Uuid = Guid.NewGuid().ToString(),
                    Destinatario = recipient,
                    Asunto = title,
                    Cuerpo = htmlBody,
                    Estado = "Pendiente",
                    FechaEnvio = DateTime.UtcNow
                };

                _context.InvEmailHistorials.Add(emailHistorial);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notificación por correo encolada en inv_email_historial para {Recipient} con asunto '{Title}'", recipient, title);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al encolar notificación de email para {Recipient}", recipient);
                throw;
            }
        }
    }
}
