using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research
{
    public class ProjectOrchestrator : IProjectOrchestrator
    {
        private readonly IProjectSecurityService _securityService;
        private readonly IProjectWizardService _wizardService;
        private readonly IProjectTeamService _teamService;
        private readonly IProjectQueryService _queryService;

        public ProjectOrchestrator(
            IProjectSecurityService securityService,
            IProjectWizardService wizardService,
            IProjectTeamService teamService,
            IProjectQueryService queryService)
        {
            _securityService = securityService;
            _wizardService = wizardService;
            _teamService = teamService;
            _queryService = queryService;
        }

        public Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null)
            => _wizardService.SyncProjectWizardDataAsync(dto, creatorUserIdRef);

        public Task<List<ProyectoResumenDto>> GetAllProjectsAsync()
            => _queryService.GetAllProjectsAsync();

        public Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia)
            => _queryService.GetMyProjectsAsync(userIdReferencia);

        public Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
            => _queryService.GetProjectDetailAsync(uuid);

        public Task<string?> ResolveCanonicalUuidAsync(string identifier)
            => _queryService.ResolveCanonicalUuidAsync(identifier);

        public Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin)
            => _queryService.GetDashboardStatsAsync(userIdReferencia, isAdmin);

        public Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef)
            => _wizardService.DeleteProjectAsync(uuid, userIdRef);

        public Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef)
            => _wizardService.PurgeProjectAsync(uuid, userIdRef);

        public Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef)
            => _wizardService.RestoreProjectAsync(uuid, userIdRef);

        public Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores, string? grupoInvestigacion = null, bool? tieneGrupoInvestigacion = null)
            => _teamService.UpdateProjectTeamAsync(uuid, investigadores, grupoInvestigacion, tieneGrupoInvestigacion);

        public Task<SyncResult> TransferDirectorAsync(string uuid, TransferDirectorRequest request)
            => _teamService.TransferDirectorAsync(uuid, request);

        public Task<bool> UserCanModifyProjectAsync(string projectUuid, string userSigafiId)
            => _securityService.UserCanModifyProjectAsync(projectUuid, userSigafiId);

        public Task<bool> UserCanViewProjectAsync(string projectUuid, string userSigafiId)
            => _securityService.UserCanViewProjectAsync(projectUuid, userSigafiId);

        public Task<bool> IsSystemAdminAsync(string userSigafiId)
            => _securityService.IsSystemAdminAsync(userSigafiId);

        public Task<bool> IsProjectDirectorAsync(string projectUuid, string userSigafiId)
            => _securityService.IsProjectDirectorAsync(projectUuid, userSigafiId);

        public Task<bool> UserCanRequestTeamChangeAsync(string projectUuid, string userSigafiId)
            => _securityService.UserCanRequestTeamChangeAsync(projectUuid, userSigafiId);

        public Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20)
            => _queryService.GetProjectActivityAsync(projectUuid, maxItems);

        public Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request)
            => _teamService.CreateTeamChangeRequestAsync(projectUuid, requesterSigafiId, request);

        public Task<List<TeamChangeRequestRecordDto>> GetTeamChangeRequestsAsync(string projectUuid)
            => _teamService.GetTeamChangeRequestsAsync(projectUuid);

        public Task<SyncResult> ReviewTeamChangeRequestAsync(string projectUuid, string requestUuid, string reviewerSigafiId, TeamChangeReviewDto review)
            => _teamService.ReviewTeamChangeRequestAsync(projectUuid, requestUuid, reviewerSigafiId, review);

        public Task<int?> GetUserInternalIdBySigafiIdAsync(string sigafiId)
            => _securityService.GetUserInternalIdBySigafiIdAsync(sigafiId);
    }
}
