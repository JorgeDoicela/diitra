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
            if (code == "PROTOCOLO_INVESTIGACION")
            {
                return Ok(new
                {
                    title = "Proyecto de Investigación",
                    subtitle = "Formulación del Proyecto de Investigación - ISTPET",
                    schema = new Dictionary<string, object>
                    {
                        { "Titulo", "" },
                        { "IdCarrera", 0 },
                        { "IdConvocatoria", 0 },
                        { "Periodo", "" },
                        { "TiempoEjecucion", "" },
                        { "Programa", "" },
                        { "GrupoInvestigacionTipo", "NO" },
                        { "GrupoInvestigacionNombre", "" },
                        { "Dominio", "" },
                        { "LineaInvestigacion", "" },
                        { "SublineaInvestigacion", "" },
                        { "TipoInvestigacion", "APLICADA" },
                        { "CampoAmplio", "" },
                        { "CampoEspecifico", "" },
                        { "CampoDetallado", "" },
                        { "DirectorProyecto", "" },
                        { "FechaPresentacion", "" },
                        { "FechaInicio", "" },
                        { "FechaFin", "" },
                        { "Investigadores", new object[] { } },
                        { "Antecedentes", "" },
                        { "DescripcionProyecto", "" },
                        { "Justificacion", "" },
                        { "ObjetivoGeneral", "" },
                        { "ObjetivosEspecificos", "" },
                        { "ObjetivosDesarrolloSostenible", "" },
                        { "MarcoTeorico", "" },
                        { "Metodologia", "" },
                        { "Evaluacion", "" },
                        { "RecursosDisponibles", new object[] { } },
                        { "RecursosNecesarios", new object[] { } },
                        { "CostoTotal", 0 },
                        { "FinanciamientoIstpet", false },
                        { "FinanciamientoOtrasFuentes", false },
                        { "NombresOtrasFuentes", "" },
                        { "ProductosEsperados", new object[] { } },
                        { "Impacto", new Dictionary<string, string> { { "social", "" }, { "cientifico", "" }, { "economico", "" }, { "politico", "" }, { "ambiental", "" }, { "otro", "" } } },
                        { "Cronograma", new object[] { } },
                        { "Bibliografia", "" },
                        { "FirmasResponsabilidad", new Dictionary<string, string> { { "DirectorNombre", "" }, { "DirectorCargo", "Director del Proyecto" }, { "CoordinadorNombre", "" }, { "CoordinadorCargo", "Coordinador de Carrera" } } }
                    },
                    lists = new[] { "Investigadores", "RecursosDisponibles", "RecursosNecesarios", "Cronograma", "ProductosEsperados" },
                    sections = new[]
                    {
                        new { id = "identificacion", label = "Identificación", iconName = "BookOpen", config = (object?)null },
                        new { id = "tecnico", label = "Plan Técnico", iconName = "FileText", config = (object?)null },
                        new { id = "equipo", label = "Equipo Humano", iconName = "Users", config = (object?)null },
                        new { id = "recursos", label = "Recursos & Financiamiento", iconName = "DollarSign", config = (object?)null },
                        new { id = "cronograma", label = "Cronograma (Gantt)", iconName = "Calendar", config = (object?)null },
                        new { id = "impactos", label = "Impacto & Productos", iconName = "Target", config = (object?)null }
                    }
                });
            }

            if (code == "RUBRICA_EVALUACION")
            {
                return Ok(new
                {
                    title = "Rúbrica de Evaluación por Pares",
                    subtitle = "Evaluación anónima (Fase 2) — Normativa CACES",
                    schema = new Dictionary<string, object>
                    {
                        { "Pertinencia", 0 },
                        { "Metodologia", 0 },
                        { "Viabilidad", 0 },
                        { "Impacto", 0 },
                        { "ComentariosGenerales", "" },
                        { "RecomendacionFinal", "" }
                    },
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
                                fields = new[]
                                {
                                    new { name = "Pertinencia", label = "Pertinencia Social (0-25)", type = "number", collaborative = false, min = (int?)0, max = (int?)25, options = (string[]?)null, placeholder = (string?)null },
                                    new { name = "Metodologia", label = "Metodología Científica (0-25)", type = "number", collaborative = false, min = (int?)0, max = (int?)25, options = (string[]?)null, placeholder = (string?)null },
                                    new { name = "Viabilidad", label = "Viabilidad y Presupuesto (0-25)", type = "number", collaborative = false, min = (int?)0, max = (int?)25, options = (string[]?)null, placeholder = (string?)null },
                                    new { name = "Impacto", label = "Impacto y Transferencia (0-25)", type = "number", collaborative = false, min = (int?)0, max = (int?)25, options = (string[]?)null, placeholder = (string?)null },
                                    new { name = "ComentariosGenerales", label = "Observaciones y comentarios institucionales", type = "textarea", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Escriba un informe cualitativo para fundamentar las puntuaciones..." },
                                    new { name = "RecomendacionFinal", label = "Recomendación Final de Comisión", type = "select", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)new[] { "Aprobado sin modificaciones", "Aprobado con observaciones menores", "Requiere re-estructuración mayor", "Rechazado" }, placeholder = (string?)null }
                                }
                            }
                        }
                    }
                });
            }

            if (code == "INFORME_AVANCE")
            {
                return Ok(new
                {
                    title = "Informe de Avance de Proyecto",
                    subtitle = "Ejecución y Monitoreo (Fase 3)",
                    schema = new Dictionary<string, object>
                    {
                        { "ConclusionesParciales", "" },
                        { "HitosCompletados", new object[] { } },
                        { "Evidencias", new object[] { } },
                        { "PresupuestoEjecutado", new object[] { } }
                    },
                    lists = new[] { "HitosCompletados", "Evidencias", "PresupuestoEjecutado" },
                    sections = new[]
                    {
                        new
                        {
                            id = "ejecucion",
                            label = "Avance de Ejecución",
                            iconName = "BarChart",
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "ConclusionesParciales", label = "Bitácora Científica & Conclusiones Parciales", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Documenta el progreso experimental, hallazgos y avances teórico-prácticos del período..." }
                                }
                            }
                        }
                    }
                });
            }

            if (code == "ACTA_COMITE_ETICA")
            {
                return Ok(new
                {
                    title = "Acta del Comité de Ética de Investigación",
                    subtitle = "Evaluación de Pertinencia Ética y Bioética - IST Traversari",
                    schema = new Dictionary<string, object>
                    {
                        { "JustificacionEtica", "" },
                        { "RiesgosIdentificados", "" },
                        { "MetodoConsentimiento", "" },
                        { "DictamenComite", "Aprobado sin observaciones" },
                        { "ObservacionesEspecificas", "" },
                        { "MiembrosFirmantes", new object[] { } }
                    },
                    lists = new[] { "MiembrosFirmantes" },
                    sections = new[]
                    {
                        new
                        {
                            id = "evaluacion_comite",
                            label = "Evaluación de Ética",
                            iconName = "CheckSquare",
                            config = new
                            {
                                referenceTemplateCode = "PROTOCOLO_INVESTIGACION",
                                fields = new[]
                                {
                                    new { name = "JustificacionEtica", label = "Justificación Ética de la Investigación", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Describa el impacto ético sobre seres humanos, datos sensibles o animales..." },
                                    new { name = "RiesgosIdentificados", label = "Identificación y Mitigación de Riesgos", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Especifique cualquier riesgo biológico, digital o social y cómo se resolverá..." },
                                    new { name = "MetodoConsentimiento", label = "Mecanismo de Consentimiento Informado", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Detalle cómo se obtendrá el consentimiento firmado de los participantes..." },
                                    new { name = "DictamenComite", label = "Dictamen Final de Comisión de Ética", type = "select", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)new[] { "Aprobado sin observaciones", "Aprobado con sugerencias", "Rechazado" }, placeholder = (string?)null },
                                    new { name = "ObservacionesEspecificas", label = "Observaciones y Requerimientos de Enmienda", type = "textarea", collaborative = false, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = (string?)"Escriba cualquier directriz obligatoria que el equipo de investigadores deba aplicar..." }
                                }
                            }
                        }
                    }
                });
            }

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
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "resumen_ejecutivo", label = "Resumen Ejecutivo", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Redacte el resumen ejecutivo de la investigación..." },
                                    new { name = "cumplimiento_objetivos", label = "Análisis de Cumplimiento de Objetivos", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Detalle cómo se cumplieron cada uno de los objetivos planteados..." }
                                }
                            }
                        },
                        new
                        {
                            id = "resultados",
                            label = "Resultados & Discusión",
                            iconName = "BarChart",
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "resultados", label = "Resultados Obtenidos", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Descripción técnica de los hallazgos y resultados..." },
                                    new { name = "discusion", label = "Discusión de Hallazgos", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Análisis crítico de los resultados frente al marco teórico inicial..." }
                                }
                            }
                        },
                        new
                        {
                            id = "impacto",
                            label = "Impacto & Cierre",
                            iconName = "Target",
                            config = new
                            {
                                fields = new[]
                                {
                                    new { name = "impacto_final", label = "Impacto en la Sociedad / Sector Productivo", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Describir el impacto real observado tras la ejecución..." },
                                    new { name = "transferencia_conocimiento", label = "Transferencia de Tecnología / Conocimiento", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Convenios, prototipos o publicaciones derivadas..." },
                                    new { name = "conclusiones", label = "Conclusiones Generales", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Conclusiones finales del proyecto..." },
                                    new { name = "recomendaciones", label = "Recomendaciones", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Sugerencias para futuros desarrollos o líneas de investigación..." },
                                    new { name = "bibliografia_final", label = "Bibliografía Actualizada (APA)", type = "rich-text", collaborative = true, min = (int?)null, max = (int?)null, options = (string[]?)null, placeholder = "Listado completo de fuentes bibliográficas utilizadas..." }
                                }
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
                        string jsonToDeserialize = instance.DataSnapshotJson ?? metadataJson;
                        jsonToDeserialize = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(jsonToDeserialize);

                        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(jsonToDeserialize, options);
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
