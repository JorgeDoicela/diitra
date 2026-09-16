using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using diitra_application.Feedback;
using diitra_application.Feedback.DTOs;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    /// <summary>
    /// Obtiene la configuración de soporte y límites de subida (WhatsApp y tamaños permitidos).
    /// </summary>
    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult GetConfig()
    {
        var config = _feedbackService.GetSupportConfig();
        return Ok(config);
    }

    /// <summary>
    /// Sirve los archivos multimedia adjuntos de los reportes de feedback.
    /// </summary>
    [HttpGet("attachments/{yearMonth}/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetAttachment(string yearMonth, string fileName)
    {
        var safeYearMonth = Path.GetFileName(yearMonth);
        var safeFileName = Path.GetFileName(fileName);

        var wwwrootBase = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "feedback", safeYearMonth, safeFileName);
        var currentDirBase = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "feedback", safeYearMonth, safeFileName);

        string finalPath;
        if (System.IO.File.Exists(wwwrootBase))
        {
            finalPath = wwwrootBase;
        }
        else if (System.IO.File.Exists(currentDirBase))
        {
            finalPath = currentDirBase;
        }
        else
        {
            return NotFound(new { message = "Archivo adjunto no encontrado." });
        }

        var ext = Path.GetExtension(safeFileName).ToLowerInvariant();
        var contentType = ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            _ => "application/octet-stream"
        };

        return PhysicalFile(Path.GetFullPath(finalPath), contentType, enableRangeProcessing: true);
    }

    /// <summary>
    /// Envía una nueva sugerencia, reporte de error o consulta con adjuntos multimedia opcionales.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(35 * 1024 * 1024)] // 35 MB máximo para el payload multipart completo
    public async Task<IActionResult> CreateFeedback([FromForm] CreateFeedbackApiRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || string.IsNullOrWhiteSpace(request.Descripcion))
        {
            return BadRequest(new { message = "El título y la descripción son obligatorios." });
        }

        int? idUsuario = null;
        if (int.TryParse(User.FindFirst("id_usuario")?.Value, out var parsedId))
        {
            idUsuario = parsedId;
        }

        var cedula = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var nombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value ?? "Usuario DIITRA";
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var rolPrincipal = roles.FirstOrDefault() ?? "USUARIO";

        var uploadedFiles = request.Archivos?.Select(f => new FeedbackUploadedFile
        {
            FileName = f.FileName,
            ContentType = f.ContentType,
            Length = f.Length,
            Stream = f.OpenReadStream()
        }).ToList();

        var dto = new CreateFeedbackDto
        {
            Tipo = request.Tipo,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            RutaOrigen = request.RutaOrigen,
            MetadataNavegador = request.MetadataNavegador,
            Archivos = uploadedFiles
        };

        try
        {
            var resultado = await _feedbackService.CreateFeedbackAsync(dto, idUsuario, cedula, nombre, rolPrincipal);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ocurrió un error al procesar el reporte de sugerencia.", detalle = ex.Message });
        }
    }

public class CreateFeedbackApiRequest
{
    public string Tipo { get; set; } = "SUGERENCIA";
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? RutaOrigen { get; set; }
    public string? MetadataNavegador { get; set; }
    public List<IFormFile>? Archivos { get; set; }
}

    /// <summary>
    /// Consulta los reportes y sugerencias registrados por el usuario autenticado.
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyFeedback()
    {
        int? idUsuario = null;
        if (int.TryParse(User.FindFirst("id_usuario")?.Value, out var parsedId))
        {
            idUsuario = parsedId;
        }

        var cedula = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var reportes = await _feedbackService.GetMyFeedbackAsync(idUsuario, cedula);
        return Ok(reportes);
    }

    /// <summary>
    /// Consulta todos los reportes y sugerencias recibidos (Exclusivo Super Administradores).
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllFeedback([FromQuery] string? tipo, [FromQuery] string? estado)
    {
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var isSuperAdmin = roles.Contains("DIITRA_SUPER_ADMIN") || User.FindFirst("es_super_admin")?.Value == "true" || User.FindFirst("es_superadmin")?.Value == "true";

        if (!isSuperAdmin)
        {
            return Forbid();
        }

        var reportes = await _feedbackService.GetAllFeedbackAsync(tipo, estado);
        return Ok(reportes);
    }

    /// <summary>
    /// Actualiza el estado y resolución de un reporte de sugerencia (Exclusivo Super Administradores).
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateFeedbackStatusDto dto)
    {
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var isSuperAdmin = roles.Contains("DIITRA_SUPER_ADMIN") || User.FindFirst("es_super_admin")?.Value == "true" || User.FindFirst("es_superadmin")?.Value == "true";

        if (!isSuperAdmin)
        {
            return Forbid();
        }

        var updated = await _feedbackService.UpdateStatusAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = "Reporte no encontrado." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Permite al usuario autor (o SuperAdmin) editar su reporte si aún está en espera.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateFeedback(int id, [FromBody] UpdateUserFeedbackDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Titulo) || string.IsNullOrWhiteSpace(dto.Descripcion))
        {
            return BadRequest(new { message = "El título y la descripción son obligatorios." });
        }

        int? idUsuario = null;
        if (int.TryParse(User.FindFirst("id_usuario")?.Value, out var parsedId))
        {
            idUsuario = parsedId;
        }

        var cedula = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var isSuperAdmin = roles.Contains("DIITRA_SUPER_ADMIN") || User.FindFirst("es_super_admin")?.Value == "true" || User.FindFirst("es_superadmin")?.Value == "true";

        try
        {
            var updated = await _feedbackService.UpdateUserFeedbackAsync(id, dto, idUsuario, cedula, isSuperAdmin);
            if (updated == null)
            {
                return NotFound(new { message = "Reporte no encontrado." });
            }
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al actualizar el reporte.", detalle = ex.Message });
        }
    }

    /// <summary>
    /// Permite al usuario autor (o SuperAdmin) eliminar su reporte si aún está en espera.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteFeedback(int id)
    {
        int? idUsuario = null;
        if (int.TryParse(User.FindFirst("id_usuario")?.Value, out var parsedId))
        {
            idUsuario = parsedId;
        }

        var cedula = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var isSuperAdmin = roles.Contains("DIITRA_SUPER_ADMIN") || User.FindFirst("es_super_admin")?.Value == "true" || User.FindFirst("es_superadmin")?.Value == "true";

        try
        {
            var deleted = await _feedbackService.DeleteFeedbackAsync(id, idUsuario, cedula, isSuperAdmin);
            if (!deleted)
            {
                return NotFound(new { message = "Reporte no encontrado." });
            }
            return Ok(new { message = "Reporte eliminado exitosamente." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al eliminar el reporte.", detalle = ex.Message });
        }
    }

    /// <summary>
    /// Agrega un mensaje o respuesta al hilo JSON de conversación del reporte de feedback.
    /// </summary>
    [HttpPost("{id}/messages")]
    [Authorize]
    public async Task<IActionResult> AddMessage(int id, [FromBody] CreateFeedbackMensajeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Mensaje))
        {
            return BadRequest(new { message = "El mensaje no puede estar vacío." });
        }

        int? idUsuario = null;
        if (int.TryParse(User.FindFirst("id_usuario")?.Value, out var parsedId))
        {
            idUsuario = parsedId;
        }

        var cedula = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var nombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value ?? "Usuario";
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).Union(User.FindAll("roles").Select(c => c.Value)).Distinct().ToList();
        var isSuperAdmin = roles.Contains("DIITRA_SUPER_ADMIN") || User.FindFirst("es_super_admin")?.Value == "true" || User.FindFirst("es_superadmin")?.Value == "true";
        var rolPrincipal = roles.FirstOrDefault() ?? (isSuperAdmin ? "DIITRA_SUPER_ADMIN" : "USUARIO");

        try
        {
            var updated = await _feedbackService.AddMessageAsync(id, dto, idUsuario, cedula, nombre, rolPrincipal, isSuperAdmin);
            if (updated == null)
            {
                return NotFound(new { message = "Reporte no encontrado." });
            }
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al enviar el mensaje.", detalle = ex.Message });
        }
    }
}
