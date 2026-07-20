using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Common.Notifications
{
    public interface IEmailTemplateService
    {
        Task<IEnumerable<EmailTemplateDto>> GetTemplatesAsync();
        Task<EmailTemplateDto?> GetTemplateByIdAsync(int id);
        Task<EmailTemplateDto?> GetTemplateByCodigoAsync(string codigo);
        Task<EmailTemplateDto> CreateTemplateAsync(EmailTemplateDto dto);
        Task<EmailTemplateDto> UpdateTemplateAsync(EmailTemplateDto dto);
        Task DeleteTemplateAsync(int id);
        Task<IEnumerable<EmailHistorialDto>> GetEmailHistoryAsync(int limit = 100);
    }
}
