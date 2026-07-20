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
        private readonly IProjectQueryService _queryService;
        private readonly IProjectSecurityService _securityService;
        private readonly ILogger<ProjectTeamService> _logger;

        public ProjectTeamService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            INotificationService notificationService,
            IProjectQueryService queryService,
            IProjectSecurityService securityService,
            ILogger<ProjectTeamService> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _notificationService = notificationService;
            _queryService = queryService;
            _securityService = securityService;
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
                        : "Solicitud rechazada."
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

                var effectiveInvestigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto);
                await SyncInvestigadoresAsync(project.IdProyecto, effectiveInvestigadores, isFromWizard: false);

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

                var effectiveInvestigadores = await BuildProjectInvestigadoresFromGroupAsync(groupId, project.IdProyecto);
                await SyncInvestigadoresAsync(project.IdProyecto, effectiveInvestigadores, isFromWizard: false);

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

                await SyncInvestigadoresAsync(project.IdProyecto, currentTeam, isFromWizard: false);
                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
        }

        public async Task SyncInvestigadoresAsync(int projectId, List<InvestigadorDto>? investigadores, bool isFromWizard = false)
        {
            if (investigadores == null) return;

            var currentParticipants = await _context.InvProyectoParticipantes
                .Include(pp => pp.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var currentProfs = currentParticipants.Where(pp => pp.TipoParticipante == "Docente").ToList();
            var currentAlums = currentParticipants.Where(pp => pp.TipoParticipante == "Alumno").ToList();

            var activeCedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula) && i.Activo != false)
                .Select(i => i.Cedula!.Trim())
                .ToHashSet();

            if (!isFromWizard)
            {
                foreach (var prof in currentProfs)
                {
                    var cedula = prof.IdUsuarioNavigation?.IdSigafi?.Trim();
                    if (cedula != null && prof.Activo != false && !activeCedulas.Contains(cedula))
                    {
                        prof.Activo = false;
                        prof.FechaFin = DateTime.Now;
                        prof.MotivoCambio = "Retirado del equipo";
                        prof.EsDirector = false;
                    }
                }
            }

            if (!isFromWizard)
            {
                foreach (var alum in currentAlums)
                {
                    var cedula = alum.IdUsuarioNavigation?.IdSigafi?.Trim();
                    if (cedula != null && alum.Activo != false && !activeCedulas.Contains(cedula))
                    {
                        alum.Activo = false;
                        alum.FechaFin = DateTime.Now;
                        alum.MotivoCambio = "Retirado del equipo";
                    }
                }
            }

            var investigatorsToNotify = new List<InvestigadorDto>();

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null) continue;

                bool esDirector = inv.Rol?.Contains("Director") == true;

                if (persona.TablaSigafi == "alumno")
                {
                    var existingAlum = currentAlums.FirstOrDefault(pa => pa.IdUsuario == persona.IdUsuario);
                    if (existingAlum != null)
                    {
                        if (isFromWizard)
                        {
                            existingAlum.Telefono = inv.Telefono;
                            existingAlum.HorasSemanales = inv.HorasSemanales;
                        }
                        else
                        {
                            bool wasActive = existingAlum.Activo != false;
                            string oldRol = existingAlum.Rol ?? "";
                            string newRol = ProjectHelper.NormalizeRole(inv.Rol);

                            existingAlum.Rol = newRol;
                            existingAlum.NivelAcademico = inv.NivelAcademico;
                            existingAlum.Telefono = inv.Telefono;
                            existingAlum.HorasSemanales = inv.HorasSemanales;

                            bool nowActive = true;
                            if (inv.Activo == false)
                            {
                                nowActive = false;
                                if (existingAlum.Activo != false)
                                {
                                    existingAlum.Activo = false;
                                    existingAlum.FechaFin = DateTime.Now;
                                    existingAlum.MotivoCambio = "Retirado del equipo";
                                }
                            }
                            else
                            {
                                if (existingAlum.Activo == false)
                                {
                                    existingAlum.Activo = true;
                                    existingAlum.FechaInicio = DateTime.Now;
                                    existingAlum.FechaFin = null;
                                    existingAlum.MotivoCambio = null;
                                }
                            }

                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            TipoParticipante = "Alumno",
                            Rol = ProjectHelper.NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, persona.IdSigafi, persona.TablaSigafi),
                            HorasSemanales = inv.HorasSemanales,
                            Activo = inv.Activo ?? true,
                            EsDirector = false,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });

                        if (inv.Activo != false)
                        {
                            investigatorsToNotify.Add(inv);
                        }
                    }
                }
                else
                {
                    var existingProf = currentProfs.FirstOrDefault(pp => pp.IdUsuario == persona.IdUsuario);
                    if (existingProf != null)
                    {
                        if (isFromWizard)
                        {
                            existingProf.Telefono = inv.Telefono;
                            existingProf.HorasSemanales = inv.HorasSemanales;
                        }
                        else
                        {
                            bool wasActive = existingProf.Activo != false;
                            string oldRol = existingProf.Rol ?? "";
                            string newRol = ProjectHelper.NormalizeRole(inv.Rol);

                            existingProf.Rol = newRol;
                            existingProf.NivelAcademico = inv.NivelAcademico;
                            existingProf.Telefono = inv.Telefono;
                            existingProf.EsDirector = esDirector;
                            existingProf.HorasSemanales = inv.HorasSemanales;

                            bool nowActive = true;
                            if (inv.Activo == false)
                            {
                                nowActive = false;
                                if (existingProf.Activo != false)
                                {
                                    existingProf.Activo = false;
                                    existingProf.FechaFin = DateTime.Now;
                                    existingProf.MotivoCambio = "Retirado del equipo";
                                    existingProf.EsDirector = false;
                                }
                            }
                            else
                            {
                                if (existingProf.Activo == false)
                                {
                                    existingProf.Activo = true;
                                    existingProf.FechaInicio = DateTime.Now;
                                    existingProf.FechaFin = null;
                                    existingProf.MotivoCambio = null;
                                }
                            }

                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            TipoParticipante = "Docente",
                            Rol = ProjectHelper.NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, persona.IdSigafi, persona.TablaSigafi),
                            EsDirector = esDirector,
                            HorasSemanales = inv.HorasSemanales,
                            Activo = inv.Activo ?? true,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });

                        if (inv.Activo != false)
                        {
                            investigatorsToNotify.Add(inv);
                        }
                    }
                }
            }

            if (investigatorsToNotify.Count > 0)
            {
                await NotifyInvestigadoresAsync(projectId, investigatorsToNotify);
            }
        }

        public async Task<List<InvestigadorDto>> BuildProjectInvestigadoresFromGroupAsync(int groupId, int projectId, List<InvestigadorDto>? incomingInvestigadores = null)
        {
            var groupMembers = await _context.InvGruposMiembros
                .Include(m => m.IdUsuarioNavigation)
                .Where(m => m.IdGrupo == groupId && m.Activo != false && m.IdUsuarioNavigation != null && !string.IsNullOrEmpty(m.IdUsuarioNavigation.IdSigafi))
                .ToListAsync();

            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCoordinadorNavigation)
                .FirstOrDefaultAsync(g => g.IdGrupo == groupId);

            var participantes = new List<InvestigadorDto>();

            if (group?.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi))
            {
                var coordSigafi = group.IdCoordinadorNavigation.IdSigafi.Trim();
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, coordSigafi, group.IdCoordinadorNavigation.TablaSigafi);
                
                decimal? coordHours = 0;
                var coordIncoming = incomingInvestigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == coordSigafi);
                if (coordIncoming != null)
                {
                    coordHours = coordIncoming.HorasSemanales;
                }

                participantes.Add(new InvestigadorDto
                {
                    Nombre = group.IdCoordinadorNavigation.Nombre,
                    Cedula = coordSigafi,
                    Email = group.IdCoordinadorNavigation.EmailInstitucional ?? group.IdCoordinadorNavigation.IdSigafi ?? "",
                    Rol = "Coordinador de Proyecto",
                    NivelAcademico = "Tercer Nivel",
                    Telefono = phone,
                    Activo = true,
                    HorasSemanales = coordHours,
                    FechaInicio = DateTime.Now,
                    EsDirector = false
                });
            }

            foreach (var m in groupMembers)
            {
                var user = m.IdUsuarioNavigation!;
                var sigafiId = user.IdSigafi!.Trim();

                if (participantes.Any(p => p.Cedula == sigafiId)) continue;

                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, sigafiId, user.TablaSigafi);
                decimal? memberHours = 0;
                var memberIncoming = incomingInvestigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == sigafiId);
                if (memberIncoming != null)
                {
                    memberHours = memberIncoming.HorasSemanales;
                }

                participantes.Add(new InvestigadorDto
                {
                    Nombre = user.Nombre,
                    Cedula = sigafiId,
                    Email = user.EmailInstitucional ?? user.IdSigafi ?? "",
                    Rol = m.Rol ?? "Co-Investigador",
                    NivelAcademico = user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                    Telefono = phone,
                    Activo = true,
                    HorasSemanales = memberHours,
                    FechaInicio = DateTime.Now,
                    EsDirector = false
                });
            }

            foreach (var p in participantes)
            {
                if (string.IsNullOrWhiteSpace(p.Cedula)) continue;
                var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, p.Cedula, p.NivelAcademico == "Pregrado" ? "alumno" : "profesor");
                if (!string.IsNullOrEmpty(phone))
                {
                    p.Telefono = phone;
                }
                p.Carrera = null;
            }

            return participantes
                .Where(i => !string.IsNullOrWhiteSpace(i.Cedula))
                .GroupBy(i => i.Cedula!.Trim())
                .ToDictionary(g => g.Key, g => g.First())
                .Values.ToList();
        }

        public async Task SyncProjectCarrerasAsync(int projectId, int? idCarreraPrincipal, List<InvestigadorDto>? investigadores)
        {
            var currentCarreras = await _context.InvProyectosCarreras.Where(pc => pc.IdProyecto == projectId).ToListAsync();
            _context.InvProyectosCarreras.RemoveRange(currentCarreras);

            if (idCarreraPrincipal.HasValue && idCarreraPrincipal.Value > 0)
            {
                _context.InvProyectosCarreras.Add(new InvProyectoCarrera
                {
                    IdProyecto = projectId,
                    IdCarrera = idCarreraPrincipal.Value,
                    Modalidad = "PRINCIPAL"
                });
            }

            if (investigadores != null && investigadores.Any())
            {
                var allCarreras = await _context.Carreras.AsNoTracking().ToListAsync();
                var addedCarrerasIds = new HashSet<int>();
                if (idCarreraPrincipal.HasValue)
                {
                    addedCarrerasIds.Add(idCarreraPrincipal.Value);
                }

                foreach (var inv in investigadores)
                {
                    if (inv.Activo == false) continue;
                    if (string.IsNullOrWhiteSpace(inv.Carrera)) continue;

                    var carreraNombres = inv.Carrera.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                   .Select(c => c.Trim().ToLower())
                                                   .ToList();

                    foreach (var cName in carreraNombres)
                    {
                        var matchedCarrera = allCarreras.FirstOrDefault(c =>
                            c.Carrera1 != null && c.Carrera1.Trim().ToLower() == cName);

                        if (matchedCarrera != null && !addedCarrerasIds.Contains(matchedCarrera.IdCarrera))
                        {
                            addedCarrerasIds.Add(matchedCarrera.IdCarrera);
                            _context.InvProyectosCarreras.Add(new InvProyectoCarrera
                            {
                                IdProyecto = projectId,
                                IdCarrera = matchedCarrera.IdCarrera,
                                Modalidad = "PARTICIPANTE"
                            });
                        }
                    }
                }
            }
        }

        public async Task<InvGrupoInvestigacion?> ResolveApprovedGroupAsync(string? groupUuid)
        {
            return await ProjectHelper.ResolveApprovedGroupAsync(_context, groupUuid);
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

                approvedGroup = await ResolveApprovedGroupAsync(grupoInvestigacion);
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

            var researchSubcatId = await GetResearchSubcatIdAsync();
            var estadosConCarga = await GetEstadosConCargaHorariaAsync();

            foreach (var inv in effectiveInvestigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null || persona.TablaSigafi == "alumno") continue;
                if (inv.Activo == false) continue;

                decimal proposedHours = inv.HorasSemanales ?? 0;

                var availableHours = await _context.ProfesoresActividades
                    .Where(pa => pa.IdProfesor.Trim() == persona.IdSigafi.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
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
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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

                var researchSubcatId = await GetResearchSubcatIdAsync();
                var estadosConCarga = await GetEstadosConCargaHorariaAsync();

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

        private async Task NotifyInvestigadoresAsync(int projectId, List<InvestigadorDto> investigadores)
        {
            var project = await _context.InvProyectos.FindAsync(projectId);
            if (project == null) return;

            var cedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula))
                .Select(i => i.Cedula!.Trim())
                .Distinct()
                .ToList();

            if (cedulas.Count == 0) return;

            var personas = await _context.Users
                .Where(u => u.IdSigafi != null && cedulas.Contains(u.IdSigafi))
                .ToListAsync();

            var personasDict = personas
                .Where(p => p.IdSigafi != null)
                .ToDictionary(p => p.IdSigafi!, p => p);

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;
                var cedulaTrim = inv.Cedula.Trim();

                if (personasDict.TryGetValue(cedulaTrim, out var persona))
                {
                    await _notificationService.NotifyUserAsync(
                        persona.IdUsuario,
                        "Actualización de Proyecto",
                        $"Se han sincronizado tus datos en el proyecto: {project.Titulo}",
                        "INVESTIGACION",
                        $"/proyectos/{project.Uuid}",
                        new Dictionary<string, string>
                        {
                            { "Proyecto", project.Titulo ?? "Sin título" },
                            { "Rol Asignado", inv.Rol ?? "Investigador" },
                            { "Fecha Sincronización", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                        }
                    );
                }
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

        private async Task<List<string>> GetEstadosConCargaHorariaAsync()
        {
            var list = await _context.InvConfigWorkflows
                .Where(w => w.Activo && w.ContabilizaCargaHoraria)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();
            if (list == null || !list.Any())
            {
                list = new List<string> { "Enviado", "En Revisión", "Aprobado", "En Ejecución" };
            }
            return list;
        }

        private async Task<int> GetResearchSubcatIdAsync()
        {
            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7;
            return researchSubcatId;
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
