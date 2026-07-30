using System;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Research.Subservices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace diitra_infrastructure.Research
{
    public class ProjectWizardService : IProjectWizardService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly IProjectWizardCoreSubservice _coreSubservice;
        private readonly IProjectWizardClassificationSubservice _classificationSubservice;
        private readonly IProjectWizardComponentsSubservice _componentsSubservice;
        private readonly ILogger<ProjectWizardService> _logger;

        public ProjectWizardService(
            DiitraContext context,
            IAuditService auditService,
            IProjectWizardCoreSubservice coreSubservice,
            IProjectWizardClassificationSubservice classificationSubservice,
            IProjectWizardComponentsSubservice componentsSubservice,
            ILogger<ProjectWizardService> logger)
        {
            _context = context;
            _auditService = auditService;
            _coreSubservice = coreSubservice;
            _classificationSubservice = classificationSubservice;
            _componentsSubservice = componentsSubservice;
            _logger = logger;
        }

        /// <summary>
        /// Constructor de retrocompatibilidad para pruebas unitarias e instancias directas.
        /// </summary>
        internal ProjectWizardService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            IProjectQueryService queryService,
            IProjectTeamService teamService,
            ILogger<ProjectWizardService> logger)
        {
            _context = context;
            _auditService = auditService;
            _logger = logger;

            _coreSubservice = new ProjectWizardCoreSubservice(context, auditService, NullLogger<ProjectWizardCoreSubservice>.Instance);
            _classificationSubservice = new ProjectWizardClassificationSubservice(context, teamService);
            _componentsSubservice = new ProjectWizardComponentsSubservice(context, _coreSubservice);
        }

        public async Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Localizar o Crear el Proyecto Core y Validar Estado
                var (project, error, beforeJson) = await _coreSubservice.ResolveOrCreateProjectCoreAsync(dto);
                if (error != null || project == null)
                {
                    return error ?? new SyncResult { Success = false, Message = "Error al resolver el proyecto core." };
                }

                // 2. Clasificaciones y CACES
                var groupError = await _classificationSubservice.SyncResearchGroupAndAssociativeAsync(project, dto);
                if (groupError != null) return groupError;

                var convError = await _classificationSubservice.SyncConvocatoriaAndObjectivesPndAsync(project, dto);
                if (convError != null) return convError;

                await _classificationSubservice.SyncProgramAndTypesAsync(project, dto);
                await _coreSubservice.SaveChangesWithConcurrencyResolutionAsync();

                await _classificationSubservice.SyncAcademicDomainAndCareersAsync(project, dto);

                bool isOversightUser = false;
                if (!string.IsNullOrEmpty(creatorUserIdRef))
                {
                    var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == creatorUserIdRef);
                    if (internalUser != null)
                    {
                        isOversightUser = await _coreSubservice.IsOversightUserAsync(internalUser.IdUsuario);
                    }
                }

                await _classificationSubservice.SyncGroupMembersAndCreatorAsync(project, dto, creatorUserIdRef, isOversightUser);

                // 3. Componentes del Proyecto
                var objetivosCreadosIds = await _componentsSubservice.SyncObjetivosAsync(project.IdProyecto, dto.ObjetivoGeneral, dto.GetObjetivosEspecificosAsList());
                await _componentsSubservice.SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);
                await _componentsSubservice.SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);
                await _componentsSubservice.SyncImpactosAsync(project.IdProyecto, dto.Impacto);
                await _componentsSubservice.SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);
                await _componentsSubservice.SyncCronogramaAsync(project.IdProyecto, objetivosCreadosIds, dto.Cronograma);
                await _componentsSubservice.SyncBibliografiaAsync(project.IdProyecto, dto.Bibliografia);
                await _componentsSubservice.SyncRecursosDisponiblesAsync(project.IdProyecto, dto.RecursosDisponibles);

                await _coreSubservice.SaveChangesWithConcurrencyResolutionAsync();
                await transaction.CommitAsync();

                var afterState = new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    TiempoEjecucion = project.TiempoEjecucion,
                    TieneGrupoInvestigacion = project.TieneGrupo,
                    IdGrupo = project.IdGrupo,
                    IdConvocatoria = project.IdConvocatoria,
                    IdObjetivoPnd = project.IdObjetivoPnd,
                    IdEntidadAliada = project.IdEntidadAliada,
                    TrlInicial = project.TrlInicial,
                    TrlActual = project.TrlActual,
                    TrlMeta = project.TrlMeta,
                    Estado = project.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(
                    null,
                    project.Estado == "Borrador" && dto.Uuid == null ? "CREAR_PROYECTO" : "ACTUALIZAR_PROYECTO",
                    $"Sincronización de datos del proyecto: {project.Titulo}",
                    "PROYECTOS",
                    beforeJson,
                    afterJson
                );

                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error crítico en SyncProjectWizardData para UUID: {Uuid}", dto.Uuid);
                return new SyncResult { Success = false, Message = ex.Message, Uuid = dto.Uuid };
            }
        }

        public Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef)
        {
            return _coreSubservice.DeleteProjectAsync(uuid, userIdRef);
        }

        public Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef)
        {
            return _coreSubservice.RestoreProjectAsync(uuid, userIdRef);
        }

        public Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef)
        {
            return _coreSubservice.PurgeProjectAsync(uuid, userIdRef);
        }
    }
}
