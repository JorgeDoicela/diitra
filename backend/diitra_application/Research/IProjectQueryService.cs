using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IProjectQueryService
    {
        Task<List<ProyectoResumenDto>> GetAllProjectsAsync();
        Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia);
        Task<ProyectoDto?> GetProjectDetailAsync(string uuid);
        Task<string?> ResolveCanonicalUuidAsync(string identifier);
        Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin);
        Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20);
    }
}
