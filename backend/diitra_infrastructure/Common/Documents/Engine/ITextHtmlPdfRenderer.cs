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
        private static readonly FontProvider _fontProvider;
        private static readonly ConverterProperties _converterProperties;

        static ITextHtmlPdfRenderer()
        {
            _fontProvider = new FontProvider();
            _fontProvider.AddStandardPdfFonts();

            // 1. Cargar fuentes locales del proyecto (Portabilidad total para Producción)
            string localFontsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Fonts");
            if (Directory.Exists(localFontsPath))
            {
                _fontProvider.AddDirectory(localFontsPath);
            }

            // 2. Fallback: Registrar fuentes del sistema Windows (por si faltan en el proyecto)
            string fontsPath = "C:/Windows/Fonts";
            string[] requestedFonts = { 
                "GOTHIC.TTF", "GOTHICB.TTF", "GOTHICI.TTF", "GOTHICBI.TTF", // Century Gothic
                "CALIBRI.TTF", "CALIBRIB.TTF", "CALIBRII.TTF", "CALIBRIZ.TTF", // Calibri
                "TIMES.TTF", "TIMESBD.TTF", "TIMESBI.TTF", "TIMESI.TTF" // Times New Roman
            };

            foreach (var fontFile in requestedFonts)
            {
                var fullPath = System.IO.Path.Combine(fontsPath, fontFile);
                if (File.Exists(fullPath))
                {
                    _fontProvider.AddFont(fullPath);
                }
            }
            
            _converterProperties = new ConverterProperties();
            _converterProperties.SetFontProvider(_fontProvider);
            _converterProperties.SetBaseUri("data://");
        }

        // CSS base institucional DIITRA...
        // (keeping InstitutionalBaseCss as is)
        private const string InstitutionalBaseCss = @"
            * { box-sizing: border-box; }
            
            body {
                font-family: 'Calibri', 'Open Sans', 'Helvetica', 'Arial', sans-serif;
                font-size: 9pt;
                line-height: 1.3;
                color: #1a1a1a;
                margin: 0;
                padding: 0;
            }
            
            /* ── Encabezado Institucional ── */
            .doc-header {
                width: 100%;
                margin-bottom: 10px;
                font-family: 'Century Gothic', 'Helvetica', sans-serif;
            }
            .header-logo {
                height: 50px;
                width: auto;
            }
            
            /* ── Títulos de Sección ── */
            .section-title {
                font-family: 'Century Gothic', 'Helvetica', sans-serif;
                color: #1e2a4a;
                font-size: 11pt;
                font-weight: bold;
                text-transform: uppercase;
                margin: 15px 0 10px 0;
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
                background-color: #1e2a4a;
                color: #ffffff;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 8pt;
                width: 30%;
                font-family: 'Century Gothic', sans-serif;
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
                background-color: #1e2a4a;
                color: #ffffff;
                font-weight: bold;
                text-transform: uppercase;
                padding: 6px;
                font-size: 8.5pt;
                border: 1px solid #000;
                font-family: 'Century Gothic', sans-serif;
            }
            table.data-table td {
                border: 1px solid #000;
                padding: 5px;
                font-size: 8.5pt;
            }
            
            /* ── Fila de Fechas (Gold) ── */
            tr.date-row td {
                background-color: #b8912e !important;
                color: #000;
                font-weight: bold;
                text-align: center;
                font-size: 7.5pt;
                text-transform: uppercase;
                font-family: 'Century Gothic', sans-serif;
            }
            
            /* ── Firma Electrónica ── */
            .firmas-container {
                width: 100%;
                margin-top: 30px;
            }
            .firma-box {
                border: 1px solid #000;
                padding: 10px;
                text-align: center;
                min-height: 80px;
                width: 48%;
                display: inline-block;
            }
            
            /* ── Configuración de Página ── */
            @page {
                margin: 1cm 1.5cm 1.5cm 1.5cm;
                @bottom-right {
                    content: counter(page);
                    font-size: 8pt;
                }
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

            int landscapeStartIndex = cleanedHtmlContent.IndexOf("<div class=\"landscape-section\"", StringComparison.OrdinalIgnoreCase);
            int bibliographyIndex = -1;
            if (landscapeStartIndex != -1)
            {
                bibliographyIndex = cleanedHtmlContent.IndexOf("<div class=\"section-title\">8. BIBLIOGRAFÍA", StringComparison.OrdinalIgnoreCase);
                if (bibliographyIndex == -1)
                {
                    bibliographyIndex = cleanedHtmlContent.IndexOf("<div class=\"section-title\">8. BIBLIOGRAFIA", StringComparison.OrdinalIgnoreCase);
                }
            }

            if (landscapeStartIndex != -1 && bibliographyIndex > landscapeStartIndex)
            {
                try
                {
                    Console.WriteLine("[DIITRA Renderer] Detected landscape section. Rendering in split mode.");
                    
                    // Split the HTML content
                    string part1Html = cleanedHtmlContent.Substring(0, landscapeStartIndex) + "</div>";
                    string part2Html = cleanedHtmlContent.Substring(landscapeStartIndex, bibliographyIndex - landscapeStartIndex);
                    string part3Html = "<div class=\"doc-container\">" + cleanedHtmlContent.Substring(bibliographyIndex);

                    // Render Part 1 (Portrait)
                    byte[] pdfBytes1 = await RenderPartAsync(part1Html, PageSize.A4, metadata, mergedCss, 0);
                    int pageCount1 = GetPageCount(pdfBytes1);
                    Console.WriteLine($"[DIITRA Renderer] Part 1 (Portrait) rendered: {pageCount1} pages");

                    // Render Part 2 (Landscape)
                    byte[] pdfBytes2 = await RenderPartAsync(part2Html, PageSize.A4.Rotate(), metadata, mergedCss, pageCount1);
                    int pageCount2 = GetPageCount(pdfBytes2);
                    Console.WriteLine($"[DIITRA Renderer] Part 2 (Landscape) rendered: {pageCount2} pages");

                    // Render Part 3 (Portrait)
                    byte[] pdfBytes3 = await RenderPartAsync(part3Html, PageSize.A4, metadata, mergedCss, pageCount1 + pageCount2);
                    int pageCount3 = GetPageCount(pdfBytes3);
                    Console.WriteLine($"[DIITRA Renderer] Part 3 (Portrait) rendered: {pageCount3} pages");

                    // Merge PDFs
                    var merger = new PdfMergerService();
                    var mergedPdfBytes = await merger.MergeAsync(new[] { pdfBytes1, pdfBytes2, pdfBytes3 });
                    
                    Console.WriteLine($"[DIITRA Renderer] Successfully merged split PDFs. Total pages: {pageCount1 + pageCount2 + pageCount3}");
                    return mergedPdfBytes;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA Renderer] Error in split rendering: {ex.Message}. Falling back to standard rendering.");
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
                            tempPdf.SetDefaultPageSize(PageSize.A4);
                            using (var tempDoc = HtmlConverter.ConvertToDocument(fullHtml, tempPdf, _converterProperties))
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
            pdfDocument.SetDefaultPageSize(PageSize.A4);

            // ── NUEVO: Registro de Eventos Globales (Encabezados/Pies/Marcas de Agua) ──
            var handler = new DocumentEventHandler(
                metadata.TraceabilityCode,
                isDraft: metadata.IsDraft,
                stationaryImageBase64: metadata.StationaryImageBase64,
                stationaryImageData: metadata.StationaryImageData,
                verificationBaseUrl: metadata.VerificationBaseUrl,
                cronogramaPage: cronogramaPage
            );

            try 
            {
                pdfDocument.AddEventHandler(PdfDocumentEvent.START_PAGE, handler);
                pdfDocument.AddEventHandler(PdfDocumentEvent.END_PAGE, handler);

                HtmlConverter.ConvertToPdf(fullHtml, pdfDocument, _converterProperties);

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
                // Eliminar la regla @page:first de la portada para evitar que las partes 2 y 3 (Gantt y Bibliografía) se rendericen sin márgenes (pegados al borde)
                customCss = System.Text.RegularExpressions.Regex.Replace(
                    customCss ?? "",
                    @"@page\s*:\s*first\s*\{[^}]*\}",
                    string.Empty,
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Singleline
                );
            }

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
                pageOffset: pageOffset
            );

            pdfDocument.AddEventHandler(PdfDocumentEvent.START_PAGE, handler);
            pdfDocument.AddEventHandler(PdfDocumentEvent.END_PAGE, handler);

            HtmlConverter.ConvertToPdf(fullHtml, pdfDocument, _converterProperties);

            pdfDocument.Close();
            return await Task.FromResult(outputStream.ToArray());
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
    }
}
