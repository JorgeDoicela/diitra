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
    }
}
