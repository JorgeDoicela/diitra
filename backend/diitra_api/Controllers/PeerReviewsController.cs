using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using System.Security.Claims;
using diitra_infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PeerReviewsController : ControllerBase
{
    private readonly IPeerReviewService _peerReviewService;
    private readonly IFirmaElectronicaService _firmaService;
    private readonly IConfiguration _configuration;
    private readonly DiitraContext _context;

    public PeerReviewsController(
        IPeerReviewService peerReviewService,
        IFirmaElectronicaService firmaService,
        IConfiguration configuration,
        DiitraContext context)
    {
        _peerReviewService = peerReviewService;
        _firmaService = firmaService;
        _configuration = configuration;
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdStr = User.FindFirst("id_usuario")?.Value;
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
    /// Todas las revisiones (pendientes y completadas) del usuario autenticado (vista del revisor).
    /// </summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyReviews()
    {
        var userId = GetCurrentUserId();
        var result = await _peerReviewService.GetMyReviewsAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Carga la rúbrica dinámica de la convocatoria para una revisión específica.
    /// Anonimiza el protocolo si es modalidad doble ciego.
    /// </summary>
    [HttpGet("{revisionUuid}/rubrica")]
    public async Task<IActionResult> GetRubrica(string revisionUuid)
    {
        try
        {
            var userId = GetCurrentUserId();
            var revision = await _context.Set<InvRevisionesPares>().FirstOrDefaultAsync(r => r.Uuid == revisionUuid);
            if (revision == null) return NotFound(new { message = "Revisión no encontrada." });

            var user = await _context.Users.FindAsync(userId);
            bool isPrivileged = user != null && (user.Administrador || 
                                User.IsInRole("DIITRA_ADMIN"));

            if (revision.IdRevisor != userId && !isPrivileged)
            {
                return Forbid("No tienes permisos para visualizar esta rúbrica de evaluación.");
            }

            var rubrica = await _peerReviewService.GetRubricaForRevisionAsync(revisionUuid);
            if (rubrica == null) return NotFound(new { message = "Rúbrica no configurada." });
            return Ok(rubrica);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Enviar la evaluación completada de un árbitro.
    /// </summary>
    [HttpPost("evaluate")]
    public async Task<IActionResult> Evaluate([FromBody] EvaluationDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var revision = await _context.Set<InvRevisionesPares>().FirstOrDefaultAsync(r => r.Uuid == dto.RevisionUuid);
            if (revision == null) return NotFound(new { message = "Revisión no encontrada." });

            if (revision.IdRevisor != userId)
            {
                return Forbid("No tienes permisos para enviar esta evaluación.");
            }

            var result = await _peerReviewService.SubmitEvaluationAsync(dto);
            if (!result) return NotFound(new { message = "Revisión no encontrada." });
            return Ok(new { message = "Evaluación enviada con éxito." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  PANEL DEL DIRECTOR — GESTIÓN DE ARBITRAJE
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Vista global de todos los arbitrajes activos (para el Director de Investigación).
    /// </summary>
    [HttpGet("arbitraje")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetArbitrajesActivos()
    {
        var result = await _peerReviewService.GetArbitrajesActivosAsync();
        return Ok(result);
    }

    /// <summary>
    /// KPIs y estadísticas del módulo de arbitraje.
    /// </summary>
    [HttpGet("arbitraje/stats")]
    [Authorize(Roles = "DIITRA_ADMIN")]
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
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        bool isPrivileged = user != null && (user.Administrador || 
                            User.IsInRole("DIITRA_ADMIN"));

        // Buscar el proyecto para validar pertenencia o rol de revisor
        var proyecto = await _context.InvProyectos
            .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

        if (proyecto == null && int.TryParse(projectUuid, out var projectId))
        {
            proyecto = await _context.InvProyectos.FirstOrDefaultAsync(p => p.IdProyecto == projectId);
        }

        if (proyecto == null) return NotFound(new { message = "Proyecto no encontrado." });

        bool isMember = false;
        if (!isPrivileged)
        {
            isMember = await _context.Set<InvProyectoProfesor>().AnyAsync(pp => pp.IdProyecto == proyecto.IdProyecto && pp.IdUsuario == userId)
                    || await _context.Set<InvProyectoAlumno>().AnyAsync(pa => pa.IdProyecto == proyecto.IdProyecto && pa.IdUsuario == userId);
        }

        bool isReviewer = false;
        if (!isPrivileged && !isMember)
        {
            isReviewer = await _context.Set<InvRevisionesPares>().AnyAsync(r => r.IdProyecto == proyecto.IdProyecto && r.IdRevisor == userId);
        }

        if (!isPrivileged && !isMember && !isReviewer)
        {
            return Forbid("No tienes permisos para visualizar el arbitraje de este proyecto.");
        }

        if (int.TryParse(projectUuid, out var legacyId))
        {
            var legacyResult = await _peerReviewService.GetProjectReviewsAsync(legacyId);
            if (legacyResult == null) return NotFound(new { message = "Arbitraje no encontrado." });

            if (!isPrivileged)
            {
                foreach (var rev in legacyResult)
                {
                    if (rev.IdRevisor != userId)
                    {
                        rev.RevisorNombre = "Evaluador Anónimo";
                        rev.RevisorEspecialidad = null;
                        rev.RevisorGrado = null;
                        rev.RevisorCarrera = null;
                        rev.IdRevisor = 0;
                    }
                }
            }
            return Ok(legacyResult);
        }

        var result = await _peerReviewService.GetArbitrajeByProjectAsync(projectUuid);
        if (result == null) return NotFound(new { message = "Arbitraje no encontrado." });

        // Si no es un usuario privilegiado, anonimizar los datos del revisor para cumplir con el doble ciego
        if (!isPrivileged)
        {
            foreach (var rev in result.Revisiones)
            {
                if (rev.IdRevisor != userId)
                {
                    rev.RevisorNombre = "Evaluador Anónimo";
                    rev.RevisorEspecialidad = null;
                    rev.RevisorGrado = null;
                    rev.RevisorCarrera = null;
                    rev.IdRevisor = 0;
                }
            }
        }

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
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
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

    /// <summary>
    /// Inicia la fase de ejecución de un proyecto aprobado (Aprobado → En Ejecución).
    /// Habilita informes de avance y monitoreo operativo CACES.
    /// </summary>
    [HttpPost("project/{projectUuid}/iniciar-ejecucion")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> IniciarEjecucion(string projectUuid)
    {
        var directorId = GetCurrentUserId();
        try
        {
            await _peerReviewService.IniciarEjecucionAsync(projectUuid, directorId);
            return Ok(new { message = "Proyecto en fase de ejecución.", estado = "En Ejecución" });
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

    /// <summary>
    /// Descargar el Acta de Dictamen de Arbitraje en PDF (CACES).
    /// Genera un PDF con doble ciego y código de trazabilidad.
    /// Solo disponible después de ejecutar el cierre formal del arbitraje.
    /// Si el sistema tiene un certificado de firma configurado, el PDF se devuelve firmado digitalmente en formato PAdES.
    /// </summary>
    [HttpGet("project/{projectUuid}/dictamen-pdf")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> DescargarDictamenPdf(string projectUuid)
    {
        var directorId = GetCurrentUserId();
        try
        {
            var pdfBytes = await _peerReviewService.GenerateDictamenPdfAsync(projectUuid, directorId);

            // ── Firma PAdES con certificado institucional del sistema (si está configurado) ──
            // Configurar en appsettings.json bajo "Firma:SystemCertificateBase64" y "Firma:SystemPassword".
            var certBase64 = _configuration["Firma:SystemCertificateBase64"];
            var certPassword = _configuration["Firma:SystemPassword"];

            if (!string.IsNullOrEmpty(certBase64) && !string.IsNullOrEmpty(certPassword))
            {
                try
                {
                    var certBytes = Convert.FromBase64String(certBase64);
                    if (_firmaService.ValidateCertificate(certBytes, certPassword))
                    {
                        pdfBytes = _firmaService.SignPdf(
                            pdfBytes, certBytes, certPassword,
                            reason: $"Acta de Dictamen de Arbitraje CACES — DIITRA",
                            location: "Quito, Ecuador");
                    }
                }
                catch (Exception signEx)
                {
                    // La firma falló: se entrega el PDF sin firmar para no bloquear al Director
                    // El error se registra para que el administrador corrija el certificado.
                    Console.WriteLine($"[DIITRA] Advertencia: Firma PAdES no aplicada al dictamen. {signEx.Message}");
                }
            }

            // Calcular hash de integridad del PDF final (firmado o no)
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var hashHex = Convert.ToHexString(sha256.ComputeHash(pdfBytes)).ToLower();

            var fileName = $"DIITRA_DICTAMEN_ARBITRAJE_{projectUuid[..8].ToUpper()}_{DateTime.Now:yyyyMMdd}.pdf";
            Response.Headers.Append("X-Document-Hash", hashHex);
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            // Cierre aún no ejecutado
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al generar el PDF: {ex.Message}" });
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  GESTIÓN DE REVISORES EXTERNOS
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Registrar un nuevo árbitro externo (sin cuenta institucional).
    /// Cumple criterio CACES: participación de evaluadores externos a la institución.
    /// </summary>
    [HttpPost("revisores/externos")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> RegisterRevisorExterno([FromBody] RegistrarRevisorExternoDto dto)
    {
        var directorId = GetCurrentUserId();
        var uuid = await _peerReviewService.RegisterRevisorExternoAsync(dto, directorId);
        return Ok(new { uuid, message = "Revisor externo registrado correctamente." });
    }

    /// <summary>
    /// Listar todos los árbitros externos registrados en el sistema.
    /// </summary>
    [HttpGet("revisores/externos")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetRevisoresExternos()
    {
        var result = await _peerReviewService.GetRevisoresExternosAsync();
        return Ok(result);
    }

    /// <summary>
    /// Extender la fecha límite de una revisión manual.
    /// </summary>
    [HttpPut("{revisionUuid}/extender")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> ExtenderFechaLimite(string revisionUuid, [FromBody] ExtenderPlazoDto dto)
    {
        var directorId = GetCurrentUserId();
        if (dto.NuevaFecha <= DateTime.Now)
            return BadRequest(new { message = "La nueva fecha límite debe ser en el futuro." });

        var result = await _peerReviewService.ExtenderFechaLimiteAsync(revisionUuid, dto.NuevaFecha, directorId);
        if (!result) return NotFound(new { message = "Revisión no encontrada o ya completada." });
        return Ok(new { message = "Plazo de evaluación extendido correctamente." });
    }

    /// <summary>
    /// Actualiza las configuraciones de prórrogas de arbitraje de un proyecto.
    /// </summary>
    [HttpPut("project/{projectUuid}/settings")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> UpdateProjectSettings(string projectUuid, [FromBody] PeerReviewSettingsDto dto)
    {
        try
        {
            var result = await _peerReviewService.UpdateProjectSettingsAsync(projectUuid, dto);
            if (!result) return NotFound(new { message = "Proyecto no encontrado o no se pudo actualizar." });
            return Ok(new { message = "Configuración del proyecto actualizada correctamente." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al actualizar la configuración: {ex.Message}" });
        }
    }
}
