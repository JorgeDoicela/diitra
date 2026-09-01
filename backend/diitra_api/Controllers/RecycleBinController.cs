using diitra_application.Research;
using diitra_application.Research.Dtos;
using Diitra.Application.Research;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecycleBinController : ControllerBase
    {
        private readonly DiitraContext _context;
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly IConvocatoriaService _convocatoriaService;
        private readonly IGroupsService _groupsService;

        public RecycleBinController(
            DiitraContext context,
            IProjectOrchestrator projectOrchestrator,
            IConvocatoriaService convocatoriaService,
            IGroupsService groupsService)
        {
            _context = context;
            _projectOrchestrator = projectOrchestrator;
            _convocatoriaService = convocatoriaService;
            _groupsService = groupsService;
        }

        private async Task<int?> GetInternalUserIdAsync()
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return null;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            return user?.IdUsuario;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("DIITRA_ADMIN");
        }

        private static string CleanDeletedSuffix(string? code)
        {
            if (string.IsNullOrWhiteSpace(code)) return "";
            var idx = code.IndexOf("_del_");
            return idx > 0 ? code.Substring(0, idx) : code;
        }

        [HttpGet("projects")]
        public async Task<IActionResult> GetDeletedProjects()
        {
            int? currentUserId = await GetInternalUserIdAsync();
            if (currentUserId == null) return Unauthorized();

            bool isAdmin = IsAdmin();

            // Consultar omitiendo filtros globales (IgnoreQueryFilters) para ver eliminados
            var projectsQuery = _context.InvProyectos
                .IgnoreQueryFilters()
                .Where(p => p.Eliminado == true);

            if (!isAdmin)
            {
                // Un docente solo ve los proyectos que él mismo envió a la papelera
                projectsQuery = projectsQuery.Where(p => p.EliminadoPorUsuarioId == currentUserId);
            }

            var rawProjects = await projectsQuery
                .Select(p => new
                {
                    p.Uuid,
                    p.Titulo,
                    RawCodigoInstitucional = p.CodigoInstitucional,
                    p.Estado,
                    p.FechaEliminacion,
                    EliminadoPor = p.EliminadoPorUsuarioId != null
                        ? _context.Users.Where(u => u.IdUsuario == p.EliminadoPorUsuarioId).Select(u => u.Nombre).FirstOrDefault()
                        : "Desconocido"
                })
                .ToListAsync();

            var projects = rawProjects.Select(p => new
            {
                p.Uuid,
                p.Titulo,
                CodigoInstitucional = CleanDeletedSuffix(p.RawCodigoInstitucional),
                p.Estado,
                p.FechaEliminacion,
                p.EliminadoPor
            });

            return Ok(projects);
        }

        [HttpGet("convocatorias")]
        [Authorize(Roles = "DIITRA_ADMIN")]
        public async Task<IActionResult> GetDeletedConvocatorias()
        {
            var rawConvocatorias = await _context.InvConvocatorias
                .IgnoreQueryFilters()
                .Where(c => c.Eliminado == true)
                .Select(c => new
                {
                    c.Uuid,
                    c.Titulo,
                    RawCodigoConvocatoria = c.CodigoConvocatoria,
                    c.Estado,
                    c.Anio,
                    c.FechaEliminacion,
                    EliminadoPor = c.EliminadoPorUsuarioId != null
                        ? _context.Users.Where(u => u.IdUsuario == c.EliminadoPorUsuarioId).Select(u => u.Nombre).FirstOrDefault()
                        : "Desconocido"
                })
                .ToListAsync();

            var convocatorias = rawConvocatorias.Select(c => new
            {
                c.Uuid,
                c.Titulo,
                CodigoConvocatoria = CleanDeletedSuffix(c.RawCodigoConvocatoria),
                c.Estado,
                c.Anio,
                c.FechaEliminacion,
                c.EliminadoPor
            });

            return Ok(convocatorias);
        }

        [HttpGet("groups")]
        public async Task<IActionResult> GetDeletedGroups()
        {
            int? currentUserId = await GetInternalUserIdAsync();
            if (currentUserId == null) return Unauthorized();

            bool isAdmin = IsAdmin();

            var groupsQuery = _context.InvGruposInvestigacion
                .IgnoreQueryFilters()
                .Where(g => g.Eliminado == true);

            if (!isAdmin)
            {
                groupsQuery = groupsQuery.Where(g => g.EliminadoPorUsuarioId == currentUserId || g.IdCoordinador == currentUserId);
            }

            var groups = await groupsQuery
                .Select(g => new
                {
                    g.Uuid,
                    g.Nombre,
                    g.Siglas,
                    g.Estado,
                    g.FechaEliminacion,
                    EliminadoPor = g.EliminadoPorUsuarioId != null
                        ? _context.Users.Where(u => u.IdUsuario == g.EliminadoPorUsuarioId).Select(u => u.Nombre).FirstOrDefault()
                        : "Desconocido"
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpPost("restore/{entityType}/{uuid}")]
        public async Task<IActionResult> Restore(string entityType, string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            bool success = false;

            if (entityType.Equals("project", StringComparison.OrdinalIgnoreCase))
            {
                var result = await _projectOrchestrator.RestoreProjectAsync(uuid, userIdRef);
                success = result.Success;
            }
            else if (entityType.Equals("convocatoria", StringComparison.OrdinalIgnoreCase))
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Solo los administradores pueden restaurar convocatorias." });
                success = await _convocatoriaService.RestoreAsync(uuid, userIdRef);
            }
            else if (entityType.Equals("group", StringComparison.OrdinalIgnoreCase))
            {
                success = await _groupsService.RestoreAsync(uuid, userIdRef);
            }
            else
            {
                return BadRequest(new { message = "Tipo de entidad inválido." });
            }

            if (!success) return BadRequest(new { message = "No se pudo restaurar el elemento." });
            return Ok(new { success = true, message = "Elemento restaurado con éxito." });
        }

        [HttpDelete("purge/{entityType}/{uuid}")]
        public async Task<IActionResult> Purge(string entityType, string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            bool success = false;
            string message = string.Empty;

            if (entityType.Equals("project", StringComparison.OrdinalIgnoreCase))
            {
                var result = await _projectOrchestrator.PurgeProjectAsync(uuid, userIdRef);
                success = result.Success;
                message = result.Message ?? string.Empty;
            }
            else if (entityType.Equals("convocatoria", StringComparison.OrdinalIgnoreCase))
            {
                if (!IsAdmin()) return StatusCode(403, new { message = "Solo los administradores pueden purgar convocatorias." });
                try
                {
                    success = await _convocatoriaService.PurgeAsync(uuid, userIdRef);
                }
                catch (Exception ex)
                {
                    message = ex.Message;
                }
            }
            else if (entityType.Equals("group", StringComparison.OrdinalIgnoreCase))
            {
                success = await _groupsService.PurgeAsync(uuid, userIdRef);
            }
            else
            {
                return BadRequest(new { message = "Tipo de entidad inválido." });
            }

            if (!success) return BadRequest(new { message = !string.IsNullOrEmpty(message) ? message : "No se pudo eliminar permanentemente el elemento." });
            return Ok(new { success = true, message = "Elemento eliminado permanentemente." });
        }
    }
}
