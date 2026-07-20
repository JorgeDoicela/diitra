using System.Threading.Tasks;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Common.Notifications
{
    public interface IEmailSenderSubservice
    {
        Task<bool> SendTemplatedEmailAsync(EmailSendRequest request);
    }
}
