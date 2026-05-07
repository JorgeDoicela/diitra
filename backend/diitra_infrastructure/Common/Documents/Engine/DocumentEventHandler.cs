using iText.Kernel.Events;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using iText.Kernel.Pdf.Extgstate;
using iText.Kernel.Pdf.Xobject;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.IO.Font.Constants;
using iText.Kernel.Font;
using iText.Barcodes;
using System;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Manejador de eventos para iText7 (Nivel Platinum).
    /// Inyecta encabezados, pies de página, marcas de agua y Códigos QR de Verificación.
    /// </summary>
    public class DocumentEventHandler : IEventHandler
    {
        private readonly string _traceabilityCode;
        private readonly string _institutionName;
        private readonly string _lopdpClause;
        private readonly bool _isDraft;

        public DocumentEventHandler(
            string traceabilityCode, 
            string institutionName = "DIITRA - Departamento de Investigación e Innovación",
            string lopdpClause = "Tratamiento de datos conforme a LOPDP (R.O. 459, 2021).",
            bool isDraft = false)
        {
            _traceabilityCode = traceabilityCode;
            _institutionName = institutionName;
            _lopdpClause = lopdpClause;
            _isDraft = isDraft;
        }

        public void HandleEvent(Event @event)
        {
            PdfDocumentEvent docEvent = (PdfDocumentEvent)@event;
            PdfDocument pdfDoc = docEvent.GetDocument();
            PdfPage page = docEvent.GetPage();
            Rectangle pageSize = page.GetPageSize();
            
            PdfCanvas pdfCanvas = new PdfCanvas(page.NewContentStreamBefore(), page.GetResources(), pdfDoc);
            Canvas canvas = new Canvas(pdfCanvas, pageSize);

            // 1. Marca de agua (Watermark) si es borrador
            if (_isDraft)
            {
                PdfFont font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                Paragraph p = new Paragraph("BORRADOR / DRAFT")
                    .SetFont(font)
                    .SetFontSize(60)
                    .SetFontColor(iText.Kernel.Colors.ColorConstants.LIGHT_GRAY)
                    .SetOpacity(0.3f);
                
                canvas.ShowTextAligned(p, pageSize.GetWidth() / 2, pageSize.GetHeight() / 2, 
                    pdfDoc.GetPageNumber(page), TextAlignment.CENTER, VerticalAlignment.MIDDLE, 45);
            }

            // 2. Encabezado Global
            canvas.SetFontSize(7);
            canvas.SetFontColor(iText.Kernel.Colors.ColorConstants.GRAY);
            
            canvas.ShowTextAligned(new Paragraph(_institutionName), 
                36, pageSize.GetTop() - 25, TextAlignment.LEFT);
            
            canvas.ShowTextAligned(new Paragraph($"Traza: {_traceabilityCode}"), 
                pageSize.GetRight() - 36, pageSize.GetTop() - 25, TextAlignment.RIGHT);

            // 3. Pie de Página Global + QR de Verificación
            canvas.ShowTextAligned(new Paragraph(_lopdpClause), 
                36, 25, TextAlignment.LEFT);
            
            canvas.ShowTextAligned(new Paragraph($"Página {pdfDoc.GetPageNumber(page)}"), 
                pageSize.GetRight() - 36, 25, TextAlignment.RIGHT);

            // 4. QR de Verificación Nativo (Esquina inferior derecha)
            // Este QR permite validar la autenticidad del documento en el portal del instituto
            BarcodeQRCode qrCode = new BarcodeQRCode($"https://diitra.ist.edu.ec/verify/{_traceabilityCode}");
            PdfFormXObject qrObject = qrCode.CreateFormXObject(iText.Kernel.Colors.ColorConstants.BLACK, pdfDoc);
            
            // Posicionar el QR (35x35 px) sobre el pie de página
            pdfCanvas.AddXObjectWithTransformationMatrix(qrObject, 35, 0, 0, 35, pageSize.GetRight() - 75, 40);

            canvas.Close();
        }
    }
}
