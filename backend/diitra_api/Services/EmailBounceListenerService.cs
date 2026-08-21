using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MimeKit;
using diitra_infrastructure.data.models;
using diitra_application.Common.Notifications;
using Microsoft.AspNetCore.SignalR;
using diitra_infrastructure.Common.Notifications.Hubs;

namespace diitra_api.Services
{
    /// <summary>
    /// Servicio desacoplado en segundo plano que detecta rebotes asíncronos (Mailer-Daemon / DSN)
    /// mediante el protocolo estándar IMAP (compatible con Gmail, Microsoft Outlook / Office 365, etc.).
    /// Actualiza automáticamente inv_email_historial a 'Rebotado' y alerta en la campana de DIITRA.
    /// </summary>
    public class EmailBounceListenerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EmailBounceListenerService> _logger;
        private readonly IConfiguration _configuration;

        public EmailBounceListenerService(
            IServiceProvider serviceProvider,
            ILogger<EmailBounceListenerService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DIITRA Email Bounce Listener Service (IMAP) iniciado.");

            // Esperar 15 segundos al arranque para permitir que los servicios base estén listos
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckBouncesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Error transitorio en el ciclo de verificación de rebotes IMAP: {Message}", ex.Message);
                }

                // Revisar la bandeja de rebotes cada 45 segundos
                await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);
            }
        }

        private async Task CheckBouncesAsync(CancellationToken stoppingToken)
        {
            var imapHost = _configuration["Email:ImapHost"];
            if (string.IsNullOrWhiteSpace(imapHost))
            {
                return;
            }

            if (!int.TryParse(_configuration["Email:ImapPort"], out var imapPort))
            {
                imapPort = 993;
            }

            var username = _configuration["Email:Username"];
            var password = _configuration["Email:Password"];

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return;
            }

            using var client = new ImapClient();
            client.Timeout = 15000; // 15s timeout

            try
            {
                await client.ConnectAsync(imapHost, imapPort, SecureSocketOptions.SslOnConnect, stoppingToken);
                await client.AuthenticateAsync(username, password, stoppingToken);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite, stoppingToken);

                // Buscar mensajes no leídos que correspondan a reportes de entrega (Mailer-Daemon, Postmaster, DSN)
                var query = SearchQuery.NotSeen.And(
                    SearchQuery.FromContains("mailer-daemon")
                    .Or(SearchQuery.FromContains("postmaster"))
                    .Or(SearchQuery.SubjectContains("Delivery Status Notification"))
                    .Or(SearchQuery.SubjectContains("Undeliverable"))
                    .Or(SearchQuery.SubjectContains("failure"))
                    .Or(SearchQuery.SubjectContains("returned to sender"))
                );

                var uids = await inbox.SearchAsync(query, stoppingToken);
                if (uids.Count == 0)
                {
                    await client.DisconnectAsync(true, stoppingToken);
                    return;
                }

                _logger.LogInformation("Se detectaron {Count} correos de rebote/DSN en la bandeja IMAP.", uids.Count);

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<DiitraContext>();
                var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                foreach (var uid in uids)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        var message = await inbox.GetMessageAsync(uid, stoppingToken);
                        var (bouncedEmail, bounceReason) = ExtractBounceDetails(message);

                        if (!string.IsNullOrEmpty(bouncedEmail))
                        {
                            _logger.LogWarning("Rebote detectado para la dirección: {Email} | Causa: {Reason}", bouncedEmail, bounceReason);

                            var humanizedReason = HumanizeBounceReason(bounceReason);

                            var cleanTarget = bouncedEmail.Trim().ToLowerInvariant();

                            // Buscar el último correo enviado a esa dirección en inv_email_historial
                            var emailRecord = await context.InvEmailHistorials
                                .Where(e => e.Destinatario.ToLower() == cleanTarget || e.Destinatario.ToLower().Contains(cleanTarget))
                                .OrderByDescending(e => e.FechaEnvio)
                                .FirstOrDefaultAsync(stoppingToken);

                            if (emailRecord != null)
                            {
                                emailRecord.Estado = "Rebotado";
                                emailRecord.ErrorMensaje = humanizedReason;
                                await context.SaveChangesAsync(stoppingToken);

                                // Notificar a los administradores en la campana de DIITRA
                                var notifTitle = "Fallo en Entrega: Correo Rebotado";
                                var notifBody = $"El correo '{emailRecord.Asunto}' no pudo ser entregado a \"{bouncedEmail}\". Motivo: {humanizedReason}";
                                var notifUrl = $"/emails?search={Uri.EscapeDataString(bouncedEmail)}";
                                var extraData = new Dictionary<string, string>
                                {
                                    { "SkipEmail", "true" },
                                    { "LogId", emailRecord.IdEmailHistorial.ToString() },
                                    { "BouncedEmail", bouncedEmail }
                                };

                                await notifService.NotifyByRoleCodesAsync(
                                    title: notifTitle,
                                    body: notifBody,
                                    roleCodes: new[] { "DIITRA_ADMIN", "ADMINISTRADOR" },
                                    url: notifUrl,
                                    extraData: extraData
                                );

                                // Notificar en tiempo real a la interfaz web (WebSocket SignalR)
                                try
                                {
                                    var hubContext = scope.ServiceProvider.GetService<Microsoft.AspNetCore.SignalR.IHubContext<diitra_infrastructure.Common.Notifications.Hubs.NotificationHub>>();
                                    if (hubContext != null)
                                    {
                                        await hubContext.Clients.All.SendAsync("EmailQueueUpdated", new
                                        {
                                            emailId = emailRecord.IdEmailHistorial,
                                            estado = "Rebotado",
                                            destinatario = bouncedEmail
                                        }, stoppingToken);
                                    }
                                }
                                catch (Exception hubEx)
                                {
                                    _logger.LogWarning(hubEx, "Error emitiendo evento SignalR de rebote.");
                                }
                            }
                        }

                        // Marcar el correo como leído en el buzón IMAP para no procesarlo repetidamente
                        await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, stoppingToken);
                    }
                    catch (Exception msgEx)
                    {
                        _logger.LogWarning(msgEx, "Error al procesar el mensaje de rebote UID {Uid}", uid);
                    }
                }

                await client.DisconnectAsync(true, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Fallo en la conexión IMAP para lectura de rebotes: {Message}", ex.Message);
            }
        }

        private (string? email, string reason) ExtractBounceDetails(MimeMessage message)
        {
            string? targetEmail = null;
            string reason = "La dirección de correo electrónico no existe o rechazó la entrega (Rebote DSN).";

            // 1. Recorrer todos los BodyParts en busca de MessageDeliveryStatus (RFC 3464) y MessagePart (correo original adjunto)
            foreach (var part in message.BodyParts)
            {
                if (part is MessageDeliveryStatus deliveryStatus)
                {
                    for (int i = 0; i < deliveryStatus.StatusGroups.Count; i++)
                    {
                        var group = deliveryStatus.StatusGroups[i];
                        var recipient = group["Final-Recipient"] ?? group["Original-Recipient"];
                        if (!string.IsNullOrEmpty(recipient))
                        {
                            var clean = Regex.Replace(recipient, @"^[a-zA-Z0-9_-]+;\s*", "", RegexOptions.IgnoreCase).Trim();
                            clean = clean.Trim('<', '>', ' ', '"', '\'');
                            if (!string.IsNullOrEmpty(clean) && clean.Contains('@'))
                            {
                                targetEmail = clean;
                            }
                        }
                        var diagnostic = group["Diagnostic-Code"];
                        if (!string.IsNullOrEmpty(diagnostic))
                        {
                            reason = diagnostic.Trim();
                        }
                    }
                }
                else if (part is MessagePart messagePart && messagePart.Message != null)
                {
                    // Si el reporte adjunta el mensaje original reenviado, extraer el destinatario directo
                    var originalTo = messagePart.Message.To.Mailboxes.FirstOrDefault()?.Address;
                    if (!string.IsNullOrEmpty(originalTo) && string.IsNullOrEmpty(targetEmail))
                    {
                        targetEmail = originalTo.Trim();
                    }
                }
            }

            var fullText = (message.TextBody ?? "") + "\n" + (message.HtmlBody ?? "");

            // 2. Patrones estándar RFC 3464 en texto plano (Final-Recipient / Original-Recipient)
            if (string.IsNullOrEmpty(targetEmail))
            {
                var recipientMatch = Regex.Match(fullText, @"(?:Final-Recipient|Original-Recipient):\s*(?:rfc822;)?\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?", RegexOptions.IgnoreCase);
                if (recipientMatch.Success)
                {
                    targetEmail = recipientMatch.Groups[1].Value.Trim();
                }
            }

            // 3. Patrones comunes de Google Mail / Gmail DSN ("wasn't delivered to ...", "Address not found")
            if (string.IsNullOrEmpty(targetEmail))
            {
                var gmailMatch = Regex.Match(fullText, @"(?:wasn't delivered to|could not be delivered to|no se pudo entregar a|falló la entrega a|delivered to)\s+<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?", RegexOptions.IgnoreCase);
                if (gmailMatch.Success)
                {
                    targetEmail = gmailMatch.Groups[1].Value.Trim();
                }
            }

            // 4. Patrones de cabeceras de reenvío en texto plano (To: / Para: / Destinatario:)
            if (string.IsNullOrEmpty(targetEmail))
            {
                var generalMatch = Regex.Match(fullText, @"(?:to|para|hacia|destinatario|account|casilla):\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?", RegexOptions.IgnoreCase);
                if (generalMatch.Success)
                {
                    var found = generalMatch.Groups[1].Value.Trim();
                    if (!IsSystemOrSenderEmail(found))
                    {
                        targetEmail = found;
                    }
                }
            }

            // 5. Patrones 550 con correo entre corchetes angulares <correo@dominio.com>
            if (string.IsNullOrEmpty(targetEmail))
            {
                var code550Match = Regex.Match(fullText, @"55\d\s+[\d\.]*\s*<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>", RegexOptions.IgnoreCase);
                if (code550Match.Success)
                {
                    var found = code550Match.Groups[1].Value.Trim();
                    if (!IsSystemOrSenderEmail(found))
                    {
                        targetEmail = found;
                    }
                }
            }

            // 6. Fallback final: Cualquier dirección de correo que no sea de la infraestructura ni remitente
            if (string.IsNullOrEmpty(targetEmail))
            {
                var matches = Regex.Matches(fullText, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
                foreach (Match m in matches)
                {
                    var cand = m.Value.Trim();
                    if (!IsSystemOrSenderEmail(cand))
                    {
                        targetEmail = cand;
                        break;
                    }
                }
            }

            // 7. Extraer código de diagnóstico / motivo específico
            if (reason == "La dirección de correo electrónico no existe o rechazó la entrega (Rebote DSN).")
            {
                var diagnosticMatch = Regex.Match(fullText, @"Diagnostic-Code:\s*([^\r\n]+)", RegexOptions.IgnoreCase);
                if (diagnosticMatch.Success)
                {
                    reason = diagnosticMatch.Groups[1].Value.Trim();
                }
                else if (fullText.Contains("550 5.1.1") || fullText.Contains("does not exist") || fullText.Contains("no existe") || fullText.Contains("Address not found") || fullText.Contains("couldn't be found"))
                {
                    reason = "Error 550 5.1.1: La cuenta de correo no existe en el servidor destinatario.";
                }
                else if (fullText.Contains("mailbox is full") || fullText.Contains("espacio insuficiente"))
                {
                    reason = "El buzón del destinatario está lleno y no puede recibir mensajes.";
                }
            }

            return (targetEmail, reason);
        }

        private bool IsSystemOrSenderEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return true;
            var lower = email.ToLowerInvariant();
            var fromEmail = _configuration["Email:FromEmail"]?.ToLowerInvariant();
            var username = _configuration["Email:Username"]?.ToLowerInvariant();

            if (!string.IsNullOrEmpty(fromEmail) && (lower == fromEmail || lower.Contains(fromEmail)))
                return true;
            if (!string.IsNullOrEmpty(username) && (lower == username || lower.Contains(username)))
                return true;

            return lower.Contains("google") ||
                   lower.Contains("postmaster") ||
                   lower.Contains("mailer-daemon") ||
                   lower.Contains("microsoft") ||
                   lower.Contains("no-reply") ||
                   lower.Contains("noreply");
        }

        private static string HumanizeBounceReason(string rawReason)
        {
            if (string.IsNullOrWhiteSpace(rawReason))
                return "La casilla de correo no existe o rechazó la recepción del mensaje.";

            var lower = rawReason.ToLowerInvariant();

            if (lower.Contains("550") && (lower.Contains("5.1.1") || lower.Contains("nosuchuser") || lower.Contains("does not exist") || lower.Contains("no existe") || lower.Contains("user unknown") || lower.Contains("recipient address rejected")))
            {
                return "La cuenta de correo electrónico no existe en el servidor destinatario (verifique posibles errores tipográficos en el correo).";
            }
            if (lower.Contains("mailbox is full") || lower.Contains("over quota") || lower.Contains("espacio insuficiente") || lower.Contains("552"))
            {
                return "El buzón de correo del destinatario está lleno y no tiene espacio disponible para recibir mensajes.";
            }
            if (lower.Contains("blocked") || lower.Contains("spam") || lower.Contains("blacklisted") || lower.Contains("554") || lower.Contains("relay"))
            {
                return "El servidor de correo destinatario bloqueó el mensaje por políticas de seguridad o filtro antispam.";
            }
            if (lower.Contains("domain not found") || lower.Contains("host not found") || lower.Contains("dns"))
            {
                return "El dominio del correo electrónico no existe o no tiene servidores de correo válidos.";
            }

            // Si es un mensaje largo de Google/Outlook, limpiamos URLs y códigos técnicos sobrantes
            var cleaned = Regex.Replace(rawReason, @"https?://\S+", "").Trim();
            cleaned = Regex.Replace(cleaned, @"smtp;\s*", "", RegexOptions.IgnoreCase).Trim();
            if (cleaned.Length > 180)
            {
                cleaned = cleaned.Substring(0, 180).Trim() + "...";
            }

            return cleaned;
        }
    }
}
