using iText.Kernel.Pdf;
using iText.Kernel.Utils;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Motor de ensamblado de PDFs para la generación de paquetes de evidencias CACES.
    /// Toma el PDF institucional generado y une los anexos subidos por los investigadores
    /// (facturas, fotos de laboratorio, actas escaneadas) en un solo expediente digital.
    /// </summary>
    public class PdfMergerService
    {
        /// <summary>
        /// Combina múltiples PDFs en uno solo, manteniendo el índice de páginas.
        /// El primer PDF en la lista es el "Documento Principal" (el generado por DIITRA),
        /// los siguientes son los anexos.
        /// </summary>
        public async Task<byte[]> MergeAsync(IEnumerable<byte[]> pdfDocuments)
        {
            var pdfList = pdfDocuments.ToList();

            if (!pdfList.Any())
                throw new ArgumentException("No hay documentos para combinar.");

            if (pdfList.Count == 1)
                return pdfList[0];

            using var outputStream = new MemoryStream();
            using var pdfWriter = new PdfWriter(outputStream);
            using var mergedPdf = new PdfDocument(pdfWriter);
            var merger = new PdfMerger(mergedPdf);

            foreach (var pdfBytes in pdfList)
            {
                if (pdfBytes.Length == 0) continue;

                using var sourceStream = new MemoryStream(pdfBytes);
                using var sourcePdf = new PdfDocument(new PdfReader(sourceStream));
                merger.Merge(sourcePdf, 1, sourcePdf.GetNumberOfPages());
            }

            mergedPdf.Close();

            return await Task.FromResult(outputStream.ToArray());
        }
    }
}
