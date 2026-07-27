using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public class ProjectTeamService : IProjectTeamService
    {
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ProjectTeamService> _logger;
        private readonly IProjectTeamChangeService _teamChangeService;
        private readonly IProjectTeamSyncService _teamSyncService;

        public ProjectTeamService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            INotificationService notificationService,
            IProjectTeamChangeService teamChangeService,
            IProjectTeamSyncService teamSyncService,
            ILogger<ProjectTeamService> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _notificationService = notificationService;
            _teamChangeService = teamChangeService;
            _teamSyncService = teamSyncService;
            _logger = logger;
        }

        public async Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores, string? grupoInvestigacion = null, bool? tieneGrupoInvestigacion = null)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectosCarreras)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            string beforeJson = project.MetadataCacesJson ?? "{}";

            var isAssociativeRequested = tieneGrupoInvestigacion ?? (investigadores.Count > 1 || !string.IsNullOrWhiteSpace(grupoInvestigacion));
            InvGrupoInvestigacion? approvedGroup = null;
            var effectiveInvestigadores = investigadores;

            if (isAssociativeRequested)
            {
                if (string.IsNullOrWhiteSpace(grupoInvestigacion))
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = "Para guardar un proyecto asociativo, debe seleccionar un grupo de investigación aprobado."
                    };
                }

                approvedGroup = await ProjectHelper.ResolveApprovedGroupAsync(_context, grupoInvestigacion);
                if (approvedGroup == null)
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = "El grupo seleccionado no existe o no está aprobado/activo."
                    };
                }

                effectiveInvestigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, investigadores);

                var activeDirector = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .FirstOrDefaultAsync(pp => pp.IdProyecto == project.IdProyecto && pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                if (activeDirector != null && activeDirector.IdUsuarioNavigation != null && !string.IsNullOrEmpty(activeDirector.IdUsuarioNavigation.IdSigafi))
                {
                    var directorCedula = activeDirector.IdUsuarioNavigation.IdSigafi.Trim();
                    var alreadyAdded = effectiveInvestigadores.Any(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == directorCedula);
                    if (!alreadyAdded)
                    {
                        decimal? directorHours = activeDirector.HorasSemanales;
                        var incomingDirector = investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == directorCedula);
                        if (incomingDirector != null)
                        {
                            directorHours = incomingDirector.HorasSemanales;
                        }

                        effectiveInvestigadores.Add(new InvestigadorDto
                        {
                            Nombre = activeDirector.IdUsuarioNavigation.Nombre,
                            Cedula = directorCedula,
                            Email = activeDirector.IdUsuarioNavigation.EmailInstitucional ?? activeDirector.IdUsuarioNavigation.IdSigafi ?? "",
                            Rol = "Director de Proyecto",
                            NivelAcademico = activeDirector.NivelAcademico,
                            Telefono = activeDirector.Telefono ?? string.Empty,
                            Activo = true,
                            HorasSemanales = directorHours,
                            FechaInicio = activeDirector.FechaInicio ?? DateTime.Now,
                            EsDirector = true
                        });
                    }
                }
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();

            if (currentPeriod == null)
            {
                return new SyncResult { Success = false, Message = "No se ha configurado un período académico activo en el sistema." };
            }

            var researchSubcatId = await _teamSyncService.GetResearchSubcatIdAsync();
            var estadosConCarga = await _teamSyncService.GetEstadosConCargaHorariaAsync();

            foreach (var inv in effectiveInvestigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null || persona.TablaSigafi == "alumno") continue;
                if (inv.Activo == false) continue;

                decimal proposedHours = inv.HorasSemanales ?? 0;

                var sigafiIdNormalizado = (persona.IdSigafi ?? "").Trim();
                var availableHours = await _context.ProfesoresActividades
                    .Where(pa => pa.IdProfesor == sigafiIdNormalizado && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                    .Select(pa => pa.HorasSemana)
                    .FirstOrDefaultAsync() ?? 0;

                var otherProjectsHours = await _context.InvProyectoParticipantes
                    .Where(pp => pp.TipoParticipante == "Docente" &&
                                 pp.IdUsuario == persona.IdUsuario &&
                                 pp.IdProyecto != project.IdProyecto &&
                                 pp.Activo != false &&
                                 pp.IdProyectoNavigation!.Activo != false &&
                                 estadosConCarga.Contains(pp.IdProyectoNavigation.Estado))
                    .SumAsync(pp => (decimal?)pp.HorasSemanales ?? 0);

                var totalProposedHours = otherProjectsHours + proposedHours;
                if (totalProposedHours > availableHours)
                {
                    return new SyncResult
                    {
                        Success = false,
                        Message = $"El docente {persona.Nombre} (C.I. {persona.IdSigafi}) excede el límite de carga horaria de investigación para el período académico activo. Horas disponibles en distributivo: {availableHours}h. Horas asignadas en otros proyectos: {otherProjectsHours}h. Horas propuestas en este proyecto: {proposedHours}h. Total: {totalProposedHours}h."
                    };
                }
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.HandlebarsTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, ProyectoDto.DefaultDeserializerOptions);
                    }
                    catch { }
                }

                if (dto == null)
                {
                    dto = new ProyectoDto
                    {
                        Uuid = project.Uuid,
                        Titulo = project.Titulo,
                        Estado = project.Estado,
                        CodigoInstitucional = project.CodigoInstitucional
                    };
                }

                if (isAssociativeRequested)
                {
                    if (approvedGroup == null)
                    {
                        return new SyncResult { Success = false, Message = "No se pudo resolver el grupo aprobado." };
                    }

                    project.TieneGrupo = true;
                    project.IdGrupo = approvedGroup.IdGrupo;
                    dto.TieneGrupoInvestigacion = true;
                    dto.GrupoInvestigacion = approvedGroup.Nombre;
                    dto.GrupoInvestigacionUuid = approvedGroup.Uuid;
                    dto.Investigadores = effectiveInvestigadores;
                }
                else
                {
                    project.TieneGrupo = false;
                    project.IdGrupo = null;
                    dto.TieneGrupoInvestigacion = false;
                    dto.GrupoInvestigacion = null;
                    dto.GrupoInvestigacionUuid = null;
                    dto.Investigadores = investigadores;
                }

                await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores ?? new List<InvestigadorDto>(), isFromWizard: false);

                var principalCarrera = project.InvProyectosCarreras.FirstOrDefault(pc => pc.Modalidad == "PRINCIPAL")?.IdCarrera
                                       ?? project.InvProyectosCarreras.FirstOrDefault()?.IdCarrera;
                await SyncProjectCarrerasAsync(project.IdProyecto, principalCarrera, dto.Investigadores);

                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                var docInstance = await _context.DocumentInstances
                    .FirstOrDefaultAsync(di => di.EntityUuid == project.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                if (docInstance != null && !string.IsNullOrEmpty(docInstance.DataSnapshotJson))
                {
                    try
                    {
                        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var snapshot = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(docInstance.DataSnapshotJson, options);
                        if (snapshot != null)
                        {
                            var merged = new Dictionary<string, object>();
                            foreach (var kvp in snapshot)
                            {
                                merged[kvp.Key] = kvp.Value;
                            }
                            merged["Investigadores"] = dto.Investigadores ?? new List<InvestigadorDto>();
                            merged["GrupoInvestigacionTipo"] = project.TieneGrupo == true ? "SI" : "NO";
                            merged["GrupoInvestigacionNombre"] = dto.GrupoInvestigacion ?? "";
                            merged["GrupoInvestigacionUuid"] = dto.GrupoInvestigacionUuid ?? "";
                            merged["TieneGrupoInvestigacion"] = project.TieneGrupo == true;

                            var newSnapshot = System.Text.Json.JsonSerializer.Serialize(merged);
                            docInstance.UpdateDataSnapshot(newSnapshot);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al sincronizar instantánea de documento desde UpdateProjectTeamAsync para proyecto UUID: {Uuid}", uuid);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string afterJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    TieneGrupo = project.TieneGrupo,
                    TotalInvestigadores = dto.Investigadores?.Count ?? 0,
                    FechaModificacion = project.FechaModificacion
                });

                await _auditService.LogActionAsync(null, "ACTUALIZAR_EQUIPO_PROYECTO", $"Equipo actualizado del proyecto \"{project.Titulo}\"", "PROYECTOS", beforeJson, afterJson);

                return new SyncResult { Success = true, Uuid = uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al actualizar equipo del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al actualizar el equipo: {ex.Message}" };
            }
        }

        public async Task<SyncResult> TransferDirectorAsync(string uuid, TransferDirectorRequest request)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectoParticipantes).ThenInclude(pp => pp.IdUsuarioNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            var currentDirectorForAudit = project.InvProyectoParticipantes
                .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

            var beforeState = new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                DirectorActual = currentDirectorForAudit?.IdUsuarioNavigation?.Nombre ?? "Sin director",
                Estado = project.Estado
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var currentDirector = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                if (currentDirector != null)
                {
                    currentDirector.Activo = false;
                    currentDirector.FechaFin = DateTime.Now;
                    currentDirector.MotivoCambio = $"Relevado por: {request.Motivo}";
                    currentDirector.EsDirector = false;

                    await _notificationService.NotifyUserAsync(
                        currentDirector.IdUsuario,
                        "Relevo de Dirección de Proyecto",
                        $"Has sido relevado como director en el proyecto: {project.Titulo}. Motivo: {request.Motivo}",
                        "INVESTIGACION",
                        $"/proyectos/{project.Uuid}",
                        new Dictionary<string, string>
                        {
                            { "Proyecto", project.Titulo ?? "Sin título" },
                            { "Rol Anterior", "Director de Proyecto" },
                            { "Motivo del Relevo", request.Motivo },
                            { "Fecha de Cambio", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                        }
                    );
                }

                var nuevoDirectorUser = await _authService.GetOrProvisionUserByCedulaAsync(request.NuevoDirectorCedula.Trim());
                if (nuevoDirectorUser == null)
                {
                    return new SyncResult { Success = false, Message = "No se pudo encontrar o registrar al nuevo director institucional." };
                }

                var existingProf = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.IdUsuario == nuevoDirectorUser.IdUsuario && pp.TipoParticipante == "Docente");

                if (existingProf != null)
                {
                    existingProf.Rol = "Director de Proyecto";
                    existingProf.EsDirector = true;
                    existingProf.Activo = true;
                    existingProf.FechaInicio = DateTime.Now;
                    existingProf.FechaFin = null;
                    existingProf.MotivoCambio = null;
                }
                else
                {
                    var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, nuevoDirectorUser.IdSigafi, nuevoDirectorUser.TablaSigafi);
                    _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = nuevoDirectorUser.IdUsuario,
                        TipoParticipante = "Docente",
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel",
                        Telefono = phone,
                        EsDirector = true,
                        Activo = true,
                        FechaInicio = DateTime.Now
                    });
                }

                await _notificationService.NotifyUserAsync(
                    nuevoDirectorUser.IdUsuario,
                    "Designación como Director de Proyecto",
                    $"Has sido designado como el nuevo Director del proyecto: {project.Titulo}",
                    "INVESTIGACION",
                    $"/proyectos/{project.Uuid}",
                    new Dictionary<string, string>
                    {
                        { "Proyecto", project.Titulo ?? "Sin título" },
                        { "Nuevo Rol", "Director de Proyecto" },
                        { "Motivo de Designación", request.Motivo },
                        { "Fecha de Designación", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                    }
                );

                var trazabilidad = new InvTrazabilidadProyecto
                {
                    Uuid = Guid.NewGuid().ToString(),
                    IdProyecto = project.IdProyecto,
                    IdUsuario = nuevoDirectorUser.IdUsuario,
                    EstadoAnterior = project.Estado,
                    EstadoNuevo = project.Estado,
                    Observacion = $"Cambio de Dirección: {request.Motivo}. {request.Descripcion}",
                    FechaTransicion = DateTime.Now
                };

                var ultimaTransicion = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .OrderByDescending(t => t.FechaTransicion)
                    .FirstOrDefaultAsync();

                trazabilidad.HashAnterior = ultimaTransicion?.HashActual;
                string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion}";
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                    trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
                }

                _context.InvTrazabilidadProyectos.Add(trazabilidad);

                await _context.SaveChangesAsync();

                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.HandlebarsTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, ProyectoDto.DefaultDeserializerOptions);
                    }
                    catch { }
                }

                if (dto == null)
                {
                    dto = new ProyectoDto
                    {
                        Uuid = project.Uuid,
                        Titulo = project.Titulo,
                        Estado = project.Estado,
                        CodigoInstitucional = project.CodigoInstitucional
                    };
                }

                var updatedParticipants = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == project.IdProyecto)
                    .ToListAsync();

                var updatedProfs = updatedParticipants.Where(pp => pp.TipoParticipante == "Docente").ToList();
                var updatedAlums = updatedParticipants.Where(pp => pp.TipoParticipante == "Alumno").ToList();

                var profCedulas = updatedProfs.Select(pp => pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "").Where(c => !string.IsNullOrEmpty(c)).ToList();
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();
                var periodId = currentPeriod?.IdPeriodo;

                var researchSubcatId = await _teamSyncService.GetResearchSubcatIdAsync();
                var estadosConCarga = await _teamSyncService.GetEstadosConCargaHorariaAsync();

                var researchHours = new List<ProfesoresActividade>();
                var otherAssignedHours = new List<InvProyectoParticipante>();
                if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
                {
                    researchHours = await _context.ProfesoresActividades
                        .Where(pa => profCedulas.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                        .ToListAsync();

                    var profUserIds = updatedProfs.Select(pp => pp.IdUsuario).Distinct().ToList();
                    otherAssignedHours = await _context.InvProyectoParticipantes
                        .Include(pp => pp.IdProyectoNavigation)
                        .Where(pp => pp.TipoParticipante == "Docente" &&
                                     profUserIds.Contains(pp.IdUsuario) &&
                                     pp.IdProyecto != project.IdProyecto &&
                                     pp.Activo != false &&
                                     estadosConCarga.Contains(pp.IdProyectoNavigation!.Estado))
                        .ToListAsync();
                }

                dto.Investigadores = updatedProfs.Select(pp => {
                    var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                    var availableHours = researchHours.Where(pa => pa.IdProfesor.Trim() == cedula).Sum(pa => pa.HorasSemana ?? 0);
                    var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);
                    return new InvestigadorDto
                    {
                        Nombre = pp.IdUsuarioNavigation?.Nombre,
                        Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                        Email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "",
                        Rol = pp.Rol,
                        NivelAcademico = pp.NivelAcademico,
                        Telefono = pp.Telefono,
                        Activo = pp.Activo ?? true,
                        FechaInicio = pp.FechaInicio,
                        FechaFin = pp.FechaFin,
                        MotivoCambio = pp.MotivoCambio,
                        HorasSemanales = pp.HorasSemanales,
                        HorasDisponibles = availableHours,
                        HorasAsignadas = assignedHours,
                        EsDirector = pp.EsDirector
                    };
                }).Concat(updatedAlums.Select(pa => new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Cedula = pa.IdUsuarioNavigation?.IdSigafi,
                    Email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "",
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = pa.Telefono,
                    Activo = pa.Activo ?? true,
                    FechaInicio = pa.FechaInicio,
                    FechaFin = pa.FechaFin,
                    MotivoCambio = pa.MotivoCambio,
                    HorasSemanales = pa.HorasSemanales,
                    EsDirector = false
                })).ToList();

                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var afterState = new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    NuevoDirector = request.NuevoDirectorCedula,
                    Motivo = request.Motivo,
                    Estado = project.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(nuevoDirectorUser.IdUsuario, "TRANSFERIR_DIRECCION", $"Transferencia de dirección del proyecto \"{project.Titulo}\"", "PROYECTOS", beforeJson, afterJson);

                return new SyncResult { Success = true, Uuid = uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al transferir dirección del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error al transferir dirección: {ex.Message}" };
            }
        }

        // ── DELEGACIÓN DE SUBSERVICIOS (FACHADA) ───────────────────────────────────

        public Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request)
            => _teamChangeService.CreateTeamChangeRequestAsync(projectUuid, requesterSigafiId, request);

        public Task<List<TeamChangeRequestRecordDto>> GetTeamChangeRequestsAsync(string projectUuid)
            => _teamChangeService.GetTeamChangeRequestsAsync(projectUuid);

        public Task<SyncResult> ReviewTeamChangeRequestAsync(string projectUuid, string requestUuid, string reviewerSigafiId, TeamChangeReviewDto review)
            => _teamChangeService.ReviewTeamChangeRequestAsync(projectUuid, requestUuid, reviewerSigafiId, review);

        public Task SyncInvestigadoresAsync(int projectId, List<InvestigadorDto>? investigadores, bool isFromWizard = false)
            => _teamSyncService.SyncInvestigadoresAsync(projectId, investigadores, isFromWizard);

        public Task<List<InvestigadorDto>> BuildProjectInvestigadoresFromGroupAsync(int groupId, int projectId, List<InvestigadorDto>? incomingInvestigadores = null)
            => _teamSyncService.BuildProjectInvestigadoresFromGroupAsync(groupId, projectId, incomingInvestigadores);

        public Task SyncProjectCarrerasAsync(int projectId, int? idCarreraPrincipal, List<InvestigadorDto>? investigadores)
            => _teamSyncService.SyncProjectCarrerasAsync(projectId, idCarreraPrincipal, investigadores);
    }
}
