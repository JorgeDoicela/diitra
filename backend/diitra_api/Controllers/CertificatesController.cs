using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Certificates;
using Diitra.Application.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/certificates")]
    public class CertificatesController : ControllerBase
    {
        private readonly ICertificateIssuanceService _certificateService;
        private readonly IDocumentEngine _documentEngine;
        private readonly DiitraContext _db;
        private readonly ILogger<CertificatesController> _logger;

        public CertificatesController(
            ICertificateIssuanceService certificateService, 
            IDocumentEngine documentEngine,
            DiitraContext db,
            ILogger<CertificatesController> logger)
        {
            _certificateService = certificateService;
            _documentEngine = documentEngine;
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Emite certificados de completación desacoplados a todos los integrantes de un proyecto (estudiantes, docentes, director).
        /// </summary>
        [HttpPost("issue/project/{projectId:int}")]
        public async Task<IActionResult> IssueProjectCertificates(int projectId, CancellationToken ct)
        {
            try
            {
                string issuedBy = User?.Identity?.Name ?? "SISTEMA_DIITRA";
                var certificates = await _certificateService.IssueProjectCompletionCertificatesAsync(projectId, issuedBy, ct);
                return Ok(new
                {
                    message = "Certificados emitidos exitosamente para todos los integrantes del proyecto.",
                    count = (certificates as ICollection<IssuedCertificateResultDto>)?.Count ?? 0,
                    certificates
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error interno al emitir certificados de proyecto: {ex.Message}" });
            }
        }

        /// <summary>
        /// Emite certificados de reconocimiento a los miembros de un Grupo o Semillero de Investigación.
        /// </summary>
        [HttpPost("issue/group/{groupId:int}")]
        public async Task<IActionResult> IssueGroupCertificates(int groupId, [FromQuery] string milestoneTitle, CancellationToken ct)
        {
            try
            {
                string issuedBy = User?.Identity?.Name ?? "SISTEMA_DIITRA";
                var certificates = await _certificateService.IssueGroupMilestoneCertificatesAsync(
                    groupId,
                    string.IsNullOrWhiteSpace(milestoneTitle) ? "Reconocimiento de Trayectoria" : milestoneTitle,
                    issuedBy,
                    ct);

                return Ok(new
                {
                    message = "Certificados de grupo emitidos exitosamente.",
                    count = (certificates as ICollection<IssuedCertificateResultDto>)?.Count ?? 0,
                    certificates
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error interno al emitir certificados de grupo: {ex.Message}" });
            }
        }

        public class IndividualCertificateRequestDto
        {
            public string UserCedula { get; set; } = string.Empty;
            public string RecipientRole { get; set; } = "Participante";
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? TemplateCode { get; set; }
        }

        /// <summary>
        /// Emite un certificado individual a un estudiante, docente o director específico.
        /// </summary>
        [HttpPost("issue/individual")]
        public async Task<IActionResult> IssueIndividualCertificate([FromBody] IndividualCertificateRequestDto req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.UserCedula))
            {
                return BadRequest(new { error = "La cédula del destinatario es obligatoria (campo user_cedula)." });
            }

            try
            {
                string issuedBy = User?.Identity?.Name ?? "ADMINISTRACION_DIITRA";
                var cert = await _certificateService.IssueIndividualCertificateAsync(
                    req.UserCedula,
                    req.RecipientRole,
                    req.Title,
                    req.Description ?? "",
                    string.IsNullOrWhiteSpace(req.TemplateCode) ? "CERTIFICADO_COMPLETACION" : req.TemplateCode,
                    issuedBy,
                    ct);

                return Ok(cert);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error al emitir certificado individual: {ex.Message}" });
            }
        }

        /// <summary>
        /// Endpoint PÚBLICO de verificación legal de certificados por QR / UUID / TraceabilityCode.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("verify/{uuid}")]
        public async Task<IActionResult> VerifyCertificate(string uuid, CancellationToken ct)
        {
            var verification = await _certificateService.VerifyCertificateAsync(uuid, ct);
            if (verification == null || !verification.IsValid)
            {
                return NotFound(new
                {
                    isValid = false,
                    message = "El código o certificado escaneado no es válido o no existe en la base de datos de DIITRA."
                });
            }

            return Ok(verification);
        }

        /// <summary>
        /// Obtiene la lista de certificados del usuario autenticado.
        /// </summary>
        [HttpGet("my-certificates")]
        public async Task<IActionResult> GetMyCertificates(CancellationToken ct)
        {
            var idRef = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id_usuario")?.Value
                ?? User.Identity?.Name
                ?? "";

            var certs = await _certificateService.GetCertificatesForUserAsync(idRef, ct);
            return Ok(certs);
        }

        /// <summary>
        /// Descarga directa del PDF de un certificado emitido mediante su UUID.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("download/{uuid}")]
        public async Task<IActionResult> DownloadCertificatePdf(string uuid, CancellationToken ct)
        {
            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.TraceabilityCode == uuid || d.Uuid == uuid, ct);

            if (instance == null)
            {
                return NotFound(new { error = "El certificado solicitado no existe." });
            }

            if (!string.IsNullOrEmpty(instance.FinalPdfPath) && System.IO.File.Exists(instance.FinalPdfPath))
            {
                var bytes = await System.IO.File.ReadAllBytesAsync(instance.FinalPdfPath, ct);
                return File(bytes, "application/pdf", $"Certificado_DIITRA_{uuid[..Math.Min(6, uuid.Length)]}.pdf");
            }

            if (!string.IsNullOrEmpty(instance.DataSnapshotJson))
            {
                try
                {
                    var data = JsonSerializer.Deserialize<object>(instance.DataSnapshotJson) ?? new { };
                    var docReq = new Diitra.Application.Common.Documents.DocumentRequest
                    {
                        TemplateCode = instance.TemplateCode,
                        Data = data,
                        RequestedBy = instance.CreatedBy,
                        IsDraftMode = false
                    };
                    var docResult = await _documentEngine.GenerateAsync(docReq, ct);
                    return File(docResult.PdfBytes, "application/pdf", $"Certificado_DIITRA_{uuid[..Math.Min(6, uuid.Length)]}.pdf");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al generar PDF dinámico para certificado {Uuid}", uuid);
                }
            }

            return BadRequest(new { error = "El archivo PDF del certificado no se encuentra disponible." });
        }
    }
}
