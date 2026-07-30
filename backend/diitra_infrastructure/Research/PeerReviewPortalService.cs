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
using diitra_application.Security;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Research
{
    public class PeerReviewPortalService : IPeerReviewPortalService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PeerReviewPortalService> _logger;

        public PeerReviewPortalService(
            DiitraContext context,
            IAuditService auditService,
            INotificationService notificationService,
            ILogger<PeerReviewPortalService> logger)
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId)
        {
            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .Where(r => r.IdRevisor == revisorId && r.Estado == "Pendiente")
                .ToListAsync();

            var result = new List<PeerReviewDto>();

            foreach (var r in revisiones)
            {
                var user = r.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(r.IdRevisor.Value)
                    : null;
                var nombreRevisor = user?.Nombre ?? "Revisor";
                result.Add(PeerReviewHelper.MapToDto(r, nombreRevisor));
            }

            return result;
        }

        public async Task<IEnumerable<PeerReviewDto>> GetMyReviewsAsync(int revisorId)
        {
            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .Where(r => r.IdRevisor == revisorId)
                .ToListAsync();

            var result = new List<PeerReviewDto>();

            foreach (var r in revisiones)
            {
                var user = r.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(r.IdRevisor.Value)
                    : null;
                var nombreRevisor = user?.Nombre ?? "Revisor";
                result.Add(PeerReviewHelper.MapToDto(r, nombreRevisor));
            }

            return result;
        }

        public async Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .AsSplitQuery()
                .Include(r => r.Detalles)
                .Include(r => r.Proyecto)
                    .ThenInclude(p => p.IdConvocatoriaNavigation)
                .Include(r => r.Proyecto)
                    .ThenInclude(p => p.IdSublineaNavigation)
                .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

            if (revision == null) return null;

            if (revision.Estado == "Pendiente" && revision.FechaLimite < DateTime.Now)
            {
                var proj = revision.Proyecto;
                if (proj != null && proj.AutoExtendDeadlines)
                {
                    var extensionDays = proj.AutoExtendDays > 0 ? proj.AutoExtendDays : 7;
                    revision.FechaLimite = DateTime.Now.AddDays(extensionDays);

                    if (revision.EsExterno)
                    {
                        var magicLinks = await _context.Set<InvMagicLink>()
                            .Where(l => l.IdUsuario == revision.IdRevisor && !l.Utilizado)
                            .ToListAsync();

                        foreach (var link in magicLinks)
                        {
                            link.FechaExpiracion = revision.FechaLimite;
                        }
                    }

                    await _context.SaveChangesAsync();

                    await _auditService.LogActionAsync(0, "AUTO_EXTENDER_PLAZO_ARBITRAJE",
                        $"Plazo de arbitraje auto-extendido ({extensionDays} días) al expirar para evaluador en proyecto '{proj.Titulo}'", "PEER_REVIEW", null, null);
                }
                else
                {
                    throw new InvalidOperationException("El plazo de evaluación para esta revisión ha vencido. Solicite una prórroga al administrador.");
                }
            }

            var proyecto = revision.Proyecto;
            if (proyecto == null)
            {
                throw new InvalidOperationException("El proyecto asociado a esta revisión no pudo ser cargado.");
            }
            var conv = proyecto.IdConvocatoriaNavigation;
            InvRubrica? rubrica = null;
            if (conv != null && conv.IdRubrica.HasValue)
            {
                rubrica = await _context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync(r => r.IdRubrica == conv.IdRubrica.Value);
            }

            if (rubrica == null)
            {
                rubrica = await _context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync(r => r.Activo == true);
            }

            if (rubrica == null)
            {
                rubrica = await _context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync();
            }

            if (rubrica == null || !rubrica.InvRubricaCriterios.Any())
            {
                throw new InvalidOperationException("No se encontró ninguna rúbrica de evaluación con criterios configurada en la base de datos.");
            }

            List<CriterioRubricaDto> criterios = rubrica.InvRubricaCriterios
                .OrderBy(c => c.Orden ?? 99)
                .Select(c => new CriterioRubricaDto
                {
                    IdCriterio = c.IdCriterio,
                    Nombre = c.Nombre,
                    Descripcion = c.Descripcion,
                    PesoPorcentaje = c.PesoPorcentaje,
                    Orden = c.Orden ?? 0
                }).ToList();

            string nombreRubrica = rubrica.Nombre;
            int idRubrica = rubrica.IdRubrica;
            decimal puntajeMinimo = 70m;

            string tituloParaRevisor = proyecto.Titulo;

            var docInstance = await _context.DocumentInstances
                .FirstOrDefaultAsync(i => i.EntityUuid == proyecto.Uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION");

            async Task<string?> ResolveFieldAsync(string fieldName, string? baseValue)
            {
                if (!string.IsNullOrWhiteSpace(baseValue)) return baseValue;

                if (docInstance != null)
                {
                    if (docInstance.DataSnapshotJson != null)
                    {
                        try
                        {
                            var opts = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var snapshot = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(docInstance.DataSnapshotJson, opts);
                            if (snapshot.TryGetProperty(fieldName, out var el) && el.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                var val = el.GetString();
                                if (!string.IsNullOrWhiteSpace(val)) return val;
                            }
                        }
                        catch { }
                    }

                    var coworkKey = $"{docInstance.Uuid}_{fieldName}";
                    var coworkDoc = await _context.InvCoworkDocumentos.FirstOrDefaultAsync(d => d.Uuid == coworkKey);
                    if (coworkDoc != null && !string.IsNullOrWhiteSpace(coworkDoc.ContentHtml))
                    {
                        return coworkDoc.ContentHtml;
                    }
                }

                return null;
            }

            System.Text.Json.JsonElement? projectMetadata = null;
            if (!string.IsNullOrEmpty(proyecto.MetadataCacesJson))
            {
                try
                {
                    projectMetadata = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(proyecto.MetadataCacesJson);
                }
                catch {}
            }

            string? GetMetadataFallback(string fieldName)
            {
                if (projectMetadata.HasValue && projectMetadata.Value.ValueKind == System.Text.Json.JsonValueKind.Object && projectMetadata.Value.TryGetProperty(fieldName, out var prop))
                {
                    return prop.GetString();
                }
                return null;
            }

            string? justificacionFinal = await ResolveFieldAsync("Justificacion", GetMetadataFallback("justificacion") ?? GetMetadataFallback("Justificacion"));
            string? metodologiaFinal = await ResolveFieldAsync("Metodologia", GetMetadataFallback("metodologia") ?? GetMetadataFallback("Metodologia"));
            string? antecedentesFinal = await ResolveFieldAsync("Antecedentes", GetMetadataFallback("antecedentes") ?? GetMetadataFallback("Antecedentes"));
            string? descripcionFinal = await ResolveFieldAsync("DescripcionProyecto", GetMetadataFallback("descripcionProyecto") ?? GetMetadataFallback("DescripcionProyecto") ?? GetMetadataFallback("descripcion") ?? GetMetadataFallback("Descripcion"));
            string? marcoTeoricoFinal = await ResolveFieldAsync("MarcoTeorico", GetMetadataFallback("marcoTeorico") ?? GetMetadataFallback("MarcoTeorico"));
            string? evaluacionFinal = await ResolveFieldAsync("Evaluacion", GetMetadataFallback("evaluacion") ?? GetMetadataFallback("Evaluacion") ?? GetMetadataFallback("metodoEvaluacion") ?? GetMetadataFallback("MetodoEvaluacion"));
            string? objetivoGeneralFinal = await ResolveFieldAsync("ObjetivoGeneral", null);
            string? objetivosEspecificosFinal = await ResolveFieldAsync("ObjetivosEspecificos", null);
            string? bibliografiaFinal = await ResolveFieldAsync("Bibliografia", null);

            var revisionCompletada = revision.Estado == "Completada";

            if (revisionCompletada && revision.Detalles != null)
            {
                foreach (var crit in criterios)
                {
                    var det = revision.Detalles.FirstOrDefault(d => 
                        d.Criterio.Equals(crit.Nombre, StringComparison.OrdinalIgnoreCase));
                    if (det != null)
                    {
                        crit.PuntajeObtenido = det.Puntaje;
                        crit.ObservacionesCriterio = det.Observaciones;
                    }
                }
            }

            return new RubricaDinamicaDto
            {
                IdRubrica = idRubrica,
                NombreRubrica = nombreRubrica,
                ProyectoTitulo = tituloParaRevisor,
                LineaInvestigacion = proyecto.IdSublineaNavigation?.Nombre,
                Justificacion = justificacionFinal,
                Metodologia = metodologiaFinal,
                Antecedentes = antecedentesFinal,
                DescripcionProyecto = descripcionFinal,
                ObjetivoGeneral = objetivoGeneralFinal,
                ObjetivosEspecificos = objetivosEspecificosFinal,
                MarcoTeorico = marcoTeoricoFinal,
                Evaluacion = evaluacionFinal,
                Bibliografia = bibliografiaFinal,
                ProyectoUuid = proyecto.Uuid,
                EsDobleCiego = revision.EsDobleCiego,
                PuntajeMinimoAprobacion = puntajeMinimo,
                Criterios = criterios,
                
                EstadoRevision = revision.Estado,
                ObservacionesGral = revision.ObservacionesGral,
                PuntajeTotal = revision.PuntajeTotal,
                DataSnapshotJson = docInstance?.DataSnapshotJson,
                TemplateConfigSnapshotJson = docInstance?.TemplateConfigSnapshotJson
            };
        }

        public async Task<bool> SubmitEvaluationAsync(EvaluationDto dto)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Detalles)
                .FirstOrDefaultAsync(r => r.Uuid == dto.RevisionUuid);

            if (revision == null) return false;

            if (revision.Estado == "Pendiente" && revision.FechaLimite < DateTime.Now)
            {
                throw new InvalidOperationException("El plazo de evaluación para esta revisión ha vencido. Solicite una prórroga al administrador.");
            }

            var project = await _context.InvProyectos
                .Include(p => p.IdConvocatoriaNavigation)
                .FirstOrDefaultAsync(p => p.IdProyecto == revision.IdProyecto);
            string estadoAnteriorProyecto = project?.Estado ?? "Desconocido";

            var beforeState = System.Text.Json.JsonSerializer.Serialize(new
            {
                EstadoRevision = revision.Estado,
                EstadoProyecto = estadoAnteriorProyecto,
                PuntajeEvaluacion = project?.PuntajeEvaluacion
            });

            revision.Estado = "Completada";
            revision.FechaCompletado = DateTime.Now;
            revision.ObservacionesGral = dto.ObservacionesGral;

            foreach (var detail in dto.Detalles)
            {
                revision.Detalles.Add(new InvEvaluacionesDetalle
                {
                    Criterio = detail.Criterio,
                    Puntaje = detail.Puntaje,
                    Observaciones = detail.Observaciones
                });
            }

            var totalScore = dto.Detalles.Sum(d => d.Puntaje);
            revision.PuntajeTotal = totalScore;

            decimal umbralAprobacion = 70m;
            revision.DictamenRevisor = totalScore >= umbralAprobacion ? "Aprueba" : "Rechaza";

            await _context.SaveChangesAsync();

            if (project != null && !string.IsNullOrEmpty(project.Uuid))
            {
                try
                {
                    var existingDoc = await _context.DocumentInstances
                        .FirstOrDefaultAsync(d => d.EntityUuid == revision.Uuid && d.TemplateCode == "RUBRICA_EVALUACION");

                    if (existingDoc == null)
                    {
                        var template = await _context.DocumentTemplates
                            .FirstOrDefaultAsync(t => t.Code == "RUBRICA_EVALUACION" && t.IsActive);
                        if (template != null)
                        {
                            string tipoEvaluador = revision.EsExterno ? "Evaluador Externo" : "Evaluador Interno";
                            existingDoc = Diitra.Domain.Common.Documents.DocumentInstance.Create(
                                "RUBRICA_EVALUACION",
                                template.Version,
                                revision.Uuid,
                                "sistema",
                                $"Rúbrica de Evaluación — {tipoEvaluador} — {project.CodigoInstitucional ?? project.Titulo}",
                                "Revision"
                            );
                            _context.DocumentInstances.Add(existingDoc);
                            await _context.SaveChangesAsync();
                        }
                    }

                    if (existingDoc != null && existingDoc.State != Diitra.Domain.Common.Documents.DocumentState.Signed)
                    {
                        var criteriosRubrica = await PeerReviewHelper.ObtenerCriteriosRubricaAsync(_context, project.IdConvocatoria);

                        var criteriosSnapshot = dto.Detalles.Select(d =>
                        {
                            var criterioRub = criteriosRubrica.FirstOrDefault(c => c.Nombre == d.Criterio);
                            decimal peso = criterioRub != default ? criterioRub.Peso : 0m;
                            return new
                            {
                                nombre = d.Criterio,
                                peso = peso,
                                puntaje = d.Puntaje,
                                observaciones = d.Observaciones ?? ""
                            };
                        }).ToList();

                        string tipoEvaluador = revision.EsExterno ? "Evaluador Externo" : "Evaluador Interno";

                        var dataSnapshot = new
                        {
                            ProyectoUuid = project.Uuid,
                            RevisionUuid = revision.Uuid,
                            EsExterno = revision.EsExterno,
                            EvaluadorTipo = tipoEvaluador,
                            ComentariosGenerales = dto.ObservacionesGral ?? "",
                            RecomendacionFinal = totalScore >= umbralAprobacion ? "Aprobado sin modificaciones" : "Rechazado",
                            PuntajeTotal = totalScore,
                            CriteriosEvaluados = criteriosSnapshot,
                            Titulo = project.Titulo,
                            CodigoInstitucional = project.CodigoInstitucional,
                            FechaEvaluacion = DateTime.Now.ToString("yyyy-MM-dd")
                        };

                        string json = System.Text.Json.JsonSerializer.Serialize(dataSnapshot);
                        existingDoc.UpdateDataSnapshot(json);

                        existingDoc.TransitionTo(Diitra.Domain.Common.Documents.DocumentState.Signed);

                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al sincronizar rúbrica documental: {ex.Message}");
                }
            }

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                EstadoRevision = "Completada",
                PuntajeTotal = totalScore,
                UmbralAprobacion = umbralAprobacion,
                DictamenRevisor = revision.DictamenRevisor
            });

            var revisorId = revision.IdRevisor ?? 0;
            await _auditService.LogActionAsync(revisorId, "EVALUAR_PROYECTO",
                $"Rúbrica completada. Puntaje: {totalScore}/100. Dictamen: {revision.DictamenRevisor}", "PEER_REVIEW", beforeState, afterState);

            if (project != null)
            {
                try
                {
                    var revisorUser = revision.IdRevisor.HasValue
                        ? await _context.Users.FindAsync(revision.IdRevisor.Value)
                        : null;
                    var nombreRevisor = revisorUser?.Nombre ?? "Un evaluador";

                    await _notificationService.NotifyByRoleCodesAsync(
                        "Evaluación de Par Completada",
                        $"El evaluador {nombreRevisor} ha completado la revisión del proyecto '{project.Titulo}'.",
                        new[] { "DIITRA_ADMIN" },
                        $"/arbitraje/proyecto/{project.Uuid}"
                    );

                    var allProjectRevisions = await _context.Set<InvRevisionesPares>()
                        .Where(r => r.IdProyecto == project.IdProyecto)
                        .ToListAsync();
                    
                    string currentEstadoArbitraje = PeerReviewHelper.DeterminarEstadoArbitraje(allProjectRevisions, umbralAprobacion);
                    if (currentEstadoArbitraje == "Desempate")
                    {
                        await _notificationService.NotifyByRoleCodesAsync(
                            "Desempate pendiente",
                            $"\"{project.Titulo}\" tiene dictámenes divididos. Se requiere un tercer árbitro.",
                            new[] { "DIITRA_ADMIN" },
                            $"/arbitraje/proyecto/{project.Uuid}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar notificación de evaluación completada");
                }
            }

            return true;
        }
    }
}
