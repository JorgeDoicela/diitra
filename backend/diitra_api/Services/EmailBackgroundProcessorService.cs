using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Common.Notifications;
using Microsoft.AspNetCore.SignalR;
using diitra_infrastructure.Common.Notifications.Hubs;

namespace diitra_api.Services
{
    /// <summary>
    /// Servicio en segundo plano que procesa la cola de correos electrónicos pendientes (Outbox)
    /// almacenados en la tabla inv_email_historial, aplicando rate limiting y reutilización de conexiones.
    /// </summary>
    public class EmailBackgroundProcessorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EmailBackgroundProcessorService> _logger;
        private readonly IConfiguration _configuration;

        public EmailBackgroundProcessorService(
            IServiceProvider serviceProvider,
            ILogger<EmailBackgroundProcessorService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DIITRA Email Background Processor Service iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingEmailsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error en el ciclo del despachador de correos DIITRA.");
                }

                // Verificar la cola cada 10 segundos
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        private async Task ProcessPendingEmailsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<DiitraContext>();
            var layoutRenderer = scope.ServiceProvider.GetRequiredService<EmailMasterLayoutRenderer>();

            // Obtener los primeros 10 correos con estado "Pendiente"
            var pendingEmails = await context.InvEmailHistorials
                .Where(e => e.Estado == "Pendiente")
                .OrderBy(e => e.FechaEnvio)
                .Take(10)
                .ToListAsync(stoppingToken);

            if (!pendingEmails.Any())
            {
                return;
            }

            _logger.LogInformation("Se encontraron {Count} correos pendientes en la cola para procesar.", pendingEmails.Count);

            // Cargar configuración SMTP
            var host = _configuration["Email:Host"];
            var isMock = string.IsNullOrEmpty(host);

            if (!int.TryParse(_configuration["Email:Port"], out var port))
            {
                port = 587;
            }
            var smtpUser = _configuration["Email:Username"];
            var smtpPass = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:FromEmail"] ?? _configuration["Email:Username"] ?? "no-reply@diitra.local";
            var fromName = _configuration["Email:FromName"] ?? "DIITRA Notificaciones";
            var storagePath = _configuration["Storage:BasePath"] ?? Path.Combine(AppContext.BaseDirectory, "diitra_data");

            if (isMock)
            {
                _logger.LogWarning("[MOCK EMAIL ENGINE] No se configuró Email:Host. Marcando correos como Enviados en logs de forma ficticia.");
                foreach (var email in pendingEmails)
                {
                    _logger.LogWarning("[MOCK] Enviando correo a: {Destinatario} | Asunto: {Asunto}", email.Destinatario, email.Asunto);
                    email.Estado = "Enviado";
                    email.FechaEnvio = DateTime.UtcNow;
                }
                await context.SaveChangesAsync(stoppingToken);
                return;
            }

            // Inicializar el cliente SMTP para procesar el lote completo sobre la misma conexión
            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            foreach (var email in pendingEmails)
            {
                if (stoppingToken.IsCancellationRequested) break;

                _logger.LogInformation("Procesando envío de correo ID {Id} hacia {To}...", email.IdEmailHistorial, email.Destinatario);

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = email.Asunto
                };
                mailMessage.To.Add(email.Destinatario);

                // Inyectar logos y cabeceras
                layoutRenderer.SetHtmlBodyWithBranding(mailMessage, email.Cuerpo);

                // Cargar adjuntos físicos en base a su ruta registrada
                var mailAttachments = new List<Attachment>();
                if (!string.IsNullOrEmpty(email.AdjuntosJson))
                {
                    try
                    {
                        var attachments = JsonSerializer.Deserialize<List<AttachmentMeta>>(email.AdjuntosJson, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (attachments != null)
                        {
                            foreach (var att in attachments)
                            {
                                var fullPath = Path.Combine(storagePath, att.Ruta);
                                if (File.Exists(fullPath))
                                {
                                    var mailAttachment = new Attachment(fullPath)
                                    {
                                        Name = att.Nombre
                                    };
                                    mailAttachments.Add(mailAttachment);
                                    mailMessage.Attachments.Add(mailAttachment);
                                }
                                else
                                {
                                    _logger.LogWarning("Archivo adjunto no encontrado en la ruta física: {Path}", fullPath);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al deserializar o cargar adjuntos para el correo ID {Id}", email.IdEmailHistorial);
                    }
                }

                try
                {
                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Correo ID {Id} enviado exitosamente.", email.IdEmailHistorial);
                    email.Estado = "Enviado";
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Fallo al enviar correo ID {Id} por SMTP hacia {To}.", email.IdEmailHistorial, email.Destinatario);
                    email.Estado = "Fallido";
                    
                    var cleanReason = ex switch
                    {
                        SmtpFailedRecipientException fre => $"Dirección rechazada ({fre.FailedRecipient}): {fre.Message}",
                        SmtpException se => $"Error SMTP: {se.Message}",
                        FormatException fe => $"Formato inválido: {fe.Message}",
                        _ => ex.Message
                    };
                    email.ErrorMensaje = cleanReason;

                    // Notificación en tiempo real a la campana del Administrador
                    try
                    {
                        var notifService = scope.ServiceProvider.GetRequiredService<diitra_application.Common.Notifications.INotificationService>();
                        var notifTitle = "Fallo en Entrega de Correo";
                        var notifBody = $"No se pudo enviar el correo '{email.Asunto}' a <{email.Destinatario}>. Causa: {cleanReason}.";
                        var notifUrl = $"/emails?search={Uri.EscapeDataString(email.Destinatario)}";
                        var extraData = new Dictionary<string, string>
                        {
                            { "SkipEmail", "true" },
                            { "LogId", email.IdEmailHistorial.ToString() }
                        };

                        await notifService.NotifyByRoleCodesAsync(
                            title: notifTitle,
                            body: notifBody,
                            roleCodes: new[] { "DIITRA_ADMIN", "ADMINISTRADOR" },
                            url: notifUrl,
                            extraData: extraData
                        );
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogWarning(notifEx, "Error al generar la notificación interna de fallo de correo.");
                    }
                }
                finally
                {
                    // Liberar recursos de adjuntos para evitar memory leak o bloqueos de archivo
                    foreach (var att in mailAttachments)
                    {
                        att.ContentStream?.Dispose();
                    }
                }

                email.FechaEnvio = DateTime.UtcNow;
                await context.SaveChangesAsync(stoppingToken);

                // Notificar en tiempo real a la interfaz web (WebSocket SignalR)
                try
                {
                    var hubContext = scope.ServiceProvider.GetService<Microsoft.AspNetCore.SignalR.IHubContext<diitra_infrastructure.Common.Notifications.Hubs.NotificationHub>>();
                    if (hubContext != null)
                    {
                        await hubContext.Clients.All.SendAsync("EmailQueueUpdated", new
                        {
                            emailId = email.IdEmailHistorial,
                            estado = email.Estado,
                            destinatario = email.Destinatario
                        }, stoppingToken);
                    }
                }
                catch (Exception hubEx)
                {
                    _logger.LogWarning(hubEx, "Error emitiendo evento SignalR de cola de correos.");
                }

                // Rate limiting: retardo controlado de 1.5 segundos entre cada envío para evitar marcar spam
                await Task.Delay(1500, stoppingToken);
            }
        }

        private class AttachmentMeta
        {
            public string Nombre { get; set; } = null!;
            public string Ruta { get; set; } = null!;
        }
    }
}
