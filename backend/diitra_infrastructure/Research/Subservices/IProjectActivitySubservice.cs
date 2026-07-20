using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectActivitySubservice
    {
        Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20);
    }
}
