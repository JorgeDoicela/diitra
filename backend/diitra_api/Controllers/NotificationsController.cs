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
        public async Task<IActionResult> GetMyNotifications()
        {
            // Usar el claim id_usuario que contiene la PK numérica
            var userIdStr = User.FindFirst("id_usuario")?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetMyNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpPatch("{uuid}/read")]
        public async Task<IActionResult> MarkAsRead(string uuid)
        {
            var result = await _notificationService.MarkAsReadAsync(uuid);
            if (result) return Ok();
            return NotFound();
        }
    }
}
