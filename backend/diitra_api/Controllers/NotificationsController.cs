using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using diitra_application.Common.Notifications;
using System.Security.Claims;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/Admin/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 20)
        {
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetMyNotificationsAsync(userId);
            var list = notifications.ToList();

            if (limit > 0 && limit < list.Count)
            {
                list = list.Take(limit).ToList();
            }

            return Ok(list);
        }

        [HttpPatch("{uuid}/read")]
        public async Task<IActionResult> MarkAsRead(string uuid)
        {
            var result = await _notificationService.MarkAsReadAsync(uuid);
            if (result) return Ok();
            return NotFound();
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }

        [HttpPost("test-push")]
        public async Task<IActionResult> TestPush([FromQuery] string title = "Prueba Profesional DIITRA", [FromQuery] string body = "¡Éxito! Esta es una notificación Web Push real en segundo plano.")
        {
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            await _notificationService.NotifyUserAsync(userId, title, body, "SISTEMA", "/dashboard");
            return Ok(new { message = "Push de prueba encolado y enviado." });
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] NotificationSubscribeRequest request)
        {
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            if (string.IsNullOrEmpty(request.DeviceToken))
            {
                return BadRequest("Device token is required.");
            }

            await _notificationService.SubscribeUserAsync(userId, request.DeviceToken, request.Plataforma);
            return Ok(new { message = "Subscribed successfully" });
        }

        [HttpPost("unsubscribe")]
        public async Task<IActionResult> Unsubscribe([FromBody] NotificationUnsubscribeRequest request)
        {
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            if (string.IsNullOrEmpty(request.DeviceToken))
            {
                return BadRequest("Device token is required.");
            }

            await _notificationService.UnsubscribeUserAsync(userId, request.DeviceToken);
            return Ok(new { message = "Unsubscribed successfully" });
        }
    }

    public class NotificationSubscribeRequest
    {
        public string DeviceToken { get; set; } = null!;
        public string Plataforma { get; set; } = "web_push";
    }

    public class NotificationUnsubscribeRequest
    {
        public string DeviceToken { get; set; } = null!;
    }
}
