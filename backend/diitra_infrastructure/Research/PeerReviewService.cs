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

namespace diitra_infrastructure.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;
    private readonly IDocumentEngine _documentEngine;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;

    public PeerReviewService(DiitraContext context, IAuditService auditService, IDocumentEngine documentEngine, INotificationService notificationService, IConfiguration configuration)
    {
        _context = context;
        _auditService = auditService;
        _documentEngine = documentEngine;
        _notificationService = notificationService;
        _configuration = configuration;
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

        // Calcular dictamen individual del árbitro (umbral estándar 70/100)
        revision.DictamenRevisor = totalScore >= 70m ? "Aprueba" : "Rechaza";

        await _context.SaveChangesAsync();

        var afterState = System.Text.Json.JsonSerializer.Serialize(new
        {
            EstadoRevision = "Completada",
            PuntajeTotal = totalScore,
            DictamenRevisor = revision.DictamenRevisor
        });

        var revisorId = revision.IdRevisor ?? 0;
        await _auditService.LogActionAsync(revisorId, "EVALUAR_PROYECTO",
            $"Rúbrica completada. Puntaje: {totalScore}/100. Dictamen: {revision.DictamenRevisor}", "PEER_REVIEW", beforeState, afterState);

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
                var user = rev.IdRevisor.HasValue
                    ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                    : null;
                var meta = rev.IdRevisor.HasValue
                    ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
                    : null;
                var nombre = user?.Nombre ?? "Revisor Externo";
                revDtos.Add(MapToDto(rev, nombre, meta));
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
            var user = rev.IdRevisor.HasValue
                ? await _context.Users.FindAsync(rev.IdRevisor.Value)
                : null;
            var meta = rev.IdRevisor.HasValue
                ? await _context.Set<InvUsuarioMetadata>().FirstOrDefaultAsync(m => m.IdUsuario == rev.IdRevisor.Value)
                : null;
            var nombre = user?.Nombre ?? "Revisor";
            revDtos.Add(MapToDto(rev, nombre, meta));
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
        var autoresSigafi = new HashSet<string>();
        if (!string.IsNullOrEmpty(projectUuid))
        {
            var proyecto = await _context.InvProyectos
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

        if (soloExternos)
        {
            // Búsqueda de Externos: misma lógica que en AdminService corrigiendo el filtro de metadata
            var usuariosQuery = _context.Users
                .Where(u => u.TablaSigafi == "otros" && _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIITRA_REVISOR_EXTERNO"));

            if (!string.IsNullOrEmpty(queryNorm))
            {
                usuariosQuery = usuariosQuery.Where(u => u.IdSigafi.Contains(queryNorm) || (u.Nombre != null && u.Nombre.ToLower().Contains(queryNorm)));
            }

            var usuarios = await usuariosQuery
                .OrderBy(u => u.Nombre)
                .Take(20)
                .ToListAsync();

            // Filtrar autores (por si acaso alguno es externo, que es raro pero posible)
            usuarios = usuarios.Where(u => u.IdSigafi == null || !autoresSigafi.Contains(u.IdSigafi.Trim().ToLower())).ToList();

            foreach (var user in usuarios)
            {
                var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
                var revisionesActivas = await _context.Set<InvRevisionesPares>()
                    .CountAsync(r => r.IdRevisor == user.IdUsuario && r.Estado == "Pendiente");

                result.Add(new RevisorDisponibleDto
                {
                    IdUsuario = user.IdUsuario,
                    NombreCompleto = !string.IsNullOrWhiteSpace(user.Nombre) ? user.Nombre : user.IdSigafi,
                    Email = user.IdSigafi.Contains("@") ? user.IdSigafi : (user.EmailInstitucional ?? "externo@diitra.ist"),
                    Especialidad = meta?.Especialidad,
                    GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                    OrcidId = meta?.OrcidId,
                    EsExterno = true,
                    RevisionesActivas = revisionesActivas
                });
            }
        }
        else
        {
            // Búsqueda de Docentes Internos: mismos filtros que en http://localhost:3000/usuarios
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();

            var periodId = currentPeriod?.IdPeriodo;

            var queryDocentes = _context.Profesores.Where(p => p.Activo == 1);

            // Solo docentes que tengan actividades de investigación (idSubcategoria = 7) en el periodo actual
            if (!string.IsNullOrEmpty(periodId))
            {
                queryDocentes = queryDocentes.Where(p => _context.ProfesoresActividades.Any(pa =>
                    pa.IdProfesor == p.IdProfesor &&
                    pa.IdSubcategoria == 7 &&
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
                .Take(20)
                .ToListAsync();

            // Filtrar autores del proyecto
            profesores = profesores.Where(p => !autoresSigafi.Contains(p.IdProfesor.Trim().ToLower())).ToList();

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

                result.Add(new RevisorDisponibleDto
                {
                    IdUsuario = user.IdUsuario,
                    NombreCompleto = user.Nombre ?? pId,
                    Email = p.EmailInstitucional ?? p.Email ?? "",
                    Especialidad = meta?.Especialidad,
                    GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                    OrcidId = meta?.OrcidId,
                    EsExterno = false,
                    RevisionesActivas = revisionesActivas
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
            var revisorUser = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == dto.IdRevisor);
            if (revisorUser != null && !string.IsNullOrEmpty(revisorUser.EmailInstitucional))
            {
                // Generar token aleatorio criptográficamente seguro
                var tokenBytes = new byte[32];
                using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
                {
                    rng.GetBytes(tokenBytes);
                }
                var plainToken = Convert.ToHexString(tokenBytes);

                // Calcular Hash SHA-256
                var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
                var tokenHash = Convert.ToHexString(tokenHashBytes);

                // Guardar en inv_magic_links (expiración extendida dinámicamente hasta la fecha límite del arbitraje)
                var magicLink = new InvMagicLink
                {
                    IdUsuario = revisorUser.IdUsuario,
                    TokenHash = tokenHash,
                    FechaCreacion = DateTime.UtcNow,
                    FechaExpiracion = dto.FechaLimite,
                    Utilizado = false
                };
                _context.Set<InvMagicLink>().Add(magicLink);
                await _context.SaveChangesAsync();

                // Obtener URL base de la configuración
                var baseUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
                var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";

                // Notificar vía correo electrónico (con plantilla corporativa)
                var emailTitle = $"Acceso de Arbitraje Científico - DIITRA";
                var emailBody = $"Estimado/a {revisorUser.Nombre},\n\n" +
                                $"Ha sido asignado/a para realizar el arbitraje del proyecto de investigación titulado:\n" +
                                $"\"{project.Titulo}\"\n\n" +
                                $"Para ingresar a la plataforma y emitir su dictamen de forma segura sin requerir contraseña, " +
                                $"utilice el siguiente enlace único de acceso (vigente hasta la fecha límite {dto.FechaLimite:dd/MM/yyyy}):\n\n" +
                                $"{magicLinkUrl}\n\n" +
                                $"Si prefiere iniciar sesión de forma convencional a través de la página de login principal, puede utilizar las siguientes credenciales temporales:\n" +
                                $"• Usuario: {revisorUser.IdSigafi}\n" +
                                $"• Contraseña por defecto: Diitra2026*\n\n" +
                                $"Recuerde que por seguridad es aconsejable cambiar su contraseña temporal una vez que haya ingresado al sistema.";

                await _notificationService.NotifyUserAsync(
                    revisorUser.IdUsuario,
                    emailTitle,
                    emailBody,
                    "PEER_REVIEW",
                    magicLinkUrl
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
            var user = r.IdRevisor.HasValue
                ? await _context.Users.FindAsync(r.IdRevisor.Value)
                : null;
            var nombre = user?.Nombre ?? "Revisor Externo";
            result.Add(MapToDto(r, nombre));
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════════

    private static PeerReviewDto MapToDto(
        InvRevisionesPares r,
        string nombreRevisor,
        InvUsuarioMetadata? meta = null)
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
        var metadata = new InvUsuarioMetadata
        {
            IdUsuario = user.IdUsuario,
            Uuid = Guid.NewGuid(),
            Version = 1,
            OrcidId = dto.OrcidId,
            Especialidad = dto.Especialidad,
            GradoAcademicoMaximo = dto.GradoAcademico
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

            result.Add(new RevisorDisponibleDto
            {
                IdUsuario = user.IdUsuario,
                NombreCompleto = user.Nombre ?? user.IdSigafi,
                Email = user.EmailInstitucional ?? user.IdSigafi,
                Especialidad = meta?.Especialidad,
                GradoAcademicoMaximo = meta?.GradoAcademicoMaximo,
                OrcidId = meta?.OrcidId,
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
        // 1. Obtener el dictamen (reutiliza la lógica de CerrarArbitrajeAsync sin persistir)
        var project = await _context.InvProyectos
            .Include(p => p.IdConvocatoriaNavigation)
            .Include(p => p.IdSublineaNavigation)
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid)
            ?? throw new ArgumentException($"Proyecto '{projectUuid}' no encontrado.");

        var revisiones = await _context.Set<InvRevisionesPares>()
            .Where(r => r.IdProyecto == project.IdProyecto && r.Estado == "Completada")
            .ToListAsync();

        var director = await _context.Users.FindAsync(directorId);

        decimal promedio = revisiones.Any(r => r.PuntajeTotal.HasValue)
            ? revisiones.Where(r => r.PuntajeTotal.HasValue).Average(r => r.PuntajeTotal!.Value)
            : 0;

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
            mensajeDesempate = $"Panel dividido: {aprueba} aprueba(n) vs {rechaza} rechaza(n). Se requiere un tercer árbitro dirimente.";
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
}