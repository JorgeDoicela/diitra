using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Research;
using Diitra.Application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Diitra.Application.Common.Documents;
using diitra_application.Security;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Research
{
    public class PeerReviewWorkflowService : IPeerReviewWorkflowService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly IDocumentEngine _documentEngine;
        private readonly INotificationService _notificationService;
        private readonly IWorkflowEngineService _workflowEngineService;
        private readonly ILogger<PeerReviewWorkflowService> _logger;

        public PeerReviewWorkflowService(
            DiitraContext context,
            IAuditService auditService,
            IDocumentEngine documentEngine,
            INotificationService notificationService,
            IWorkflowEngineService workflowEngineService,
            ILogger<PeerReviewWorkflowService> logger)
        {
            _context = context;
            _auditService = auditService;
            _documentEngine = documentEngine;
            _notificationService = notificationService;
            _workflowEngineService = workflowEngineService;
            _logger = logger;
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
            var criteriosRubrica = await PeerReviewHelper.ObtenerCriteriosRubricaAsync(_context, project.IdConvocatoria);
            decimal promedio = PeerReviewHelper.CalcularPromedioPonderado(revisiones, criteriosRubrica);

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
                    ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{project.Uuid}"
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
                revDtos.Add(PeerReviewHelper.MapToDto(rev, nombre));
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
                ?? PeerReviewHelper.CalcularPromedioPonderado(revisiones, await PeerReviewHelper.ObtenerCriteriosRubricaAsync(_context, project.IdConvocatoria));

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
                    ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{project.Uuid}"
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
    }
}
