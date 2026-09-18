using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectLookupSubservice
    {
        Task<string?> ResolveCanonicalUuidAsync(string identifier);
        Task<List<ProyectoResumenDto>> GetAllProjectsAsync(string? modalidad = null);
        Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia, string? modalidad = null);
    }
}
