namespace Diitra.Application.Common
{
    /// <summary>
    /// Interfaz legado para generación de PDFs con QuestPDF.
    /// Mantenida por compatibilidad con reportes estadísticos.
    /// Para nuevos documentos institucionales, usar IDocumentEngine.
    /// </summary>
    public interface IDocumentGenerator
    {
        Task<byte[]> GenerateAsync(object document);
    }
}
