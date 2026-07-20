using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IPeerReviewQuerySubservice
    {
        Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync();
        Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync();
        Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid);
        Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId);
    }
}
