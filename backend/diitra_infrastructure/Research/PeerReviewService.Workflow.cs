using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using diitra_application.Research;
using Diitra.Application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;
using Diitra.Application.Common.Documents;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public partial class PeerReviewService : IPeerReviewService
    {
        public async Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
        {
            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);

            if (project == null)
                throw new ArgumentException($"Proyecto con UUID '{dto.ProjectUuid}' no encontrado.");

            if (project.Activo == false)
            {
                throw new InvalidOperationException("No se pueden asignar árbitros a un proyecto inactivo.");
            }

            if (project.Estado != "En Revisión")
            {
                throw new InvalidOperationException($"No se pueden asignar árbitros a un proyecto en estado '{project.Estado}'. El proyecto debe estar en estado 'En Revisión' tras la aprobación técnica del administrador.");
            }

            var revisorUser = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == dto.IdRevisor);
            if (revisorUser == null || !revisorUser.Activo)
            {
                throw new InvalidOperationException("El revisor seleccionado no existe o no está activo en el sistema.");
            }

            if (revisorUser.TablaSigafi == "alumno")
            {
                throw new InvalidOperationException("Un estudiante no puede ser asignado como árbitro/evaluador de un proyecto de investigación.");
            }

            if (dto.EsExterno)
            {
                if (revisorUser.TablaSigafi != "otros")
                {
                    throw new InvalidOperationException("El revisor seleccionado no es un evaluador externo registrado.");
                }
            }
            else
            {
                if (revisorUser.TablaSigafi != "profesor")
                {
                    throw new InvalidOperationException("El revisor seleccionado es un evaluador externo, pero se ha indicado que es una asignación interna.");
                }
            }

            if (dto.IdRevisor == directorId)
            {
                throw new InvalidOperationException("Conflicto de interés: El director o coordinador que realiza la asignación no puede asignarse a sí mismo como árbitro.");
            }

            var alreadyAssigned = await _context.Set<InvRevisionesPares>()
                .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == dto.IdRevisor);
            if (alreadyAssigned)
            {
                throw new InvalidOperationException($"El revisor '{revisorUser.Nombre}' ya ha sido asignado a este proyecto.");
            }

            var isMember = await _context.Set<InvProyectoParticipante>()
                .AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == dto.IdRevisor);
            if (isMember)
            {
                throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado es miembro (director o docente/alumno investigador) de este proyecto.");
            }

            if (project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.Set<InvGrupoMiembro>()
                    .AnyAsync(gm => gm.IdGrupo == project.IdGrupo.Value && gm.IdUsuario == dto.IdRevisor && gm.Activo == true);
                if (isGroupMember)
                {
                    throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado pertenece al mismo grupo de investigación del proyecto.");
                }
            }

            var reviewerProjects = await _context.Set<InvProyectoParticipante>()
                .Where(pp => pp.IdUsuario == dto.IdRevisor)
                .Select(pp => pp.IdProyecto)
                .ToListAsync();

            if (reviewerProjects.Any())
            {
                var currentProjectMembers = await _context.Set<InvProyectoParticipante>()
                    .Where(pp => pp.IdProyecto == project.IdProyecto)
                    .Select(pp => pp.IdUsuario)
                    .ToListAsync();

                var hasCrossReview = await _context.Set<InvRevisionesPares>()
                    .AnyAsync(r => reviewerProjects.Contains(r.IdProyecto) && r.IdRevisor.HasValue && currentProjectMembers.Contains(r.IdRevisor.Value));

                if (hasCrossReview)
                {
                    throw new InvalidOperationException("Conflicto de interés (Evaluación cruzada): Un miembro de este proyecto ya está asignado para evaluar un proyecto del revisor seleccionado.");
                }
            }

            var currentReviewsCount = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdProyecto == project.IdProyecto);
            if (currentReviewsCount >= 3)
            {
                throw new InvalidOperationException($"El proyecto ya cuenta con el límite máximo de evaluaciones permitidas ({currentReviewsCount} asignadas).");
            }

            var activeReviewsCount = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdRevisor == dto.IdRevisor && r.Estado == "Pendiente");
            if (activeReviewsCount >= 3)
            {
                throw new InvalidOperationException($"El revisor seleccionado tiene demasiadas evaluaciones pendientes activas (límite de 3 simultáneas, actualmente tiene {activeReviewsCount}).");
            }

            if (dto.FechaLimite <= DateTime.Now.AddHours(23))
            {
                throw new InvalidOperationException("La fecha límite de evaluación debe ser al menos 24 horas en el futuro.");
            }
            if (dto.FechaLimite > DateTime.Now.AddDays(90))
            {
                throw new InvalidOperationException("La fecha límite de evaluación no puede ser mayor a 90 días en el futuro.");
            }

            project.AutoExtendDeadlines = dto.AutoExtendDeadlines;
            project.AutoExtendDays = dto.AutoExtendDays;

            var revision = new InvRevisionesPares
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdRevisor = dto.IdRevisor,
                FechaLimite = dto.FechaLimite,
                EsExterno = dto.EsExterno,
                EsDobleCiego = dto.EsDobleCiego,
                Estado = "Pendiente",
                FechaAsignacion = DateTime.Now
            };

            _context.Set<InvRevisionesPares>().Add(revision);
            await _context.SaveChangesAsync();

            if (dto.EsExterno)
            {
                if (revisorUser != null && !string.IsNullOrEmpty(revisorUser.EmailInstitucional))
                {
                    var plainToken = await _authService.CreateMagicLinkAsync(revisorUser.IdUsuario, dto.FechaLimite);
                    var baseUrl = GetFrontendUrl();
                    var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";
                    var emailTitle = $"Acceso de Arbitraje Científico - DIITRA";
                    string emailBody;

                    var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "AsignarArbitroExterno.html");
                    if (File.Exists(templatePath))
                    {
                        bool mostrarCredenciales = BCrypt.Net.BCrypt.Verify("Diitra2026*", revisorUser.Contrasenia);
                        var templateHtml = await File.ReadAllTextAsync(templatePath);
                        var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
                        emailBody = template(new
                        {
                            project_title = project.Titulo,
                            fecha_limite = dto.FechaLimite.ToString("dd/MM/yyyy"),
                            username = revisorUser.IdSigafi,
                            mostrar_credenciales = mostrarCredenciales
                        });
                    }
                    else
                    {
                        emailBody = $"<p>Ha sido asignado/a para realizar el arbitraje técnico del proyecto de investigación: <strong>{project.Titulo}</strong>.</p>" +
                                    $"<p>Fecha límite: {dto.FechaLimite:dd/MM/yyyy}</p>";
                    }

                    await _notificationService.NotifyUserAsync(
                        revisorUser.IdUsuario,
                        emailTitle,
                        emailBody,
                        "PEER_REVIEW",
                        magicLinkUrl
                    );
                }
            }
            else
            {
                if (revisorUser != null)
                {
                    var emailTitle = $"Nueva Asignación de Arbitraje Científico - DIITRA";
                    string emailBody;

                    var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "AsignarArbitroInterno.html");
                    if (File.Exists(templatePath))
                    {
                        var templateHtml = await File.ReadAllTextAsync(templatePath);
                        var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
                        emailBody = template(new
                        {
                            project_title = project.Titulo,
                            fecha_limite = dto.FechaLimite.ToString("dd/MM/yyyy")
                        });
                    }
                    else
                    {
                        emailBody = $"<p>Estimado/a docente, ha sido asignado/a como árbitro científico para evaluar el proyecto: <strong>{project.Titulo}</strong> antes de la fecha límite {dto.FechaLimite:dd/MM/yyyy}.</p>";
                    }

                    await _notificationService.NotifyUserAsync(
                        revisorUser.IdUsuario,
                        emailTitle,
                        emailBody,
                        "PEER_REVIEW",
                        "/revisiones"
                    );
                }
            }

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                ProyectoUuid = dto.ProjectUuid,
                IdRevisor = dto.IdRevisor,
                EsExterno = dto.EsExterno,
                EsDobleCiego = dto.EsDobleCiego,
                FechaLimite = dto.FechaLimite.ToString("dd/MM/yyyy"),
                EstadoProyecto = project.Estado
            });

            await _auditService.LogActionAsync(directorId, "ASIGNAR_ARBITRO",
                $"Árbitro asignado al proyecto '{project.Titulo}'", "PEER_REVIEW", null, afterState);

            return revision.Uuid;
        }

        public async Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

            if (revision == null || revision.Estado == "Completada") return false;

            var beforeState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                EstadoAnterior = revision.Estado
            });

            _context.Set<InvRevisionesPares>().Remove(revision);
            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(directorId, "REVOCAR_ARBITRO",
                $"Asignación de árbitro revocada (UUID: {revisionUuid})", "PEER_REVIEW", beforeState, null);

            return true;
        }

        public async Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId)
        {
            var project = await _context.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.InvProyectoParticipantes)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
                ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Detalles)
                .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
                .ToListAsync();

            if (!revisiones.Any())
                throw new InvalidOperationException("No hay evaluaciones completadas para cerrar el arbitraje.");

            decimal puntajeMinimo = 70m;
            var criteriosRubrica = await ObtenerCriteriosRubricaAsync(project.IdConvocatoria);
            decimal promedio = CalcularPromedioPonderado(revisiones, criteriosRubrica);

            string estadoAnterior = project.Estado;
            string resultado;
            string? mensajeDesempate = null;

            int aprobadosCount = revisiones.Count(r => (r.PuntajeTotal ?? 0) >= puntajeMinimo);
            int rechazadosCount = revisiones.Count(r => (r.PuntajeTotal ?? 0) < puntajeMinimo);

            if (aprobadosCount == rechazadosCount && revisiones.Count > 0)
            {
                resultado = "Desempate";
                project.Estado = "En Revisión";
                project.PuntajeEvaluacion = promedio;
                mensajeDesempate = $"Los {revisiones.Count} árbitros presentan dictámenes contradictorios (empate {aprobadosCount} vs {rechazadosCount}). " +
                                   $"Se requiere designar un tercer árbitro para desempatar o una decisión fundada del Director de Investigación.";
            }
            else if (aprobadosCount > rechazadosCount)
            {
                resultado = "Aprobado";
                project.Estado = "Aprobado";
                project.PuntajeEvaluacion = promedio;
                project.FechaModificacion = DateTime.Now;

                if (string.IsNullOrEmpty(project.CodigoInstitucional))
                {
                    using var seqTransaction = await _context.Database.BeginTransactionAsync(
                        System.Data.IsolationLevel.Serializable);
                    try
                    {
                        var anio = DateTime.Now.Year;
                        var seq = await _context.InvProyectos.CountAsync(p =>
                            p.IdProyecto != project.IdProyecto &&
                            p.FechaRegistro.HasValue &&
                            p.FechaRegistro.Value.Year == anio &&
                            p.Estado == "Aprobado") + 1;
                        project.CodigoInstitucional = $"DIITRA-{anio}-{seq:D3}";
                        await _context.SaveChangesAsync();
                        await seqTransaction.CommitAsync();
                    }
                    catch
                    {
                        await seqTransaction.RollbackAsync();
                        throw;
                    }
                }
            }
            else
            {
                resultado = "Rechazado";
                project.Estado = "Rechazado";
                project.PuntajeEvaluacion = promedio;
                project.FechaModificacion = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                Resultado = resultado,
                PuntajePromedio = promedio,
                EstadoNuevo = project.Estado,
                CodigoInstitucional = project.CodigoInstitucional
            });

            await _auditService.LogActionAsync(directorId, "CERRAR_ARBITRAJE",
                $"Arbitraje cerrado. Proyecto: '{project.Titulo}'. Resultado: {resultado}. Promedio: {promedio:F2}",
                "PEER_REVIEW", null, afterState);

            try
            {
                var participantUserIds = project.InvProyectoParticipantes.Select(p => p.IdUsuario)
                    .Distinct()
                    .ToList();

                var title = resultado switch
                {
                    "Aprobado" => "Proyecto Aprobado",
                    "Rechazado" => "Proyecto Rechazado",
                    _ => "Proyecto en Desempate"
                };

                var body = resultado switch
                {
                    "Aprobado" => $"El proyecto '{project.Titulo}' ha sido Aprobado tras el proceso de arbitraje con un promedio de {promedio:F2}/100.",
                    "Rechazado" => $"El proyecto '{project.Titulo}' ha sido Rechazado tras el proceso de arbitraje con un promedio de {promedio:F2}/100.",
                    _ => $"El proyecto '{project.Titulo}' ha entrado en fase de Desempate tras el proceso de arbitraje."
                };

                var docInstance = await _context.DocumentInstances
                    .FirstOrDefaultAsync(di => di.EntityUuid == project.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                string actionUrl = docInstance != null 
                    ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                    : $"/investigacion/mis-proyectos";

                foreach (var userId in participantUserIds)
                {
                    await _notificationService.NotifyUserAsync(
                        userId,
                        title,
                        body,
                        "INVESTIGACION",
                        actionUrl
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al notificar cierre de arbitraje a los participantes del proyecto");
            }

            var revDtos = new List<PeerReviewDto>();
            foreach (var rev in revisiones)
            {
                var user = rev.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                    : null;
                var nombre = user?.Nombre ?? "Revisor";
                revDtos.Add(MapToDto(rev, nombre));
            }

            return new DictamenDto
            {
                ProyectoUuid = projectUuid,
                ProyectoTitulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                PuntajePromedio = Math.Round(promedio, 2),
                PuntajeMinimoAprobacion = puntajeMinimo,
                Resultado = resultado,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = project.Estado,
                Evaluaciones = revDtos,
                FechaCierre = DateTime.Now,
                MensajeDesempate = mensajeDesempate
            };
        }

        public async Task<bool> IniciarEjecucionAsync(string projectUuid, int directorId)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectoParticipantes)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
                ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

            if (project.Estado != "Aprobado")
                throw new InvalidOperationException(
                    $"Solo los proyectos en estado 'Aprobado' pueden iniciar ejecución. Estado actual: '{project.Estado}'.");

            string estadoAnterior = project.Estado;
            var transitionSuccess = await _workflowEngineService.TransicionarEstadoAsync(
                projectUuid,
                "En Ejecución",
                directorId,
                "Inicio de la fase de ejecución operativa tras la aprobación de arbitraje científico."
            );
            
            if (!transitionSuccess)
            {
                throw new InvalidOperationException("No se pudo realizar la transición de estado reglamentaria del proyecto.");
            }

            project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid)
                ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado tras la transición.");

            if (!project.FechaInicio.HasValue)
                project.FechaInicio = DateOnly.FromDateTime(DateTime.Now);

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(directorId, "INICIAR_EJECUCION",
                $"Proyecto '{project.Titulo}' inició fase de ejecución. Código: {project.CodigoInstitucional ?? "N/A"}.",
                "PEER_REVIEW",
                System.Text.Json.JsonSerializer.Serialize(new { Estado = estadoAnterior }),
                System.Text.Json.JsonSerializer.Serialize(new { Estado = project.Estado, project.CodigoInstitucional }));

            _logger.LogInformation("[DIITRA] Proyecto {Uuid} transicionó Aprobado → En Ejecución.", projectUuid);

            try
            {
                var participantUserIds = project.InvProyectoParticipantes.Select(p => p.IdUsuario)
                    .Distinct()
                    .ToList();

                var docInstance = await _context.DocumentInstances
                    .FirstOrDefaultAsync(di => di.EntityUuid == project.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                string actionUrl = docInstance != null 
                    ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                    : $"/investigacion/mis-proyectos";

                foreach (var userId in participantUserIds)
                {
                    await _notificationService.NotifyUserAsync(
                        userId,
                        "Proyecto en Ejecución",
                        $"Su proyecto '{project.Titulo}' ha iniciado la fase de ejecución operativa.",
                        "INVESTIGACION",
                        actionUrl
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al notificar inicio de ejecución a los participantes del proyecto");
            }

            return true;
        }

        private async Task<List<(string Nombre, decimal Peso)>> ObtenerCriteriosRubricaAsync(int? idConvocatoria)
        {
            InvRubrica? rubrica = null;

            if (idConvocatoria.HasValue)
            {
                var convocatoria = await _context.InvConvocatorias
                    .FirstOrDefaultAsync(c => c.IdConvocatoria == idConvocatoria.Value);
                if (convocatoria != null && convocatoria.IdRubrica.HasValue)
                {
                    rubrica = await _context.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(r => r.IdRubrica == convocatoria.IdRubrica.Value);
                }
            }

            if (rubrica == null)
            {
                rubrica = await _context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync(r => r.Activo == true);
            }

            if (rubrica?.InvRubricaCriterios.Any() == true)
            {
                return rubrica.InvRubricaCriterios
                    .OrderBy(c => c.Orden)
                    .Select(c => (c.Nombre, c.PesoPorcentaje))
                    .ToList();
            }

            return new List<(string, decimal)>
            {
                ("Pertinencia Científica y Social", 25m),
                ("Metodología y Rigor Científico", 30m),
                ("Impacto Social y Tecnológico", 25m),
                ("Viabilidad y Presupuesto", 20m)
            };
        }

        private static bool CriterioCoincide(string criterioDetalle, string nombreCriterio)
        {
            if (string.IsNullOrWhiteSpace(criterioDetalle) || string.IsNullOrWhiteSpace(nombreCriterio))
                return false;

            if (criterioDetalle.Contains(nombreCriterio, StringComparison.OrdinalIgnoreCase)
                || nombreCriterio.Contains(criterioDetalle, StringComparison.OrdinalIgnoreCase))
                return true;

            string[] keywords = ["pertinencia", "metodolog", "viabilidad", "presupuesto", "impacto"];
            foreach (var kw in keywords)
            {
                if (criterioDetalle.Contains(kw, StringComparison.OrdinalIgnoreCase)
                    && nombreCriterio.Contains(kw, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private static decimal CalcularPromedioPonderado(
            List<InvRevisionesPares> revisiones,
            List<(string Nombre, decimal Peso)> criterios)
        {
            if (!revisiones.Any()) return 0;

            decimal totalPonderado = 0;
            int criteriosConDatos = 0;

            foreach (var (nombre, _) in criterios)
            {
                var puntajesCriterio = revisiones
                    .SelectMany(r => r.Detalles
                        .Where(d => CriterioCoincide(d.Criterio, nombre))
                        .Select(d => d.Puntaje))
                    .ToList();

                if (puntajesCriterio.Count > 0)
                {
                    totalPonderado += puntajesCriterio.Average();
                    criteriosConDatos++;
                }
            }

            if (criteriosConDatos == 0)
            {
                var conTotal = revisiones.Where(r => r.PuntajeTotal.HasValue).ToList();
                return conTotal.Count > 0
                    ? Math.Round(conTotal.Average(r => r.PuntajeTotal!.Value), 2)
                    : 0;
            }

            return Math.Round(totalPonderado, 2);
        }

        public async Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
            => await AsignarArbitroAsync(dto, dto.IdRevisor);

        public async Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();
            var periodId = currentPeriod?.IdPeriodo;

            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .Where(r => r.IdProyecto == projectId)
                .ToListAsync();

            var result = new List<PeerReviewDto>();
            foreach (var r in revisiones)
            {
                var user = r.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(r.IdRevisor.Value)
                    : null;
                var nombre = user?.Nombre ?? "Revisor Externo";

                string? careerNom = null;
                if (user != null && user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi) && !string.IsNullOrEmpty(periodId))
                {
                    var teacherId = user.IdSigafi.Trim();
                    var linkedCareers = await _context.ProfesoresCarrerasPeriodos
                        .Include(pc => pc.IdCarreraNavigation)
                        .Where(pc => pc.IdProfesor.Trim() == teacherId && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                        .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                        .Distinct()
                        .ToListAsync();
                    careerNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                }

                var meta = r.IdRevisor.HasValue
                    ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == r.IdRevisor.Value)
                    : null;

                result.Add(MapToDto(r, nombre, meta, careerNom));
            }
            return result;
        }

        private static PeerReviewDto MapToDto(
            InvRevisionesPares r,
            string nombreRevisor,
            InvUsuarioMetadata? meta = null,
            string? revisorCarrera = null)
            => new()
            {
                Uuid = r.Uuid,
                IdProyecto = r.IdProyecto,
                ProyectoUuid = r.Proyecto?.Uuid ?? "",
                ProyectoTitulo = r.Proyecto?.Titulo ?? "",
                IdRevisor = r.IdRevisor ?? 0,
                RevisorNombre = nombreRevisor,
                RevisorEspecialidad = meta?.Especialidad,
                RevisorGrado = meta?.GradoAcademicoMaximo,
                FechaAsignacion = r.FechaAsignacion,
                FechaLimite = r.FechaLimite,
                FechaCompletado = r.FechaCompletado,
                Estado = r.Estado,
                EsExterno = r.EsExterno,
                EsDobleCiego = r.EsDobleCiego,
                PuntajeTotal = r.PuntajeTotal,
                ObservacionesGral = r.ObservacionesGral,
                RevisorCarrera = revisorCarrera
            };

        private static string DeterminarEstadoArbitraje(List<InvRevisionesPares> revisiones, decimal puntajeMinimo = 70m)
        {
            if (!revisiones.Any()) return "SinArbitros";
            if (revisiones.All(r => r.Estado == "Completada"))
            {
                var scores = revisiones.Where(r => r.PuntajeTotal.HasValue).Select(r => r.PuntajeTotal!.Value).ToList();
                var aprobadosCount = scores.Count(s => s >= puntajeMinimo);
                var rechazadosCount = scores.Count(s => s < puntajeMinimo);
                if (aprobadosCount == rechazadosCount && scores.Count > 0) return "Desempate";
                return "Completado";
            }
            if (revisiones.Any(r => r.Estado == "Completada")) return "EnProceso";
            return "Pendiente";
        }

        public async Task<byte[]> GenerateDictamenPdfAsync(string projectUuid, int directorId)
        {
            var project = await _context.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdSublineaNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
                ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

            var estadosPostCierre = new[] { "Aprobado", "En Ejecución", "Rechazado" };
            var cierreEjecutado = estadosPostCierre.Contains(project.Estado)
                || (project.Estado == "En Revisión" && project.PuntajeEvaluacion.HasValue);

            if (!cierreEjecutado)
                throw new InvalidOperationException(
                    "El Acta de Dictamen aún no está disponible. El Director de Investigación debe ejecutar el cierre formal del arbitraje antes de descargar este documento.");

            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Detalles)
                .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
                .ToListAsync();

            var director = await _context.Users.FindAsync(directorId);

            decimal promedio = project.PuntajeEvaluacion
                ?? CalcularPromedioPonderado(revisiones, await ObtenerCriteriosRubricaAsync(project.IdConvocatoria));

            decimal puntajeMinimo = 70m;
            string resultado = promedio >= puntajeMinimo ? "Aprobado" : "Rechazado";

            var votos = revisiones.Select(r => r.DictamenRevisor ?? "Pendiente").ToList();
            int aprueba = votos.Count(v => v == "Aprueba");
            int rechaza = votos.Count(v => v == "Rechaza");
            string? mensajeDesempate = null;
            if (aprueba == rechaza && revisiones.Count >= 2)
            {
                resultado = "Desempate";
                mensajeDesempate = $"Panel dividido: {aprueba} aprueba(n) vs {rechaza} rechaza(n). Se requiere un tercer árbitro para desempatar.";
            }

            var revisionsData = new List<Dictionary<string, object?>>();
            foreach (var r in revisiones)
            {
                var user = r.IdRevisor.HasValue ? await _context.Users.FindAsync(r.IdRevisor.Value) : null;
                var meta = r.IdRevisor.HasValue ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == r.IdRevisor.Value) : null;

                revisionsData.Add(new Dictionary<string, object?>
                {
                    ["revisor_nombre"] = user != null ? user.Nombre : "Revisor Externo",
                    ["es_externo"] = r.EsExterno,
                    ["revisor_grado"] = user != null ? (object?)(meta?.GradoAcademicoMaximo ?? "N/I") : "N/I",
                    ["puntaje_total"] = r.PuntajeTotal?.ToString("F1"),
                    ["dictamen_revisor"] = r.DictamenRevisor,
                    ["estado"] = r.Estado,
                    ["observaciones_gral"] = r.ObservacionesGral,
                    ["fecha_completado"] = r.FechaCompletado
                });
            }

            var data = new Dictionary<string, object?>
            {
                ["proyecto_titulo"] = project.Titulo,
                ["codigo_institucional"] = project.CodigoInstitucional,
                ["convocatoria_titulo"] = project.IdConvocatoriaNavigation?.Titulo ?? "N/A",
                ["linea_investigacion"] = project.IdSublineaNavigation?.Nombre ?? "N/A",
                ["fecha_postulacion"] = project.FechaPresentacion,
                ["fecha_cierre"] = DateTime.Now,
                ["fecha_generacion"] = DateTime.Now,
                ["puntaje_promedio"] = promedio.ToString("F2"),
                ["puntaje_minimo"] = puntajeMinimo.ToString("F2"),
                ["dictamen_resultado"] = resultado,
                ["estado_anterior"] = project.Estado,
                ["estado_nuevo"] = resultado == "Aprobado" ? "Aprobado" : (resultado == "Desempate" ? "En Revisión" : "Rechazado"),
                ["es_doble_ciego"] = true,
                ["director_nombre"] = director?.Nombre ?? "Director de Investigación",
                ["mensaje_desempate"] = mensajeDesempate,
                ["revisiones"] = revisionsData,
                ["institucion_nombre"] = "Instituto Superior Tecnológico Traversari"
            };

            var request = new DocumentRequest
            {
                TemplateCode = "DICTAMEN_ARBITRAJE",
                Data = data,
                RequestedBy = director?.Nombre ?? "Sistema",
                ProjectUuid = projectUuid,
                IsBlindMode = true,
                IsDraftMode = false
            };

            var docResult = await _documentEngine.GenerateAsync(request);
            return docResult.PdfBytes;
        }

        public async Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

            if (revision == null || revision.Estado == "Completada") return false;

            var beforeState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                FechaLimiteAnterior = revision.FechaLimite.ToString("dd/MM/yyyy"),
                Estado = revision.Estado
            });

            revision.FechaLimite = nuevaFecha;

            if (revision.EsExterno)
            {
                var magicLinks = await _context.Set<InvMagicLink>()
                    .Where(l => l.IdUsuario == revision.IdRevisor && !l.Utilizado)
                    .ToListAsync();

                foreach (var link in magicLinks)
                {
                    link.FechaExpiracion = nuevaFecha;
                }
            }

            await _context.SaveChangesAsync();

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                FechaLimiteNueva = nuevaFecha.ToString("dd/MM/yyyy"),
                Estado = revision.Estado
            });

            var proyectoTitulo = revision.Proyecto?.Titulo ?? "N/A";
            await _auditService.LogActionAsync(directorId, "EXTENDER_PLAZO_ARBITRAJE",
                $"Plazo de arbitraje extendido para evaluador en proyecto '{proyectoTitulo}'", "PEER_REVIEW", beforeState, afterState);

            return true;
        }

        public async Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto)
        {
            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null) return false;

            project.AutoExtendDeadlines = dto.AutoExtendDeadlines;
            project.AutoExtendDays = dto.AutoExtendDays;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
