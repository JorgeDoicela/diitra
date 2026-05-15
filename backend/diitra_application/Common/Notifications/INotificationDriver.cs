using System.Threading.Tasks;

namespace diitra_application.Common.Notifications
{
    public interface INotificationDriver
    {
        string Name { get; }
        Task SendAsync(string recipient, string title, string body, string? url = null, string? recipientName = null, Dictionary<string, string>? extraData = null);
    }
}
