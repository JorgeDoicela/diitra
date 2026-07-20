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

namespace diitra_infrastructure.Research.Subservices
{
    public class ProjectWizardCoreSubservice : IProjectWizardCoreSubservice
    {
        private static readonly string[] OversightRoleCodes = { "DIITRA_ADMIN" };
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly ILogger<ProjectWizardCoreSubservice> _logger;

        public ProjectWizardCoreSubservice(
            DiitraContext context,
            IAuditService auditService,
            ILogger<ProjectWizardCoreSubservice> logger)
        {
            _context = context;
            _auditService = auditService;
            _logger = logger;
        }

        public async Task<(InvProyecto? Project, SyncResult? Error, string? BeforeJson)> ResolveOrCreateProjectCoreAsync(ProyectoDto dto)
        {
            InvProyecto? project = null;
            if (!string.IsNullOrEmpty(dto.Uuid))
            {
                project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.Uuid);
            }

            string? beforeJson = null;
            if (project != null)
            {
                // Bloqueo de Integridad por Estado
                var estadosEditablesRaw = await _context.InvConfigsGenerales
                    .Where(c => c.Clave == "Workflow.EstadosEditables")
                    .Select(c => c.Valor)
                    .FirstOrDefaultAsync() ?? "Borrador,En Corrección";
                var estadosEditables = estadosEditablesRaw.Split(',').Select(s => s.Trim()).ToList();
                estadosEditables.Add("Prepropuesta");
                estadosEditables.Add("Prepropuesta Rechazada");

                if (!estadosEditables.Contains(project.Estado))
                {
                    return (null, new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." }, null);
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

            // Mapeo de Atributos Nucleares Básicos
            project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
            project.CodigoInstitucional = dto.CodigoInstitucional;
            project.TiempoEjecucion = dto.TiempoEjecucion;
            project.FechaPresentacion = ProjectHelper.ParseDateOnly(dto.FechaPresentacion);
            project.FechaInicio = ProjectHelper.ParseDateOnly(dto.FechaInicio ?? dto.FechaInicioEstimada);
            project.FechaFin = ProjectHelper.ParseDateOnly(dto.FechaFin ?? dto.FechaFinEstimada);
            project.PresupuestoEstimado = dto.CostoTotal;

            return (project, null, beforeJson);
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

        public async Task SaveChangesWithConcurrencyResolutionAsync()
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

        public async Task<bool> IsOversightUserAsync(int idUsuario)
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
