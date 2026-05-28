using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;

    public PeerReviewService(DiitraContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
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
            // Obtener nombre del revisor desde Users
            var user = await _context.Users.FindAsync(r.IdRevisor);
            result.Add(MapToDto(r, user?.Nombre ?? "Revisor"));
        }

        return result;
    }

    /// <summary>
    /// Carga la rúbrica dinámica de la convocatoria del proyecto asignado.
    /// Si la convocatoria no tiene rúbrica, devuelve criterios genéricos CACES.
    /// </summary>
    public async Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid)
    {
        var revision = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdConvocatoriaNavigation)
                    .ThenInclude(c => c!.IdRubricaNavigation)
                        .ThenInclude(rub => rub!.InvRubricaCriterios)
            .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdSublineaNavigation)
            .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

        if (revision == null) return null;

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

        return new RubricaDinamicaDto
        {
            IdRubrica = idRubrica,
            NombreRubrica = nombreRubrica,
            ProyectoTitulo = tituloParaRevisor,
            LineaInvestigacion = revision.EsDobleCiego ? null : proyecto.IdSublineaNavigation?.Nombre,
            Justificacion = proyecto.Justificacion,
            Metodologia = proyecto.Metodologia,
            ProyectoUuid = proyecto.Uuid,
            EsDobleCiego = revision.EsDobleCiego,
            PuntajeMinimoAprobacion = puntajeMinimo,
            Criterios = criterios
        };
    }

    public async Task<bool> SubmitEvaluationAsync(EvaluationDto dto)
    {
        var revision = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .FirstOrDefaultAsync(r => r.Uuid == dto.RevisionUuid);

        if (revision == null) return false;

        var project = await _context.InvProyectos.FindAsync(revision.IdProyecto);
        string estadoAnteriorProyecto = project?.Estado ?? "Desconocido";

        var beforeState = System.Text.Json.JsonSerializer.Serialize(new
        {
            EstadoRevision = revision.Estado,
            EstadoProyecto = estadoAnteriorProyecto,
            PuntajeEvaluacion = project?.PuntajeEvaluacion
        });

        revision.Estado = "Completada";
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

        await _context.SaveChangesAsync();

        var afterState = System.Text.Json.JsonSerializer.Serialize(new
        {
            EstadoRevision = "Completada",
            PuntajeTotal = totalScore
        });

        await _auditService.LogActionAsync(revision.IdRevisor, "EVALUAR_PROYECTO",
            $"Rúbrica completada. Puntaje: {totalScore}/100", "PEER_REVIEW", beforeState, afterState);

        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  PANEL DEL DIRECTOR — ARBITRAJE ACTIVO
    // ══════════════════════════════════════════════════════════════════

    public async Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync()
    {
        var proyectosEnRevision = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .Where(p => p.Estado == "En Revisión" || p.Estado == "Enviado")
            .ToListAsync();

        var result = new List<ArbitrajeProyectoDto>();

        foreach (var proyecto in proyectosEnRevision)
        {
            var revisiones = await _context.Set<InvRevisionesPares>()
                .Where(r => r.IdProyecto == proyecto.IdProyecto)
                .ToListAsync();

            var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
            decimal? promedio = completadas.Any()
                ? completadas.Where(r => r.PuntajeTotal.HasValue).Average(r => r.PuntajeTotal)
                : null;

            string estadoArbitraje = DeterminarEstadoArbitraje(revisiones);

            var revDtos = new List<PeerReviewDto>();
            foreach (var rev in revisiones)
            {
                var user = await _context.Users.FindAsync(rev.IdRevisor);
                var meta = await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor);
                revDtos.Add(MapToDto(rev, user?.Nombre ?? "Revisor", meta));
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
                Revisiones = revDtos
            });
        }

        return result;
    }

    public async Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync()
    {
        var todasRevisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
            .Where(r => r.Proyecto.Estado == "En Revisión" || r.Proyecto.Estado == "Enviado")
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
        var proyecto = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

        if (proyecto == null) return null;

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Where(r => r.IdProyecto == proyecto.IdProyecto)
            .ToListAsync();

        var completadas = revisiones.Where(r => r.Estado == "Completada").ToList();
        decimal? promedio = completadas.Any()
            ? completadas.Where(r => r.PuntajeTotal.HasValue).Average(r => r.PuntajeTotal)
            : null;

        var revDtos = new List<PeerReviewDto>();
        foreach (var rev in revisiones)
        {
            var user = await _context.Users.FindAsync(rev.IdRevisor);
            var meta = await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor);
            revDtos.Add(MapToDto(rev, user?.Nombre ?? "Revisor", meta));
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
            EstadoArbitraje = DeterminarEstadoArbitraje(revisiones),
            Revisiones = revDtos
        };
    }

    // ══════════════════════════════════════════════════════════════════
    //  GESTIÓN DE ÁRBITROS
    // ══════════════════════════════════════════════════════════════════

    public async Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(
        string query, bool soloExternos, string? projectUuid)
    {
        // Obtener IDs de los autores del proyecto para excluirlos (blindaje doble ciego)
        var autoresIds = new HashSet<int>();
        if (!string.IsNullOrEmpty(projectUuid))
        {
            var proyecto = await _context.InvProyectos
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (proyecto != null)
            {
                foreach (var prof in proyecto.InvProyectosProfesores)
                    autoresIds.Add(prof.IdUsuario);
                foreach (var alum in proyecto.InvProyectosAlumnos)
                    autoresIds.Add(alum.IdUsuario);
            }
        }

        var queryNorm = query.Trim().ToLower();

        var usuarios = await _context.Users
            .Where(u => !autoresIds.Contains(u.IdUsuario) &&
                        (u.Nombre != null && u.Nombre.ToLower().Contains(queryNorm) ||
                         u.IdSigafi.ToLower().Contains(queryNorm)))
            .Take(20)
            .ToListAsync();

        var result = new List<RevisorDisponibleDto>();

        foreach (var user in usuarios)
        {
            var meta = await _context.Set<InvUsuarioMetadata>()
                .FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);

            var revisionesActivas = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

            // Determinar si es externo: sin rol de docente en el sistema
            result.Add(new RevisorDisponibleDto
            {
                IdUsuario = user.IdUsuario,
                NombreCompleto = user.Nombre ?? user.IdSigafi,
                Email = user.EmailInstitucional,
                Especialidad = meta?.Especialidad,
                GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                OrcidId = meta?.OrcidId,
                EsExterno = soloExternos,
                RevisionesActivas = revisionesActivas
            });
        }

        return soloExternos ? result.Where(r => r.EsExterno) : result;
    }

    public async Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
    {
        var project = await _context.InvProyectos
            .FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);

        if (project == null)
            throw new ArgumentException($"Proyecto con UUID '{dto.ProjectUuid}' no encontrado.");

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

        if (project.Estado == "Enviado")
            project.Estado = "En Revisión";

        await _context.SaveChangesAsync();

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
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
            ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
            .ToListAsync();

        if (!revisiones.Any())
            throw new InvalidOperationException("No hay evaluaciones completadas para cerrar el arbitraje.");

        decimal puntajeMinimo = project.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70m;
        decimal promedio = revisiones
            .Where(r => r.PuntajeTotal.HasValue)
            .Average(r => r.PuntajeTotal!.Value);

        string estadoAnterior = project.Estado;
        string resultado;
        string? mensajeDesempate = null;

        // Lógica normativa CACES: verificar si hay desempate
        bool hayAprobados = revisiones.Any(r => (r.PuntajeTotal ?? 0) >= puntajeMinimo);
        bool hayRechazados = revisiones.Any(r => (r.PuntajeTotal ?? 0) < puntajeMinimo);

        if (hayAprobados && hayRechazados)
        {
            resultado = "Desempate";
            project.Estado = "En Revisión"; // Se mantiene en revisión hasta resolución
            mensajeDesempate = $"Los {revisiones.Count} árbitros presentan dictámenes contradictorios. " +
                               $"Se requiere la designación de un árbitro dirimente o decisión fundada del Director de Investigación.";
        }
        else if (promedio >= puntajeMinimo)
        {
            resultado = "Aprobado";
            project.Estado = "Aprobado";
            project.PuntajeEvaluacion = promedio;
            project.FechaModificacion = DateTime.Now;

            // Generar código institucional si no tiene
            if (string.IsNullOrEmpty(project.CodigoInstitucional))
            {
                var anio = DateTime.Now.Year;
                var seq = await _context.InvProyectos.CountAsync(p => p.FechaRegistro.HasValue &&
                    p.FechaRegistro.Value.Year == anio && p.Estado == "Aprobado") + 1;
                project.CodigoInstitucional = $"DIITRA-{anio}-{seq:D3}";
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

        var revDtos = new List<PeerReviewDto>();
        foreach (var rev in revisiones)
        {
            var user = await _context.Users.FindAsync(rev.IdRevisor);
            revDtos.Add(MapToDto(rev, user?.Nombre ?? "Revisor"));
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

    // ══════════════════════════════════════════════════════════════════
    //  COMPATIBILIDAD LEGADO
    // ══════════════════════════════════════════════════════════════════

    public async Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
        => await AsignarArbitroAsync(dto, dto.IdRevisor);

    public async Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
    {
        var revisiones = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
            .Where(r => r.IdProyecto == projectId)
            .ToListAsync();

        var result = new List<PeerReviewDto>();
        foreach (var r in revisiones)
        {
            var user = await _context.Users.FindAsync(r.IdRevisor);
            result.Add(MapToDto(r, user?.Nombre ?? "Revisor"));
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════════

    private static PeerReviewDto MapToDto(InvRevisionesPares r, string nombreRevisor, InvUsuarioMetadata? meta = null)
        => new()
        {
            Uuid = r.Uuid,
            IdProyecto = r.IdProyecto,
            ProyectoUuid = r.Proyecto?.Uuid ?? "",
            ProyectoTitulo = r.Proyecto?.Titulo ?? "",
            IdRevisor = r.IdRevisor,
            RevisorNombre = nombreRevisor,
            RevisorEspecialidad = meta?.Especialidad,
            RevisorGrado = meta?.GradoAcademicoMaximo,
            FechaAsignacion = r.FechaAsignacion,
            FechaLimite = r.FechaLimite,
            Estado = r.Estado,
            EsExterno = r.EsExterno,
            EsDobleCiego = r.EsDobleCiego,
            PuntajeTotal = r.PuntajeTotal,
            ObservacionesGral = r.ObservacionesGral
        };

    private static string DeterminarEstadoArbitraje(List<InvRevisionesPares> revisiones)
    {
        if (!revisiones.Any()) return "SinArbitros";
        if (revisiones.All(r => r.Estado == "Completada"))
        {
            var scores = revisiones.Where(r => r.PuntajeTotal.HasValue).Select(r => r.PuntajeTotal!.Value).ToList();
            if (scores.Any(s => s >= 70) && scores.Any(s => s < 70)) return "Desempate";
            return "Completado";
        }
        if (revisiones.Any(r => r.Estado == "Completada")) return "EnProceso";
        return "Pendiente";
    }
}