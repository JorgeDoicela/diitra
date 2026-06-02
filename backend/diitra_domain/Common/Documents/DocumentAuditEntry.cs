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

        /// <summary>Identificador del proyecto relacionado (si aplica).</summary>
        public string? ProjectUuid { get; private set; }

        /// <summary>UUID de la entidad origen (Proyecto, Informe, etc).</summary>
        public string? EntityUuid { get; private set; }

        /// <summary>Identificador del usuario que solicitó el documento (Email/Cédula).</summary>
        public string? GeneratedBy { get; private set; }

        /// <summary>Fecha y hora exacta de generación (UTC).</summary>
        public DateTime GeneratedAt { get; private set; }

        /// <summary>Indica si el documento se generó bajo el protocolo de Doble Ciego.</summary>
        public bool WasBlindMode { get; private set; }

        /// <summary>Nombre del archivo generado.</summary>
        public string FileName { get; private set; } = string.Empty;

        /// <summary>Hash SHA-256 para verificación de integridad.</summary>
        public string? FileHash { get; private set; }

        /// <summary>Snapshot JSON de los datos exactos inyectados en la plantilla.</summary>
        public string? DataSnapshotJson { get; private set; }

        /// <summary>Actualiza el hash del archivo cuando es firmado digitalmente.</summary>
        public void UpdateFileHash(string newHash)
        {
            if (string.IsNullOrEmpty(newHash))
                throw new ArgumentException("El hash no puede estar vacío.", nameof(newHash));
            FileHash = newHash;
        }

        // Para EF Core
        protected DocumentAuditEntry() { }

        public static DocumentAuditEntry Create(
            string traceabilityCode,
            string templateCode,
            int templateVersion,
            DocumentCategory category,
            string? generatedBy,
            bool wasBlindMode,
            string fileName,
            string? projectUuid = null,
            string? entityUuid = null,
            string? fileHash = null,
            string? dataSnapshotJson = null)
        {
            return new DocumentAuditEntry
            {
                TraceabilityCode = traceabilityCode,
                TemplateCode = templateCode,
                TemplateVersion = templateVersion,
                Category = category,
                GeneratedBy = generatedBy,
                GeneratedAt = DateTime.UtcNow,
                WasBlindMode = wasBlindMode,
                FileName = fileName,
                ProjectUuid = projectUuid,
                EntityUuid = entityUuid,
                FileHash = fileHash,
                DataSnapshotJson = dataSnapshotJson
            };
        }
    }
}
