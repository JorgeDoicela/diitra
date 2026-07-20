using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using diitra_application.Common.Notifications;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Common.Notifications
{
    public class ProjectAdoptionService : IProjectAdoptionService
    {
        private readonly DiitraContext _context;
        private readonly ILogger<ProjectAdoptionService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public ProjectAdoptionService(
            DiitraContext context,
            ILogger<ProjectAdoptionService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _context = context;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task<IEnumerable<object>> GetUnfinishedProjectsAsync()
        {
            var list = await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .ThenInclude(s => s!.IdLineaNavigation)
                .Include(p => p.InvProyectoParticipantes)
                .ThenInclude(pp => pp.IdUsuarioNavigation)
                .Where(p => p.Activo != false && (p.Estado == "Inconcluso" || p.DisponibleAdopcion == true))
                .OrderByDescending(p => p.FechaModificacion)
                .ToListAsync();
 
            return list.Select(p => {
                var currentDirector = p.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                string desc = "";
                if (!string.IsNullOrEmpty(p.MetadataCacesJson))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(p.MetadataCacesJson);
                        if (doc.RootElement.TryGetProperty("descripcionProyecto", out var el) || doc.RootElement.TryGetProperty("DescripcionProyecto", out el))
                        {
                            desc = el.GetString() ?? "";
                        }
                    }
                    catch {}
                }

                return new
                {
                    id_proyecto = p.IdProyecto,
                    uuid = p.Uuid,
                    titulo = p.Titulo,
                    codigo_institucional = p.CodigoInstitucional,
                    descripcion = desc,
                    estado = p.Estado,
                    disponible_adopcion = p.DisponibleAdopcion,
                    linea_investigacion = p.IdSublineaNavigation?.IdLineaNavigation?.NombreLinea ?? "General",
                    sublinea = p.IdSublineaNavigation?.Nombre ?? "No asignada",
                    director_anterior = currentDirector?.IdUsuarioNavigation?.Nombre ?? "Sin asignar",
                    director_anterior_email = currentDirector?.IdUsuarioNavigation?.EmailInstitucional ?? ""
                };
            });
        }

        public async Task<bool> MarkProjectAsUnfinishedAsync(int projectId, string reason, int? adminUserId = null)
        {
            var project = await _context.InvProyectos.FindAsync(projectId);
            if (project == null) return false;

            string beforeJson = JsonSerializer.Serialize(new { estado = project.Estado, disponibleAdopcion = project.DisponibleAdopcion });

            project.Estado = "Inconcluso";
            project.DisponibleAdopcion = true;
            project.FechaModificacion = DateTime.Now;

            var trazabilidad = new InvTrazabilidadProyecto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdUsuario = adminUserId,
                EstadoAnterior = beforeJson,
                EstadoNuevo = "Inconcluso",
                Observacion = $"Proyecto marcado como Inconcluso y Disponible para Adopción. Motivo: {reason}",
                FechaTransicion = DateTime.Now
            };

            var ult = await _context.InvTrazabilidadProyectos
                .Where(t => t.IdProyecto == project.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .FirstOrDefaultAsync();

            trazabilidad.HashAnterior = ult?.HashActual;
            string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion?.ToString("o", System.Globalization.CultureInfo.InvariantCulture)}";
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
            }

            _context.InvTrazabilidadProyectos.Add(trazabilidad);
            await _context.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    var dto = JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (dto != null)
                    {
                        dto.Estado = "Inconcluso";
                        project.MetadataCacesJson = JsonSerializer.Serialize(dto);
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al sincronizar metadata de CACES");
            }

            var sublinea = await _context.InvSublineas
                .Include(s => s.IdLineaNavigation)
                .FirstOrDefaultAsync(s => s.IdSublinea == project.IdSublinea);

            string desc = "";
            if (!string.IsNullOrEmpty(project.MetadataCacesJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(project.MetadataCacesJson);
                    if (doc.RootElement.TryGetProperty("descripcionProyecto", out var el) || doc.RootElement.TryGetProperty("DescripcionProyecto", out el))
                    {
                        desc = el.GetString() ?? "";
                    }
                }
                catch {}
            }

            var sendRequest = new EmailSendRequest
            {
                TemplateCodigo = "PROYECTO_INCONCLUSO_DISPONIBLE",
                TargetRole = "DIITRA_DOCENTE",
                EntityUuid = project.Uuid,
                EntityType = "Proyecto",
                TemplateData = new Dictionary<string, string>
                {
                    { "[[proyecto_codigo]]", project.CodigoInstitucional ?? "Sin código" },
                    { "[[proyecto_titulo]]", project.Titulo ?? "Sin título" },
                    { "[[linea_investigacion]]", sublinea?.IdLineaNavigation?.NombreLinea ?? "General" },
                    { "[[proyecto_descripcion]]", !string.IsNullOrEmpty(desc) ? desc : "Sin descripción detallada" },
                    { "[[url_adopcion]]", $"/investigacion/adopcion" }
                }
            };

            _ = Task.Run(async () => {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var emailEngineService = scope.ServiceProvider.GetRequiredService<IEmailEngineService>();
                    await emailEngineService.SendTemplatedEmailAsync(sendRequest);
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Error al enviar correos de difusión de proyecto inconcluso");
                }
            });

            return true;
        }

        public async Task<bool> AdoptProjectAsync(int projectId, int newDirectorUserId)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectoParticipantes)
                .FirstOrDefaultAsync(p => p.IdProyecto == projectId);

            if (project == null || project.Estado != "Inconcluso" || project.DisponibleAdopcion != true)
            {
                return false;
            }

            var newDirectorUser = await _context.Users.FindAsync(newDirectorUserId);
            if (newDirectorUser == null || newDirectorUser.TablaSigafi != "profesor") 
            {
                // Solo usuarios registrados como docentes en SIGAFI pueden adoptar y dirigir proyectos
                return false;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var oldDirector = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false && pp.TipoParticipante == "Docente");

                if (oldDirector != null)
                {
                    oldDirector.Activo = false;
                    oldDirector.FechaFin = DateTime.Now;
                    oldDirector.MotivoCambio = $"Proyecto reasignado por adopción del docente {newDirectorUser.Nombre}";
                    oldDirector.EsDirector = false;
                }

                var existingProf = project.InvProyectoParticipantes
                    .FirstOrDefault(pp => pp.IdUsuario == newDirectorUserId && pp.TipoParticipante == "Docente");

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
                    _context.InvProyectoParticipantes.Add(new InvProyectoParticipante
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = newDirectorUserId,
                        TipoParticipante = "Docente",
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel",
                        Telefono = "",
                        EsDirector = true,
                        Activo = true,
                        FechaInicio = DateTime.Now
                    });
                }

                var estadoDestinoAdopcion = await _context.InvConfigWorkflows
                    .Where(w => w.Activo && w.EstadoOrigen == "Inconcluso")
                    .Select(w => w.EstadoDestino)
                    .FirstOrDefaultAsync() ?? "En Ejecución";

                project.DisponibleAdopcion = false;
                project.Estado = estadoDestinoAdopcion; 
                project.FechaModificacion = DateTime.Now;

                var trazabilidad = new InvTrazabilidadProyecto
                {
                    Uuid = Guid.NewGuid().ToString(),
                    IdProyecto = project.IdProyecto,
                    IdUsuario = newDirectorUserId,
                    EstadoAnterior = "Inconcluso",
                    EstadoNuevo = estadoDestinoAdopcion,
                    Observacion = $"Proyecto adoptado y reanudado por el docente director: {newDirectorUser.Nombre}",
                    FechaTransicion = DateTime.Now
                };

                var ult = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .OrderByDescending(t => t.FechaTransicion)
                    .FirstOrDefaultAsync();

                trazabilidad.HashAnterior = ult?.HashActual;
                string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion?.ToString("o", System.Globalization.CultureInfo.InvariantCulture)}";
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                    trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
                }

                _context.InvTrazabilidadProyectos.Add(trazabilidad);
                await _context.SaveChangesAsync();

                try
                {
                    if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                    {
                        var dto = JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (dto != null)
                        {
                            dto.Estado = estadoDestinoAdopcion;
                            
                            var updatedProfs = await _context.InvProyectoParticipantes
                                .Include(pp => pp.IdUsuarioNavigation)
                                .Where(pp => pp.IdProyecto == project.IdProyecto && pp.TipoParticipante == "Docente")
                                .ToListAsync();

                            dto.Investigadores = updatedProfs.Select(pp => new InvestigadorDto
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
                                EsDirector = pp.EsDirector
                            }).ToList();

                            project.MetadataCacesJson = JsonSerializer.Serialize(dto);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al sincronizar metadata de CACES en la adopción");
                }

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al procesar la adopción del proyecto {ProjectId}", projectId);
                return false;
            }
        }
    }
}
