using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Application.Common.Documents;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectsController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;

        public ProjectsController(IDocumentEngine documentEngine)
        {
            _documentEngine = documentEngine;
        }

        /// <summary>
        /// Genera el PDF del protocolo de investigación usando el motor Enterprise DIITRA.
        /// El template "PROTOCOLO_INVESTIGACION" vive en BD y puede editarse sin redespliegue.
        /// </summary>
        [HttpPost("generate-pdf")]
        public async Task<IActionResult> GeneratePdf(
            [FromBody] ProyectoDto dto, 
            [FromQuery] bool isDraft = true, 
            [FromQuery] bool isBlind = false)
        {
            var request = new DocumentRequest
            {
                TemplateCode = isBlind ? "PROTOCOLO_PEER_REVIEW" : "PROTOCOLO_INVESTIGACION",
                Data = dto,
                IsDraftMode = isDraft,
                IsBlindMode = isBlind,
                RequestedBy = User.Identity?.Name ?? "sistema",
                ProjectUuid = dto.Uuid,
                EntityUuid = dto.Uuid
            };

            var result = await _documentEngine.GenerateAsync(request);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        /// <summary>
        /// Genera el PDF del protocolo en modo Doble Ciego para Peer Review.
        /// Los datos de identidad son enmascarados automáticamente por el motor.
        /// </summary>
        [HttpPost("generate-pdf/blind-review")]
        public async Task<IActionResult> GeneratePdfBlindReview([FromBody] ProyectoDto dto)
        {
            var request = new DocumentRequest
            {
                TemplateCode = "PROTOCOLO_PEER_REVIEW",
                Data = dto,
                IsBlindMode = true,
                RequestedBy = User.Identity?.Name ?? "sistema"
            };

            var result = await _documentEngine.GenerateAsync(request);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        // --- Endpoints Colaborativos (Workspace) ---

        [HttpPost("draft")]
        public IActionResult CreateDraft([FromBody] ProyectoDto dto)
        {
            dto.Uuid = System.Guid.NewGuid().ToString();
            dto.Estado = "Borrador";
            return Ok(new { message = "Workspace Borrador Creado", proyectoId = dto.Uuid });
        }

        /// <summary>
        /// Simulación de firma electrónica PAdES usando el motor DIITRA.
        /// </summary>
        [HttpPost("sign")]
        public async Task<IActionResult> SignDocument(
            [FromQuery] string password, 
            [FromServices] diitra_infrastructure.Security.IFirmaElectronicaService firmaService)
        {
            // 1. Generar un PDF base para la prueba
            var request = new DocumentRequest { 
                TemplateCode = "PROTOCOLO_INVESTIGACION", 
                Data = new { Titulo = "Prueba de Firma Profesional" } 
            };
            var genResult = await _documentEngine.GenerateAsync(request);

            // 2. Firmar usando el servicio profesional
            // Nota: Usamos un certificado dummy o el del usuario si estuviera en BD
            byte[] dummyCert = new byte[10]; // Placeholder
            try 
            {
                var signedPdf = firmaService.SignPdf(genResult.PdfBytes, dummyCert, password);
                return File(signedPdf, "application/pdf", "DIITRA_Firmado.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = "Firma fallida: " + ex.Message });
            }
        }

        [HttpPatch("{id}/section")]
        public IActionResult UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(string id, [FromQuery] string newState, [FromQuery] string observation, [FromServices] IWorkflowEngineService workflowEngine)
        {
            try
            {
                int idUsuarioSimulado = 1;
                var success = await workflowEngine.TransicionarEstadoAsync(id, newState, idUsuarioSimulado, observation);
                if (!success) return NotFound("Proyecto no encontrado");
                return Ok(new { message = $"Proyecto transitado exitosamente a {newState}" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
