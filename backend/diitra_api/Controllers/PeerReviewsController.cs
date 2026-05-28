using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using System.Security.Claims;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PeerReviewsController : ControllerBase
{
    private readonly IPeerReviewService _peerReviewService;

    public PeerReviewsController(IPeerReviewService peerReviewService)
    {
        _peerReviewService = peerReviewService;
    }

    private int GetCurrentUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("No se pudo identificar al usuario.");
        return userId;
    }

    // ════════════════════════════════════════════════════════════════
    //  PORTAL DEL REVISOR
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Revisiones pendientes del usuario autenticado (vista del revisor).
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var userId = GetCurrentUserId();
        var result = await _peerReviewService.GetPendingReviewsAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Carga la rúbrica dinámica de la convocatoria para una revisión específica.
    /// Anonimiza el protocolo si es modalidad doble ciego.
    /// </summary>
    [HttpGet("{revisionUuid}/rubrica")]
    public async Task<IActionResult> GetRubrica(string revisionUuid)
    {
        var rubrica = await _peerReviewService.GetRubricaForRevisionAsync(revisionUuid);
        if (rubrica == null) return NotFound(new { message = "Revisión no encontrada o sin rúbrica configurada." });
        return Ok(rubrica);
    }

    /// <summary>
    /// Enviar la evaluación completada de un árbitro.
    /// </summary>
    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] EvaluationDto dto)
    {
        var result = await _peerReviewService.SubmitEvaluationAsync(dto);
        if (!result) return NotFound(new { message = "Revisión no encontrada." });
        return Ok(new { message = "Evaluación enviada con éxito." });
    }

    // ════════════════════════════════════════════════════════════════
    //  PANEL DEL DIRECTOR — GESTIÓN DE ARBITRAJE
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Vista global de todos los arbitrajes activos (para el Director de Investigación).
    /// </summary>
    [HttpGet("arbitraje")]
    public async Task<IActionResult> GetArbitrajesActivos()
    {
        var result = await _peerReviewService.GetArbitrajesActivosAsync();
        return Ok(result);
    }

    /// <summary>
    /// KPIs y estadísticas del módulo de arbitraje.
    /// </summary>
    [HttpGet("arbitraje/stats")]
    public async Task<IActionResult> GetArbitrajeStats()
    {
        var stats = await _peerReviewService.GetArbitrajeStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Vista de arbitraje detallada de un proyecto específico (árbitros, puntajes, estado).
    /// </summary>
    [HttpGet("project/{projectUuid}")]
    public async Task<IActionResult> GetByProject(string projectUuid)
    {
        // Compatibilidad: si es un número (ID legado), intentar búsqueda por ID
        if (int.TryParse(projectUuid, out var projectId))
        {
            var legacyResult = await _peerReviewService.GetProjectReviewsAsync(projectId);
            return Ok(legacyResult);
        }

        var result = await _peerReviewService.GetArbitrajeByProjectAsync(projectUuid);
        if (result == null) return NotFound(new { message = "Proyecto no encontrado." });
        return Ok(result);
    }

    // ════════════════════════════════════════════════════════════════
    //  GESTIÓN DE ÁRBITROS
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Buscar árbitros disponibles (internos o externos) para un proyecto.
    /// Excluye automáticamente a los autores del proyecto (blindaje doble ciego).
    /// </summary>
    [HttpGet("revisores/search")]
    public async Task<IActionResult> SearchRevisores(
        [FromQuery] string q = "",
        [FromQuery] bool soloExternos = false,
        [FromQuery] string? projectUuid = null)
    {
        var result = await _peerReviewService.SearchRevisoresAsync(q, soloExternos, projectUuid);
        return Ok(result);
    }

    /// <summary>
    /// Asignar un árbitro a un proyecto de investigación.
    /// </summary>
    [HttpPost("assign")]
    public async Task<IActionResult> Assign([FromBody] AsignarArbitroDto dto)
    {
        var directorId = GetCurrentUserId();
        var uuid = await _peerReviewService.AsignarArbitroAsync(dto, directorId);
        return Ok(new { uuid, message = "Árbitro asignado correctamente." });
    }

    /// <summary>
    /// Revocar la asignación de un árbitro (solo si aún no completó la evaluación).
    /// </summary>
    [HttpDelete("{revisionUuid}/revocar")]
    public async Task<IActionResult> RevocarAsignacion(string revisionUuid)
    {
        var directorId = GetCurrentUserId();
        var result = await _peerReviewService.RevocarAsignacionAsync(revisionUuid, directorId);
        if (!result) return BadRequest(new { message = "No se puede revocar: la evaluación ya fue completada o no existe." });
        return Ok(new { message = "Asignación revocada." });
    }

    // ════════════════════════════════════════════════════════════════
    //  CIERRE DE ARBITRAJE
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Cerrar el proceso de arbitraje de un proyecto y generar el dictamen final.
    /// Aplica la lógica normativa CACES: promedio ponderado, umbral de aprobación, detección de desempate.
    /// </summary>
    [HttpPost("project/{projectUuid}/cerrar")]
    public async Task<IActionResult> CerrarArbitraje(string projectUuid)
    {
        var directorId = GetCurrentUserId();
        try
        {
            var dictamen = await _peerReviewService.CerrarArbitrajeAsync(projectUuid, directorId);
            return Ok(dictamen);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
