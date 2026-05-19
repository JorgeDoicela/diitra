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

                if (project != null)
                {
                    // 1.1 Bloqueo de Integridad por Estado
                    if (project.Estado != "Borrador" && project.Estado != "En Corrección")
                    {
                        return new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." };
                    }
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

                await _context.SaveChangesAsync(); // Aseguramos ID del proyecto

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

                // 3. Sincronización de Equipo (Anti-Corruption Layer provisionada por AuthService)
                await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores);

                // Auto-vincular al creador como Director si no hay investigadores registrados o no está ya vinculado
                if (!string.IsNullOrEmpty(creatorUserIdRef))
                {
                    var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == creatorUserIdRef);
                    if (internalUser != null)
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

                // 4. Sincronización de Objetivos Específicos
                await SyncObjetivosAsync(project.IdProyecto, dto.ObjetivosEspecificos);

                // 5. Sincronización de Presupuesto
                await SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);

                // 6. Sincronización de MML
                await SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);

                // 7. Sincronización de Impactos
                await SyncImpactosAsync(project.IdProyecto, dto.Impacto);

                // 8. Sincronización de Productos
                await SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);

                // 9. Sincronización de Cronograma
                await SyncCronogramaAsync(project.IdProyecto, dto.Cronograma);

                // 10. Sincronización de Bibliografía
                await SyncBibliografiaAsync(project.IdProyecto, dto.Bibliografia);

                // 11. Sincronización de Recursos Disponibles
                await SyncRecursosDisponiblesAsync(project.IdProyecto, dto.RecursosDisponibles);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _auditService.LogActionAsync(null, project.Estado == "Borrador" && dto.Uuid == null ? "CREAR_PROYECTO" : "ACTUALIZAR_PROYECTO", $"Sincronización de datos del proyecto: {project.Titulo}", "PROYECTOS");

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
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .OrderByDescending(p => p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
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
                    TrlMeta = (int?)p.TrlMeta
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
                .Include(p => p.InvProyectosProfesores)
                .Include(p => p.InvProyectosAlumnos)
                .Include(p => p.InvProductos)
                .Include(p => p.InvInformesAvance)
                .OrderByDescending(p => p.FechaModificacion ?? p.FechaRegistro)
                .Select(p => new ProyectoResumenDto
                {
                    IdProyecto = p.IdProyecto,
                    Uuid = p.Uuid,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Titulo = p.Titulo,
                    Estado = p.Estado,
                    LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
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
                    TrlMeta = (int?)p.TrlMeta
                })
                .ToListAsync();
        }

        public async Task<ProyectoDto?> GetProjectDetailAsync(string uuid)
        {
            var p = await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .Include(p => p.IdConvocatoriaNavigation)
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
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (p == null) return null;

            return new ProyectoDto
            {
                Uuid = p.Uuid,
                CodigoInstitucional = p.CodigoInstitucional,
                Estado = p.Estado,
                IdConvocatoria = p.IdConvocatoria,
                IdCarrera = p.InvProyectosCarreras.FirstOrDefault()?.IdCarrera,
                IdObjetivoPnd = p.IdObjetivoPnd,
                Titulo = p.Titulo,
                DescripcionProyecto = p.DescripcionProyecto,
                Antecedentes = p.Antecedentes,
                Justificacion = p.Justificacion,
                MarcoTeorico = p.MarcoTeorico,
                Metodologia = p.Metodologia,
                TiempoEjecucion = p.TiempoEjecucion,
                TrlInicial = (int?)p.TrlInicial,
                TrlActual = (int?)p.TrlActual,
                TrlMeta = (int?)p.TrlMeta,
                LineaInvestigacion = p.IdSublineaNavigation != null ? p.IdSublineaNavigation.Nombre : null,
                CostoTotal = p.InvPresupuestoItems.Sum(i => i.ValorUnitario * i.Cantidad),
                Investigadores = p.InvProyectosProfesores.Select(pp => new InvestigadorDto
                {
                    Nombre = pp.IdUsuarioNavigation?.Nombre,
                    Rol = pp.Rol,
                    NivelAcademico = pp.NivelAcademico,
                    Telefono = pp.Telefono
                }).Concat(p.InvProyectosAlumnos.Select(pa => new InvestigadorDto
                {
                    Nombre = pa.IdUsuarioNavigation?.Nombre,
                    Rol = pa.Rol,
                    NivelAcademico = pa.NivelAcademico,
                    Telefono = pa.Telefono
                })).ToList(),
                ObjetivosEspecificos = p.InvObjetivosProyecto
                    .Where(o => !o.EsGeneral)
                    .OrderBy(o => o.Orden)
                    .Select(o => o.Descripcion)
                    .ToList(),
                RecursosNecesarios = p.InvPresupuestoItems.Select(i => new RecursoNecesarioDto
                {
                    Descripcion = i.Detalle,
                    CostoUnitario = i.ValorUnitario,
                    IdPartida = i.IdPartida,
                    EsGastoCapital = i.EsGastoCapital
                }).ToList(),
                Cronograma = p.InvCronogramas.OrderBy(c => c.NumeroActividad).Select(c => new ActividadCronogramaDto
                {
                    Numero = c.NumeroActividad,
                    Actividad = c.Descripcion,
                    Ponderacion = c.Ponderacion,
                    EsEntregableCaces = c.EsEntregableCaces,
                    Semanas = c.InvCronogramaSemanas.OrderBy(s => s.IdSemana).Select(s => s.Semana).ToList()
                }).ToList(),
                Bibliografia = p.InvBibliografiasProyecto.Select(b => b.CitaApa).ToList(),
                MatrizMarcoLogico = p.MatrizMarcoLogico.Select(m => new MmlRowDto
                {
                    Nivel = m.Nivel,
                    Resumen = m.ResumenNarrativo,
                    Indicadores = m.Indicadores,
                    Medios = m.MediosVerificacion,
                    Supuestos = m.Supuestos
                }).ToList()
            };
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin)
        {
            var stats = new DashboardStatsDto();

            // ── Métricas Globales (siempre las calculamos para Admin/Director) ──
            var proyectosQuery = _context.InvProyectos.AsQueryable();

            stats.TotalProyectos = await proyectosQuery.CountAsync();
            stats.ProyectosBorrador = await proyectosQuery.CountAsync(p => p.Estado == "Borrador");
            stats.ProyectosEnRevision = await proyectosQuery.CountAsync(p => p.Estado == "En Revisión" || p.Estado == "Enviado");
            stats.ProyectosAprobados = await proyectosQuery.CountAsync(p => p.Estado == "Aprobado");
            stats.ProyectosEnEjecucion = await proyectosQuery.CountAsync(p => p.Estado == "En Ejecución");
            stats.ProyectosFinalizados = await proyectosQuery.CountAsync(p => p.Estado == "Finalizado");

            stats.TotalConvocatoriasAbiertas = await _context.InvConvocatorias
                .CountAsync(c => c.Estado == "Abierta");

            stats.TotalProductosPeriodo = await _context.InvProductos.CountAsync();
            stats.ArticulosIndexados = await _context.InvProductos
                .CountAsync(p => p.IdTipoProducto == 1); // 1 = Artículo indexado
            stats.Prototipos = await _context.InvProductos
                .CountAsync(p => p.IdTipoProducto == 3); // 3 = Prototipo
            stats.Ponencias = await _context.InvProductos
                .CountAsync(p => p.IdTipoProducto == 5); // 5 = Ponencia

            stats.PresupuestoTotalAsignado = await _context.InvPresupuestoItems
                .SumAsync(i => (decimal?)(i.ValorUnitario * i.Cantidad)) ?? 0;
            stats.PresupuestoTotalEjecutado = await _context.InvProyectos
                .SumAsync(p => p.ValorEjecucion ?? 0);

            // Distribución por estado para el gráfico
            var colorMap = new Dictionary<string, string>
            {
                { "Borrador", "#6B7280" },
                { "Enviado", "#3B82F6" },
                { "En Revisión", "#F59E0B" },
                { "Aprobado", "#10B981" },
                { "En Ejecución", "#8B5CF6" },
                { "Finalizado", "#059669" },
                { "Rechazado", "#EF4444" }
            };

            stats.ProyectosPorEstado = await _context.InvProyectos
                .GroupBy(p => p.Estado)
                .Select(g => new EstadoConteoDto
                {
                    Estado = g.Key,
                    Cantidad = g.Count(),
                    Color = colorMap.ContainsKey(g.Key) ? colorMap[g.Key] : "#6B7280"
                })
                .ToListAsync();

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

            var ultimosInformes = await _context.InvInformesAvance
                .Include(i => i.IdProyectoNavigation)
                .OrderByDescending(i => i.IdInforme)
                .Take(5)
                .Select(i => new ActividadRecienteDto
                {
                    Tipo = "informe",
                    Descripcion = $"Informe #{i.NumeroInforme} — {i.IdProyectoNavigation.Titulo}",
                    Fecha = DateTime.Now,
                    Uuid = i.Uuid.ToString(),
                    Estado = i.Estado
                })
                .ToListAsync();

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

            var currentProfs = _context.InvProyectosProfesores.Where(p => p.IdProyecto == projectId);
            var currentAlums = _context.InvProyectosAlumnos.Where(p => p.IdProyecto == projectId);
            _context.InvProyectosProfesores.RemoveRange(currentProfs);
            _context.InvProyectosAlumnos.RemoveRange(currentAlums);

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var persona = await _authService.GetOrProvisionUserByCedulaAsync(inv.Cedula);
                if (persona == null) continue;

                if (persona.TablaSigafi == "alumno")
                {
                    _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                    {
                        IdProyecto = projectId,
                        IdUsuario = persona.IdUsuario,
                        Rol = inv.Rol,
                        NivelAcademico = inv.NivelAcademico,
                        Telefono = inv.Telefono
                    });
                }
                else
                {
                    _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                    {
                        IdProyecto = projectId,
                        IdUsuario = persona.IdUsuario,
                        Rol = inv.Rol,
                        NivelAcademico = inv.NivelAcademico,
                        Telefono = inv.Telefono,
                        EsDirector = inv.Rol?.Contains("Director") == true
                    });
                }

                // Notificar al investigador sobre su asignación/actualización
                var project = await _context.InvProyectos.FindAsync(projectId);
                await _notificationService.NotifyUserAsync(
                    persona.IdUsuario,
                    "Actualización de Proyecto",
                    $"Se han sincronizado tus datos en el proyecto: {project?.Titulo}",
                    "INVESTIGACION",
                    $"/proyectos/{project?.Uuid}",
                    new Dictionary<string, string>
                    {
                        { "Proyecto", project?.Titulo ?? "Sin título" },
                        { "Rol Asignado", inv.Rol ?? "Investigador" },
                        { "Fecha Sincronización", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                    }
                );
            }
        }

        private async Task SyncObjetivosAsync(int projectId, System.Collections.Generic.List<string>? objetivos)
        {
            if (objetivos == null) return;
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

        private async Task SyncCronogramaAsync(int projectId, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;
            
            // 1. Limpieza profunda
            var oldActivities = await _context.InvCronogramas.Where(c => c.IdProyecto == projectId).ToListAsync();
            foreach(var old in oldActivities) {
                var weeks = _context.InvCronogramaSemanas.Where(s => s.IdActividad == old.IdActividad);
                _context.InvCronogramaSemanas.RemoveRange(weeks);
            }
            _context.InvCronogramas.RemoveRange(oldActivities);
            await _context.SaveChangesAsync();

            // 2. Inserción
            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = 0, // TODO: Vincular con objetivo específico si se requiere
                    NumeroActividad = act.Numero,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Ponderacion = act.Ponderacion,
                    EsEntregableCaces = act.EsEntregableCaces ?? false
                };
                _context.InvCronogramas.Add(nuevaAct);
                await _context.SaveChangesAsync(); // Para obtener IdActividad

                if (act.Semanas != null)
                {
                    for (int i = 0; i < act.Semanas.Count; i++)
                    {
                        if (act.Semanas[i])
                        {
                            _context.InvCronogramaSemanas.Add(new InvCronogramaSemana
                            {
                                IdActividad = nuevaAct.IdActividad,
                                Mes = $"Mes {(i / 4) + 1}",
                                Semana = true // Indica que esta semana está marcada
                            });
                        }
                    }
                }
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
    }
}
