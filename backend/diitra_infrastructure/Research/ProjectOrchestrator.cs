using System;
using System.Linq;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace diitra_infrastructure.Research
{
    public class ProjectOrchestrator : IProjectOrchestrator
    {
        private static readonly string[] OversightRoleCodes = { "DIITRA_ADMIN", "ADMIN_SISTEMA", "DIRECTOR_INV" };

        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ProjectOrchestrator> _logger;

        public ProjectOrchestrator(DiitraContext context, IAuthService authService, IAuditService auditService, INotificationService notificationService, ILogger<ProjectOrchestrator> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Localizar o Crear el Proyecto Core
                InvProyecto? project = null;
                if (!string.IsNullOrEmpty(dto.Uuid))
                {
                    project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.Uuid);
                }

                string? beforeJson = null;
                if (project != null)
                {
                    // 1.1 Bloqueo de Integridad por Estado
                    if (project.Estado != "Borrador" && project.Estado != "En Corrección")
                    {
                        return new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." };
                    }

                    var beforeState = new
                    {
                        Titulo = project.Titulo,
                        CodigoInstitucional = project.CodigoInstitucional,
                        DescripcionProyecto = project.DescripcionProyecto,
                        Antecedentes = project.Antecedentes,
                        Justificacion = project.Justificacion,
                        MarcoTeorico = project.MarcoTeorico,
                        Metodologia = project.Metodologia,
                        Evaluacion = project.MetodoEvaluacion,
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
                    beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);
                }
                else
                {
                    project = new InvProyecto
                    {
                        Uuid = dto.Uuid ?? Guid.NewGuid().ToString(),
                        FechaRegistro = DateTime.Now,
                        Estado = "Borrador"
                    };
                    _context.InvProyectos.Add(project);
                }

                // 2. Mapeo de Atributos Nucleares
                project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
                project.CodigoInstitucional = dto.CodigoInstitucional;
                project.DescripcionProyecto = dto.DescripcionProyecto;
                project.Antecedentes = dto.Antecedentes;
                project.Justificacion = dto.Justificacion;
                project.MarcoTeorico = dto.MarcoTeorico;
                project.Metodologia = dto.Metodologia;
                project.MetodoEvaluacion = dto.Evaluacion;
                project.TiempoEjecucion = dto.TiempoEjecucion;
                project.TieneGrupo = dto.TieneGrupoInvestigacion;

                // Mapear el Grupo de Investigación por nombre/siglas
                if (dto.TieneGrupoInvestigacion == true && !string.IsNullOrEmpty(dto.GrupoInvestigacion))
                {
                    var group = await _context.InvGruposInvestigacion
                        .FirstOrDefaultAsync(g => g.Nombre == dto.GrupoInvestigacion || g.Siglas == dto.GrupoInvestigacion);
                    if (group != null)
                    {
                        project.IdGrupo = group.IdGrupo;
                    }
                }
                else
                {
                    project.IdGrupo = null;
                }

                project.IdConvocatoria = (dto.IdConvocatoria.HasValue && dto.IdConvocatoria.Value > 0) ? dto.IdConvocatoria.Value : null;
                project.IdObjetivoPnd = (dto.IdObjetivoPnd.HasValue && dto.IdObjetivoPnd.Value > 0) ? dto.IdObjetivoPnd.Value : null;

                // Núcleo Innovación & TRL
                project.IdEntidadAliada = (dto.IdEntidadAliada.HasValue && dto.IdEntidadAliada.Value > 0) ? dto.IdEntidadAliada.Value : null;
                project.TrlInicial = (sbyte?)(dto.TrlInicial ?? 1);
                project.TrlActual = (sbyte?)(dto.TrlActual ?? 1);
                project.TrlMeta = (sbyte?)(dto.TrlMeta ?? 1);

                // Persistencia Completa en Metadata (Future-Proof)
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await SaveChangesWithConcurrencyResolutionAsync(); // Aseguramos ID del proyecto

                // Sincronización de Carreras
                if (dto.IdCarrera.HasValue && dto.IdCarrera.Value > 0)
                {
                    var oldCarreras = _context.InvProyectosCarreras.Where(pc => pc.IdProyecto == project.IdProyecto);
                    _context.InvProyectosCarreras.RemoveRange(oldCarreras);
                    
                    _context.InvProyectosCarreras.Add(new InvProyectoCarrera
                    {
                        IdProyecto = project.IdProyecto,
                        IdCarrera = dto.IdCarrera.Value
                    });
                }

                // Sincronización automática de miembros de grupo (CACES Requirement)
                if (project.TieneGrupo == true && project.IdGrupo.HasValue)
                {
                    var groupMembers = await _context.InvGruposMiembros
                        .Include(m => m.IdUsuarioNavigation)
                        .Where(m => m.IdGrupo == project.IdGrupo.Value && m.Activo != false)
                        .ToListAsync();

                    if (dto.Investigadores == null)
                    {
                        dto.Investigadores = new List<InvestigadorDto>();
                    }

                    foreach (var member in groupMembers)
                    {
                        var user = member.IdUsuarioNavigation;
                        if (user == null) continue;

                        var alreadyAdded = dto.Investigadores.Any(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == user.IdSigafi.Trim());
                        if (!alreadyAdded)
                        {
                            dto.Investigadores.Add(new InvestigadorDto
                            {
                                Nombre = user.Nombre,
                                Cedula = user.IdSigafi,
                                Rol = member.Rol ?? "Co-Investigador",
                                NivelAcademico = user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                                Telefono = "",
                                Activo = true,
                                FechaInicio = DateTime.Now
                            });
                        }
                    }

                    // Asegurar que el JSON guardado también refleje la lista sincronizada
                    project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                }

                // 3. Sincronización de Equipo (Anti-Corruption Layer de los Investigadores)
                if (dto.Investigadores != null && dto.Investigadores.Count > 0)
                {
                    await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores);
                }

                // Auto-vincular al creador como Director (nunca para roles de supervisión institucional)
                if (!string.IsNullOrEmpty(creatorUserIdRef))
                {
                    var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == creatorUserIdRef);
                    if (internalUser != null && !await IsOversightUserAsync(internalUser.IdUsuario))
                    {
                        var isLinked = await _context.InvProyectosProfesores.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == internalUser.IdUsuario) ||
                                       await _context.InvProyectosAlumnos.AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == internalUser.IdUsuario);
                        
                        if (!isLinked)
                        {
                            if (internalUser.TablaSigafi == "alumno")
                            {
                                _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    Rol = "Co-Investigador (Estudiante)",
                                    NivelAcademico = "Pregrado",
                                    Telefono = ""
                                });
                            }
                            else
                            {
                                _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    Rol = "Director de Proyecto",
                                    NivelAcademico = "Tercer Nivel",
                                    Telefono = "",
                                    EsDirector = true
                                });
                            }
                        }
                    }
                }

                // 4. Sincronización de Objetivos
                int defaultObjetivoId = await SyncObjetivosAsync(project.IdProyecto, dto.ObjetivoGeneral, dto.ObjetivosEspecificos);

                // 5. Sincronización de Presupuesto
                await SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);

                // 6. Sincronización de MML
                await SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);

                // 7. Sincronización de Impactos
                await SyncImpactosAsync(project.IdProyecto, dto.Impacto);

                // 8. Sincronización de Productos
                await SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);

                // 9. Sincronización de Cronograma
                await SyncCronogramaAsync(project.IdProyecto, defaultObjetivoId, dto.Cronograma);

                // 10. Sincronización de Bibliografía
                await SyncBibliografiaAsync(project.IdProyecto, dto.Bibliografia);

                // 11. Sincronización de Recursos Disponibles
                await SyncRecursosDisponiblesAsync(project.IdProyecto, dto.RecursosDisponibles);

                await SaveChangesWithConcurrencyResolutionAsync();
                await transaction.CommitAsync();

                var afterState = new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    DescripcionProyecto = project.DescripcionProyecto,
                    Antecedentes = project.Antecedentes,
                    Justificacion = project.Justificacion,
                    MarcoTeorico = project.MarcoTeorico,
                    Metodologia = project.Metodologia,
                    Evaluacion = project.MetodoEvaluacion,
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

        public async Task<List<ProyectoResumenDto>> GetAllProjectsAsync()
        {
            return await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdObjetivoPndNavigation)
                .Include(p => p.IdEntidadAliadaNavigation)
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .Include(p => p.InvProyectosCarreras).ThenInclude(pc => pc.IdCarreraNavigation)
                .OrderByDescending(p => p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
                    Carrera = p.InvProyectosCarreras.Select(pc => pc.IdCarreraNavigation.Carrera1).FirstOrDefault(),
                    PresupuestoTotal = p.InvPresupuestoItems.Sum(i => (decimal?)i.ValorUnitario * (decimal?)i.Cantidad),
                    PresupuestoEjecutado = p.ValorEjecucion,
                    PuntajeEvaluacion = p.PuntajeEvaluacion,
                    FechaRegistro = p.FechaRegistro,
                    FechaModificacion = p.FechaModificacion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    TiempoEjecucion = p.TiempoEjecucion,
                    ConvocatoriaTitulo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.Titulo : null,
                    TotalInvestigadores = p.InvProyectosProfesores.Count + p.InvProyectosAlumnos.Count,
                    TotalProductos = p.InvProductos.Count,
                    TotalInformes = p.InvInformesAvance.Count,
                    InformesAprobados = p.InvInformesAvance.Count(i => i.Estado == "Aprobado"),
                    TrlActual = (int?)p.TrlActual,
                    TrlMeta = (int?)p.TrlMeta,
                    TotalEstudiantes = p.InvProyectosAlumnos.Count(pa => pa.Activo != false),
                    EntidadAliada = p.IdEntidadAliadaNavigation != null ? p.IdEntidadAliadaNavigation.RazonSocial : null,
                    ObjetivoPnd = p.IdObjetivoPndNavigation != null ? p.IdObjetivoPndNavigation.Nombre : null,
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null
                })
                .ToListAsync();
        }

        public async Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia)
        {
            // Buscar el usuario interno por su id de referencia externo
            var userId = await _context.Users
                .Where(u => u.IdSigafi == userIdReferencia)
                .Select(u => (int?)u.IdUsuario)
                .FirstOrDefaultAsync();

            if (userId == null)
                return new List<ProyectoResumenDto>();

            // Proyectos donde participa como profesor
            var proyectosProfesor = _context.InvProyectosProfesores
                .Where(pp => pp.IdUsuario == userId.Value)
                .Select(pp => pp.IdProyecto);

            // Proyectos donde participa como alumno
            var proyectosAlumno = _context.InvProyectosAlumnos
                .Where(pa => pa.IdUsuario == userId.Value)
                .Select(pa => pa.IdProyecto);

            var misProyectosIds = proyectosProfesor.Union(proyectosAlumno);

            return await _context.InvProyectos
                .Where(p => misProyectosIds.Contains(p.IdProyecto))
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdObjetivoPndNavigation)
                .Include(p => p.IdEntidadAliadaNavigation)
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .Include(p => p.InvProyectosCarreras).ThenInclude(pc => pc.IdCarreraNavigation)
                .OrderByDescending(p => p.FechaModificacion ?? p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
                    Carrera = p.InvProyectosCarreras.Select(pc => pc.IdCarreraNavigation.Carrera1).FirstOrDefault(),
                    PresupuestoTotal = p.InvPresupuestoItems.Sum(i => (decimal?)i.ValorUnitario * (decimal?)i.Cantidad),
                    PresupuestoEjecutado = p.ValorEjecucion,
                    PuntajeEvaluacion = p.PuntajeEvaluacion,
                    FechaRegistro = p.FechaRegistro,
                    FechaModificacion = p.FechaModificacion,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    TiempoEjecucion = p.TiempoEjecucion,
                    ConvocatoriaTitulo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.Titulo : null,
                    RolEnProyecto = p.InvProyectosProfesores
                        .Where(pp => pp.IdUsuario == userId.Value)
                        .Select(pp => pp.Rol)
                        .FirstOrDefault()
                        ?? p.InvProyectosAlumnos
                        .Where(pa => pa.IdUsuario == userId.Value)
                        .Select(pa => pa.Rol)
                        .FirstOrDefault() ?? "Investigador",
                    TotalInvestigadores = p.InvProyectosProfesores.Count + p.InvProyectosAlumnos.Count,
                    TotalProductos = p.InvProductos.Count,
                    TotalInformes = p.InvInformesAvance.Count,
                    InformesAprobados = p.InvInformesAvance.Count(i => i.Estado == "Aprobado"),
                    TrlActual = (int?)p.TrlActual,
                    TrlMeta = (int?)p.TrlMeta,
                    TotalEstudiantes = p.InvProyectosAlumnos.Count(pa => pa.Activo != false),
                    EntidadAliada = p.IdEntidadAliadaNavigation != null ? p.IdEntidadAliadaNavigation.RazonSocial : null,
                    ObjetivoPnd = p.IdObjetivoPndNavigation != null ? p.IdObjetivoPndNavigation.Nombre : null,
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null
                })
                .ToListAsync();
        }

        public async Task<string?> ResolveCanonicalUuidAsync(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return null;

            var trimmed = identifier.Trim();

            var exact = await _context.InvProyectos
                .Where(p => p.Uuid == trimmed)
                .Select(p => p.Uuid)
                .FirstOrDefaultAsync();
            if (exact != null) return exact;

            if (int.TryParse(trimmed, out int idProyecto))
            {
                var byId = await _context.InvProyectos
                    .Where(p => p.IdProyecto == idProyecto)
                    .Select(p => p.Uuid)
                    .FirstOrDefaultAsync();
                if (byId != null) return byId;
            }

            if (!trimmed.Contains('-') && trimmed.Length >= 4)
            {
                var prefix = trimmed.ToLowerInvariant();
                var matches = await _context.InvProyectos
                    .Where(p => p.Uuid.ToLower().StartsWith(prefix))
                    .Select(p => p.Uuid)
                    .ToListAsync();

                if (matches.Count == 1) return matches[0];
                if (matches.Count > 1)
                {
                    var segmentMatch = matches.FirstOrDefault(u =>
                        u.Split('-')[0].Equals(trimmed, StringComparison.OrdinalIgnoreCase));
                    return segmentMatch ?? matches[0];
                }
            }

            return null;
        }

        public async Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
        {
            var canonicalUuid = await ResolveCanonicalUuidAsync(uuid);
            if (canonicalUuid == null) return null;

            var p = await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
                .Include(p => p.IdGrupoNavigation)
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdUsuarioNavigation)
                .Include(p => p.InvProyectosAlumnos).ThenInclude(pa => pa.IdUsuarioNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas).ThenInclude(c => c.InvCronogramaSemanas)
                .Include(p => p.InvBibliografiasProyecto)
                .Include(p => p.InvImpactosProyecto)
                .Include(p => p.InvProductos)
                .Include(p => p.MatrizMarcoLogico)
                .Include(p => p.InvRecursosDisponibles)
                .Include(p => p.InvGastos).ThenInclude(g => g.IdItemNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);

            if (p == null) return null;

            // Obtener periodo académico (Lógica Resiliente de Descubrimiento)
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

            var profCedulas = p.InvProyectosProfesores
                .Select(pp => pp.IdUsuarioNavigation?.IdSigafi?.Trim())
                .Where(c => !string.IsNullOrEmpty(c))
                .Cast<string>()
                .ToList();

            var studentCedulas = p.InvProyectosAlumnos
                .Select(pa => pa.IdUsuarioNavigation?.IdSigafi?.Trim())
                .Where(c => !string.IsNullOrEmpty(c))
                .Cast<string>()
                .ToList();

            var profCareers = new List<ProfesoresCarrerasPeriodo>();
            if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
            {
                profCareers = await _context.ProfesoresCarrerasPeriodos
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => profCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                    .ToListAsync();
            }

            var alumCareers = new List<AlumnosCarrera>();
            if (studentCedulas.Any())
            {
                alumCareers = await _context.AlumnosCarreras
                    .Where(ac => studentCedulas.Contains(ac.IdAlumno.Trim()))
                    .ToListAsync();
            }
            var allCarrerasList = await _context.Carreras.ToListAsync();

            var researchHours = new List<ProfesoresActividade>();
            var otherAssignedHours = new List<InvProyectoProfesor>();
            if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
            {
                researchHours = await _context.ProfesoresActividades
                    .Where(pa => profCedulas.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                    .ToListAsync();

                var profUserIds = p.InvProyectosProfesores.Select(pp => pp.IdUsuario).Distinct().ToList();
                otherAssignedHours = await _context.InvProyectosProfesores
                    .Include(pp => pp.IdProyectoNavigation)
                    .Where(pp => profUserIds.Contains(pp.IdUsuario) &&
                                 pp.IdProyecto != p.IdProyecto &&
                                 pp.Activo != false &&
                                 (pp.IdProyectoNavigation.Estado == "Enviado" ||
                                  pp.IdProyectoNavigation.Estado == "En Revisión" ||
                                  pp.IdProyectoNavigation.Estado == "Aprobado" ||
                                  pp.IdProyectoNavigation.Estado == "En Ejecución"))
                    .ToListAsync();
            }

            var investigadoresList = new List<InvestigadorDto>();

            foreach (var pp in p.InvProyectosProfesores)
            {
                var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var linkedCareers = profCareers
                    .Where(pc => pc.IdProfesor.Trim() == cedula && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                var availableHours = researchHours.Where(pa => pa.IdProfesor == cedula).Sum(pa => pa.HorasSemana ?? 0);
                var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);

                investigadoresList.Add(new InvestigadorDto
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
                    Carrera = carreraNom,
                    HorasSemanales = pp.HorasSemanales,
                    HorasDisponibles = availableHours,
                    HorasAsignadas = assignedHours
                });
            }

            foreach (var pa in p.InvProyectosAlumnos)
            {
                var cedula = pa.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var sCareerIds = alumCareers
                    .Where(ac => ac.IdAlumno.Trim() == cedula)
                    .Select(ac => ac.IdCarrera)
                    .ToList();
                var sCareers = allCarrerasList
                    .Where(c => sCareerIds.Contains(c.IdCarrera) && !string.IsNullOrEmpty(c.Carrera1))
                    .Select(c => c.Carrera1!)
                    .ToList();
                var carreraNom = sCareers.Any() ? string.Join(", ", sCareers) : "Estudiante";

                investigadoresList.Add(new InvestigadorDto
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
                    Carrera = carreraNom
                });
            }

            ProyectoDto dto;
            if (!string.IsNullOrEmpty(p.MetadataCacesJson))
            {
                try
                {
                    dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(p.MetadataCacesJson) ?? new ProyectoDto();
                }
                catch
                {
                    dto = new ProyectoDto();
                }
            }
            else
            {
                dto = new ProyectoDto();
            }

            dto.Uuid = p.Uuid;
            dto.CodigoInstitucional = p.CodigoInstitucional;
            dto.Estado = p.Estado;
            dto.IdConvocatoria = p.IdConvocatoria;
            dto.IdCarrera = p.InvProyectosCarreras.FirstOrDefault()?.IdCarrera;
            dto.IdObjetivoPnd = p.IdObjetivoPnd;
            dto.Titulo = p.Titulo;
            dto.DescripcionProyecto = p.DescripcionProyecto;
            dto.Antecedentes = p.Antecedentes;
            dto.Justificacion = p.Justificacion;
            dto.MarcoTeorico = p.MarcoTeorico;
            dto.Metodologia = p.Metodologia;
            dto.TiempoEjecucion = p.TiempoEjecucion;
            dto.TieneGrupoInvestigacion = p.TieneGrupo;
            dto.TrlInicial = (int?)p.TrlInicial;
            dto.TrlActual = (int?)p.TrlActual;
            dto.TrlMeta = (int?)p.TrlMeta;
            dto.PuntajeEvaluacion = p.PuntajeEvaluacion;
            dto.LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null;
            dto.GrupoInvestigacion = p.IdGrupoNavigation != null ? p.IdGrupoNavigation.Nombre : null;
            dto.CostoTotal = p.InvPresupuestoItems.Sum(i => i.ValorUnitario * i.Cantidad);
            dto.Investigadores = investigadoresList;
            dto.ObjetivosEspecificos = p.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .Select(o => o.Descripcion)
                .ToList();
            dto.RecursosNecesarios = p.InvPresupuestoItems.Select(i => new RecursoNecesarioDto
            {
                Descripcion = i.Detalle,
                CostoUnitario = i.ValorUnitario,
                IdPartida = i.IdPartida,
                EsGastoCapital = i.EsGastoCapital
            }).ToList();
            dto.Cronograma = p.InvCronogramas.OrderBy(c => c.NumeroActividad).Select(c => new ActividadCronogramaDto
            {
                Numero = c.NumeroActividad,
                Actividad = c.Descripcion,
                Ponderacion = c.Ponderacion,
                EsEntregableCaces = c.EsEntregableCaces,
                Semanas = c.InvCronogramaSemanas.OrderBy(s => s.IdSemana).Select(s => s.Semana).ToList()
            }).ToList();
            dto.Bibliografia = p.InvBibliografiasProyecto.Select(b => b.CitaApa).ToList();
            dto.MatrizMarcoLogico = p.MatrizMarcoLogico.Select(m => new MmlRowDto
            {
                Nivel = m.Nivel,
                Resumen = m.ResumenNarrativo,
                Indicadores = m.Indicadores,
                Medios = m.MediosVerificacion,
                Supuestos = m.Supuestos
            }).ToList();

            dto.Gastos = p.InvGastos.Select(g => new GastoDto
            {
                Id = g.Uuid.ToString(),
                Descripcion = g.Descripcion,
                Partida = g.IdItemNavigation?.IdPartida,
                Monto = g.Monto,
                Fecha = g.FechaGasto.ToString("yyyy-MM-dd"),
                ReferenciaFactura = g.NumeroFactura,
                Categoria = g.IdItemNavigation?.Categoria
            }).ToList();

            return dto;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin)
        {
            var stats = new DashboardStatsDto();

            // ── Métricas Globales (siempre las calculamos para Admin/Director) ──
            var proyectosQuery = _context.InvProyectos.AsQueryable();

            // Optimización: Un único GroupBy para obtener el conteo de todos los estados en una sola consulta
            var conteoEstados = await proyectosQuery
                .GroupBy(p => p.Estado)
                .Select(g => new { Estado = g.Key ?? "Borrador", Cantidad = g.Count() })
                .ToListAsync();

            var conteoDict = conteoEstados.ToDictionary(x => x.Estado, x => x.Cantidad, StringComparer.OrdinalIgnoreCase);

            stats.TotalProyectos = conteoDict.Values.Sum();
            stats.ProyectosBorrador = conteoDict.GetValueOrDefault("Borrador", 0);
            stats.ProyectosEnRevision = conteoDict.GetValueOrDefault("En Revisión", 0) + conteoDict.GetValueOrDefault("Enviado", 0);
            stats.ProyectosAprobados = conteoDict.GetValueOrDefault("Aprobado", 0);
            stats.ProyectosEnEjecucion = conteoDict.GetValueOrDefault("En Ejecución", 0);
            stats.ProyectosFinalizados = conteoDict.GetValueOrDefault("Finalizado", 0);

            stats.TotalConvocatoriasAbiertas = await _context.InvConvocatorias
                .CountAsync(c => c.Estado == "Abierta");

            stats.TotalProductosPeriodo = await _context.InvProductos.CountAsync();
            stats.ArticulosIndexados = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Artículo"));
            stats.Prototipos = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Prototipo"));
            stats.Ponencias = await _context.InvProductos
                .CountAsync(p => p.IdTipoProductoNavigation.Nombre.Contains("Libro") || p.IdTipoProductoNavigation.Nombre.Contains("Ponencia"));

            stats.PresupuestoTotalAsignado = await _context.InvPresupuestoItems
                .SumAsync(i => (decimal?)(i.ValorUnitario * i.Cantidad)) ?? 0;
            stats.PresupuestoTotalEjecutado = await _context.InvProyectos
                .SumAsync(p => p.ValorEjecucion ?? 0);

            // Contar investigadores activos únicos (docentes y alumnos en proyectos que no estén borrador/rechazado/anulado)
            var profesoresActivosQuery = _context.InvProyectosProfesores
                .Where(pp => pp.Activo != false && pp.IdProyectoNavigation.Estado != "Borrador" && pp.IdProyectoNavigation.Estado != "Rechazado" && pp.IdProyectoNavigation.Estado != "Anulado")
                .Select(pp => pp.IdUsuario);

            var alumnosActivosQuery = _context.InvProyectosAlumnos
                .Where(pa => pa.Activo != false && pa.IdProyectoNavigation.Estado != "Borrador" && pa.IdProyectoNavigation.Estado != "Rechazado" && pa.IdProyectoNavigation.Estado != "Anulado")
                .Select(pa => pa.IdUsuario);

            stats.TotalInvestigadoresActivos = await profesoresActivosQuery
                .Union(alumnosActivosQuery)
                .Distinct()
                .CountAsync();

            // Distribución por estado para el gráfico (mapeo seguro en memoria sin consultas SQL adicionales)
            var colorMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Borrador", "#6B7280" },
                { "Enviado", "#3B82F6" },
                { "En Revisión", "#F59E0B" },
                { "Aprobado", "#10B981" },
                { "En Ejecución", "#8B5CF6" },
                { "Finalizado", "#059669" },
                { "Rechazado", "#EF4444" }
            };

            stats.ProyectosPorEstado = conteoEstados
                .Select(x => new EstadoConteoDto
                {
                    Estado = x.Estado,
                    Cantidad = x.Cantidad,
                    Color = colorMap.TryGetValue(x.Estado, out var col) ? col : "#6B7280"
                })
                .ToList();

            // ── Métricas del Investigador (siempre calculamos para el usuario actual) ──
            var userId = await _context.Users
                .Where(u => u.IdSigafi == userIdReferencia)
                .Select(u => (int?)u.IdUsuario)
                .FirstOrDefaultAsync();

            if (userId != null)
            {
                var misIds = _context.InvProyectosProfesores
                    .Where(pp => pp.IdUsuario == userId.Value).Select(pp => pp.IdProyecto)
                    .Union(_context.InvProyectosAlumnos
                    .Where(pa => pa.IdUsuario == userId.Value).Select(pa => pa.IdProyecto));

                stats.MisProyectosActivos = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && (p.Estado == "En Ejecución" || p.Estado == "Aprobado"))
                    .CountAsync();

                stats.MisProyectosBorrador = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && p.Estado == "Borrador")
                    .CountAsync();

                stats.MisProductosRegistrados = await _context.InvProductos
                    .Where(p => misIds.Contains(p.IdProyecto))
                    .CountAsync();

                 stats.MisInformesPendientes = await _context.InvInformesAvance
                    .Where(i => misIds.Contains(i.IdProyecto) && i.Estado == "Pendiente")
                    .CountAsync();

                stats.MisHorasInvestigacion = await _context.InvProyectosProfesores
                    .Where(pp => pp.IdUsuario == userId.Value && pp.Activo != false && (pp.IdProyectoNavigation.Estado == "En Ejecución" || pp.IdProyectoNavigation.Estado == "Aprobado"))
                    .SumAsync(pp => (decimal?)pp.HorasSemanales ?? 0);

                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();

                if (currentPeriod != null)
                {
                    var researchSubcatId = await _context.SubcategoriasActividades
                        .Where(s => s.Subcategoria == "INVESTIGACION")
                        .Select(s => s.IdSubcategoria)
                        .FirstOrDefaultAsync();
                    if (researchSubcatId == 0) researchSubcatId = 7; // Fallback seguro

                    stats.HorasDisponiblesDistributivo = await _context.ProfesoresActividades
                        .Where(pa => pa.IdProfesor == userIdReferencia && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                        .SumAsync(pa => (decimal?)pa.HorasSemana ?? 0);
                }
                else
                {
                    stats.HorasDisponiblesDistributivo = 0;
                }
            }

            // ── Actividad Reciente (últimos 10 eventos) ──
            var ultimosProyectos = await _context.InvProyectos
                .OrderByDescending(p => p.FechaModificacion ?? p.FechaRegistro)
                .Take(5)
                .Select(p => new ActividadRecienteDto
                {
                    Tipo = "proyecto",
                    Descripcion = p.Titulo,
                    Fecha = p.FechaModificacion ?? p.FechaRegistro ?? DateTime.Now,
                    Uuid = p.Uuid,
                    Estado = p.Estado
                })
                .ToListAsync();

            var ultimosInformesDb = await _context.InvInformesAvance
                .Include(i => i.IdProyectoNavigation)
                .OrderByDescending(i => i.IdInforme)
                .Take(5)
                .Select(i => new
                {
                    i.NumeroInforme,
                    TituloProyecto = i.IdProyectoNavigation.Titulo,
                    i.FechaFirma,
                    i.FechaReporte,
                    UuidString = i.Uuid.ToString(),
                    i.Estado
                })
                .ToListAsync();

            var ultimosInformes = ultimosInformesDb.Select(i => new ActividadRecienteDto
            {
                Tipo = "informe",
                Descripcion = $"Informe #{i.NumeroInforme} — {i.TituloProyecto}",
                // Solución del Bug de Fecha: Convertir la fecha real de base de datos de DateOnly a DateTime en memoria
                Fecha = i.FechaFirma ?? new DateTime(i.FechaReporte.Year, i.FechaReporte.Month, i.FechaReporte.Day, 0, 0, 0, DateTimeKind.Utc),
                Uuid = i.UuidString,
                Estado = i.Estado
            }).ToList();

            stats.ActividadReciente = ultimosProyectos
                .Concat(ultimosInformes)
                .OrderByDescending(a => a.Fecha)
                .Take(8)
                .ToList();

            return stats;
        }

        private async Task SyncInvestigadoresAsync(int projectId, System.Collections.Generic.List<InvestigadorDto>? investigadores)
        {
            if (investigadores == null) return;

            // 1. Obtener los integrantes actuales de la base de datos (tanto activos como inactivos)
            var currentProfs = await _context.InvProyectosProfesores
                .Include(pp => pp.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var currentAlums = await _context.InvProyectosAlumnos
                .Include(pa => pa.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            // Guardar cédulas activas recibidas (filtrar las que explícitamente vienen inactivas)
            var activeCedulas = investigadores
                .Where(i => !string.IsNullOrEmpty(i.Cedula) && i.Activo != false)
                .Select(i => i.Cedula!.Trim())
                .ToHashSet();

            // 2. Procesar Profesores Existentes: Desactivar los que ya no vienen en la lista
            foreach (var prof in currentProfs)
            {
                var cedula = prof.IdUsuarioNavigation?.IdSigafi?.Trim();
                if (cedula != null && prof.Activo != false && !activeCedulas.Contains(cedula))
                {
                    prof.Activo = false;
                    prof.FechaFin = DateTime.Now;
                    prof.MotivoCambio = "Retirado del equipo";
                    prof.EsDirector = false; // Al desactivarlo deja de ser director activo
                }
            }

            // 3. Procesar Alumnos Existentes: Desactivar los que ya no vienen en la lista
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

            // 4. Procesar la lista entrante (Agregar nuevos o Reactivar/Actualizar/Desactivar existentes)
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
                        // Reactivar o actualizar
                        existingAlum.Rol = inv.Rol;
                        existingAlum.NivelAcademico = inv.NivelAcademico;
                        existingAlum.Telefono = inv.Telefono;
                        if (inv.Activo == false)
                        {
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
                    }
                    else
                    {
                        // Agregar nuevo
                        _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            Rol = inv.Rol,
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = inv.Telefono,
                            Activo = inv.Activo ?? true,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });
                    }
                }
                else
                {
                    var existingProf = currentProfs.FirstOrDefault(pp => pp.IdUsuario == persona.IdUsuario);
                    if (existingProf != null)
                    {
                        // Reactivar o actualizar
                        existingProf.Rol = inv.Rol;
                        existingProf.NivelAcademico = inv.NivelAcademico;
                        existingProf.Telefono = inv.Telefono;
                        existingProf.EsDirector = esDirector;
                        existingProf.HorasSemanales = inv.HorasSemanales;
                        if (inv.Activo == false)
                        {
                            if (existingProf.Activo != false)
                            {
                                existingProf.Activo = false;
                                existingProf.FechaFin = DateTime.Now;
                                existingProf.MotivoCambio = "Retirado del equipo";
                                existingProf.EsDirector = false; // Al desactivarlo deja de ser director activo
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
                    }
                    else
                    {
                        // Agregar nuevo
                        _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            Rol = inv.Rol,
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = inv.Telefono,
                            EsDirector = esDirector,
                            HorasSemanales = inv.HorasSemanales,
                            Activo = inv.Activo ?? true,
                            FechaInicio = DateTime.Now,
                            FechaFin = inv.Activo == false ? DateTime.Now : null,
                            MotivoCambio = inv.Activo == false ? "Retirado del equipo" : null
                        });
                    }
                }
            }
            await NotifyInvestigadoresAsync(projectId, investigadores);
        }

        // Notificar a cada investigador fuera del loop — un solo FindAsync y una sola query de usuarios (fix N+1 query)
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

        private async Task<int> SyncObjetivosAsync(int projectId, string? objetivoGeneral, System.Collections.Generic.List<string>? objetivos)
        {
            // Sincronizar Objetivo General
            var generalOpt = await _context.InvObjetivosProyecto.FirstOrDefaultAsync(o => o.IdProyecto == projectId && o.EsGeneral);
            if (generalOpt != null)
            {
                generalOpt.Descripcion = !string.IsNullOrWhiteSpace(objetivoGeneral) ? objetivoGeneral : "Objetivo General por definir";
            }
            else
            {
                generalOpt = new InvObjetivoProyecto
                {
                    IdProyecto = projectId,
                    Descripcion = !string.IsNullOrWhiteSpace(objetivoGeneral) ? objetivoGeneral : "Objetivo General por definir",
                    EsGeneral = true,
                    Orden = 0
                };
                _context.InvObjetivosProyecto.Add(generalOpt);
            }
            await _context.SaveChangesAsync();
            int generalId = generalOpt.IdObjetivo;

            // Sincronizar Objetivos Específicos
            if (objetivos != null)
            {
                var old = _context.InvObjetivosProyecto.Where(o => o.IdProyecto == projectId && !o.EsGeneral);
                _context.InvObjetivosProyecto.RemoveRange(old);

                int orden = 1;
                foreach (var obj in objetivos)
                {
                    if (string.IsNullOrWhiteSpace(obj)) continue;
                    _context.InvObjetivosProyecto.Add(new InvObjetivoProyecto
                    {
                        IdProyecto = projectId,
                        Descripcion = obj,
                        EsGeneral = false,
                        Orden = orden++
                    });
                }
            }

            return generalId;
        }

        private async Task SyncPresupuestoAsync(int projectId, System.Collections.Generic.List<RecursoNecesarioDto>? recursos)
        {
            if (recursos == null) return;
            var old = _context.InvPresupuestoItems.Where(p => p.IdProyecto == projectId);
            _context.InvPresupuestoItems.RemoveRange(old);

            foreach (var r in recursos)
            {
                _context.InvPresupuestoItems.Add(new InvPresupuestoItem
                {
                    IdProyecto = projectId,
                    Categoria = "Gasto",
                    Detalle = r.Descripcion ?? "Sin detalle",
                    Cantidad = decimal.TryParse(r.Cantidad, out var c) ? c : 1,
                    ValorUnitario = r.CostoUnitario,
                    EsGastoCapital = r.EsGastoCapital ?? false,
                    IdPartida = r.IdPartida
                });
            }
        }

        private async Task SyncMmlAsync(int projectId, System.Collections.Generic.List<MmlRowDto>? mml)
        {
            if (mml == null) return;
            var old = _context.InvProyectosMml.Where(m => m.IdProyecto == projectId);
            _context.InvProyectosMml.RemoveRange(old);

            foreach (var row in mml)
            {
                if (string.IsNullOrWhiteSpace(row.Resumen)) continue;
                _context.InvProyectosMml.Add(new InvProyectoMml
                {
                    IdProyecto = projectId,
                    Nivel = row.Nivel ?? "Desconocido",
                    ResumenNarrativo = row.Resumen,
                    Indicadores = row.Indicadores,
                    MediosVerificacion = row.Medios,
                    Supuestos = row.Supuestos
                });
            }
        }

        private async Task SyncImpactosAsync(int projectId, ImpactoProyectoDto? impacto)
        {
            if (impacto == null) return;
            var old = _context.InvImpactosProyecto.Where(i => i.IdProyecto == projectId);
            _context.InvImpactosProyecto.RemoveRange(old);

            // Mapeo basado en el catálogo estándar (ID 1-6)
            if (!string.IsNullOrWhiteSpace(impacto.Social)) AddImpacto(projectId, 1, impacto.Social);
            if (!string.IsNullOrWhiteSpace(impacto.Cientifico)) AddImpacto(projectId, 2, impacto.Cientifico);
            if (!string.IsNullOrWhiteSpace(impacto.Economico)) AddImpacto(projectId, 3, impacto.Economico);
            if (!string.IsNullOrWhiteSpace(impacto.Politico)) AddImpacto(projectId, 4, impacto.Politico);
            if (!string.IsNullOrWhiteSpace(impacto.Ambiental)) AddImpacto(projectId, 5, impacto.Ambiental);
            if (!string.IsNullOrWhiteSpace(impacto.Otro)) AddImpacto(projectId, 6, impacto.Otro);
        }

        private void AddImpacto(int projectId, int catId, string desc)
        {
            _context.InvImpactosProyecto.Add(new InvImpactoProyecto
            {
                IdProyecto = projectId,
                IdCatImpacto = catId,
                Descripcion = desc
            });
        }

        private async Task SyncProductosAsync(int projectId, System.Collections.Generic.List<ProductoEsperadoDto>? productos)
        {
            if (productos == null) return;
            var old = _context.InvProductos.Where(p => p.IdProyecto == projectId);
            _context.InvProductos.RemoveRange(old);

            foreach (var p in productos)
            {
                if (string.IsNullOrWhiteSpace(p.Tipo)) continue;
                
                // Intentamos buscar el ID del tipo de producto por nombre o UUID si viniera
                var cat = await _context.InvCatTipoProductos.FirstOrDefaultAsync(c => c.Nombre == p.Tipo);
                
                _context.InvProductos.Add(new InvProducto
                {
                    IdProyecto = projectId,
                    IdTipoProducto = cat?.IdTipoProducto ?? 1, // Default a Académico si no se encuentra
                    Titulo = p.Tipo,
                    Cantidad = int.TryParse(p.Cantidad, out var cant) ? cant : 1
                });
            }
        }

        private async Task SyncCronogramaAsync(int projectId, int defaultObjetivoId, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;
            
            // 1. Limpieza profunda (Carga Eager para evitar N+1 queries)
            var oldActivities = await _context.InvCronogramas
                .Include(c => c.InvCronogramaSemanas)
                .Where(c => c.IdProyecto == projectId)
                .ToListAsync();

            foreach(var old in oldActivities) {
                _context.InvCronogramaSemanas.RemoveRange(old.InvCronogramaSemanas);
            }
            _context.InvCronogramas.RemoveRange(oldActivities);

            // 2. Inserción
            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = defaultObjetivoId, // Usar el ID del objetivo general real para mantener la FK
                    NumeroActividad = act.Numero,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Ponderacion = act.Ponderacion,
                    EsEntregableCaces = act.EsEntregableCaces ?? false
                };

                var semanasList = act.Semanas ?? new System.Collections.Generic.List<bool>();
                for (int i = 0; i < 12; i++)
                {
                    bool isMarked = i < semanasList.Count && semanasList[i];
                    nuevaAct.InvCronogramaSemanas.Add(new InvCronogramaSemana
                    {
                        Mes = $"Mes {(i / 4) + 1}",
                        Semana = isMarked
                    });
                }
                _context.InvCronogramas.Add(nuevaAct);
            }
        }

        private async Task SyncBibliografiaAsync(int projectId, System.Collections.Generic.List<string>? biblio)
        {
            if (biblio == null) return;
            var old = _context.InvBibliografiasProyecto.Where(b => b.IdProyecto == projectId);
            _context.InvBibliografiasProyecto.RemoveRange(old);

            foreach (var b in biblio)
            {
                if (string.IsNullOrWhiteSpace(b)) continue;
                _context.InvBibliografiasProyecto.Add(new InvBibliografiaProyecto
                {
                    IdProyecto = projectId,
                    CitaApa = b
                });
            }
        }

        private async Task SyncRecursosDisponiblesAsync(int projectId, System.Collections.Generic.List<RecursoDisponibleDto>? recursos)
        {
            if (recursos == null) return;
            var old = _context.InvRecursosDisponibles.Where(r => r.IdProyecto == projectId);
            _context.InvRecursosDisponibles.RemoveRange(old);

            foreach (var r in recursos)
            {
                if (string.IsNullOrWhiteSpace(r.Descripcion)) continue;
                _context.InvRecursosDisponibles.Add(new InvRecursoDisponible
                {
                    IdProyecto = projectId,
                    Detalle = r.Descripcion,
                    Cantidad = decimal.TryParse(r.Cantidad, out var cantRec) ? cantRec : 0,
                    Fuente = r.Fuente
                });
            }
        }

        public async Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas).ThenInclude(c => c.InvCronogramaSemanas)
                .Include(p => p.InvBibliografiasProyecto)
                .Include(p => p.InvImpactosProyecto)
                .Include(p => p.InvProductos)
                .Include(p => p.MatrizMarcoLogico)
                .Include(p => p.InvRecursosDisponibles)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            if (project.Estado != "Borrador" && project.Estado != "En Corrección")
            {
                return new SyncResult { Success = false, Message = "Solo se pueden eliminar borradores de proyectos académicos." };
            }

            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                Estado = project.Estado,
                DescripcionProyecto = project.DescripcionProyecto,
                Activo = project.Activo,
                FechaRegistro = project.FechaRegistro
            });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.InvProyectosCarreras.RemoveRange(project.InvProyectosCarreras);
                _context.InvProyectosProfesores.RemoveRange(project.InvProyectosProfesores);
                _context.InvProyectosAlumnos.RemoveRange(project.InvProyectosAlumnos);
                _context.InvObjetivosProyecto.RemoveRange(project.InvObjetivosProyecto);
                _context.InvPresupuestoItems.RemoveRange(project.InvPresupuestoItems);
                
                foreach (var crono in project.InvCronogramas)
                {
                    _context.InvCronogramaSemanas.RemoveRange(crono.InvCronogramaSemanas);
                }
                _context.InvCronogramas.RemoveRange(project.InvCronogramas);
                _context.InvBibliografiasProyecto.RemoveRange(project.InvBibliografiasProyecto);
                _context.InvImpactosProyecto.RemoveRange(project.InvImpactosProyecto);
                _context.InvProductos.RemoveRange(project.InvProductos);
                _context.InvProyectosMml.RemoveRange(project.MatrizMarcoLogico);
                _context.InvRecursosDisponibles.RemoveRange(project.InvRecursosDisponibles);

                var docInstance = await _context.DocumentInstances.FirstOrDefaultAsync(di => di.EntityUuid == uuid);
                if (docInstance != null)
                {
                    _context.DocumentInstances.Remove(docInstance);
                }

                _context.InvProyectos.Remove(project);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
                int? internalUserId = internalUser?.IdUsuario;
                await _auditService.LogActionAsync(internalUserId, "ELIMINAR_PROYECTO", $"Eliminación física del borrador del proyecto: {project.Titulo}", "PROYECTOS", beforeJson, null);

                return new SyncResult { Success = true };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al eliminar físicamente borrador de proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al eliminar el proyecto: {ex.Message}" };
            }
        }

        public async Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            string beforeJson = project.MetadataCacesJson ?? "{}";

            // Validación de Carga Horaria para Docentes (CACES Compliance)
            var currentPeriod = await _context.Periodos
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .FirstOrDefaultAsync();

            if (currentPeriod == null)
            {
                return new SyncResult { Success = false, Message = "No se ha configurado un período académico activo en el sistema." };
            }

            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7; // Fallback seguro

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;
                
                var cedulaTrim = inv.Cedula.Trim();
                var persona = await _authService.GetOrProvisionUserByCedulaAsync(cedulaTrim);
                if (persona == null || persona.TablaSigafi == "alumno") continue;
                if (inv.Activo == false) continue;

                decimal proposedHours = inv.HorasSemanales ?? 0;

                var availableHours = await _context.ProfesoresActividades
                    .Where(pa => pa.IdProfesor == persona.IdSigafi && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                    .Select(pa => pa.HorasSemana)
                    .FirstOrDefaultAsync() ?? 0;

                var otherProjectsHours = await _context.InvProyectosProfesores
                    .Where(pp => pp.IdUsuario == persona.IdUsuario && 
                                 pp.IdProyecto != project.IdProyecto && 
                                 pp.Activo != false && 
                                 pp.IdProyectoNavigation.Activo != false &&
                                 (pp.IdProyectoNavigation.Estado == "Enviado" || 
                                  pp.IdProyectoNavigation.Estado == "En Revisión" || 
                                  pp.IdProyectoNavigation.Estado == "Aprobado" || 
                                  pp.IdProyectoNavigation.Estado == "En Ejecución"))
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
                // 1. Sincronizar en Tablas Relacionales (Profesores / Alumnos)
                await SyncInvestigadoresAsync(project.IdProyecto, investigadores);

                // 2. Sincronizar en Metadata JSON del CACES para mantener concordancia
                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson);
                    }
                    catch
                    {
                        // Fallback
                    }
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

                dto.Investigadores = investigadores;
                dto.TieneGrupoInvestigacion = investigadores.Count > 1;
                project.TieneGrupo = investigadores.Count > 1;
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string afterJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    Titulo = project.Titulo,
                    CodigoInstitucional = project.CodigoInstitucional,
                    TieneGrupo = project.TieneGrupo,
                    TotalInvestigadores = investigadores.Count,
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
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdUsuarioNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado." };
            }

            var currentDirectorForAudit = project.InvProyectosProfesores
                .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false);

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
                // 1. Obtener director activo actual
                var currentDirector = project.InvProyectosProfesores
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false);

                // 2. Registrar baja del director actual (si hay uno)
                if (currentDirector != null)
                {
                    currentDirector.Activo = false;
                    currentDirector.FechaFin = DateTime.Now;
                    currentDirector.MotivoCambio = $"Relevado por: {request.Motivo}";
                    currentDirector.EsDirector = false; // Ya no es el director activo
                    
                    // Notificar al director anterior
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

                // 3. Obtener o aprovisionar al nuevo director
                var nuevoDirectorUser = await _authService.GetOrProvisionUserByCedulaAsync(request.NuevoDirectorCedula.Trim());
                if (nuevoDirectorUser == null)
                {
                    return new SyncResult { Success = false, Message = "No se pudo encontrar o registrar al nuevo director institucional." };
                }

                // 4. Designar al nuevo director
                var existingProf = project.InvProyectosProfesores
                    .FirstOrDefault(pp => pp.IdUsuario == nuevoDirectorUser.IdUsuario);

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
                    _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = nuevoDirectorUser.IdUsuario,
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel", // Valor inicial, actualizable por el usuario
                        Telefono = "",
                        EsDirector = true,
                        Activo = true,
                        FechaInicio = DateTime.Now
                    });
                }

                // 5. Notificar al nuevo director
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

                // 6. Registrar en el Audit Trail del Workflow
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

                // Guardar cambios intermedios para sincronizar DB antes de actualizar CACES
                await _context.SaveChangesAsync();

                // 7. Sincronizar en Metadata JSON del CACES
                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson);
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

                // Volver a leer la lista de investigadores activos e inactivos para actualizar el JSON
                var updatedProfs = await _context.InvProyectosProfesores
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == project.IdProyecto)
                    .ToListAsync();
                
                var updatedAlums = await _context.InvProyectosAlumnos
                    .Include(pa => pa.IdUsuarioNavigation)
                    .Where(pa => pa.IdProyecto == project.IdProyecto)
                    .ToListAsync();

                var profCedulas = updatedProfs.Select(pp => pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "").Where(c => !string.IsNullOrEmpty(c)).ToList();
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
                if (researchSubcatId == 0) researchSubcatId = 7;

                var researchHours = new List<ProfesoresActividade>();
                var otherAssignedHours = new List<InvProyectoProfesor>();
                if (profCedulas.Any() && !string.IsNullOrEmpty(periodId))
                {
                    researchHours = await _context.ProfesoresActividades
                        .Where(pa => profCedulas.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                        .ToListAsync();

                    var profUserIds = updatedProfs.Select(pp => pp.IdUsuario).Distinct().ToList();
                    otherAssignedHours = await _context.InvProyectosProfesores
                        .Include(pp => pp.IdProyectoNavigation)
                        .Where(pp => profUserIds.Contains(pp.IdUsuario) &&
                                     pp.IdProyecto != project.IdProyecto &&
                                     pp.Activo != false &&
                                     (pp.IdProyectoNavigation.Estado == "Enviado" ||
                                      pp.IdProyectoNavigation.Estado == "En Revisión" ||
                                      pp.IdProyectoNavigation.Estado == "Aprobado" ||
                                      pp.IdProyectoNavigation.Estado == "En Ejecución"))
                        .ToListAsync();
                }

                dto.Investigadores = updatedProfs.Select(pp => {
                    var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                    var availableHours = researchHours.Where(pa => pa.IdProfesor == cedula).Sum(pa => pa.HorasSemana ?? 0);
                    var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);
                    return new InvestigadorDto
                    {
                        Nombre = pp.IdUsuarioNavigation?.Nombre,
                        Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                        Rol = pp.Rol,
                        NivelAcademico = pp.NivelAcademico,
                        Telefono = pp.Telefono,
                        Activo = pp.Activo ?? true,
                        FechaInicio = pp.FechaInicio,
                        FechaFin = pp.FechaFin,
                        MotivoCambio = pp.MotivoCambio,
                        HorasSemanales = pp.HorasSemanales,
                        HorasDisponibles = availableHours,
                        HorasAsignadas = assignedHours
                    };
                }).Concat(updatedAlums.Select(pa => new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Cedula = pa.IdUsuarioNavigation?.IdSigafi,
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = pa.Telefono,
                    Activo = pa.Activo ?? true,
                    FechaInicio = pa.FechaInicio,
                    FechaFin = pa.FechaFin,
                    MotivoCambio = pa.MotivoCambio
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
                _logger.LogError(ex, "Error al transferir la dirección del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al realizar la transferencia: {ex.Message}" };
            }
        }

        public async Task<bool> UserCanModifyProjectAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return true;

            // Si el proyecto ya fue enviado o aprobado, está blindado para el usuario regular
            if (project.Estado != "Borrador" && project.Estado != "En Corrección")
            {
                return false;
            }

            // FIX: Para proyectos con grupo, verificamos membresía en el grupo Y también membresía
            // directa en el proyecto. Esto garantiza que el Director asignado directamente
            // (vía creatorUserIdRef o transferencia) nunca pierda permisos aunque el proyecto
            // tenga un grupo de investigación vinculado.
            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.InvGruposMiembros
                    .AnyAsync(m => m.IdGrupo == project.IdGrupo.Value && m.IdUsuario == user.IdUsuario && m.Activo != false);
                if (isGroupMember) return true;
                // Fallback: el Director del proyecto puede haber sido asignado directamente
                // (antes de vincular el grupo o vía transferencia de dirección)
            }

            return await _context.InvProyectosProfesores.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false) ||
                   await _context.InvProyectosAlumnos.AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == user.IdUsuario && pa.Activo != false);
        }

        public async Task<bool> UserCanViewProjectAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return true;

            // 1. Verificar si es integrante directo del equipo del proyecto (Profesores o Alumnos)
            var isTeamMember = await _context.InvProyectosProfesores.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false) ||
                               await _context.InvProyectosAlumnos.AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == user.IdUsuario && pa.Activo != false);
            if (isTeamMember) return true;

            // 2. Verificar si es miembro del grupo de investigación asociado al proyecto
            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.InvGruposMiembros
                    .AnyAsync(m => m.IdGrupo == project.IdGrupo.Value && m.IdUsuario == user.IdUsuario && m.Activo != false);
                if (isGroupMember) return true;
            }

            // 3. Verificar si es un Revisor por Pares asignado a este proyecto
            var isPeerReviewer = await _context.InvRevisionesPares
                .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == user.IdUsuario);
            if (isPeerReviewer) return true;

            return false;
        }

        public async Task<bool> IsSystemAdminAsync(string userSigafiId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            if (user.Administrador) return true;

            var adminRoles = new[] { "DIITRA_ADMIN", "ADMIN_SISTEMA" };
            return await _context.UserRoles.AsNoTracking()
                .AnyAsync(ur => ur.IdUsuario == user.IdUsuario
                    && (ur.EsActivo ?? true)
                    && adminRoles.Contains(ur.Role.CodigoRol));
        }

        public async Task<bool> IsProjectDirectorAsync(string projectUuid, string userSigafiId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.AsNoTracking().FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return false;

            return await _context.InvProyectosProfesores.AsNoTracking().AnyAsync(pp => 
                pp.IdProyecto == project.IdProyecto && 
                pp.IdUsuario == user.IdUsuario && 
                pp.EsDirector == true && 
                pp.Activo != false);
        }

        /// <summary>
        /// Devuelve los últimos eventos de actividad de un proyecto:
        /// sesiones CoWork, cambios de estado de sección y auditoría reciente.
        /// Diseñado para consumo desacoplado desde el panel lateral del Workspace.
        /// </summary>
        public async Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null) return new List<ProyectoActividadDto>();

            // Resolver los UUIDs de todas las DocumentInstances vinculadas a este proyecto
            // (cada sección/documento colaborativo tiene su propio instanceUuid)
            var instanceUuids = await _context.DocumentInstances
                .AsNoTracking()
                .Where(di => di.EntityUuid == projectUuid)
                .Select(di => di.Uuid)
                .ToListAsync();

            // Garantizar que el propio UUID del proyecto esté en la lista, ya que para el
            // documento principal (PROTOCOLO_INVESTIGACION) su instanceUuid es exactamente el projectUuid.
            if (!instanceUuids.Contains(projectUuid))
            {
                instanceUuids.Add(projectUuid);
            }

            var actividades = new List<ProyectoActividadDto>();

            if (instanceUuids.Count > 0)
            {
                // Obtener las sesiones de CoWork correspondientes a las instancias asociadas al proyecto.
                // Se utiliza EF.Functions.Like con un bucle rápido para garantizar compatibilidad total
                // y óptima indexación en Pomelo MySQL, evitando errores de traducción SQL.
                var sesiones = new List<diitra_infrastructure.data.models.Cowork.InvCoworkSesion>();
                foreach (var uuid in instanceUuids)
                {
                    var pattern = uuid + "%";
                    var list = await _context.InvCoworkSesiones.AsNoTracking()
                        .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern))
                        .OrderByDescending(s => s.ConectadoEn)
                        .Take(10)
                        .ToListAsync();
                    sesiones.AddRange(list);
                }

                // Mantener las 10 sesiones más recientes globalmente
                sesiones = sesiones
                    .OrderByDescending(s => s.ConectadoEn)
                    .Take(10)
                    .ToList();

                foreach (var s in sesiones)
                {
                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "acceso",
                        NombreUsuario = s.NombreUsuario,
                        RolUsuario = s.RolUsuario,
                        Descripcion = s.DesconectadoEn.HasValue
                            ? $"Sesión de edición ({(s.DesconectadoEn.Value - s.ConectadoEn).TotalMinutes:0} min)"
                            : "Sesión activa",
                        Fecha = s.ConectadoEn,
                        Icono = "edit"
                    });
                }

                // 2. Cambios de estado de secciones (quién aprobó qué)
                // DocumentoUuid en metadata = instanceUuid (sin sufijo de sección, corregido en CollaborationHub)
                var secciones = await _context.InvDocumentosSeccionesMetadata
                    .AsNoTracking()
                    .Where(m => instanceUuids.Contains(m.DocumentoUuid))
                    .OrderByDescending(m => m.ActualizadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var sec in secciones)
                {
                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "seccion",
                        NombreUsuario = sec.UltimoNombreUsuario ?? "Sistema",
                        RolUsuario = "",
                        Descripcion = $"Sección '{sec.SeccionNombre}' marcada como {sec.Estado}",
                        Fecha = sec.ActualizadoEn,
                        Icono = sec.Estado == "Aprobado" ? "check" : sec.Estado == "En Revisión" ? "eye" : "edit"
                    });
                }
            }

            // 3. Trazabilidad del workflow (transiciones de estado del proyecto — siempre disponibles)
            var trazas = await _context.InvTrazabilidadProyectos
                .AsNoTracking()
                .Where(t => t.IdProyecto == project.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .Take(5)
                .ToListAsync();

            foreach (var t in trazas)
            {
                actividades.Add(new ProyectoActividadDto
                {
                    Tipo = "workflow",
                    NombreUsuario = "Sistema DIITRA",
                    RolUsuario = "",
                    Descripcion = $"Estado: {t.EstadoAnterior} → {t.EstadoNuevo}",
                    Fecha = t.FechaTransicion ?? DateTime.Now,
                    Icono = "workflow"
                });
            }

            return actividades
                .OrderByDescending(a => a.Fecha)
                .Take(maxItems)
                .ToList();
        }

        private async Task SaveChangesWithConcurrencyResolutionAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning("Conflicto de concurrencia detectado durante SaveChanges. Resolviendo...");
                foreach (var entry in ex.Entries)
                {
                    if (entry.State == EntityState.Deleted)
                    {
                        // Si ya fue eliminado en la base de datos por otra transacción,
                        // simplemente lo desvinculamos de nuestro tracker para que no falle.
                        entry.State = EntityState.Detached;
                    }
                    else
                    {
                        // Para inserciones o modificaciones, intentamos recargar de la base de datos.
                        // Si falla (ej: el elemento fue eliminado), lo desvinculamos.
                        try
                        {
                            await entry.ReloadAsync();
                        }
                        catch
                        {
                            entry.State = EntityState.Detached;
                        }
                    }
                }
                // Reintentar guardar
                await _context.SaveChangesAsync();
            }
        }

        private async Task<bool> IsOversightUserAsync(int idUsuario)
        {
            if (await _context.Users.AsNoTracking().AnyAsync(u => u.IdUsuario == idUsuario && u.Administrador))
            {
                return true;
            }

            return await _context.UserRoles.AsNoTracking()
                .AnyAsync(ur => ur.IdUsuario == idUsuario
                    && (ur.EsActivo ?? true)
                    && OversightRoleCodes.Contains(ur.Role.CodigoRol));
        }
    }
}
