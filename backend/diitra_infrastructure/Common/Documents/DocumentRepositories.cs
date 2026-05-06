using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Implementación EF Core del repositorio de plantillas.
    /// </summary>
    public class DocumentTemplateRepository : IDocumentTemplateRepository
    {
        private readonly DiitraContext _context;
        public DocumentTemplateRepository(DiitraContext context) => _context = context;

        public async Task<DocumentTemplate?> FindByCodeAsync(string code, CancellationToken ct = default)
            => await _context.Set<DocumentTemplate>()
                .FirstOrDefaultAsync(t => t.Code == code && t.IsActive, ct);

        public async Task<IEnumerable<DocumentTemplate>> GetAllActiveAsync(CancellationToken ct = default)
            => await _context.Set<DocumentTemplate>()
                .Where(t => t.IsActive)
                .OrderBy(t => t.Category)
                .ToListAsync(ct);

        public async Task SaveAsync(DocumentTemplate template, CancellationToken ct = default)
        {
            if (_context.Entry(template).State == EntityState.Detached)
                _context.Set<DocumentTemplate>().Update(template);
            await _context.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// Implementación EF Core del repositorio de auditoría documental.
    /// </summary>
    public class DocumentAuditRepository : IDocumentAuditRepository
    {
        private readonly DiitraContext _context;
        public DocumentAuditRepository(DiitraContext context) => _context = context;

        public async Task RegisterEmissionAsync(DocumentAuditEntry entry, CancellationToken ct = default)
        {
            _context.Set<DocumentAuditEntry>().Add(entry);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<DocumentAuditEntry?> FindByTraceabilityCodeAsync(string code, CancellationToken ct = default)
            => await _context.Set<DocumentAuditEntry>()
                .FirstOrDefaultAsync(e => e.TraceabilityCode == code, ct);
    }
}
