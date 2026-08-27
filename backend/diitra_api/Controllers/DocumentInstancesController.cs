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
using System.Collections.Generic;
using System.Threading;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/documents/instances")]
    [Authorize]
    public partial class DocumentInstancesController : ControllerBase
    {
        private readonly IDocumentInstanceService _instanceService;
        private readonly IDocumentEngine _documentEngine;
        private readonly IDocumentDataOrchestrator _orchestrator;
        private readonly diitra_infrastructure.data.models.DiitraContext _context;
        private readonly IEnumerable<IDocumentBlockProvider> _blockProviders;
        private readonly Microsoft.Extensions.Hosting.IHostEnvironment _environment;

        public DocumentInstancesController(
            IDocumentInstanceService instanceService,
            IDocumentEngine documentEngine,
            IDocumentDataOrchestrator orchestrator,
            diitra_infrastructure.data.models.DiitraContext context,
            IEnumerable<IDocumentBlockProvider> blockProviders,
            Microsoft.Extensions.Hosting.IHostEnvironment environment)
        {
            _instanceService = instanceService;
            _documentEngine = documentEngine;
            _orchestrator = orchestrator;
            _context = context;
            _blockProviders = blockProviders;
            _environment = environment;
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
            [FromQuery] string entityType = "Proyecto",
            CancellationToken ct = default)
        {
            try
            {
                var userUuid = User.Identity?.Name ?? "anon";
                var instance = await _instanceService.ResolveAsync(templateCode, entityUuid, userUuid, title, entityType, ct: ct);
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

                // 1. Orquestar los datos (Investigación + CoWork) en modo oficial (sin marca borrador)
                var docRequest = await _orchestrator.PrepareRequestAsync(uuid, userUuid, forceDraftMode: false, ct: ct);

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

                if (instance.TemplateCode == "PROTOCOLO_INVESTIGACION" || instance.TemplateCode == "PROTOCOLO_INNOVACION")
                {
                    try
                    {
                        string jsonToDeserialize = instance.DataSnapshotJson ?? metadataJson;
                        jsonToDeserialize = Diitra.Infrastructure.Common.Documents.Engine.HandlebarsTemplateEngine.CleanAndNormalizeJson(jsonToDeserialize);

                        var dto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(jsonToDeserialize, ProyectoDto.DefaultDeserializerOptions);
                        if (dto != null)
                        {
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
                                    if (dto.Estado == "Prepropuesta")
                                    {
                                        var notificationService = HttpContext.RequestServices.GetRequiredService<diitra_application.Common.Notifications.INotificationService>();

                                        var participantsList = new List<string>();
                                        if (!string.IsNullOrEmpty(dto.DirectorProyecto))
                                        {
                                            participantsList.Add($"{dto.DirectorProyecto} (Director)");
                                        }
                                        if (dto.Investigadores != null)
                                        {
                                            foreach (var inv in dto.Investigadores)
                                            {
                                                if (inv.Nombre != dto.DirectorProyecto && !string.IsNullOrEmpty(inv.Nombre))
                                                {
                                                    participantsList.Add($"{inv.Nombre} ({inv.Rol ?? "Investigador"})");
                                                }
                                            }
                                        }
                                        string participantes = participantsList.Count > 0
                                            ? string.Join(", ", participantsList)
                                            : "un docente";

                                        string targetSlug = instance.TemplateCode.ToLower().Replace('_', '-');
                                        string notifTitle = instance.TemplateCode == "PROTOCOLO_INNOVACION" 
                                            ? "Propuesta de Innovación Registrada" 
                                            : "Prepropuesta Registrada";

                                        try
                                        {
                                            await notificationService.NotifyByRoleCodesAsync(
                                                notifTitle,
                                                $"La prepropuesta del proyecto '{dto.Titulo}' (Autores: {participantes}) ha sido registrada/reenviada y está pendiente de aprobación de idea.",
                                                new[] { "DIITRA_ADMIN" },
                                                $"/investigacion/workspace/{targetSlug}/{dto.Uuid}"
                                            );
                                        }
                                        catch (Exception ex)
                                        {
                                            Console.WriteLine($"[DIITRA] Error al notificar prepropuesta nueva: {ex.Message}");
                                        }
                                    }
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

        [HttpPost("{uuid}/upgrade-template")]
        public async Task<IActionResult> UpgradeTemplate(string uuid, CancellationToken ct)
        {
            try
            {
                var instance = await _instanceService.UpgradeTemplateAsync(uuid, ct);
                return Ok(new { success = true, version = instance.TemplateVersion });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
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

    public class UiSectionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string IconName { get; set; } = string.Empty;
        public string? ComponentName { get; set; }
        public object? Config { get; set; }
    }
}
