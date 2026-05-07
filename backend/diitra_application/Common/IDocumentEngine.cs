using Diitra.Domain.Common.Documents;

namespace Diitra.Application.Common.Documents
{
    /// <summary>
    /// Request que el sistema pasa al Motor de Documentos.
    /// Totalmente genérico: cualquier módulo puede usarlo pasando su DTO como Data.
    /// </summary>
    public class DocumentRequest
    {
        /// <summary>
        /// Código de la plantilla en base de datos. Ej: "ACTA_APROBACION", "INFORME_CACES".
        /// El motor buscará la plantilla activa por este código.
        /// </summary>
        public required string TemplateCode { get; init; }

        /// <summary>
        /// Los datos a inyectar en la plantilla. Puede ser cualquier objeto:
        /// ProyectoDto, InformeDto, ConvenioDto, etc.
        /// El motor lo serializa y lo expone a Scriban como variables de plantilla.
        /// </summary>
        public required object Data { get; init; }

        /// <summary>
        /// Si true, el motor genera la versión anonimizada del documento (Peer Review Doble Ciego).
        /// Solo válido si la plantilla tiene SupportsBlindMode = true.
        /// </summary>
        public bool IsBlindMode { get; init; } = false;
        
        /// <summary>
        /// Si true, el motor añade una marca de agua de "BORRADOR" en todas las páginas.
        /// Útil para documentos en revisión que no deben usarse como definitivos.
        /// </summary>
        public bool IsDraftMode { get; init; } = false;

        /// <summary>
        /// Metadatos adicionales que se inyectan como variables en la plantilla.
        /// Ej: { "nombre_director": "Mg. Juan Pérez", "periodo_academico": "2026-1" }
        /// </summary>
        public Dictionary<string, object>? ExtraVariables { get; init; }

        /// <summary>
        /// Si se provee, el motor añadirá estos bytes de PDF (anexos escaneados, facturas)
        /// al final del documento generado. Útil para paquetes de evidencias CACES.
        /// </summary>
        public List<byte[]>? AttachmentsToMerge { get; init; }

        /// <summary>
        /// Identidad del usuario que solicita el documento (para auditoría LOPDP).
        /// </summary>
        public string? RequestedBy { get; init; }

        /// <summary>
        /// UUID del proyecto relacionado (opcional, para auditoría).
        /// </summary>
        public string? ProjectUuid { get; init; }

        /// <summary>
        /// UUID de la entidad origen (opcional, para auditoría).
        /// </summary>
        public string? EntityUuid { get; init; }
    }

    /// <summary>
    /// Resultado que devuelve el Motor de Documentos.
    /// </summary>
    public class DocumentResult
    {
        /// <summary>Los bytes del PDF generado.</summary>
        public byte[] PdfBytes { get; init; } = Array.Empty<byte>();

        /// <summary>Nombre de archivo sugerido para la descarga.</summary>
        public string FileName { get; init; } = "documento.pdf";

        /// <summary>UUID único de trazabilidad del documento emitido.</summary>
        public string TraceabilityCode { get; init; } = string.Empty;

        /// <summary>Versión de la plantilla que se usó para generar el documento.</summary>
        public int TemplateVersion { get; init; }

        /// <summary>Timestamp de generación (UTC). Se registra en la auditoría.</summary>
        public DateTime GeneratedAt { get; init; } = DateTime.UtcNow;

        /// <summary>Si el documento fue generado en modo doble ciego.</summary>
        public bool WasBlindMode { get; init; }

        /// <summary>Hash SHA-256 de integridad del documento.</summary>
        public string? FileHash { get; init; }
    }

    /// <summary>
    /// Contrato principal de DIITRA Builder (Motor de Documentos Empresarial).
    /// Desacoplado de cualquier módulo específico (Investigación, CACES, Ética, etc.)
    /// Permite orquestar la generación de documentos y la integración con DIITRA CoWork.
    /// </summary>
    public interface IDocumentEngine
    {
        /// <summary>
        /// Genera un documento PDF institucional a partir de una plantilla almacenada en BD.
        /// Aplica automáticamente: branding DIITRA, cumplimiento LOPDP, código de trazabilidad y firma electrónica si aplica.
        /// </summary>
        Task<DocumentResult> GenerateAsync(DocumentRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Combina múltiples PDFs en un solo documento (para paquetes CACES o expedientes).
        /// </summary>
        Task<byte[]> MergeDocumentsAsync(IEnumerable<byte[]> pdfDocuments, CancellationToken cancellationToken = default);

        /// <summary>
        /// Obtiene todas las plantillas activas registradas en el sistema.
        /// </summary>
        Task<IEnumerable<DocumentTemplate>> GetAvailableTemplatesAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Actualiza el contenido HTML de una plantilla (panel de administración).
        /// </summary>
        Task UpdateTemplateAsync(string templateCode, string newHtmlContent, string? customCss, string updatedBy, CancellationToken cancellationToken = default);
    }
}
