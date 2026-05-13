using System;

namespace Diitra.Domain.Common.Documents
{
    /// <summary>
    /// Representa una instancia específica de un documento (ej: el Informe de Mayo del Proyecto X).
    /// Maneja el ciclo de vida desde borrador hasta documento firmado e inmutable.
    /// </summary>
    public class DocumentInstance
    {
        public int Id { get; private set; }
        public string Uuid { get; private set; } = Guid.NewGuid().ToString();
        
        public string TemplateCode { get; private set; } = string.Empty;
        public int TemplateVersion { get; private set; }
        
        /// <summary>
        /// UUID de la entidad que "es dueña" del documento (Proyecto, Convocatoria, etc).
        /// </summary>
        public string EntityUuid { get; private set; } = string.Empty;

        /// <summary>
        /// Tipo de entidad (Proyecto, Informe, Acta, etc.) para que el orquestador sepa qué proveedor usar.
        /// </summary>
        public string EntityType { get; private set; } = "Proyecto";
        
        public string? Title { get; private set; }
        public DocumentState State { get; private set; } = DocumentState.Draft;
        
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;
        public string CreatedBy { get; private set; } = string.Empty;

        // Propiedades de Inmutabilidad (se llenan al finalizar)
        public string? FinalPdfPath { get; private set; }
        public string? FileHash { get; private set; }
        public string? TraceabilityCode { get; private set; }
        public string? DataSnapshotJson { get; private set; }

        protected DocumentInstance() { }

        public static DocumentInstance Create(
            string templateCode, 
            int templateVersion, 
            string entityUuid, 
            string createdBy, 
            string? title = null,
            string entityType = "Proyecto",
            string? dataSnapshotJson = null)
        {
            return new DocumentInstance
            {
                TemplateCode = templateCode,
                TemplateVersion = templateVersion,
                EntityUuid = entityUuid,
                EntityType = entityType,
                CreatedBy = createdBy,
                Title = title,
                State = DocumentState.Draft,
                DataSnapshotJson = dataSnapshotJson
            };
        }

        public void TransitionTo(DocumentState newState)
        {
            // Lógica de protección: Un documento firmado o archivado ya no puede volver a borrador
            if (State == DocumentState.Signed && newState == DocumentState.Draft)
                throw new InvalidOperationException("No se puede volver a borrador un documento ya firmado legalmente.");

            State = newState;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Finalize(string pdfPath, string hash, string traceabilityCode)
        {
            FinalPdfPath = pdfPath;
            FileHash = hash;
            TraceabilityCode = traceabilityCode;
            State = DocumentState.Signed;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public enum DocumentState
    {
        Draft = 1,
        Review = 2,
        Signed = 3,
        Archived = 4,
        Annulled = 5
    }
}
