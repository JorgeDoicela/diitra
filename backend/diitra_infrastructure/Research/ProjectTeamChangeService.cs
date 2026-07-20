using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public class ProjectTeamChangeService : IProjectTeamChangeService
    {
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly IProjectQueryService _queryService;
        private readonly IProjectSecurityService _securityService;
        private readonly IProjectTeamSyncService _teamSyncService;
        private readonly ILogger<ProjectTeamChangeService> _logger;

        public ProjectTeamChangeService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            IProjectQueryService queryService,
            IProjectSecurityService securityService,
            IProjectTeamSyncService teamSyncService,
            ILogger<ProjectTeamChangeService> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _queryService = queryService;
            _securityService = securityService;
            _teamSyncService = teamSyncService;
            _logger = logger;
        }

        public async Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request)
        {
            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            if (request == null || string.IsNullOrWhiteSpace(request.Tipo) || string.IsNullOrWhiteSpace(request.Motivo))
            {
                return new SyncResult { Success = false, Message = "Debe indicar tipo de cambio y motivo de la solicitud." };
            }

            var tipo = request.Tipo.Trim().ToUpperInvariant();
            if (tipo != "ALTA" && tipo != "BAJA" && tipo != "CAMBIO_DIRECTOR" && tipo != "CAMBIO_GRUPO")
            {
                return new SyncResult { Success = false, Message = "Tipo de solicitud inválido. Use: ALTA, BAJA, CAMBIO_DIRECTOR o CAMBIO_GRUPO." };
            }

            if (string.IsNullOrWhiteSpace(request.CedulaObjetivo))
            {
                return new SyncResult { Success = false, Message = tipo == "CAMBIO_GRUPO" ? "Debe especificar el grupo objetivo para la solicitud." : "Debe especificar la cédula objetivo para la solicitud." };
            }

            var requester = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == requesterSigafiId);
            if (requester == null)
            {
                return new SyncResult { Success = false, Message = "No se pudo identificar al solicitante." };
            }

            var tracePayload = new TeamChangeTracePayload
            {
                Modulo = "CAMBIO_EQUIPO",
                Estado = "PENDIENTE",
                Tipo = tipo,
                CedulaObjetivo = request.CedulaObjetivo?.Trim(),
                RolPropuesto = string.IsNullOrWhiteSpace(request.RolPropuesto) ? null : ProjectHelper.NormalizeRole(request.RolPropuesto.Trim()),
                Motivo = request.Motivo.Trim(),
                ResolucionReferencia = string.IsNullOrWhiteSpace(request.ResolucionReferencia) ? null : request.ResolucionReferencia.Trim(),
                Observacion = string.IsNullOrWhiteSpace(request.Observacion) ? null : request.Observacion.Trim(),
                SolicitadoPorSigafiId = requesterSigafiId,
                FechaSolicitud = DateTime.Now,
                FechaEfectiva = request.FechaEfectiva
            };

            var requestUuid = Guid.NewGuid().ToString();
            var trace = new InvTrazabilidadProyecto
            {
                Uuid = requestUuid,
                IdProyecto = project.IdProyecto,
                IdUsuario = requester.IdUsuario,
                EstadoAnterior = project.Estado ?? "Borrador",
                EstadoNuevo = "SOLICITUD_CAMBIO_EQUIPO_PENDIENTE",
                Observacion = System.Text.Json.JsonSerializer.Serialize(tracePayload),
                FechaTransicion = DateTime.Now
            };

            _context.InvTrazabilidadProyectos.Add(trace);
            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(
                requester.IdUsuario,
                "SOLICITUD_CAMBIO_EQUIPO",
                $"Solicitud {tipo} registrada para proyecto {project.Uuid}",
                "INVESTIGACION",
                null,
                trace.Observacion);

            return new SyncResult
            {
                Success = true,
                Uuid = requestUuid,
                Message = "Solicitud de cambio de equipo registrada."
            };
        }

        public async Task<List<TeamChangeRequestRecordDto>> GetTeamChangeRequestsAsync(string projectUuid)
        {
            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null)
            {
                return new List<TeamChangeRequestRecordDto>();
            }

            var traces = await _context.InvTrazabilidadProyectos
                .Where(t => t.IdProyecto == project.IdProyecto && t.EstadoNuevo.StartsWith("SOLICITUD_CAMBIO_EQUIPO"))
                .OrderByDescending(t => t.FechaTransicion)
                .ToListAsync();

            var userIds = traces
                .Where(t => t.IdUsuario.HasValue)
                .Select(t => t.IdUsuario!.Value)
                .Distinct()
                .ToList();

            var usersById = await _context.Users
                .Where(u => userIds.Contains(u.IdUsuario))
                .ToDictionaryAsync(u => u.IdUsuario, u => u.Nombre);

            var result = new List<TeamChangeRequestRecordDto>();
            foreach (var trace in traces)
            {
                var payload = ParseTeamChangePayload(trace.Observacion);
                if (payload == null) continue;

                string? requesterName = null;
                if (trace.IdUsuario.HasValue)
                {
                    usersById.TryGetValue(trace.IdUsuario.Value, out requesterName);
                }

                string? reviewerName = null;
                if (!string.IsNullOrWhiteSpace(payload.RevisadoPorSigafiId))
                {
                    reviewerName = await _context.Users
                        .Where(u => u.IdSigafi == payload.RevisadoPorSigafiId)
                        .Select(u => u.Nombre)
                        .FirstOrDefaultAsync();
                }

                result.Add(new TeamChangeRequestRecordDto
                {
                    RequestUuid = trace.Uuid,
                    Estado = payload.Estado ?? "PENDIENTE",
                    Tipo = payload.Tipo ?? "N/A",
                    CedulaObjetivo = payload.CedulaObjetivo,
                    RolPropuesto = payload.RolPropuesto,
                    Motivo = payload.Motivo ?? string.Empty,
                    ResolucionReferencia = payload.ResolucionReferencia,
                    ResolucionAprobacion = payload.ResolucionAprobacion,
                    Observacion = payload.ObservacionRevision ?? payload.Observacion,
                    SolicitadoPor = requesterName,
                    RevisadoPor = reviewerName,
                    FechaSolicitud = payload.FechaSolicitud ?? trace.FechaTransicion ?? DateTime.MinValue,
                    FechaRevision = payload.FechaRevision,
                    FechaEfectiva = payload.FechaEfectiva
                });
            }

            return result;
        }

        public async Task<SyncResult> ReviewTeamChangeRequestAsync(string projectUuid, string requestUuid, string reviewerSigafiId, TeamChangeReviewDto review)
        {
            if (!await _securityService.IsSystemAdminAsync(reviewerSigafiId))
            {
                return new SyncResult
                {
                    Success = false,
                    Message = "Solo el administrador del sistema puede aprobar o rechazar solicitudes de cambio de equipo."
                };
            }

            var canonicalUuid = await _queryService.ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            var trace = await _context.InvTrazabilidadProyectos
                .FirstOrDefaultAsync(t => t.IdProyecto == project.IdProyecto && t.Uuid == requestUuid && t.EstadoNuevo.StartsWith("SOLICITUD_CAMBIO_EQUIPO"));
            if (trace == null)
            {
                return new SyncResult { Success = false, Message = "Solicitud de cambio no encontrada." };
            }

            var payload = ParseTeamChangePayload(trace.Observacion);
            if (payload == null || payload.Modulo != "CAMBIO_EQUIPO")
            {
                return new SyncResult { Success = false, Message = "La solicitud no tiene un formato de trazabilidad válido." };
            }

            if (!string.Equals(payload.Estado, "PENDIENTE", StringComparison.OrdinalIgnoreCase))
            {
                return new SyncResult { Success = false, Message = $"La solicitud ya fue procesada ({payload.Estado})." };
            }

            var reviewer = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == reviewerSigafiId);
            if (reviewer == null)
            {
                return new SyncResult { Success = false, Message = "No se pudo identificar al revisor." };
            }

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                payload.RevisadoPorSigafiId = reviewerSigafiId;
                payload.FechaRevision = DateTime.Now;
                payload.ObservacionRevision = string.IsNullOrWhiteSpace(review.ObservacionRevision) ? null : review.ObservacionRevision.Trim();

                if (!review.Aprobar)
                {
                    payload.Estado = "RECHAZADA";
                    trace.EstadoNuevo = "SOLICITUD_CAMBIO_EQUIPO_RECHAZADA";
                }
                else
                {
                    payload.ResolucionAprobacion = string.IsNullOrWhiteSpace(review.ResolucionAprobacion) ? null : review.ResolucionAprobacion.Trim();
                    payload.Estado = review.Ejecutar ? "EJECUTADA" : "APROBADA";
                    trace.EstadoNuevo = review.Ejecutar
                        ? "SOLICITUD_CAMBIO_EQUIPO_EJECUTADA"
                        : "SOLICITUD_CAMBIO_EQUIPO_APROBADA";

                    if (review.Ejecutar)
                    {
                        var executeResult = await ExecuteTeamChangeRequestAsync(project, payload);
                        if (!executeResult.Success)
                        {
                            await tx.RollbackAsync();
                            return executeResult;
                        }
                    }
                }

                trace.Observacion = System.Text.Json.JsonSerializer.Serialize(payload);
                trace.FechaTransicion = DateTime.Now;
                await _context.SaveChangesAsync();

                await _auditService.LogActionAsync(
                    reviewer.IdUsuario,
                    review.Aprobar ? "REVISAR_CAMBIO_EQUIPO_APROBAR" : "REVISAR_CAMBIO_EQUIPO_RECHAZAR",
                    $"Solicitud de cambio de equipo {requestUuid} procesada para proyecto {project.Uuid}",
                    "INVESTIGACION",
                    null,
                    trace.Observacion);

                await tx.CommitAsync();

                return new SyncResult
                {
                    Success = true,
                    Uuid = requestUuid,
                    Message = review.Aprobar
                        ? (review.Ejecutar ? "Solicitud aprobada y ejecutada." : "Solicitud aprobada.")
                        : "Solicitud de cambio de equipo rechazada."
                };
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Error al revisar solicitud de cambio de equipo {RequestUuid}", requestUuid);
                return new SyncResult { Success = false, Message = $"No se pudo procesar la solicitud: {ex.Message}" };
            }
        }

        private async Task<SyncResult> ExecuteTeamChangeRequestAsync(InvProyecto project, TeamChangeTracePayload payload)
        {
            if (string.IsNullOrWhiteSpace(payload.CedulaObjetivo))
            {
                return new SyncResult { Success = false, Message = "La solicitud no tiene cédula objetivo para ejecutar." };
            }

            var targetCedula = payload.CedulaObjetivo.Trim();

            if ((payload.Tipo ?? string.Empty).Trim().ToUpperInvariant() == "CAMBIO_GRUPO")
            {
                var approvedGroup = await _context.InvGruposInvestigacion
                    .FirstOrDefaultAsync(g => g.Uuid == targetCedula && g.Estado == "Aprobado");
                if (approvedGroup == null)
                {
                    return new SyncResult { Success = false, Message = "No se pudo encontrar un grupo de investigación aprobado con el UUID especificado." };
                }
                project.TieneGrupo = true;
                project.IdGrupo = approvedGroup.IdGrupo;

                var effectiveInvestigadores = await _teamSyncService.BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto);
                await _teamSyncService.SyncInvestigadoresAsync(project.IdProyecto, effectiveInvestigadores, isFromWizard: false);

                var dto = DeserializeProyectoMetadata(project.MetadataCacesJson);
                dto.TieneGrupoInvestigacion = true;
                dto.GrupoInvestigacion = approvedGroup.Nombre;
                dto.GrupoInvestigacionUuid = approvedGroup.Uuid;
                dto.Investigadores = effectiveInvestigadores;
                dto.Uuid = project.Uuid;
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                return new SyncResult { Success = true, Uuid = project.Uuid };
            }

            var targetUser = await _authService.GetOrProvisionUserByCedulaAsync(targetCedula);
            if (targetUser == null)
            {
                return new SyncResult { Success = false, Message = "No se pudo resolver el usuario objetivo por cédula." };
            }

            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var groupId = project.IdGrupo.Value;
                var groupMember = await _context.InvGruposMiembros
                    .FirstOrDefaultAsync(m => m.IdGrupo == groupId && m.IdUsuario == targetUser.IdUsuario);

                switch ((payload.Tipo ?? string.Empty).Trim().ToUpperInvariant())
                {
                    case "ALTA":
                        if (groupMember == null)
                        {
                            _context.InvGruposMiembros.Add(new InvGrupoMiembro
                            {
                                IdGrupo = groupId,
                                IdUsuario = targetUser.IdUsuario,
                                Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? "Co-Investigador" : ProjectHelper.NormalizeRole(payload.RolPropuesto),
                                Activo = true,
                                FechaInicio = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now)
                            });
                        }
                        else
                        {
                            groupMember.Activo = true;
                            groupMember.Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? groupMember.Rol : ProjectHelper.NormalizeRole(payload.RolPropuesto);
                            groupMember.FechaInicio = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now);
                            groupMember.FechaFin = null;
                            groupMember.MotivoSalida = null;
                        }
                        break;

                    case "BAJA":
                        if (groupMember == null || groupMember.Activo == false)
                        {
                            return new SyncResult { Success = false, Message = "No existe un integrante activo con esa cédula en el grupo." };
                        }
                        groupMember.Activo = false;
                        groupMember.FechaFin = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now);
                        groupMember.MotivoSalida = payload.Motivo;
                        break;

                    case "CAMBIO_DIRECTOR":
                        var activeMembers = await _context.InvGruposMiembros
                            .Where(m => m.IdGrupo == groupId && m.Activo != false)
                            .ToListAsync();

                        foreach (var member in activeMembers.Where(m => !string.IsNullOrWhiteSpace(m.Rol) && m.Rol!.ToLower().Contains("director")))
                        {
                            member.Rol = "Co-Investigador";
                        }

                        if (groupMember == null)
                        {
                            _context.InvGruposMiembros.Add(new InvGrupoMiembro
                            {
                                IdGrupo = groupId,
                                IdUsuario = targetUser.IdUsuario,
                                Rol = "Director de Proyecto",
                                Activo = true,
                                FechaInicio = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now)
                            });
                        }
                        else
                        {
                            groupMember.Activo = true;
                            groupMember.Rol = "Director de Proyecto";
                            groupMember.FechaInicio = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now);
                            groupMember.FechaFin = null;
                            groupMember.MotivoSalida = null;
                        }
                        break;

                    default:
                        return new SyncResult { Success = false, Message = "Tipo de cambio no soportado para ejecución." };
                }

                var effectiveInvestigadores = await _teamSyncService.BuildProjectInvestigadoresFromGroupAsync(groupId, project.IdProyecto);
                await _teamSyncService.SyncInvestigadoresAsync(project.IdProyecto, effectiveInvestigadores, isFromWizard: false);

                var dto = DeserializeProyectoMetadata(project.MetadataCacesJson);
                dto.TieneGrupoInvestigacion = true;
                dto.Investigadores = effectiveInvestigadores;
                dto.Uuid = project.Uuid;
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
            else
            {
                var dto = DeserializeProyectoMetadata(project.MetadataCacesJson);
                var currentTeam = dto.Investigadores ?? new List<InvestigadorDto>();

                switch ((payload.Tipo ?? string.Empty).Trim().ToUpperInvariant())
                {
                    case "ALTA":
                        var exists = currentTeam.Any(i => i.Cedula?.Trim() == targetCedula);
                        if (!exists)
                        {
                            currentTeam.Add(new InvestigadorDto
                            {
                                Nombre = targetUser.Nombre,
                                Cedula = targetCedula,
                                Email = targetUser.EmailInstitucional ?? targetUser.IdSigafi ?? "",
                                Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? "Co-Investigador" : ProjectHelper.NormalizeRole(payload.RolPropuesto),
                                NivelAcademico = targetUser.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                                Telefono = string.Empty,
                                Activo = true,
                                HorasSemanales = 0,
                                EsDirector = false
                            });
                        }
                        else
                        {
                            var existing = currentTeam.First(i => i.Cedula?.Trim() == targetCedula);
                            existing.Activo = true;
                            existing.Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? existing.Rol : ProjectHelper.NormalizeRole(payload.RolPropuesto);
                            existing.EsDirector = false;
                        }
                        break;

                    case "BAJA":
                        var memberToRemove = currentTeam.FirstOrDefault(i => i.Cedula?.Trim() == targetCedula);
                        if (memberToRemove == null)
                        {
                            return new SyncResult { Success = false, Message = "El integrante no pertenece al equipo del proyecto." };
                        }
                        memberToRemove.Activo = false;
                        memberToRemove.FechaFin = payload.FechaEfectiva ?? DateTime.Now;
                        memberToRemove.MotivoCambio = payload.Motivo;
                        break;

                    case "CAMBIO_DIRECTOR":
                        foreach (var member in currentTeam)
                        {
                            if (member.Rol?.ToLower().Contains("director") == true)
                            {
                                member.Rol = "Co-Investigador";
                                member.EsDirector = false;
                            }
                        }

                        var existingDir = currentTeam.FirstOrDefault(i => i.Cedula?.Trim() == targetCedula);
                        if (existingDir != null)
                        {
                            existingDir.Activo = true;
                            existingDir.Rol = "Director de Proyecto";
                            existingDir.EsDirector = true;
                        }
                        else
                        {
                            currentTeam.Add(new InvestigadorDto
                            {
                                Nombre = targetUser.Nombre,
                                Cedula = targetCedula,
                                Email = targetUser.EmailInstitucional ?? targetUser.IdSigafi ?? "",
                                Rol = "Director de Proyecto",
                                NivelAcademico = targetUser.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                                Telefono = string.Empty,
                                Activo = true,
                                HorasSemanales = 0,
                                EsDirector = true
                            });
                        }
                        break;

                    default:
                        return new SyncResult { Success = false, Message = "Tipo de cambio no soportado para ejecución." };
                }

                dto.Investigadores = currentTeam;
                dto.Uuid = project.Uuid;
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await _teamSyncService.SyncInvestigadoresAsync(project.IdProyecto, currentTeam, isFromWizard: false);
                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
        }

        private ProyectoDto DeserializeProyectoMetadata(string? metadataJson)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
            {
                return new ProyectoDto();
            }

            try
            {
                var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(metadataJson);
                return System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ProyectoDto();
            }
            catch
            {
                return new ProyectoDto();
            }
        }

        private TeamChangeTracePayload? ParseTeamChangePayload(string? observacion)
        {
            if (string.IsNullOrWhiteSpace(observacion))
            {
                return null;
            }

            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<TeamChangeTracePayload>(observacion);
            }
            catch
            {
                return null;
            }
        }

        private sealed class TeamChangeTracePayload
        {
            public string Modulo { get; set; } = "CAMBIO_EQUIPO";
            public string? Estado { get; set; }
            public string? Tipo { get; set; }
            public string? CedulaObjetivo { get; set; }
            public string? RolPropuesto { get; set; }
            public string? Motivo { get; set; }
            public string? ResolucionReferencia { get; set; }
            public string? ResolucionAprobacion { get; set; }
            public string? Observacion { get; set; }
            public string? ObservacionRevision { get; set; }
            public string? SolicitadoPorSigafiId { get; set; }
            public string? RevisadoPorSigafiId { get; set; }
            public DateTime? FechaSolicitud { get; set; }
            public DateTime? FechaRevision { get; set; }
            public DateTime? FechaEfectiva { get; set; }
        }
    }
}
