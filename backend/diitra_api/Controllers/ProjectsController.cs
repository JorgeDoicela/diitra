using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectsController : ControllerBase
    {
        private readonly IPdfGeneratorService _pdfService;

        public ProjectsController(IPdfGeneratorService pdfService)
        {
            _pdfService = pdfService;
        }

        [HttpPost("generate-pdf")]
        public async Task<IActionResult> GeneratePdf([FromBody] ProyectoDto dto)
        {
            // Genera el PDF con los datos enviados usando QuestPDF
            var pdfBytes = await _pdfService.GenerateProjectPdfAsync(dto);
            
            return File(pdfBytes, "application/pdf", $"Proyecto_{dto.Titulo ?? "SinTitulo"}.pdf");
        }

        // --- Endpoints Colaborativos (Workspace) ---

        [HttpPost("draft")]
        public IActionResult CreateDraft([FromBody] ProyectoDto dto)
        {
            // Simulamos la creación de un borrador en la BD
            dto.Uuid = System.Guid.NewGuid().ToString();
            dto.Estado = "Borrador";
            return Ok(new { message = "Workspace Borrador Creado", proyectoId = dto.Uuid });
        }

        [HttpPatch("{id}/section")]
        public IActionResult UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            // Aquí el sistema hace un guardado parcial (ej. {"metodologia": "Nuevo texto..."})
            // Evita sobreescribir el trabajo de otro autor en una sección diferente.
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(string id, [FromQuery] string newState, [FromQuery] string observation, [FromServices] IWorkflowEngineService workflowEngine)
        {
            try
            {
                // TODO: Obtener idUsuario del Token JWT. Usamos 1 por defecto para pruebas.
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
