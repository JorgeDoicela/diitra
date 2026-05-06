using Diitra.Domain.Common.Documents;

namespace Diitra.Application.Common.Documents
{
    /// <summary>
    /// Repositorio para las plantillas de documentos institucionales.
    /// La implementación vive en Infrastructure (EF Core).
    /// </summary>
    public interface IDocumentTemplateRepository
    {
        Task<DocumentTemplate?> FindByCodeAsync(string code, CancellationToken cancellationToken = default);
        Task<IEnumerable<DocumentTemplate>> GetAllActiveAsync(CancellationToken cancellationToken = default);
        Task SaveAsync(DocumentTemplate template, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repositorio para el registro de auditoría de documentos emitidos.
    /// Permite a la institución demostrar ante el CACES qué documentos fueron generados,
    /// cuándo, por quién y con qué versión de plantilla (cumplimiento LOPDP).
    /// </summary>
    public interface IDocumentAuditRepository
    {
        Task RegisterEmissionAsync(DocumentAuditEntry entry, CancellationToken cancellationToken = default);
        Task<DocumentAuditEntry?> FindByTraceabilityCodeAsync(string code, CancellationToken cancellationToken = default);
    }
}
