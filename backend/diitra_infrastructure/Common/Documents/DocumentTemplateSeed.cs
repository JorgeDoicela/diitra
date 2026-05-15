using Diitra.Domain.Common.Documents;
using System.Collections.Generic;
using System.Linq;
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// CATÁLOGO MAESTRO DE PLANTILLAS INSTITUCIONALES (DIITRA Registry)
    /// Este archivo actúa como el índice central. El contenido HTML de cada documento
    /// se encuentra en su propia carpeta bajo /Templates/ para máxima organización.
    /// </summary>
    public static class DocumentTemplateSeed
    {
        public static DocumentTemplate? GetByCode(string code) => 
            GetSeedTemplates().FirstOrDefault(t => t.Code == code);

        public static IEnumerable<DocumentTemplate> GetSeedTemplates()
        {
            // ══════════════════════════════════════════════════════════════
            // ÁREA: INVESTIGACIÓN
            // ══════════════════════════════════════════════════════════════

            // 1. FORMATO PROYECTO DE INVESTIGACIÓN (Oficial v14)
            yield return DocumentTemplate.Create(
                code: ProyectoInvestigacionTemplate.CODE,
                name: "1. Formato Proyecto de Investigación",
                description: "Documento oficial para postulación de proyectos I+D+i. Versión de Producción Final v14.0.",
                category: DocumentCategory.Protocolo,
                htmlContent: ProyectoInvestigacionTemplate.GetHtml(),
                requiresLopdp: true,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"programa\", \"grupo_investigacion\", \"dominio\", \"linea_investigacion\", \"sublinea_investigacion\", \"tipo_investigacion\", \"campo_amplio\", \"campo_especifico\", \"campo_detallado\", \"antecedentes\", \"descripcion_proyecto\", \"justificacion\", \"objetivo_general\", \"objetivos_especificos\", \"ods\", \"marco_teorico\", \"metodologia\", \"evaluacion\", \"bibliografia\"]",
                version: 36);

            // ══════════════════════════════════════════════════════════════
            // OTRAS ÁREAS (Registro de marcadores de posición)
            // ══════════════════════════════════════════════════════════════

            yield return DocumentTemplate.Create(
                code: "ACTA_APROBACION_PROYECTO",
                name: "Acta de Aprobación de Proyecto",
                description: "Resolución oficial del Comité de Investigación.",
                category: DocumentCategory.ActaAprobacion,
                htmlContent: "<h1>Acta de Aprobación</h1>",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true, 
                version: 10);

            yield return DocumentTemplate.Create(
                code: InformeFinalTemplate.CODE,
                name: "Informe Final de Investigación",
                description: "Documento de consolidación de resultados para acreditación CACES.",
                category: DocumentCategory.InformeFinal,
                htmlContent: InformeFinalTemplate.GetHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"resumen_ejecutivo\", \"cumplimiento_objetivos\", \"resultados\", \"discusion\", \"impacto_final\", \"transferencia_conocimiento\", \"conclusiones\", \"recomendaciones\", \"bibliografia_final\"]",
                version: 1);

            // Nota: Conforme digitalicemos más documentos, se crearán sus carpetas
            // correspondientes y se registrarán aquí de forma limpia.
        }
    }
}
