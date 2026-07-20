using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IProjectWizardService
    {
        Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null);
        Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef);
        Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef);
        Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef);
    }
}
