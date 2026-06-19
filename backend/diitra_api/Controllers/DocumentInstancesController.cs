using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using System;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/documents/instances")]
    [Authorize]
    public class DocumentInstancesController : ControllerBase
    {
        private readonly IDocumentInstanceService _instanceService;
        private readonly IDocumentEngine _documentEngine;
        private readonly IDocumentDataOrchestrator _orchestrator;

        public DocumentInstancesController(
            IDocumentInstanceService instanceService,
            IDocumentEngine documentEngine,
            IDocumentDataOrchestrator orchestrator)
        {
            _instanceService = instanceService;
            _documentEngine = documentEngine;
            _orchestrator = orchestrator;
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
                request.EntityType ?? "Proyecto",
                ct);

            return Ok(instance);
        }

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

            // 1. Esquema Premium Pre-Mapeado (Caso de Plantillas Oficiales)
            if (code == "INFORME_FINAL_INVESTIGACION")
            {
                return Ok(new
                {
                    title = "Informe Final de Investigación",
                    subtitle = "Cierre y Consolidación de Resultados - ISTPET",
                    schema = new Dictionary<string, object>
                    {
                        { "resumen_ejecutivo", "" },
                        { "cumplimiento_objetivos", "" },
                        { "resultados", "" },
                        { "discusion", "" },
                        { "impacto_final", "" },
                        { "transferencia_conocimiento", "" },
                        { "conclusiones", "" },
                        { "recomendaciones", "" },
                        { "bibliografia_final", "" }
                    },
                    lists = new string[] { },
                    sections = new[]
                    {
                        new
                        {
                            id = "resumen",
                            label = "Resumen & Objetivos",
                            iconName = "FileText",
                            fields = new[]
                            {
                                new { name = "resumen_ejecutivo", label = "Resumen Ejecutivo", type = "rich-text", collaborative = true, placeholder = "Redacte el resumen ejecutivo de la investigación..." },
                                new { name = "cumplimiento_objetivos", label = "Análisis de Cumplimiento de Objetivos", type = "rich-text", collaborative = true, placeholder = "Detalle cómo se cumplieron cada uno de los objetivos planteados..." }
                            }
                        },
                        new
                        {
                            id = "resultados",
                            label = "Resultados & Discusión",
                            iconName = "BarChart",
                            fields = new[]
                            {
                                new { name = "resultados", label = "Resultados Obtenidos", type = "rich-text", collaborative = true, placeholder = "Descripción técnica de los hallazgos y resultados..." },
                                new { name = "discusion", label = "Discusión de Hallazgos", type = "rich-text", collaborative = true, placeholder = "Análisis crítico de los resultados frente al marco teórico inicial..." }
                            }
                        },
                        new
                        {
                            id = "impacto",
                            label = "Impacto & Cierre",
                            iconName = "Target",
                            fields = new[]
                            {
                                new { name = "impacto_final", label = "Impacto en la Sociedad / Sector Productivo", type = "rich-text", collaborative = true, placeholder = "Describir el impacto real observado tras la ejecución..." },
                                new { name = "transferencia_conocimiento", label = "Transferencia de Tecnología / Conocimiento", type = "rich-text", collaborative = true, placeholder = "Convenios, prototipos o publicaciones derivadas..." },
                                new { name = "conclusiones", label = "Conclusiones Generales", type = "rich-text", collaborative = true, placeholder = "Conclusiones finales del proyecto..." },
                                new { name = "recomendaciones", label = "Recomendaciones", type = "rich-text", collaborative = true, placeholder = "Sugerencias para futuros desarrollos o líneas de investigación..." },
                                new { name = "bibliografia_final", label = "Bibliografía Actualizada (APA)", type = "rich-text", collaborative = true, placeholder = "Listado completo de fuentes bibliográficas utilizadas..." }
                            }
                        }
                    }
                });
            }

            // 2. Generación Dinámica en Caliente (Para plantillas custom creadas por DB)
            var colFields = new List<string>();
            if (!string.IsNullOrEmpty(template.CollaborativeFieldsJson))
            {
                try
                {
                    colFields = System.Text.Json.JsonSerializer.Deserialize<List<string>>(template.CollaborativeFieldsJson) ?? new List<string>();
                }
                catch { }
            }

            var dynamicSchema = new Dictionary<string, object>();
            var dynamicFields = new List<object>();

            foreach (var field in colFields)
            {
                dynamicSchema[field] = "";
                var readableLabel = System.Text.RegularExpressions.Regex.Replace(field, @"([a-z])([A-Z])", "$1 $2");
                readableLabel = readableLabel.Replace("_", " ");
                readableLabel = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(readableLabel.ToLower());

                dynamicFields.Add(new
                {
                    name = field,
                    label = readableLabel,
                    type = "rich-text",
                    collaborative = true,
                    placeholder = $"Redacte colaborativamente la sección {readableLabel}..."
                });
            }

            return Ok(new
            {
                title = template.Name,
                subtitle = template.Description ?? "Formulario Dinámico de Colaboración",
                schema = dynamicSchema,
                lists = new string[] { },
                sections = new[]
                {
                    new
                    {
                        id = "edicion_colaborativa",
                        label = "Colaboración",
                        iconName = "FileText",
                        fields = dynamicFields.ToArray()
                    }
                }
            });
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
            var instances = await _instanceService.GetByEntityAsync(entityUuid, ct);
            return Ok(instances);
        }

        /// <summary>
        /// RESOLVER ATÓMICO: Busca una instancia existente por (entityUuid, templateCode).
        /// Si no existe, la crea con los datos proporcionados. Evita duplicados y race conditions.
        /// </summary>
        [HttpGet("resolve")]
        public async Task<IActionResult> Resolve(
            [FromQuery] string templateCode,
            [FromQuery] string entityUuid,
            [FromQuery] string? title = null,
            CancellationToken ct = default)
        {
            try
            {
                var userUuid = User.Identity?.Name ?? "anon";
                var instance = await _instanceService.ResolveAsync(templateCode, entityUuid, userUuid, title, ct: ct);
                return Ok(instance);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene el historial global de los últimos documentos generados por el núcleo.
        /// Ideal para tableros de control y auditoría general.
        /// </summary>
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalHistory(CancellationToken ct)
        {
            var instances = await _instanceService.GetAllAsync(20, ct);
            return Ok(instances);
        }

        /// <summary>
        /// PROCESO: Finaliza un documento orquestando el Builder y CoWork.
        /// No recibe el PDF del cliente (evita manipulación). El servidor lo genera
        /// usando los datos oficiales y el contenido colaborativo auditado.
        /// </summary>
        [HttpPost("{uuid}/finalize")]
        public async Task<IActionResult> Finalize(string uuid, CancellationToken ct)
        {
            try
            {
                var userUuid = User.Identity?.Name ?? "anon";

                // 1. Orquestar los datos (Investigación + CoWork)
                var docRequest = await _orchestrator.PrepareRequestAsync(uuid, userUuid, ct);

                // 2. Generar el PDF oficial usando el Motor de Documentos (DIITRA Builder)
                var buildResult = await _documentEngine.GenerateAsync(docRequest, ct);

                // 3. Persistir y cerrar el ciclo de vida del documento
                var hash = "SHA256-" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(); // En producción sería el hash real del PDF

                var instance = await _instanceService.FinalizeAsync(
                    uuid,
                    buildResult.PdfBytes,
                    buildResult.FileName,
                    hash,
                    buildResult.TraceabilityCode,
                    ct);

                return Ok(new {
                    Instance = instance,
                    TraceabilityCode = buildResult.TraceabilityCode,
                    FileName = buildResult.FileName
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Error en la orquestación del documento: {ex.Message}" });
            }
        }

        /// <summary>
        /// ENDPOINT UNIVERSAL: Permite a DIITRA Builder (Frontend) autoguardar
        /// cualquier estructura de datos JSON (Rúbricas, Actas, Proyectos) sin
        /// depender de modelos rígidos como ProyectoDto.
        /// </summary>
        [HttpPatch("{uuid}/metadata")]
        public async Task<IActionResult> UpdateMetadata(
            string uuid,
            [FromBody] System.Text.Json.JsonElement metadata,
            [FromServices] IProjectOrchestrator projectOrchestrator,
            CancellationToken ct)
        {
            try
            {
                string metadataJson = metadata.GetRawText();
                var instance = await _instanceService.UpdateMetadataAsync(uuid, metadataJson, ct);

                if (instance.TemplateCode == "PROTOCOLO_INVESTIGACION")
                {
                    try
                    {
                        var options = new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(instance.DataSnapshotJson ?? metadataJson, options);
                        if (dto != null)
                        {
                            // Si el EntityUuid es "GLOBAL", significa que es una nueva postulación y no un proyecto existente.
                            // Generamos un nuevo UUID único para el proyecto y actualizamos la vinculación de la instancia.
                            bool isNewProject = string.IsNullOrEmpty(instance.EntityUuid) || instance.EntityUuid == "GLOBAL";
                            if (isNewProject)
                            {
                                dto.Uuid = Guid.NewGuid().ToString();
                            }
                            else
                            {
                                dto.Uuid = instance.EntityUuid;
                            }

                            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
                            if (!isNewProject && !string.IsNullOrEmpty(dto.Uuid) && !string.IsNullOrEmpty(userIdRef))
                            {
                                var canModify = await projectOrchestrator.UserCanModifyProjectAsync(dto.Uuid, userIdRef);
                                if (!canModify)
                                {
                                    return Forbid();
                                }
                            }

                            var result = await projectOrchestrator.SyncProjectWizardDataAsync(dto, userIdRef);

                            if (!result.Success)
                            {
                                Console.WriteLine($"[DIITRA ERROR] Sync failed: {result.Message}");
                                return BadRequest(new { success = false, message = $"Error de sincronización relacional: {result.Message}" });
                            }

                            if (isNewProject)
                            {
                                var context = HttpContext.RequestServices.GetRequiredService<diitra_infrastructure.data.models.DiitraContext>();
                                var dbInstance = await context.DocumentInstances.FirstOrDefaultAsync(i => i.Uuid == instance.Uuid, ct);
                                if (dbInstance != null)
                                {
                                    dbInstance.SetEntityUuid(dto.Uuid);
                                    await context.SaveChangesAsync(ct);
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine("[DIITRA ERROR] Deserialization returned null for ProyectoDto");
                            return BadRequest(new { success = false, message = "La metadata enviada no pudo ser deserializada correctamente como Proyecto." });
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DIITRA ERROR] Exception in metadata sync: {ex.ToString()}");
                        return BadRequest(new { success = false, message = $"Fallo crítico en la sincronización de base de datos: {ex.Message}" });
                    }
                }

                return Ok(new { success = true, uuid = instance.Uuid });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Documento no encontrado." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public record CreateInstanceRequest(
        [property: JsonPropertyName("templateCode")] string TemplateCode,
        [property: JsonPropertyName("entityUuid")] string EntityUuid,
        [property: JsonPropertyName("entityType")] string? EntityType = null,
        [property: JsonPropertyName("title")] string? Title = null);

    public record FinalizeRequest(
        [property: JsonPropertyName("pdfBase64")] string? PdfBase64,
        [property: JsonPropertyName("hash")] string Hash,
        [property: JsonPropertyName("traceabilityCode")] string TraceabilityCode);
}
