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
using iText.IO.Image;
using System;
using System.Text.RegularExpressions;

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
        private readonly ImageData? _stationaryImageData;
        private readonly Image? _stationaryImage;
        private readonly PdfFont? _watermarkFont;
        private readonly string _verificationBaseUrl;
        private readonly int _cronogramaPage;
        private readonly int _pageOffset;

        public DocumentEventHandler(
            string traceabilityCode, 
            string institutionName = "DIITRA - Departamento de Investigación e Innovación",
            string lopdpClause = "Tratamiento de datos conforme a LOPDP (R.O. 459, 2021).",
            bool isDraft = false,
            string? stationaryImageBase64 = null,
            ImageData? stationaryImageData = null,
            string? verificationBaseUrl = null,
            int cronogramaPage = 5,
            int pageOffset = 0)
        {
            _pageOffset = pageOffset;
            _traceabilityCode = traceabilityCode;
            _institutionName = institutionName;
            _lopdpClause = lopdpClause;
            _isDraft = isDraft;
            _verificationBaseUrl = string.IsNullOrWhiteSpace(verificationBaseUrl)
                ? "https://diitra.ist.edu.ec"
                : verificationBaseUrl.TrimEnd('/');
            _cronogramaPage = cronogramaPage;

            if (stationaryImageData != null)
            {
                _stationaryImageData = stationaryImageData;
            }
            else if (!string.IsNullOrEmpty(stationaryImageBase64))
            {
                try
                {
                    string base64Data = stationaryImageBase64.Contains(",") 
                        ? stationaryImageBase64.Substring(stationaryImageBase64.IndexOf(",") + 1) 
                        : stationaryImageBase64;
                    
                    byte[] imageBytes = Convert.FromBase64String(base64Data);
                    _stationaryImageData = ImageDataFactory.Create(imageBytes);
                }
                catch { /* Ignorar errores de imagen */ }
            }

            if (_stationaryImageData != null)
            {
                try
                {
                    // PERFORMANCE: Pre-create the Image instance to avoid repeated wrapper creation per page
                    _stationaryImage = new Image(_stationaryImageData)
                        .SetFixedPosition(0, 0)
                        .SetOpacity(0.35f);
                }
                catch { }
            }

            // PERFORMANCE: Pre-crear fuente de marca de agua
            if (_isDraft)
            {
                _watermarkFont = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);
            }
        }

        protected override void OnAcceptedEvent(AbstractPdfDocumentEvent @event)
        {
            PdfDocumentEvent docEvent = (PdfDocumentEvent)@event;
            PdfDocument pdfDoc = docEvent.GetDocument();
            PdfPage page = docEvent.GetPage();
            int pageNumber = pdfDoc.GetPageNumber(page);
            int logicalPageNumber = pageNumber + _pageOffset;

            // En iText 9 .NET, GetType() está sobreescrito para devolver el string del tipo de evento directamente
            string eventType = @event.GetType();

            Console.WriteLine($"[DIITRA EVENT] Page: {pageNumber} (Logical: {logicalPageNumber}), EventType: '{eventType}', MediaBox: {page.GetMediaBox()}");

            if (eventType == "StartPdfPage")
            {
                if (logicalPageNumber == _cronogramaPage)
                {
                    page.SetMediaBox(PageSize.A4.Rotate());
                    page.SetCropBox(PageSize.A4.Rotate());
                }
                return;
            }

            if (eventType == "EndPdfPage")
            {
                // Lógica para el evento END_PAGE
                Rectangle pageSize = page.GetPageSize();
                var width = pageSize.GetWidth();
                var height = pageSize.GetHeight();
                var rotation = page.GetRotation();
                
                // Determinar si la página es landscape considerando CropBox/MediaBox y rotación
                bool isLandscape = (rotation == 90 || rotation == 270) 
                    ? (height > width) 
                    : (width > height);
                
                if (page.GetMediaBox() != null && page.GetMediaBox().GetWidth() > page.GetMediaBox().GetHeight())
                {
                    isLandscape = true;
                }

                Console.WriteLine($"[DIITRA EVENT DEBUG] Page: {pageNumber} (Logical: {logicalPageNumber}), Width: {width}, Height: {height}, Rotation: {rotation}, IsLandscape: {isLandscape}");
                
                // 0.1 Fondo Institucional (Papel Membretado)
                if (logicalPageNumber > 1 && _stationaryImage != null)
                {
                    try
                    {
                        PdfCanvas pc = new PdfCanvas(page.NewContentStreamBefore(), page.GetResources(), pdfDoc);
                        Canvas underCanvas = new Canvas(pc, pageSize);
                        
                        _stationaryImage.SetWidth(pageSize.GetWidth())
                                        .SetHeight(pageSize.GetHeight()); 
                        
                        underCanvas.Add(_stationaryImage);
                        underCanvas.Close();
                    }
                    catch { }
                }

                PdfCanvas pdfCanvas = new PdfCanvas(page.NewContentStreamAfter(), page.GetResources(), pdfDoc);
                Canvas canvas = new Canvas(pdfCanvas, pageSize);

                // 0. Omitir en la primera página (Portada)
                if (logicalPageNumber == 1)
                {
                    canvas.Close();
                    return;
                }

                // 1. Marca de agua (Watermark) si es borrador
                if (_isDraft && _watermarkFont != null)
                {
                    Paragraph p = new Paragraph("BORRADOR / DRAFT")
                        .SetFont(_watermarkFont)
                        .SetFontSize(60)
                        .SetFontColor(iText.Kernel.Colors.ColorConstants.LIGHT_GRAY)
                        .SetOpacity(0.3f);
                    
                    canvas.ShowTextAligned(p, pageSize.GetWidth() / 2, pageSize.GetHeight() / 2, 
                        pageNumber, TextAlignment.CENTER, VerticalAlignment.MIDDLE, 45);
                }

                // 2. Encabezado Global - Desactivado (Se maneja por plantilla)
                // canvas.SetFontSize(7);
                // ...

                // 3. Pie de Página Global + QR de Verificación
                canvas.ShowTextAligned(new Paragraph(_lopdpClause), 
                    36, 25, TextAlignment.LEFT);
                
                canvas.ShowTextAligned(new Paragraph($"Página {logicalPageNumber}"), 
                    pageSize.GetRight() - 36, 25, TextAlignment.RIGHT);

                // 4. QR de Verificación Nativo (Esquina inferior derecha)
                // Usamos el estándar iText 9 Professional para asegurar visibilidad en todos los visores
                BarcodeQRCode qrCode = new BarcodeQRCode($"{_verificationBaseUrl}/verificacion/{_traceabilityCode}");
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
}
