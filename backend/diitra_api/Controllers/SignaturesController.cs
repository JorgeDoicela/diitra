using diitra_application.Signatures;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace diitra_api.Controllers;

/// <summary>
/// API REST del módulo DIITRA Firma.
/// Gestiona perfiles de firma de usuarios y la firma de documentos institucionales.
/// El controlador no accede a la base de datos directamente — delega todo al servicio.
/// </summary>
[ApiController]
[Route("api/signatures")]
public class SignaturesController : ControllerBase
{
    private readonly IDiitraSignatureService _signatureService;

    public SignaturesController(IDiitraSignatureService signatureService)
    {
        _signatureService = signatureService;
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
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
    /// El nombre y cédula del firmante se resuelven internamente desde el servicio.
    /// </summary>
    [HttpPost("sign")]
    [Authorize]
    public async Task<IActionResult> SignDocument([FromBody] SignDocumentDto dto)
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();

        var ip        = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();

        try
        {
            var result = await _signatureService.SignDocumentAsync(
                idUsuario: idUsuario,
                ipAddress: ip,
                userAgent: userAgent,
                dto:       dto);

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

    /// <summary>
    /// Firma un documento con Firma Digital Ecuador (.p12).
    /// </summary>
    [HttpPost("sign-p12")]
    [Consumes("multipart/form-data")]
    [Authorize]
    public async Task<IActionResult> SignDocumentWithP12(
        Microsoft.AspNetCore.Http.IFormFile? certificate,
        [FromForm] string? password,
        [FromForm] string documentoUuid,
        [FromForm] string? rolFirmante)
    {
        var idUsuario = GetCurrentUserId();
        if (idUsuario == 0) return Unauthorized();
        if (certificate == null || certificate.Length == 0)
        {
            return BadRequest(new { error = "Se requiere el archivo del certificado (.p12) de firma electrónica." });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();

        try
        {
            byte[] certificateBytes;
            using var ms = new System.IO.MemoryStream();
            await certificate.CopyToAsync(ms);
            certificateBytes = ms.ToArray();


            var result = await _signatureService.SignDocumentWithP12Async(
                idUsuario: idUsuario,
                ipAddress: ip,
                userAgent: userAgent,
                certificateBytes: certificateBytes,
                certificatePassword: password ?? "",
                documentoUuid: documentoUuid,
                rolFirmante: rolFirmante);

            return Ok(new
            {
                message = "Documento firmado digitalmente con éxito.",
                firmaCode = result.FirmaCode,
                docHash = result.DocHash,
                firmadoEn = result.FirmadoEn,
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
            return StatusCode(500, new { error = "Error interno al firmar el documento con certificado digital: " + ex.Message });
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
