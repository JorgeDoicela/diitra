/**
 * @file defaultBlocksFactory.ts
 * @description Fábrica centralizada y desacoplada de bloques por defecto para el Template Builder de DIITRA.
 *
 * @architecture
 * Implementa el principio Open/Closed (SOLID) y Strategy Pattern:
 * 1. Para plantillas con definición institucional específica, carga su estructura oficial completa.
 * 2. Para cualquier plantilla nueva o futura, genera automáticamente una estructura rica y coherente
 *    basada en su categoría (DocumentCategory) y sus campos colaborativos (collaborativeFieldsJson).
 * 3. Elimina de forma permanente la aparición de plantillas genéricas vacías o incompletas de 4 bloques.
 */

import type { DocumentTemplateDto, DocumentBlock, BlockType, TechnicalSubsection } from '../types';

/**
 * Genera la portada base institucional con diseño de rombos geométricos del ISTPET.
 */
export function createBaseCoverBlock(
    title: string,
    options: {
        colorTitle?: 'navy' | 'gold' | string;
        carrera?: string;
        periodo?: string;
        themeColor?: string;
        showInstitution?: boolean;
    } = {}
): DocumentBlock {
    return {
        id: `block-cover-${Date.now()}`,
        type: 'cover' as BlockType,
        title: 'Portada Institucional (Rombos)',
        isActive: true,
        config: {
            tituloSuperior: title,
            colorTituloSuperior: options.colorTitle || 'navy',
            prefijoCarrera: 'TECNOLOGÍA SUPERIOR EN',
            prefijoPeriodo: 'PERIODO ACADÉMICO',
            colorTema: options.themeColor || '#1e2a4a',
            colorCarrera: '#1e2a4a',
            colorPeriodo: '#475569',
            colorTemaProyecto: '#1e2a4a',
            colorInstitution: '#1e2a4a',
            institutionVariant: 'clean',
            institutionFontSize: 11,
            institutionItalica: false,
            showInstitution: options.showInstitution !== undefined ? options.showInstitution : true,
            textoInstitucion: 'INSTITUTO TECNOLÓGICO SUPERIOR MAYOR PEDRO TRAVERSARI',
            xLogo: 10,
            yLogo: 3,
            xInstitution: 10,
            yInstitution: 13,
            showTitle: true,
            xTitle: 10,
            yTitle: 32,
            showTemaProyecto: true,
            xTema: 10,
            yTema: 46,
            showCarrera: true,
            xCarrera: 10,
            yCarrera: 70,
            showPeriodo: true,
            xPeriodo: 10,
            yPeriodo: 80
        }
    };
}

/**
 * Genera el bloque de firmas institucional de cierre.
 */
export function createBaseSignaturesBlock(
    signatories: Array<{ label: string; name: string; role: string }>
): DocumentBlock {
    return {
        id: `block-signatures-${Date.now()}`,
        type: 'signatures' as BlockType,
        title: 'Firmas de Responsabilidad y Trazabilidad',
        isActive: true,
        config: {
            signatories
        }
    };
}

/** Subsecciones técnicas de innovación */
const INNOVATION_TECHNICAL_SUBSECTIONS: TechnicalSubsection[] = [
    { id: 'sec_resumen', fieldKey: 'ResumenProyecto', numberPrefix: '3.1', title: 'RESUMEN DEL PROYECTO', placeholder: 'Síntesis general del proyecto (150-200 palabras)...', requirementText: 'EXTENSIÓN SUGERIDA: 150–200 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_banner_objetivos', fieldKey: 'BannerObjetivos', numberPrefix: '3.2', title: 'OBJETIVOS', placeholder: '', requirementText: '', enabled: true, colSpan: 2, variant: 'banner_gold', hasContent: false, isGroupHeader: true },
    { id: 'sec_objetivo_general', fieldKey: 'ObjetivoGeneral', numberPrefix: '', title: 'GENERAL', placeholder: 'Propósito principal del proyecto (20-30 palabras)...', requirementText: 'EXTENSIÓN SUGERIDA: 20–30 PALABRAS', enabled: true, colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_objetivos_especificos', fieldKey: 'ObjetivosEspecificos', numberPrefix: '', title: 'ESPECÍFICOS', placeholder: '1. Metas concretas...\n2. De 3 a 5 objetivos específicos...', requirementText: 'DE 3 A 5 OBJETIVOS, 15–25 PALABRAS C/U', enabled: true, colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_antecedentes', fieldKey: 'Antecedentes', numberPrefix: '3.3', title: 'A. ANTECEDENTES', placeholder: 'Contexto previo del problema, estudios y experiencias...', requirementText: 'EXTENSIÓN SUGERIDA: 200–300 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_justificacion', fieldKey: 'JustificacionInnovacion', numberPrefix: '3.4', title: 'B. JUSTIFICACIÓN DE LA INNOVACIÓN', placeholder: 'Fundamentación del proyecto: qué se va a transformar y qué aporta de nuevo...', requirementText: 'EXTENSIÓN SUGERIDA: 200–300 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_descripcion_innovacion', fieldKey: 'DescripcionInnovacion', numberPrefix: '3.5', title: 'C. DESCRIPCIÓN DE LA INNOVACIÓN', placeholder: 'Describa en qué consiste la innovación (antes vs después, tipo de innovación)...', requirementText: 'EXTENSIÓN SUGERIDA: 200–300 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_vinculacion', fieldKey: 'VinculacionSociedad', numberPrefix: '3.6', title: 'VINCULACIÓN CON LA SOCIEDAD', placeholder: 'Relación del proyecto con la comunidad o entorno...', requirementText: 'EXTENSIÓN SUGERIDA: 150–250 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_convenio', fieldKey: 'ConvenioAsociado', numberPrefix: '3.7', title: 'CONVENIO ASOCIADO', placeholder: 'Detalle de convenios con entidades externas o empresas...', requirementText: 'NOMBRE DEL CONVENIO O ENTIDAD ASOCIADA', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_estado_arte', fieldKey: 'EstadoArteConceptual', numberPrefix: '3.8', title: 'ESTADO DEL ARTE Y/O CONCEPTUAL', placeholder: 'Marco conceptual y estado del arte...', requirementText: 'EXTENSIÓN SUGERIDA: 3 PÁGINAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_metodologia_aplicacion', fieldKey: 'MetodologiaAplicacion', numberPrefix: '3.9', title: 'METODOLOGÍA DE APLICACIÓN', placeholder: 'Fases, actividades, responsabes, técnicas e instrumentos...', requirementText: 'EXTENSIÓN SUGERIDA: 200–300 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_metodologia_evaluacion', fieldKey: 'MetodologiaEvaluacion', numberPrefix: '3.10', title: 'METODOLOGÍA DE EVALUACIÓN DE RESULTADOS', placeholder: 'Criterios de evaluación, indicadores y momentos de evaluación...', requirementText: 'EXTENSIÓN SUGERIDA: 150–250 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_beneficiarios', fieldKey: 'Beneficiarios', numberPrefix: '3.11', title: 'BENEFICIARIOS', placeholder: 'Beneficiarios directos e indirectos...', requirementText: 'DIRECTOS E INDIRECTOS POR CARRERA/ROL', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_viabilidad', fieldKey: 'Viabilidad', numberPrefix: '3.12', title: 'VIABILIDAD', placeholder: 'Viabilidad técnica, operativa, económica y legal/ética...', requirementText: 'EXTENSIÓN SUGERIDA: 150–200 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_transferencia', fieldKey: 'TransferenciaConocimiento', numberPrefix: '3.13', title: 'TRANSFERENCIA DE CONOCIMIENTO', placeholder: 'Capacitaciones, talleres, publicaciones y socialización de resultados...', requirementText: 'EXTENSIÓN SUGERIDA: 150–200 PALABRAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true }
];

/** Subsecciones técnicas de investigación I+D+i */
const RESEARCH_TECHNICAL_SUBSECTIONS: TechnicalSubsection[] = [
    { id: 'sec_antecedentes', fieldKey: 'Antecedentes', numberPrefix: '3.1', title: 'ANTECEDENTES ESPECÍFICOS DE LA PROBLEMÁTICA', placeholder: 'Identificar y analizar estudios previos...', requirementText: 'DETALLAR EN DOS PÁRRAFOS DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_descripcion', fieldKey: 'DescripcionProyecto', numberPrefix: '3.2', title: 'DESCRIPCIÓN DEL PROYECTO', placeholder: 'Definir el propósito del proyecto...', requirementText: 'DETALLAR EN UN PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_justificacion', fieldKey: 'Justificacion', numberPrefix: '3.3', title: 'JUSTIFICACIÓN', placeholder: 'Especificar la importancia científica...', requirementText: 'CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_banner_objetivos', fieldKey: 'BannerObjetivos', numberPrefix: '3.4', title: 'OBJETIVOS', placeholder: '', requirementText: '', enabled: true, colSpan: 2, variant: 'banner_gold', hasContent: false, isGroupHeader: true },
    { id: 'sec_objetivo_general', fieldKey: 'ObjetivoGeneral', numberPrefix: '', title: 'GENERAL', placeholder: 'Formular el objetivo general...', requirementText: 'VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?', enabled: true, colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_objetivos_especificos', fieldKey: 'ObjetivosEspecificos', numberPrefix: '', title: 'ESPECÍFICOS', placeholder: '1. Desarrollar...\n2. Implementar...', requirementText: 'INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO', enabled: true, colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_ods', fieldKey: 'ObjetivosDesarrolloSostenible', numberPrefix: '3.5', title: 'OBJETIVOS DE DESARROLLO SOSTENIBLE', placeholder: 'Los objetivos de desarrollo sostenible de la ONU son 17...', requirementText: 'Alineación con Objetivos de Desarrollo Sostenible ONU', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_marco_teorico', fieldKey: 'MarcoTeorico', numberPrefix: '3.6', title: 'MARCO TEÓRICO', placeholder: 'Describir los conceptos clave...', requirementText: 'EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS, CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_metodologia', fieldKey: 'Metodologia', numberPrefix: '3.7', title: 'METODOLOGÍA', placeholder: 'Describir el enfoque metodológico...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_evaluacion', fieldKey: 'Evaluacion', numberPrefix: '3.8', title: 'EVALUACIÓN', placeholder: 'Describir los criterios e indicadores...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true }
];

/**
 * Fábrica principal de bloques por defecto.
 */
export function generateDefaultBlocksForTemplate(
    template: DocumentTemplateDto,
    _fullData?: any
): DocumentBlock[] {
    const code = template.code.toUpperCase();
    const category = template.category;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ESTRATEGIAS PARA PLANTILLAS INSTITUCIONALES CONOCIDAS
    // ─────────────────────────────────────────────────────────────────────────

    // A. PROTOCOLO DE INNOVACIÓN
    if (code === 'PROTOCOLO_INNOVACION') {
        return [
            createBaseCoverBlock('PROYECTO DE INNOVACIÓN', { colorTitle: 'gold' }),
            {
                id: 'block-general',
                type: 'project_general_section' as BlockType,
                title: '1. IDENTIFICACIÓN DEL PROYECTO',
                isActive: true,
                config: {
                    showTitulo: true,
                    showPrograma: true,
                    showGrupo: true,
                    showTipo: true,
                    showLinea: true,
                    showCaces: true,
                    showDirector: true,
                    showFechas: true
                }
            },
            {
                id: 'block-researchers',
                type: 'researchers_table' as BlockType,
                title: '2. INVESTIGADORES',
                isActive: true,
                config: {
                    mostrarCedula: true,
                    mostrarEmail: true,
                    mostrarTelefono: true,
                    mostrarNivelAcademico: true,
                    mostrarHoras: true
                }
            },
            {
                id: 'block-technical',
                type: 'project_technical_section' as BlockType,
                title: '3. DESCRIPCIÓN DEL PROYECTO',
                isActive: true,
                config: {
                    technicalSections: INNOVATION_TECHNICAL_SUBSECTIONS
                }
            },
            {
                id: 'block-products',
                type: 'expected_products' as BlockType,
                title: 'RESULTADOS ESPERADOS',
                isActive: true,
                config: {
                    productColumns: {
                        showCategory: true,
                        showQuantity: true,
                        showVerificationMeans: true,
                        showDeadline: true
                    }
                }
            },
            {
                id: 'block-budget',
                type: 'project_budget_section' as BlockType,
                title: '4. RECURSOS, COSTO Y FINANCIAMIENTO',
                isActive: true,
                config: {
                    showRecursosDisponibles: true,
                    showRecursosNecesarios: true,
                    showFinanciamiento: true
                }
            },
            {
                id: 'block-impacts',
                type: 'impacts' as BlockType,
                title: '5. IMPACTO DEL PROYECTO',
                isActive: true,
                config: {
                    showImpactoSocial: true,
                    showImpactoCientifico: true,
                    showImpactoEconomico: true,
                    showImpactoAmbiental: true
                }
            },
            createBaseSignaturesBlock([
                { label: 'Director del Proyecto de Innovación', name: '{{director_proyecto}}', role: 'Director de Proyecto' },
                { label: 'Coordinación de Innovación y Transferencia', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de Investigación e Innovación' }
            ])
        ];
    }

    // B. PROTOCOLO DE INVESTIGACIÓN (I+D+i)
    if (code === 'PROTOCOLO_INVESTIGACION' || code === '1. FORMATO PROYECTO DE INVESTIGACIÓN') {
        return [
            createBaseCoverBlock('PROYECTO DE INVESTIGACIÓN', { colorTitle: 'navy', showInstitution: false }),
            {
                id: 'block-general',
                type: 'project_general_section' as BlockType,
                title: '1. IDENTIFICACIÓN DEL PROYECTO',
                isActive: true,
                config: {
                    showTitulo: true,
                    showPrograma: true,
                    showGrupo: true,
                    showTipo: true,
                    showLinea: true,
                    showCaces: true,
                    showDirector: true,
                    showFechas: true
                }
            },
            {
                id: 'block-researchers',
                type: 'researchers_table' as BlockType,
                title: '2. INVESTIGADORES',
                isActive: true,
                config: {
                    mostrarCedula: true,
                    mostrarEmail: true,
                    mostrarTelefono: true,
                    mostrarNivelAcademico: true,
                    mostrarHoras: true
                }
            },
            {
                id: 'block-technical',
                type: 'project_technical_section' as BlockType,
                title: '3. ESPECIFICACIÓN DEL PROYECTO',
                isActive: true,
                config: {
                    technicalSections: RESEARCH_TECHNICAL_SUBSECTIONS
                }
            },
            {
                id: 'block-budget',
                type: 'project_budget_section' as BlockType,
                title: '4. RECURSOS, COSTO Y FINANCIAMIENTO',
                isActive: true,
                config: {
                    showRecursosDisponibles: true,
                    showRecursosNecesarios: true,
                    showFinanciamiento: true
                }
            },
            {
                id: 'block-products',
                type: 'expected_products' as BlockType,
                title: '5. PRODUCTOS ESPERADOS',
                isActive: true,
                config: {
                    productColumns: {
                        showCategory: true,
                        showQuantity: true,
                        showVerificationMeans: true,
                        showDeadline: true
                    }
                }
            },
            {
                id: 'block-impacts',
                type: 'impacts' as BlockType,
                title: '6. IMPACTO DEL PROYECTO',
                isActive: true,
                config: {
                    showImpactoSocial: true,
                    showImpactoCientifico: true,
                    showImpactoEconomico: true,
                    showImpactoPolitico: true,
                    showImpactoAmbiental: true
                }
            },
            {
                id: 'block-gantt',
                type: 'gantt' as BlockType,
                title: '7. CRONOGRAMA DE ACTIVIDADES',
                isActive: true,
                config: {
                    ganttMonths: ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Febrero'],
                    ganttObjectives: [
                        {
                            id: `obj-${Date.now()}`,
                            name: 'OBJETIVO N° 1',
                            activities: [
                                { id: `act-${Date.now()}`, name: 'Especificar la actividad', resources: '', startMonth: 0, startWeek: 0, endMonth: 1, endWeek: 3, color: '#60a5fa' as const },
                                { id: `act-${Date.now() + 1}`, name: 'Especificar la actividad', resources: '', startMonth: 2, startWeek: 0, endMonth: 3, endWeek: 3, color: '#f97316' as const },
                            ]
                        }
                    ]
                }
            },
            {
                id: 'block-bibliography',
                type: 'rich_text' as BlockType,
                title: '8. BIBLIOGRAFÍA',
                isActive: true,
                config: {
                    title: '8. Bibliografía',
                    placeholder: 'Registrar entre 10 y 15 fuentes bibliográficas con normas APA 7ma edición...'
                }
            },
            createBaseSignaturesBlock([
                { label: 'Director del Proyecto', name: '{{director_proyecto}}', role: 'Director de Proyecto' },
                { label: 'Coordinación de Carrera', name: '{{coordinador_carrera}}', role: 'Coordinador de Carrera' }
            ])
        ];
    }

    // C. INFORME DE AVANCE
    if (code === 'INFORME_AVANCE') {
        return [
            createBaseCoverBlock('INFORME DE AVANCE DE INVESTIGACIÓN', { colorTitle: 'navy' }),
            {
                id: 'block-progress-1', type: 'progress_header_section' as BlockType, title: '1. Encabezado e Identificación', isActive: true,
                config: { progressHeaderColor: 'navy', progressHeaderBorder: 'solid' }
            },
            {
                id: 'block-progress-2', type: 'progress_activity_section' as BlockType, title: '2. Matriz de Actividades Ejecutadas', isActive: true,
                config: { activityVariant: 'ejecutadas', activityTableTitle: 'MATRIZ DE ACTIVIDADES EJECUTADAS', activityHeaderColor: 'navy' }
            },
            {
                id: 'block-progress-3', type: 'progress_activity_section' as BlockType, title: '3. Actividades No Previstas y Replanificadas', isActive: true,
                config: { activityVariant: 'no_previstas', activityTableTitle: 'ACTIVIDADES NO PREVISTAS', activityHeaderColor: 'gold' }
            },
            {
                id: 'block-progress-4', type: 'progress_activity_section' as BlockType, title: '4. Obstáculos y Medidas Correctivas', isActive: true,
                config: { activityVariant: 'obstaculos', activityTableTitle: 'OBSTÁCULOS Y DIFICULTADES ENCONTRADAS', activityHeaderColor: 'crimson' }
            },
            {
                id: 'block-progress-5', type: 'progress_products_section' as BlockType, title: '5. Estado de Productos y Entregables', isActive: true,
                config: { progressHeaderColor: 'navy' }
            },
            {
                id: 'block-progress-6', type: 'progress_budget_section' as BlockType, title: '6. Ejecución Presupuestaria y Financiera', isActive: true,
                config: { progressHeaderColor: 'navy' }
            },
            createBaseSignaturesBlock([
                { label: 'Director del Proyecto', name: '{{director_proyecto}}', role: 'Director de Proyecto' },
                { label: 'Coordinación de Investigación', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de Investigación' }
            ])
        ];
    }

    // D. INFORME FINAL DE INVESTIGACIÓN
    if (code === 'INFORME_FINAL_INVESTIGACION') {
        return [
            createBaseCoverBlock('INFORME FINAL DE INVESTIGACIÓN', { colorTitle: 'navy' }),
            { id: 'block-indice', type: 'rich_text' as BlockType, title: 'ÍNDICE', isActive: true, config: { text: 'ÍNDICE GENERAL DEL INFORME' } },
            { id: 'block-resumen', type: 'rich_text' as BlockType, title: 'RESUMEN', isActive: true, config: { text: 'RESUMEN EJECUTIVO' } },
            { id: 'block-introduccion', type: 'rich_text' as BlockType, title: 'INTRODUCCIÓN', isActive: true, config: { text: 'INTRODUCCIÓN' } },
            { id: 'block-objetivos', type: 'rich_text' as BlockType, title: 'OBJETIVOS', isActive: true, config: { text: 'OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS' } },
            { id: 'block-fundamentos', type: 'rich_text' as BlockType, title: 'FUNDAMENTOS', isActive: true, config: { text: 'FUNDAMENTOS' } },
            { id: 'block-metodos', type: 'rich_text' as BlockType, title: 'MÉTODOS', isActive: true, config: { text: 'MÉTODOS' } },
            { id: 'block-resultados', type: 'rich_text' as BlockType, title: 'RESULTADOS', isActive: true, config: { text: 'RESULTADOS' } },
            { id: 'block-productos', type: 'rich_text' as BlockType, title: 'PRODUCTOS', isActive: true, config: { text: 'PRODUCTOS' } },
            { id: 'block-impactos', type: 'rich_text' as BlockType, title: 'IMPACTOS', isActive: true, config: { text: 'IMPACTOS' } },
            { id: 'block-transferencia', type: 'rich_text' as BlockType, title: 'TRANSFERENCIA', isActive: true, config: { text: 'TRANSFERENCIA DE RESULTADOS' } },
            { id: 'block-informe_financiero', type: 'rich_text' as BlockType, title: 'INFORME FINANCIERO', isActive: true, config: { text: 'INFORME FINANCIERO DE GASTOS' } },
            { id: 'block-conclusiones', type: 'rich_text' as BlockType, title: 'CONCLUSIONES', isActive: true, config: { text: 'CONCLUSIONES' } },
            { id: 'block-recomendaciones', type: 'rich_text' as BlockType, title: 'RECOMENDACIONES', isActive: true, config: { text: 'RECOMENDACIONES' } },
            { id: 'block-bibliografia', type: 'rich_text' as BlockType, title: 'BIBLIOGRAFÍA', isActive: true, config: { text: 'BIBLIOGRAFÍA' } },
            createBaseSignaturesBlock([
                { label: 'Director del Proyecto', name: '{{director_proyecto}}', role: 'Director de Proyecto' },
                { label: 'Comisión de Evaluación', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de Investigación' }
            ])
        ];
    }

    // E. PLAN DE APRENDIZAJE DE LOS ESTUDIANTES
    if (code === 'PLAN_APRENDIZAJE') {
        return [
            {
                id: 'block-plan-1', type: 'learning_plan_header_section' as BlockType, title: '1. Identificación del Proyecto & Estudiante', isActive: true,
                config: { learningPlanHeaderColor: 'navy', showObjetivoGeneral: true, allowMultipleEstudiantes: true }
            },
            {
                id: 'block-plan-2', type: 'learning_plan_prerequisites_section' as BlockType, title: '2. Prerrequisitos Previos (Cognitivos y Procedimentales)', isActive: true,
                config: { learningPlanHeaderColor: 'navy', minCognitivos: 3, minProcedimentales: 5 }
            },
            {
                id: 'block-plan-3', type: 'learning_plan_activities_section' as BlockType, title: '3. Plan de Aprendizaje (Actividades APE)', isActive: true,
                config: { learningPlanHeaderColor: 'navy', showHorasTrabajo: true, showResultadosAprendizaje: true }
            },
            createBaseSignaturesBlock([
                { label: 'Elaborado por:', name: 'Ing. {{director_proyecto}}', role: 'Director del Proyecto' },
                { label: 'Revisado por:', name: 'MSc. Christian Castro', role: 'Coordinador de la Unidad de Investigación' }
            ])
        ];
    }

    // E.2 EVALUACIÓN DEL PLAN DE APRENDIZAJE (ADMINISTRADOR)
    if (code === 'EVALUACION_PLAN_APRENDIZAJE') {
        return [
            createBaseCoverBlock('INSTRUMENTO DE EVALUACIÓN DEL PLAN DE APRENDIZAJE DE LOS ESTUDIANTES', { colorTitle: 'navy' }),
            {
                id: 'block-eval-1', type: 'learning_plan_header_section' as BlockType, title: '1. Identificación del Proyecto & Estudiante', isActive: true,
                config: { learningPlanHeaderColor: 'navy', showObjetivoGeneral: false }
            },
            {
                id: 'block-eval-2', type: 'learning_plan_eval_parameters_section' as BlockType, title: '2. Parámetros de Evaluación (Escala Cualitativa 1-4)', isActive: true,
                config: { learningPlanHeaderColor: 'navy' }
            },
            {
                id: 'block-eval-3', type: 'learning_plan_prerequisites_section' as BlockType, title: '3. Evaluación de Prerrequisitos (Cognitivos y Procedimentales)', isActive: true,
                config: { learningPlanHeaderColor: 'navy', learningPlanMode: 'evaluacion', minCognitivos: 3, minProcedimentales: 5 }
            },
            {
                id: 'block-eval-4', type: 'learning_plan_activities_section' as BlockType, title: '4. Evaluación del Plan de Aprendizaje (Actividades Ejecutadas)', isActive: true,
                config: { learningPlanHeaderColor: 'navy', learningPlanMode: 'evaluacion' }
            },
            {
                id: 'block-eval-5', type: 'learning_plan_evaluation_table' as BlockType, title: '5. Resultados Generales (Consolidado de Promedios)', isActive: true,
                config: { learningPlanHeaderColor: 'navy' }
            },
            createBaseSignaturesBlock([
                { label: 'Elaborado por', name: '{{director_proyecto}}', role: 'Director del Proyecto' },
                { label: 'Revisado por', name: 'MSc. Christian Castro', role: 'Coordinador de la Unidad de Investigación' }
            ])
        ];
    }

    // F. RÚBRICA DE EVALUACIÓN POR PARES
    if (code === 'RUBRICA_EVALUACION') {
        return [
            createBaseCoverBlock('RÚBRICA DE EVALUACIÓN TÉCNICA POR PARES', { colorTitle: 'navy' }),
            {
                id: 'block-sec-1', type: 'title' as BlockType, title: '1. Información del Proyecto', isActive: true,
                config: { text: '1. INFORMACIÓN DEL PROYECTO DE INVESTIGACIÓN', fontSize: 'H2', colorTema: '#1e2a4a', alignTitle: 'left' }
            },
            {
                id: 'block-sec-2', type: 'title' as BlockType, title: '2. Datos del Evaluador Técnico', isActive: true,
                config: { text: '2. DATOS DEL EVALUADOR TÉCNICO ACREDITADO', fontSize: 'H2', colorTema: '#1e2a4a', alignTitle: 'left' }
            },
            {
                id: 'block-sec-3', type: 'title' as BlockType, title: '3. Declaración de Conflicto de Interés', isActive: true,
                config: { text: '3. DECLARACIÓN DE AUSENCIA DE CONFLICTO DE INTERÉS', fontSize: 'H2', colorTema: '#1e2a4a', alignTitle: 'left' }
            },
            {
                id: 'block-rubric', type: 'rubric_table' as BlockType, title: '4. Tabla de Criterios (Rúbrica Dinámica)', isActive: true,
                config: { mostrarDescripcionCriterio: true, mostrarObservacionesCriterio: true, mostrarConflictoInteres: true, mostrarJustificacionRecomendacion: true, mostrarResumenPuntuacion: true }
            },
            {
                id: 'block-sec-5', type: 'title' as BlockType, title: '5. Observaciones Fundamentales', isActive: true,
                config: { text: '5. OBSERVACIONES Y COMENTARIOS FUNDAMENTALES', fontSize: 'H2', colorTema: '#1e2a4a', alignTitle: 'left' }
            },
            {
                id: 'block-sec-6', type: 'title' as BlockType, title: '6. Dictamen Final', isActive: true,
                config: { text: '6. DICTAMEN Y RECOMENDACIÓN FINAL DEL EVALUADOR', fontSize: 'H2', colorTema: '#1e2a4a', alignTitle: 'left' }
            },
            createBaseSignaturesBlock([
                { label: 'Firma del Evaluador Técnico', name: '{{evaluador_nombre}}', role: 'Par Evaluador Acreditado' }
            ])
        ];
    }

    // F. DICTAMEN DE ARBITRAJE
    if (code === 'DICTAMEN_ARBITRAJE') {
        return [
            createBaseCoverBlock('ACTA DE DICTAMEN DE ARBITRAJE', { colorTitle: 'navy' }),
            {
                id: 'block-dictamen-1', type: 'arbitration_dictamen_section' as BlockType, title: 'Acta de Dictamen de Arbitraje Consolidado', isActive: true,
                config: { mostrarAvisoDobleCiego: true, mostrarDatosProyectoDictamen: true, mostrarPanelArbitros: true, mostrarTarjetaResolucion: true, mostrarObservacionesConsolidadas: true, mostrarCertificacionInstitucional: true }
            },
            createBaseSignaturesBlock([
                { label: 'Dirección de Investigación', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de Investigación e Innovación' }
            ])
        ];
    }

    // G. OFICIO DE APROBACIÓN
    if (code === 'OFICIO_APROBACION') {
        return [
            {
                id: 'block-1', type: 'title' as BlockType, title: 'Encabezado del Oficio', isActive: true,
                config: { text: 'OFICIO DE APROBACIÓN DE PROYECTO DE INVESTIGACIÓN', fontSize: 'H1', colorTema: '#1b263b', alignTitle: 'center' }
            },
            {
                id: 'block-2', type: 'project_approval_notice' as BlockType, title: 'Resumen y Dictamen del Proyecto', isActive: true,
                config: {
                    ciudad_emision: 'Quito',
                    mostrarLogoHeader: false,
                    parrafo_aprobacion: 'Reciba un cordial saludo y por medio del presente, es un placer informarle que, tras la evaluación correspondiente, su proyecto de investigación titulado "{{proyecto_titulo}}" ha sido aprobado por la Coordinación de la Unidad de Investigación.',
                    parrafo_fundamento: 'La aprobación se basa en la relevancia y viabilidad del proyecto, así como en su alineación con los objetivos académicos de nuestra institución, quedando establecidos la siguiente información:',
                    textoCACES: 'Las actividades complementarias al desarrollo del proyecto son los Informes de Seguimiento mensuales, con sus respectivos anexos que respalden las actividades ejecutadas, además de, el Plan de Aprendizaje y Evaluación del Plan de Aprendizaje por cada estudiante que forme parte del grupo de investigación y culminando con la Difusión de Resultados obtenidos del proyecto ejecutado.',
                    parrafo_invitacion: 'Le animamos a proceder con la ejecución del proyecto, manteniendo los estándares de calidad y ética que nos caracterizan. Asimismo, quedamos a su disposición para brindarle el apoyo necesario durante el desarrollo de su investigación.',
                    frase_cierre: 'Con sentimientos de distinguida consideración.',
                    frase_despedida: 'Atentamente,',
                    coordinador_nombre: 'Ing. Estefani Sánchez Mgtr.',
                    coordinador_cargo: 'Coordinadora de la Unidad de Investigación e Innovación',
                    firmante_institucion: 'INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI',
                    mostrarCompromisosCACES: true,
                    mostrarTablaFechas: true
                }
            },
            createBaseSignaturesBlock([
                { label: 'Atentamente,', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de la Unidad de Investigación e Innovación' }
            ])
        ];
    }

    // H. PROPUESTA DE GRUPO DE INVESTIGACIÓN
    if (code === 'PROPUESTA_GRUPO_INVESTIGACION' || code.includes('GRUPO') && !code.includes('CERTIFICADO') || category === 40 || category === 44) {
        return [
            createBaseCoverBlock('PROPUESTA DE CREACIÓN DE GRUPO DE INVESTIGACIÓN', { colorTitle: 'navy' }),
            {
                id: 'block-title-1',
                type: 'title' as BlockType,
                title: '1. DATOS GENERALES DEL GRUPO DE INVESTIGACIÓN',
                isActive: true,
                config: { text: '1. DATOS GENERALES DEL GRUPO DE INVESTIGACIÓN', fontSize: 'H2', color: '#1e2a4a' }
            },
            {
                id: 'block-table-datos',
                type: 'advanced_table' as BlockType,
                title: 'Ficha de Identificación del Grupo',
                isActive: true,
                config: {
                    headers: ['Parámetro Institucional', 'Detalle de la Propuesta'],
                    rows: [
                        { cells: ['Nombre Oficial del Grupo', '{{nombre_grupo}}'] },
                        { cells: ['Siglas / Acrónimo', '{{siglas}}'] },
                        { cells: ['Tipo de Grupo', '{{tipo_grupo}}'] },
                        { cells: ['Docente Coordinador / Líder', '{{coordinador_nombre}} (C.I. {{coordinador_cedula}} | Email: {{coordinador_email}} | Tel: {{coordinador_telefono}})'] },
                        { cells: ['Dominio Académico Vinculado', '{{dominio_nombre}}'] },
                        { cells: ['Líneas de Investigación', '{{lineas_investigacion}}'] },
                        { cells: ['Carreras Vinculadas', '{{carreras_vinculadas}}'] },
                        { cells: ['Categoría de Consolidación', '{{categoria_consolidacion}}'] },
                        { cells: ['Fecha de Presentación', '{{fecha_presentacion}}'] }
                    ],
                    headerColor: 'navy',
                    borderStyle: 'solid'
                }
            },
            {
                id: 'block-title-2',
                type: 'title' as BlockType,
                title: '2. IDENTIDAD ESTRATÉGICA Y PROPÓSITO',
                isActive: true,
                config: { text: '2. IDENTIDAD ESTRATÉGICA Y PROPÓSITO', fontSize: 'H2', color: '#1e2a4a' }
            },
            {
                id: 'block-mision-vision',
                type: 'two_column' as BlockType,
                title: 'Misión y Visión',
                isActive: true,
                config: {
                    leftTitle: 'MISIÓN DEL GRUPO',
                    leftContent: '{{mision}}',
                    rightTitle: 'VISIÓN DEL GRUPO',
                    rightContent: '{{vision}}'
                }
            },
            {
                id: 'block-title-3',
                type: 'title' as BlockType,
                title: '3. OBJETIVO GENERAL DEL GRUPO',
                isActive: true,
                config: { text: '3. OBJETIVO GENERAL DEL GRUPO', fontSize: 'H2', color: '#1e2a4a' }
            },
            {
                id: 'block-objetivo',
                type: 'rich_text' as BlockType,
                title: 'Objetivo General',
                isActive: true,
                config: { text: '<p>{{objetivo_general}}</p>' }
            },
            {
                id: 'block-pagebreak-1',
                type: 'page_break' as BlockType,
                title: 'Salto de Página',
                isActive: true,
                config: {}
            },
            {
                id: 'block-title-4',
                type: 'title' as BlockType,
                title: '4. EQUIPO DE INVESTIGADORES Y SEMILLERISTAS',
                isActive: true,
                config: { text: '4. EQUIPO DE INVESTIGADORES Y SEMILLERISTAS', fontSize: 'H2', color: '#1e2a4a' }
            },
            createBaseSignaturesBlock([
                { label: 'Docente Coordinador del Grupo', name: '{{coordinador_nombre}}', role: 'Coordinador / Líder' },
                { label: 'Dirección de Investigación (DIITRA)', name: 'DIITRA - ISTPET', role: 'Revisión y Registro Institucional' }
            ])
        ];
    }

    // I. CERTIFICADOS
    if (code.includes('CERTIFICADO') || category === 6 || category === 7) {
        const isCompletacion = code.includes('COMPLETACION');
        return [
            {
                id: 'block-cert-header',
                type: 'certificate_header' as BlockType,
                title: 'Encabezado Oficial del Certificado',
                isActive: true,
                config: {
                    certificateTitle: isCompletacion ? 'CERTIFICADO DE CULMINACIÓN' : 'CERTIFICADO DE PARTICIPACIÓN',
                    certificateSubtitle: 'INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI'
                }
            },
            {
                id: 'block-cert-badge',
                type: 'certificate_recipient_badge' as BlockType,
                title: 'Insignia y Datos del Destinatario',
                isActive: true,
                config: {
                    recipientName: '{{destinatario_nombre}}',
                    recipientRole: '{{destinatario_rol}}',
                    recipientCedula: '{{destinatario_cedula}}'
                }
            },
            {
                id: 'block-cert-body',
                type: 'certificate_body' as BlockType,
                title: 'Cuerpo del Certificado y Firmas',
                isActive: true,
                config: {
                    textAchievement: isCompletacion
                        ? 'Por haber completado satisfactoriamente su participación en el proyecto de investigación titulado "{{proyecto_titulo}}", habiendo cumplido con todos los requisitos académicos y normativos establecidos por la institución.'
                        : 'Por su destacada y activa participación como miembro del Grupo de Investigación "{{grupo_nombre}}", contribuyendo al desarrollo científico y académico institucional.',
                    completionDate: '{{fecha_emision}}',
                    signatories: [
                        { label: 'Rectorado', name: 'Dra. Rectora', role: 'Rectora Institucional' },
                        { label: 'Coordinación de Investigación', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora de Investigación' }
                    ]
                }
            }
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FÁBRICA INTELIGENTE EXTENSIBLE (FALLBACK POR CATEGORÍA DE NEGOCIO)
    // ─────────────────────────────────────────────────────────────────────────
    const fallbackTitle = template.name || 'DOCUMENTO INSTITUCIONAL';

    return [
        createBaseCoverBlock(fallbackTitle.toUpperCase(), { colorTitle: 'navy' }),
        {
            id: 'block-gen-auto',
            type: 'project_general_section' as BlockType,
            title: '1. IDENTIFICACIÓN Y DATOS GENERALES',
            isActive: true,
            config: {
                showTitulo: true,
                showPrograma: true,
                showGrupo: true,
                showLinea: true,
                showDirector: true,
                showFechas: true
            }
        },
        {
            id: 'block-part-auto',
            type: 'researchers_table' as BlockType,
            title: '2. EQUIPO DE PARTICIPANTES',
            isActive: true,
            config: { mostrarCedula: true, mostrarEmail: true, mostrarHoras: true }
        },
        {
            id: 'block-tech-auto',
            type: 'project_technical_section' as BlockType,
            title: '3. ESPECIFICACIÓN Y PLAN DE TRABAJO',
            isActive: true,
            config: {
                technicalSections: RESEARCH_TECHNICAL_SUBSECTIONS
            }
        },
        {
            id: 'block-prod-auto',
            type: 'expected_products' as BlockType,
            title: '4. ENTREGABLES Y RESULTADOS COMPROMETIDOS',
            isActive: true,
            config: {
                productColumns: {
                    showCategory: true,
                    showQuantity: true,
                    showVerificationMeans: true
                }
            }
        },
        {
            id: 'block-budg-auto',
            type: 'project_budget_section' as BlockType,
            title: '5. RECURSOS Y FINANCIAMIENTO',
            isActive: true,
            config: {
                showRecursosDisponibles: true,
                showRecursosNecesarios: true,
                showFinanciamiento: true
            }
        },
        createBaseSignaturesBlock([
            { label: 'Responsable del Documento', name: '{{director_proyecto}}', role: 'Responsable' },
            { label: 'Coordinación Institucional', name: 'Ing. Estefani Sánchez Mgtr.', role: 'Coordinadora' }
        ])
    ];
}
