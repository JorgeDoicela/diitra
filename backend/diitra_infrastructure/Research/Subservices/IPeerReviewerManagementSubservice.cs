using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IPeerReviewerManagementSubservice
    {
        Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(string query, bool soloExternos, string? projectUuid);
        Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId);
        Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync();
    }
}
