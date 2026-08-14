using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Certificates;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/certificates")]
    public class CertificatesController : ControllerBase
    {
        private readonly ICertificateIssuanceService _certificateService;
        private readonly DiitraContext _db;

        public CertificatesController(ICertificateIssuanceService certificateService, DiitraContext db)
        {
            _certificateService = certificateService;
            _db = db;
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
            public required string UserCedula { get; set; }
            public required string RecipientRole { get; set; }
            public required string Title { get; set; }
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
                return BadRequest(new { error = "La cédula del destinatario es obligatoria." });
            }

            try
            {
                string issuedBy = User?.Identity?.Name ?? "ADMINISTRACION_DIITRA";
                var cert = await _certificateService.IssueIndividualCertificateAsync(
                    req.UserCedula,
                    req.RecipientRole,
                    req.Title,
                    req.Description ?? "",
                    req.TemplateCode ?? "CERTIFICADO_COMPLETACION",
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
            string userCedula = User?.Identity?.Name ?? "";
            var certs = await _certificateService.GetCertificatesForUserAsync(userCedula, ct);
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

            return BadRequest(new { error = "El archivo PDF del certificado no se encuentra disponible en disco." });
        }
    }
}
