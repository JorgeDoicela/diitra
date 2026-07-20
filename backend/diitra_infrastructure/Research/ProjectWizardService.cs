using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public class ProjectWizardService : IProjectWizardService
    {
        private static readonly string[] OversightRoleCodes = { "DIITRA_ADMIN" };
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly IProjectQueryService _queryService;
        private readonly IProjectTeamService _teamService;
        private readonly ILogger<ProjectWizardService> _logger;

        public ProjectWizardService(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            IProjectQueryService queryService,
            IProjectTeamService teamService,
            ILogger<ProjectWizardService> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _queryService = queryService;
            _teamService = teamService;
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
                    estadosEditables.Add("Prepropuesta");
                    estadosEditables.Add("Prepropuesta Rechazada");
                    if (!estadosEditables.Contains(project.Estado))
                    {
                        return new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." };
                    }

                    var beforeState = new
                    {
                        Titulo = project.Titulo,
                        CodigoInstitucional = project.CodigoInstitucional,
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
                        Estado = string.IsNullOrEmpty(dto.Estado) ? "Prepropuesta" : dto.Estado
                    };
                    _context.InvProyectos.Add(project);
                }

                // 2. Mapeo de Atributos Nucleares
                project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
                project.CodigoInstitucional = dto.CodigoInstitucional;
                project.TiempoEjecucion = dto.TiempoEjecucion;
                project.FechaPresentacion = ProjectHelper.ParseDateOnly(dto.FechaPresentacion);
                project.FechaInicio = ProjectHelper.ParseDateOnly(dto.FechaInicio ?? dto.FechaInicioEstimada);
                project.FechaFin = ProjectHelper.ParseDateOnly(dto.FechaFin ?? dto.FechaFinEstimada);
                project.PresupuestoEstimado = dto.CostoTotal;

                // Cumplimiento CACES
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

                    var approvedGroup = await ProjectHelper.ResolveApprovedGroupAsync(_context, groupUuid);
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

                    dto.Investigadores = await _teamService.BuildProjectInvestigadoresFromGroupAsync(approvedGroup.IdGrupo, project.IdProyecto, dto.Investigadores);
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
                    var searchName = dto.TipoInvestigacion.Trim().ToUpper()
                        .Replace("Á", "A")
                        .Replace("É", "E")
                        .Replace("Í", "I")
                        .Replace("Ó", "O")
                        .Replace("Ú", "U");

                    var tip = await _context.InvTiposInvestigacion.FirstOrDefaultAsync(t => 
                        (t.Nombre.ToUpper() == searchName || 
                         t.Nombre.ToUpper().Replace("Á", "A").Replace("É", "E").Replace("Í", "I").Replace("Ó", "O").Replace("Ú", "U") == searchName) && 
                        t.Activo == true);

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

                // Persistencia Completa en Metadata
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

                // Sincronización de Carreras
                await _teamService.SyncProjectCarrerasAsync(project.IdProyecto, dto.IdCarrera, dto.Investigadores);

                // Sincronización automática de miembros de grupo
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
                            var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, user.IdSigafi, user.TablaSigafi);
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

                // 3. Sincronización de Equipo
                if (dto.Investigadores != null && dto.Investigadores.Count > 0)
                {
                    await _teamService.SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores, isFromWizard: true);
                }

                // Auto-vincular al creador como Director
                if (!string.IsNullOrEmpty(creatorUserIdRef))
                {
                    var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == creatorUserIdRef);
                    if (internalUser != null && !await IsOversightUserAsync(internalUser.IdUsuario))
                    {
                        var isLinked = await _context.InvProyectoParticipantes.AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == internalUser.IdUsuario);
 
                        if (!isLinked)
                        {
                            var phone = await ProjectHelper.GetUserPhoneFromCatalogAsync(_context, internalUser.IdSigafi, internalUser.TablaSigafi);
                            if (internalUser.TablaSigafi == "alumno")
                            {
                                _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    TipoParticipante = "Alumno",
                                    Rol = "Semillerista",
                                    NivelAcademico = "Pregrado",
                                    Telefono = phone,
                                    EsDirector = false,
                                    Activo = true,
                                    FechaInicio = DateTime.Now
                                });
                            }
                            else
                            {
                                _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                                {
                                    IdProyecto = project.IdProyecto,
                                    IdUsuario = internalUser.IdUsuario,
                                    TipoParticipante = "Docente",
                                    Rol = "Director de Proyecto",
                                    NivelAcademico = "Tercer Nivel",
                                    Telefono = phone,
                                    EsDirector = true,
                                    Activo = true,
                                    FechaInicio = DateTime.Now
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

        public async Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            if (project.Estado != "Borrador" && project.Estado != "En Corrección" &&
                project.Estado != "Prepropuesta" && project.Estado != "Prepropuesta Rechazada")
            {
                return new SyncResult { Success = false, Message = "Solo se pueden eliminar prepropuestas y borradores de proyectos." };
            }

            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                Estado = project.Estado,
                DescripcionProyecto = "",
                Activo = project.Activo,
                FechaRegistro = project.FechaRegistro
            });

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            project.Eliminado = true;
            project.FechaEliminacion = DateTime.UtcNow;
            project.EliminadoPorUsuarioId = internalUserId;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "ELIMINAR_PROYECTO_TEMPORAL", $"Proyecto enviado a la papelera: {project.Titulo}", "PROYECTOS", beforeJson, null);

            return new SyncResult { Success = true };
        }

        public async Task<SyncResult> RestoreProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return new SyncResult { Success = false, Message = "Proyecto no encontrado o no existe." };
            }

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            project.Eliminado = false;
            project.FechaEliminacion = null;
            project.EliminadoPorUsuarioId = null;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "RESTAURAR_PROYECTO", $"Proyecto restaurado de la papelera: {project.Titulo}", "PROYECTOS", null, null);

            return new SyncResult { Success = true };
        }

        public async Task<SyncResult> PurgeProjectAsync(string uuid, string? userIdRef)
        {
            var project = await _context.InvProyectos
                .IgnoreQueryFilters()
                .Include(p => p.InvProyectosCarreras)
                .Include(p => p.InvProyectoParticipantes)
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

            string beforeJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Titulo = project.Titulo,
                CodigoInstitucional = project.CodigoInstitucional,
                Estado = project.Estado,
                DescripcionProyecto = "",
                Activo = project.Activo,
                FechaRegistro = project.FechaRegistro
            });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.InvProyectosCarreras.RemoveRange(project.InvProyectosCarreras);
                _context.InvProyectoParticipantes.RemoveRange(project.InvProyectoParticipantes);
                _context.InvObjetivosProyecto.RemoveRange(project.InvObjetivosProyecto);
                _context.InvPresupuestoItems.RemoveRange(project.InvPresupuestoItems);

                _context.InvCronogramas.RemoveRange(project.InvCronogramas);
                _context.InvBibliografiasProyecto.RemoveRange(project.InvBibliografiasProyecto);
                _context.InvImpactosProyecto.RemoveRange(project.InvImpactosProyecto);
                _context.InvProductos.RemoveRange(project.InvProductos);
                _context.InvProyectosMml.RemoveRange(project.MatrizMarcoLogico);
                _context.InvRecursosDisponibles.RemoveRange(project.InvRecursosDisponibles);

                var trazabilidadLogs = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .ToListAsync();
                if (trazabilidadLogs.Any())
                {
                    _context.InvTrazabilidadProyectos.RemoveRange(trazabilidadLogs);
                }

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
                        entry.State = EntityState.Detached;
                    }
                    else
                    {
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

        private List<string> ParseObjetivosHtml(System.Collections.Generic.List<string>? objetivos)
        {
            var result = new List<string>();
            if (objetivos == null) return result;

            foreach (var item in objetivos)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;

                if (item.Contains("<li") || item.Contains("<p"))
                {
                    string cleaned = item.Replace("<ul>", "").Replace("</ul>", "").Replace("<ol>", "").Replace("</ol>", "");

                    var matches = System.Text.RegularExpressions.Regex.Matches(cleaned, @"<(li|p)[^>]*>(.*?)<\/\1>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (matches.Count > 0)
                    {
                        foreach (System.Text.RegularExpressions.Match match in matches)
                        {
                            var text = System.Text.RegularExpressions.Regex.Replace(match.Groups[2].Value, @"<[^>]*>", "").Trim();
                            text = System.Net.WebUtility.HtmlDecode(text);
                            text = System.Text.RegularExpressions.Regex.Replace(text, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();

                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                result.Add(text);
                            }
                        }
                    }
                    else
                    {
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
            var generalOpt = await _context.InvObjetivosProyecto.FirstOrDefaultAsync(o => o.IdProyecto == projectId && o.EsGeneral);

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

            var existing = await _context.InvPresupuestoItems
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            _context.InvPresupuestoItems.RemoveRange(existing);
            await _context.SaveChangesAsync();

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

            var existing = await _context.InvProyectosMml
                .Where(m => m.IdProyecto == projectId)
                .ToListAsync();

            var newResumenes = mml
                .Where(r => !string.IsNullOrWhiteSpace(r.Resumen))
                .Select(r => r.Resumen!.Trim())
                .ToHashSet();

            var toDelete = existing
                .Where(e => !newResumenes.Contains(e.ResumenNarrativo.Trim()))
                .ToList();
            _context.InvProyectosMml.RemoveRange(toDelete);

            var existingResumenes = existing
                .Select(e => e.ResumenNarrativo.Trim())
                .ToHashSet();

            foreach (var row in mml)
            {
                if (string.IsNullOrWhiteSpace(row.Resumen)) continue;
                if (existingResumenes.Contains(row.Resumen.Trim())) continue;
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

            var existing = await _context.InvImpactosProyecto
                .Where(i => i.IdProyecto == projectId)
                .ToListAsync();

            var newImpactos = new Dictionary<int, string?>
            {
                { 1, impacto.Social },
                { 2, impacto.Cientifico },
                { 3, impacto.Economico },
                { 4, impacto.Politico },
                { 5, impacto.Ambiental },
                { 6, impacto.Otro }
            };

            foreach (var kvp in newImpactos)
            {
                var existingItem = existing.FirstOrDefault(e => e.IdCatImpacto == kvp.Key);
                if (string.IsNullOrWhiteSpace(kvp.Value))
                {
                    if (existingItem != null) _context.InvImpactosProyecto.Remove(existingItem);
                    continue;
                }
                if (existingItem != null)
                    existingItem.Descripcion = kvp.Value;
                else
                    AddImpacto(projectId, kvp.Key, kvp.Value);
            }
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

            var existing = await _context.InvProductos
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var newTitulos = productos
                .Where(p => !string.IsNullOrWhiteSpace(p.Tipo))
                .Select(p => p.Tipo!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newTitulos.Contains(e.Titulo.Trim())).ToList();
            _context.InvProductos.RemoveRange(toDelete);

            var existingTitulos = existing.Select(e => e.Titulo.Trim()).ToHashSet();

            foreach (var p in productos)
            {
                if (string.IsNullOrWhiteSpace(p.Tipo)) continue;
                if (existingTitulos.Contains(p.Tipo.Trim())) continue;

                var cat = await _context.InvCatTipoProductos.FirstOrDefaultAsync(c => c.Nombre == p.Tipo);
                _context.InvProductos.Add(new InvProducto
                {
                    IdProyecto = projectId,
                    IdTipoProducto = cat?.IdTipoProducto ?? 1,
                    Titulo = p.Tipo,
                    Cantidad = int.TryParse(p.Cantidad, out var cant) ? cant : 1
                });
            }
        }

        private async Task SyncCronogramaAsync(int projectId, List<int> objetivosCreadosIds, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;

            var oldActivities = await _context.InvCronogramas
                .Where(c => c.IdProyecto == projectId)
                .ToListAsync();

            _context.InvCronogramas.RemoveRange(oldActivities);

            int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

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
                    FechaInicioPrevista = ProjectHelper.ParseDateOnly(act.FechaInicioPrevista),
                    FechaFinPrevista = ProjectHelper.ParseDateOnly(act.FechaFinPrevista)
                };

                _context.InvCronogramas.Add(nuevaAct);
            }
        }

        private async Task SyncBibliografiaAsync(int projectId, System.Collections.Generic.List<string>? biblio)
        {
            if (biblio == null) return;

            var existing = await _context.InvBibliografiasProyecto
                .Where(b => b.IdProyecto == projectId)
                .ToListAsync();

            var newCitas = biblio
                .Where(b => !string.IsNullOrWhiteSpace(b))
                .Select(b => b.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newCitas.Contains(e.CitaApa.Trim())).ToList();
            _context.InvBibliografiasProyecto.RemoveRange(toDelete);

            var existingCitas = existing.Select(e => e.CitaApa.Trim()).ToHashSet();
            foreach (var b in biblio)
            {
                if (string.IsNullOrWhiteSpace(b) || existingCitas.Contains(b.Trim())) continue;
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

            var existing = await _context.InvRecursosDisponibles
                .Where(r => r.IdProyecto == projectId)
                .ToListAsync();

            var newDetalles = recursos
                .Where(r => !string.IsNullOrWhiteSpace(r.Descripcion))
                .Select(r => r.Descripcion!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newDetalles.Contains(e.Detalle.Trim())).ToList();
            _context.InvRecursosDisponibles.RemoveRange(toDelete);

            var existingDetalles = existing.Select(e => e.Detalle.Trim()).ToHashSet();
            foreach (var r in recursos)
            {
                if (string.IsNullOrWhiteSpace(r.Descripcion) || existingDetalles.Contains(r.Descripcion.Trim())) continue;
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
