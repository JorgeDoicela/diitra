using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectWizardClassificationSubservice
    {
        Task<SyncResult?> SyncResearchGroupAndAssociativeAsync(InvProyecto project, ProyectoDto dto);
        Task<SyncResult?> SyncConvocatoriaAndObjectivesPndAsync(InvProyecto project, ProyectoDto dto);
        Task SyncProgramAndTypesAsync(InvProyecto project, ProyectoDto dto);
        Task SyncAcademicDomainAndCareersAsync(InvProyecto project, ProyectoDto dto);
        Task SyncGroupMembersAndCreatorAsync(InvProyecto project, ProyectoDto dto, string? creatorUserIdRef, bool isOversightUser);
    }
}
