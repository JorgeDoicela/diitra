using System.Threading.Tasks;

namespace diitra_application.Common.Notifications
{
    public interface INotificationService
    {
        Task NotifyUserAsync(int userId, string title, string body, string category = "SISTEMA", string? url = null);
        Task BroadcastAsync(string title, string body, string? role = null);
        Task<IEnumerable<object>> GetMyNotificationsAsync(int userId);
        Task<bool> MarkAsReadAsync(string uuid);
    }
}
