using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Domain.Common.Documents;

namespace Diitra.Application.Common.Documents
{
    public interface IDocumentInstanceService
    {
        Task<DocumentInstance> CreateAsync(string templateCode, string entityUuid, string createdBy, string? title = null, string entityType = "Proyecto", CancellationToken ct = default);
        Task<DocumentInstance?> GetByUuidAsync(string uuid, CancellationToken ct = default);
        Task<IEnumerable<DocumentInstance>> GetByEntityAsync(string entityUuid, CancellationToken ct = default);
        Task<IEnumerable<DocumentInstance>> GetAllAsync(int limit = 20, CancellationToken ct = default);
        Task<DocumentInstance> FinalizeAsync(string uuid, byte[] pdfContent, string fileName, string hash, string traceabilityCode, CancellationToken ct = default);
    }
}
