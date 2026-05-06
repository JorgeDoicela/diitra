using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/documents/instances")]
    [Authorize]
    public class DocumentInstancesController : ControllerBase
    {
        private readonly IDocumentInstanceService _instanceService;

        public DocumentInstancesController(IDocumentInstanceService instanceService)
        {
            _instanceService = instanceService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInstanceRequest request, CancellationToken ct)
        {
            var userUuid = User.Identity?.Name ?? "anon";
            var instance = await _instanceService.CreateAsync(
                request.TemplateCode, 
                request.EntityUuid, 
                userUuid, 
                request.Title, 
                ct);

            return Ok(instance);
        }

        [HttpGet("{uuid}")]
        public async Task<IActionResult> Get(string uuid, CancellationToken ct)
        {
            var instance = await _instanceService.GetByUuidAsync(uuid, ct);
            if (instance == null) return NotFound();
            return Ok(instance);
        }

        /// <summary>
        /// Obtiene todos los documentos vinculados a una entidad (ej: a un proyecto específico).
        /// </summary>
        [HttpGet("entity/{entityUuid}")]
        public async Task<IActionResult> GetByEntity(string entityUuid, CancellationToken ct)
        {
            // Usamos el DbContext directamente para esta consulta rápida
            // En una refactorización mayor, esto iría al Service
            var instances = await _instanceService.GetByEntityAsync(entityUuid, ct);
            return Ok(instances);
        }

        [HttpPost("{uuid}/finalize")]
        public async Task<IActionResult> Finalize(string uuid, [FromBody] FinalizeRequest request, CancellationToken ct)
        {
            try
            {
                // Convertir Base64 a bytes (el frontend o el builder enviarán el PDF aquí)
                byte[] pdfBytes = string.IsNullOrEmpty(request.PdfBase64) 
                    ? System.Text.Encoding.UTF8.GetBytes("CONTENIDO_PDF_GENERADO_POR_BUILDER") 
                    : Convert.FromBase64String(request.PdfBase64);

                var instance = await _instanceService.FinalizeAsync(
                    uuid, 
                    pdfBytes,
                    $"{uuid}.pdf",
                    request.Hash, 
                    request.TraceabilityCode, 
                    ct);
                return Ok(instance);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public record CreateInstanceRequest(string TemplateCode, string EntityUuid, string? Title = null);
    public record FinalizeRequest(string? PdfBase64, string Hash, string TraceabilityCode);
}
