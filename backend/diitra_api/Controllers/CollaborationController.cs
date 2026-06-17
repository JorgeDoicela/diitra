using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using diitra_infrastructure.data.models;
using diitra_infrastructure.data.models.Cowork;
using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using diitra_infrastructure.Collaboration;
using Microsoft.AspNetCore.Authorization;

namespace diitra_api.Controllers
{
    /// <summary>
    /// CONTROLADOR DE COORDINACIÓN (Team Pulse)
    /// Maneja el estado inicial de la colaboración antes de entrar al flujo SignalR.
    /// </summary>
    [ApiController]
    [Route("api/collaboration")]
    [Authorize]
    public class CollaborationController : ControllerBase
    {
        private readonly DiitraContext _db;
        private readonly Diitra.Infrastructure.Common.Storage.IFileStorageService _storageService;
        private readonly IHubContext<CollaborationHub> _hubContext;

        public CollaborationController(
            DiitraContext db, 
            Diitra.Infrastructure.Common.Storage.IFileStorageService storageService,
            IHubContext<CollaborationHub> hubContext)
        {
            _db = db;
            _storageService = storageService;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Recibe una imagen pegada en el editor colaborativo, la guarda en el servidor
        /// y retorna su URL estática para evitar incrustar Base64 en el Yjs.
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No se proporcionó ningún archivo." });

            try
            {
                using var memoryStream = new System.IO.MemoryStream();
                await file.CopyToAsync(memoryStream);
                var content = memoryStream.ToArray();

                // Guardar usando el servicio
                var relativePath = await _storageService.SaveFileAsync(file.FileName, content, "cowork_images");

                // Generar URL pública (asumiendo que la API se sirve en la ruta raíz o mapeada a frontend)
                // Se reemplazan los "\" por "/" para compatibilidad de URL en navegadores.
                var url = $"/api/storage/{relativePath.Replace('\\', '/')}";

                return Ok(new { url = url });
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[DIITRA ERROR] Fallo al subir imagen CoWork: {ex.Message}");
                return StatusCode(500, new { message = "Error interno al guardar la imagen", detail = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene el pulso actual del documento (comentarios y estados de sección).
        /// </summary>
        [HttpGet("{instanceUuid}/pulse")]
        public async Task<IActionResult> GetPulse(string instanceUuid)
        {
            try 
            {
                var isAdmin = User.IsInRole("DIITRA_ADMIN") || User.FindFirst("es_admin")?.Value == "true";
                if (!isAdmin)
                {
                    var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value?.Trim();
                    if (!string.IsNullOrEmpty(username))
                    {
                        var user = await _db.Users.FirstOrDefaultAsync(u => u.IdSigafi.Trim() == username);
                        if (user != null)
                        {
                            var group = await _db.InvGruposInvestigacion
                                .Include(g => g.IdCoordinadorNavigation)
                                .FirstOrDefaultAsync(g => g.Uuid == instanceUuid);
                            if (group != null)
                            {
                                var isGroupMember = (group.IdCoordinador == user.IdUsuario) ||
                                                    (group.IdCoordinadorNavigation != null && group.IdCoordinadorNavigation.IdSigafi.Trim() == username) ||
                                                    await _db.InvGruposMiembros.AnyAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == user.IdUsuario && (m.Activo != false || m.Activo == null));
                                if (!isGroupMember)
                                {
                                    return StatusCode(403, new { message = "No tienes permisos para acceder a la retroalimentación de este grupo de investigación." });
                                }
                            }
                        }
                    }
                }

                var comments = await _db.InvCollaborationComments
                    .Where(c => c.DocumentoUuid == instanceUuid)
                    .OrderByDescending(c => c.CreadoEn)
                    .Take(50)
                    .ToListAsync();

                var statuses = await _db.InvDocumentosSeccionesMetadata
                    .Where(s => s.DocumentoUuid == instanceUuid)
                    .Select(s => new {
                        s.SeccionNombre,
                        s.Estado,
                        s.UltimoNombreUsuario,
                        s.UltimoUsuarioUuid,
                        s.ActualizadoEn
                    })
                    .ToListAsync();

                // Evitar errores de claves duplicadas si por alguna razón la BD tiene inconsistencias
                var statusesDict = statuses
                    .GroupBy(s => s.SeccionNombre)
                    .ToDictionary(g => g.Key, g => new {
                        estado = g.First().Estado,
                        ultimoNombreUsuario = g.First().UltimoNombreUsuario,
                        ultimoUsuarioUuid = g.First().UltimoUsuarioUuid,
                        actualizadoEn = g.First().ActualizadoEn
                    });

                // Cargar actividad reciente para esta instancia documental
                var pattern = instanceUuid + "%";
                var sesiones = await _db.InvCoworkSesiones.AsNoTracking()
                    .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern))
                    .OrderByDescending(s => s.ConectadoEn)
                    .Take(15)
                    .ToListAsync();

                var metaSecciones = await _db.InvDocumentosSeccionesMetadata
                    .AsNoTracking()
                    .Where(m => m.DocumentoUuid == instanceUuid)
                    .OrderByDescending(m => m.ActualizadoEn)
                    .Take(15)
                    .ToListAsync();

                var activitiesList = new List<CollaborationActivityItem>();

                foreach (var s in sesiones)
                {
                    var parts = s.DocumentoUuid.Split('_');
                    var sectionName = parts.Length > 1 ? parts[1] : "General";

                    activitiesList.Add(new CollaborationActivityItem
                    {
                        UserName = s.NombreUsuario,
                        Action = s.DesconectadoEn.HasValue
                            ? $"terminó sesión de edición ({(int)(s.DesconectadoEn.Value - s.ConectadoEn).TotalMinutes} min)"
                            : "inició sesión de edición",
                        SectionName = sectionName,
                        Timestamp = s.ConectadoEn
                    });
                }

                foreach (var sec in metaSecciones)
                {
                    activitiesList.Add(new CollaborationActivityItem
                    {
                        UserName = sec.UltimoNombreUsuario ?? "Sistema",
                        Action = $"marcó sección como {sec.Estado}",
                        SectionName = sec.SeccionNombre,
                        Timestamp = sec.ActualizadoEn
                    });
                }

                var orderedActivities = activitiesList
                    .OrderByDescending(a => a.Timestamp)
                    .Take(20)
                    .Select(a => new {
                        userName = a.UserName,
                        action = a.Action,
                        sectionName = a.SectionName,
                        timestamp = a.Timestamp
                    })
                    .ToList();

                return Ok(new { 
                    comments = comments, 
                    statuses = statusesDict,
                    activities = orderedActivities
                });
            }
            catch (System.Exception ex)
            {
                // Loguear el error para que sea visible en la consola del backend
                System.Console.WriteLine($"[DIITRA ERROR] Error en GetPulse para {instanceUuid}: {ex.Message}");
                return StatusCode(500, new { message = "Error interno al cargar el pulso de colaboración", detail = ex.Message });
            }
        }

        /// <summary>
        /// Publica un comentario en el hilo de colaboración / retroalimentación de un documento o grupo.
        /// </summary>
        [HttpPost("comments")]
        public async Task<IActionResult> PostComment([FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrEmpty(request.DocumentoUuid) || string.IsNullOrEmpty(request.Contenido))
                return BadRequest(new { message = "Faltan campos obligatorios." });

            try
            {
                var isAdmin = User.IsInRole("DIITRA_ADMIN") || User.FindFirst("es_admin")?.Value == "true";
                if (!isAdmin)
                {
                    var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value?.Trim();
                    if (!string.IsNullOrEmpty(username))
                    {
                        var user = await _db.Users.FirstOrDefaultAsync(u => u.IdSigafi.Trim() == username);
                        if (user != null)
                        {
                            var group = await _db.InvGruposInvestigacion
                                .Include(g => g.IdCoordinadorNavigation)
                                .FirstOrDefaultAsync(g => g.Uuid == request.DocumentoUuid);
                            if (group != null)
                            {
                                var isGroupMember = (group.IdCoordinador == user.IdUsuario) ||
                                                    (group.IdCoordinadorNavigation != null && group.IdCoordinadorNavigation.IdSigafi.Trim() == username) ||
                                                    await _db.InvGruposMiembros.AnyAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == user.IdUsuario && (m.Activo != false || m.Activo == null));
                                if (!isGroupMember)
                                {
                                    return StatusCode(403, new { message = "No tienes permisos para enviar retroalimentación a este grupo de investigación." });
                                }
                            }
                        }
                    }
                }

                var userUuid = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0";
                var userName = User.FindFirst("nombre")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Usuario";

                var comment = new InvCollaborationComment
                {
                    DocumentoUuid = request.DocumentoUuid,
                    UsuarioUuid = userUuid,
                    NombreUsuario = userName,
                    Contenido = request.Contenido,
                    IdPadre = request.IdPadre,
                    CreadoEn = System.DateTime.UtcNow
                };

                _db.InvCollaborationComments.Add(comment);
                await _db.SaveChangesAsync();

                // Retransmitir en tiempo real a todos los clientes del Hub de colaboración en el grupo correspondiente (normalizando el UUID a minúsculas)
                await _hubContext.Clients.Group(request.DocumentoUuid.ToLower().Trim()).SendAsync("NewCommentReceived", new
                {
                    idComentario = comment.IdComentario,
                    usuarioUuid = comment.UsuarioUuid,
                    nombreUsuario = comment.NombreUsuario,
                    contenido = comment.Contenido,
                    idPadre = comment.IdPadre,
                    creadoEn = comment.CreadoEn
                });

                return Ok(comment);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[DIITRA ERROR] Fallo al publicar comentario: {ex.Message}");
                return StatusCode(500, new { message = "Error interno al publicar comentario", detail = ex.Message });
            }
        }
    }

    public class CreateCommentRequest
    {
        public string DocumentoUuid { get; set; } = null!;
        public string Contenido { get; set; } = null!;
        public int? IdPadre { get; set; }
    }

    public class CollaborationActivityItem
    {
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string SectionName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
