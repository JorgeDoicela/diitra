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
        /// Aplica la migración del formato oficial del Protocolo de Investigación
        /// (9 secciones SENESCYT/ISTPET) al motor de documentos.
        /// Reemplaza la plantilla base del seed con el formato completo y fiel.
        /// </summary>
        [HttpPost("migrate-protocolo-investigacion")]
        public async Task<IActionResult> MigrateProtocolo(CancellationToken ct)
        {
            try
            {
                var html = ProyectoInvestigacionTemplate.GetHtml();
                var updatedBy = User.Identity?.Name ?? "migration-script";

                await _documentEngine.UpdateTemplateAsync(
                    ProyectoInvestigacionTemplate.CODE,
                    html,
                    customCss: null,
                    updatedBy,
                    ct);

                return Ok(new
                {
                    message = "Plantilla 'PROTOCOLO_INVESTIGACION' migrada exitosamente al formato oficial SENESCYT/ISTPET.",
                    templateCode = ProyectoInvestigacionTemplate.CODE,
                    sections = new[]
                    {
                        "1. Identificación del Proyecto",
                        "2. Investigadores",
                        "3. Especificación (Antecedentes, Descripción, Justificación, Objetivos, ODS, Marco Teórico, Metodología, Evaluación)",
                        "4. Recursos, Costo y Financiamiento",
                        "5. Productos Esperados",
                        "6. Impacto del Proyecto",
                        "7. Cronograma de Actividades (Gantt 6 meses)",
                        "8. Bibliografía (APA 7ª edición)",
                        "9. Firmas de Responsabilidad"
                    }
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "La plantilla 'PROTOCOLO_INVESTIGACION' no existe en BD. Ejecute primero el seed." });
            }
        }

        [HttpPost("migrate-informe-final")]
        public async Task<IActionResult> MigrateInformeFinal(CancellationToken ct)
        {
            try
            {
                var html = InformeFinalTemplate.GetHtml();
                var updatedBy = User.Identity?.Name ?? "migration-script";

                await _documentEngine.UpdateTemplateAsync(
                    InformeFinalTemplate.CODE,
                    html,
                    customCss: null,
                    updatedBy,
                    ct);

                return Ok(new
                {
                    message = "Plantilla 'INFORME_FINAL_INVESTIGACION' migrada exitosamente al formato oficial CACES 2026.",
                    templateCode = InformeFinalTemplate.CODE,
                    sections = new[]
                    {
                        "Resumen Ejecutivo",
                        "Cumplimiento de Objetivos",
                        "Resultados Obtenidos",
                        "Discusión de Hallazgos",
                        "Impacto Final",
                        "Transferencia de Conocimiento",
                        "Conclusiones y Recomendaciones",
                        "Bibliografía Final"
                    }
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "La plantilla 'INFORME_FINAL_INVESTIGACION' no existe en BD. Ejecute primero el seed." });
            }
        }
    }

    public record UpdateTemplateRequest(string HtmlContent, string? CustomCss = null);
}
