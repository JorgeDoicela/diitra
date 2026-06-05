using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
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
    /// Registra una solicitud de derechos ARCO por parte del titular con evidencia adjunta.
    /// </summary>
    [HttpPost("arco")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RegistrarSolicitudArco(
        [FromForm] string tipoSolicitud,
        [FromForm] string detalleSolicitud,
        Microsoft.AspNetCore.Http.IFormFile? file,
        [FromServices] Diitra.Infrastructure.Common.Storage.IFileStorageService storageService)
    {
        if (string.IsNullOrWhiteSpace(tipoSolicitud) || string.IsNullOrWhiteSpace(detalleSolicitud))
        {
            return BadRequest(new { error = "El tipo y detalle de la solicitud son obligatorios." });
        }

        // Validar tipo de solicitud ARCO
        var tiposValidos = new List<string> { "Acceso", "Rectificacion", "Eliminacion", "Oposicion", "Portabilidad", "Limitacion" };
        if (!tiposValidos.Contains(tipoSolicitud))
        {
            return BadRequest(new { error = $"Tipo de solicitud no válido. Debe ser uno de: {string.Join(", ", tiposValidos)}" });
        }

        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        string? fileRelativePath = null;
        if (file != null && file.Length > 0)
        {
            byte[] fileBytes;
            using (var ms = new System.IO.MemoryStream())
            {
                await file.CopyToAsync(ms);
                fileBytes = ms.ToArray();
            }
            fileRelativePath = await storageService.SaveFileAsync(file.FileName, fileBytes, "arco_evidence");
        }

        await _lopdpService.RegistrarSolicitudArcoAsync(dbUser.IdUsuario, tipoSolicitud, detalleSolicitud, fileRelativePath);

        return Ok(new { message = "Solicitud ARCO registrada exitosamente. Se responderá en un plazo máximo de 15 días laborables." });
    }

    /// <summary>
    /// Permite a un administrador resolver una solicitud de derechos ARCO pendiente.
    /// </summary>
    [HttpPost("arco/resolver")]
    [Authorize(Roles = "DIITRA_ADMIN,ADMIN_SISTEMA,DIRECTOR_INV")]
    public async Task<IActionResult> ResolverSolicitudArco([FromBody] ResolverSolicitudArcoRequest request)
    {
        if (request == null || request.IdSolicitudArco <= 0 || string.IsNullOrWhiteSpace(request.ResolucionDetalle) || string.IsNullOrWhiteSpace(request.Estado))
        {
            return BadRequest(new { error = "Datos de resolución incompletos." });
        }

        var estadosValidos = new List<string> { "Aprobado", "Rechazado", "En_Analisis" };
        if (!estadosValidos.Contains(request.Estado))
        {
            return BadRequest(new { error = $"Estado no válido. Debe ser uno de: {string.Join(", ", estadosValidos)}" });
        }

        try
        {
            await _lopdpService.ResolverSolicitudArcoAsync(request.IdSolicitudArco, request.ResolucionDetalle, request.Estado, request.DocumentoResolucionPath);
            return Ok(new { message = "Solicitud ARCO resuelta y actualizada exitosamente." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Ocurrió un error al procesar la resolución.", detalles = ex.Message });
        }
    }

    /// <summary>
    /// Devuelve el historial de solicitudes ARCO presentadas por el usuario autenticado.
    /// </summary>
    [HttpGet("arco/mis-solicitudes")]
    public async Task<IActionResult> GetMisSolicitudes()
    {
        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        var solicitudes = await _lopdpService.GetMisSolicitudesArcoAsync(dbUser.IdUsuario);
        return Ok(solicitudes);
    }

    /// <summary>
    /// Devuelve todas las solicitudes ARCO registradas en el sistema (Solo para administradores/directores).
    /// </summary>
    [HttpGet("arco/todas")]
    [Authorize(Roles = "DIITRA_ADMIN,ADMIN_SISTEMA,DIRECTOR_INV")]
    public async Task<IActionResult> GetAllSolicitudes()
    {
        var solicitudes = await _lopdpService.GetAllSolicitudesArcoAsync();
        return Ok(solicitudes);
    }

    /// <summary>
    /// Devuelve todos los consentimientos registrados en el sistema (Solo para administradores/directores).
    /// </summary>
    [HttpGet("consentimientos")]
    [Authorize(Roles = "DIITRA_ADMIN,ADMIN_SISTEMA,DIRECTOR_INV")]
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

    /// <summary>
    /// Sube y configura el certificado de firma electrónica (.p12) del usuario con su contraseña cifrada.
    /// </summary>
    [HttpPost("perfil/firma")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ConfigurarFirma(
        Microsoft.AspNetCore.Http.IFormFile file,
        [FromForm] string? password,
        [FromServices] diitra_infrastructure.Security.IFirmaElectronicaService firmaService,
        [FromServices] Microsoft.Extensions.Configuration.IConfiguration configuration,
        [FromServices] IWebHostEnvironment env)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "Debe adjuntar un archivo de firma." });
        }

        var skipCertificateValidation = env.IsDevelopment()
            || configuration.GetValue<bool>("Firma:SkipCertificateValidation");

        if (!skipCertificateValidation && string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { error = "La contraseña del certificado es requerida." });
        }

        var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
        if (dbUser == null) return Unauthorized();

        // 1. Validar el certificado (omitido en modo pruebas/desarrollo)
        byte[] certificateBytes;
        using (var ms = new System.IO.MemoryStream())
        {
            await file.CopyToAsync(ms);
            certificateBytes = ms.ToArray();
        }

        password ??= string.Empty;

        if (!skipCertificateValidation && !firmaService.ValidateCertificate(certificateBytes, password))
        {
            return BadRequest(new { error = "La contraseña del certificado no es válida o el archivo .p12 está corrupto." });
        }

        // 2. Guardar el archivo en el servidor
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "signatures");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".p12";
        }

        var fileName = $"user_sig_{dbUser.IdUsuario}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);
        await System.IO.File.WriteAllBytesAsync(filePath, certificateBytes);

        // 3. Cifrar la contraseña
        var encryptionKey = configuration["Security:EncryptionKey"] ?? "DIITRA_SECURE_AES256_KEY_FOR_P12_PASSWORDS_2026!";
        var encryptedPassword = diitra_infrastructure.Security.CryptoHelper.Encrypt(password, encryptionKey);

        // 4. Guardar en base de datos
        await _lopdpService.GuardarFirmaElectronicaAsync(dbUser.IdUsuario, filePath, encryptedPassword);

        // 5. Auditoría de datos sensibles
        var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();
        await _lopdpService.AuditoriaAccesoDatosAsync(
            dbUser.IdUsuario,
            dbUser.IdUsuario,
            "inv_usuarios_metadata",
            "p12PasswordEncrypted",
            "ESCRITURA",
            "Subida y configuración de certificado digital de firma electrónica con cifrado simétrico",
            ip,
            userAgent);

        var message = skipCertificateValidation
            ? "Firma configurada en modo pruebas (validación de certificado omitida)."
            : "Firma electrónica configurada y contraseña cifrada exitosamente.";

        return Ok(new { message });
    }
}

