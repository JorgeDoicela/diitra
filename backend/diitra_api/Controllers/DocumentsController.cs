using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace diitra_api.Controllers
{
    /// <summary>
    /// NÚCLEO DIITRA BUILDER - CONTROLADOR UNIVERSAL DE DOCUMENTACIÓN
    /// -------------------------------------------------------------------------
    /// ARQUITECTURA PROFESIONAL: Este controlador implementa el patrón "Agnostic Document Engine".
    /// No debe contener lógica de negocio específica de ninguna entidad (Proyectos, Actas, etc).
    /// 
    /// GUÍA PARA FUTUROS DOCUMENTOS:
    /// 1. Crear la plantilla HTML en BD (vía Seed o UI Administrativa).
    /// 2. Definir el DTO de datos en el Frontend.
    /// 3. Invocar este endpoint 'render' pasando el TemplateCode.
    /// 4. El motor Scriban inyectará las propiedades del JSON directamente en el HTML.
    /// </summary>
    [ApiController]
    [Route("api/documents")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(IDocumentEngine documentEngine, ILogger<DocumentsController> logger)
        {
            _documentEngine = documentEngine;
            _logger = logger;
        }

        /// <summary>
        /// RENDERIZADO UNIVERSAL (Punto de entrada único para digitalización masiva)
        /// -------------------------------------------------------------------------
        /// Recibe cualquier objeto JSON y lo plasma en el PDF oficial del ISTPET.
        /// Soporta: Modo Borrador (Marca de agua) y Modo Doble Ciego (Anonimización).
        /// </summary>
        [HttpPost("render")]
        public async Task<IActionResult> Render([FromBody] JsonElement rawData, [FromQuery] string templateCode, [FromQuery] bool isDraft = true, [FromQuery] bool isBlind = false)
        {
            try 
            {
                _logger.LogInformation("[DIITRA CORE] Solicitud de renderizado universal para plantilla: {Code}", templateCode);

                // IMPORTANTE: Scriban procesa mejor objetos anónimos o Dictionaries. 
                // JsonSerializer deserializa el rawText a una estructura dinámica compatible.
                var data = JsonSerializer.Deserialize<object>(rawData.GetRawText()) ?? new { };

                var request = new DocumentRequest
                {
                    TemplateCode = templateCode,
                    Data = data,
                    IsDraftMode = isDraft,
                    IsBlindMode = isBlind,
                    RequestedBy = User.Identity?.Name ?? "Sistema DIITRA (Universal Render)"
                };

                var result = await _documentEngine.GenerateAsync(request);

                return File(result.PdfBytes, "application/pdf", result.FileName);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "[DIITRA CORE] Error crítico en renderizado universal");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene la lista de plantillas disponibles en el catálogo institucional.
        /// </summary>
        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            var templates = await _documentEngine.GetAvailableTemplatesAsync();
            return Ok(templates);
        }
    }
}
