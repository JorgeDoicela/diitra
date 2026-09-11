using System.Collections.Generic;
using System.Threading.Tasks;

namespace diitra_application.Common.Notifications
{
    public class WelcomeNotificationResult
    {
        public bool Sent { get; set; }
        public string? Titulo { get; set; }
        public string? Mensaje { get; set; }
        public string? UrlAccion { get; set; }
    }

    public interface INotificationService
    {
        Task NotifyUserAsync(int userId, string title, string body, string category = "SISTEMA", string? url = null, Dictionary<string, string>? extraData = null);
        Task BroadcastAsync(string title, string body, string? role = null, string? url = null, Dictionary<string, string>? extraData = null);
        Task NotifyByRoleCodesAsync(string title, string body, IEnumerable<string> roleCodes, string? url = null, Dictionary<string, string>? extraData = null, int? excludeUserId = null);
        Task<IEnumerable<object>> GetMyNotificationsAsync(int userId);
        Task<bool> MarkAsReadAsync(string uuid);
        Task MarkAllAsReadAsync(int userId);
        Task<bool> DeleteNotificationAsync(string uuid);
        Task ClearReadNotificationsAsync(int userId);
        Task SubscribeUserAsync(int userId, string deviceToken, string plataforma);
        Task UnsubscribeUserAsync(int userId, string deviceToken);
        Task<WelcomeNotificationResult> TriggerWelcomeNotificationAsync(int userId);
    }
}

