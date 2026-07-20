using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectDashboardSubservice
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin);
    }
}
