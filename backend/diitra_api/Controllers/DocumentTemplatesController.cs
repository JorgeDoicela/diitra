using Diitra.Application.Common.Documents;
using Diitra.Infrastructure.Common.Documents;
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using diitra_infrastructure.Collaboration;
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
        private readonly IHubContext<CollaborationHub> _hubContext;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<DocumentTemplatesController> _logger;

        public DocumentTemplatesController(
            IDocumentEngine documentEngine, 
            DiitraContext db, 
            IHubContext<CollaborationHub> hubContext,
            IHostEnvironment environment,
            ILogger<DocumentTemplatesController> logger)
        {
            _documentEngine = documentEngine;
            _db = db;
            _hubContext = hubContext;
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Lista todas las plantillas activas registradas en el motor.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
            
            // Intentar cargar el orden personalizado guardado en BD
            List<string>? customOrder = null;
            try
            {
                var config = await _db.InvConfigsGenerales
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Clave == "Templates.OrderConfigJson", ct);

                if (config != null && !string.IsNullOrEmpty(config.Valor))
                {
                    customOrder = System.Text.Json.JsonSerializer.Deserialize<List<string>>(config.Valor);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error al leer Templates.OrderConfigJson: {ex.Message}");
            }

            var orderedTemplates = templates.ToList();
            if (customOrder != null && customOrder.Any())
            {
                orderedTemplates = templates
                    .OrderBy(t => {
                        var idx = customOrder.IndexOf(t.Code);
                        return idx >= 0 ? idx : int.MaxValue;
                    })
                    .ThenBy(t => t.Category)
                    .ToList();
            }

            return Ok(orderedTemplates.Select(t => new
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

            var fileLoader = new Diitra.Infrastructure.Common.Documents.Engine.TemplateFileLoader(_environment);
            var fileHtml = await fileLoader.LoadAsync(template.Code);
            var fileCss = await fileLoader.LoadCssAsync(template.Code);

            bool isDbCustomized = !string.IsNullOrWhiteSpace(template.HtmlContent) 
                && !template.HtmlContent.StartsWith("<!-- Cargado desde") 
                && (template.HtmlContent.Contains("<!-- DIITRA_SECTIONS_JSON:") || template.Version >= 400 || (!string.IsNullOrWhiteSpace(template.UpdatedBy) && template.UpdatedBy != "SEED"));

            var effectiveHtml = isDbCustomized
                ? template.HtmlContent
                : (!string.IsNullOrWhiteSpace(fileHtml) ? fileHtml : template.HtmlContent);

            var effectiveCss = !string.IsNullOrWhiteSpace(template.CustomCss)
                ? template.CustomCss
                : (!string.IsNullOrWhiteSpace(fileCss) ? fileCss : null);

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
                HtmlContent = effectiveHtml,
                CustomCss = effectiveCss,
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
                
                // Transmitir evento WebSocket en vivo a todos los usuarios y pestañas del sistema
                await _hubContext.Clients.All.SendAsync("TemplatePublished", new
                {
                    template_code = code,
                    templateCode = code,
                    updated_by = updatedBy,
                    timestamp = DateTime.UtcNow
                }, ct);

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
        /// Restablece una plantilla en la BD a sus archivos físicos oficiales (HTML y CSS).
        /// </summary>
        [HttpPost("{code}/reset-to-default")]
        public async Task<IActionResult> ResetToDefault(string code, CancellationToken ct)
        {
            try
            {
                var updatedBy = User.Identity?.Name ?? "admin";
                await _documentEngine.ResetTemplateToDefaultAsync(code, updatedBy, ct);
                return Ok(new { message = $"Plantilla '{code}' restablecida exitosamente a sus archivos por defecto de fábrica." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });
            }
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
        /// Obtiene el conteo de documentos activos asociados a una plantilla.
        /// </summary>
        [HttpGet("{code}/usage-count")]
        public async Task<IActionResult> GetUsageCount(string code, CancellationToken ct)
        {
            var count = await _db.DocumentInstances
                .CountAsync(i => i.TemplateCode == code && (int)i.State < 3, ct);
            return Ok(new { count });
        }

        /// <summary>
        /// Actualiza el orden de las plantillas en el catálogo.
        /// </summary>
        [HttpPut("order")]
        public async Task<IActionResult> UpdateOrder([FromBody] UpdateTemplatesOrderRequest request, CancellationToken ct)
        {
            if (request == null || request.Codes == null)
                return BadRequest(new { error = "El cuerpo de la solicitud no puede estar vacío." });

            var config = await _db.InvConfigsGenerales
                .FirstOrDefaultAsync(c => c.Clave == "Templates.OrderConfigJson", ct);

            var jsonValue = System.Text.Json.JsonSerializer.Serialize(request.Codes);

            if (config == null)
            {
                config = new InvConfigGeneral
                {
                    Clave = "Templates.OrderConfigJson",
                    Valor = jsonValue,
                    Descripcion = "Arreglo ordenado JSON con los códigos de las plantillas para visualización en el catálogo."
                };
                _db.InvConfigsGenerales.Add(config);
            }
            else
            {
                config.Valor = jsonValue;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Orden de plantillas guardado correctamente." });
        }

        /// <summary>
        /// Genera o previsualiza el PDF oficial de una plantilla con datos institucionales de muestra.
        /// Soporta visualización directa (inline) o descarga (attachment).
        /// </summary>
        [HttpGet("{code}/render-pdf")]
        public async Task<IActionResult> RenderPdf(
            string code, 
            [FromQuery] bool isDraft = false, 
            [FromQuery] bool download = false,
            CancellationToken ct = default)
        {
            try
            {
                var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
                var template = templates.FirstOrDefault(t => t.Code == code);
                if (template == null)
                    return NotFound(new { error = $"Plantilla '{code}' no encontrada." });

                var sampleData = CreateTemplateSampleData(code);
                var request = new DocumentRequest
                {
                    TemplateCode = code,
                    Data = sampleData,
                    IsDraftMode = isDraft,
                    RequestedBy = User.Identity?.Name ?? "Administrador DIITRA"
                };

                var result = await _documentEngine.GenerateAsync(request, ct);

                var baseTitle = !string.IsNullOrWhiteSpace(template.Name) ? template.Name : code;
                var safeName = SanitizeFileName($"{baseTitle}.pdf");

                if (download)
                {
                    return File(result.PdfBytes, "application/pdf", safeName);
                }

                Response.Headers[Microsoft.Net.Http.Headers.HeaderNames.ContentDisposition] = $"inline; filename=\"{safeName}\"";
                return File(result.PdfBytes, "application/pdf");
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al renderizar PDF de plantilla {Code}", code);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Renderiza un PDF en caliente a partir del HTML/bloques editados actualmente en el diseñador visual.
        /// Delega directamente a DocumentEngine para aplicar el pipeline institucional oficial completo (imágenes, sellos, CACES, fuentes).
        /// </summary>
        [HttpPost("{code}/render-pdf")]
        public async Task<IActionResult> RenderCustomPdf(
            string code,
            [FromBody] RenderTemplatePreviewRequest? previewRequest,
            [FromQuery] bool isDraft = false,
            [FromQuery] bool download = false,
            CancellationToken ct = default)
        {
            try
            {
                var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
                var template = templates.FirstOrDefault(t => t.Code == code);
                if (template == null)
                    return NotFound(new { error = $"Plantilla '{code}' no encontrada." });

                var sampleData = previewRequest?.SampleData ?? CreateTemplateSampleData(code);

                var request = new DocumentRequest
                {
                    TemplateCode = code,
                    Data = sampleData,
                    IsDraftMode = isDraft,
                    IsPreview = true,
                    CustomHtmlContent = previewRequest?.HtmlContent,
                    CustomCss = previewRequest?.CustomCss,
                    CustomThemeConfigJson = previewRequest?.ThemeConfigJson,
                    RequestedBy = User.Identity?.Name ?? "Administrador DIITRA"
                };

                var result = await _documentEngine.GenerateAsync(request, ct);

                var baseTitle = !string.IsNullOrWhiteSpace(template.Name) ? template.Name : code;
                var safeName = SanitizeFileName($"{baseTitle}.pdf");

                if (download)
                {
                    return File(result.PdfBytes, "application/pdf", safeName);
                }

                Response.Headers[Microsoft.Net.Http.Headers.HeaderNames.ContentDisposition] = $"inline; filename=\"{safeName}\"";
                return File(result.PdfBytes, "application/pdf");
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Plantilla '{code}' no encontrada." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al renderizar PDF en caliente de plantilla {Code}", code);
                return BadRequest(new { error = ex.Message });
            }
        }

        private static string SanitizeFileName(string name)
        {
            var invalids = System.IO.Path.GetInvalidFileNameChars();
            var sanitized = string.Join("_", name.Split(invalids, StringSplitOptions.RemoveEmptyEntries)).TrimEnd('.');
            
            // Normalizar a ASCII plano eliminando tildes y diacríticos para compatibilidad con cabeceras HTTP RFC
            var normalized = sanitized.Normalize(System.Text.NormalizationForm.FormD);
            var sb = new System.Text.StringBuilder();
            foreach (var c in normalized)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    if (c >= 32 && c <= 126 && c != '"' && c != '\\')
                        sb.Append(c);
                    else
                        sb.Append('_');
                }
            }
            var clean = sb.ToString();
            return clean.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) ? clean : $"{clean}.pdf";
        }

        private static object CreateTemplateSampleData(string code)
        {
            var isArbitraje = code.Contains("ARBITRAJE", StringComparison.OrdinalIgnoreCase) || code.Contains("DICTAMEN", StringComparison.OrdinalIgnoreCase);

            return new
            {
                titulo = (string?)null,
                project_title = (string?)null,
                carrera = (string?)null,
                periodo = "Abril 2026 – Septiembre 2026",
                periodo_academico = "Abril 2026 – Septiembre 2026",
                director_proyecto = "Ing. Docente Investigador, Mgtr.",
                coordinador_carrera = "Ing. Coordinador de Carrera, Mgtr.",
                coordinador_investigacion = "Ing. Estefani Sánchez Mgtr.",
                coordinador_innovacion = "Ing. Estefani Sánchez Mgtr.",
                rector = "Msc. Rector Institucional",
                fecha = DateTime.Now.ToString("dd/MM/yyyy"),
                fecha_emision = DateTime.Now.ToString("dd/MM/yyyy"),
                fecha_presentacion = DateTime.Now.ToString("dd/MM/yyyy"),
                fecha_inicio = "01/04/2026",
                fecha_fin = "30/09/2026",
                codigo = "INV-PROY-26.27-01",
                tipo_proyecto = "Investigación Aplicada",
                linea_investigacion = "Innovación Tecnológica y Desarrollo de Software",
                area_conocimiento = "Tecnologías de la Información y Comunicación",
                sublinea_investigacion = "Sistemas Inteligentes y Automatización",
                convocatoria = "Convocatoria Ordinaria I+D+i 2026",
                programa = "INV-PROY-26.27-01",
                grupo_investigacion = (string?)null,
                tipo_investigacion = "APLICADA",
                tiempo_ejecucion = "6 meses",
                duracion_meses = "6 meses",
                meses_ejecucion = "6 meses",
                presupuesto_total = "$ 5,000.00",
                horas_semanales = "10",
                horas_totales = "240",
                investigadores = new[]
                {
                    new
                    {
                        nombres = "Juan Carlos",
                        apellidos = "Pérez Gómez",
                        nombre_completo = "Ing. Juan Carlos Pérez Gómez, Mgtr.",
                        cedula = "1712345678",
                        email = "docente.investigador@istpet.edu.ec",
                        telefono = "0991234567",
                        rol = "Director de Proyecto",
                        es_director = true,
                        carrera = "Desarrollo de Software",
                        nivel_academico = "Magíster",
                        grado_academico = "Cuarto Nivel",
                        horas_semanales = "10",
                        tipo = "Docente Titular",
                        activo = true
                    }
                },
                antecedentes = "El presente proyecto surge ante la necesidad de optimizar los procesos de investigación y gestión institucional mediante el desarrollo de tecnologías aplicadas, identificando oportunidades de mejora en la sistematización de datos académicos.",
                descripcion_proyecto = "Este proyecto de investigación aplicada tiene como propósito implementar un sistema integral de trazabilidad y gestión, delimitando su alcance a los procesos internos de acreditación institucional y articulación con la docencia.",
                justificacion = "El desarrollo de esta investigación es de vital relevancia académica e institucional para el ISTPET, fortaleciendo la calidad de los programas académicos y promoviendo la transferencia tecnológica hacia la comunidad educativa.",
                objetivo_general = "Desarrollar e implementar un sistema tecnológico institucional para optimizar la gestión y trazabilidad de los proyectos de investigación formativa y aplicada.",
                objetivos_especificos = "• Realizar el levantamiento de requerimientos técnicos y metodológicos institucionales.\n• Diseñar la arquitectura de software y el modelo relacional de datos.\n• Validar el funcionamiento del sistema en un entorno de producción controlado.",
                marco_teorico = "Los fundamentos conceptuales se sustentan en los estándares de calidad del CACES y las directrices metodológicas de gestión de la investigación en educación superior.",
                metodologia = "Se implementará una metodología ágil y de investigación aplicada con entregables incrementales por fases, combinando análisis documental y desarrollo iterativo.",
                evaluacion = "La evaluación se medirá a través de indicadores de cumplimiento técnico, adopción institucional y rigurosidad metodológica por cada hito planificado.",
                bibliografia = "1. Hernández Sampieri, R. (2014). Metodología de la investigación. McGraw-Hill.\n2. Pressman, R. S. (2010). Software Engineering: A Practitioner's Approach. McGraw-Hill.",
                ods = new[] { "Educación de Calidad", "Industria, Innovación e Infraestructura" },
                resultado_final = isArbitraje ? "DICTAMEN FAVORABLE" : "FAVORABLE",
                dictamen = isArbitraje ? "APROBADO" : "CUMPLE",
                promedio_criterios = "92.50 / 100.00",
                revisores = new[]
                {
                    new { nombre = "Dr. Evaluador Par Ciego #1", calificacion = "92/100", recomendacion = "Aprobado sin observaciones mayores." }
                }
            };
        }
    }

    public class RenderTemplatePreviewRequest
    {
        [JsonPropertyName("htmlContent")]
        public string? HtmlContent { get; set; }

        [JsonPropertyName("customCss")]
        public string? CustomCss { get; set; }

        [JsonPropertyName("themeConfigJson")]
        public string? ThemeConfigJson { get; set; }

        [JsonPropertyName("sampleData")]
        public object? SampleData { get; set; }
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

    public class UpdateTemplatesOrderRequest
    {
        [JsonPropertyName("codes")]
        public List<string> Codes { get; set; } = new();
    }
}
