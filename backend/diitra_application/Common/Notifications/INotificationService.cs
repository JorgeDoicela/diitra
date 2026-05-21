using System.Threading.Tasks;

namespace diitra_application.Common.Notifications
{
    public interface INotificationService
    {
        Task NotifyUserAsync(int userId, string title, string body, string category = "SISTEMA", string? url = null, Dictionary<string, string>? extraData = null);
        Task BroadcastAsync(string title, string body, string? role = null, string? url = null, Dictionary<string, string>? extraData = null);
        Task NotifyByRoleCodesAsync(string title, string body, IEnumerable<string> roleCodes, string? url = null, Dictionary<string, string>? extraData = null);
        Task<IEnumerable<object>> GetMyNotificationsAsync(int userId);
        Task<bool> MarkAsReadAsync(string uuid);
    }
}
