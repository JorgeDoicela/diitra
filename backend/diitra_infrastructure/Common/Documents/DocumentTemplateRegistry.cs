using Diitra.Domain.Common.Documents;
using System.Collections.Generic;
using System.Linq;
using Diitra.Infrastructure.Common.Documents.Templates.Investigacion;
using Diitra.Infrastructure.Common.Documents.Templates.Innovacion;

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
                version: 400);

            // 2. FORMATO PROYECTO DE INNOVACIÓN
            yield return DocumentTemplate.Create(
                code: ProyectoInnovacionTemplate.CODE,
                name: "2. Formato Proyecto de Innovación",
                description: "Documento oficial para formulación de proyectos de innovación y transferencia tecnológica - ISTPET.",
                category: DocumentCategory.Protocolo,
                htmlContent: "<!-- Cargado desde Templates/Innovacion/ProyectoInnovacion.html -->",
                requiresLopdp: true,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"programa\", \"grupo_investigacion\", \"tipo_innovacion\", \"linea_investigacion\", \"sublinea_investigacion\", \"campo_amplio\", \"campo_especifico\", \"campo_detallado\", \"carrera\", \"alcance\", \"resumen_proyecto\", \"objetivo_general\", \"objetivos_especificos\", \"antecedentes\", \"justificacion_innovacion\", \"descripcion_innovacion\", \"vinculacion_sociedad\", \"convenio_asociado\", \"estado_arte_conceptual\", \"metodologia_aplicacion\", \"metodologia_evaluacion\", \"beneficiarios\", \"viabilidad\", \"transferencia_conocimiento\", \"recursos_disponibles\", \"recursos_necesarios\", \"financiamiento\", \"impactos\"]",
                version: 100);

            // 3. PLAN DE APRENDIZAJE DE PROYECTO (ELABORACIÓN DIRECTOR / EQUIPO)
            yield return DocumentTemplate.Create(
                code: "PLAN_APRENDIZAJE",
                name: "Plan de Aprendizaje de Proyecto (Docencia - APE)",
                description: "Planificación de articulación de la investigación con la docencia y prácticas formativas APE - ISTPET.",
                category: DocumentCategory.Protocolo,
                htmlContent: "<!-- Cargado desde Templates/PLAN_APRENDIZAJE.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"NombreProyecto\", \"LineaInvestigacion\", \"SublineaInvestigacion\", \"Carrera\", \"DirectorProyecto\", \"NumeroEstudiantes\", \"FechaAprobacion\", \"FechaTerminacion\", \"PeriodoAcademico\", \"NombreEstudiante\", \"ObjetivoGeneral\", \"PrerrequisitosCognitivos\", \"PrerrequisitosProcedimentales\", \"ActividadesPlan\", \"FirmasResponsabilidad\"]",
                version: 200);

            // 4. INSTRUMENTO DE EVALUACIÓN DEL PLAN DE APRENDIZAJE (REVISIÓN ADMINISTRADOR)
            yield return DocumentTemplate.Create(
                code: "EVALUACION_PLAN_APRENDIZAJE",
                name: "Instrumento de Evaluación del Plan de Aprendizaje de los Estudiantes",
                description: "Evaluación cualitativa institucional del plan de aprendizaje realizada por la Coordinación de Investigación - ISTPET.",
                category: DocumentCategory.Protocolo,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/EvaluacionPlanAprendizaje.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"NombreProyecto\", \"LineaInvestigacion\", \"SublineaInvestigacion\", \"Carrera\", \"DirectorProyecto\", \"PeriodoAcademico\", \"EstudiantesEvaluaciones\", \"FirmasResponsabilidad\"]",
                version: 200);

            // ══════════════════════════════════════════════════════════════
            // OTRAS ÁREAS (Registro de marcadores de posición)
            // ══════════════════════════════════════════════════════════════

            yield return DocumentTemplate.Create(
                code: "OFICIO_APROBACION",
                name: "Formato Oficio de Aprobación de Proyecto",
                description: "Oficio formal emitido por la Coordinación de Investigación para aprobación legal previa a ejecución.",
                category: DocumentCategory.ActaAprobacion,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/OficioAprobacion.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                version: 20);

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
                collaborativeFields: "[\"Indice\", \"sec_indice\", \"Resumen\", \"sec_resumen\", \"resumen_ejecutivo\", \"Introduccion\", \"sec_introduccion\", \"Objetivos\", \"sec_objetivos\", \"cumplimiento_objetivos\", \"Fundamentos\", \"sec_fundamentos\", \"Metodos\", \"sec_metodos\", \"Resultados\", \"sec_resultados\", \"Productos\", \"sec_productos\", \"Impactos\", \"sec_impactos\", \"impacto_final\", \"Transferencia\", \"sec_transferencia\", \"transferencia_conocimiento\", \"InformeFinanciero\", \"sec_informe_financiero\", \"Conclusiones\", \"sec_conclusiones\", \"Recomendaciones\", \"sec_recomendaciones\", \"Bibliografia\", \"sec_bibliografia\", \"bibliografia_final\", \"Anexos\", \"sec_anexos\"]",
                version: 20);

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
                version: 20);

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
                collaborativeFields: "[\"ActividadesEjecutadas\", \"ActividadesNoPrevistas\", \"Obstaculos\", \"ConclusionesParciales\", \"EstadoEjecucion\", \"DescripcionFaseActual\", \"ObservacionesDirector\", \"ObservacionesCoordinador\", \"HitosCompletados\", \"Evidencias\", \"PresupuestoEjecutado\"]",
                version: 20);

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
                version: 20);

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
                version: 20);

            // ══════════════════════════════════════════════════════════════
            // CERTIFICADOS DE COMPLETACIÓN Y PARTICIPACIÓN
            // ══════════════════════════════════════════════════════════════
            yield return DocumentTemplate.Create(
                code: "CERTIFICADO_COMPLETACION",
                name: "Certificado de Completación de Proyecto",
                description: "Certificado oficial otorgado a estudiantes, docentes y directores al finalizar con éxito un proyecto de investigación.",
                category: DocumentCategory.CertificadoCompletacion,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/CertificadoCompletacion.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                version: 10);

            yield return DocumentTemplate.Create(
                code: "CERTIFICADO_PARTICIPACION_GRUPO",
                name: "Certificado de Participación de Grupo",
                description: "Certificado de reconocimiento por pertenecer a un Grupo o Semillero de Investigación.",
                category: DocumentCategory.CertificadoGrupo,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/CertificadoGrupo.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                version: 10);

            // ══════════════════════════════════════════════════════════════
            // GRUPOS Y SEMILLEROS DE INVESTIGACIÓN
            // ══════════════════════════════════════════════════════════════
            yield return DocumentTemplate.Create(
                code: "PROPUESTA_GRUPO_INVESTIGACION",
                name: "Formato Propuesta de Creación de Grupo de Investigación",
                description: "Documento oficial para formulación, postulación y trámite de conformación de grupos y semilleros de investigación - ISTPET.",
                category: DocumentCategory.PropuestaGrupoInvestigacion,
                htmlContent: "<!-- Cargado desde Templates/Investigacion/PropuestaGrupoInvestigacion.html -->",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"nombre_grupo\", \"siglas\", \"tipo_grupo\", \"dominio\", \"lineas_investigacion\", \"carreras_vinculadas\", \"mision\", \"vision\", \"objetivo_general\", \"coordinador_nombre\", \"coordinador_cedula\", \"coordinador_email\", \"coordinador_telefono\", \"miembros_docentes\", \"miembros_estudiantes\"]",
                version: 10);

            // Nota: Para agregar una nueva plantilla:
            //   1. Crear el .html en Templates/{Categoria}/{NombreArchivo}.html
            //   2. Agregar el CODE al TemplateFileLoader.ResolveFilePath()
            //   3. Registrar aquí con htmlContent vacío
        }

    }
}
