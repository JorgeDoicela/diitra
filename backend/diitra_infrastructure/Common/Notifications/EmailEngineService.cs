using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Common.Notifications
{
    public class EmailEngineService : IEmailEngineService
    {
        private readonly IEmailTemplateService _templateService;
        private readonly IEmailSenderSubservice _senderSubservice;
        private readonly IProjectAdoptionService _projectAdoptionService;

        public EmailEngineService(
            IEmailTemplateService templateService,
            IEmailSenderSubservice senderSubservice,
            IProjectAdoptionService projectAdoptionService)
        {
            _templateService = templateService;
            _senderSubservice = senderSubservice;
            _projectAdoptionService = projectAdoptionService;
        }

        public Task<IEnumerable<EmailTemplateDto>> GetTemplatesAsync() => 
            _templateService.GetTemplatesAsync();

        public Task<EmailTemplateDto?> GetTemplateByIdAsync(int id) => 
            _templateService.GetTemplateByIdAsync(id);

        public Task<EmailTemplateDto?> GetTemplateByCodigoAsync(string codigo) => 
            _templateService.GetTemplateByCodigoAsync(codigo);

        public Task<EmailTemplateDto> CreateTemplateAsync(EmailTemplateDto dto) => 
            _templateService.CreateTemplateAsync(dto);

        public Task<EmailTemplateDto> UpdateTemplateAsync(EmailTemplateDto dto) => 
            _templateService.UpdateTemplateAsync(dto);

        public Task DeleteTemplateAsync(int id) => 
            _templateService.DeleteTemplateAsync(id);

        public Task<IEnumerable<EmailHistorialDto>> GetEmailHistoryAsync(int limit = 100) => 
            _templateService.GetEmailHistoryAsync(limit);

        public Task<bool> SendTemplatedEmailAsync(EmailSendRequest request) => 
            _senderSubservice.SendTemplatedEmailAsync(request);

        public Task<IEnumerable<object>> GetUnfinishedProjectsAsync() => 
            _projectAdoptionService.GetUnfinishedProjectsAsync();

        public Task<bool> MarkProjectAsUnfinishedAsync(int projectId, string reason, int? adminUserId = null) => 
            _projectAdoptionService.MarkProjectAsUnfinishedAsync(projectId, reason, adminUserId);

        public Task<bool> AdoptProjectAsync(int projectId, int newDirectorUserId) => 
            _projectAdoptionService.AdoptProjectAsync(projectId, newDirectorUserId);
    }
}
