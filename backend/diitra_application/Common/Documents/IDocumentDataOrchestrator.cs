using System.Threading;
using System.Threading.Tasks;

namespace Diitra.Application.Common.Documents
{
    /// <summary>
    /// El Orquestador de Datos es el "Engranaje Maestro" del sistema.
    /// Su misión es unificar datos de múltiples fuentes (Investigación + CoWork)
    /// para alimentar al Motor de Documentos (Builder).
    /// </summary>
    public interface IDocumentDataOrchestrator
    {
        /// <summary>
        /// Prepara un objeto DocumentRequest completo para ser procesado por el Builder.
        /// Busca automáticamente los datos del proyecto, sus participantes y el contenido
        /// colaborativo redactado en CoWork.
        /// </summary>
        /// <param name="documentInstanceUuid">UUID de la instancia de documento a generar.</param>
        /// <param name="requestedBy">Email/UUID del usuario que solicita la generación.</param>
        Task<DocumentRequest> PrepareRequestAsync(string documentInstanceUuid, string requestedBy, CancellationToken ct = default);
    }
}
