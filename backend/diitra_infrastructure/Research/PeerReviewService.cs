using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using Diitra.Application.Common.Documents;
using Diitra.Application.Common;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;
    private readonly IDocumentEngine _documentEngine;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly IAuthService _authService;
    private readonly ILogger<PeerReviewService> _logger;

    private static bool _tableChecked = false;
    private static readonly object _lock = new object();

    public PeerReviewService(DiitraContext context, IAuditService auditService, IDocumentEngine documentEngine, INotificationService notificationService, IConfiguration configuration, IAuthService authService, ILogger<PeerReviewService> logger)
    {
        _context = context;
        _auditService = auditService;
        _documentEngine = documentEngine;
        _notificationService = notificationService;
        _configuration = configuration;
        _authService = authService;
        _logger = logger;

        if (!_tableChecked)
        {
            lock (_lock)
            {
                if (!_tableChecked)
                {
                    try
                    {
                        _context.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS `inv_config_general` (
                                `Clave` VARCHAR(100) NOT NULL,
                                `Valor` LONGTEXT NOT NULL,
                                `Descripcion` VARCHAR(255) NULL,
                                PRIMARY KEY (`Clave`)
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                        ");
                        _context.Database.ExecuteSqlRaw(@"
                            INSERT IGNORE INTO `inv_config_general` (`Clave`, `Valor`, `Descripcion`) VALUES 
                            ('PeerReview.AutoExtendDeadlines', 'false', 'Indica si se deben extender los plazos de manera automática'),
                            ('PeerReview.AutoExtendDays', '7', 'Días de prórroga automática al expirar plazo');
                        ");
                        _tableChecked = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al inicializar la tabla de configuración inv_config_general");
                    }
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  PORTAL DEL REVISOR
    // ══════════════════════════════════════════════════════════════════

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
            result.Add(MapToDto(r, nombreRevisor));
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
            result.Add(MapToDto(r, nombreRevisor));
        }

        return result;
    }

    /// </summary>
    public async Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid)
    {
        var revision = await _context.Set<InvRevisionesPares>()
            .AsSplitQuery()
            .Include(r => r.Detalles)
            .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdConvocatoriaNavigation)
                    .ThenInclude(c => c!.IdRubricaNavigation)
                        .ThenInclude(rub => rub!.InvRubricaCriterios)
            .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdSublineaNavigation)
            .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

        if (revision == null) return null;

        if (revision.Estado == "Pendiente" && revision.FechaLimite < DateTime.Now)
        {
            var autoExtend = revision.Proyecto != null && revision.Proyecto.AutoExtendDeadlines;
            if (autoExtend)
            {
                var extensionDays = revision.Proyecto.AutoExtendDays > 0 ? revision.Proyecto.AutoExtendDays : 7;
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
                    $"Plazo de arbitraje auto-extendido ({extensionDays} días) al expirar para evaluador en proyecto '{revision.Proyecto.Titulo}'", "PEER_REVIEW", null, null);
            }
            else
            {
                throw new InvalidOperationException("El plazo de evaluación para esta revisión ha vencido. Solicite una prórroga al administrador.");
            }
        }

        var proyecto = revision.Proyecto;
        var conv = proyecto.IdConvocatoriaNavigation;
        var rubrica = conv?.IdRubricaNavigation;

        // Si no hay rúbrica configurada, usar criterios genéricos CACES (fallback)
        List<CriterioRubricaDto> criterios;
        string nombreRubrica;
        int idRubrica;
        decimal puntajeMinimo;

        if (rubrica != null && rubrica.InvRubricaCriterios.Any())
        {
            criterios = rubrica.InvRubricaCriterios
                .OrderBy(c => c.Orden ?? 99)
                .Select(c => new CriterioRubricaDto
                {
                    IdCriterio = c.IdCriterio,
                    Nombre = c.Nombre,
                    Descripcion = c.Descripcion,
                    PesoPorcentaje = c.PesoPorcentaje,
                    Orden = c.Orden ?? 0
                }).ToList();
            nombreRubrica = rubrica.Nombre;
            idRubrica = rubrica.IdRubrica;
            puntajeMinimo = conv?.PuntajeMinimoAprobacion ?? 70m;
        }
        else
        {
            // Criterios genéricos alineados a CACES para IST Ecuador
            criterios = new List<CriterioRubricaDto>
            {
                new() { IdCriterio = -1, Nombre = "Pertinencia Científica y Social", Descripcion = "Relevancia del problema abordado en el contexto ecuatoriano y alineación con las líneas de investigación institucionales.", PesoPorcentaje = 25m, Orden = 1 },
                new() { IdCriterio = -2, Nombre = "Metodología y Rigor Científico", Descripcion = "Coherencia del enfoque metodológico, técnicas de recolección y análisis de datos propuestos.", PesoPorcentaje = 30m, Orden = 2 },
                new() { IdCriterio = -3, Nombre = "Impacto Social y Tecnológico", Descripcion = "Potencial de los resultados para generar transferencia tecnológica, publicaciones indexadas o beneficio comunitario.", PesoPorcentaje = 25m, Orden = 3 },
                new() { IdCriterio = -4, Nombre = "Viabilidad y Presupuesto", Descripcion = "Factibilidad de ejecución en el tiempo propuesto y coherencia entre objetivos, recursos y presupuesto.", PesoPorcentaje = 20m, Orden = 4 }
            };
            nombreRubrica = "Rúbrica Genérica CACES — IST";
            idRubrica = 0;
            puntajeMinimo = 70m;
        }

        // En doble ciego: omitir datos identificadores del proyecto
        string tituloParaRevisor = revision.EsDobleCiego
            ? $"Propuesta #{proyecto.IdProyecto:D4}" // Título anonimizado
            : proyecto.Titulo;

        // ── FALLBACK DE CONTENIDO COMPLETO (DOSSIER TÉCNICO) ────────────────────────
        var docInstance = await _context.DocumentInstances
            .FirstOrDefaultAsync(i => i.EntityUuid == proyecto.Uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION");

        async Task<string?> ResolveFieldAsync(string fieldName, string? baseValue)
        {
            if (!string.IsNullOrWhiteSpace(baseValue)) return baseValue;

            if (docInstance != null)
            {
                // 1. Intentar recuperar desde DataSnapshotJson de la instancia
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

                // 2. Intentar recuperar desde inv_cowork_documentos (contenido colaborativo)
                var coworkKey = $"{docInstance.Uuid}_{fieldName}";
                var coworkDoc = await _context.InvCoworkDocumentos.FirstOrDefaultAsync(d => d.Uuid == coworkKey);
                if (coworkDoc != null && !string.IsNullOrWhiteSpace(coworkDoc.ContentHtml))
                {
                    return coworkDoc.ContentHtml;
                }
            }

            return null;
        }

        string? justificacionFinal = await ResolveFieldAsync("Justificacion", proyecto.Justificacion);
        string? metodologiaFinal = await ResolveFieldAsync("Metodologia", proyecto.Metodologia);
        string? antecedentesFinal = await ResolveFieldAsync("Antecedentes", proyecto.Antecedentes);
        string? descripcionFinal = await ResolveFieldAsync("DescripcionProyecto", proyecto.DescripcionProyecto);
        string? marcoTeoricoFinal = await ResolveFieldAsync("MarcoTeorico", proyecto.MarcoTeorico);
        string? evaluacionFinal = await ResolveFieldAsync("Evaluacion", proyecto.MetodoEvaluacion);
        string? objetivoGeneralFinal = await ResolveFieldAsync("ObjetivoGeneral", null);
        string? objetivosEspecificosFinal = await ResolveFieldAsync("ObjetivosEspecificos", null);
        string? bibliografiaFinal = await ResolveFieldAsync("Bibliografia", null);
        // ──────────────────────────────────────────────────────────────────────

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
            LineaInvestigacion = revision.EsDobleCiego ? null : proyecto.IdSublineaNavigation?.Nombre,
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
            
            // Campos de la revisión completada
            EstadoRevision = revision.Estado,
            ObservacionesGral = revision.ObservacionesGral,
            PuntajeTotal = revision.PuntajeTotal
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

        // Cargar el proyecto con su convocatoria para obtener el umbral de aprobación real
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

        // Usar el umbral de aprobación de la convocatoria (por defecto 70/100 si no está configurado)
        decimal umbralAprobacion = project?.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m;
        revision.DictamenRevisor = totalScore >= umbralAprobacion ? "Aprueba" : "Rechaza";

        await _context.SaveChangesAsync();

        // ── SINCRONIZACIÓN AUTOMÁTICA CON EL SISTEMA DE DOCUMENTOS ──
        // Una instancia RUBRICA_EVALUACION individual por revisión (EntityUuid = revision.Uuid,
        // EntityType = "Revision") garantiza que cada evaluador tenga su propia rúbrica firmada
        // en el Workspace. El workspace agrega estas instancias junto a las del proyecto.
        if (project != null && !string.IsNullOrEmpty(project.Uuid))
        {
            try
            {
                // Clave de unicidad: la revisión individual, no el proyecto global
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
                            revision.Uuid,         // EntityUuid = UUID de la revisión (único por árbitro)
                            "sistema",
                            $"Rúbrica de Evaluación — {tipoEvaluador} — {project.CodigoInstitucional ?? project.Titulo}",
                            "Revision"             // EntityType = "Revision" para distinguirla del documento del proyecto
                        );
                        _context.DocumentInstances.Add(existingDoc);
                        await _context.SaveChangesAsync();
                    }
                }

                if (existingDoc != null && existingDoc.State != Diitra.Domain.Common.Documents.DocumentState.Signed)
                {
                    decimal pertinencia = dto.Detalles.FirstOrDefault(d => d.Criterio.Contains("Pertinencia"))?.Puntaje ?? 0;
                    decimal metodologia = dto.Detalles.FirstOrDefault(d => d.Criterio.Contains("Metodología") || d.Criterio.Contains("Metodologia"))?.Puntaje ?? 0;
                    decimal viabilidad = dto.Detalles.FirstOrDefault(d => d.Criterio.Contains("Viabilidad") || d.Criterio.Contains("Presupuesto"))?.Puntaje ?? 0;
                    decimal impacto = dto.Detalles.FirstOrDefault(d => d.Criterio.Contains("Impacto"))?.Puntaje ?? 0;

                    var dataSnapshot = new
                    {
                        ProyectoUuid = project.Uuid,
                        RevisionUuid = revision.Uuid,
                        EsExterno = revision.EsExterno,
                        Pertinencia = pertinencia,
                        Metodologia = metodologia,
                        Viabilidad = viabilidad,
                        Impacto = impacto,
                        ComentariosGenerales = dto.ObservacionesGral ?? "",
                        RecomendacionFinal = totalScore >= umbralAprobacion ? "Aprobado sin modificaciones" : "Rechazado"
                    };

                    string json = System.Text.Json.JsonSerializer.Serialize(dataSnapshot);
                    existingDoc.UpdateDataSnapshot(json);

                    // Transicionamos a Firmado: solo lectura, evidencia de auditoría académica
                    existingDoc.TransitionTo(Diitra.Domain.Common.Documents.DocumentState.Signed);

                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // Registramos pero no bloqueamos el flujo principal en caso de fallos de sincronización documental
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

        // Notify admins/directors
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
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificación de evaluación completada");
            }
        }

        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  PANEL DEL DIRECTOR — ARBITRAJE ACTIVO
    // ══════════════════════════════════════════════════════════════════

    public async Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
            .OrderByDescending(p => p.Periodoactivoinstituto == 1)
            .ThenByDescending(p => p.Activo == true)
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
            .ThenByDescending(p => p.FechaInicial)
            .FirstOrDefaultAsync();
        var periodId = currentPeriod?.IdPeriodo;

        var proyectosEnRevision = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .Where(p => p.Estado == "En Revisión" || p.Estado == "Enviado" || 
                       ((p.Estado == "Aprobado" || p.Estado == "En Ejecución" || p.Estado == "Rechazado") && 
                        _context.Set<InvRevisionesPares>().Any(r => r.IdProyecto == p.IdProyecto)))
            .ToListAsync();

        var result = new List<ArbitrajeProyectoDto>();

        foreach (var proyecto in proyectosEnRevision)
        {
            var revisiones = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Detalles)
                .Where(r => r.IdProyecto == proyecto.IdProyecto)
                .ToListAsync();

            var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
            var criteriosProyecto = await ObtenerCriteriosRubricaAsync(proyecto.IdConvocatoria);
            decimal? promedio = completadas.Any()
                ? CalcularPromedioPonderado(completadas, criteriosProyecto)
                : null;

            decimal umbralProyecto = proyecto.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m;
            string estadoArbitraje = DeterminarEstadoArbitraje(revisiones, umbralProyecto);

            var revDtos = new List<PeerReviewDto>();
            foreach (var rev in revisiones)
            {
                var user = rev.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                    : null;
                var meta = rev.IdRevisor.HasValue
                    ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
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

                revDtos.Add(MapToDto(rev, nombre, meta, careerNom));
            }

            result.Add(new ArbitrajeProyectoDto
            {
                ProyectoUuid = proyecto.Uuid,
                IdProyecto = proyecto.IdProyecto,
                ProyectoTitulo = proyecto.Titulo,
                CodigoInstitucional = proyecto.CodigoInstitucional,
                EstadoProyecto = proyecto.Estado,
                Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo,
                TotalArbitros = revisiones.Count,
                ArbitrosCompletados = completadas.Count,
                PuntajePromedio = promedio,
                EstadoArbitraje = estadoArbitraje,
                ArbitrajeCerrado = proyecto.PuntajeEvaluacion.HasValue
                    || proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado",
                Revisiones = revDtos
            });
        }

        return result;
    }

    public async Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync()
    {
        var todasRevisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
            .Where(r => r.Proyecto.Estado == "En Revisión" || r.Proyecto.Estado == "Enviado" || 
                       r.Proyecto.Estado == "Aprobado" || r.Proyecto.Estado == "En Ejecución" || r.Proyecto.Estado == "Rechazado")
            .ToListAsync();

        int proyectos = todasRevisiones.Select(r => r.IdProyecto).Distinct().Count();
        int completadas = todasRevisiones.Count(r => r.Estado == "Completada");
        int pendientes = todasRevisiones.Count(r => r.Estado == "Pendiente");

        // Detectar desempates: proyectos donde un árbitro aprueba y otro rechaza
        var proyectosConDesempate = todasRevisiones
            .Where(r => r.Estado == "Completada" && r.PuntajeTotal.HasValue)
            .GroupBy(r => r.IdProyecto)
            .Count(g =>
            {
                var scores = g.Select(r => r.PuntajeTotal!.Value).ToList();
                return scores.Count >= 2 && scores.Any(s => s >= 70) && scores.Any(s => s < 70);
            });

        decimal porcentaje = todasRevisiones.Count > 0
            ? Math.Round((decimal)completadas / todasRevisiones.Count * 100, 1)
            : 0;

        return new ArbitrajeStatsDto
        {
            ProyectosEnRevision = proyectos,
            TotalArbitrosAsignados = todasRevisiones.Count,
            EvaluacionesCompletadas = completadas,
            EvaluacionesPendientes = pendientes,
            CasosDesempate = proyectosConDesempate,
            PorcentajeAvance = porcentaje
        };
    }

    public async Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
            .OrderByDescending(p => p.Periodoactivoinstituto == 1)
            .ThenByDescending(p => p.Activo == true)
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
            .ThenByDescending(p => p.FechaInicial)
            .FirstOrDefaultAsync();
        var periodId = currentPeriod?.IdPeriodo;

        var proyecto = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

        if (proyecto == null) return null;

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .Where(r => r.IdProyecto == proyecto.IdProyecto)
            .ToListAsync();

        var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
        var criteriosProyecto = await ObtenerCriteriosRubricaAsync(proyecto.IdConvocatoria);
        decimal? promedio = completadas.Any()
            ? CalcularPromedioPonderado(completadas, criteriosProyecto)
            : null;

        var revDtos = new List<PeerReviewDto>();
        foreach (var rev in revisiones)
        {
            var user = rev.IdRevisor.HasValue
                ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                : null;
            var meta = rev.IdRevisor.HasValue
                ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
                : null;
            var nombre = user?.Nombre ?? "Revisor";

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

            revDtos.Add(MapToDto(rev, nombre, meta, careerNom));
        }

        return new ArbitrajeProyectoDto
        {
            ProyectoUuid = proyecto.Uuid,
            IdProyecto = proyecto.IdProyecto,
            ProyectoTitulo = proyecto.Titulo,
            CodigoInstitucional = proyecto.CodigoInstitucional,
            EstadoProyecto = proyecto.Estado,
            Convocatoria = proyecto.IdConvocatoriaNavigation?.Titulo,
            TotalArbitros = revisiones.Count,
            ArbitrosCompletados = completadas.Count,
            PuntajePromedio = promedio,
            EstadoArbitraje = DeterminarEstadoArbitraje(revisiones, proyecto.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m),
            ArbitrajeCerrado = proyecto.PuntajeEvaluacion.HasValue
                || proyecto.Estado is "Aprobado" or "En Ejecución" or "Rechazado",
            AutoExtendDeadlines = proyecto.AutoExtendDeadlines,
            AutoExtendDays = proyecto.AutoExtendDays,
            Revisiones = revDtos
        };
    }

    // ══════════════════════════════════════════════════════════════════
    //  GESTIÓN DE ÁRBITROS
    // ══════════════════════════════════════════════════════════════════



    public async Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(
        string query, bool soloExternos, string? projectUuid)
    {
        var autoresSigafi = new HashSet<string>();
        if (!string.IsNullOrEmpty(projectUuid))
        {
            var proyecto = await _context.InvProyectos
                .AsSplitQuery()
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (proyecto != null)
            {
                var userIds = proyecto.InvProyectosProfesores.Select(p => p.IdUsuario)
                    .Concat(proyecto.InvProyectosAlumnos.Select(a => a.IdUsuario))
                    .Distinct()
                    .ToList();

                var sigafiIds = await _context.Users
                    .Where(u => userIds.Contains(u.IdUsuario))
                    .Select(u => u.IdSigafi)
                    .ToListAsync();

                foreach (var id in sigafiIds)
                {
                    if (id != null)
                        autoresSigafi.Add(id.Trim().ToLower());
                }
            }
        }

        var queryNorm = query.Trim().ToLower();
        var result = new List<RevisorDisponibleDto>();

        // 1. Obtener Revisor Externos (Si soloExternos es true, o si es false [que significa 'Todos'])
        // Si soloExternos es false, queremos incluir también los externos.
        // El frontend filtra 'internos' localmente si lo requiere: disponibles.filter(r => !r.es_externo)
        if (soloExternos || !soloExternos)
        {
            var usuariosQuery = _context.Users
                .Where(u => u.TablaSigafi == "otros" && _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIITRA_REVISOR_EXTERNO"));

            if (!string.IsNullOrEmpty(queryNorm))
            {
                usuariosQuery = usuariosQuery.Where(u => u.IdSigafi.Contains(queryNorm) || (u.Nombre != null && u.Nombre.ToLower().Contains(queryNorm)));
            }

            var usuarios = await usuariosQuery
                .OrderBy(u => u.Nombre)
                .Take(30)
                .ToListAsync();

            // Filtrar autores (por si acaso alguno es externo, que es raro pero posible)
            usuarios = usuarios.Where(u => u.IdSigafi == null || !autoresSigafi.Contains(u.IdSigafi.Trim().ToLower())).ToList();

            foreach (var user in usuarios)
            {
                var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
                var revisionesActivas = await _context.Set<InvRevisionesPares>()
                    .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                string? institucion = null;
                if (!string.IsNullOrEmpty(meta?.Configuracion))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(meta.Configuracion);
                        if (doc.RootElement.TryGetProperty("institucion", out var prop))
                        {
                            institucion = prop.GetString();
                        }
                    }
                    catch {}
                }

                result.Add(new RevisorDisponibleDto
                {
                    IdUsuario = user.IdUsuario,
                    NombreCompleto = !string.IsNullOrWhiteSpace(user.Nombre) ? user.Nombre : user.IdSigafi,
                    Email = user.IdSigafi.Contains("@") ? user.IdSigafi : (user.EmailInstitucional ?? "externo@diitra.ist"),
                    Especialidad = meta?.Especialidad,
                    GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                    OrcidId = meta?.OrcidId,
                    Institucion = institucion,
                    EsExterno = true,
                    RevisionesActivas = revisionesActivas
                });
            }
        }

        // 2. Obtener Docentes Internos (Solo si soloExternos es false, es decir, 'Todos')
        if (!soloExternos)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();

            var periodId = currentPeriod?.IdPeriodo;

            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7; // Fallback seguro

            var queryDocentes = _context.Profesores.Where(p => p.Activo == 1);

            // Solo docentes que tengan actividades de investigación (idSubcategoria = researchSubcatId) en el periodo actual
            if (!string.IsNullOrEmpty(periodId))
            {
                queryDocentes = queryDocentes.Where(p => _context.ProfesoresActividades.Any(pa =>
                    pa.IdProfesor == p.IdProfesor &&
                    pa.IdSubcategoria == researchSubcatId &&
                    pa.IdPeriodo == periodId));
            }

            if (!string.IsNullOrEmpty(queryNorm))
            {
                queryDocentes = queryDocentes.Where(p =>
                    (p.IdProfesor != null && p.IdProfesor.Contains(queryNorm)) ||
                    (p.PrimerNombre != null && p.PrimerNombre.ToLower().Contains(queryNorm)) ||
                    (p.PrimerApellido != null && p.PrimerApellido.ToLower().Contains(queryNorm)));
            }

            var profesores = await queryDocentes
                .OrderBy(p => p.PrimerApellido)
                .ThenBy(p => p.PrimerNombre)
                .Take(30)
                .ToListAsync();

            // Filtrar autores del proyecto
            profesores = profesores.Where(p => !autoresSigafi.Contains(p.IdProfesor.Trim().ToLower())).ToList();

            var docIds = profesores.Select(p => p.IdProfesor.Trim()).ToList();
            var profCareers = await _context.ProfesoresCarrerasPeriodos
                .Include(pc => pc.IdCarreraNavigation)
                .Where(pc => docIds.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                .ToListAsync();

            foreach (var p in profesores)
            {
                var pId = p.IdProfesor.Trim();
                
                // Asegurar que existe el registro User en la tabla central
                var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == pId);
                if (user == null)
                {
                    string fullNombre = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim();
                    user = new User {
                        IdSigafi = pId,
                        Nombre = fullNombre,
                        Contrasenia = BCrypt.Net.BCrypt.HashPassword(p.Clave ?? "cambiame", 11),
                        Activo = true,
                        TablaSigafi = "profesor",
                        EmailInstitucional = p.EmailInstitucional ?? p.Email
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    var metadata = new InvUsuarioMetadata { IdUsuario = user.IdUsuario, Uuid = Guid.NewGuid(), Version = 1 };
                    _context.InvUsuariosMetadata.Add(metadata);
                    await _context.SaveChangesAsync();
                }

                var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
                var revisionesActivas = await _context.Set<InvRevisionesPares>()
                    .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                var linkedCareers = profCareers
                    .Where(pc => pc.IdProfesor.Trim() == pId && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                result.Add(new RevisorDisponibleDto
                {
                    IdUsuario = user.IdUsuario,
                    NombreCompleto = user.Nombre ?? pId,
                    Email = p.EmailInstitucional ?? p.Email ?? "",
                    Especialidad = meta?.Especialidad,
                    GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                    OrcidId = meta?.OrcidId,
                    EsExterno = false,
                    RevisionesActivas = revisionesActivas,
                    Carrera = carreraNom
                });
            }
        }

        return result;
    }

    public async Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
    {
        var project = await _context.InvProyectos
            .FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);

        if (project == null)
            throw new ArgumentException($"Proyecto con UUID '{dto.ProjectUuid}' no encontrado.");

        // 1. Validar el estado del proyecto y que esté activo
        if (project.Activo == false)
        {
            throw new InvalidOperationException("No se pueden asignar árbitros a un proyecto inactivo.");
        }

        if (project.Estado != "Enviado" && project.Estado != "En Revisión")
        {
            throw new InvalidOperationException($"No se pueden asignar árbitros a un proyecto en estado '{project.Estado}'.");
        }

        // 2. Validar que el revisor exista y esté activo
        var revisorUser = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == dto.IdRevisor);
        if (revisorUser == null || !revisorUser.Activo)
        {
            throw new InvalidOperationException("El revisor seleccionado no existe o no está activo en el sistema.");
        }

        // 3. Validar rol del evaluador (No estudiantes)
        if (revisorUser.TablaSigafi == "alumno")
        {
            throw new InvalidOperationException("Un estudiante no puede ser asignado como árbitro/evaluador de un proyecto de investigación.");
        }

        // 4. Validar tipo de revisor según la asignación (Interno vs Externo)
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

        // 5. Validar autoevaluación (Director/Coordinador no puede asignarse a sí mismo)
        if (dto.IdRevisor == directorId)
        {
            throw new InvalidOperationException("Conflicto de interés: El director o coordinador que realiza la asignación no puede asignarse a sí mismo como árbitro.");
        }

        // 6. Validar asignación duplicada
        var alreadyAssigned = await _context.Set<InvRevisionesPares>()
            .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == dto.IdRevisor);
        if (alreadyAssigned)
        {
            throw new InvalidOperationException($"El revisor '{revisorUser.Nombre}' ya ha sido asignado a este proyecto.");
        }

        // 7. Validar conflicto de interés directo (miembro del proyecto)
        var isMember = await _context.Set<InvProyectoProfesor>()
            .AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == dto.IdRevisor)
            || await _context.Set<InvProyectoAlumno>()
            .AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == dto.IdRevisor);
        if (isMember)
        {
            throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado es miembro (director o docente/alumno investigador) de este proyecto.");
        }

        // 8. Validar conflicto de interés por grupo de investigación
        if (project.IdGrupo.HasValue)
        {
            var isGroupMember = await _context.Set<InvGrupoMiembro>()
                .AnyAsync(gm => gm.IdGrupo == project.IdGrupo.Value && gm.IdUsuario == dto.IdRevisor && gm.Activo == true);
            if (isGroupMember)
            {
                throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado pertenece al mismo grupo de investigación del proyecto.");
            }
        }

        // 9. Validar conflicto de interés por evaluación cruzada (recíproca)
        var reviewerProjects = await _context.Set<InvProyectoProfesor>()
            .Where(pp => pp.IdUsuario == dto.IdRevisor)
            .Select(pp => pp.IdProyecto)
            .Union(_context.Set<InvProyectoAlumno>()
                .Where(pa => pa.IdUsuario == dto.IdRevisor)
                .Select(pa => pa.IdProyecto))
            .ToListAsync();

        if (reviewerProjects.Any())
        {
            var currentProjectMembers = await _context.Set<InvProyectoProfesor>()
                .Where(pp => pp.IdProyecto == project.IdProyecto)
                .Select(pp => pp.IdUsuario)
                .Union(_context.Set<InvProyectoAlumno>()
                    .Where(pa => pa.IdProyecto == project.IdProyecto)
                    .Select(pa => pa.IdUsuario))
                .ToListAsync();

            var hasCrossReview = await _context.Set<InvRevisionesPares>()
                .AnyAsync(r => reviewerProjects.Contains(r.IdProyecto) && r.IdRevisor.HasValue && currentProjectMembers.Contains(r.IdRevisor.Value));

            if (hasCrossReview)
            {
                throw new InvalidOperationException("Conflicto de interés (Evaluación cruzada): Un miembro de este proyecto ya está asignado para evaluar un proyecto del revisor seleccionado.");
            }

            // 10. Validar conflicto de interés por colaboración activa (coautoría vigente)
            var activeStates = new[] { "Enviado", "En Revisión", "Aprobado", "En Ejecución" };
            var reviewerActiveProjects = await _context.InvProyectos
                .Where(p => reviewerProjects.Contains(p.IdProyecto) && activeStates.Contains(p.Estado) && p.Activo != false)
                .Select(p => p.IdProyecto)
                .ToListAsync();

            if (reviewerActiveProjects.Any())
            {
                var hasRecentCollaboration = await _context.Set<InvProyectoProfesor>()
                    .Where(pp => pp.IdProyecto != project.IdProyecto && reviewerActiveProjects.Contains(pp.IdProyecto) && pp.Activo == true)
                    .AnyAsync(pp => currentProjectMembers.Contains(pp.IdUsuario))
                    || await _context.Set<InvProyectoAlumno>()
                    .Where(pa => pa.IdProyecto != project.IdProyecto && reviewerActiveProjects.Contains(pa.IdProyecto) && pa.Activo == true)
                    .AnyAsync(pa => currentProjectMembers.Contains(pa.IdUsuario));

                if (hasRecentCollaboration)
                {
                    throw new InvalidOperationException("Conflicto de interés (Colaboración activa): El revisor seleccionado tiene colaboraciones activas en otros proyectos vigentes con miembros de este proyecto.");
                }
            }
        }

        // 11. Validar límite máximo de evaluadores por proyecto (máximo 3)
        var currentReviewsCount = await _context.Set<InvRevisionesPares>()
            .CountAsync(r => r.IdProyecto == project.IdProyecto);
        if (currentReviewsCount >= 3)
        {
            throw new InvalidOperationException($"El proyecto ya cuenta con el límite máximo de evaluaciones permitidas ({currentReviewsCount} asignadas).");
        }

        // 12. Validar límite de carga de trabajo del revisor (máximo 3 revisiones pendientes concurrentes)
        var activeReviewsCount = await _context.Set<InvRevisionesPares>()
            .CountAsync(r => r.IdRevisor == dto.IdRevisor && r.Estado == "Pendiente");
        if (activeReviewsCount >= 3)
        {
            throw new InvalidOperationException($"El revisor seleccionado tiene demasiadas evaluaciones pendientes activas (límite de 3 simultáneas, actualmente tiene {activeReviewsCount}).");
        }

        // 13. Validar plazo de entrega
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
            IdRevisor = dto.IdRevisor, // Se almacena en la tabla Users tanto internos como externos
            FechaLimite = dto.FechaLimite,
            EsExterno = dto.EsExterno,
            EsDobleCiego = dto.EsDobleCiego,
            Estado = "Pendiente",
            FechaAsignacion = DateTime.Now
        };

        _context.Set<InvRevisionesPares>().Add(revision);

        if (project.Estado == "Enviado")
            project.Estado = "En Revisión";

        await _context.SaveChangesAsync();

        // 🔗 ENLACES MÁGICOS: Generación automática si es evaluador externo
        if (dto.EsExterno)
        {
            if (revisorUser != null && !string.IsNullOrEmpty(revisorUser.EmailInstitucional))
            {
                // Crear el enlace mágico centralizadamente a través del servicio de autenticación
                var plainToken = await _authService.CreateMagicLinkAsync(revisorUser.IdUsuario, dto.FechaLimite);

                // Obtener URL base de la configuración
                var baseUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
                var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";

                // Notificar vía correo electrónico (con plantilla corporativa desacoplada)
                var emailTitle = $"Acceso de Arbitraje Científico - DIITRA";
                string emailBody;

                var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "AsignarArbitroExterno.html");
                if (File.Exists(templatePath))
                {
                    var templateHtml = await File.ReadAllTextAsync(templatePath);
                    var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
                    emailBody = template(new
                    {
                        project_title = project.Titulo,
                        fecha_limite = dto.FechaLimite.ToString("dd/MM/yyyy"),
                        username = revisorUser.IdSigafi
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

    // ══════════════════════════════════════════════════════════════════
    //  CIERRE DE ARBITRAJE — LÓGICA NORMATIVA CACES
    // ══════════════════════════════════════════════════════════════════

    /// <summary>
    /// Cierra el proceso de arbitraje de un proyecto aplicando la lógica normativa CACES:
    /// - Si todos los árbitros aprueban (≥70) → Aprobado
    /// - Si todos los árbitros rechazan (< 70) → Rechazado  
    /// - Si hay discrepancia → Desempate (requiere tercer árbitro o decisión manual)
    /// </summary>
    public async Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId)
    {
        var project = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .Include(p => p.InvProyectosProfesores)
            .Include(p => p.InvProyectosAlumnos)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
            ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
            .ToListAsync();

        if (!revisiones.Any())
            throw new InvalidOperationException("No hay evaluaciones completadas para cerrar el arbitraje.");

        decimal puntajeMinimo = project.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m;
        var criteriosRubrica = await ObtenerCriteriosRubricaAsync(project.IdConvocatoria);
        decimal promedio = CalcularPromedioPonderado(revisiones, criteriosRubrica);

        string estadoAnterior = project.Estado;
        string resultado;
        string? mensajeDesempate = null;

        // Lógica normativa CACES: verificar si hay desempate
        int aprobadosCount = revisiones.Count(r => (r.PuntajeTotal ?? 0) >= puntajeMinimo);
        int rechazadosCount = revisiones.Count(r => (r.PuntajeTotal ?? 0) < puntajeMinimo);

        if (aprobadosCount == rechazadosCount && revisiones.Count > 0)
        {
            resultado = "Desempate";
            project.Estado = "En Revisión"; // Se mantiene en revisión hasta resolución
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

            // Generar código institucional con transacción serializable para evitar colisión
            // concurrente en caso de aprobaciones simultáneas.
            if (string.IsNullOrEmpty(project.CodigoInstitucional))
            {
                using var seqTransaction = await _context.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable);
                try
                {
                    var anio = DateTime.Now.Year;
                    // Contar proyectos ya aprobados en la BD más el actual (que aún no está guardado)
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

        // Notify all project participants
        try
        {
            var participantUserIds = project.InvProyectosProfesores.Select(p => p.IdUsuario)
                .Concat(project.InvProyectosAlumnos.Select(a => a.IdUsuario))
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

            foreach (var userId in participantUserIds)
            {
                await _notificationService.NotifyUserAsync(
                    userId,
                    title,
                    body,
                    "INVESTIGACION",
                    $"/investigacion/workspace/protocolo-investigacion/{project.Uuid}"
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

    /// <summary>
    /// Inicia la fase de ejecución de un proyecto previamente aprobado en arbitraje.
    /// Transición normativa: Aprobado → En Ejecución.
    /// </summary>
    public async Task<bool> IniciarEjecucionAsync(string projectUuid, int directorId)
    {
        var project = await _context.InvProyectos
            .Include(p => p.InvProyectosProfesores)
            .Include(p => p.InvProyectosAlumnos)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
            ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

        if (project.Estado != "Aprobado")
            throw new InvalidOperationException(
                $"Solo los proyectos en estado 'Aprobado' pueden iniciar ejecución. Estado actual: '{project.Estado}'.");

        string estadoAnterior = project.Estado;
        project.Estado = "En Ejecución";
        project.FechaModificacion = DateTime.Now;

        if (!project.FechaInicio.HasValue)
            project.FechaInicio = DateOnly.FromDateTime(DateTime.Now);

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(directorId, "INICIAR_EJECUCION",
            $"Proyecto '{project.Titulo}' inició fase de ejecución. Código: {project.CodigoInstitucional ?? "N/A"}.",
            "PEER_REVIEW",
            System.Text.Json.JsonSerializer.Serialize(new { Estado = estadoAnterior }),
            System.Text.Json.JsonSerializer.Serialize(new { Estado = project.Estado, project.CodigoInstitucional }));

        _logger.LogInformation("[DIITRA] Proyecto {Uuid} transicionó Aprobado → En Ejecución.", projectUuid);

        // Notify all project participants
        try
        {
            var participantUserIds = project.InvProyectosProfesores.Select(p => p.IdUsuario)
                .Concat(project.InvProyectosAlumnos.Select(a => a.IdUsuario))
                .Distinct()
                .ToList();

            foreach (var userId in participantUserIds)
            {
                await _notificationService.NotifyUserAsync(
                    userId,
                    "Proyecto en Ejecución",
                    $"Su proyecto '{project.Titulo}' ha iniciado la fase de ejecución operativa.",
                    "INVESTIGACION",
                    $"/investigacion/workspace/protocolo-investigacion/{project.Uuid}"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al notificar inicio de ejecución a los participantes del proyecto");
        }

        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  PROMEDIO PONDERADO POR CRITERIOS DE RÚBRICA
    // ══════════════════════════════════════════════════════════════════

    private async Task<List<(string Nombre, decimal Peso)>> ObtenerCriteriosRubricaAsync(int? idConvocatoria)
    {
        if (idConvocatoria.HasValue)
        {
            var conv = await _context.InvConvocatorias
                .Include(c => c.IdRubricaNavigation)
                    .ThenInclude(r => r!.InvRubricaCriterios)
                .FirstOrDefaultAsync(c => c.IdConvocatoria == idConvocatoria);

            if (conv?.IdRubricaNavigation?.InvRubricaCriterios.Any() == true)
            {
                return conv.IdRubricaNavigation.InvRubricaCriterios
                    .OrderBy(c => c.Orden)
                    .Select(c => (c.Nombre, c.PesoPorcentaje))
                    .ToList();
            }
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

    /// <summary>
    /// Promedio ponderado CACES: por cada criterio de la rúbrica, promedia el puntaje
    /// de todos los evaluadores y suma (cada criterio ya está en escala 0-peso%).
    /// </summary>
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

    // ══════════════════════════════════════════════════════════════════
    //  COMPATIBILIDAD LEGADO
    // ══════════════════════════════════════════════════════════════════

    public async Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
        => await AsignarArbitroAsync(dto, dto.IdRevisor);

    public async Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
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

    // ══════════════════════════════════════════════════════════════════
    //  HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════════

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

    // ══════════════════════════════════════════════════════════════════
    //  REVISORES EXTERNOS (sin cuenta institucional)
    // ══════════════════════════════════════════════════════════════════
    public async Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId)
    {
        string identifier = !string.IsNullOrEmpty(dto.Cedula) ? dto.Cedula : dto.Email;

        // 1. Verificar si ya existe un usuario con ese identificador o email
        var existing = await _context.Users.FirstOrDefaultAsync(u => 
            u.IdSigafi == identifier || 
            u.IdSigafi == dto.Email || 
            u.EmailInstitucional == dto.Email);

        if (existing != null)
        {
            if (string.IsNullOrEmpty(existing.Nombre) || string.IsNullOrWhiteSpace(existing.Nombre))
            {
                existing.Nombre = $"{dto.Nombres} {dto.Apellidos}".Trim();
                await _context.SaveChangesAsync();
            }

            if (string.IsNullOrEmpty(existing.EmailInstitucional))
            {
                existing.EmailInstitucional = dto.Email;
                await _context.SaveChangesAsync();
            }

            var metaExisting = await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == existing.IdUsuario);
            if (metaExisting == null)
            {
                metaExisting = new InvUsuarioMetadata
                {
                    IdUsuario = existing.IdUsuario,
                    Uuid = Guid.NewGuid(),
                    Version = 1,
                    OrcidId = dto.OrcidId,
                    Especialidad = dto.Especialidad,
                    GradoAcademicoMaximo = dto.GradoAcademico
                };
                _context.Set<InvUsuarioMetadata>().Add(metaExisting);
                await _context.SaveChangesAsync();
            }
            return metaExisting.Uuid.ToString();
        }

        // 2. Crear User en la tabla central
        var user = new User
        {
            IdSigafi = identifier,
            Nombre = $"{dto.Nombres} {dto.Apellidos}",
            Contrasenia = BCrypt.Net.BCrypt.HashPassword("Diitra2026*", 11),
            Activo = true,
            TablaSigafi = "otros",
            EmailInstitucional = dto.Email
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 3. Crear Metadata
        var configDict = new Dictionary<string, string> { { "institucion", dto.Institucion } };
        var metadata = new InvUsuarioMetadata
        {
            IdUsuario = user.IdUsuario,
            Uuid = Guid.NewGuid(),
            Version = 1,
            OrcidId = dto.OrcidId,
            Especialidad = dto.Especialidad,
            GradoAcademicoMaximo = dto.GradoAcademico,
            Configuracion = System.Text.Json.JsonSerializer.Serialize(configDict)
        };
        _context.Set<InvUsuarioMetadata>().Add(metadata);
        await _context.SaveChangesAsync();

        // 4. Asignar rol de revisor externo
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == "DIITRA_REVISOR_EXTERNO");
        if (role == null)
        {
            role = new Role { CodigoRol = "DIITRA_REVISOR_EXTERNO", Nombre = "Revisor Externo DIITRA", EsActivo = true };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        _context.UserRoles.Add(new UserRole
        {
            IdUsuario = user.IdUsuario,
            IdRol = role.IdRol,
            EsActivo = true,
            FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow)
        });
        await _context.SaveChangesAsync();

        // 5. Auditoría
        await _auditService.LogActionAsync(directorId, "REGISTRAR_REVISOR_EXTERNO",
            $"Revisor externo registrado: {dto.Nombres} {dto.Apellidos} ({dto.Email})",
            "PEER_REVIEW", null, null);

        return metadata.Uuid.ToString();
    }

    public async Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync()
    {
        var externos = await _context.Users
            .Where(u => u.TablaSigafi == "otros")
            .ToListAsync();

        var result = new List<RevisorDisponibleDto>();
        foreach (var user in externos)
        {
            var meta = await _context.Set<InvUsuarioMetadata>()
                .FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);

            var revisionesActivas = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

            string? institucion = null;
            if (!string.IsNullOrEmpty(meta?.Configuracion))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(meta.Configuracion);
                    if (doc.RootElement.TryGetProperty("institucion", out var prop))
                    {
                        institucion = prop.GetString();
                    }
                }
                catch {}
            }

            result.Add(new RevisorDisponibleDto
            {
                IdUsuario = user.IdUsuario,
                NombreCompleto = user.Nombre ?? user.IdSigafi,
                Email = user.EmailInstitucional ?? user.IdSigafi,
                Especialidad = meta?.Especialidad,
                GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                OrcidId = meta?.OrcidId,
                Institucion = institucion,
                EsExterno = true,
                RevisionesActivas = revisionesActivas
            });
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════
    //  GENERACIÓN PDF — ACTA DE DICTAMEN (Adición 5)
    // ══════════════════════════════════════════════════════════════════

    public async Task<byte[]> GenerateDictamenPdfAsync(string projectUuid, int directorId)
    {
        var project = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .Include(p => p.IdSublineaNavigation)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
            ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

        // ── GUARDIA: El PDF sólo está disponible después de cerrar el arbitraje ──────────────
        var estadosPostCierre = new[] { "Aprobado", "En Ejecución", "Rechazado" };
        var cierreEjecutado = estadosPostCierre.Contains(project.Estado)
            || (project.Estado == "En Revisión" && project.PuntajeEvaluacion.HasValue);

        if (!cierreEjecutado)
            throw new InvalidOperationException(
                "El Acta de Dictamen aún no está disponible. El Director de Investigación debe ejecutar el cierre formal del arbitraje antes de descargar este documento.");
        // ─────────────────────────────────────────────────────────────────────────────────────

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
            .ToListAsync();

        var director = await _context.Users.FindAsync(directorId);

        // Usar la nota definitiva registrada en el cierre, o recalcular con promedio ponderado
        decimal promedio = project.PuntajeEvaluacion
            ?? CalcularPromedioPonderado(revisiones, await ObtenerCriteriosRubricaAsync(project.IdConvocatoria));

        decimal puntajeMinimo = project.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m;
        string resultado = promedio >= puntajeMinimo ? "Aprobado" : "Rechazado";

        // Detectar desempate
        var votos = revisiones.Select(r => r.DictamenRevisor ?? "Pendiente").ToList();
        int aprueba = votos.Count(v => v == "Aprueba");
        int rechaza = votos.Count(v => v == "Rechaza");
        string? mensajeDesempate = null;
        if (aprueba == rechaza && revisiones.Count >= 2)
        {
            resultado = "Desempate";
            mensajeDesempate = $"Panel dividido: {aprueba} aprueba(n) vs {rechaza} rechaza(n). Se requiere un tercer árbitro para desempatar.";
        }

        // 2. Construir el objeto de datos para el motor de documentos (Scriban)
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

        // 3. Invocar el Document Engine
        var request = new DocumentRequest
        {
            TemplateCode = "DICTAMEN_ARBITRAJE",
            Data = data,
            RequestedBy = director?.Nombre ?? "Sistema",
            ProjectUuid = projectUuid,
            IsBlindMode = true,
            IsDraftMode = false
        };

        var result = await _documentEngine.GenerateAsync(request);
        return result.PdfBytes;
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

        // 1. Actualizar fecha límite de la revisión
        revision.FechaLimite = nuevaFecha;

        // 2. Si el revisor es externo y tiene enlaces mágicos activos, actualizar su expiración
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

        // 3. Registrar auditoría
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