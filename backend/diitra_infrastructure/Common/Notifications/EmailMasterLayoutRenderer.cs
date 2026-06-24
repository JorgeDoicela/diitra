using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using HandlebarsDotNet;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Common.Notifications
{
    /// <summary>
    /// Envuelve el contenido de correos en MasterLayout.html (logos ISTPET + DIITRA, footer LOPDP).
    /// Usado por EmailEngineService y EmailDriver.
    /// </summary>
    public class EmailMasterLayoutRenderer
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailMasterLayoutRenderer> _logger;

        public EmailMasterLayoutRenderer(IConfiguration configuration, ILogger<EmailMasterLayoutRenderer> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string TemplateDirectory =>
            Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email");

        public string MasterLayoutPath => Path.Combine(TemplateDirectory, "MasterLayout.html");

        /// <summary>
        /// Extrae el cuerpo útil de plantillas legacy (HTML completo con cabecera/pie duplicados).
        /// </summary>
        public static string ExtractInnerContent(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return "<p></p>";

            var slice = html;

            var h2Match = Regex.Match(slice, @"<h2\b", RegexOptions.IgnoreCase);
            if (h2Match.Success)
            {
                slice = slice.Substring(h2Match.Index);
                // El layout maestro ya saluda con "Hola {nombre}"
                slice = Regex.Replace(
                    slice,
                    @"<h2[^>]*>[\s\S]*?</h2>\s*",
                    "",
                    RegexOptions.IgnoreCase,
                    TimeSpan.FromSeconds(2));
            }

            slice = Regex.Replace(
                slice,
                @"<div[^>]*border-top:\s*1px\s+solid\s+#eaeaea[\s\S]*$",
                "",
                RegexOptions.IgnoreCase | RegexOptions.Singleline,
                TimeSpan.FromSeconds(2));

            slice = Regex.Replace(
                slice,
                @"<p[^>]*>[\s\S]{0,200}correo automático[\s\S]*?</p>\s*",
                "",
                RegexOptions.IgnoreCase,
                TimeSpan.FromSeconds(2));

            return string.IsNullOrWhiteSpace(slice) ? "<p></p>" : slice.Trim();
        }

        public static string? ResolveActionUrl(
            IReadOnlyDictionary<string, string> replacements,
            string bodyHtml,
            string frontendUrl)
        {
            var priorityKeys = new[]
            {
                "[[proyecto_workspace_url]]",
                "[[url_adopcion]]",
                "[[convocatoria_bases_url]]"
            };

            foreach (var key in priorityKeys)
            {
                if (!replacements.TryGetValue(key, out var val) || string.IsNullOrWhiteSpace(val)) continue;
                if (val.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return val;
                if (val.StartsWith("/")) return $"{frontendUrl.TrimEnd('/')}{val}";
            }

            var hrefMatch = Regex.Match(
                bodyHtml,
                @"<a\s+[^>]*href=[""']([^""']+)[""']",
                RegexOptions.IgnoreCase,
                TimeSpan.FromSeconds(2));
            if (hrefMatch.Success)
            {
                var href = hrefMatch.Groups[1].Value;
                if (href.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return href;
                if (href.StartsWith("/")) return $"{frontendUrl.TrimEnd('/')}{href}";
            }

            return null;
        }

        public async Task<string> RenderAsync(
            string title,
            string recipientName,
            string innerBodyHtml,
            string? actionUrl = null,
            Dictionary<string, string>? extraData = null)
        {
            var frontendUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            var host = _configuration["Email:Host"];
            var isMock = string.IsNullOrEmpty(host);

            var logoIstpetVal = "cid:logo_istpet";
            var logoDiitraVal = "cid:logo_diitra";

            var bodyContent = ExtractInnerContent(innerBodyHtml);

            if (!File.Exists(MasterLayoutPath))
            {
                _logger.LogWarning("MasterLayout no encontrado en {Path}. Usando HTML simple.", MasterLayoutPath);
                return $"<div style=\"font-family:sans-serif;\"><h2>Hola {recipientName},</h2>{bodyContent}</div>";
            }

            try
            {
                var templateHtml = await File.ReadAllTextAsync(MasterLayoutPath);
                var handlebars = Handlebars.Create();
                var template = handlebars.Compile(templateHtml);

                var formattedExtraData = extraData != null && extraData.Any()
                    ? extraData.Select(item => new { key = item.Key, value = item.Value }).ToList()
                    : null;

                var absoluteActionUrl = actionUrl != null
                    ? (actionUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                        ? actionUrl
                        : $"{frontendUrl.TrimEnd('/')}{(actionUrl.StartsWith("/") ? actionUrl : "/" + actionUrl)}")
                    : null;

                var context = new
                {
                    title,
                    recipient_name = recipientName,
                    body_text = bodyContent,
                    has_extra_data = formattedExtraData != null && formattedExtraData.Any(),
                    extra_data = formattedExtraData,
                    has_action = absoluteActionUrl != null,
                    action_url = absoluteActionUrl,
                    action_text = "VER DETALLES EN DIITRA",
                    anio_actual = DateTime.UtcNow.Year,
                    frontend_url = frontendUrl,
                    logo_istpet = logoIstpetVal,
                    logo_diitra = logoDiitraVal
                };

                return template(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al renderizar MasterLayout");
                return $"<div style=\"font-family:sans-serif;\"><h2>Hola {recipientName},</h2>{bodyContent}</div>";
            }
        }

        /// <summary>
        /// Asigna el HTML al mensaje con imágenes incrustadas usando AlternateViews.
        /// </summary>
        public void SetHtmlBodyWithBranding(MailMessage mailMessage, string htmlBody)
        {
            var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, System.Text.Encoding.UTF8, "text/html");

            var logoIstpetPath = Path.Combine(TemplateDirectory, "logo_istpet_negro.png");
            var logoDiitraPath = Path.Combine(TemplateDirectory, "logo_negro.png");

            if (File.Exists(logoIstpetPath))
            {
                var logoIstpetResource = new LinkedResource(logoIstpetPath, "image/png")
                {
                    ContentId = "logo_istpet"
                };
                htmlView.LinkedResources.Add(logoIstpetResource);
            }
            else
            {
                _logger.LogWarning("Logo ISTPET no encontrado en {Path}", logoIstpetPath);
            }

            if (File.Exists(logoDiitraPath))
            {
                var logoDiitraResource = new LinkedResource(logoDiitraPath, "image/png")
                {
                    ContentId = "logo_diitra"
                };
                htmlView.LinkedResources.Add(logoDiitraResource);
            }
            else
            {
                _logger.LogWarning("Logo DIITRA no encontrado en {Path}", logoDiitraPath);
            }

            mailMessage.AlternateViews.Add(htmlView);
        }
    }
}
