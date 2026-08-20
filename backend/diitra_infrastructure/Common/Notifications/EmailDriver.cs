using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common;
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
    /// </summary>
    public class EmailDriver : INotificationDriver
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailDriver> _logger;
        private readonly EmailMasterLayoutRenderer _layoutRenderer;
        private readonly DiitraContext _context;
        private readonly IAppUrlService _appUrlService;

        public string Name => "Email";

        public EmailDriver(
            IConfiguration configuration,
            ILogger<EmailDriver> logger,
            EmailMasterLayoutRenderer layoutRenderer,
            DiitraContext context,
            IAppUrlService appUrlService)
        {
            _configuration = configuration;
            _logger = logger;
            _layoutRenderer = layoutRenderer;
            _context = context;
            _appUrlService = appUrlService;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null, string? recipientName = null, Dictionary<string, string>? extraData = null)
        {
            if (extraData != null && extraData.TryGetValue("SkipEmail", out var skip) && skip.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var absoluteUrl = url != null 
                ? (url.StartsWith("http", StringComparison.OrdinalIgnoreCase) 
                    ? url 
                    : _appUrlService.BuildFrontendUrl(url)) 
                : null;
            var name = recipientName ?? "Investigador";

            try
            {
                var htmlBody = await _layoutRenderer.RenderAsync(title, name, body, absoluteUrl, extraData);

                // Encolamos el correo en inv_email_historial para que el servicio EmailBackgroundProcessorService lo despache de forma asíncrona.
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
