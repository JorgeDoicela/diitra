using System.Threading;
using System.Threading.Tasks;

namespace Diitra.Application.Common.Documents
{
    /// <summary>
    /// Interfaz para proveedores de datos de documentos.
    /// Permite que cada módulo (Investigación, Innovación, etc.) defina cómo extraer sus datos
    /// para el motor de documentos.
    /// </summary>
    public interface IDocumentDataProvider
    {
        /// <summary>
        /// Determina si este proveedor puede manejar la entidad solicitada.
        /// </summary>
        bool CanHandle(string entityType);

        /// <summary>
        /// Obtiene los datos de la entidad y los mapea a un objeto anónimo para Scriban.
        /// </summary>
        Task<object> GetDocumentDataAsync(string entityUuid, CancellationToken ct = default);
    }
}
