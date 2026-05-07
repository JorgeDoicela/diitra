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
        // CSS base institucional DIITRA. Aplicado a todos los documentos para garantizar
        // consistencia de marca sin depender de internet (crítico para entornos de institutos).
        private const string InstitutionalBaseCss = @"
            * { box-sizing: border-box; }
            
            body {
                font-family: 'Helvetica', 'Arial', sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #1a1a1a;
                margin: 0;
                padding: 0;
            }
            
            /* ── Encabezado Institucional (Tabla para compatibilidad) ── */
            .diitra-header {
                width: 100%;
                border-bottom: 3px solid #1a3a6b;
                padding-bottom: 12px;
                margin-bottom: 20px;
            }
            .header-table { width: 100%; }
            .header-table td { vertical-align: bottom; }
            .diitra-header .inst-name {
                font-size: 13pt;
                font-weight: bold;
                color: #1a3a6b;
                text-transform: uppercase;
            }
            .diitra-header .inst-sub {
                font-size: 9pt;
                color: #555;
                margin-top: 2px;
            }
            .diitra-header .brand-block {
                background-color: #1a3a6b;
                color: white;
                font-weight: bold;
                font-size: 14pt;
                padding: 8px 16px;
                text-align: center;
                letter-spacing: 2px;
            }
            
            /* ── Título del documento ── */
            .doc-title {
                text-align: center;
                font-size: 13pt;
                font-weight: bold;
                text-transform: uppercase;
                color: #1a3a6b;
                margin: 15px 0 5px 0;
            }
            .doc-subtitle {
                text-align: center;
                font-size: 10pt;
                color: #444;
                margin-bottom: 20px;
            }
            
            /* ── Secciones ── */
            .section-title {
                background-color: #f0f4f8;
                border-left: 4px solid #1a3a6b;
                padding: 6px 10px;
                font-weight: bold;
                font-size: 10pt;
                color: #1a3a6b;
                text-transform: uppercase;
                margin: 18px 0 8px 0;
                page-break-after: avoid;
            }
            
            /* ── Tablas de datos ── */
            table.data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9pt;
                margin-bottom: 12px;
            }
            table.data-table th {
                background-color: #1a3a6b;
                color: white;
                padding: 6px 8px;
                text-align: left;
                font-weight: bold;
            }
            table.data-table td {
                padding: 5px 8px;
                border: 1px solid #dde2e8;
                vertical-align: top;
            }
            table.data-table tr:nth-child(even) td {
                background-color: #f7f9fc;
            }
            table.info-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9.5pt;
            }
            table.info-table td {
                padding: 4px 8px;
                border: 1px solid #dde2e8;
            }
            table.info-table td:first-child {
                background-color: #f0f4f8;
                font-weight: bold;
                width: 35%;
                color: #333;
            }
            
            /* ── Campos de texto largo ── */
            .text-field {
                border: 1px solid #d0d7e2;
                padding: 10px;
                min-height: 40px;
                margin-bottom: 8px;
                font-size: 9.5pt;
                line-height: 1.4;
                background-color: #fafbfd;
                page-break-inside: auto;
            }
            .field-label {
                font-size: 8pt;
                font-weight: bold;
                color: #555;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 3px;
            }
            
            /* ── Bloque de Firma Electrónica FirmaEC (Tabla para compatibilidad) ── */
            .firmas-row {
                width: 100%;
                margin-top: 30px;
                page-break-inside: avoid;
            }
            .firma-table { width: 100%; border-spacing: 20px 0; }
            .firma-ec-block {
                border: 1px dashed #aaa;
                padding: 15px;
                text-align: center;
                background-color: #f9f9f9;
                vertical-align: top;
            }
            .firma-ec-block .firma-label {
                font-size: 8pt;
                color: #888;
                margin-bottom: 30px;
            }
            .firma-ec-block .firma-name {
                font-weight: bold;
                font-size: 10pt;
                border-top: 1px solid #555;
                padding-top: 4px;
            }
            .firma-ec-block .firma-role {
                font-size: 8pt;
                color: #555;
            }
            
            /* ── Pie de página legal ── */
            .legal-footer {
                border-top: 1px solid #ccc;
                margin-top: 25px;
                padding-top: 8px;
                font-size: 7.5pt;
                color: #888;
            }
            .lopdp-clause {
                font-size: 7pt;
                color: #aaa;
                margin-top: 4px;
                font-style: italic;
            }
            
            /* ── Código de trazabilidad ── */
            .traceability-block {
                width: 100%;
                margin-top: 4px;
            }
            .trace-table { width: 100%; }
            .trace-code {
                font-family: 'Courier New', monospace;
                font-size: 7.5pt;
                color: #999;
            }
            
            /* ── Aviso Doble Ciego ── */
            .blind-mode-notice {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 8px 12px;
                font-size: 8.5pt;
                color: #856404;
                margin-bottom: 15px;
                text-align: center;
                font-weight: bold;
            }
            
            /* ── Páginas ── */
            @page {
                size: A4;
                margin: 1.8cm 1.5cm 2cm 1.5cm;
            }
            
            /* Saltos de página */
            .page-break { page-break-before: always; }
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
                isDraft: metadata.IsDraft
            );

            try 
            {
                pdfDocument.AddEventHandler(PdfDocumentEvent.END_PAGE, handler);

                var converterProperties = new ConverterProperties();
                var fontProvider = new DefaultFontProvider(true, true, false);
                converterProperties.SetFontProvider(fontProvider);
                converterProperties.SetBaseUri("data://");

                HtmlConverter.ConvertToPdf(fullHtml, pdfDocument, converterProperties);

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
    }
}
