using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.IO.Font.Constants;
using iText.IO.Image;
using iText.Barcodes;
using System.Linq;

namespace diitra_infrastructure.Signatures;

/// <summary>
/// Estampa el bloque visual profesional de la firma DIITRA al final del PDF.
/// El bloque incluye: imagen de firma, datos institucionales, QR de verificación
/// y el código DFRM único.
///
/// Extensible: para Fase 3+ inyecta tu propio ISignatureStamper.
/// </summary>
public class SignatureStamper
{
    private static readonly Color PrimaryColor  = new DeviceRgb(10, 50, 100);    // Azul institucional
    private static readonly Color AccentColor   = new DeviceRgb(0, 120, 200);    // Azul claro
    private static readonly Color LightGray     = new DeviceRgb(245, 246, 250);
    private static readonly Color BorderColor   = new DeviceRgb(200, 210, 225);
    private static readonly Color TextGray      = new DeviceRgb(80, 90, 110);

    /// <summary>
    /// Añade el bloque de firma al PDF y retorna el nuevo PDF con el sello.
    /// </summary>
    /// <param name="pdfBytes">PDF original (ya generado por DocumentEngine)</param>
    /// <param name="nombreFirmante">Nombre completo del firmante</param>
    /// <param name="cedula">Cédula o identificador del firmante</param>
    /// <param name="cargo">Cargo institucional del firmante</param>
    /// <param name="departamento">Departamento del firmante</param>
    /// <param name="rolEnDocumento">Rol del firmante en el documento (Director, Co-inv., etc.)</param>
    /// <param name="firmaCode">Código único DFRM-xxxx del registro</param>
    /// <param name="firmaImagenB64">PNG en Base64 del trazo de firma (puede ser null)</param>
    /// <param name="verificationUrl">URL completa de verificación para el QR</param>
    /// <param name="firmadoEn">Fecha y hora de la firma</param>
    public byte[] StampSignatureBlock(
        byte[]   pdfBytes,
        string   nombreFirmante,
        string?  cedula,
        string?  cargo,
        string?  departamento,
        string?  rolEnDocumento,
        string   firmaCode,
        string?  firmaImagenB64,
        string   verificationUrl,
        DateTime firmadoEn)
    {
        using var outputStream = new MemoryStream();

        // IMPORTANTE: document, pdf, writer y reader deben ser dispuestos (Dispose/Close) ANTES de
        // llamar outputStream.ToArray(). iText7 hace flush y finaliza el PDF al cerrar PdfDocument.
        // Si ToArray() se llama dentro del bloque using del PdfDocument, el PDF queda truncado (solo header).
        using (var reader   = new PdfReader(new MemoryStream(pdfBytes)))
        using (var writer   = new PdfWriter(outputStream))
        using (var pdf      = new PdfDocument(reader, writer))
        {
            var fonts = LoadFonts();

            // ── Encabezado del bloque (más estrecho) ──────────────────────
            var headerTable = new Table(1)
                .UseAllAvailableWidth()
                .SetBackgroundColor(PrimaryColor);

            headerTable.AddCell(new Cell()
                .Add(new Paragraph("FIRMA INSTITUCIONAL DIITRA")
                    .SetFont(fonts.bold)
                    .SetFontSize(5.2f)
                    .SetFontColor(ColorConstants.WHITE)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetMultipliedLeading(0.85f))
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetPadding(1.0f));

            // ── Cuerpo: 3 columnas (Izquierda: Firma, Centro: Datos, Derecha: QR)
            var bodyTable = new Table(new float[] { 3.0f, 4.8f, 2.2f })
                .UseAllAvailableWidth()
                .SetMarginTop(0.4f)
                .SetBackgroundColor(LightGray);

            // Columna 1: Firma manuscrita o iniciales
            var firmaCell = new Cell()
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetPadding(1.2f)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE)
                .SetHorizontalAlignment(HorizontalAlignment.CENTER);

            if (!string.IsNullOrWhiteSpace(firmaImagenB64))
            {
                try
                {
                    byte[] imgBytes = Convert.FromBase64String(
                        firmaImagenB64.Contains(',')
                            ? firmaImagenB64.Split(',')[1]
                            : firmaImagenB64);

                    var imgData = ImageDataFactory.Create(imgBytes);
                    var img = new iText.Layout.Element.Image(imgData)
                        .ScaleToFit(50, 16)
                        .SetHorizontalAlignment(HorizontalAlignment.CENTER)
                        .SetMarginTop(1.5f)
                        .SetMarginBottom(1.5f);
                    firmaCell.Add(img);
                }
                catch
                {
                    firmaCell.Add(BuildInitialsPlaceholder(nombreFirmante, fonts));
                }
            }
            else
            {
                firmaCell.Add(BuildInitialsPlaceholder(nombreFirmante, fonts));
            }
            bodyTable.AddCell(firmaCell);

            // Columna 2: Datos del firmante
            var datosCell = new Cell()
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetBorderLeft(new iText.Layout.Borders.SolidBorder(BorderColor, 0.75f))
                .SetPadding(1.2f)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE);

            datosCell.Add(new Paragraph(FormatNombreMultiLine(nombreFirmante))
                .SetFont(fonts.bold)
                .SetFontSize(5.8f)
                .SetFontColor(PrimaryColor)
                .SetMarginBottom(0.5f)
                .SetMultipliedLeading(0.85f));

            if (!string.IsNullOrWhiteSpace(rolEnDocumento))
                datosCell.Add(DataRow("Rol:", rolEnDocumento, fonts));

            if (!string.IsNullOrWhiteSpace(cargo))
                datosCell.Add(DataRow("Cargo:", cargo, fonts));

            if (!string.IsNullOrWhiteSpace(departamento))
                datosCell.Add(DataRow("Departamento:", departamento, fonts));

            if (!string.IsNullOrWhiteSpace(cedula))
                datosCell.Add(DataRow("C.I.:", cedula, fonts));

            string fechaFormat = firmadoEn.ToString("dd/MM/yyyy HH:mm") + " UTC";
            datosCell.Add(DataRow("Firmado:", fechaFormat, fonts));

            // Fila de Código
            datosCell.Add(new Paragraph()
                .SetMarginBottom(0)
                .SetMultipliedLeading(0.85f)
                .Add(new Text("Código: ").SetFont(fonts.bold).SetFontSize(4.8f).SetFontColor(TextGray))
                .Add(new Text(firmaCode).SetFont(fonts.bold).SetFontSize(4.8f).SetFontColor(AccentColor)));

            bodyTable.AddCell(datosCell);

            // Columna 3: QR de Verificación
            var qrCell = new Cell()
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetBorderLeft(new iText.Layout.Borders.SolidBorder(BorderColor, 0.75f))
                .SetPadding(1.2f)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE)
                .SetHorizontalAlignment(HorizontalAlignment.CENTER);

            var qrBytes = GenerateQrImage(verificationUrl, pdf);
            if (qrBytes != null)
            {
                qrBytes.ScaleToFit(24, 24)
                    .SetHorizontalAlignment(HorizontalAlignment.CENTER)
                    .SetMarginTop(1.5f)
                    .SetMarginBottom(0);
                qrCell.Add(qrBytes);

                qrCell.Add(new Paragraph("Verificar")
                    .SetFont(fonts.regular)
                    .SetFontSize(3.8f)
                    .SetFontColor(TextGray)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetMarginTop(0)
                    .SetMarginBottom(1.5f));
            }
            bodyTable.AddCell(qrCell);

            // ── Footer legal (más estrecho) ──────────────────────────────────
            var footerTable = new Table(1)
                .UseAllAvailableWidth()
                .SetMarginTop(0);

            footerTable.AddCell(new Cell()
                .Add(new Paragraph(
                    $"Firma institucional DIITRA · Departamento de Investigación e Innovación Traversari · Verificar en: {verificationUrl}")
                    .SetFont(fonts.regular)
                    .SetFontSize(3.2f)
                    .SetFontColor(TextGray)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetMultipliedLeading(0.85f))
                .SetBackgroundColor(BorderColor)
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetPadding(1.0f));

            // ── Posicionamiento Absoluto mediante Canvas en la última página ──
            int totalPages = pdf.GetNumberOfPages();
            var page = pdf.GetPage(totalPages);
            var pdfCanvas = new iText.Kernel.Pdf.Canvas.PdfCanvas(page);

            // Intentar encontrar las coordenadas del nombre o rol del firmante en la página para estampar encima
            bool esDirector = string.IsNullOrWhiteSpace(rolEnDocumento) || 
                              rolEnDocumento.Contains("Director", StringComparison.OrdinalIgnoreCase) || 
                              rolEnDocumento.Contains("Elaborado", StringComparison.OrdinalIgnoreCase);

            string roleTarget1 = esDirector ? "Director del Proyecto" : "Coordinador de Carrera";
            string roleTarget2 = esDirector ? "Director de Proyecto" : "Coordinador";
            string roleLabelTarget = esDirector ? "Elaborado por:" : "Aprobado por:";

            var finder = new TextLocationFinder(roleTarget1);
            bool found = false;
            try
            {
                var processor = new iText.Kernel.Pdf.Canvas.Parser.PdfCanvasProcessor(finder);
                processor.ProcessPageContent(page);
                if (finder.Y.HasValue) found = true;
            }
            catch {}

            if (!found)
            {
                finder = new TextLocationFinder(roleTarget2);
                try
                {
                    var processor = new iText.Kernel.Pdf.Canvas.Parser.PdfCanvasProcessor(finder);
                    processor.ProcessPageContent(page);
                    if (finder.Y.HasValue) found = true;
                }
                catch {}
            }

            if (!found)
            {
                finder = new TextLocationFinder(roleLabelTarget);
                try
                {
                    var processor = new iText.Kernel.Pdf.Canvas.Parser.PdfCanvasProcessor(finder);
                    processor.ProcessPageContent(page);
                    if (finder.Y.HasValue) found = true;
                }
                catch {}
            }

            if (!found && !string.IsNullOrWhiteSpace(nombreFirmante))
            {
                finder = new TextLocationFinder(nombreFirmante);
                try
                {
                    var processor = new iText.Kernel.Pdf.Canvas.Parser.PdfCanvasProcessor(finder);
                    processor.ProcessPageContent(page);
                    if (finder.Y.HasValue) found = true;
                }
                catch {}
            }

            float canvasWidth = 210f; // Ancho del sello de firma
            float canvasHeight = 65f;  // Altura del sello de firma
            float canvasX;
            float canvasY;

            if (found && finder.Y.HasValue)
            {
                // Situar el sello MÁS ARRIBA (por encima del texto del rol y sobre la línea de firma)
                canvasY = finder.Y.Value + 12f;

                if (finder.X.HasValue)
                {
                    // Alinear X dinámicamente según la posición del texto en la página
                    canvasX = Math.Max(20f, Math.Min(360f, finder.X.Value - 40f));
                }
                else
                {
                    canvasX = esDirector ? 70f : 315f;
                }
            }
            else
            {
                // Fallback si no se encuentra la posición en el canvas
                canvasY = 160f;
                canvasX = esDirector ? 70f : 315f;
            }

            var canvasArea = new iText.Kernel.Geom.Rectangle(canvasX, canvasY, canvasWidth, canvasHeight);
            using (var canvas = new Canvas(page, canvasArea))
            {
                canvas.Add(headerTable);
                canvas.Add(bodyTable);
                canvas.Add(footerTable);
            }

        } // ← Aquí se disponen pdf → writer → reader en orden inverso.
          //   iText7 hace flush completo al cerrar PdfDocument, finalizando el PDF en outputStream.

        return outputStream.ToArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static Paragraph DataRow(string label, string value, FontSet fonts, Color? valueColor = null)
    {
        var p = new Paragraph()
            .SetMarginBottom(0)
            .SetMultipliedLeading(0.85f)
            .Add(new Text($"{label} ").SetFont(fonts.bold).SetFontSize(4.8f).SetFontColor(TextGray))
            .Add(new Text(value).SetFont(fonts.regular).SetFontSize(4.8f)
                .SetFontColor(valueColor ?? new DeviceRgb(30, 40, 60)));
        return p;
    }

    private static Div BuildInitialsPlaceholder(string nombre, FontSet fonts)
    {
        var initials = string.Concat(nombre.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Take(2).Select(w => char.ToUpper(w[0])));

        var div = new Div()
            .SetWidth(38).SetHeight(22)
            .SetBackgroundColor(new DeviceRgb(220, 230, 245))
            .SetBorderRadius(new iText.Layout.Properties.BorderRadius(3));

        div.Add(new Paragraph(initials)
            .SetFont(fonts.bold)
            .SetFontSize(9.5f)
            .SetFontColor(PrimaryColor)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetMarginTop(2));

        return div;
    }

    private static iText.Layout.Element.Image? GenerateQrImage(string url, PdfDocument pdf)
    {
        try
        {
            var barcode = new BarcodeQRCode(url);
            var qrImage = new iText.Layout.Element.Image(barcode.CreateFormXObject(pdf))
                .ScaleToFit(32, 32)
                .SetHorizontalAlignment(HorizontalAlignment.CENTER);
            return qrImage;
        }
        catch
        {
            return null;
        }
    }

    private static FontSet LoadFonts()
    {
        // 1. Intentar cargar las fuentes empaquetadas con el proyecto (portabilidad total en Docker/Linux/Windows)
        var localFontsDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Fonts");
        var localBoldPath = Path.Combine(localFontsDir, "OpenSans-Bold.ttf");
        var localRegularPath = Path.Combine(localFontsDir, "OpenSans-Regular.ttf");

        // 2. Fallback a rutas tradicionales del sistema operativo
        var candidates = new[]
        {
            localBoldPath,
            @"C:\Windows\Fonts\NotoSans-Bold.ttf",
            @"C:\Windows\Fonts\segoeui.ttf",
            @"/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",   // Linux
            @"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        };
        var candidatesRegular = new[]
        {
            localRegularPath,
            @"C:\Windows\Fonts\NotoSans-Regular.ttf",
            @"C:\Windows\Fonts\segoeui.ttf",
            @"/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
            @"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        };

        PdfFont boldFont;
        PdfFont regularFont;

        var boldPath    = candidates.FirstOrDefault(File.Exists);
        var regularPath = candidatesRegular.FirstOrDefault(File.Exists);

        try { boldFont    = boldPath    != null ? PdfFontFactory.CreateFont(boldPath, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED)    : PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD); }
        catch { boldFont    = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD); }

        try { regularFont = regularPath != null ? PdfFontFactory.CreateFont(regularPath, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED) : PdfFontFactory.CreateFont(StandardFonts.HELVETICA); }
        catch { regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA); }

        return new FontSet(boldFont, regularFont);
    }

    private static string FormatNombreMultiLine(string nombreCompleto)
    {
        if (string.IsNullOrWhiteSpace(nombreCompleto)) return string.Empty;
        var parts = nombreCompleto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length <= 2)
        {
            return nombreCompleto;
        }
        
        int half = parts.Length / 2;
        if (parts.Length == 3)
        {
            half = 1;
        }
        
        var firstLine = string.Join(" ", parts.Take(half));
        var secondLine = string.Join(" ", parts.Skip(half));
        return $"{firstLine}\n{secondLine}";
    }

    private record FontSet(PdfFont bold, PdfFont regular);
}

public class TextLocationFinder : iText.Kernel.Pdf.Canvas.Parser.Listener.IEventListener
{
    private readonly string _targetText;
    public float? X { get; private set; }
    public float? Y { get; private set; }

    public TextLocationFinder(string targetText)
    {
        _targetText = targetText;
    }

    public void EventOccurred(iText.Kernel.Pdf.Canvas.Parser.Data.IEventData data, iText.Kernel.Pdf.Canvas.Parser.EventType type)
    {
        if (type == iText.Kernel.Pdf.Canvas.Parser.EventType.RENDER_TEXT)
        {
            var textRenderInfo = (iText.Kernel.Pdf.Canvas.Parser.Data.TextRenderInfo)data;
            var text = textRenderInfo.GetText();
            if (text != null && text.Contains(_targetText, System.StringComparison.OrdinalIgnoreCase))
            {
                var baseline = textRenderInfo.GetBaseline();
                var startPoint = baseline.GetStartPoint();
                X = startPoint.Get(0);
                Y = startPoint.Get(1);
            }
        }
    }

    public System.Collections.Generic.ICollection<iText.Kernel.Pdf.Canvas.Parser.EventType> GetSupportedEvents()
    {
        return new[] { iText.Kernel.Pdf.Canvas.Parser.EventType.RENDER_TEXT };
    }
}

