using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Diitra.Application.Common.Certificates
{
    public class IssuedCertificateResultDto
    {
        public string DocumentUuid { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string RecipientRole { get; set; } = string.Empty;
        public string? RecipientCedula { get; set; }
        public string Title { get; set; } = string.Empty;
        public System.DateTime IssueDate { get; set; } = System.DateTime.UtcNow;
        public string TraceabilityCode { get; set; } = string.Empty;
        public byte[] PdfBytes { get; set; } = System.Array.Empty<byte>();
        public string FileName { get; set; } = "certificado.pdf";
    }

    public class CertificateVerificationResultDto
    {
        public bool IsValid { get; set; }
        public string RecipientName { get; set; } = string.Empty;
        public string RecipientRole { get; set; } = string.Empty;
        public string? RecipientCedula { get; set; }
        public string CertificateType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public System.DateTime IssueDate { get; set; }
        public string TraceabilityCode { get; set; } = string.Empty;
        public int TemplateVersion { get; set; }
        public string Issuer { get; set; } = "Instituto Superior Tecnológico DIITRA";
    }

    /// <summary>
    /// Contrato desacoplado para la emisión y verificación de certificados institucionales.
    /// Soporta estudiantes, docentes, directores de investigación, grupos e individuales.
    /// </summary>
    public interface ICertificateIssuanceService
    {
        /// <summary>
        /// Otorga certificados de completación a todos los integrantes (estudiantes, docentes, director) de un proyecto finalizado.
        /// </summary>
        Task<IEnumerable<IssuedCertificateResultDto>> IssueProjectCompletionCertificatesAsync(int proyectoId, string issuedBy, CancellationToken ct = default);

        /// <summary>
        /// Otorga certificados de reconocimiento a los miembros de un Grupo o Semillero de Investigación.
        /// </summary>
        Task<IEnumerable<IssuedCertificateResultDto>> IssueGroupMilestoneCertificatesAsync(int grupoId, string milestoneTitle, string issuedBy, CancellationToken ct = default);

        /// <summary>
        /// Emite un certificado individual directo a un usuario con rol específico.
        /// </summary>
        Task<IssuedCertificateResultDto> IssueIndividualCertificateAsync(string userCedula, string recipientRole, string certificateTitle, string certificateDescription, string templateCode, string issuedBy, CancellationToken ct = default);

        /// <summary>
        /// Verifica la validez y trazabilidad de un certificado emitido mediante su UUID o código QR.
        /// </summary>
        Task<CertificateVerificationResultDto?> VerifyCertificateAsync(string certificateUuid, CancellationToken ct = default);

        /// <summary>
        /// Obtiene el historial de certificados emitidos para un usuario específico (por su cédula o ID de usuario).
        /// </summary>
        Task<IEnumerable<IssuedCertificateResultDto>> GetCertificatesForUserAsync(string userCedulaOrId, CancellationToken ct = default);
    }
}
