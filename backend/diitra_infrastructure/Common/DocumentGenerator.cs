using Diitra.Application.Common;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace Diitra.Infrastructure.Common
{
    /// <summary>
    /// Implementación legado del generador de PDFs con QuestPDF.
    /// Mantenido para reportes estadísticos complejos (Gantt, gráficos, tablas CACES).
    /// Para documentos institucionales dinámicos, usar IDocumentEngine.
    /// </summary>
    public class DocumentGenerator : IDocumentGenerator
    {
        public Task<byte[]> GenerateAsync(object document)
        {
            if (document is not IDocument questDocument)
                throw new ArgumentException(
                    "El objeto debe implementar QuestPDF.Infrastructure.IDocument para usarse con el motor legado.", nameof(document));

            var pdfBytes = questDocument.GeneratePdf();
            return Task.FromResult(pdfBytes);
        }
    }
}
