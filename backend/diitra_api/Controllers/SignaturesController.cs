using diitra_application.Signatures;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace diitra_api.Controllers;

/// <summary>
/// API REST del módulo DIITRA Firma.
/// Gestiona perfiles de firma de usuarios y la firma de documentos institucionales.
/// </summary>
[ApiController]
[Route("api/signatures")]
public class SignaturesController : ControllerBase
{
    private readonly IDiitraSignatureService _signatureService;
    private readonly DiitraContext           _context;

    public SignaturesController(
        IDiitraSignatureService signatureService,
        DiitraContext           context)
    {
        _signatureService = signatureService;
        _context          = context;
    }

    // ── PERFIL ────────────────────────────────────────────────────────

    /// <summary>Obtiene el perfil de firma del usuario autenticado.</summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();

        var profile = await _signatureService.GetProfileAsync(idUsuario);

        // Si no tiene perfil aún, retornar un perfil vacío con EsConfigurado=false
        if (profile is null)
        {
            return Ok(new
            {
                idUsuario,
                esConfigurado  = false,
                firmaImagenB64 = (string?)null,
                iniciales      = (string?)null,
                cargo          = (string?)null,
                departamento   = (string?)null,
            });
        }

        return Ok(profile);
    }

    /// <summary>Crea o actualiza el perfil de firma del usuario autenticado.</summary>
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpsertProfile([FromBody] UpdateSignatureProfileDto dto)
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();

        try
        {
            var result = await _signatureService.UpsertProfileAsync(idUsuario, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── FIRMA ─────────────────────────────────────────────────────────

    /// <summary>
    /// Firma un documento con DIITRA Firma.
    /// Requiere re-autenticación (contraseña) para garantizar no repudio.
    /// Retorna el PDF firmado como descarga.
    /// </summary>
    [HttpPost("sign")]
    [Authorize]
    public async Task<IActionResult> SignDocument([FromBody] SignDocumentDto dto)
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
        if (user is null) return Unauthorized();

        var ip        = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();

        try
        {
            var result = await _signatureService.SignDocumentAsync(
                idUsuario:     idUsuario,
                nombreUsuario: user.Nombre ?? user.IdSigafi ?? "Usuario DIITRA",
                cedulaUsuario: user.IdSigafi,
                ipAddress:     ip,
                userAgent:     userAgent,
                dto:           dto);

            return Ok(new
            {
                message         = "Documento firmado exitosamente.",
                firmaCode       = result.FirmaCode,
                docHash         = result.DocHash,
                firmadoEn       = result.FirmadoEn,
                verificationUrl = result.VerificationUrl,
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Error interno al firmar el documento: " + ex.Message });
        }
    }

    // ── CONSULTAS ─────────────────────────────────────────────────────

    /// <summary>Lista todas las firmas DIITRA de un documento específico.</summary>
    [HttpGet("document/{documentUuid}")]
    [Authorize]
    public async Task<IActionResult> GetByDocument(string documentUuid)
    {
        var firmas = await _signatureService.GetByDocumentAsync(documentUuid);
        return Ok(firmas);
    }

    /// <summary>
    /// Verifica la autenticidad de una firma por su código público DFRM-xxxx.
    /// Endpoint PÚBLICO — no requiere autenticación (para QR en el PDF).
    /// </summary>
    [HttpGet("verify/{firmaCode}")]
    [AllowAnonymous]
    public async Task<IActionResult> Verify(string firmaCode)
    {
        if (string.IsNullOrWhiteSpace(firmaCode))
            return BadRequest(new { error = "Código de firma no válido." });

        var result = await _signatureService.VerifyAsync(firmaCode);
        return Ok(result);
    }

    // ── REVOCACIÓN ────────────────────────────────────────────────────

    /// <summary>Revoca una firma. Solo el firmante original o un administrador pueden hacerlo.</summary>
    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke([FromBody] RevokeSignatureDto dto)
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();

        // Verificar si es admin (puedes ajustar esto a tu lógica de roles)
        var esAdmin = User.IsInRole("Administrador") || User.HasClaim("permission", "admin.firma");

        try
        {
            var revocada = await _signatureService.RevokeAsync(idUsuario, dto, esAdmin);
            return revocada
                ? Ok(new { message = "Firma revocada correctamente." })
                : NotFound(new { error = "Firma no encontrada." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────────

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirst("id_usuario")?.Value;
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}
