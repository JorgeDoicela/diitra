using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectDetailSubservice
    {
        Task<ProyectoDto?> GetProjectDetailAsync(string uuid);
    }
}
