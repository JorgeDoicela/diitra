using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace diitra_application.Common.Notifications
{
    public interface IEmailEngineService
    {
        Task<IEnumerable<EmailTemplateDto>> GetTemplatesAsync();
        Task<EmailTemplateDto?> GetTemplateByIdAsync(int id);
        Task<EmailTemplateDto?> GetTemplateByCodigoAsync(string codigo);
        Task<EmailTemplateDto> CreateTemplateAsync(EmailTemplateDto template);
        Task<EmailTemplateDto> UpdateTemplateAsync(EmailTemplateDto template);
        Task DeleteTemplateAsync(int id);
        Task<IEnumerable<EmailHistorialDto>> GetEmailHistoryAsync(int limit = 100);
        Task<bool> SendTemplatedEmailAsync(EmailSendRequest request);
        Task<IEnumerable<object>> GetUnfinishedProjectsAsync();
        Task<bool> MarkProjectAsUnfinishedAsync(int projectId, string reason);
        Task<bool> AdoptProjectAsync(int projectId, int newDirectorUserId);
    }

    public class EmailTemplateDto
    {
        public int IdEmailTemplate { get; set; }
        public string Uuid { get; set; } = null!;
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Asunto { get; set; } = null!;
        public string CuerpoHtml { get; set; } = null!;
        public bool Activo { get; set; } = true;
        public DateTime FechaCreado { get; set; }
        public DateTime FechaActualizado { get; set; }
    }

    public class EmailHistorialDto
    {
        public int IdEmailHistorial { get; set; }
        public string Uuid { get; set; } = null!;
        public string Destinatario { get; set; } = null!;
        public int? IdUsuarioDestinatario { get; set; }
        public string? NombreDestinatario { get; set; }
        public string Asunto { get; set; } = null!;
        public string Cuerpo { get; set; } = null!;
        public string Estado { get; set; } = "Pendiente";
        public string? ErrorMensaje { get; set; }
        public DateTime FechaEnvio { get; set; }
        public string? AdjuntosJson { get; set; }
        public string? MetadataJson { get; set; }
    }

    public class EmailSendRequest
    {
        public string? TemplateCodigo { get; set; }
        public List<string> DestinatariosEmails { get; set; } = new List<string>();
        public List<int> DestinatariosUserIds { get; set; } = new List<int>();
        public string? TargetRole { get; set; }
        public int? TargetCarreraId { get; set; }
        
        public string? CustomSubject { get; set; }
        public string? CustomBody { get; set; }
        
        public Dictionary<string, string> TemplateData { get; set; } = new Dictionary<string, string>();
        public List<EmailAttachmentDto> Attachments { get; set; } = new List<EmailAttachmentDto>();

        public string? EntityUuid { get; set; }
        public string? EntityType { get; set; }

        public string? CertificateBase64 { get; set; }
        public string? SignaturePassword { get; set; }
    }

    public class EmailAttachmentDto
    {
        public string NombreArchivo { get; set; } = null!;
        public string? RutaArchivo { get; set; }
        public string? Base64Content { get; set; }
        public string? ContentType { get; set; }
    }
}
