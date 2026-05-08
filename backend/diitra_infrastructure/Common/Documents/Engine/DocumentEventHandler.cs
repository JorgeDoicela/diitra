using iText.Commons.Actions;
using iText.Kernel.Pdf.Event;
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
    /// Manejador de eventos para iText9 (Nivel Platinum).
    /// Inyecta encabezados, pies de página, marcas de agua y Códigos QR de Verificación.
    /// </summary>
    public class DocumentEventHandler : AbstractPdfDocumentEventHandler
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

        protected override void OnAcceptedEvent(AbstractPdfDocumentEvent @event)
        {
            PdfDocumentEvent docEvent = (PdfDocumentEvent)@event;
            PdfDocument pdfDoc = docEvent.GetDocument();
            PdfPage page = docEvent.GetPage();
            Rectangle pageSize = page.GetPageSize();
            
            PdfCanvas pdfCanvas = new PdfCanvas(page.NewContentStreamAfter(), page.GetResources(), pdfDoc);
            Canvas canvas = new Canvas(pdfCanvas, pageSize);

            // 1. Marca de agua (Watermark) si es borrador
            if (_isDraft)
            {
                PdfFont font = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);
                Paragraph p = new Paragraph("BORRADOR / DRAFT")
                    .SetFont(font)
                    .SetFontSize(60)
                    .SetFontColor(iText.Kernel.Colors.ColorConstants.LIGHT_GRAY)
                    .SetOpacity(0.3f);
                
                canvas.ShowTextAligned(p, pageSize.GetWidth() / 2, pageSize.GetHeight() / 2, 
                    pdfDoc.GetPageNumber(page), TextAlignment.CENTER, VerticalAlignment.MIDDLE, 45);
            }

            // 2. Encabezado Global - Desactivado (Se maneja por plantilla)
            // canvas.SetFontSize(7);
            // ...


            // 3. Pie de Página Global + QR de Verificación
            canvas.ShowTextAligned(new Paragraph(_lopdpClause), 
                36, 25, TextAlignment.LEFT);
            
            canvas.ShowTextAligned(new Paragraph($"Página {pdfDoc.GetPageNumber(page)}"), 
                pageSize.GetRight() - 36, 25, TextAlignment.RIGHT);

            // 4. QR de Verificación Nativo (Esquina inferior derecha)
            // Usamos el estándar iText 9 Professional para asegurar visibilidad en todos los visores
            BarcodeQRCode qrCode = new BarcodeQRCode($"https://diitra.ist.edu.ec/verify/{_traceabilityCode}");
            PdfFormXObject qrObject = qrCode.CreateFormXObject(iText.Kernel.Colors.ColorConstants.BLACK, pdfDoc);
            
            // Creamos un objeto Image para posicionamiento preciso y escalado automático
            Image qrImage = new Image(qrObject)
                .SetWidth(45)
                .SetHeight(45)
                .SetFixedPosition(pageSize.GetRight() - 85, 45);
            
            canvas.Add(qrImage);

            canvas.Close();
        }
    }
}
