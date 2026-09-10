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

            var effectiveHtml = !string.IsNullOrWhiteSpace(fileHtml) && (string.IsNullOrWhiteSpace(template.HtmlContent) || template.HtmlContent.StartsWith("<!-- Cargado desde") || template.Version < 400)
                ? fileHtml
                : (!string.IsNullOrWhiteSpace(template.HtmlContent) ? template.HtmlContent : fileHtml);

            var effectiveCss = !string.IsNullOrWhiteSpace(fileCss) && string.IsNullOrWhiteSpace(template.CustomCss)
                ? fileCss
                : template.CustomCss;

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
                titulo = "[Es el título del proyecto; deben escribir un nombre claro, específico y relacionado con el problema o solución que se investiga.]",
                project_title = "[Es el título del proyecto; deben escribir un nombre claro, específico y relacionado con el problema o solución que se investiga.]",
                carrera = "[Indica la carrera(s) o área académica involucrada; deben escribir una o varias carreras relacionadas con el proyecto.]",
                periodo = "[Señala el periodo en que se presentó o aprobó el proyecto; deben escribir el periodo académico oficial.]",
                periodo_academico = "[Señala el periodo en que se presentó o aprobó el proyecto; deben escribir el periodo académico oficial.]",
                director_proyecto = "[Título abreviado, Apellidos y Nombres Completos]",
                coordinador_carrera = "[Título abreviado, Apellidos y Nombres Completos]",
                coordinador_investigacion = "[Título abreviado, Apellidos y Nombres Completos]",
                coordinador_innovacion = "[Título abreviado, Apellidos y Nombres Completos]",
                rector = "[Título abreviado, Apellidos y Nombres Completos]",
                fecha = "[día/mes/año]",
                fecha_emision = "[día/mes/año]",
                fecha_presentacion = "[día/mes/año]",
                fecha_inicio = "[día/mes/año]",
                fecha_fin = "[día/mes/año]",
                codigo = "INV-PROY-26.27-01",
                tipo_proyecto = "[Tipo de Proyecto]",
                linea_investigacion = "[Define el área general del conocimiento del proyecto; deben escribir una línea institucional vigente.]",
                area_conocimiento = "[Define el área general del conocimiento del proyecto; deben escribir una línea institucional vigente.]",
                sublinea_investigacion = "[Especifica el enfoque particular dentro de la línea; deben escribir la sublínea que se relacione directamente con el tema.]",
                convocatoria = "[Señala el periodo en que se presentó o aprobó el proyecto; deben escribir el periodo académico oficial.]",
                programa = "INV-PROY-26.27-01",
                grupo_investigacion = (string?)null,
                tipo_investigacion = string.Empty,
                tiempo_ejecucion = "[Indica la duración total del proyecto; deben escribir el número de meses o el rango de fechas.]",
                duracion_meses = "[Indica la duración total del proyecto; deben escribir el número de meses o el rango de fechas.]",
                meses_ejecucion = "[Indica la duración total del proyecto; deben escribir el número de meses o el rango de fechas.]",
                presupuesto_total = "[Presupuesto total estimado]",
                horas_semanales = "[Horas semanales]",
                horas_totales = "[Horas totales]",
                investigadores = new[]
                {
                    new
                    {
                        nombres = "[Nombres Completos]",
                        apellidos = "[Apellidos Completos]",
                        nombre_completo = "[Título abreviado, Apellidos y Nombres Completos]",
                        cedula = "[Número de Cédula]",
                        email = "[correo@institucional.edu.ec]",
                        telefono = "[Número de Teléfono]",
                        rol = "Director de Proyecto",
                        es_director = true,
                        carrera = "[Carrera]",
                        nivel_academico = "[Nivel Académico]",
                        grado_academico = "[Grado Académico]",
                        horas_semanales = "[Horas]",
                        tipo = "Docente Titular",
                        activo = true
                    }
                },
                antecedentes = "[Identificar y analizar estudios previos, datos relevantes y casos similares que evidencien la existencia y magnitud del problema abordado en el proyecto. Se debe incluir información contextual que respalde la necesidad de la propuesta, citando fuentes en formato APA 7ª edición. DETALLAR EN DOS PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO]",
                descripcion_proyecto = "[Definir el propósito del proyecto, detallando qué se pretende lograr y cuál es su impacto esperado. Además, delimitar el alcance, especificando los límites, las áreas involucradas y los aspectos que serán abordados dentro de la ejecución del proyecto. DETALLAR EN UN PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO]",
                justificacion = "[Especificar en DOS PÁRRAFOS DE 5 A 9 LÍNEAS, de manera fluida y coherente, lo siguiente:\n1. Importancia científica, tecnológica, educativa, cultural y social del proyecto.\n2. Relación con otros proyectos que se estén realizando o se hayan realizado en la unidad académica, en el Instituto, en la comunidad.\n3. Relación con otros proyectos que dirija o haya dirigido en que haya participado como investigador.\n4. Impacto en la docencia.\n5. Relación del proyecto con la carrera o carreras del Instituto.\n6. Infraestructura con la que cuenta la unidad académica para la ejecución (laboratorios, oficinas, equipos, etc.)]\nCITAR USANDO NORMAS APA 7MA EDICIÓN",
                objetivo_general = "• [Oraciones cortas, coherentes y concisas]\nVERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ? (+ PLAZO OPCIONAL)",
                objetivos_especificos = "• [Oraciones cortas, coherentes y concisas]\n• [Oraciones cortas, coherentes y concisas]\n• [Oraciones cortas, coherentes y concisas]\nINFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO (+ PLAZO OPCIONAL)",
                marco_teorico = "[Describir los conceptos clave, antecedentes y fundamentos teóricos que respaldan el proyecto, incluyendo referencias a estudios previos, normativas o metodologías relacionadas. EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS, CITAR USANDO NORMAS APA 7MA EDICIÓN]",
                metodologia = "[Describir el enfoque metodológico, las etapas del proyecto si este las tuviera, detalle de los procedimientos DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS, recursos y el tiempo estimado para alcanzar los objetivos DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS]",
                evaluacion = "[Describir los criterios e indicadores que se utilizarán para medir el cumplimiento de los objetivos, así como los métodos e instrumentos de evaluación. DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LINEAS, PARA PROFUNDIZAR LOS ASPECTOS RELACIONADOS CON INTRUMENTOS Y METODOLOGÍA]",
                bibliografia = "[El proyecto debe tener mínimo 10 y máximo 15 fuentes bibliográficas]",
                ods = new[] { "[Los objetivos de desarrollo sostenible son 17 el proyecto de investigación debe estar alineado a algunos de los objetivos. https://www.un.org/sustainabledevelopment/es/objetivos-de-desarrollo-sostenible/ El proyecto se encuentra alineado bajo los siguientes objetivos:]" },
                resultado_final = isArbitraje ? "[DICTAMEN FINAL]" : "[FAVORABLE / NO FAVORABLE]",
                dictamen = isArbitraje ? "[DICTAMEN DE ARBITRAJE]" : "[CUMPLE / NO CUMPLE]",
                promedio_criterios = "[0.00 / 100.00]",
                revisores = new[]
                {
                    new { nombre = "[Revisor Ciego Par #1]", calificacion = "[--/100]", recomendacion = "[Recomendación del evaluador]" }
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

    public class UpdateGlobalThemeRequest
    {
        [JsonPropertyName("themeConfigJson")]
        public string? ThemeConfigJson { get; set; }
    }

    public class UpdateTemplatesOrderRequest
    {
        [JsonPropertyName("codes")]
        public List<string> Codes { get; set; } = new();
    }
}
