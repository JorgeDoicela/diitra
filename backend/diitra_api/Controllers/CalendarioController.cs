using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using diitra_application.Research;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly ICalendarioService _calendarioService;

    public CalendarioController(ICalendarioService calendarioService)
    {
        _calendarioService = calendarioService;
    }

    // ── GET /api/calendario/eventos?desde=2025-09-01&hasta=2025-09-30 ────────
    [HttpGet("eventos")]
    public async Task<IActionResult> GetEventos([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value ?? "DIITRA_DOCENTE";
        var eventos = await _calendarioService.GetEventosAsync(desde, hasta, rol);
        return Ok(eventos);
    }

    // ── GET /api/calendario/feed/{token}/calendario.ics ─────────────────────
    // Endpoint público (no requiere JWT). Valida el token iCal interno.
    [HttpGet("feed/{token}/calendario.ics")]
    [AllowAnonymous]
    public async Task<IActionResult> GetIcalFeed(string token)
    {
        var ics = await _calendarioService.GenerarIcalFeedAsync(token);
        if (ics == null) return Unauthorized(new { message = "Token iCal inválido o revocado." });
        return Content(ics, "text/calendar; charset=utf-8");
    }

    // ── POST /api/calendario/ical/token ─────────────────────────────────────
    [HttpPost("ical/token")]
    public async Task<IActionResult> GenerarTokenIcal()
    {
        var idUsuarioClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idUsuarioClaim, out var idUsuario))
            return Unauthorized();

        var token = await _calendarioService.GenerarORegenerarTokenIcalAsync(idUsuario);
        var feedUrl = $"{Request.Scheme}://{Request.Host}/api/calendario/feed/{token}/calendario.ics";
        return Ok(new { token, feed_url = feedUrl });
    }

    // ── GET /api/calendario/normativos ───────────────────────────────────────
    [HttpGet("normativos")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetNormativos()
    {
        var result = await _calendarioService.GetNormativosAsync();
        return Ok(result);
    }

    // ── POST /api/calendario/normativos ──────────────────────────────────────
    [HttpPost("normativos")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> CreateNormativo([FromBody] EventoNormativoDto dto)
    {
        var idUsuarioClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(idUsuarioClaim, out var idAdmin);
        var uuid = await _calendarioService.CreateNormativoAsync(dto, idAdmin);
        return CreatedAtAction(nameof(GetNormativos), new { }, new { uuid });
    }

    // ── PUT /api/calendario/normativos/{uuid} ────────────────────────────────
    [HttpPut("normativos/{uuid}")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> UpdateNormativo(string uuid, [FromBody] EventoNormativoDto dto)
    {
        var result = await _calendarioService.UpdateNormativoAsync(uuid, dto);
        if (!result) return NotFound();
        return Ok(new { message = "Hito normativo actualizado." });
    }

    // ── DELETE /api/calendario/normativos/{uuid} ─────────────────────────────
    [HttpDelete("normativos/{uuid}")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> DeleteNormativo(string uuid)
    {
        var result = await _calendarioService.DeleteNormativoAsync(uuid);
        if (!result) return NotFound();
        return Ok(new { message = "Hito normativo eliminado." });
    }
}
