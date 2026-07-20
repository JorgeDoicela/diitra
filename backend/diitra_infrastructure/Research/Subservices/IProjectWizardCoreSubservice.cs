using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectWizardCoreSubservice
    {
        Task<(InvProyecto? Project, SyncResult? Error, string? BeforeJson)> ResolveOrCreateProjectCoreAsync(ProyectoDto dto);
        Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef);
        Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef);
        Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef);
        Task SaveChangesWithConcurrencyResolutionAsync();
        Task<bool> IsOversightUserAsync(int idUsuario);
    }
}
