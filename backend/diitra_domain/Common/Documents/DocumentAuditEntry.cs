using System;

namespace Diitra.Domain.Common.Documents
{
    /// <summary>
    /// Registro inmutable de auditoría para cada documento generado.
    /// Garantiza la integridad y el no-repudio en procesos legales y académicos.
    /// Exigido por LOPDP (Art. 20) y procesos de acreditación CACES.
    /// </summary>
    public class DocumentAuditEntry
    {
        public int Id { get; private set; }

        /// <summary>Código legible impreso en el PDF (Ej: DIITRA-PROTO-2026-X1Y2Z3).</summary>
        public string TraceabilityCode { get; private set; } = string.Empty;

        /// <summary>Código de la plantilla utilizada.</summary>
        public string TemplateCode { get; private set; } = string.Empty;

        /// <summary>Versión de la plantilla en el momento de la generación.</summary>
        public int TemplateVersion { get; private set; }

        /// <summary>Categoría del documento para reportes estadísticos CACES.</summary>
        public DocumentCategory Category { get; private set; }

        /// <summary>Identificador del usuario que solicitó el documento (Email/Cédula).</summary>
        public string? GeneratedBy { get; private set; }

        /// <summary>Fecha y hora exacta de generación (UTC).</summary>
        public DateTime GeneratedAt { get; private set; }

        /// <summary>Indica si el documento se generó bajo el protocolo de Doble Ciego.</summary>
        public bool WasBlindMode { get; private set; }

        // Para EF Core
        protected DocumentAuditEntry() { }

        public static DocumentAuditEntry Create(
            string traceabilityCode,
            string templateCode,
            int templateVersion,
            DocumentCategory category,
            string? generatedBy,
            bool wasBlindMode)
        {
            return new DocumentAuditEntry
            {
                TraceabilityCode = traceabilityCode,
                TemplateCode = templateCode,
                TemplateVersion = templateVersion,
                Category = category,
                GeneratedBy = generatedBy,
                GeneratedAt = DateTime.UtcNow,
                WasBlindMode = wasBlindMode
            };
        }
    }
}
