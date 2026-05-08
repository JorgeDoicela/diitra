using Diitra.Application.Common.Documents;
using Diitra.Application.Common;
using Diitra.Domain.Common.Documents;
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
        private readonly ScribanTemplateEngine _scribanEngine;
        private readonly ITextHtmlPdfRenderer _pdfRenderer;
        private readonly PdfMergerService _mergerService;
        private readonly LegalComplianceInjector _complianceInjector;
        private readonly ILogger<DocumentEngine> _logger;

        public DocumentEngine(
            IDocumentTemplateRepository templateRepository,
            IDocumentAuditRepository auditRepository,
            ILogger<DocumentEngine> logger)
        {
            _templateRepository = templateRepository;
            _auditRepository = auditRepository;
            _scribanEngine = new ScribanTemplateEngine();
            _pdfRenderer = new ITextHtmlPdfRenderer();
            _mergerService = new PdfMergerService();
            _complianceInjector = new LegalComplianceInjector();
            _logger = logger;
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

                // 1. Obtener y Sincronizar Plantilla
                var template = await _templateRepository.FindByCodeAsync(request.TemplateCode, cancellationToken);
                if (template == null || !template.IsActive)
                {
                    var seed = DocumentTemplateSeed.GetByCode(request.TemplateCode);
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
                    var seed = DocumentTemplateSeed.GetByCode(request.TemplateCode);
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

                // 3. Orquestar Datos
                var renderedHtml = await _scribanEngine.RenderAsync(template.HtmlContent, request.Data, null, request.IsBlindMode);
                
                // 4. Optimizar HTML (Inyectar estilos base y sanitizar imágenes)
                var optimizedHtml = ProcessAndOptimizeHtml(renderedHtml);

                // 5. Inyectar Cumplimiento Legal (Header/Footer, QR, Traceability)
                var finalHtml = _complianceInjector.InjectLegalFooter(optimizedHtml, template, traceabilityCode, request.IsBlindMode);

                // 5. Renderizado a PDF
                var pdfBytes = await _pdfRenderer.RenderWithMetadataAsync(finalHtml, new DocumentRenderingMetadata
                {
                    TraceabilityCode = traceabilityCode,
                    IsDraft = request.IsDraftMode
                }, template.CustomCss);

                // 6. Sello de Integridad (SHA-256)
                var fileHash = CalculateHash(pdfBytes);

                // 7. Auditoría
                var fileName = $"DIITRA_{template.Code}_v{template.Version}_{DateTime.Now:yyyyMMdd-HHmm}.pdf";
                try 
                {
                    var auditEntry = DocumentAuditEntry.Create(
                        traceabilityCode, template.Code, template.Version, template.Category,
                        request.RequestedBy ?? "sistema", request.IsBlindMode, fileName,
                        request.ProjectUuid, request.EntityUuid, fileHash);

                    await _auditRepository.RegisterEmissionAsync(auditEntry, cancellationToken);
                }
                catch (Exception ex) { _logger.LogError(ex, "DIITRA DocumentEngine: Error en auditoría."); }

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
