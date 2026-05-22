using iText.Html2pdf;
using iText.Html2pdf.Resolver.Font;
using iText.IO.Font;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Event;
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
            string localFontsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Fonts");
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
                var fullPath = Path.Combine(fontsPath, fontFile);
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
                size: A4;
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
            var fullHtml = WrapInFullHtmlDocument(htmlContent, customCss);

            using var outputStream = new MemoryStream();
            using var pdfWriter = new PdfWriter(outputStream);
            using var pdfDocument = new PdfDocument(pdfWriter);

            // ── NUEVO: Registro de Eventos Globales (Encabezados/Pies/Marcas de Agua) ──
            var handler = new DocumentEventHandler(
                metadata.TraceabilityCode,
                isDraft: metadata.IsDraft,
                stationaryImageBase64: metadata.StationaryImageBase64,
                stationaryImageData: metadata.StationaryImageData,
                verificationBaseUrl: metadata.VerificationBaseUrl
            );

            try 
            {
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

        private static string WrapInFullHtmlDocument(string bodyContent, string? customCss)
        {
            return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <style>
        {InstitutionalBaseCss}
        {(customCss ?? string.Empty)}
    </style>
</head>
<body>
    <div class=""document-body"">
        {bodyContent}
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
