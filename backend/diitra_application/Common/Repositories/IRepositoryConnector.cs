using System.Threading;
using System.Threading.Tasks;

namespace Diitra.Application.Common.Repositories
{
    /// <summary>
    /// Interfaz para integración con Repositorios Digitales (DSpace, OAI-PMH).
    /// Permite que el núcleo de DIITRA publique documentos finalizados automáticamente.
    /// </summary>
    public interface IRepositoryConnector
    {
        /// <summary>
        /// Publica un documento en el repositorio institucional.
        /// </summary>
        /// <param name="pdfData">Bytes del PDF oficial.</param>
        /// <param name="metadata">Metadatos en formato Dublin Core (Título, Autor, Fecha, etc).</param>
        /// <returns>URI del documento en el repositorio (Handle).</returns>
        Task<string> PublishAsync(byte[] pdfData, object metadata, CancellationToken ct = default);
    }
}
