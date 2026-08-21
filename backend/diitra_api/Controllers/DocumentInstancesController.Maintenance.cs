using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using System;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace diitra_api.Controllers
{
    public partial class DocumentInstancesController : ControllerBase
    {
        /// <summary>
        /// RETORNA LA CONFIGURACIÓN DINÁMICA DE LA INTERFAZ DE USUARIO (Metadata-Driven UI).
        /// Si la plantilla es una de las oficiales, retorna su estructura premium pre-mapeada.
        /// Si es una nueva plantilla creada por base de datos, auto-genera la UI en caliente
        /// basada en sus CollaborativeFieldsJson.
        /// </summary>
        [HttpGet("templates/{code}/ui-config")]
        public async Task<IActionResult> GetUiConfig(string code, CancellationToken ct)
        {
            var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
            var template = templates.FirstOrDefault(t => t.Code == code);

            if (template == null)
            {
                return NotFound(new { message = $"La plantilla '{code}' no está activa o no existe en la base de datos." });
            }

            var blocksJson = "";
            if (!string.IsNullOrEmpty(template.HtmlContent))
            {
                var match = System.Text.RegularExpressions.Regex.Match(template.HtmlContent, @"<!-- DIITRA_SECTIONS_JSON: (.*?) -->");
                if (match.Success && match.Groups.Count > 1)
                {
                    try
                    {
                        var base64 = match.Groups[1].Value;
                        var bytes = System.Convert.FromBase64String(base64);
                        blocksJson = System.Text.Encoding.UTF8.GetString(bytes);
                    }
                    catch { }
                }
            }

            if (!string.IsNullOrEmpty(blocksJson))
            {
                var result = await BuildUiConfigResponseAsync(blocksJson, template, null, ct);
                if (result != null) return result;
            }

            if (code == "OFICIO_APROBACION")
            {
                return Ok(new
                {
                    title = "Formato Oficio de Aprobación de Proyecto",
                    subtitle = "Oficio formal emitido por la Coordinación de Investigación para aprobación legal previa a ejecución",
                    signatureType = template.SignatureType,
                    schema = new Dictionary<string, object>
                    {
                        { "oficio_numero", "" },
                        { "oficio_fecha", "" },
                        { "director_titulo", "Tecnólogo/a" },
                        { "director_nombre", "" },
                        { "director_carrera", "" },
                        { "coordinador_nombre", "Ing. Estefani Sánchez Mgtr." }
                    },
                    lists = new string[] { },
                    sections = new[]
                    {
                        new
                        {
                            id = "oficio_aprobacion",
                            label = "Oficio de Aprobación",
                            iconName = "FileText",
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "oficio_numero", label = "Número de Oficio", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"01-ISTPET-INV-2026" },
                                    new { name = "oficio_fecha", label = "Fecha de Emisión", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"27 de marzo de 2026" },
                                    new { name = "director_nombre", label = "Director del Proyecto (Destinatario)", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Nombre del docente director" },
                                    new { name = "director_carrera", label = "Carrera del Director", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Tecnología Superior en..." },
                                    new { name = "coordinador_nombre", label = "Coordinador/a de Investigación (Firmante)", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Ing. Estefani Sánchez Mgtr." }
                                }
                            }
                        }
                    }
                });
            }

            return Ok(new { hasDynamicConfig = false, message = $"La plantilla '{code}' utiliza componentes de diseño nativos oficiales." });
        }
        /// <summary>
        /// RETORNA LA CONFIGURACIÓN DE LA INTERFAZ DE USUARIO BASADA EN EL SNAPSHOT DE LA INSTANCIA.
        /// Si la instancia posee un snapshot guardado, se utiliza para asegurar retrocompatibilidad.
        /// De lo contrario, cae en la configuración activa de la plantilla actual.
        /// </summary>
        [HttpGet("{uuid}/ui-config")]
        public async Task<IActionResult> GetInstanceUiConfig(string uuid, CancellationToken ct)
        {
            var instance = await _context.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Uuid == uuid, ct);

            if (instance == null)
            {
                return NotFound(new { message = $"No se encontró la instancia de documento '{uuid}'." });
            }

            var templates = await _documentEngine.GetAvailableTemplatesAsync(ct);
            var template = templates.FirstOrDefault(t => t.Code == instance.TemplateCode);
            if (template == null)
            {
                return NotFound(new { message = $"La plantilla '{instance.TemplateCode}' no está activa o no existe en la base de datos." });
            }

            // 1. Obtener la estructura de bloques más reciente desde la plantilla activa (HtmlContent Base64)
            var blocksJson = "";
            if (!string.IsNullOrEmpty(template.HtmlContent))
            {
                var match = System.Text.RegularExpressions.Regex.Match(template.HtmlContent, @"<!-- DIITRA_SECTIONS_JSON: (.*?) -->");
                if (match.Success && match.Groups.Count > 1)
                {
                    try
                    {
                        var base64 = match.Groups[1].Value;
                        var bytes = System.Convert.FromBase64String(base64);
                        blocksJson = System.Text.Encoding.UTF8.GetString(bytes);
                    }
                    catch { }
                }
            }

            // 2. Si la instancia está en borrador (Draft) o no tiene snapshot, usar la estructura más reciente de la plantilla
            if ((instance.State == Diitra.Domain.Common.Documents.DocumentState.Draft || string.IsNullOrEmpty(instance.TemplateConfigSnapshotJson)) && !string.IsNullOrEmpty(blocksJson))
            {
                var result = await BuildUiConfigResponseAsync(blocksJson, template, instance, ct);
                if (result != null) return result;
            }

            // 3. Fallback: Si posee un Snapshot estricto guardado previamente, usarlo
            if (!string.IsNullOrEmpty(instance.TemplateConfigSnapshotJson))
            {
                var result = await BuildUiConfigResponseAsync(instance.TemplateConfigSnapshotJson, template, instance, ct);
                if (result != null) return result;
            }

            // 4. Mapeos hardcoded legacy por código de plantilla (retrocompatibilidad)
            var code = instance.TemplateCode;

            if (code == "RUBRICA_EVALUACION" || code == "RUBRICA_EVALUACION_PROYECTO")
            {
                InvRubrica? rubricaActiva = null;

                // Intento 1: Buscar por la revisión asignada al proyecto
                var revision = await _context.InvRevisionesPares
                    .Include(r => r.Proyecto)
                    .FirstOrDefaultAsync(r => r.Uuid == instance.EntityUuid, ct);

                if (revision?.Proyecto != null && revision.Proyecto.IdConvocatoria.HasValue)
                {
                    var convocatoria = await _context.InvConvocatorias
                        .FirstOrDefaultAsync(c => c.IdConvocatoria == revision.Proyecto.IdConvocatoria.Value, ct);
                    if (convocatoria != null && convocatoria.IdRubrica.HasValue)
                    {
                        rubricaActiva = await _context.InvRubricas
                            .Include(r => r.InvRubricaCriterios)
                            .FirstOrDefaultAsync(r => r.IdRubrica == convocatoria.IdRubrica.Value, ct);
                    }
                }

                // Intento 2: Si EntityUuid es el ID numérico directo de la rúbrica
                if (rubricaActiva == null && !string.IsNullOrEmpty(instance.EntityUuid) && int.TryParse(instance.EntityUuid, out int idRubrica))
                {
                    rubricaActiva = await _context.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(r => r.IdRubrica == idRubrica, ct);
                }

                // Intento 3: Rúbrica activa en BD
                if (rubricaActiva == null)
                {
                    rubricaActiva = await _context.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(r => r.Activo == true, ct);
                }

                // Intento 4: Primera rúbrica disponible
                if (rubricaActiva == null)
                {
                    rubricaActiva = await _context.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(ct);
                }

                if (rubricaActiva == null || !rubricaActiva.InvRubricaCriterios.Any())
                {
                    return BadRequest(new { message = "No se ha configurado ninguna rúbrica de evaluación con criterios en la base de datos." });
                }

                var schema = new Dictionary<string, object>();
                var fieldsList = new List<object>();

                foreach (var criterio in rubricaActiva.InvRubricaCriterios.OrderBy(c => c.Orden ?? 0))
                {
                    string keyName = $"Criterio_{criterio.IdCriterio}";
                    schema.Add(keyName, 0);

                    fieldsList.Add(new {
                        name = keyName,
                        label = $"{criterio.Nombre} (0-{(int)criterio.PesoPorcentaje})",
                        type = "number",
                        collaborative = false,
                        min = (int?)0,
                        max = (int?)criterio.PesoPorcentaje,
                        options = (string[]?)null,
                        placeholder = (string?)null
                    });
                }

                schema.Add("ComentariosGenerales", "");
                schema.Add("RecomendacionFinal", "");

                fieldsList.Add(new { name = "ComentariosGenerales", label = "Observaciones y comentarios institucionales", type = "textarea", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Escriba un informe cualitativo para fundamentar las puntuaciones..." });
                fieldsList.Add(new { name = "RecomendacionFinal", label = "Recomendación Final de Comisión", type = "select", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)new[] { "Aprobado sin modificaciones", "Aprobado con observaciones menores", "Requiere re-estructuración mayor", "Rechazado" }, placeholder = (string?)null });

                return Ok(new
                {
                    title = "Rúbrica de Evaluación por Pares",
                    subtitle = "Evaluación anónima (Fase 2) — Normativa CACES",
                    signatureType = template.SignatureType,
                    schema = schema,
                    lists = new string[] { },
                    sections = new[]
                    {
                        new
                        {
                            id = "evaluacion",
                            label = "Evaluación Técnica",
                            iconName = "CheckSquare",
                            config = new
                            {
                                referenceTemplateCode = "PROTOCOLO_INVESTIGACION",
                                fields = fieldsList.ToArray()
                            }
                        }
                    }
                });
            }

            if (code == "OFICIO_APROBACION")
            {
                return Ok(new
                {
                    title = "Formato Oficio de Aprobación de Proyecto",
                    subtitle = "Oficio formal emitido por la Coordinación de Investigación para aprobación legal previa a ejecución",
                    signatureType = template.SignatureType,
                    schema = new Dictionary<string, object>
                    {
                        { "oficio_numero", "" },
                        { "oficio_fecha", "" },
                        { "director_titulo", "Tecnólogo/a" },
                        { "director_nombre", "" },
                        { "director_carrera", "" },
                        { "coordinador_nombre", "Ing. Estefani Sánchez Mgtr." }
                    },
                    lists = new string[] { },
                    sections = new[]
                    {
                        new
                        {
                            id = "oficio_aprobacion",
                            label = "Oficio de Aprobación",
                            iconName = "FileText",
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "oficio_numero", label = "Número de Oficio", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"01-ISTPET-INV-2026" },
                                    new { name = "oficio_fecha", label = "Fecha de Emisión", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"27 de marzo de 2026" },
                                    new { name = "director_nombre", label = "Director del Proyecto (Destinatario)", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Nombre del docente director" },
                                    new { name = "director_carrera", label = "Carrera del Director", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Tecnología Superior en..." },
                                    new { name = "coordinador_nombre", label = "Coordinador/a de Investigación (Firmante)", type = "text", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Ing. Estefani Sánchez Mgtr." }
                                }
                            }
                        }
                    }
                });
            }

            // Si no se pudieron procesar bloques dinámicos ni existe mapeo específico, responder indicando que utiliza la plantilla oficial nativa
            return Ok(new { hasDynamicConfig = false, message = $"La instancia de la plantilla '{code}' utiliza componentes de diseño nativos oficiales." });
        }

        [HttpGet("maintenance/diagnose")]
        public async Task<IActionResult> DiagnoseObsolete(CancellationToken ct)
        {
            try
            {
                var diagnosis = await _instanceService.GetObsoleteDocumentDiagnosisAsync(ct);
                return Ok(diagnosis);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("maintenance/purge-all")]
        public async Task<IActionResult> PurgeAllObsolete(CancellationToken ct)
        {
            try
            {
                var actor = User.Identity?.Name ?? "Administrador DIITRA";
                int count = await _instanceService.PurgeAllObsoleteDocumentFilesAsync(actor, ct);
                return Ok(new { success = true, message = $"Se depuraron exitosamente {count} archivos físicos obsoletos.", count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("maintenance/purge/{uuid}")]
        public async Task<IActionResult> PurgeObsoleteFile(string uuid, CancellationToken ct)
        {
            try
            {
                var actor = User.Identity?.Name ?? "Administrador DIITRA";
                bool success = await _instanceService.PurgeObsoleteFileByUuidAsync(uuid, actor, ct);
                if (!success) return NotFound(new { success = false, message = "Instancia no encontrada." });
                return Ok(new { success = true, message = "El archivo físico obsoleto ha sido purgado exitosamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private async Task<IActionResult> BuildUiConfigResponseAsync(
            string blocksJson, 
            Diitra.Domain.Common.Documents.DocumentTemplate template, 
            Diitra.Domain.Common.Documents.DocumentInstance? instance, 
            CancellationToken ct)
        {
            try
            {
                var blocks = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(blocksJson);
                if (blocks == null)
                    throw new InvalidOperationException("Los bloques estructurales no pudieron ser deserializados.");

                var sectionsList = new List<UiSectionDto>();
                var schemaDict = new Dictionary<string, object>();
                var listsList = new List<string>();
                var richTextFields = new List<object>();
                int premiumFieldsCount = 0;

                foreach (var block in blocks)
                {
                    if (block.TryGetProperty("isActive", out var activeProp) && !activeProp.GetBoolean())
                        continue;

                    string type = "";
                    string title = "";

                    if (block.TryGetProperty("type", out var typeProp)) type = typeProp.GetString() ?? "";
                    if (block.TryGetProperty("title", out var titleProp)) title = titleProp.GetString() ?? "";

                    if (string.IsNullOrEmpty(type))
                        continue;

                    var provider = _blockProviders.FirstOrDefault(p => p.BlockType == type);
                    if (provider != null)
                    {
                        if (provider.Behavior == BlockBehavior.StaticLayout)
                        {
                            provider.PopulateSchema(block, schemaDict, listsList, richTextFields, ref premiumFieldsCount, template.Code);
                            continue;
                        }

                        bool isEditableWorkspace = true;
                        if (provider.Behavior == BlockBehavior.Configurable)
                        {
                            isEditableWorkspace = true;
                            if (block.TryGetProperty("config", out var configProp))
                            {
                                if (configProp.TryGetProperty("isEditableWorkspace", out var isEditableProp))
                                {
                                    isEditableWorkspace = isEditableProp.GetBoolean();
                                }
                            }
                        }

                        if (provider.Behavior == BlockBehavior.DataCapture || isEditableWorkspace)
                        {
                            provider.PopulateSchema(block, schemaDict, listsList, richTextFields, ref premiumFieldsCount, template.Code);
                            await provider.MapToUiSectionAsync(block, title, sectionsList, _context, template.Code, ct);
                        }
                    }
                }

                // Auto-poblar el esquema inicial con datos reales del proyecto vinculado desde el Orquestador de Datos
                if (instance != null && !string.IsNullOrEmpty(instance.Uuid))
                {
                    try
                    {
                        var docReq = await _orchestrator.PrepareRequestAsync(instance.Uuid, "sistema", true, ct);
                        if (docReq?.Data != null)
                        {
                            var dataJson = System.Text.Json.JsonSerializer.Serialize(docReq.Data);
                            using var doc = System.Text.Json.JsonDocument.Parse(dataJson);
                            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                            {
                                foreach (var prop in doc.RootElement.EnumerateObject())
                                {
                                    var valStr = prop.Value.ValueKind == System.Text.Json.JsonValueKind.String ? prop.Value.GetString() : prop.Value.ToString();
                                    if (!string.IsNullOrWhiteSpace(valStr))
                                    {
                                        schemaDict[prop.Name] = valStr;
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[DIITRA] Warning auto-poblando esquema para la instancia {instance.Uuid}: {ex.Message}");
                    }
                }

                var orderedSections = sectionsList.ToArray();

                bool hasTemplateUpdate = instance != null 
                    && instance.State == Diitra.Domain.Common.Documents.DocumentState.Draft 
                    && template.Version > instance.TemplateVersion;

                return Ok(new
                {
                    title = template.Name,
                    subtitle = template.Description ?? "Formulario de Colaboración Dinámico",
                    signatureType = template.SignatureType,
                    schema = schemaDict,
                    lists = listsList.ToArray(),
                    sections = orderedSections,
                    hasTemplateUpdate = hasTemplateUpdate,
                    instanceVersion = instance?.TemplateVersion ?? template.Version,
                    templateVersion = template.Version,
                    instanceState = instance?.State.ToString() ?? "TemplateOnly"
                });
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[DIITRA WARNING] Error al procesar bloques dinámicos en BuildUiConfigResponseAsync: {ex.Message}\n{ex.StackTrace}");
                return NotFound(new { message = $"La estructura de bloques de la plantilla '{template.Code}' está corrupta. Cayendo en fallback local del frontend.", error = ex.Message });
            }
        }
    }
}
