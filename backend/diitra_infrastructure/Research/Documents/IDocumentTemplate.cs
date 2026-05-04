using QuestPDF.Infrastructure;

namespace Diitra.Infrastructure.Research.Documents
{
    public interface IDocumentTemplate : IDocument
    {
        // Interfaz base para todas las plantillas institucionales
        string GetDocumentName();
    }
}
