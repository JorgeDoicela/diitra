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
    public static class DocumentTemplateRegistry
    {
        public static DocumentTemplate? GetByCode(string code) => 
            GetSeedTemplates().FirstOrDefault(t => t.Code == code);

        public static IEnumerable<DocumentTemplate> GetSeedTemplates()
        {
            // ══════════════════════════════════════════════════════════════
            // ÁREA: INVESTIGACIÓN
            // ══════════════════════════════════════════════════════════════
            // NOTA: El HTML de cada plantilla vive en su archivo .html correspondiente
            // bajo Templates/{Categoria}/{Nombre}.html. El TemplateFileLoader lo carga
            // automáticamente. El htmlContent aquí es solo un placeholder de arranque;
            // en producción el .html copiado al output tiene prioridad.

            // 1. FORMATO PROYECTO DE INVESTIGACIÓN
            yield return DocumentTemplate.Create(
                code: ProyectoInvestigacionTemplate.CODE,
                name: "1. Formato Proyecto de Investigación",
                description: "Documento oficial para postulación de proyectos I+D+i. Versión de Producción Final v14.0.",
                category: DocumentCategory.Protocolo,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/ProyectoInvestigacion.html -->",
                requiresLopdp: true,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"programa\", \"grupo_investigacion\", \"dominio\", \"linea_investigacion\", \"sublinea_investigacion\", \"tipo_investigacion\", \"campo_amplio\", \"campo_especifico\", \"campo_detallado\", \"antecedentes\", \"descripcion_proyecto\", \"justificacion\", \"objetivo_general\", \"objetivos_especificos\", \"ods\", \"marco_teorico\", \"metodologia\", \"evaluacion\", \"bibliografia\"]",
                version: 43);

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
                htmlContent: "<!-- Cargado desde Templates/Investigacion/InformeFinal.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"resumen_ejecutivo\", \"cumplimiento_objetivos\", \"resultados\", \"discusion\", \"impacto_final\", \"transferencia_conocimiento\", \"conclusiones\", \"recomendaciones\", \"bibliografia_final\"]",
                version: 1);

            yield return DocumentTemplate.Create(
                code: RubricaEvaluacionTemplate.CODE,
                name: "Rúbrica de Evaluación por Pares",
                description: "Revisión doble ciego (Fase 2) — Normativa CACES.",
                category: DocumentCategory.Protocolo,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/RubricaEvaluacion.html -->",
                requiresLopdp: true,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"Pertinencia\", \"Metodologia\", \"Viabilidad\", \"Impacto\", \"ComentariosGenerales\", \"RecomendacionFinal\"]",
                version: 1);

            yield return DocumentTemplate.Create(
                code: InformeAvanceTemplate.CODE,
                name: "Informe de Avance de Proyecto",
                description: "Ejecución y Monitoreo (Fase 3).",
                category: DocumentCategory.InformeAvance,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/InformeAvance.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"HitosCompletados\", \"Evidencias\", \"PresupuestoEjecutado\", \"ConclusionesParciales\"]",
                version: 1);

            yield return DocumentTemplate.Create(
                code: ReporteAnaliticasTemplate.CODE,
                name: "Reporte de Analíticas de Investigación e Innovación",
                description: "Reporte directivo con indicadores KPI, cumplimiento CACES y portafolio de proyectos para acreditación institucional.",
                category: DocumentCategory.ReporteAnaliticas,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/ReporteAnaliticas.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: false,
                version: 1);

            yield return DocumentTemplate.Create(
                code: "DICTAMEN_ARBITRAJE",
                name: "Acta de Dictamen de Arbitraje",
                description: "Documento oficial CACES del resultado de la evaluación por pares doble ciego. Firmable digitalmente por el Director de Investigación.",
                category: DocumentCategory.DictamenArbitraje,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/DictamenArbitraje.html -->",
                requiresLopdp: false,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: true,
                version: 1);

            yield return DocumentTemplate.Create(
                code: "ACTA_COMITE_ETICA",
                name: "Acta del Comité de Ética de Investigación",
                description: "Evaluación de Pertinencia Ética y Bioética - IST Traversari.",
                category: DocumentCategory.ProtocoloBioetico,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/ActaComiteEtica.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"JustificacionEtica\", \"RiesgosIdentificados\", \"MetodoConsentimiento\", \"DictamenComite\", \"ObservacionesEspecificas\"]",
                version: 1);

            // Nota: Para agregar una nueva plantilla:
            //   1. Crear el .html en Templates/{Categoria}/{NombreArchivo}.html
            //   2. Agregar el CODE al TemplateFileLoader.ResolveFilePath()
            //   3. Registrar aquí con htmlContent vacío
        }

    }
}
