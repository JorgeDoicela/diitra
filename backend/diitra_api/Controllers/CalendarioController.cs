using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly ICalendarioService _calendarioService;
    private readonly DiitraContext _context;

    public CalendarioController(ICalendarioService calendarioService, DiitraContext context)
    {
        _calendarioService = calendarioService;
        _context = context;
    }

    // ── GET /api/calendario/eventos?desde=2025-09-01&hasta=2025-09-30 ────────
    [HttpGet("eventos")]
    public async Task<IActionResult> GetEventos([FromQuery] DateOnly desde, [FromQuery] DateOnly hasta)
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var rol = User.FindFirst(ClaimTypes.Role)?.Value ?? "DIITRA_DOCENTE";
        var eventos = await _calendarioService.GetEventosAsync(desde, hasta, rol, dbUser.IdUsuario);
        return Ok(eventos);
    }

    // ── GET /api/calendario/feed ────────────────────────────────────────────
    // Endpoint público (no requiere JWT). Valida el token iCal interno.
    [HttpGet("feed")]
    [AllowAnonymous]
    public async Task<IActionResult> GetIcalFeed([FromQuery] string token)
    {
        var ics = await _calendarioService.GenerarIcalFeedAsync(token);
        if (ics == null) return Unauthorized(new { message = "Token iCal inválido o revocado." });
        
        Response.Headers.Append("Content-Disposition", "attachment; filename=\"calendario-institucional-diitra.ics\"");
        return Content(ics, "text/calendar; charset=utf-8");
    }

    // ── POST /api/calendario/ical/token ─────────────────────────────────────
    [HttpPost("ical/token")]
    public async Task<IActionResult> GenerarTokenIcal()
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var token = await _calendarioService.GenerarORegenerarTokenIcalAsync(dbUser.IdUsuario);
        var feedUrl = $"{Request.Scheme}://{Request.Host}/api/calendario/feed?token={token}";
        return Ok(new { token, feed_url = feedUrl });
    }

    // ── CRUD Eventos de Usuario (Tareas y Eventos personales/compartidos) ──
    
    // Crear un evento personal de usuario
    [HttpPost("usuario/eventos")]
    public async Task<IActionResult> CreateUsuarioEvento([FromBody] EventoNormativoDto dto)
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        // Forzar a que sea del usuario
        var usuarioDto = dto with { EsPrivado = dto.EsPrivado }; 

        var uuid = await _calendarioService.CreateNormativoAsync(usuarioDto, dbUser.IdUsuario);
        return Created("", new { uuid });
    }

    // Obtener las notas adhesivas sin programar del usuario
    [HttpGet("usuario/notas")]
    public async Task<IActionResult> GetStickyNotes()
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var notas = await _calendarioService.GetStickyNotesAsync(dbUser.IdUsuario);
        return Ok(notas);
    }

    // Actualizar un evento de usuario
    [HttpPut("usuario/eventos/{uuid}")]
    public async Task<IActionResult> UpdateUsuarioEvento(string uuid, [FromBody] EventoNormativoDto dto)
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var existing = await _context.Set<InvCalendarioEventoNormativo>().FirstOrDefaultAsync(e => e.Uuid == uuid);
        if (existing == null) return NotFound();

        // Solo el creador puede editar su evento personal
        if (existing.CreadoPor != dbUser.IdUsuario) return Forbid();

        var result = await _calendarioService.UpdateNormativoAsync(uuid, dto);
        if (!result) return NotFound();
        return Ok(new { message = "Evento de usuario actualizado." });
    }

    // Eliminar un evento de usuario
    [HttpDelete("usuario/eventos/{uuid}")]
    public async Task<IActionResult> DeleteUsuarioEvento(string uuid)
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var existing = await _context.Set<InvCalendarioEventoNormativo>().FirstOrDefaultAsync(e => e.Uuid == uuid);
        if (existing == null) return NotFound();

        // Solo el creador puede eliminar su evento personal
        if (existing.CreadoPor != dbUser.IdUsuario) return Forbid();

        var result = await _calendarioService.DeleteNormativoAsync(uuid);
        if (!result) return NotFound();
        return Ok(new { message = "Evento de usuario eliminado." });
    }

    // ── CRUD Normativos (Solo Administradores) ──────────────────────────────
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
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var uuid = await _calendarioService.CreateNormativoAsync(dto, dbUser.IdUsuario);
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
