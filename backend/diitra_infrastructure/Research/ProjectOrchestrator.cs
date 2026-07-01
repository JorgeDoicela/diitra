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
        private static readonly string[] OversightRoleCodes = { "DIITRA_ADMIN" };

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
                    var estadosEditablesRaw = await _context.InvConfigsGenerales
                        .Where(c => c.Clave == "Workflow.EstadosEditables")
                        .Select(c => c.Valor)
                        .FirstOrDefaultAsync() ?? "Borrador,En Corrección";
                    var estadosEditables = estadosEditablesRaw.Split(',').Select(s => s.Trim()).ToList();
                    if (!estadosEditables.Contains(project.Estado))
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
                project.FechaPresentacion = ParseDateOnly(dto.FechaPresentacion);
                project.FechaInicio = ParseDateOnly(dto.FechaInicio ?? dto.FechaInicioEstimada);
                project.FechaFin = ParseDateOnly(dto.FechaFin ?? dto.FechaFinEstimada);

                // Cumplimiento CACES: si es asociativo, la adscripción solo puede ser a un grupo aprobado y activo.
                bool isAssociative = dto.TieneGrupoInvestigacion == true ||
                                     dto.GrupoInvestigacionTipo == "SI" ||
                                     dto.GrupoInvestigacionTipo == "si";

                if (isAssociative)
                {
                    var groupUuid = dto.GrupoInvestigacionUuid ?? dto.GrupoInvestigacion ?? dto.GrupoInvestigacionNombre;
                    if (string.IsNullOrWhiteSpace(groupUuid))
                    {
                        return new SyncResult
                        {
                            Success = false,
                            Message = "Para proyectos asociativos debe seleccionar un grupo de investigación aprobado."
                        };
                    }

                    var approvedGroup = await ResolveApprovedGroupAsync(groupUuid);
                    if (approvedGroup == null)
                    {
                        return new SyncResult
                        {
                            Success = false,
                            Message = "El grupo seleccionado no existe o no está aprobado/activo."
                        };
                    }

                    project.TieneGrupo = true;
                    project.IdGrupo = approvedGroup.IdGrupo;
                    dto.GrupoInvestigacion = approvedGroup.Nombre;
                    dto.GrupoInvestigacionUuid = approvedGroup.Uuid;
                    dto.TieneGrupoInvestigacion = true;
                    dto.GrupoInvestigacionTipo = "SI";
                    dto.GrupoInvestigacionNombre = approvedGroup.Nombre;

                    dto.Investigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, dto.Investigadores);
                }
                else
                {
                    project.TieneGrupo = false;
                    project.IdGrupo = null;
                    dto.GrupoInvestigacion = null;
                    dto.GrupoInvestigacionUuid = null;
                    dto.TieneGrupoInvestigacion = false;
                    dto.GrupoInvestigacionTipo = "NO";
                    dto.GrupoInvestigacionNombre = null;
                }

                if (dto.IdConvocatoria.HasValue && dto.IdConvocatoria.Value > 0)
                {
                    if (project.IdConvocatoria != dto.IdConvocatoria.Value)
                    {
                        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.IdConvocatoria == dto.IdConvocatoria.Value);
                        if (conv != null)
                        {
                            var today = DateOnly.FromDateTime(DateTime.Today);
                            if (conv.FechaCierre < today)
                            {
                                return new SyncResult
                                {
                                    Success = false,
                                    Message = $"La convocatoria \"{conv.Titulo}\" cerró el {conv.FechaCierre:dd/MM/yyyy} y no acepta nuevas postulaciones."
                                };
                            }
                        }
                    }
                    project.IdConvocatoria = dto.IdConvocatoria.Value;
                }
                else
                {
                    project.IdConvocatoria = null;
                }
                project.IdObjetivoPnd = (dto.IdObjetivoPnd.HasValue && dto.IdObjetivoPnd.Value > 0) ? dto.IdObjetivoPnd.Value : null;

                // Sincronización de Programa
                if (!string.IsNullOrEmpty(dto.Programa))
                {
                    var prog = await _context.InvProgramas.FirstOrDefaultAsync(pr => pr.Nombre == dto.Programa && pr.Activo == true);
                    if (prog != null)
                    {
                        project.IdPrograma = prog.IdPrograma;
                    }
                }
                else
                {
                    project.IdPrograma = null;
                }

                // Sincronización de Tipo de Investigación
                if (!string.IsNullOrEmpty(dto.TipoInvestigacion))
                {
                    var tip = await _context.InvTiposInvestigacion.FirstOrDefaultAsync(t => t.Nombre == dto.TipoInvestigacion && t.Activo == true);
                    if (tip != null)
                    {
                        project.IdTipo = tip.IdTipo;
                    }
                }
                else
                {
                    project.IdTipo = null;
                }

                // Sincronización de Sublínea (Línea de Investigación)
                if (!string.IsNullOrEmpty(dto.SublineaInvestigacion))
                {
                    var sub = await _context.InvSublineas.FirstOrDefaultAsync(s => s.Nombre == dto.SublineaInvestigacion && s.Activo == true);
                    if (sub != null)
                    {
                        project.IdSublinea = sub.IdSublinea;
                    }
                }
                else
                {
                    project.IdSublinea = null;
                }

                // Núcleo Innovación & TRL
                project.IdEntidadAliada = (dto.IdEntidadAliada.HasValue && dto.IdEntidadAliada.Value > 0) ? dto.IdEntidadAliada.Value : null;
                project.TrlInicial = (sbyte?)(dto.TrlInicial ?? 1);
                project.TrlActual = (sbyte?)(dto.TrlActual ?? 1);
                project.TrlMeta = (sbyte?)(dto.TrlMeta ?? 1);

                // Persistencia Completa en Metadata (Future-Proof)
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await SaveChangesWithConcurrencyResolutionAsync(); // Aseguramos ID del proyecto

                // Sincronización de Dominio Académico
                var oldDominios = _context.InvProyectosDominios.Where(pd => pd.IdProyecto == project.IdProyecto);
                _context.InvProyectosDominios.RemoveRange(oldDominios);

                if (!string.IsNullOrEmpty(dto.Dominio))
                {
                    var dom = await _context.InvDominios.FirstOrDefaultAsync(d => d.Nombre == dto.Dominio && d.Activo == true);
                    if (dom != null)
                    {
                        _context.InvProyectosDominios.Add(new InvProyectoDominio
                        {
                            IdProyecto = project.IdProyecto,
                            IdDominio = dom.IdDominio
                        });
                    }
                }

                // Sincronización de Carreras (Principal y Co-ejecutoras/Participantes)
                await SyncProjectCarrerasAsync(project.IdProyecto, dto.IdCarrera, dto.Investigadores);

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
                            var phone = await GetUserPhoneFromCatalogAsync(user.IdSigafi, user.TablaSigafi);
                            dto.Investigadores.Add(new InvestigadorDto
                            {
                                Nombre = user.Nombre,
                                Cedula = user.IdSigafi,
                                Email = user.EmailInstitucional ?? user.IdSigafi ?? "",
                                Rol = member.Rol ?? "Co-Investigador",
                                NivelAcademico = user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel",
                                Telefono = phone,
                                Activo = true,
                                FechaInicio = DateTime.Now,
                                EsDirector = member.Rol?.Contains("Director", StringComparison.OrdinalIgnoreCase) == true
                            });
                        }
                    }

                    // Asegurar que el JSON guardado también refleje la lista sincronizada
                    project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                }

                // 3. Sincronización de Equipo (Anti-Corruption Layer de los Investigadores)
                if (dto.Investigadores != null && dto.Investigadores.Count > 0)
                {
                    await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores, isFromWizard: true);
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
                            var phone = await GetUserPhoneFromCatalogAsync(internalUser.IdSigafi, internalUser.TablaSigafi);
                            if (internalUser.TablaSigafi == "alumno")
                            {
                                _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    Rol = "Semillerista",
                                    NivelAcademico = "Pregrado",
                                    Telefono = phone
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
                                    Telefono = phone,
                                    EsDirector = true
                                });
                            }
                        }
                    }
                }

                // 4. Sincronización de Objetivos
                var objetivosCreadosIds = await SyncObjetivosAsync(project.IdProyecto, dto.ObjetivoGeneral, dto.ObjetivosEspecificos);
                int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

                // 5. Sincronización de Presupuesto
                await SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);

                // 6. Sincronización de MML
                await SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);

                // 7. Sincronización de Impactos
                await SyncImpactosAsync(project.IdProyecto, dto.Impacto);

                // 8. Sincronización de Productos
                await SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);

                // 9. Sincronización de Cronograma
                await SyncCronogramaAsync(project.IdProyecto, objetivosCreadosIds, dto.Cronograma);

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
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null,
                    DirectorNombre = p.InvProyectosProfesores
                        .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectosProfesores
                        .Where(pp => pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectosAlumnos
                        .Where(pa => pa.IdUsuarioNavigation != null)
                        .Select(pa => pa.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
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
                    ConvocatoriaCodigo = p.IdConvocatoriaNavigation != null ? p.IdConvocatoriaNavigation.CodigoConvocatoria : null,
                    DirectorNombre = p.InvProyectosProfesores
                        .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectosProfesores
                        .Where(pp => pp.IdUsuarioNavigation != null)
                        .Select(pp => pp.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
                        ?? p.InvProyectosAlumnos
                        .Where(pa => pa.IdUsuarioNavigation != null)
                        .Select(pa => pa.IdUsuarioNavigation.Nombre)
                        .FirstOrDefault()
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
                .AsSplitQuery()
                .Include(p => p.IdSublineaNavigation).ThenInclude(s => s!.IdLineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation).ThenInclude(c => c!.IdPeriodoNavigation)
                .Include(p => p.IdGrupoNavigation)
                .Include(p => p.IdProgramaNavigation)
                .Include(p => p.IdTipoNavigation)
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectosProfesores).ThenInclude(pp => pp.IdUsuarioNavigation)
                .Include(p => p.InvProyectosAlumnos).ThenInclude(pa => pa.IdUsuarioNavigation)
                .Include(p => p.InvObjetivosProyecto)
                .Include(p => p.InvPresupuestoItems)
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvBibliografiasProyecto)
                .Include(p => p.InvImpactosProyecto)
                .Include(p => p.InvProductos).ThenInclude(pr => pr.IdTipoProductoNavigation)
                .Include(p => p.MatrizMarcoLogico)
                .Include(p => p.InvRecursosDisponibles)
                .Include(p => p.InvGastos).ThenInclude(g => g.IdItemNavigation)
                .FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);

            if (p == null) return null;

            ProyectoDto dto;
            if (!string.IsNullOrEmpty(p.MetadataCacesJson))
            {
                try
                {
                    var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(p.MetadataCacesJson);
                    dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ProyectoDto();
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

            // Obtener periodo académico (Lógica Resiliente de Descubrimiento)
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
                var rawCareers = await _context.ProfesoresCarrerasPeriodos
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => pc.IdPeriodo == periodId && pc.EsActivo == 1)
                    .ToListAsync();

                profCareers = rawCareers
                    .Where(pc => pc.IdProfesor != null &&
                                 profCedulas.Any(ced => pc.IdProfesor.Trim().Equals(ced, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            var alumCareers = new List<AlumnosCarrera>();
            var students = new List<Alumno>();
            var currentMatriculas = new List<Matricula>();
            var relevantCursos = new List<Curso>();

            if (studentCedulas.Any())
            {
                var rawAlumCareers = await _context.AlumnosCarreras.ToListAsync();
                alumCareers = rawAlumCareers
                    .Where(ac => ac.IdAlumno != null &&
                                 studentCedulas.Any(ced => ac.IdAlumno.Trim().Equals(ced, StringComparison.OrdinalIgnoreCase)))
                    .ToList();

                students = await _context.Alumnos
                    .Where(s => studentCedulas.Contains(s.IdAlumno.Trim()))
                    .ToListAsync();

                if (!string.IsNullOrEmpty(periodId))
                {
                    currentMatriculas = await _context.Matriculas
                        .Where(m => studentCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == periodId)
                        .ToListAsync();
                }

                var levelIds = currentMatriculas.Select(m => (int?)m.IdNivel)
                    .Concat(students.Select(s => s.IdNivel))
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                relevantCursos = await _context.Cursos.Where(c => levelIds.Contains(c.IdNivel)).ToListAsync();
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
                var estadosConCarga = await GetEstadosConCargaHorariaAsync();
                otherAssignedHours = await _context.InvProyectosProfesores
                    .Include(pp => pp.IdProyectoNavigation)
                    .Where(pp => profUserIds.Contains(pp.IdUsuario) &&
                                 pp.IdProyecto != p.IdProyecto &&
                                 pp.Activo != false &&
                                 estadosConCarga.Contains(pp.IdProyectoNavigation.Estado))
                    .ToListAsync();
            }

            var investigadoresList = new List<InvestigadorDto>();

            foreach (var pp in p.InvProyectosProfesores)
            {
                var phone = await GetUserPhoneFromCatalogAsync(pp.IdUsuarioNavigation?.IdSigafi, pp.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(phone)) phone = pp.Telefono ?? string.Empty;

                var email = await GetUserEmailFromCatalogAsync(pp.IdUsuarioNavigation?.IdSigafi, pp.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(email)) email = pp.IdUsuarioNavigation?.EmailInstitucional ?? pp.IdUsuarioNavigation?.IdSigafi ?? "";

                var cedula = pp.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var linkedCareers = profCareers
                    .Where(pc => pc.IdProfesor.Trim() == cedula && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                var carrerasDisponibles = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";
                var carreraNom = linkedCareers.FirstOrDefault() ?? "Docente";

                var existingInvInJson = dto?.Investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim() == cedula);
                if (existingInvInJson != null && !string.IsNullOrWhiteSpace(existingInvInJson.Carrera))
                {
                    var savedCarrera = existingInvInJson.Carrera.Trim();
                    if (linkedCareers.Any(lc => lc != null && lc.Trim().Equals(savedCarrera, StringComparison.OrdinalIgnoreCase)))
                    {
                        carreraNom = savedCarrera;
                    }
                }

                var availableHours = researchHours.Where(pa => pa.IdProfesor.Trim() == cedula).Sum(pa => pa.HorasSemana ?? 0);
                var assignedHours = otherAssignedHours.Where(o => o.IdUsuario == pp.IdUsuario).Sum(o => o.HorasSemanales ?? 0);

                investigadoresList.Add(new InvestigadorDto
                {
                    Nombre = pp.IdUsuarioNavigation?.Nombre,
                    Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                    Email = email,
                    Rol = pp.Rol,
                    NivelAcademico = pp.NivelAcademico,
                    Telefono = phone,
                    Activo = pp.Activo ?? true,
                    FechaInicio = pp.FechaInicio,
                    FechaFin = pp.FechaFin,
                    MotivoCambio = pp.MotivoCambio,
                    Carrera = carreraNom,
                    CarrerasDisponibles = carrerasDisponibles,
                    HorasSemanales = pp.HorasSemanales,
                    HorasDisponibles = availableHours,
                    HorasAsignadas = assignedHours,
                    EsDirector = pp.EsDirector
                });
            }

            foreach (var pa in p.InvProyectosAlumnos)
            {
                var phone = await GetUserPhoneFromCatalogAsync(pa.IdUsuarioNavigation?.IdSigafi, pa.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(phone)) phone = pa.Telefono ?? string.Empty;

                var email = await GetUserEmailFromCatalogAsync(pa.IdUsuarioNavigation?.IdSigafi, pa.IdUsuarioNavigation?.TablaSigafi);
                if (string.IsNullOrEmpty(email)) email = pa.IdUsuarioNavigation?.EmailInstitucional ?? pa.IdUsuarioNavigation?.IdSigafi ?? "";

                var cedula = pa.IdUsuarioNavigation?.IdSigafi?.Trim() ?? "";
                var sCareerIds = alumCareers
                    .Where(ac => ac.IdAlumno != null && ac.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase))
                    .Select(ac => ac.IdCarrera)
                    .ToList();
                var sCareers = allCarrerasList
                    .Where(c => sCareerIds.Contains(c.IdCarrera) && !string.IsNullOrEmpty(c.Carrera1))
                    .Select(c => c.Carrera1!)
                    .ToList();

                var studentObj = students.FirstOrDefault(s => s.IdAlumno != null && s.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));
                var matricula = currentMatriculas.FirstOrDefault(m => m.IdAlumno != null && m.IdAlumno.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));

                var idNivelTarget = matricula?.IdNivel ?? studentObj?.IdNivel;
                if (idNivelTarget.HasValue)
                {
                    var cursoInfo = relevantCursos.FirstOrDefault(c => c.IdNivel == idNivelTarget.Value);
                    if (cursoInfo != null)
                    {
                        var resolvedCareer = allCarrerasList.FirstOrDefault(c => c.IdCarrera == cursoInfo.IdCarrera)?.Carrera1;
                        if (!string.IsNullOrEmpty(resolvedCareer) && !sCareers.Any(sc => sc.Equals(resolvedCareer, StringComparison.OrdinalIgnoreCase)))
                        {
                            sCareers.Add(resolvedCareer);
                        }
                    }
                }

                var carrerasDisponibles = sCareers.Any() ? string.Join(", ", sCareers) : "Estudiante";
                var carreraNom = sCareers.FirstOrDefault() ?? "Estudiante";

                var existingInvInJson = dto?.Investigadores?.FirstOrDefault(i => !string.IsNullOrEmpty(i.Cedula) && i.Cedula.Trim().Equals(cedula, StringComparison.OrdinalIgnoreCase));
                if (existingInvInJson != null && !string.IsNullOrWhiteSpace(existingInvInJson.Carrera))
                {
                    var savedCarrera = existingInvInJson.Carrera.Trim();
                    if (sCareers.Any(sc => sc != null && sc.Trim().Equals(savedCarrera, StringComparison.OrdinalIgnoreCase)))
                    {
                        carreraNom = savedCarrera;
                    }
                }

                investigadoresList.Add(new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Cedula = pa.IdUsuarioNavigation?.IdSigafi,
                    Email = email,
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = phone,
                    Activo = pa.Activo ?? true,
                    FechaInicio = pa.FechaInicio,
                    FechaFin = pa.FechaFin,
                    MotivoCambio = pa.MotivoCambio,
                    Carrera = carreraNom,
                    CarrerasDisponibles = carrerasDisponibles,
                    HorasSemanales = pa.HorasSemanales
                });
            }

            dto.Uuid = p.Uuid;
            dto.CodigoInstitucional = p.CodigoInstitucional;
            dto.Estado = p.Estado;
            dto.IdConvocatoria = p.IdConvocatoria;
            dto.IdCarrera = p.InvProyectosCarreras.FirstOrDefault(pc => pc.Modalidad == "PRINCIPAL")?.IdCarrera ?? p.InvProyectosCarreras.FirstOrDefault()?.IdCarrera;
            if (dto.IdCarrera.HasValue)
            {
                var carreraObj = allCarrerasList.FirstOrDefault(c => c.IdCarrera == dto.IdCarrera.Value);
                if (carreraObj != null)
                {
                    dto.Carrera = carreraObj.Carrera1;
                }
            }
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

            dto.LineaInvestigacion = p.IdSublineaNavigation?.IdLineaNavigation != null
                                     ? p.IdSublineaNavigation.IdLineaNavigation.NombreLinea
                                     : dto.LineaInvestigacion;
            dto.SublineaInvestigacion = p.IdSublineaNavigation != null
                                        ? p.IdSublineaNavigation.Nombre
                                        : dto.SublineaInvestigacion;

            dto.Programa = p.IdProgramaNavigation?.Nombre ?? dto.Programa;
            dto.TipoInvestigacion = p.IdTipoNavigation?.Nombre ?? dto.TipoInvestigacion;

            dto.DirectorProyecto = p.InvProyectosProfesores
                .Where(pp => pp.EsDirector == true && pp.IdUsuarioNavigation != null)
                .Select(pp => pp.IdUsuarioNavigation.Nombre)
                .FirstOrDefault()
                ?? p.InvProyectosProfesores
                .Where(pp => pp.IdUsuarioNavigation != null)
                .Select(pp => pp.IdUsuarioNavigation.Nombre)
                .FirstOrDefault()
                ?? dto.DirectorProyecto;
            if (p.IdGrupoNavigation != null)
            {
                dto.GrupoInvestigacion = p.IdGrupoNavigation.Nombre;
                dto.GrupoInvestigacionUuid = p.IdGrupoNavigation.Uuid;
                dto.TieneGrupoInvestigacion = true;
                dto.GrupoInvestigacionTipo = "SI";
                dto.GrupoInvestigacionNombre = p.IdGrupoNavigation.Nombre;

                if (p.IdGrupoNavigation.IdDominio.HasValue)
                {
                    var dom = await _context.InvDominios.FirstOrDefaultAsync(d => d.IdDominio == p.IdGrupoNavigation.IdDominio.Value);
                    if (dom != null)
                    {
                        dto.Dominio = dom.Nombre;
                    }
                }
            }
            else
            {
                dto.TieneGrupoInvestigacion = dto.TieneGrupoInvestigacion ?? false;
                dto.GrupoInvestigacionTipo = dto.GrupoInvestigacionTipo ?? "NO";
            }
            dto.CostoTotal = p.InvPresupuestoItems.Sum(i => i.ValorUnitario * i.Cantidad);
            dto.Investigadores = investigadoresList;

            dto.FechaPresentacion = p.FechaPresentacion?.ToString("dd/MM/yyyy");
            dto.FechaInicio = p.FechaInicio?.ToString("dd/MM/yyyy");
            dto.FechaFin = p.FechaFin?.ToString("dd/MM/yyyy");
            dto.FechaInicioEstimada = p.FechaInicio?.ToString("dd/MM/yyyy");
            dto.FechaFinEstimada = p.FechaFin?.ToString("dd/MM/yyyy");
            dto.Periodo = p.IdConvocatoriaNavigation?.IdPeriodoNavigation?.Detalle
                          ?? p.IdConvocatoriaNavigation?.IdPeriodo
                          ?? dto.Periodo
                          ?? currentPeriod?.Detalle;
            dto.PeriodoConvocatoria = p.IdConvocatoriaNavigation?.IdPeriodoNavigation?.Detalle
                                      ?? p.IdConvocatoriaNavigation?.IdPeriodo
                                      ?? dto.PeriodoConvocatoria
                                      ?? dto.Periodo;
            dto.ObjetivosEspecificos = p.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .Select(o => o.Descripcion)
                .ToList();
            dto.RecursosNecesarios = p.InvPresupuestoItems.Select(i => new RecursoNecesarioDto
            {
                Descripcion = i.Detalle,
                Cantidad = i.Cantidad.ToString(),
                CostoUnitario = i.ValorUnitario,
                IdPartida = i.IdPartida,
                EsGastoCapital = i.EsGastoCapital
            }).ToList();
            dto.RecursosDisponibles = p.InvRecursosDisponibles.Select(r => new RecursoDisponibleDto
            {
                Descripcion = r.Detalle,
                Cantidad = r.Cantidad.ToString(),
                Fuente = r.Fuente
            }).ToList();
            dto.ProductosEsperados = p.InvProductos.Select(pr => new ProductoEsperadoDto
            {
                Tipo = pr.IdTipoProductoNavigation != null ? pr.IdTipoProductoNavigation.Nombre : pr.Titulo,
                Cantidad = pr.Cantidad.ToString()
            }).ToList();
            dto.Impacto = new ImpactoProyectoDto
            {
                Social = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 1)?.Descripcion,
                Cientifico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 2)?.Descripcion,
                Economico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 3)?.Descripcion,
                Politico = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 4)?.Descripcion,
                Ambiental = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 5)?.Descripcion,
                Otro = p.InvImpactosProyecto.FirstOrDefault(i => i.IdCatImpacto == 6)?.Descripcion
            };
            var specificObjetivoIds = p.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .Select(o => o.IdObjetivo)
                .ToList();

            dto.Cronograma = p.InvCronogramas.OrderBy(c => c.NumeroActividad).ToList().Select(c => new ActividadCronogramaDto
            {
                IdObjetivo = c.IdObjetivo == 0 ? 0 : (specificObjetivoIds.Contains(c.IdObjetivo) ? specificObjetivoIds.IndexOf(c.IdObjetivo) + 1 : 0),
                Numero = c.NumeroActividad,
                Actividad = c.Descripcion,
                RecursosNecesarios = c.RecursosNecesarios,
                Responsable = c.Responsable,
                Entregable = c.Entregable,
                Ponderacion = c.Ponderacion,
                EsEntregableCaces = c.EsEntregableCaces,
                FechaInicioPrevista = c.FechaInicioPrevista?.ToString("yyyy-MM-dd"),
                FechaFinPrevista = c.FechaFinPrevista?.ToString("yyyy-MM-dd"),
                Semanas = GetSemanasCalculadas(p.FechaInicio, p.FechaFin, c.FechaInicioPrevista, c.FechaFinPrevista)
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
                .Where(u => u.IdSigafi.Trim() == userIdReferencia.Trim())
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

                stats.MisProyectosEnRevision = await _context.InvProyectos
                    .Where(p => misIds.Contains(p.IdProyecto) && (p.Estado == "En Revisión" || p.Estado == "Enviado"))
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
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();

                if (currentPeriod != null)
                {
                    var researchSubcatId = await GetResearchSubcatIdAsync();

                    stats.HorasDisponiblesDistributivo = await _context.ProfesoresActividades
                        .Where(pa => pa.IdProfesor.Trim() == userIdReferencia.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                        .SumAsync(pa => (decimal?)pa.HorasSemana ?? 0);
                }
                else
                {
                    stats.HorasDisponiblesDistributivo = 0;
                }
            }

            // ── Actividad Reciente (últimos 10 eventos) ──
            var ultimosProyectosQuery = _context.InvProyectos.AsQueryable();
            var ultimosInformesQuery = _context.InvInformesAvance.AsQueryable();

            if (!isAdmin && userId != null)
            {
                var misIds = _context.InvProyectosProfesores
                    .Where(pp => pp.IdUsuario == userId.Value).Select(pp => pp.IdProyecto)
                    .Union(_context.InvProyectosAlumnos
                    .Where(pa => pa.IdUsuario == userId.Value).Select(pa => pa.IdProyecto));

                ultimosProyectosQuery = ultimosProyectosQuery.Where(p => misIds.Contains(p.IdProyecto));
                ultimosInformesQuery = ultimosInformesQuery.Where(i => misIds.Contains(i.IdProyecto));
            }

            var ultimosProyectos = await ultimosProyectosQuery
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

            var ultimosInformesDb = await ultimosInformesQuery
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
                    ProyectoUuid = i.IdProyectoNavigation.Uuid,
                    i.Estado
                })
                .ToListAsync();

            var ultimosInformes = ultimosInformesDb.Select(i => new ActividadRecienteDto
            {
                Tipo = "informe",
                Descripcion = $"Informe #{i.NumeroInforme} — {i.TituloProyecto}",
                // Solución del Bug de Fecha: Convertir la fecha real de base de datos de DateOnly a DateTime en memoria
                Fecha = i.FechaFirma ?? new DateTime(i.FechaReporte.Year, i.FechaReporte.Month, i.FechaReporte.Day, 0, 0, 0, DateTimeKind.Utc),
                Uuid = i.ProyectoUuid,
                Estado = i.Estado
            }).ToList();

            stats.ActividadReciente = ultimosProyectos
                .Concat(ultimosInformes)
                .OrderByDescending(a => a.Fecha)
                .Take(8)
                .ToList();

            return stats;
        }

        private async Task SyncProjectCarrerasAsync(int projectId, int? idCarreraPrincipal, List<InvestigadorDto>? investigadores)
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

        private async Task SyncInvestigadoresAsync(int projectId, System.Collections.Generic.List<InvestigadorDto>? investigadores, bool isFromWizard = false)
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
                        prof.EsDirector = false; // Al desactivarlo deja de ser director activo
                    }
                }
            }

            // 3. Procesar Alumnos Existentes: Desactivar los que ya no vienen en la lista
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
                        if (isFromWizard)
                        {
                            existingAlum.Telefono = inv.Telefono;
                            existingAlum.HorasSemanales = inv.HorasSemanales;
                        }
                        else
                        {
                            bool wasActive = existingAlum.Activo != false;
                            string oldRol = existingAlum.Rol ?? "";
                            string newRol = NormalizeRole(inv.Rol);

                            // Reactivar o actualizar
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

                            // Notificar si se reactivó o si cambió de rol (mientras esté activo)
                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        // Agregar nuevo
                        _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            Rol = NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await GetUserPhoneFromCatalogAsync(persona.IdSigafi, persona.TablaSigafi),
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
                            string newRol = NormalizeRole(inv.Rol);

                            // Reactivar o actualizar
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

                            // Notificar si se reactivó o si cambió de rol (mientras esté activo)
                            if (nowActive && (!wasActive || !string.Equals(oldRol, newRol, StringComparison.OrdinalIgnoreCase)))
                            {
                                investigatorsToNotify.Add(inv);
                            }
                        }
                    }
                    else if (!isFromWizard)
                    {
                        // Agregar nuevo
                        _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                        {
                            IdProyecto = projectId,
                            IdUsuario = persona.IdUsuario,
                            Rol = NormalizeRole(inv.Rol),
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = !string.IsNullOrEmpty(inv.Telefono) ? inv.Telefono : await GetUserPhoneFromCatalogAsync(persona.IdSigafi, persona.TablaSigafi),
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

        private List<string> ParseObjetivosHtml(System.Collections.Generic.List<string>? objetivos)
        {
            var result = new List<string>();
            if (objetivos == null) return result;

            foreach (var item in objetivos)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;

                // Si contiene tags HTML como <li> o <p>, intentamos extraer los elementos individuales
                if (item.Contains("<li") || item.Contains("<p"))
                {
                    // Remover etiquetas <ul>, </ul>, <ol>, </ol>
                    string cleaned = item.Replace("<ul>", "").Replace("</ul>", "").Replace("<ol>", "").Replace("</ol>", "");

                    // Encontrar todos los bloques de <li>...</li> o <p>...</p>
                    var matches = System.Text.RegularExpressions.Regex.Matches(cleaned, @"<(li|p)[^>]*>(.*?)<\/\1>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (matches.Count > 0)
                    {
                        foreach (System.Text.RegularExpressions.Match match in matches)
                        {
                            var text = System.Text.RegularExpressions.Regex.Replace(match.Groups[2].Value, @"<[^>]*>", "").Trim();
                            // Decodificar entidades HTML comunes (usando WebUtility)
                            text = System.Net.WebUtility.HtmlDecode(text);
                            // Limpiar numeración inicial si existe (ej: "1. ", "1.- ", "a) ")
                            text = System.Text.RegularExpressions.Regex.Replace(text, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();

                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                result.Add(text);
                            }
                        }
                    }
                    else
                    {
                        // Si no hay coincidencias de tags específicos pero tiene HTML, limpiamos todas las tags y lo agregamos
                        var cleanText = System.Text.RegularExpressions.Regex.Replace(item, @"<[^>]*>", "").Trim();
                        cleanText = System.Net.WebUtility.HtmlDecode(cleanText);
                        cleanText = System.Text.RegularExpressions.Regex.Replace(cleanText, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                        if (!string.IsNullOrWhiteSpace(cleanText))
                        {
                            result.Add(cleanText);
                        }
                    }
                }
                else
                {
                    // Si es texto plano
                    var text = System.Text.RegularExpressions.Regex.Replace(item, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        result.Add(text);
                    }
                }
            }

            return result;
        }

        private async Task<List<int>> SyncObjetivosAsync(int projectId, string? objetivoGeneral, System.Collections.Generic.List<string>? objetivos)
        {
            // Sincronizar Objetivo General
            var generalOpt = await _context.InvObjetivosProyecto.FirstOrDefaultAsync(o => o.IdProyecto == projectId && o.EsGeneral);

            // Si el objetivo general contiene HTML, lo limpiamos para tener texto plano en la columna
            string descGeneral = !string.IsNullOrWhiteSpace(objetivoGeneral) ? objetivoGeneral : "Objetivo General por definir";
            if (descGeneral.Contains("<"))
            {
                descGeneral = System.Text.RegularExpressions.Regex.Replace(descGeneral, @"<[^>]*>", "").Trim();
                descGeneral = System.Net.WebUtility.HtmlDecode(descGeneral);
            }

            if (generalOpt != null)
            {
                generalOpt.Descripcion = descGeneral;
            }
            else
            {
                generalOpt = new InvObjetivoProyecto
                {
                    IdProyecto = projectId,
                    Descripcion = descGeneral,
                    EsGeneral = true,
                    Orden = 0
                };
                _context.InvObjetivosProyecto.Add(generalOpt);
            }
            await SaveChangesWithConcurrencyResolutionAsync();
            int generalId = generalOpt.IdObjetivo;

            var ids = new List<int> { generalId };

            // Parsear y Sincronizar Objetivos Específicos
            var parsedObjetivos = ParseObjetivosHtml(objetivos);
            if (parsedObjetivos.Count > 0)
            {
                var old = _context.InvObjetivosProyecto.Where(o => o.IdProyecto == projectId && !o.EsGeneral);
                _context.InvObjetivosProyecto.RemoveRange(old);

                int orden = 1;
                foreach (var obj in parsedObjetivos)
                {
                    _context.InvObjetivosProyecto.Add(new InvObjetivoProyecto
                    {
                        IdProyecto = projectId,
                        Descripcion = obj,
                        EsGeneral = false,
                        Orden = orden++
                    });
                }

                await SaveChangesWithConcurrencyResolutionAsync();

                // Cargar los IDs reales creados
                var creadosIds = await _context.InvObjetivosProyecto
                    .Where(o => o.IdProyecto == projectId && !o.EsGeneral)
                    .OrderBy(o => o.Orden)
                    .Select(o => o.IdObjetivo)
                    .ToListAsync();

                ids.AddRange(creadosIds);
            }

            return ids;
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

        private async Task SyncCronogramaAsync(int projectId, List<int> objetivosCreadosIds, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;

            // 1. Limpieza de actividades antiguas
            var oldActivities = await _context.InvCronogramas
                .Where(c => c.IdProyecto == projectId)
                .ToListAsync();

            _context.InvCronogramas.RemoveRange(oldActivities);

            int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

            // 2. Inserción (Modelo Orientado a Fechas: No insertamos registros semanales redundantes)
            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                // Resolver objetivo específico real si fue seleccionado
                int dbObjetivoId = defaultObjetivoId;
                if (act.IdObjetivo.HasValue && objetivosCreadosIds.Count > 0)
                {
                    int index = act.IdObjetivo.Value;
                    if (index >= 0 && index < objetivosCreadosIds.Count)
                    {
                        dbObjetivoId = objetivosCreadosIds[index];
                    }
                }

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = dbObjetivoId,
                    NumeroActividad = act.Numero,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Responsable = act.Responsable,
                    Entregable = act.Entregable,
                    Ponderacion = act.Ponderacion,
                    EsEntregableCaces = act.EsEntregableCaces ?? false,
                    FechaInicioPrevista = ParseDateOnly(act.FechaInicioPrevista),
                    FechaFinPrevista = ParseDateOnly(act.FechaFinPrevista)
                };

                _context.InvCronogramas.Add(nuevaAct);
            }
        }

        private static System.Collections.Generic.List<bool> GetSemanasCalculadas(DateOnly? pStart, DateOnly? pEnd, DateOnly? aStart, DateOnly? aEnd)
        {
            int totalWeeks = 12; // fallback por defecto
            if (pStart.HasValue && pEnd.HasValue && pEnd.Value > pStart.Value)
            {
                int diffMonths = (pEnd.Value.Year - pStart.Value.Year) * 12 + (pEnd.Value.Month - pStart.Value.Month);
                int monthsCount = Math.Max(1, diffMonths + 1);
                totalWeeks = monthsCount * 4;
            }

            var list = new System.Collections.Generic.List<bool>();
            if (!pStart.HasValue)
            {
                for (int i = 0; i < totalWeeks; i++) list.Add(false);
                return list;
            }

            var projectStartDt = new DateTime(pStart.Value.Year, pStart.Value.Month, pStart.Value.Day);

            for (int w = 0; w < totalWeeks; w++)
            {
                var weekStart = projectStartDt.AddDays(w * 7);
                var weekEnd = weekStart.AddDays(6);

                bool active = false;
                if (aStart.HasValue && aEnd.HasValue)
                {
                    var actStartDt = new DateTime(aStart.Value.Year, aStart.Value.Month, aStart.Value.Day);
                    var actEndDt = new DateTime(aEnd.Value.Year, aEnd.Value.Month, aEnd.Value.Day);
                    active = actStartDt <= weekEnd && actEndDt >= weekStart;
                }

                list.Add(active);
            }
            return list;
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
                .Include(p => p.InvCronogramas)
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

                // Regla de gobernanza: el equipo del proyecto asociativo se deriva únicamente del grupo aprobado.
                effectiveInvestigadores = await BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, investigadores);

                // Preservar al Director de Proyecto activo para que no pierda la autoría y acceso al borrador
                var activeDirector = await _context.InvProyectosProfesores
                    .Include(pp => pp.IdUsuarioNavigation)
                    .FirstOrDefaultAsync(pp => pp.IdProyecto == project.IdProyecto && pp.EsDirector == true && pp.Activo != false);

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

            // Validación de Carga Horaria para Docentes (CACES Compliance)
            // NOTA DE NOMENCLATURA & SISTEMA: Usamos la Lógica Resiliente de Descubrimiento de Periodo Académico
            // filtrando por EsInstituto == 1 y ordenando adecuadamente para asegurar consistencia con el catálogo.
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

                // NOTA: Se aplica Trim() a los IDs para ignorar diferencias en espacios en blanco en la persistencia.
                var availableHours = await _context.ProfesoresActividades
                    .Where(pa => pa.IdProfesor.Trim() == persona.IdSigafi.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                    .Select(pa => pa.HorasSemana)
                    .FirstOrDefaultAsync() ?? 0;

                var otherProjectsHours = await _context.InvProyectosProfesores
                    .Where(pp => pp.IdUsuario == persona.IdUsuario &&
                                 pp.IdProyecto != project.IdProyecto &&
                                 pp.Activo != false &&
                                 pp.IdProyectoNavigation.Activo != false &&
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
                // 1. Sincronizar en Metadata JSON del CACES para mantener concordancia
                ProyectoDto? dto = null;
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    try
                    {
                        var cleanedJson = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(project.MetadataCacesJson);
                        dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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

                // 2. Sincronizar en Tablas Relacionales (Profesores / Alumnos)
                await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores ?? new List<InvestigadorDto>(), isFromWizard: false);

                // Sincronizar Carreras (Principal y Participantes) según los nuevos integrantes
                var principalCarrera = project.InvProyectosCarreras.FirstOrDefault(pc => pc.Modalidad == "PRINCIPAL")?.IdCarrera
                                       ?? project.InvProyectosCarreras.FirstOrDefault()?.IdCarrera;
                await SyncProjectCarrerasAsync(project.IdProyecto, principalCarrera, dto.Investigadores);

                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                // 3. Sincronizar también con la instantánea del documento PROTOCOLO_INVESTIGACION si existe
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
                    var phone = await GetUserPhoneFromCatalogAsync(nuevoDirectorUser.IdSigafi, nuevoDirectorUser.TablaSigafi);
                    _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = nuevoDirectorUser.IdUsuario,
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel", // Valor inicial, actualizable por el usuario
                        Telefono = phone,
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
                                     estadosConCarga.Contains(pp.IdProyectoNavigation.Estado))
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
                _logger.LogError(ex, "Error al transferir la dirección del proyecto UUID: {Uuid}", uuid);
                return new SyncResult { Success = false, Message = $"Error interno al realizar la transferencia: {ex.Message}" };
            }
        }

        private async Task<InvGrupoInvestigacion?> ResolveApprovedGroupAsync(string? groupUuid)
        {
            if (string.IsNullOrWhiteSpace(groupUuid))
            {
                return null;
            }

            var normalized = groupUuid.Trim();
            if (!Guid.TryParse(normalized, out _))
            {
                return await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g =>
                    g.Nombre.ToLower() == normalized.ToLower() &&
                    g.Activo == true &&
                    g.Estado == "Aprobado");
            }

            return await _context.InvGruposInvestigacion
                .FirstOrDefaultAsync(g => g.Uuid == normalized &&
                g.Activo == true &&
                g.Estado == "Aprobado");
        }

        private async Task<string> GetUserPhoneFromCatalogAsync(string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();
            string phone = string.Empty;
            if (tablaSigafi == "profesor")
            {
                var prof = await _context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                phone = prof != null ? (prof.Celular ?? prof.Telefono ?? string.Empty) : string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await _context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                phone = alum != null ? (alum.Celular ?? alum.Telefono ?? string.Empty) : string.Empty;
            }

            if (string.IsNullOrEmpty(phone)) return string.Empty;
            phone = phone.Trim();
            if (phone.Length == 9 && phone.StartsWith("9"))
            {
                phone = "0" + phone;
            }
            return phone;
        }

        private async Task<string> GetUserEmailFromCatalogAsync(string? idSigafi, string? tablaSigafi)
        {
            if (string.IsNullOrEmpty(idSigafi)) return string.Empty;
            var sigafiTrim = idSigafi.Trim();
            if (tablaSigafi == "profesor")
            {
                var prof = await _context.Profesores.FirstOrDefaultAsync(p => p.IdProfesor == sigafiTrim);
                return prof != null ? (prof.EmailInstitucional ?? prof.Email ?? string.Empty) : string.Empty;
            }
            else if (tablaSigafi == "alumno")
            {
                var alum = await _context.Alumnos.FirstOrDefaultAsync(a => a.IdAlumno == sigafiTrim);
                return alum != null ? (alum.EmailInstitucional ?? alum.Email ?? string.Empty) : string.Empty;
            }
            return string.Empty;
        }

        private async Task<List<InvestigadorDto>> BuildProjectInvestigadoresFromGroupAsync(int groupId, int projectId, List<InvestigadorDto>? incomingInvestigadores = null)
        {
            var groupMembers = await _context.InvGruposMiembros
                .Include(m => m.IdUsuarioNavigation)
                .Where(m => m.IdGrupo == groupId && m.Activo != false && m.IdUsuarioNavigation != null && !string.IsNullOrEmpty(m.IdUsuarioNavigation.IdSigafi))
                .ToListAsync();

            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCoordinadorNavigation)
                .FirstOrDefaultAsync(g => g.IdGrupo == groupId);

            if (group != null && group.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi))
            {
                var coordSigafi = group.IdCoordinadorNavigation.IdSigafi.Trim();
                var containsCoord = groupMembers.Any(m => m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi.Trim() == coordSigafi);
                if (!containsCoord)
                {
                    groupMembers.Add(new InvGrupoMiembro
                    {
                        IdGrupo = groupId,
                        IdUsuario = group.IdCoordinadorNavigation.IdUsuario,
                        IdUsuarioNavigation = group.IdCoordinadorNavigation,
                        Rol = "Coordinador",
                        Activo = true,
                        FechaInicio = group.FechaCreacion ?? DateOnly.FromDateTime(DateTime.UtcNow)
                    });
                }
            }

            var incomingDict = incomingInvestigadores?
                .Where(i => !string.IsNullOrEmpty(i.Cedula))
                .ToDictionary(i => i.Cedula!.Trim(), i => i, StringComparer.OrdinalIgnoreCase);

            var existingInvestigadoresByCedula = await BuildExistingProjectInvestigadoresByCedulaAsync(projectId);

            var normalized = new List<InvestigadorDto>();
            foreach (var member in groupMembers)
            {
                var user = member.IdUsuarioNavigation;
                if (user == null || string.IsNullOrWhiteSpace(user.IdSigafi)) continue;

                var cedula = user.IdSigafi.Trim();
                existingInvestigadoresByCedula.TryGetValue(cedula, out var existing);

                decimal? hours = null;
                if (incomingDict != null && incomingDict.TryGetValue(cedula, out var incoming))
                {
                    hours = incoming.HorasSemanales;
                }
                else
                {
                    hours = existing?.HorasSemanales ?? 0;
                }

                normalized.Add(new InvestigadorDto
                {
                    Nombre = user.Nombre,
                    Cedula = cedula,
                    Email = user.EmailInstitucional ?? user.IdSigafi ?? "",
                    Rol = NormalizeRole(existing?.Rol ?? member.Rol ?? (user.TablaSigafi == "alumno" ? "Semillerista" : "Co-Investigador")),
                    NivelAcademico = existing?.NivelAcademico ?? (user.TablaSigafi == "alumno" ? "Pregrado" : "Tercer Nivel"),
                    Telefono = !string.IsNullOrEmpty(existing?.Telefono) ? existing.Telefono : await GetUserPhoneFromCatalogAsync(user.IdSigafi, user.TablaSigafi),
                    Activo = true,
                    HorasSemanales = hours,
                    HorasDisponibles = existing?.HorasDisponibles,
                    HorasAsignadas = existing?.HorasAsignadas,
                    FechaInicio = existing?.FechaInicio ?? DateTime.Now,
                    FechaFin = null,
                    MotivoCambio = null,
                    Carrera = existing?.Carrera,
                    EsDirector = existing?.EsDirector ?? (member.Rol?.Contains("Director", StringComparison.OrdinalIgnoreCase) == true)
                });
            }

            return normalized;
        }

        private async Task<Dictionary<string, InvestigadorDto>> BuildExistingProjectInvestigadoresByCedulaAsync(int projectId)
        {
            var profesores = await _context.InvProyectosProfesores
                .Include(p => p.IdUsuarioNavigation)
                .Where(p => p.IdProyecto == projectId && p.Activo != false && p.IdUsuarioNavigation != null && !string.IsNullOrEmpty(p.IdUsuarioNavigation.IdSigafi))
                .Select(p => new InvestigadorDto
                {
                    Cedula = p.IdUsuarioNavigation!.IdSigafi,
                    Nombre = p.IdUsuarioNavigation.Nombre,
                    Email = p.IdUsuarioNavigation.EmailInstitucional ?? p.IdUsuarioNavigation.IdSigafi ?? "",
                    Rol = p.Rol,
                    NivelAcademico = p.NivelAcademico,
                    Telefono = p.Telefono,
                    Activo = p.Activo,
                    HorasSemanales = p.HorasSemanales,
                    HorasDisponibles = null,
                    HorasAsignadas = null,
                    FechaInicio = p.FechaInicio,
                    FechaFin = p.FechaFin,
                    MotivoCambio = p.MotivoCambio,
                    EsDirector = p.EsDirector
                })
                .ToListAsync();

            foreach (var p in profesores)
            {
                p.Rol = NormalizeRole(p.Rol);
                var phone = await GetUserPhoneFromCatalogAsync(p.Cedula, "profesor");
                if (!string.IsNullOrEmpty(phone))
                {
                    p.Telefono = phone;
                }
            }

            var alumnos = await _context.InvProyectosAlumnos
                .Include(a => a.IdUsuarioNavigation)
                .Where(a => a.IdProyecto == projectId && a.Activo != false && a.IdUsuarioNavigation != null && !string.IsNullOrEmpty(a.IdUsuarioNavigation.IdSigafi))
                .Select(a => new InvestigadorDto
                {
                    Cedula = a.IdUsuarioNavigation!.IdSigafi,
                    Nombre = a.IdUsuarioNavigation.Nombre,
                    Email = a.IdUsuarioNavigation.EmailInstitucional ?? a.IdUsuarioNavigation.IdSigafi ?? "",
                    Rol = a.Rol,
                    NivelAcademico = a.NivelAcademico,
                    Telefono = a.Telefono,
                    Activo = a.Activo,
                    HorasSemanales = a.HorasSemanales,
                    FechaInicio = a.FechaInicio,
                    FechaFin = a.FechaFin,
                    MotivoCambio = a.MotivoCambio,
                    EsDirector = false
                })
                .ToListAsync();

            foreach (var a in alumnos)
            {
                a.Rol = NormalizeRole(a.Rol);
                var phone = await GetUserPhoneFromCatalogAsync(a.Cedula, "alumno");
                if (!string.IsNullOrEmpty(phone))
                {
                    a.Telefono = phone;
                }
            }

            return profesores
                .Concat(alumnos)
                .Where(i => !string.IsNullOrWhiteSpace(i.Cedula))
                .GroupBy(i => i.Cedula!.Trim())
                .ToDictionary(g => g.Key, g => g.First());
        }

        public async Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request)
        {
            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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
                RolPropuesto = string.IsNullOrWhiteSpace(request.RolPropuesto) ? null : NormalizeRole(request.RolPropuesto.Trim()),
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
            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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
            if (!await IsSystemAdminAsync(reviewerSigafiId))
            {
                return new SyncResult
                {
                    Success = false,
                    Message = "Solo el administrador del sistema puede aprobar o rechazar solicitudes de cambio de equipo."
                };
            }

            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
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
                                Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? "Co-Investigador" : NormalizeRole(payload.RolPropuesto),
                                Activo = true,
                                FechaInicio = DateOnly.FromDateTime(payload.FechaEfectiva ?? DateTime.Now)
                            });
                        }
                        else
                        {
                            groupMember.Activo = true;
                            groupMember.Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? groupMember.Rol : NormalizeRole(payload.RolPropuesto);
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
                                Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? "Co-Investigador" : NormalizeRole(payload.RolPropuesto),
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
                            existing.Rol = string.IsNullOrWhiteSpace(payload.RolPropuesto) ? existing.Rol : NormalizeRole(payload.RolPropuesto);
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

            var adminRoles = new[] { "DIITRA_ADMIN" };
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

        public async Task<bool> UserCanRequestTeamChangeAsync(string projectUuid, string userSigafiId)
        {
            if (await IsSystemAdminAsync(userSigafiId)) return true;

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == userSigafiId);
            if (user == null) return false;



            var canonicalUuid = await ResolveCanonicalUuidAsync(projectUuid) ?? projectUuid;
            var project = await _context.InvProyectos.AsNoTracking().FirstOrDefaultAsync(p => p.Uuid == canonicalUuid);
            if (project == null) return false;

            if (project.Estado is "Finalizado" or "Rechazado") return false;

            if (await IsProjectDirectorAsync(projectUuid, userSigafiId)) return true;

            // Integrante activo del equipo del proyecto (p. ej. co-investigador si el director se retira)
            var isProjectTeamMember = await _context.InvProyectosProfesores.AsNoTracking()
                    .AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == user.IdUsuario && pp.Activo != false)
                || await _context.InvProyectosAlumnos.AsNoTracking()
                    .AnyAsync(pa => pa.IdProyecto == project.IdProyecto && pa.IdUsuario == user.IdUsuario && pa.Activo != false);
            if (isProjectTeamMember) return true;

            if (project.TieneGrupo == true && project.IdGrupo.HasValue)
            {
                var group = await _context.InvGruposInvestigacion.AsNoTracking()
                    .Include(g => g.IdCoordinadorNavigation)
                    .FirstOrDefaultAsync(g => g.IdGrupo == project.IdGrupo.Value);
                if (group != null)
                {
                    if (group.IdCoordinador == user.IdUsuario) return true;

                    var coordinatorSigafi = group.IdCoordinadorNavigation?.IdSigafi?.Trim();
                    if (!string.IsNullOrEmpty(coordinatorSigafi) &&
                        string.Equals(coordinatorSigafi, userSigafiId.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    // Miembro activo del grupo de investigación adscrito
                    return await _context.InvGruposMiembros.AsNoTracking()
                        .AnyAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == user.IdUsuario && m.Activo != false);
                }
            }

            return false;
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
                        .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern) &&
                                    (s.SeccionNombre != null || s.Accion != null))
                        .OrderByDescending(s => s.ConectadoEn)
                        .Take(30) // traer más para poder filtrar el ruido de React
                        .ToListAsync();
                    sesiones.AddRange(list);
                }

                // Filtrar sesiones < 5 segundos (ruido de React Strict Mode unmount/remount ~1-2s)
                // Sesiones activas (sin DesconectadoEn) siempre se incluyen
                sesiones = sesiones
                    .Where(s => !s.DesconectadoEn.HasValue ||
                                (s.DesconectadoEn.Value - s.ConectadoEn).TotalSeconds >= 5)
                    .OrderByDescending(s => s.ConectadoEn)
                    .Take(10)
                    .ToList();

                foreach (var s in sesiones)
                {
                    // Ignorar eventos técnicos de conexión base sin actividad real.
                    if (string.IsNullOrWhiteSpace(s.SeccionNombre) && string.IsNullOrWhiteSpace(s.Accion))
                    {
                        continue;
                    }

                    string seccion;
                    string descripcion;

                    if (!string.IsNullOrWhiteSpace(s.SeccionNombre))
                    {
                        seccion = s.SeccionNombre.Replace("_", " ");
                        descripcion = !string.IsNullOrWhiteSpace(s.Accion)
                            ? $"{s.Accion} '{seccion}'"
                            : "ha entrado a redactar";
                    }
                    else
                    {
                        // Fallback para registros antiguos (retrocompatibilidad)
                        var parts = s.DocumentoUuid.Split('_');
                        seccion = parts.Length > 1 ? parts[1].Replace("_", " ") : "el documento";
                        var durMin = s.DesconectadoEn.HasValue
                            ? (int)(s.DesconectadoEn.Value - s.ConectadoEn).TotalMinutes
                            : -1;

                        descripcion = durMin >= 0
                            ? $"Editó '{seccion}' durante {durMin} min"
                            : $"Está editando '{seccion}'";
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "acceso",
                        NombreUsuario = string.IsNullOrWhiteSpace(s.NombreUsuario) ? "Usuario" : s.NombreUsuario,
                        RolUsuario = s.RolUsuario,
                        Descripcion = descripcion,
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

                // 2.5 Comentarios de retroalimentación en tiempo real (Chat / Anotaciones)
                var comentarios = await _context.InvCollaborationComments
                    .AsNoTracking()
                    .Where(c => instanceUuids.Contains(c.DocumentoUuid))
                    .OrderByDescending(c => c.CreadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var c in comentarios)
                {
                    string textDesc = c.Contenido;
                    if (textDesc.Trim().StartsWith("{"))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(textDesc);
                            var root = doc.RootElement;
                            if (root.TryGetProperty("text", out var textProp))
                            {
                                var textVal = textProp.GetString();
                                if (root.TryGetProperty("fieldName", out var fieldProp))
                                {
                                    var fieldVal = fieldProp.GetString();
                                    textDesc = $"Observó '{fieldVal}': {textVal}";
                                }
                                else
                                {
                                    textDesc = textVal ?? c.Contenido;
                                }
                            }
                        }
                        catch {}
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "comentario",
                        NombreUsuario = string.IsNullOrWhiteSpace(c.NombreUsuario) ? "Usuario" : c.NombreUsuario,
                        RolUsuario = "",
                        Descripcion = textDesc,
                        Fecha = c.CreadoEn,
                        Icono = "comment"
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

        private DateOnly? ParseDateOnly(string? dateStr)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return null;

            if (dateStr.Contains("T"))
            {
                dateStr = dateStr.Split('T')[0];
            }

            if (DateOnly.TryParseExact(dateStr, new[] { "dd/MM/yyyy", "yyyy-MM-dd", "d/M/yyyy" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var result))
            {
                return result;
            }

            if (DateOnly.TryParse(dateStr, out result))
            {
                return result;
            }

            return null;
        }

        private string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return "Co-Investigador";

            var r = role.Trim().ToLowerInvariant();
            if (r.Contains("director") || r.Contains("principal")) return "Director de Proyecto";
            if (r.Contains("semillerista") || r.Contains("estudiante") || r.Contains("alumno")) return "Semillerista";

            return "Co-Investigador";
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
