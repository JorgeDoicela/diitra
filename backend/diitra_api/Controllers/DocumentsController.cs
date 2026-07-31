using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;

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

        /// <summary>
        /// VALIDADOR PÚBLICO DE TRAZABILIDAD E INTEGRIDAD DE DOCUMENTOS (CACES Compliance)
        /// -------------------------------------------------------------------------
        /// Permite a cualquier persona u organismo externo (CACES) verificar la validez 
        /// y autenticidad de un documento mediante su código de trazabilidad único.
        /// </summary>
        [HttpGet("verify/{code}")]
        [AllowAnonymous]
        public async Task<IActionResult> Verify(
            string code, 
            [FromServices] IDocumentAuditRepository auditRepository, 
            [FromServices] IDocumentTemplateRepository templateRepository,
            [FromServices] diitra_infrastructure.data.models.DiitraContext context,
            System.Threading.CancellationToken ct)
        {
            _logger.LogInformation("[DIITRA CORE] Solicitud de verificación pública de trazabilidad para código: {Code}", code);

            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { error = "El código de verificación es requerido." });
            }

            code = code.Trim();

            // 1. Intentar buscar por código de trazabilidad del documento original
            var auditEntry = await auditRepository.FindByTraceabilityCodeAsync(code, ct);
            
            // 2. Si no se encuentra, intentar buscar por un código de firma (DFRM-*)
            diitra_infrastructure.data.models.InvDocumentoFirma? firmaBusqueda = null;
            if (auditEntry == null)
            {
                firmaBusqueda = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                    context.InvDocumentoFirmas, f => f.FirmaCode == code, ct);

                if (firmaBusqueda != null && !string.IsNullOrWhiteSpace(firmaBusqueda.DocumentoUuid))
                {
                    auditEntry = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                        context.DocumentAuditEntries, e => e.EntityUuid == firmaBusqueda.DocumentoUuid, ct);
                }
            }

            if (auditEntry == null && firmaBusqueda == null)
            {
                return NotFound(new { error = "El código de trazabilidad o firma no es válido, o el documento no ha sido emitido oficialmente." });
            }

            string templateName = auditEntry != null ? "Documento Oficial DIITRA" : "Firma Institucional DIITRA";
            if (auditEntry != null)
            {
                try 
                {
                    var template = await templateRepository.FindByCodeAsync(auditEntry.TemplateCode, ct);
                    if (template != null)
                    {
                        templateName = template.Name;
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogWarning(ex, "[DIITRA CORE] No se pudo obtener el nombre de la plantilla {Code}", auditEntry.TemplateCode);
                }
            }

            // 3. Obtener todas las firmas asociadas a este documento ordenadas por fecha (cascada de firmas)
            var firmasDb = new System.Collections.Generic.List<diitra_infrastructure.data.models.InvDocumentoFirma>();
            string docUuidToSearch = auditEntry?.EntityUuid ?? firmaBusqueda?.DocumentoUuid ?? "";

            if (!string.IsNullOrWhiteSpace(docUuidToSearch))
            {
                firmasDb = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                    Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AsNoTracking(
                        System.Linq.Queryable.OrderBy(
                            System.Linq.Queryable.Where(context.InvDocumentoFirmas, f => f.DocumentoUuid == docUuidToSearch),
                            f => f.FechaFirma
                        )
                    ),
                    ct
                );
            }

            if (firmasDb.Count == 0 && firmaBusqueda != null)
            {
                firmasDb.Add(firmaBusqueda);
            }

            var firmasList = System.Linq.Enumerable.ToList(
                System.Linq.Enumerable.Select(firmasDb, f => {
                    string firmanteNombre = f.FirmanteId;
                    try
                    {
                        using var doc = JsonDocument.Parse(f.FirmaMetadata ?? "{}");
                        firmanteNombre = doc.RootElement.TryGetProperty("nombre", out var n)
                            ? n.GetString() ?? f.FirmanteId
                            : f.FirmanteId;
                    }
                    catch { }

                    return new {
                        FirmaCode = f.FirmaCode,
                        FirmanteNombre = firmanteNombre,
                        FirmanteRol = f.FirmanteRol,
                        FechaFirma = f.FechaFirma,
                        DocHash = f.DocHash,
                        EsValida = f.EsValida,
                        RevocadaEn = f.RevocadaEn,
                        MotivoRevocacion = f.MotivoRevocacion
                    };
                })
            );

            string generatedBy = auditEntry?.GeneratedBy ?? "Sistema DIITRA";
            if (auditEntry == null && firmaBusqueda != null && firmasList.Count > 0)
            {
                generatedBy = firmasList[0].FirmanteNombre;
            }

            return Ok(new
            {
                TemplateCode = auditEntry?.TemplateCode ?? "DFRM-VERIFY",
                TemplateName = templateName,
                TemplateVersion = auditEntry != null ? auditEntry.TemplateVersion.ToString() : "1.0",
                Category = auditEntry != null ? auditEntry.Category.ToString() : "SignatureVerification",
                GeneratedBy = generatedBy,
                GeneratedAt = auditEntry?.GeneratedAt ?? firmaBusqueda?.FechaFirma ?? System.DateTime.UtcNow,
                FileHash = auditEntry?.FileHash ?? firmaBusqueda?.DocHash ?? "N/A",
                FileName = auditEntry?.FileName ?? $"Firma_{firmaBusqueda?.FirmaCode}.pdf",
                Signatures = firmasList
            });
        }
    }
}
