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
    /// </summary>
    public class DocumentEngine : IDocumentEngine
    {
        private readonly IDocumentTemplateRepository _templateRepository;
        private readonly IDocumentAuditRepository _auditRepository;
        private readonly Engine.ScribanTemplateEngine _scribanEngine;
        private readonly Engine.ITextHtmlPdfRenderer _pdfRenderer;
        private readonly Engine.PdfMergerService _mergerService;
        private readonly Engine.LegalComplianceInjector _complianceInjector;
        private readonly ILogger<DocumentEngine> _logger;

        public DocumentEngine(
            IDocumentTemplateRepository templateRepository,
            IDocumentAuditRepository auditRepository,
            ILogger<DocumentEngine> logger)
        {
            _templateRepository = templateRepository;
            _auditRepository = auditRepository;
            _scribanEngine = new Engine.ScribanTemplateEngine();
            _pdfRenderer = new Engine.ITextHtmlPdfRenderer();
            _mergerService = new Engine.PdfMergerService();
            _complianceInjector = new Engine.LegalComplianceInjector();
            _logger = logger;
        }

        public async Task<DocumentResult> GenerateAsync(
            DocumentRequest request,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "DIITRA DocumentEngine: Generando [{TemplateCode}] por [{User}] BlindMode={Blind}",
                request.TemplateCode, request.RequestedBy ?? "system", request.IsBlindMode);

            // 1. Obtener la plantilla desde la base de datos
            var template = await _templateRepository.FindByCodeAsync(
                request.TemplateCode, cancellationToken);

            if (template is null || !template.IsActive)
                throw new KeyNotFoundException(
                    $"Plantilla '{request.TemplateCode}' no encontrada o inactiva en el motor DIITRA. " +
                    "Verifique que el Code sea correcto o active la plantilla desde el panel de administración.");

            // 2. Validar modo doble ciego
            if (request.IsBlindMode && !template.SupportsBlindMode)
                throw new InvalidOperationException(
                    $"La plantilla '{template.Name}' no soporta el modo Doble Ciego. " +
                    "Active SupportsBlindMode en la configuración de la plantilla.");

            // 3. Generar código de trazabilidad único
            var traceabilityCode = GenerateTraceabilityCode(template.Category);

            // 4. PASO SCRIBAN: Inyectar datos del DTO en el HTML
            var renderedHtml = await _scribanEngine.RenderAsync(
                template.HtmlContent,
                request.Data,
                request.ExtraVariables,
                request.IsBlindMode);

            // 5. PASO CUMPLIMIENTO LEGAL: Añadir encabezado institucional + pie LOPDP + trazabilidad
            var header = _complianceInjector.BuildInstitutionalHeader(template.Name);
            var enrichedHtml = header + renderedHtml;
            enrichedHtml = _complianceInjector.InjectLegalFooter(
                enrichedHtml, template, traceabilityCode, request.IsBlindMode);

            // 5.1 OPTIMIZACIÓN ENTERPRISE: Procesar imágenes para evitar PDFs pesados o rotos
            enrichedHtml = ProcessAndOptimizeHtml(enrichedHtml);

            // 6. PASO RENDERIZADO: HTML → PDF con iText7
            var pdfBytes = await _pdfRenderer.RenderAsync(enrichedHtml, template.CustomCss);

            // 7. PASO ENSAMBLADO: Si hay anexos, combinar el PDF con ellos (paquetes CACES)
            if (request.AttachmentsToMerge is { Count: > 0 })
            {
                var allDocs = new List<byte[]> { pdfBytes };
                allDocs.AddRange(request.AttachmentsToMerge);
                pdfBytes = await _mergerService.MergeAsync(allDocs);
                _logger.LogInformation(
                    "DIITRA DocumentEngine: [{Code}] ensamblado con {Count} anexo(s).",
                    request.TemplateCode, request.AttachmentsToMerge.Count);
            }

            // 8. AUDITORÍA: Registrar la emisión del documento (obligatorio LOPDP)
            var auditEntry = DocumentAuditEntry.Create(
                traceabilityCode,
                template.Code,
                template.Version,
                template.Category,
                request.RequestedBy,
                request.IsBlindMode);

            await _auditRepository.RegisterEmissionAsync(auditEntry, cancellationToken);

            _logger.LogInformation(
                "DIITRA DocumentEngine: [{Code}] generado exitosamente. Traza: [{Trace}]",
                request.TemplateCode, traceabilityCode);

            return new DocumentResult
            {
                PdfBytes = pdfBytes,
                FileName = $"DIITRA_{template.Code}_v{template.Version}_{DateTime.Now:yyyyMMdd-HHmm}.pdf",
                TraceabilityCode = traceabilityCode,
                TemplateVersion = template.Version,
                WasBlindMode = request.IsBlindMode
            };
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
                table { width: 100% !important; border-collapse: collapse; page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                td, th { border: 1px solid #ddd; padding: 8px; font-size: 10pt; }
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
    }
}
