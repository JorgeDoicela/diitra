using Diitra.Application.Common.Documents;
using Diitra.Application.Common;
using Diitra.Domain.Common.Documents;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Collections.Concurrent;
using Diitra.Infrastructure.Common.Documents.Engine;
// TemplateImages.cs eliminado — imágenes cargadas desde Resources/Images/ vía ImageResourceLoader
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;
using iText.IO.Image;
using Microsoft.Extensions.Configuration;
using Diitra.Application.Research.Dtos;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Implementación de DIITRA Builder.
    /// Orquestador encargado de transformar datos colaborativos en documentos legales.
    /// 
    /// Implementa IDocumentEngine y coordina todos los sub-componentes del motor:
    ///   1. ScribanTemplateEngine   → Inyecta datos en el HTML de la plantilla
    ///   2. LegalComplianceInjector → Añade encabezado institucional, pie LOPDP, código QR
    ///   3. ITextHtmlPdfRenderer    → Convierte el HTML enriquecido a PDF de alta calidad
    ///   4. PdfMergerService        → Ensambla el PDF con los anexos (paquetes CACES)
    ///   5. IDocumentAuditRepository → Registra cada emisión en el log de auditoría
    /// 
    /// Uso desde cualquier módulo del sistema:
    ///   var result = await _documentEngine.GenerateAsync(new DocumentRequest {
    ///       TemplateCode = "ACTA_APROBACION",
    ///       Data = proyectoDto,
    ///       RequestedBy = currentUser.Email
    ///   });
    ///   return File(result.PdfBytes, "application/pdf", result.FileName);
    /// 
    /// NOTA DE RESILIENCIA: Este motor es agnóstico. No depende de 'Proyectos' ni 'Informes'.
    /// Recibe datos genéricos y los inyecta en plantillas, permitiendo que DIITRA escale
    /// a cualquier tipo de documento institucional sin cambiar el código del núcleo.
    /// </summary>
    public class DocumentEngine : IDocumentEngine
    {
        private readonly IDocumentTemplateRepository _templateRepository;
        private readonly IDocumentAuditRepository _auditRepository;
        private readonly ILogger<DocumentEngine> _logger;
        private readonly IConfiguration _configuration;
        private readonly TemplateFileLoader _templateFileLoader;
        private readonly ImageResourceLoader _imageLoader;
        private readonly DiitraContext _db;

        // PERFORMANCE OPTIMIZATION: Heavy engines are shared across requests
        private static readonly ScribanTemplateEngine _scribanEngine = new();
        private static readonly ITextHtmlPdfRenderer _pdfRenderer = new();
        private static readonly PdfMergerService _mergerService = new();
        private static readonly LegalComplianceInjector _complianceInjector = new();

        public DocumentEngine(
            IDocumentTemplateRepository templateRepository,
            IDocumentAuditRepository auditRepository,
            ILogger<DocumentEngine> logger,
            IConfiguration configuration,
            IHostEnvironment environment,
            DiitraContext db)
        {
            _templateRepository = templateRepository;
            _auditRepository = auditRepository;
            _logger = logger;
            _configuration = configuration;
            _templateFileLoader = new TemplateFileLoader(environment);
            _imageLoader = new ImageResourceLoader(environment);
            _db = db;
        }

        public async Task<DocumentResult> GenerateAsync(
            DocumentRequest request,
            CancellationToken cancellationToken = default)
        {
            try 
            {
                _logger.LogInformation(
                    "DIITRA DocumentEngine: Generando [{TemplateCode}] por [{User}] BlindMode={Blind}, DraftMode={Draft}",
                    request.TemplateCode, request.RequestedBy ?? "system", request.IsBlindMode, request.IsDraftMode);

                object renderData = request.Data ?? new { };

                // 0. Auto-completar campos colaborativos desde CoWork en BD (resiliencia ante ceguera de campos en Frontend)
                string? documentInstanceUuid = null;
                if (renderData != null)
                {
                    try
                    {
                        var rawText = renderData is System.Text.Json.JsonElement je 
                            ? je.GetRawText() 
                            : System.Text.Json.JsonSerializer.Serialize(renderData);

                        using var doc = System.Text.Json.JsonDocument.Parse(rawText);
                        if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                        {
                            if (doc.RootElement.TryGetProperty("Uuid", out var uuidProp) ||
                                doc.RootElement.TryGetProperty("uuid", out uuidProp) ||
                                doc.RootElement.TryGetProperty("EntityUuid", out uuidProp) ||
                                doc.RootElement.TryGetProperty("entityUuid", out uuidProp))
                            {
                                documentInstanceUuid = uuidProp.GetString();
                            }
                        }
                    }
                    catch { }
                }

                if (!string.IsNullOrEmpty(documentInstanceUuid))
                {
                    try
                    {
                        var coworkDocs = await _db.InvCoworkDocumentos
                            .AsNoTracking()
                            .Where(d => d.EntidadUuid == documentInstanceUuid)
                            .ToListAsync(cancellationToken);

                        if (coworkDocs.Any())
                        {
                            var rawText = renderData is System.Text.Json.JsonElement je 
                                ? je.GetRawText() 
                                : System.Text.Json.JsonSerializer.Serialize(renderData);
                            
                            var dataDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(rawText);
                            if (dataDict != null)
                            {
                                foreach (var doc in coworkDocs)
                                {
                                    if (!string.IsNullOrEmpty(doc.CampoNombre) && !string.IsNullOrEmpty(doc.ContentHtml))
                                    {
                                        dataDict[doc.CampoNombre] = doc.ContentHtml;
                                    }
                                }
                                renderData = dataDict;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "DIITRA DocumentEngine: Error al intentar fusionar contenidos colaborativos de CoWork para {Uuid}", documentInstanceUuid);
                    }
                }

                // 1. Obtener y Sincronizar Plantilla
                var template = await _templateRepository.FindByCodeAsync(request.TemplateCode, cancellationToken);
                if (template == null || !template.IsActive)
                {
                    var seed = DocumentTemplateRegistry.GetByCode(request.TemplateCode);
                    if (seed != null)
                    {
                        _logger.LogWarning("DIITRA DocumentEngine: Plantilla '{Code}' no encontrada. Restaurando...", request.TemplateCode);
                        await _templateRepository.SaveAsync(seed, cancellationToken);
                        template = seed;
                    }
                    else throw new KeyNotFoundException($"Plantilla '{request.TemplateCode}' no disponible.");
                }
                else
                {
                    var seed = DocumentTemplateRegistry.GetByCode(request.TemplateCode);
                    if (seed != null && seed.Version > template.Version)
                    {
                        _logger.LogInformation("DIITRA DocumentEngine: Sincronizando v{SeedVersion} de '{Code}'...", seed.Version, request.TemplateCode);
                        template.SyncWithSeed(seed);
                        await _templateRepository.SaveAsync(template, cancellationToken);
                    }
                }

                // 2. Validaciones
                if (request.IsBlindMode && !template.SupportsBlindMode)
                    throw new InvalidOperationException($"La plantilla '{template.Name}' no soporta Doble Ciego.");

                var traceabilityCode = GenerateTraceabilityCode(template.Category);

                // 3. Cargar HTML desde archivo físico (hot-reload en desarrollo)
                //    Si el archivo .html existe en disco, su contenido tiene prioridad sobre el de la BD.
                //    Esto permite editar el diseño sin recompilar ni reiniciar la API.
                var fileHtml = await _templateFileLoader.LoadAsync(template.Code);
                var htmlToRender = fileHtml ?? template.HtmlContent;

                if (fileHtml != null)
                {
                    _logger.LogDebug("DIITRA DocumentEngine: Usando HTML desde archivo físico para '{Code}'.", template.Code);

                    // Sincronización inteligente hacia la Base de Datos:
                    // Si el contenido del archivo físico cambió respecto a lo que hay en BD,
                    // lo actualizamos en la BD para que el fallback siempre esté al día.
                    if (fileHtml != template.HtmlContent)
                    {
                        _logger.LogInformation("DIITRA DocumentEngine: Detectado cambio en el archivo físico de '{Code}'. Sincronizando en BD para consistencia de Fallback...", template.Code);
                        template.UpdateHtmlContentOnly(fileHtml);
                        await _templateRepository.SaveAsync(template, cancellationToken);
                    }
                }

                // 4. Cargar imágenes desde disco e inyectar como variables extra en Handlebars
                //    Cada plantilla puede referenciar {{portada_base64}}, {{logo_base64}}, etc.
                var extraImageVars = new Dictionary<string, object?>();

                if (request.ExtraVariables != null)
                {
                    foreach (var kv in request.ExtraVariables)
                    {
                        extraImageVars[kv.Key] = kv.Value;
                    }
                }

                // CARGA DE PORTADA DESACOPLADA (Por convención de nombres o fallback histórico)
                var possibleCoverNames = new[]
                {
                    $"portada_{template.Code.ToLower()}",
                    $"portada_{template.Category.ToString().ToLower()}",
                    template.Code == ProyectoInvestigacionTemplate.CODE ? "portada_proyecto" : null
                }.Where(n => n != null).Cast<string>();

                foreach (var coverName in possibleCoverNames)
                {
                    var coverBase64 = await _imageLoader.LoadAsBase64Async(coverName);
                    if (coverBase64 != null)
                    {
                        extraImageVars["portada_base64"] = coverBase64;
                        break;
                    }
                }

                if (template.Code == ProyectoInvestigacionTemplate.CODE)
                {
                    var logoBase64 = await _imageLoader.LoadAsBase64Async("logo_istpet_negro.png");
                    if (logoBase64 != null)
                    {
                        extraImageVars["logo_base64"] = logoBase64;
                    }

                    ProyectoDto? projectDto = renderData as ProyectoDto;
                    if (projectDto == null && renderData != null)
                    {
                        try
                        {
                            var rawText = renderData is System.Text.Json.JsonElement je 
                                ? je.GetRawText() 
                                : System.Text.Json.JsonSerializer.Serialize(renderData);

                            // Desempaquetar la envoltura "Data" / "data" si existe en el JSON
                            using var doc = System.Text.Json.JsonDocument.Parse(rawText);
                            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object &&
                                (doc.RootElement.TryGetProperty("Data", out var dataProp) || 
                                 doc.RootElement.TryGetProperty("data", out dataProp)))
                            {
                                var nestedRaw = dataProp.GetRawText();
                                nestedRaw = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(nestedRaw);
                                projectDto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(nestedRaw, new System.Text.Json.JsonSerializerOptions 
                                { 
                                    PropertyNameCaseInsensitive = true 
                                });
                            }
                            else
                            {
                                var cleanedRaw = Diitra.Infrastructure.Common.Documents.Engine.ScribanTemplateEngine.CleanAndNormalizeJson(rawText);
                                projectDto = System.Text.Json.JsonSerializer.Deserialize<ProyectoDto>(cleanedRaw, new System.Text.Json.JsonSerializerOptions 
                                { 
                                    PropertyNameCaseInsensitive = true 
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "DIITRA DocumentEngine: No se pudo deserializar request.Data a ProyectoDto para {Code}", template.Code);
                        }
                    }

                    if (projectDto != null)
                    {
                        var director = projectDto.Investigadores?.FirstOrDefault(i => i.EsDirector == true)
                                       ?? projectDto.Investigadores?.FirstOrDefault(i => i.Rol?.Contains("Director", StringComparison.OrdinalIgnoreCase) == true);
                        
                        var docentes = projectDto.Investigadores?.Where(i => i != director && 
                            (i.Rol?.Contains("Docente", StringComparison.OrdinalIgnoreCase) == true || 
                             i.Rol?.Contains("Co-Investigador", StringComparison.OrdinalIgnoreCase) == true || 
                             (i.NivelAcademico != "Pregrado" && i.NivelAcademico != "Estudiante"))).ToList();
                        
                        var estudiantes = projectDto.Investigadores?.Where(i => i != director && 
                            (i.Rol?.Contains("Estudiante", StringComparison.OrdinalIgnoreCase) == true || 
                             i.Rol?.Contains("Alumno", StringComparison.OrdinalIgnoreCase) == true || 
                             i.NivelAcademico == "Pregrado" || 
                             (docentes != null && !docentes.Contains(i)))).ToList();

                        extraImageVars["investigador_director"] = director;
                        extraImageVars["investigadores_docentes"] = docentes;
                        extraImageVars["investigadores_estudiantes"] = estudiantes;
                    }
                }

                // 5. Inyectar datos + imágenes con Handlebars
                var renderedHtml = await _scribanEngine.RenderAsync(htmlToRender, renderData ?? new object(), extraImageVars.Count > 0 ? extraImageVars : null, request.IsBlindMode);
                
                // 5. Optimizar HTML (Inyectar estilos base y sanitizar imágenes)
                var optimizedHtml = ProcessAndOptimizeHtml(renderedHtml);

                // 6. Inyectar Cumplimiento Legal (Header/Footer, QR, Traceability)
                var finalHtml = _complianceInjector.InjectLegalFooter(optimizedHtml, template, traceabilityCode, request.IsBlindMode);

                var verificationBaseUrl = _configuration["FrontendUrl"] 
                                           ?? _configuration["Email:FrontendUrl"] 
                                           ?? "https://diitra.ist.edu.ec";

                // 7. Renderizado a PDF
                //    Carga de fondo de hojas (stationary) desacoplada (Por convención de nombres o fallback histórico)
                var possibleBackgroundNames = new[]
                {
                    $"fondo_{template.Code.ToLower()}",
                    $"fondo_hojas_{template.Code.ToLower()}",
                    $"fondo_hojas_{template.Category.ToString().ToLower()}",
                    template.Code == ProyectoInvestigacionTemplate.CODE ? "fondo_hojas_investigacion" : null
                }.Where(n => n != null).Cast<string>();

                ImageData? stationaryImage = null;
                foreach (var bgName in possibleBackgroundNames)
                {
                    var img = await _imageLoader.LoadAsImageDataAsync(bgName);
                    if (img != null)
                    {
                        stationaryImage = img;
                        break;
                    }
                }

                var pdfBytes = await _pdfRenderer.RenderWithMetadataAsync(finalHtml, new DocumentRenderingMetadata
                {
                    TraceabilityCode = traceabilityCode,
                    IsDraft = request.IsDraftMode,
                    StationaryImageData = stationaryImage,
                    VerificationBaseUrl = verificationBaseUrl
                }, template.CustomCss);

                // 6. Sello de Integridad (SHA-256)
                var fileHash = CalculateHash(pdfBytes);

                // 7. Auditoría Forense (Resiliencia CACES 2026)
                var fileName = $"DIITRA_{template.Code}_v{template.Version}_{DateTime.Now:yyyyMMdd-HHmm}.pdf";
                try 
                {
                    string? snapshot = null;
                    bool requiresSnapshot = template.Category is DocumentCategory.Protocolo 
                                            or DocumentCategory.ActaAprobacion 
                                            or DocumentCategory.InformeAvance 
                                            or DocumentCategory.InformeFinal;

                    if (renderData != null)
                    {
                        snapshot = System.Text.Json.JsonSerializer.Serialize(renderData);
                    }
                    else if (requiresSnapshot)
                    {
                        _logger.LogWarning("DIITRA Forensic: Se intenta generar [{Code}] sin datos de origen. El snapshot será nulo, comprometiendo la resiliencia.", template.Code);
                    }

                    var auditEntry = DocumentAuditEntry.Create(
                        traceabilityCode, template.Code, template.Version, template.Category,
                        request.RequestedBy ?? "sistema", request.IsBlindMode, fileName,
                        request.ProjectUuid, request.EntityUuid, fileHash, snapshot);

                    await _auditRepository.RegisterEmissionAsync(auditEntry, cancellationToken);
                    
                    if (snapshot != null)
                    {
                        _logger.LogInformation("DIITRA Forensic: Snapshot inyectado para [{Code}]. Integridad vinculada a Hash {Hash}.", template.Code, fileHash);
                    }
                }
                catch (Exception ex) { _logger.LogError(ex, "DIITRA DocumentEngine: Error crítico en el log de auditoría forense."); }

                return new DocumentResult
                {
                    PdfBytes = pdfBytes,
                    FileName = fileName,
                    TraceabilityCode = traceabilityCode,
                    TemplateVersion = template.Version,
                    WasBlindMode = request.IsBlindMode,
                    FileHash = fileHash
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DIITRA DocumentEngine FAILURE.");
                throw;
            }
        }

        public async Task<byte[]> MergeDocumentsAsync(
            IEnumerable<byte[]> pdfDocuments,
            CancellationToken cancellationToken = default)
        {
            return await _mergerService.MergeAsync(pdfDocuments);
        }

        public async Task<IEnumerable<DocumentTemplate>> GetAvailableTemplatesAsync(
            CancellationToken cancellationToken = default)
        {
            return await _templateRepository.GetAllActiveAsync(cancellationToken);
        }

        public async Task UpdateTemplateAsync(
            string templateCode, string newHtmlContent,
            string? customCss, string updatedBy,
            CancellationToken cancellationToken = default)
        {
            var template = await _templateRepository.FindByCodeAsync(templateCode, cancellationToken)
                ?? throw new KeyNotFoundException($"Plantilla '{templateCode}' no encontrada.");

            template.UpdateContent(newHtmlContent, customCss, updatedBy);
            await _templateRepository.SaveAsync(template, cancellationToken);

            _logger.LogInformation(
                "DIITRA DocumentEngine: Plantilla [{Code}] actualizada a v{Version} por [{User}].",
                templateCode, template.Version, updatedBy);
        }

        /// <summary>
        /// Sanitiza y optimiza el HTML antes del renderizado.
        /// - Fuerza a las imágenes a ser responsivas (max-width: 100%).
        /// - Detecta imágenes Base64 excesivamente grandes para alertar.
        /// </summary>
        private string ProcessAndOptimizeHtml(string html)
        {
            if (string.IsNullOrEmpty(html)) return html;

            // 1. Inyectar estilos globales de seguridad para el PDF
            string globalStyles = @"<style>
                img { max-width: 100% !important; height: auto !important; display: block; margin: 10px 0; }
                table { width: 100% !important; border-collapse: collapse; }
                tr { page-break-inside: avoid; }
            </style>";

            // 2. Limitar tamaño de imágenes Base64 (Previene PDFs corruptos)
            // Si una imagen Base64 supera los 1MB (aprox 1.3M chars), lanzamos advertencia en log
            var matches = Regex.Matches(html, @"src=""data:image/[^;]+;base64,([^""]+)""");
            foreach (Match match in matches)
            {
                if (match.Groups[1].Length > 1500000) // ~1.1 MB
                {
                    _logger.LogWarning("DIITRA Builder: Se detectó una imagen pesada (>1MB). El rendimiento del PDF puede verse afectado.");
                }
            }

            return globalStyles + html;
        }

        /// <summary>
        /// Genera un código de trazabilidad legible para el instituto:
        /// Formato: DIITRA-{CATEGORIA}-{AÑO}-{GUID_CORTO}
        /// Ej: DIITRA-PROTO-2026-A1B2C3D4
        /// </summary>
        private static string GenerateTraceabilityCode(DocumentCategory category)
        {
            var categoryPrefix = category switch
            {
                DocumentCategory.Protocolo => "PROTO",
                DocumentCategory.ActaAprobacion => "ACTA",
                DocumentCategory.InformeAvance => "IAVNC",
                DocumentCategory.InformeFinal => "IFNAL",
                DocumentCategory.TerminosDeReferencia => "TDR",
                DocumentCategory.ProtocoloBioetico => "ETICO",
                DocumentCategory.ConsentimientoInformado => "LOPD",
                DocumentCategory.CesionDerechos => "SNDI",
                DocumentCategory.MatrizIndicadoresCaces => "CACES",
                DocumentCategory.ConvenioMarco => "CONV",
                DocumentCategory.CertificadoParticipacion => "CERT",
                DocumentCategory.ReporteDistributivoCruce => "DISTR",
                DocumentCategory.ReporteAnaliticas => "ANLT",
                _ => "DOC"
            };

            var guid = Guid.NewGuid().ToString("N")[..8].ToUpper();
            return $"DIITRA-{categoryPrefix}-{DateTime.Now.Year}-{guid}";
        }
        
        private static string CalculateHash(byte[] content)
        {
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(content);
            return Convert.ToHexString(hash).ToLower();
        }
    }
}
