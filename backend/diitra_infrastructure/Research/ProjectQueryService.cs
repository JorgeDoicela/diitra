using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Research.Subservices;

namespace diitra_infrastructure.Research
{
    /// <summary>
    /// Fachada (Facade) para consultas de proyectos de investigación.
    /// Delega las responsabilidades a subservicios especializados para mantener una arquitectura modular y limpia.
    /// </summary>
    public class ProjectQueryService : IProjectQueryService
    {
        private readonly IProjectLookupSubservice _lookupSubservice;
        private readonly IProjectDetailSubservice _detailSubservice;
        private readonly IProjectDashboardSubservice _dashboardSubservice;
        private readonly IProjectActivitySubservice _activitySubservice;

        /// <summary>
        /// Constructor primario para Inyección de Dependencias.
        /// </summary>
        public ProjectQueryService(
            IProjectLookupSubservice lookupSubservice,
            IProjectDetailSubservice detailSubservice,
            IProjectDashboardSubservice dashboardSubservice,
            IProjectActivitySubservice activitySubservice)
        {
            _lookupSubservice = lookupSubservice;
            _detailSubservice = detailSubservice;
            _dashboardSubservice = dashboardSubservice;
            _activitySubservice = activitySubservice;
        }

        /// <summary>
        /// Constructor de compatibilidad para instanciación directa (ej. pruebas unitarias).
        /// </summary>
        internal ProjectQueryService(DiitraContext context)
        {
            var lookup = new ProjectLookupSubservice(context);
            _lookupSubservice = lookup;
            _detailSubservice = new ProjectDetailSubservice(context, lookup);
            _dashboardSubservice = new ProjectDashboardSubservice(context);
            _activitySubservice = new ProjectActivitySubservice(context);
        }

        public Task<string?> ResolveCanonicalUuidAsync(string identifier)
            => _lookupSubservice.ResolveCanonicalUuidAsync(identifier);

        public Task<List<ProyectoResumenDto>> GetAllProjectsAsync()
            => _lookupSubservice.GetAllProjectsAsync();

        public Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia)
            => _lookupSubservice.GetMyProjectsAsync(userIdReferencia);

        public Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
            => _detailSubservice.GetProjectDetailAsync(uuid);

        public Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin)
            => _dashboardSubservice.GetDashboardStatsAsync(userIdReferencia, isAdmin);

        public Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20)
            => _activitySubservice.GetProjectActivityAsync(projectUuid, maxItems);
    }
}
