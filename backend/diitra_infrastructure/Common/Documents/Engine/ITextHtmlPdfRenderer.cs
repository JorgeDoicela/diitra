using iText.Html2pdf;
using iText.Html2pdf.Resolver.Font;
using iText.IO.Font;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Event;
using iText.Kernel.Geom;
using iText.Layout.Font;
using System.Text;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Motor de conversión HTML → PDF usando iText7 pdfHTML.
    /// iText7 es la opción más robusta para el sector legal/gubernamental:
    /// soporta CSS avanzado, fuentes embebidas, y produce PDFs/A (archivos permanentes).
    /// </summary>
    public class ITextHtmlPdfRenderer
    {
        // ── Thread-Safety: Professional Pattern ──────────────────────────────────────────────
        // iText's FontProvider is NOT thread-safe: its internal FontSelectorCache writes to a
        // plain Dictionary<> during rendering, causing concurrent corruption.
        //
        // Professional solution: cache the raw font file BYTES once at startup (immutable after
        // init → zero contention), then build a fresh FontProvider per render call from those
        // cached bytes. No shared mutable state, no locks, full parallelism.
        //
        // Compared to alternatives:
        //   ✗ SemaphoreSlim(1,1)        — serializes all rendering, limits throughput
        //   ✗ Static shared FontProvider — shared mutable cache → thread corruption
        //   ✓ Per-render FontProvider    — isolated state, no contention, parallelism-safe
        // ─────────────────────────────────────────────────────────────────────────────────────
        private static readonly IReadOnlyList<byte[]> _cachedFontBytes;

        static ITextHtmlPdfRenderer()
        {
            var fontBytes = new List<byte[]>();

            // 1. Cargar fuentes locales del proyecto (Portabilidad total para Producción)
            string localFontsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Fonts");
            if (Directory.Exists(localFontsPath))
            {
                foreach (var file in Directory.GetFiles(localFontsPath, "*.ttf", SearchOption.AllDirectories))
                {
                    try { fontBytes.Add(File.ReadAllBytes(file)); } catch { /* skip unreadable */ }
                }
                foreach (var file in Directory.GetFiles(localFontsPath, "*.otf", SearchOption.AllDirectories))
                {
                    try { fontBytes.Add(File.ReadAllBytes(file)); } catch { /* skip unreadable */ }
                }
            }

            // 2. Fallback: fuentes del sistema Windows (leídas a bytes una sola vez al arrancar)
            string fontsPath = "C:/Windows/Fonts";
            string[] requestedFonts = { 
                "GOTHIC.TTF", "GOTHICB.TTF", "GOTHICI.TTF", "GOTHICBI.TTF", // Century Gothic
                "CALIBRI.TTF", "CALIBRIB.TTF", "CALIBRII.TTF", "CALIBRIZ.TTF", // Calibri
                "TIMES.TTF", "TIMESBD.TTF", "TIMESBI.TTF", "TIMESI.TTF"       // Times New Roman
            };
            foreach (var fontFile in requestedFonts)
            {
                var fullPath = System.IO.Path.Combine(fontsPath, fontFile);
                if (File.Exists(fullPath))
                {
                    try { fontBytes.Add(File.ReadAllBytes(fullPath)); } catch { /* skip unreadable */ }
                }
            }

            _cachedFontBytes = fontBytes.AsReadOnly();
        }

        /// <summary>
        /// Crea un FontProvider fresco por llamada usando bytes de fuentes pre-cargados en memoria.
        /// Los bytes son inmutables (cargados una sola vez al iniciar la app), por lo que
        /// este método es completamente thread-safe y no requiere ningún tipo de lock.
        /// </summary>
        private static FontProvider CreateFontProvider()
        {
            var fp = new FontProvider();
            fp.AddStandardPdfFonts();
            foreach (var bytes in _cachedFontBytes)
            {
                fp.AddFont(bytes);
            }
            return fp;
        }

        // CSS base institucional DIITRA (Reset neutro guiado por el esquema de temas dinámicos)
        private const string InstitutionalBaseCss = @"
            * { box-sizing: border-box; }
            
            body {
                font-family: inherit;
                font-size: 9pt;
                line-height: 1.3;
                color: inherit;
                margin: 0;
                padding: 0;
            }
            
            /* ── Encabezado Institucional ── */
            .doc-header {
                width: 100%;
                margin-bottom: 10px;
            }
            .header-logo {
                height: 50px;
                width: auto;
            }
            
            /* ── Títulos de Sección y Prevención de Encabezados Huérfanos ── */
            .section-title, .title-h1, .title-h2, .title-h3, .title-h4, .doc-section-header {
                font-size: 11pt;
                font-weight: bold;
                text-transform: uppercase;
                margin: 15px 0 10px 0;
                break-after: avoid !important;
                page-break-after: avoid !important;
            }
            
            /* ── Tablas Institucionales y Repetición de Cabeceras ── */
            thead {
                display: table-header-group !important;
                break-inside: avoid;
                page-break-inside: avoid;
            }
            tfoot {
                display: table-footer-group !important;
            }
            tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* ── Tablas de Identificación (Info) ── */
            table.info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            table.info-table td {
                border: 1px solid #000;
                padding: 5px 8px;
                vertical-align: middle;
            }
            table.info-table td.label {
                font-weight: bold;
                text-transform: uppercase;
                font-size: 8pt;
                width: 30%;
            }
            table.info-table td.value {
                background-color: #ffffff;
            }
            
            /* ── Tablas de Datos (Zonas Destacadas) ── */
            table.data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            table.data-table th {
                font-weight: bold;
                text-transform: uppercase;
                padding: 6px;
                font-size: 8.5pt;
                border: 1px solid #000;
            }
            table.data-table td {
                border: 1px solid #000;
                padding: 5px;
                font-size: 8.5pt;
            }
            
            /* ── Firma Electrónica y Cajas Indivisibles ── */
            .firmas-container, .signatures-row {
                width: 100%;
                margin-top: 30px;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .firma-box, .sig-box {
                border: 1px solid #000;
                padding: 10px;
                text-align: center;
                min-height: 80px;
                width: 48%;
                display: inline-block;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* ── Salto de Página Canónico W3C ── */
            .page-break {
                break-after: page !important;
                page-break-after: always !important;
                height: 0 !important;
                line-height: 0 !important;
                font-size: 0 !important;
                clear: both;
            }
            .keep-together {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
        ";

        public async Task<byte[]> RenderAsync(string htmlContent, string? customCss = null)
        {
            return await RenderWithMetadataAsync(htmlContent, new DocumentRenderingMetadata { 
                TraceabilityCode = "PENDIENTE",
                IsDraft = true 
            }, customCss);
        }

        public async Task<byte[]> RenderWithMetadataAsync(
            string htmlContent, 
            DocumentRenderingMetadata metadata, 
            string? customCss = null)
        {
            var extractedStyles = new StringBuilder();

            string cleanedHtmlContent = System.Text.RegularExpressions.Regex.Replace(htmlContent, @"<style[^>]*>(.*?)</style>", m => {
                extractedStyles.AppendLine(m.Groups[1].Value);
                return string.Empty;
            }, System.Text.RegularExpressions.RegexOptions.Singleline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            string mergedCss = (string.IsNullOrEmpty(customCss) ? "" : customCss + "\n") + extractedStyles.ToString();

            // Normalización defensiva para evitar fallos de iText con porcentajes escapados en CSS/HTML
            mergedCss = System.Text.RegularExpressions.Regex.Replace(mergedCss, @"\\%", "%");
            cleanedHtmlContent = System.Text.RegularExpressions.Regex.Replace(cleanedHtmlContent, @"\\%", "%");

            // ── Detección de orientación global del documento (A4 Landscape) ──
            bool isDocumentGloballyLandscape = 
                mergedCss.Contains("size: A4 landscape", StringComparison.OrdinalIgnoreCase) ||
                cleanedHtmlContent.Contains("data-document-orientation=\"landscape\"", StringComparison.OrdinalIgnoreCase) ||
                cleanedHtmlContent.Contains("data-document-orientation='landscape'", StringComparison.OrdinalIgnoreCase);

            var defaultDocumentPageSize = isDocumentGloballyLandscape ? PageSize.A4.Rotate() : PageSize.A4;

            // ── Segmentación dinámica desacoplada para secciones con orientación mixta ──
            var docParts = SplitDocumentParts(cleanedHtmlContent, isDocumentGloballyLandscape);
            bool hasMixedOrientations = docParts.Any(p => p.IsLandscape != isDocumentGloballyLandscape);

            if (hasMixedOrientations)
            {
                try
                {
                    Console.WriteLine($"[DIITRA Renderer] Detected {docParts.Count} document part(s) with mixed orientation section(s). Rendering in dynamic multi-part mode.");

                    var renderedParts = new List<byte[]>();
                    int accumulatedPages = 0;

                    for (int pIdx = 0; pIdx < docParts.Count; pIdx++)
                    {
                        var part = docParts[pIdx];
                        var partPageSize = part.IsLandscape ? PageSize.A4.Rotate() : PageSize.A4;
                        string partName = part.IsLandscape ? "Landscape" : "Portrait";

                        byte[] partBytes = await RenderPartAsync(part.Html, partPageSize, metadata, mergedCss, accumulatedPages);
                        int partPages = GetPageCount(partBytes);
                        Console.WriteLine($"[DIITRA Renderer] Part {pIdx + 1} ({partName}) rendered: {partPages} pages (offset: {accumulatedPages})");

                        accumulatedPages += partPages;
                        renderedParts.Add(partBytes);
                    }

                    var merger = new PdfMergerService();
                    var mergedPdfBytes = await merger.MergeAsync(renderedParts.ToArray());

                    Console.WriteLine($"[DIITRA Renderer] Successfully merged {renderedParts.Count} parts. Total pages: {accumulatedPages}");
                    return mergedPdfBytes;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA Renderer] Error in dynamic multi-part rendering: {ex.Message}. Falling back to standard rendering.");
                }
            }

            // --- FALLBACK (Original Standard Rendering) ---
            var fullHtml = WrapInFullHtmlDocument(cleanedHtmlContent, mergedCss);

            // ── NUEVO: Detección dinámica de página del cronograma (Dry-run) ──
            int cronogramaPage = 5; // Valor por defecto / fallback
            try
            {
                using (var tempStream = new MemoryStream())
                {
                    using (var tempWriter = new PdfWriter(tempStream))
                    {
                        using (var tempPdf = new PdfDocument(tempWriter))
                        {
                            tempPdf.SetDefaultPageSize(defaultDocumentPageSize);
                            using (var tempDoc = HtmlConverter.ConvertToDocument(fullHtml, tempPdf, CreateConverterProperties()))
                            {
                                int numPages = tempPdf.GetNumberOfPages();
                                for (int i = 1; i <= numPages; i++)
                                {
                                    var page = tempPdf.GetPage(i);
                                    try
                                    {
                                        var text = iText.Kernel.Pdf.Canvas.Parser.PdfTextExtractor.GetTextFromPage(page);
                                        if (text.Contains("7. CRONOGRAMA DE ACTIVIDADES") || text.Contains("CRONOGRAMA DE ACTIVIDADES"))
                                        {
                                            cronogramaPage = i;
                                            Console.WriteLine($"[DIITRA Renderer] Cronograma detectado dinámicamente en la página: {cronogramaPage}");
                                            break;
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine($"[DIITRA Renderer] Error al extraer texto de la página {i}: {ex.Message}");
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIITRA Renderer dry-run error]: {ex.Message}");
            }

            using var outputStream = new MemoryStream();
            using var pdfWriter = new PdfWriter(outputStream);
            using var pdfDocument = new PdfDocument(pdfWriter);
            pdfDocument.SetDefaultPageSize(defaultDocumentPageSize);

            bool hasCoverPage = cleanedHtmlContent.Contains("class=\"cover-page\"") || cleanedHtmlContent.Contains("class='cover-page'") || cleanedHtmlContent.Contains("class=\"cover-page ");

            // ── NUEVO: Registro de Eventos Globales (Encabezados/Pies/Marcas de Agua) ──
            var handler = new DocumentEventHandler(
                metadata.TraceabilityCode,
                isDraft: metadata.IsDraft,
                stationaryImageBase64: metadata.StationaryImageBase64,
                stationaryImageData: metadata.StationaryImageData,
                verificationBaseUrl: metadata.VerificationBaseUrl,
                cronogramaPage: cronogramaPage,
                isBlindMode: metadata.IsBlindMode,
                hasCoverPage: hasCoverPage,
                documentCode: metadata.DocumentCode
            );

            try 
            {
                pdfDocument.AddEventHandler(PdfDocumentEvent.START_PAGE, handler);
                pdfDocument.AddEventHandler(PdfDocumentEvent.END_PAGE, handler);

                HtmlConverter.ConvertToPdf(fullHtml, pdfDocument, CreateConverterProperties());

                pdfDocument.Close();
                return await Task.FromResult(outputStream.ToArray());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[iText9 Renderer Error]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw;
            }
        }

        private async Task<byte[]> RenderPartAsync(
            string htmlPart,
            PageSize defaultPageSize,
            DocumentRenderingMetadata metadata,
            string? customCss,
            int pageOffset)
        {
            if (pageOffset > 0)
            {
                // Eliminar la regla @page:first de la portada para evitar que las partes subsiguientes se rendericen sin márgenes
                customCss = System.Text.RegularExpressions.Regex.Replace(
                    customCss ?? "",
                    @"@page\s*:\s*first\s*\{[^}]*\}",
                    string.Empty,
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Singleline
                );
            }

            // Sincronizar regla @page size en CSS con la orientación explícita de esta parte
            bool isPartLandscape = defaultPageSize.GetWidth() > defaultPageSize.GetHeight();
            string targetOrientation = isPartLandscape ? "landscape" : "portrait";
            string oppositeOrientation = isPartLandscape ? "portrait" : "landscape";

            customCss = System.Text.RegularExpressions.Regex.Replace(
                customCss ?? "",
                $@"size\s*:\s*A4\s+{oppositeOrientation}",
                $"size: A4 {targetOrientation}",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            var fullHtml = WrapInFullHtmlDocument(htmlPart, customCss);

            using var outputStream = new MemoryStream();
            using var pdfWriter = new PdfWriter(outputStream);
            using var pdfDocument = new PdfDocument(pdfWriter);
            pdfDocument.SetDefaultPageSize(defaultPageSize);

            var handler = new DocumentEventHandler(
                metadata.TraceabilityCode,
                isDraft: metadata.IsDraft,
                stationaryImageBase64: metadata.StationaryImageBase64,
                stationaryImageData: metadata.StationaryImageData,
                verificationBaseUrl: metadata.VerificationBaseUrl,
                cronogramaPage: -999,
                pageOffset: pageOffset,
                isBlindMode: metadata.IsBlindMode,
                documentCode: metadata.DocumentCode
            );

            pdfDocument.AddEventHandler(PdfDocumentEvent.START_PAGE, handler);
            pdfDocument.AddEventHandler(PdfDocumentEvent.END_PAGE, handler);

            HtmlConverter.ConvertToPdf(fullHtml, pdfDocument, CreateConverterProperties());

            pdfDocument.Close();
            return await Task.FromResult(outputStream.ToArray());
        }

        /// <summary>
        /// Crea una instancia fresca de ConverterProperties por llamada, incluyendo un
        /// FontProvider aislado construido desde bytes pre-cargados en memoria.
        /// Garantiza cero estado mutable compartido entre renders concurrentes.
        /// </summary>
        private static ConverterProperties CreateConverterProperties()
        {
            var props = new ConverterProperties();
            props.SetFontProvider(CreateFontProvider());
            props.SetBaseUri("data://");
            return props;
        }

        private int GetPageCount(byte[] pdfBytes)
        {
            if (pdfBytes == null || pdfBytes.Length == 0) return 0;
            try
            {
                using var readerStream = new MemoryStream(pdfBytes);
                using var reader = new PdfReader(readerStream);
                using var pdf = new PdfDocument(reader);
                return pdf.GetNumberOfPages();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIITRA Renderer] Error getting page count: {ex.Message}");
                return 0;
            }
        }

        private static string WrapInFullHtmlDocument(string bodyContent, string? customCss)
        {
            var stylesBuilder = new StringBuilder();
            stylesBuilder.AppendLine(InstitutionalBaseCss);
            if (!string.IsNullOrEmpty(customCss))
            {
                stylesBuilder.AppendLine(customCss);
            }

            // Extraer bloques <style>...</style> del bodyContent para colocarlos en el <head>
            // de modo que pdfHTML los procese con prioridad global (especialmente reglas @page)
            string cleanBody = System.Text.RegularExpressions.Regex.Replace(bodyContent, @"<style[^>]*>(.*?)</style>", m => {
                stylesBuilder.AppendLine(m.Groups[1].Value);
                return string.Empty;
            }, System.Text.RegularExpressions.RegexOptions.Singleline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            bool hasCoverPage = cleanBody.Contains("class=\"cover-page\"") || cleanBody.Contains("class='cover-page'") || cleanBody.Contains("class=\"cover-page ");

            if (hasCoverPage)
            {
                cleanBody = System.Text.RegularExpressions.Regex.Replace(cleanBody, @"^(\s*<!--.*?-->\s*)*", string.Empty, System.Text.RegularExpressions.RegexOptions.Singleline);
            }

            // Regla maestra de gobernanza de maquetación (máxima prioridad CSS):
            stylesBuilder.AppendLine(@"
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .document-body, .doc-container {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                @page {
                    margin-top: 3cm;
                    margin-bottom: 2cm;
                    margin-left: 2cm;
                    margin-right: 2cm;
                }
                .section-title, .title-h1, .title-h2, .title-h3, .title-h4, .doc-section-header {
                    break-after: avoid !important;
                    page-break-after: avoid !important;
                }
                thead {
                    display: table-header-group !important;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                tfoot {
                    display: table-footer-group !important;
                }
                tr {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
                .keep-together, .sig-box, .firma-box, .signatures-row, .firmas-container {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
                .page-break {
                    break-after: page !important;
                    page-break-after: always !important;
                    height: 0 !important;
                    line-height: 0 !important;
                    font-size: 0 !important;
                    clear: both;
                }
                p, .rich-content {
                    orphans: 3;
                    widows: 3;
                }
            ");

            if (hasCoverPage)
            {
                stylesBuilder.AppendLine(@"
                    @page:first {
                        margin: 0 !important;
                    }
                    .cover-page {
                        position: relative !important;
                        display: block !important;
                        width: 210mm !important;
                        height: 296.5mm !important;
                        min-height: 296.5mm !important;
                        max-height: 296.5mm !important;
                        box-sizing: border-box !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                        page-break-inside: avoid !important;
                        page-break-after: always !important;
                    }
                    .cover-page > div {
                        max-height: 270mm !important;
                        overflow: hidden !important;
                    }
                ");
            }

            return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <style>
        {stylesBuilder}
    </style>
</head>
<body>
    <div class=""document-body"">
        {cleanBody}
    </div>
</body>
</html>";
        }

        private struct HtmlDocumentPart
        {
            public string Html { get; set; }
            public bool IsLandscape { get; set; }
        }

        private static List<HtmlDocumentPart> SplitDocumentParts(string cleanedHtmlContent, bool isDocumentGloballyLandscape = false)
        {
            var parts = new List<HtmlDocumentPart>();
            int currentIndex = 0;

            while (currentIndex < cleanedHtmlContent.Length)
            {
                // Detección de sección landscape
                int landscapeMarker = cleanedHtmlContent.IndexOf("<!-- START_LANDSCAPE_SECTION -->", currentIndex, StringComparison.OrdinalIgnoreCase);
                int landscapeDiv = cleanedHtmlContent.IndexOf("<div class=\"landscape-section\"", currentIndex, StringComparison.OrdinalIgnoreCase);
                if (landscapeDiv == -1) landscapeDiv = cleanedHtmlContent.IndexOf("<div class='landscape-section'", currentIndex, StringComparison.OrdinalIgnoreCase);

                int nextLandscapeStart = -1;
                if (landscapeMarker != -1 && (landscapeDiv == -1 || landscapeMarker <= landscapeDiv))
                    nextLandscapeStart = landscapeMarker;
                else if (landscapeDiv != -1)
                    nextLandscapeStart = landscapeDiv;

                // Detección de sección portrait
                int portraitMarker = cleanedHtmlContent.IndexOf("<!-- START_PORTRAIT_SECTION -->", currentIndex, StringComparison.OrdinalIgnoreCase);
                int portraitDiv = cleanedHtmlContent.IndexOf("<div class=\"portrait-section\"", currentIndex, StringComparison.OrdinalIgnoreCase);
                if (portraitDiv == -1) portraitDiv = cleanedHtmlContent.IndexOf("<div class='portrait-section'", currentIndex, StringComparison.OrdinalIgnoreCase);

                int nextPortraitStart = -1;
                if (portraitMarker != -1 && (portraitDiv == -1 || portraitMarker <= portraitDiv))
                    nextPortraitStart = portraitMarker;
                else if (portraitDiv != -1)
                    nextPortraitStart = portraitDiv;

                // Determinar si hay alguna sección especial
                bool hasLandscape = nextLandscapeStart != -1;
                bool hasPortrait = nextPortraitStart != -1;

                if (!hasLandscape && !hasPortrait)
                {
                    string remaining = cleanedHtmlContent.Substring(currentIndex).Trim();
                    if (!string.IsNullOrWhiteSpace(remaining))
                    {
                        if (currentIndex > 0 && !remaining.Contains("doc-container", StringComparison.OrdinalIgnoreCase) && cleanedHtmlContent.Contains("doc-container", StringComparison.OrdinalIgnoreCase))
                        {
                            remaining = $"<div class=\"doc-container\">{remaining}";
                        }
                        parts.Add(new HtmlDocumentPart { Html = remaining, IsLandscape = isDocumentGloballyLandscape });
                    }
                    break;
                }

                bool isNextSectionLandscape = false;
                int sectionStart = -1;

                if (hasLandscape && hasPortrait)
                {
                    if (nextLandscapeStart <= nextPortraitStart)
                    {
                        isNextSectionLandscape = true;
                        sectionStart = nextLandscapeStart;
                    }
                    else
                    {
                        isNextSectionLandscape = false;
                        sectionStart = nextPortraitStart;
                    }
                }
                else if (hasLandscape)
                {
                    isNextSectionLandscape = true;
                    sectionStart = nextLandscapeStart;
                }
                else
                {
                    isNextSectionLandscape = false;
                    sectionStart = nextPortraitStart;
                }

                // Contenido previo a la sección (hereda la orientación global del documento)
                if (sectionStart > currentIndex)
                {
                    string priorPart = cleanedHtmlContent.Substring(currentIndex, sectionStart - currentIndex).Trim();
                    if (!string.IsNullOrWhiteSpace(priorPart))
                    {
                        if (currentIndex > 0 && !priorPart.Contains("doc-container", StringComparison.OrdinalIgnoreCase) && cleanedHtmlContent.Contains("doc-container", StringComparison.OrdinalIgnoreCase))
                        {
                            priorPart = $"<div class=\"doc-container\">{priorPart}";
                        }
                        if (priorPart.Contains("doc-container", StringComparison.OrdinalIgnoreCase) && !priorPart.EndsWith("</div>", StringComparison.OrdinalIgnoreCase))
                        {
                            priorPart = $"{priorPart}</div>";
                        }
                        parts.Add(new HtmlDocumentPart { Html = priorPart, IsLandscape = isDocumentGloballyLandscape });
                    }
                }

                // Localizar el cierre de la sección
                string endMarkerText = isNextSectionLandscape ? "<!-- END_LANDSCAPE_SECTION -->" : "<!-- END_PORTRAIT_SECTION -->";
                int markerEnd = cleanedHtmlContent.IndexOf(endMarkerText, sectionStart, StringComparison.OrdinalIgnoreCase);
                int sectionEnd = -1;

                if (markerEnd != -1)
                {
                    sectionEnd = markerEnd + endMarkerText.Length;
                }
                else
                {
                    int closeDiv = cleanedHtmlContent.IndexOf("</div>", sectionStart, StringComparison.OrdinalIgnoreCase);
                    if (closeDiv != -1)
                    {
                        sectionEnd = closeDiv + 6;
                    }
                    else
                    {
                        sectionEnd = cleanedHtmlContent.Length;
                    }
                }

                string sectionHtml = cleanedHtmlContent.Substring(sectionStart, sectionEnd - sectionStart).Trim();
                if (!string.IsNullOrWhiteSpace(sectionHtml))
                {
                    parts.Add(new HtmlDocumentPart { Html = sectionHtml, IsLandscape = isNextSectionLandscape });
                }

                currentIndex = sectionEnd;
            }

            return parts;
        }
    }

    public class DocumentRenderingMetadata
    {
        public string TraceabilityCode { get; set; } = string.Empty;
        public bool IsDraft { get; set; } = false;
        public string? InstitutionName { get; set; }
        public string? LopdpClause { get; set; }
        public string? StationaryImageBase64 { get; set; }
        public iText.IO.Image.ImageData? StationaryImageData { get; set; }
        public string? VerificationBaseUrl { get; set; }
        public bool IsBlindMode { get; set; } = false;
        public string? DocumentCode { get; set; }
    }
}
