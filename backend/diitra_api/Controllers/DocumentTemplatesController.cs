using Diitra.Application.Common.Documents;
using Diitra.Infrastructure.Common.Documents;
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

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
        private readonly DiitraContext _db;

        public DocumentTemplatesController(IDocumentEngine documentEngine, DiitraContext db)
        {
            _documentEngine = documentEngine;
            _db = db;
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
                RequiresElectronicSignature = t.RequiresElectronicSignature,
                SignatureType = t.SignatureType,
                t.ThemeConfigJson,
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
                RequiresElectronicSignature = template.RequiresElectronicSignature,
                SignatureType = template.SignatureType,
                template.CollaborativeFieldsJson,
                template.ThemeConfigJson,
                HtmlContent = template.HtmlContent,
                CustomCss = template.CustomCss,
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
                await _documentEngine.UpdateTemplateAsync(code, request.HtmlContent, request.CustomCss, request.CollaborativeFieldsJson, request.ThemeConfigJson, updatedBy, ct);
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

        /// <summary>
        /// Actualiza la configuración de firmas de una plantilla.
        /// </summary>
        [HttpPut("{code}/signature-config")]
        public async Task<IActionResult> UpdateSignatureConfig(string code, [FromBody] UpdateSignatureConfigRequest request, CancellationToken ct)
        {
            try
            {
                var updatedBy = User.Identity?.Name ?? "admin";
                await _documentEngine.UpdateSignatureConfigAsync(code, request.RequiresSignature, request.SignatureType, updatedBy, ct);
                return Ok(new { message = $"Configuración de firmas para plantilla '{code}' actualizada correctamente." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });
            }
        }

        /// <summary>
        /// Obtiene el tema visual global de la institución.
        /// </summary>
        [HttpGet("global-theme")]
        public async Task<IActionResult> GetGlobalTheme(CancellationToken ct)
        {
            var config = await _db.InvConfigsGenerales
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Clave == "Theme.GlobalConfigJson", ct);
                
            if (config == null || string.IsNullOrEmpty(config.Valor))
            {
                // Fallback por defecto institucional de Traversari
                var fallbackTheme = new
                {
                    colors = new
                    {
                        primary = "#222c57",
                        secondary = "#c4a857",
                        text = "#1a1a1a",
                        tableHeaderBg = "#222c57",
                        tableHeaderColor = "#ffffff",
                        accent = "#9ad3de"
                    },
                    typography = new
                    {
                        fontFamily = "'Calibri', 'Open Sans', Arial, sans-serif",
                        baseSize = "10pt",
                        lineHeight = "1.4"
                    },
                    layout = new
                    {
                        marginTop = "3cm",
                        marginBottom = "2cm",
                        marginLeft = "2cm",
                        marginRight = "2cm",
                        landscapeMarginTop = "1.8cm",
                        landscapeMarginLeft = "1.2cm"
                    },
                    brand = new
                    {
                        showCoverPage = true,
                        logoScale = "100%"
                    }
                };
                return Ok(new { themeConfigJson = System.Text.Json.JsonSerializer.Serialize(fallbackTheme) });
            }
            
            return Ok(new { themeConfigJson = config.Valor });
        }

        /// <summary>
        /// Actualiza el tema visual global de la institución.
        /// </summary>
        [HttpPut("global-theme")]
        public async Task<IActionResult> UpdateGlobalTheme([FromBody] UpdateGlobalThemeRequest request, CancellationToken ct)
        {
            var config = await _db.InvConfigsGenerales
                .FirstOrDefaultAsync(c => c.Clave == "Theme.GlobalConfigJson", ct);

            if (config == null)
            {
                config = new InvConfigGeneral
                {
                    Clave = "Theme.GlobalConfigJson",
                    Valor = request.ThemeConfigJson ?? string.Empty,
                    Descripcion = "Diseño y branding global institucional (colores, márgenes, tipografía)."
                };
                _db.InvConfigsGenerales.Add(config);
            }
            else
            {
                config.Valor = request.ThemeConfigJson ?? string.Empty;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Tema global institucional actualizado correctamente." });
        }
    }

    public class UpdateTemplateRequest
    {
        [JsonPropertyName("htmlContent")]
        public string HtmlContent { get; set; } = string.Empty;

        [JsonPropertyName("customCss")]
        public string? CustomCss { get; set; }

        [JsonPropertyName("collaborativeFieldsJson")]
        public string? CollaborativeFieldsJson { get; set; }

        [JsonPropertyName("themeConfigJson")]
        public string? ThemeConfigJson { get; set; }
    }

    public class UpdateSignatureConfigRequest
    {
        [JsonPropertyName("requiresSignature")]
        public bool RequiresSignature { get; set; }

        [JsonPropertyName("signatureType")]
        public string SignatureType { get; set; } = string.Empty;
    }

    public class UpdateGlobalThemeRequest
    {
        [JsonPropertyName("themeConfigJson")]
        public string? ThemeConfigJson { get; set; }
    }
}
