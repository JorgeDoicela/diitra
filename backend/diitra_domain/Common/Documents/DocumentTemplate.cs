namespace Diitra.Domain.Common.Documents
{
    /// <summary>
    /// Entidad de dominio que representa una plantilla de documento institucional.
    /// Almacena el contenido HTML en base de datos para permitir edición sin recompilación.
    /// Cumple con la lógica de versioning para no invalidar documentos históricos.
    /// </summary>
    public class DocumentTemplate
    {
        public int Id { get; private set; }

        /// <summary>
        /// Código único e inmutable de la plantilla. Ej: "PROTOCOLO_INVESTIGACION", "ACTA_APROBACION", "INFORME_CACES"
        /// Se usa como clave de búsqueda desde el código; no debe cambiarse en producción.
        /// </summary>
        public string Code { get; private set; } = string.Empty;

        /// <summary>Nombre legible para el administrador del instituto.</summary>
        public string Name { get; private set; } = string.Empty;

        /// <summary>Descripción del propósito del documento (visible en el panel admin).</summary>
        public string? Description { get; private set; }

        /// <summary>
        /// Contenido HTML con variables Scriban. Ej: {{ proyecto.titulo }}, {{ fecha_emision }}
        /// </summary>
        public string HtmlContent { get; private set; } = string.Empty;

        /// <summary>Número de versión. Se incrementa automáticamente en cada actualización.</summary>
        public int Version { get; private set; } = 1;

        /// <summary>Clasificación del documento para el motor de cumplimiento legal.</summary>
        public DocumentCategory Category { get; private set; }

        /// <summary>Si true, el motor inyecta automáticamente la cláusula LOPDP en el pie de página.</summary>
        public bool RequiresLopdpClause { get; private set; } = true;

        /// <summary>Si true, el motor puede generar versión anonimizada (Doble Ciego) de este documento.</summary>
        public bool SupportsBlindMode { get; private set; } = false;

        /// <summary>Si true, se genera un UUID de trazabilidad + QR de verificación en el pie.</summary>
        public bool RequiresTraceabilityCode { get; private set; } = true;

        /// <summary>Si true, el documento incluye bloques de firma electrónica FirmaEC.</summary>
        public bool RequiresElectronicSignature { get; private set; } = false;

        /// <summary>
        /// CSS personalizado adicional para la plantilla. El motor inyecta el CSS base institucional
        /// y luego aplica este override.
        /// </summary>
        public string? CustomCss { get; private set; }

        public bool IsActive { get; private set; } = true;
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;
        public string? UpdatedBy { get; private set; }

        // Para EF Core
        protected DocumentTemplate() { }

        public static DocumentTemplate Create(
            string code, string name, string htmlContent,
            DocumentCategory category, string? description = null,
            bool requiresLopdp = true, bool supportsBlind = false,
            bool requiresTraceability = true, bool requiresSignature = false)
        {
            return new DocumentTemplate
            {
                Code = code,
                Name = name,
                HtmlContent = htmlContent,
                Category = category,
                Description = description,
                RequiresLopdpClause = requiresLopdp,
                SupportsBlindMode = supportsBlind,
                RequiresTraceabilityCode = requiresTraceability,
                RequiresElectronicSignature = requiresSignature
            };
        }

        public void UpdateContent(string newHtmlContent, string? customCss, string updatedBy)
        {
            HtmlContent = newHtmlContent;
            CustomCss = customCss;
            Version++;
            UpdatedAt = DateTime.UtcNow;
            UpdatedBy = updatedBy;
        }

        public void Deactivate() => IsActive = false;
        public void Activate() => IsActive = true;
    }

    public enum DocumentCategory
    {
        // Ciclo de vida del proyecto
        Protocolo = 1,
        ActaAprobacion = 2,
        InformeAvance = 3,
        InformeFinal = 4,
        ActaLiquidacion = 5,

        // Gestión de presupuesto público (SERCOP)
        TerminosDeReferencia = 10,
        EspecificacionTecnica = 11,
        CertificacionPresupuestaria = 12,
        ActaRecepcion = 13,

        // Comité de Ética (CEISH)
        ProtocoloBioetico = 20,
        ConsentimientoInformado = 21,
        ActaExencion = 22,

        // Propiedad intelectual (SENADI)
        CesionDerechos = 30,
        SolicitudRegistroSoftware = 31,
        InformeTransferenciaTecnologica = 32,

        // Semilleros y estudiantes
        ActaConformacionSemillero = 40,
        CertificadoParticipacion = 41,

        // Convenios y redes
        ConvenioMarco = 50,
        ConvenioEspecifico = 51,

        // Reportes CACES/SENESCYT
        MatrizIndicadoresCaces = 60,
        ReporteAnualSenescyt = 61,
        ReporteDistributivoCruce = 62,

        // Comité Editorial
        ActaRevisionEditorial = 70,
        ContratoAutorRevista = 71,

        // Administrativos
        ResolucionCargaHoraria = 80,
        CertificadoDocente = 81,
    }
}
