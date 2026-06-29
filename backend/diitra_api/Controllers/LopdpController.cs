using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diBaseModels = diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/lopdp")]
[Authorize]
public class LopdpController : ControllerBase
{
    private readonly ILopdpService _lopdpService;
    private readonly diBaseModels.DiitraContext _context;

    public LopdpController(ILopdpService lopdpService, diBaseModels.DiitraContext context)
    {
        _lopdpService = lopdpService;
        _context = context;
    }

    /// <summary>
    /// Registra el consentimiento del usuario para una política de privacidad o firma digital.
    /// </summary>
    [HttpPost("consentimiento")]
    public async Task<IActionResult> RegistrarConsentimiento([FromBody] RegistrarConsentimientoRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.VersionPolitica))
        {
            return BadRequest(new { error = "La versión de la política es requerida." });
        }

        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();

        await _lopdpService.RegistrarConsentimientoAsync(dbUser.IdUsuario, request.VersionPolitica, ip, userAgent);

        return Ok(new { message = "Consentimiento registrado exitosamente." });
    }


    /// <summary>
    /// Devuelve todos los consentimientos registrados en el sistema (Solo para administradores/directores).
    /// </summary>
    [HttpGet("consentimientos")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetAllConsentimientos()
    {
        var consentimientos = await _lopdpService.GetAllConsentimientosAsync();
        return Ok(consentimientos);
    }

    /// <summary>
    /// Devuelve el perfil LOPDP del usuario autenticado (incluyendo metadatos científicos e información de consentimiento).
    /// </summary>
    [HttpGet("perfil")]
    public async Task<IActionResult> GetPerfil()
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var perfil = await _lopdpService.GetPerfilAsync(dbUser.IdUsuario);
        return Ok(perfil);
    }

    /// <summary>
    /// Actualiza la información de perfil científico LOPDP del usuario autenticado.
    /// </summary>
    [HttpPut("perfil")]
    public async Task<IActionResult> UpdatePerfil([FromBody] ActualizarPerfilRequest request)
    {
        if (request == null) return BadRequest("Datos nulos");

        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        await _lopdpService.UpdatePerfilAsync(dbUser.IdUsuario, request);
        return Ok(new { message = "Perfil actualizado exitosamente." });
    }

}

