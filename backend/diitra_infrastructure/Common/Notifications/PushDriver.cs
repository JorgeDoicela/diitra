using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using diBase = diitra_infrastructure.data.models;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace diitra_infrastructure.Common.Notifications
{
    public class PushDriver : INotificationDriver
    {
        private readonly DiitraContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PushDriver> _logger;

        public string Name => "PushMobile";

        public PushDriver(
            DiitraContext context,
            IConfiguration configuration,
            ILogger<PushDriver> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string title, string body, string? url = null, string? recipientName = null, Dictionary<string, string>? extraData = null)
        {
            // El 'recipient' para PushMobile es el ID del usuario en formato string
            if (!int.TryParse(recipient, out var userId))
            {
                _logger.LogWarning("El recipiente '{Recipient}' no es un ID de usuario válido en PushDriver", recipient);
                return;
            }

            // 1. Obtener todas las suscripciones activas del usuario
            var tokens = await _context.InvDispositivosTokens
                .Where(t => t.IdUsuario == userId)
                .ToListAsync();

            if (tokens.Count == 0)
            {
                _logger.LogInformation("Usuario {UserId} no tiene dispositivos registrados para Push", userId);
                return;
            }

            var webPushTokens = tokens.Where(t => t.Plataforma == "web_push").ToList();
            var mobileTokens = tokens.Where(t => t.Plataforma != "web_push").ToList();

            // 2. Procesar Web Push (Estándar VAPID)
            if (webPushTokens.Any())
            {
                await SendWebPushNotificationsAsync(userId, webPushTokens, title, body, url);
            }

            // 3. Procesar Push Móvil Simulado (o futuros controladores)
            foreach (var mobileToken in mobileTokens)
            {
                _logger.LogInformation("[PUSH MOBILE READY] Simulación de envío a Usuario {UserId} (Token: {Token}, Plataforma: {Platform}): {Title}", 
                    userId, mobileToken.DeviceToken, mobileToken.Plataforma, title);
            }
        }

        private async Task SendWebPushNotificationsAsync(int userId, List<InvDispositivoToken> tokens, string title, string body, string? url)
        {
            var vapidPublicKey = _configuration["WebPush:PublicKey"];
            var vapidPrivateKey = _configuration["WebPush:PrivateKey"];
            var vapidSubject = _configuration["WebPush:Subject"] ?? "mailto:ismael02doicela@gmail.com";

            if (string.IsNullOrEmpty(vapidPublicKey) || string.IsNullOrEmpty(vapidPrivateKey))
            {
                _logger.LogWarning("Configuración de WebPush incompleta en appsettings.json. Omitiendo envío.");
                return;
            }

            var vapidDetails = new VapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
            
            // Payload que leerá el Service Worker en el navegador
            var payloadObj = new
            {
                title = title,
                body = body,
                url = url,
                timestamp = DateTime.UtcNow
            };
            var payload = JsonSerializer.Serialize(payloadObj);

            using var webPushClient = new WebPushClient();

            foreach (var token in tokens)
            {
                try
                {
                    // Deserializar el objeto de suscripción que guardó el frontend (soporta formato condensado y JSON)
                    WebPushSubscriptionDto? subscriptionData;
                    if (token.DeviceToken.Contains('|'))
                    {
                        var parts = token.DeviceToken.Split('|');
                        subscriptionData = new WebPushSubscriptionDto
                        {
                            endpoint = parts[0],
                            keys = new WebPushKeysDto
                            {
                                p256dh = parts.Length > 1 ? parts[1] : "",
                                auth = parts.Length > 2 ? parts[2] : ""
                            }
                        };
                    }
                    else
                    {
                        subscriptionData = JsonSerializer.Deserialize<WebPushSubscriptionDto>(
                            token.DeviceToken, 
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                    }

                    if (subscriptionData == null || string.IsNullOrEmpty(subscriptionData.endpoint))
                    {
                        _logger.LogWarning("Token de dispositivo {TokenId} tiene formato inválido", token.IdToken);
                        continue;
                    }

                    var subscription = new WebPush.PushSubscription(
                        subscriptionData.endpoint,
                        subscriptionData.keys?.p256dh,
                        subscriptionData.keys?.auth
                    );

                    await webPushClient.SendNotificationAsync(subscription, payload, vapidDetails);
                    _logger.LogInformation("Notificación Web Push enviada con éxito al dispositivo {TokenId} del usuario {UserId}", token.IdToken, userId);
                }
                catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    // Si el navegador expiró la suscripción o se revocó el permiso, limpiamos la base de datos automáticamente
                    _logger.LogWarning("Suscripción de Web Push {TokenId} ha expirado o ya no es válida (HTTP {Status}). Eliminándola de la base de datos...", token.IdToken, ex.StatusCode);
                    _context.InvDispositivosTokens.Remove(token);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error inesperado enviando Web Push al dispositivo {TokenId} del usuario {UserId}", token.IdToken, userId);
                }
            }

            await _context.SaveChangesAsync();
        }
    }

    // Clases DTO internas para mapear la suscripción recibida del navegador
    public class WebPushSubscriptionDto
    {
        public string endpoint { get; set; } = null!;
        public WebPushKeysDto? keys { get; set; }
    }

    public class WebPushKeysDto
    {
        public string p256dh { get; set; } = null!;
        public string auth { get; set; } = null!;
    }
}
