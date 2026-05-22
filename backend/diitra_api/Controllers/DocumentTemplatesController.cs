using Diitra.Application.Common.Documents;
using Diitra.Infrastructure.Common.Documents;
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;
using Microsoft.AspNetCore.Mvc;

namespace diitra_api.Controllers
{
    /// <summary>
    /// Endpoints de administración del Motor de Documentos DIITRA.
    /// Permiten actualizar plantillas en base de datos sin recompilación.
    /// IMPORTANTE: Proteger con autorización de rol "Admin" en producción.
    /// </summary>
    [ApiController]
    [Route("api/admin/templates")]
    public class DocumentTemplatesController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;

        public DocumentTemplatesController(IDocumentEngine documentEngine)
        {
            _documentEngine = documentEngine;
        }

        /// <summary>
        /// Lista todas las plantillas activas registradas en el motor.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
            return Ok(templates.Select(t => new
            {
                t.Id,
                t.Code,
                t.Name,
                t.Description,
                t.Category,
                t.Version,
                t.IsActive,
                t.RequiresLopdpClause,
                t.SupportsBlindMode,
                t.UpdatedAt,
                t.UpdatedBy
            }));
        }

        /// <summary>
        /// Obtiene el detalle de una plantilla por su código único.
        /// </summary>
        [HttpGet("{code}")]
        public async Task<IActionResult> GetByCode(string code, CancellationToken ct)
        {
            var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
            var template = templates.FirstOrDefault(t => t.Code == code);

            if (template == null)
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });

            return Ok(new
            {
                template.Id,
                template.Code,
                template.Name,
                template.Description,
                template.Category,
                template.Version,
                template.IsActive,
                template.RequiresLopdpClause,
                template.SupportsBlindMode,
                template.CollaborativeFieldsJson,
                template.UpdatedAt
            });
        }

        /// <summary>
        /// Actualiza el HTML de una plantilla existente en base de datos.
        /// El cambio aplica inmediatamente en el siguiente documento generado.
        /// </summary>
        [HttpPut("{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] UpdateTemplateRequest request, CancellationToken ct)
        {
            try
            {
                var updatedBy = User.Identity?.Name ?? "admin";
                await _documentEngine.UpdateTemplateAsync(code, request.HtmlContent, request.CustomCss, updatedBy, ct);
                return Ok(new { message = $"Plantilla '{code}' actualizada correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });
            }
        }

        /// <summary>
        /// [DEPRECADO] Las plantillas ahora se cargan desde archivos .html físicos (TemplateFileLoader).
        /// Este endpoint se mantiene por compatibilidad hacia atrás.
        /// Para modificar el diseño edita: Templates/Investigacion/ProyectoInvestigacion.html
        /// </summary>
        [HttpPost("migrate-protocolo-investigacion")]
        public IActionResult MigrateProtocolo()
        {
            return Ok(new
            {
                message = "Las plantillas ahora se cargan automáticamente desde archivos .html físicos. No se requiere migración manual.",
                templateCode = ProyectoInvestigacionTemplate.CODE,
                htmlFile = "Templates/Investigacion/ProyectoInvestigacion.html",
                info = "Edita el archivo .html y genera el documento. El cambio aplica sin recompilar."
            });
        }

        /// <summary>
        /// [DEPRECADO] Las plantillas ahora se cargan desde archivos .html físicos (TemplateFileLoader).
        /// Para modificar el diseño edita: Templates/Investigacion/InformeFinal.html
        /// </summary>
        [HttpPost("migrate-informe-final")]
        public IActionResult MigrateInformeFinal()
        {
            return Ok(new
            {
                message = "Las plantillas ahora se cargan automáticamente desde archivos .html físicos. No se requiere migración manual.",
                templateCode = InformeFinalTemplate.CODE,
                htmlFile = "Templates/Investigacion/InformeFinal.html",
                info = "Edita el archivo .html y genera el documento. El cambio aplica sin recompilar."
            });
        }
    }

    public record UpdateTemplateRequest(string HtmlContent, string? CustomCss = null);
}
