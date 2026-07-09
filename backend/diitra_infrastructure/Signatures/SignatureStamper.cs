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
        using var reader       = new PdfReader(new MemoryStream(pdfBytes));
        using var writer       = new PdfWriter(outputStream);
        using var pdf          = new PdfDocument(reader, writer);
        using var document     = new Document(pdf);

        // Configurar márgenes del nuevo contenido
        document.SetMargins(36, 36, 36, 36);

        // ── Añadir nueva página de firma ─────────────────────────────
        document.Add(new AreaBreak(iText.Layout.Properties.AreaBreakType.NEXT_PAGE));

        var fonts = LoadFonts();

        // ── Encabezado del bloque ─────────────────────────────────────
        var headerTable = new Table(1)
            .UseAllAvailableWidth()
            .SetBackgroundColor(PrimaryColor)
            .SetBorderRadius(new iText.Layout.Properties.BorderRadius(8));

        headerTable.AddCell(new Cell()
            .Add(new Paragraph("FIRMA INSTITUCIONAL DIITRA")
                .SetFont(fonts.bold)
                .SetFontSize(13)
                .SetFontColor(ColorConstants.WHITE)
                .SetTextAlignment(TextAlignment.CENTER))
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(10));

        document.Add(headerTable);

        // ── Cuerpo: Imagen de firma + Datos + QR ─────────────────────
        var bodyTable = new Table(new float[] { 2f, 4f, 2f })
            .UseAllAvailableWidth()
            .SetMarginTop(4)
            .SetBackgroundColor(LightGray);

        // Columna izquierda: imagen de firma
        var leftCell = new Cell()
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(12)
            .SetVerticalAlignment(VerticalAlignment.MIDDLE);

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
                    .ScaleToFit(140, 60)
                    .SetHorizontalAlignment(HorizontalAlignment.CENTER);
                leftCell.Add(img);
            }
            catch
            {
                // Si la imagen falla, usar iniciales como fallback
                leftCell.Add(BuildInitialsPlaceholder(nombreFirmante, fonts));
            }
        }
        else
        {
            leftCell.Add(BuildInitialsPlaceholder(nombreFirmante, fonts));
        }

        bodyTable.AddCell(leftCell);

        // Columna central: datos del firmante
        var centerCell = new Cell()
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetBorderLeft(new iText.Layout.Borders.SolidBorder(BorderColor, 1))
            .SetBorderRight(new iText.Layout.Borders.SolidBorder(BorderColor, 1))
            .SetPadding(12);

        centerCell.Add(new Paragraph(nombreFirmante)
            .SetFont(fonts.bold)
            .SetFontSize(11)
            .SetFontColor(PrimaryColor)
            .SetMarginBottom(2));

        if (!string.IsNullOrWhiteSpace(rolEnDocumento))
            centerCell.Add(DataRow("Rol:", rolEnDocumento, fonts));

        if (!string.IsNullOrWhiteSpace(cargo))
            centerCell.Add(DataRow("Cargo:", cargo, fonts));

        if (!string.IsNullOrWhiteSpace(departamento))
            centerCell.Add(DataRow("Departamento:", departamento, fonts));

        if (!string.IsNullOrWhiteSpace(cedula))
            centerCell.Add(DataRow("C.I.:", cedula, fonts));

        centerCell.Add(DataRow("Firmado:", firmadoEn.ToString("dd/MM/yyyy HH:mm 'UTC'zzz"), fonts));
        centerCell.Add(DataRow("Código:", firmaCode, fonts, AccentColor));

        bodyTable.AddCell(centerCell);

        // Columna derecha: QR de verificación
        var rightCell = new Cell()
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(12)
            .SetVerticalAlignment(VerticalAlignment.MIDDLE);

        var qrBytes = GenerateQrImage(verificationUrl, pdf);
        if (qrBytes != null)
        {
            rightCell.Add(qrBytes);
            rightCell.Add(new Paragraph("Verificar")
                .SetFont(fonts.regular)
                .SetFontSize(7)
                .SetFontColor(TextGray)
                .SetTextAlignment(TextAlignment.CENTER));
        }

        bodyTable.AddCell(rightCell);
        document.Add(bodyTable);

        // ── Footer legal ──────────────────────────────────────────────
        var footerTable = new Table(1)
            .UseAllAvailableWidth()
            .SetMarginTop(0);

        footerTable.AddCell(new Cell()
            .Add(new Paragraph(
                $"Firma institucional DIITRA · Sistema de Gestión de Investigación e Innovación · " +
                $"Verificar en: {verificationUrl}")
                .SetFont(fonts.regular)
                .SetFontSize(7)
                .SetFontColor(TextGray)
                .SetTextAlignment(TextAlignment.CENTER))
            .SetBackgroundColor(BorderColor)
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(6));

        document.Add(footerTable);

        return outputStream.ToArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static Paragraph DataRow(string label, string value, FontSet fonts, Color? valueColor = null)
    {
        var p = new Paragraph()
            .SetMarginBottom(2)
            .Add(new Text($"{label} ").SetFont(fonts.bold).SetFontSize(8).SetFontColor(TextGray))
            .Add(new Text(value).SetFont(fonts.regular).SetFontSize(8)
                .SetFontColor(valueColor ?? new DeviceRgb(30, 40, 60)));
        return p;
    }

    private static Div BuildInitialsPlaceholder(string nombre, FontSet fonts)
    {
        var initials = string.Concat(nombre.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Take(2).Select(w => char.ToUpper(w[0])));

        var div = new Div()
            .SetWidth(80).SetHeight(60)
            .SetBackgroundColor(new DeviceRgb(220, 230, 245))
            .SetBorderRadius(new iText.Layout.Properties.BorderRadius(8));

        div.Add(new Paragraph(initials)
            .SetFont(fonts.bold)
            .SetFontSize(22)
            .SetFontColor(PrimaryColor)
            .SetTextAlignment(TextAlignment.CENTER));

        return div;
    }

    private static iText.Layout.Element.Image? GenerateQrImage(string url, PdfDocument pdf)
    {
        try
        {
            var barcode = new BarcodeQRCode(url);
            var qrImage = new iText.Layout.Element.Image(barcode.CreateFormXObject(pdf))
                .ScaleToFit(90, 90)
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

    private record FontSet(PdfFont bold, PdfFont regular);
}
