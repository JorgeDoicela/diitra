using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;

namespace diitra_application.Research
{
    public interface IGroupDocumentOrchestrator
    {
        Task<DocumentResult> GenerateProposalDocumentAsync(string groupUuid, string? requestedBy = null, bool isDraft = false, CancellationToken ct = default);
        Task<object> BuildGroupDocumentDataAsync(string groupUuid, CancellationToken ct = default);
    }
}
