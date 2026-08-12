export interface DocumentTemplateDto {
    id: number;
    code: string;
    name: string;
    description: string | null;
    category: number;
    version: number;
    isActive: boolean;
    requiresLopdpClause: boolean;
    supportsBlindMode: boolean;
    requiresElectronicSignature: boolean;
    signatureType: string;
    collaborativeFieldsJson: string | null;
    updatedAt: string;
    updatedBy: string | null;
    htmlContent?: string;
    customCss?: string | null;
    themeConfigJson?: string | null;
}

export interface TableRow {
    cells: string[];
}

export interface BentoGridItem {
    id: string;
    key: string;
    label: string;
    type: 'core' | 'custom';
    colSpan: 1 | 2 | 3;
    enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de bloque soportados por el constructor visual
// ─────────────────────────────────────────────────────────────────────────────
export type BlockType =
    | 'cover'
    | 'title'
    | 'rich_text'
    | 'advanced_table'
    | 'multi_section_table'
    | 'two_column'
    | 'page_break'
    | 'gantt'
    | 'researchers_table'
    | 'rubric_table'
    | 'signatures'
    | 'project_general_section'
    | 'project_technical_section'
    | 'project_progress_report'
    | 'resources'
    | 'expected_products'
    | 'impacts'
    | 'project_approval_notice'
    | 'progress_header_section'
    | 'progress_activity_section'
    | 'final_report_header_section'
    | 'final_report_writing_section'
    | 'arbitration_dictamen_section'
    | 'project_budget_section';

// ─────────────────────────────────────────────────────────────────────────────
// Configuraciones de bloques específicos
// ─────────────────────────────────────────────────────────────────────────────

export interface TableSection {
    title: string;
    headerStyle: 'blue' | 'gold' | 'gray' | 'none';
    headers: string[];
    colWidths: string[];
    rows: TableRow[];
}

export type ColumnCount = 2 | 3 | 4 | 5 | 6;

export interface Signatory {
    label: string;
    name: string;
    role: string;
}

export interface TechnicalSubsection {
    id: string;
    fieldKey: string;           // p. ej. 'Antecedentes', 'MarcoTeorico', 'custom_1'
    numberPrefix?: string;       // p. ej. '3.1', '1.1'
    title: string;              // p. ej. 'Antecedentes de la Problemática'
    placeholder?: string;        // Guía/Instrucción de redacción
    requirementText?: string;    // Requisito institucional visible en formato tabla/PDF (ej: DETALLAR EN DOS PÁRRAFOS...)
    enabled: boolean;
    scribanVariable?: string;   // Variable Scriban Handlebars en PDF
    legacyKey?: string;         // Referencia booleana retrocompatible (p. ej. 'showAntecedentes')
    colSpan?: 1 | 2;            // 1 = 50% (media fila), 2 = 100% (fila completa)
    variant?: 'standard' | 'banner_gold' | 'banner_navy' | 'header_only';
    hasContent?: boolean;       // true = posee campo redactable (CoWork); false = separador / encabezado puro
    headerColor?: 'navy' | 'gold' | 'slate' | 'emerald' | string;
    isGroupHeader?: boolean;    // true = actúa como categoría/grupo de subsecciones
    parentId?: string;          // ID o fieldKey de la subsección padre
}

export const DEFAULT_TECHNICAL_SUBSECTIONS: TechnicalSubsection[] = [
    { id: 'sec_antecedentes', fieldKey: 'Antecedentes', numberPrefix: '3.1', title: 'ANTECEDENTES ESPECÍFICOS DE LA PROBLEMÁTICA', placeholder: 'Identificar y analizar estudios previos...', requirementText: 'DETALLAR EN DOS PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, scribanVariable: 'antecedentes', legacyKey: 'showAntecedentes', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_descripcion', fieldKey: 'DescripcionProyecto', numberPrefix: '3.2', title: 'DESCRIPCIÓN DEL PROYECTO', placeholder: 'Definir el propósito del proyecto...', requirementText: 'DETALLAR EN UN PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, scribanVariable: 'descripcion_proyecto', legacyKey: 'showDescripcionProyecto', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_justificacion', fieldKey: 'Justificacion', numberPrefix: '3.3', title: 'JUSTIFICACIÓN', placeholder: 'Especificar la importancia científica...', requirementText: 'CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, scribanVariable: 'justificacion', legacyKey: 'showJustificacion', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_banner_objetivos', fieldKey: 'BannerObjetivos', numberPrefix: '3.4', title: 'OBJETIVOS', placeholder: '', requirementText: '', enabled: true, scribanVariable: 'banner_objetivos', colSpan: 2, variant: 'banner_gold', hasContent: false, isGroupHeader: true },
    { id: 'sec_objetivo_general', fieldKey: 'ObjetivoGeneral', numberPrefix: '', title: 'GENERAL', placeholder: 'Formular el objetivo general...', requirementText: 'VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?', enabled: true, scribanVariable: 'objetivo_general', legacyKey: 'showObjetivoGeneral', colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_objetivos_especificos', fieldKey: 'ObjetivosEspecificos', numberPrefix: '', title: 'ESPECÍFICOS', placeholder: '1. Desarrollar...\n2. Implementar...', requirementText: 'INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO', enabled: true, scribanVariable: 'objetivos_especificos', legacyKey: 'showObjetivosEspecificos', colSpan: 1, variant: 'banner_navy', hasContent: true, parentId: 'sec_banner_objetivos' },
    { id: 'sec_ods', fieldKey: 'ObjetivosDesarrolloSostenible', numberPrefix: '3.5', title: 'OBJETIVOS DE DESARROLLO SOSTENIBLE', placeholder: 'Los objetivos de desarrollo sostenible de la ONU son 17...', requirementText: 'Alineación con Objetivos de Desarrollo Sostenible ONU', enabled: true, scribanVariable: 'objetivos_desarrollo_sostenible', legacyKey: 'showOds', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_marco_teorico', fieldKey: 'MarcoTeorico', numberPrefix: '3.6', title: 'MARCO TEÓRICO', placeholder: 'Describir los conceptos clave...', requirementText: 'EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS, CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, scribanVariable: 'marco_teorico', legacyKey: 'showMarcoTeorico', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_metodologia', fieldKey: 'Metodologia', numberPrefix: '3.7', title: 'METODOLOGÍA', placeholder: 'Describir el enfoque metodológico...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, scribanVariable: 'metodologia', legacyKey: 'showMetodologia', colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_evaluacion', fieldKey: 'Evaluacion', numberPrefix: '3.8', title: 'EVALUACIÓN', placeholder: 'Describir los criterios e indicadores...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, scribanVariable: 'evaluacion', legacyKey: 'showEvaluacion', colSpan: 2, variant: 'standard', hasContent: true }
];

export interface FinalReportWritingSubsection {
    id: string;
    fieldKey: string;
    numberPrefix?: string;
    title: string;
    placeholder?: string;
    requirementText?: string;
    enabled: boolean;
    colSpan?: 1 | 2;
    variant?: 'standard' | 'banner_navy' | 'banner_gold' | string;
    hasContent?: boolean;
    isGroupHeader?: boolean;
    parentId?: string;
}

export const DEFAULT_FINAL_REPORT_WRITING_SUBSECTIONS: FinalReportWritingSubsection[] = [
    { id: 'sec_indice', fieldKey: 'Indice', numberPrefix: '2.', title: 'ÍNDICE', placeholder: 'Elaborar un índice detallado con los títulos y subtítulos del informe, numerando cada sección de acuerdo con el formato del documento.\nIncluir las páginas correspondientes a cada sección.\nIncluir el índice de tablas.\nIncluir el índice de imágenes.', requirementText: 'DETALLAR ÍNDICE DE CONTENIDO, TABLAS E IMÁGENES', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_resumen', fieldKey: 'Resumen', numberPrefix: '3.', title: 'RESUMEN', placeholder: '(250-300 palabras, 3-4 párrafos)\nPresentar una síntesis clara del proyecto, destacando el problema abordado, los objetivos, la metodología, los principales resultados y conclusiones.\nDebe redactarse en tercera persona y sin incluir citas.', requirementText: '250-300 PALABRAS, 3-4 PÁRRAFOS - TERCERA PERSONA SIN CITAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_introduccion', fieldKey: 'Introduccion', numberPrefix: '4.', title: 'INTRODUCCIÓN', placeholder: '(500-700 palabras, 5-7 párrafos)\nExplicar el contexto y la relevancia del proyecto de investigación.\nDefinir el problema central y justificar su importancia.\nDescribir brevemente el enfoque metodológico utilizado.\nMencionar el impacto esperado del proyecto.\nIncluir citas según normas APA 7ª edición.', requirementText: '500-700 PALABRAS, 5-7 PÁRRAFOS - NORMAS APA 7ª EDICIÓN', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_objetivos', fieldKey: 'Objetivos', numberPrefix: '5.', title: 'OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS', placeholder: 'Escriba su objetivo general.\nEscriba sus objetivos específicos, en forma de lista, orientados a la consecución del objetivo general.', requirementText: 'OBJETIVO GENERAL + LISTA DE OBJETIVOS ESPECÍFICOS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_fundamentos', fieldKey: 'Fundamentos', numberPrefix: '6.', title: 'FUNDAMENTOS', placeholder: '(EXTENSIÓN VARIABLE)\nDescribir los conceptos clave, antecedentes y fundamentos teóricos que respaldan el proyecto.\nIncluir referencias a estudios previos, normativas o metodologías relacionadas.\nCITAR USANDO normas APA 7ª edición.\nPuede extenderse según la necesidad del tema.', requirementText: 'EXTENSIÓN VARIABLE - CITAR USANDO NORMAS APA 7ª EDICIÓN', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_metodos', fieldKey: 'Metodos', numberPrefix: '7.', title: 'MÉTODOS', placeholder: '(700-900 palabras, 5-8 párrafos)\nExplicar detalladamente la metodología utilizada en la investigación.\nDescribir las técnicas, herramientas e instrumentos empleados para la recolección y análisis de datos.\nJustificar la elección de métodos y procedimientos.\nIncluir un cuadro o esquema si es necesario.', requirementText: '700-900 PALABRAS, 5-8 PÁRRAFOS - TÉCNICAS E INSTRUMENTOS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_resultados', fieldKey: 'Resultados', numberPrefix: '8.', title: 'RESULTADOS', placeholder: '(800-1200 palabras, 6-12 párrafos)\nExponer los hallazgos obtenidos en la investigación.\nPresentar datos relevantes a través de gráficos, tablas o figuras si es necesario.\nInterpretar los resultados de manera objetiva.\nComparar con investigaciones previas si aplica.', requirementText: '800-1200 PALABRAS, 6-12 PÁRRAFOS - GRÁFICOS, TABLAS O FIGURAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_productos', fieldKey: 'Productos', numberPrefix: '9.', title: 'PRODUCTOS', placeholder: '(400-600 palabras, 4-6 párrafos)\nDescribir los productos generados a partir del proyecto (publicaciones, prototipos, software, modelos, documentos técnicos, etc.).\nIncluir evidencia tangible de estos productos si aplica.', requirementText: '400-600 PALABRAS, 4-6 PÁRRAFOS - PUBLICACIONES Y SOFTWARE', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_impactos', fieldKey: 'Impactos', numberPrefix: '10.', title: 'IMPACTOS', placeholder: '(500-800 palabras, 5-8 párrafos)\nExplicar los impactos generados por el proyecto en términos científicos, tecnológicos, sociales, económicos o educativos.\nPresentar evidencia de la aplicación práctica de los resultados.', requirementText: '500-800 PALABRAS, 5-8 PÁRRAFOS - IMPACTOS CIENTÍFICOS Y SOCIALES', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_transferencia', fieldKey: 'Transferencia', numberPrefix: '11.', title: 'TRANSFERENCIA DE RESULTADOS', placeholder: '(400-600 palabras, 4-6 párrafos)\nDescribir cómo se han compartido o aplicado los resultados del proyecto en otros ámbitos.\nMencionar convenios, publicaciones, capacitaciones o implementaciones en organizaciones externas.', requirementText: '400-600 PALABRAS, 4-6 PÁRRAFOS - CONVENIOS Y APLICACIONES', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_informe_financiero', fieldKey: 'InformeFinanciero', numberPrefix: '12.', title: 'INFORME FINANCIERO DE GASTOS', placeholder: '(Extensión variable)\nPresentar un desglose detallado de los recursos utilizados en el proyecto.\nIncluir tablas que especifiquen montos, conceptos y justificaciones de los gastos.', requirementText: 'EXTENSIÓN VARIABLE - TABLAS Y JUSTIFICACIÓN DE GASTOS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_conclusiones', fieldKey: 'Conclusiones', numberPrefix: '13.', title: 'CONCLUSIONES', placeholder: '(500-700 palabras, 5-7 párrafos)\nResumir los principales hallazgos del proyecto.\nExplicar si los objetivos planteados fueron alcanzados.\nMencionar limitaciones y posibles mejoras futuras.', requirementText: '500-700 PALABRAS, 5-7 PÁRRAFOS - LOGRO DE OBJETIVOS Y LIMITACIONES', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_recomendaciones', fieldKey: 'Recomendaciones', numberPrefix: '14.', title: 'RECOMENDACIONES', placeholder: '(500-700 palabras, 5-7 párrafos)\nProponer acciones concretas basadas en los hallazgos del proyecto.\nSugerir mejoras en la metodología, implementación o futuras líneas de investigación.\nIndicar estrategias para la aplicación práctica de los resultados en contextos académicos, industriales o sociales.\nConsiderar limitaciones detectadas y cómo superarlas en investigaciones futuras.\nLas recomendaciones deben ser viables, realistas y alineadas con los objetivos del proyecto.', requirementText: '500-700 PALABRAS, 5-7 PÁRRAFOS - ACCIONES VIABLES Y MEJORAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_bibliografia', fieldKey: 'Bibliografia', numberPrefix: '15.', title: 'BIBLIOGRAFÍA', placeholder: '(Extensión variable)\nListar fuentes adicionales que hayan sido consultadas, tanto las usadas como aquellas que no necesariamente han sido citadas en el texto.', requirementText: 'NORMAS APA 7ª EDICIÓN', enabled: true, colSpan: 2, variant: 'standard', hasContent: true },
    { id: 'sec_anexos', fieldKey: 'Anexos', numberPrefix: '16.', title: 'ANEXOS', placeholder: '(Extensión variable)\nIncluir documentos complementarios como cuestionarios, encuestas, imágenes, gráficos, diagramas, o capturas de pantalla de herramientas utilizadas.', requirementText: 'DOCUMENTOS COMPLEMENTARIOS Y CAPTURAS', enabled: true, colSpan: 2, variant: 'standard', hasContent: true }
];

export interface ImpactCategory {
    id: string;
    key: string;               // p. ej. 'social', 'cientifico', 'tecnologico'
    title: string;             // p. ej. 'Impacto Social', 'Impacto Tecnológico'
    placeholder?: string;      // Guía o ayuda visual de redacción
    enabled: boolean;
    scribanVariable?: string;  // p. ej. 'impacto.social'
    colSpan?: 1 | 2;           // 1 = 50%, 2 = 100%
    legacyKey?: string;        // p. ej. 'showImpactoSocial'
}

export const DEFAULT_IMPACT_CATEGORIES: ImpactCategory[] = [
    { id: 'imp_social', key: 'social', title: 'Impacto Social', placeholder: 'Descripción del impacto positivo en la comunidad o grupo beneficiario...', enabled: true, scribanVariable: 'impacto.social', legacyKey: 'showImpactoSocial', colSpan: 2 },
    { id: 'imp_cientifico', key: 'cientifico', title: 'Impacto Científico', placeholder: 'Aporte al estado del arte, desarrollo tecnológico o nuevo conocimiento...', enabled: true, scribanVariable: 'impacto.cientifico', legacyKey: 'showImpactoCientifico', colSpan: 2 },
    { id: 'imp_economico', key: 'economico', title: 'Impacto Económico', placeholder: 'Optimización de recursos, retorno de inversión o reactivación productiva...', enabled: true, scribanVariable: 'impacto.economico', legacyKey: 'showImpactoEconomico', colSpan: 2 },
    { id: 'imp_politico', key: 'politico', title: 'Impacto Político', placeholder: 'Aporte a políticas públicas, regulación, normativas o gobernanza...', enabled: true, scribanVariable: 'impacto.politico', legacyKey: 'showImpactoPolitico', colSpan: 2 },
    { id: 'imp_ambiental', key: 'ambiental', title: 'Impacto Ambiental', placeholder: 'Mitigación de huella ecológica, conservación o desarrollo sostenible...', enabled: true, scribanVariable: 'impacto.ambiental', legacyKey: 'showImpactoAmbiental', colSpan: 2 },
    { id: 'imp_otro', key: 'otro', title: 'Otro Impacto', placeholder: 'Cualquier otro impacto institucional o transferible no clasificado...', enabled: true, scribanVariable: 'impacto.otro', legacyKey: 'showImpactoOtro', colSpan: 2 }
];


export interface IdentificationField {
    fieldKey: string;
    label: string;
    fieldType: 'text' | 'date' | 'textarea' | 'select_inline' | 'select_catalog';
    options?: string[];
    catalogUrl?: string;
    catalogLabelKey?: string;
    catalogValueKey?: string;
    colSpan?: 1 | 2;
    scriptMode?: 'scriban' | 'static';
    scriptVariable?: string;
    collaborative?: boolean;
    uppercase?: boolean;
    placeholder?: string;
    required?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gantt
// ─────────────────────────────────────────────────────────────────────────────
export type GanttColor = '#1e2a4a' | '#b8912e' | '#60a5fa' | '#f97316' | '#a855f7' | '#10b981' | '#ef4444' | '#64748b';

export interface GanttActivity {
    id: string;
    name: string;
    resources: string;
    startMonth: number; // 0-indexed dentro del array de meses
    startWeek: number;  // 0-3 (semana dentro del mes)
    endMonth: number;
    endWeek: number;
    color: GanttColor;
}

export interface GanttObjective {
    id: string;
    name: string;
    activities: GanttActivity[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloque principal
// ─────────────────────────────────────────────────────────────────────────────
export interface DocumentBlock {
    id: string;
    type: BlockType;
    title: string;
    isActive: boolean;
    config: {
        isEditableWorkspace?: boolean;
        allowDynamicRows?: boolean;

        // ── cover ──────────────────────────────────────────────────────────
        coverLayoutMode?: 'zones' | 'freeform'; // 'freeform' es el default moderno
        tituloSuperior?: string;
        colorTituloSuperior?: string;
        colorTemaProyecto?: string;
        colorCarrera?: string;
        colorPeriodo?: string;
        colorInstitution?: string;
        estiloTituloSuperior?: 'italic_bold' | 'bold' | 'normal';
        carreraPorDefecto?: string;
        prefijoCarrera?: string;
        periodoPorDefecto?: string;
        prefijoPeriodo?: string;
        colorTema?: string;
        showInstitution?: boolean;
        textoInstitucion?: string;
        coverImage?: string;
        // posicionamiento libre (% relativo al canvas A4 210×297mm)
        xInstitution?: number; yInstitution?: number;  // default: x=10, y=4
        xTitle?: number; yTitle?: number;         // default: x=10, y=35
        xCarrera?: number; yCarrera?: number;       // default: x=10, y=70
        xPeriodo?: number; yPeriodo?: number;       // default: x=10, y=80
        alignInstitution?: string;
        showTitle?: boolean;
        alignTitle?: string;
        showCarrera?: boolean;
        alignCarrera?: string;
        showPeriodo?: boolean;
        alignPeriodo?: string;
        // legacy (zonas fijas - retrocompatibilidad)
        posInstitution?: string;
        posTitle?: string;
        posCarrera?: string;
        posPeriodo?: string;

        // ── title ──────────────────────────────────────────────────────────
        text?: string;
        fontSize?: 'H1' | 'H2' | 'H3';
        color?: string;
        alignment?: 'left' | 'center' | 'right' | 'justify';

        // ── rich_text ──────────────────────────────────────────────────────
        html?: string;             // Contenido HTML serializado por Tiptap
        title?: string;            // Título opcional de sección para bloque rich_text
        placeholder?: string;      // Placeholder o guía de redacción institucional

        // ── advanced_table ─────────────────────────────────────────────────
        headerStyle?: 'blue' | 'gold' | 'gray' | 'none';
        columnCount?: ColumnCount;
        headers?: string[];
        rows?: TableRow[];
        colWidths?: string[];

        // ── multi_section_table ────────────────────────────────────────────
        sections?: TableSection[];

        // ── two_column ─────────────────────────────────────────────────────
        leftTitle?: string;
        leftContent?: string;      // HTML serializado (Tiptap) para columna izquierda
        rightTitle?: string;
        rightContent?: string;     // HTML serializado (Tiptap) para columna derecha
        leftHeaderStyle?: 'blue' | 'gold' | 'gray' | 'none';
        rightHeaderStyle?: 'blue' | 'gold' | 'gray' | 'none';

        // ── gantt ──────────────────────────────────────────────────────────
        ganttMonths?: string[];          // Nombres de los meses del cronograma
        ganttObjectives?: GanttObjective[];

        // ── researchers_table ──────────────────────────────────────────────
        mostrarCedula?: boolean;
        mostrarHoras?: boolean;
        mostrarEmail?: boolean;
        mostrarNivelAcademico?: boolean;
        mostrarTelefono?: boolean;

        // ── rubric_table ───────────────────────────────────────────────────
        mostrarDescripcionCriterio?: boolean;
        mostrarObservacionesCriterio?: boolean;
        mostrarConflictoInteres?: boolean;
        mostrarJustificacionRecomendacion?: boolean;
        mostrarResumenPuntuacion?: boolean;

        // ── arbitration_dictamen_section ───────────────────────────────────
        mostrarAvisoDobleCiego?: boolean;
        mostrarDatosProyectoDictamen?: boolean;
        mostrarPanelArbitros?: boolean;
        mostrarTarjetaResolucion?: boolean;
        mostrarObservacionesConsolidadas?: boolean;
        mostrarCertificacionInstitucional?: boolean;

        // ── signatures ─────────────────────────────────────────────────────
        signatories?: Signatory[];
        textoPieFirma?: string;    // Pie de página institucional

        // ── project_general_section ────────────────────────────────────────
        identificationMode?: 'catalogs' | 'fields';
        tableStyle?: 'classic' | 'grid' | 'cards' | 'minimal' | string;
        borderStyle?: 'solid' | 'none' | string;
        headerColor?: 'navy' | 'primary' | 'emerald' | 'slate' | 'dark' | string;
        bentoColumns?: 2 | 3;
        bentoItems?: BentoGridItem[];
        fieldsOrder?: string[];
        customFields?: IdentificationField[];
        showTitulo?: boolean;
        showPrograma?: boolean;
        showGrupo?: boolean;
        showLinea?: boolean;
        showTipo?: boolean;
        showCaces?: boolean;
        showConvocatoria?: boolean;
        showDirector?: boolean;
        showFechas?: boolean;

        // ── project_technical_section ──────────────────────────────────────
        technicalSections?: TechnicalSubsection[];
        technicalLayoutMode?: 'table_2col' | 'consecutive_sections' | 'cards';
        technicalHeaderColor?: 'navy' | 'gold' | 'slate' | 'emerald';
        showAntecedentes?: boolean;
        showDescripcionProyecto?: boolean;
        showJustificacion?: boolean;
        showObjetivoGeneral?: boolean;
        showObjetivosEspecificos?: boolean;
        showOds?: boolean;
        showMarcoTeorico?: boolean;
        showMetodologia?: boolean;
        showEvaluacion?: boolean;

        // ── project_budget_section ─────────────────────────────────────────
        showRecursosDisponibles?: boolean;
        showRecursosNecesarios?: boolean;
        showFinanciamiento?: boolean;

        // ── impacts ────────────────────────────────────────────────────────
        impactCategories?: ImpactCategory[];
        impactLayoutMode?: 'table' | 'cards' | 'sections';
        impactHeaderColor?: 'navy' | 'gold' | 'slate' | 'emerald' | string;
        productosTitle?: string;
        showImpactoSocial?: boolean;
        showImpactoCientifico?: boolean;
        showImpactoEconomico?: boolean;
        showImpactoPolitico?: boolean;
        showImpactoAmbiental?: boolean;
        showImpactoOtro?: boolean;
        showProductosEsperados?: boolean;

        // ── expected_products ─────────────────────────────────────────────
        productsLayoutMode?: string;
        layoutMode?: string;
        productColumns?: {
            showCategory?: boolean;
            showSubtype?: boolean;
            showProductName?: boolean;
            showIndicator?: boolean;
            showVerificationMeans?: boolean;
            showQuantity?: boolean;
            showDeadline?: boolean;
            [key: string]: boolean | undefined;
        };
        productCategories?: any[];
        categories?: any[];

        // ── project_progress_report ────────────────────────────────────────
        showHitosCompletados?: boolean;
        showEvidencias?: boolean;
        showPresupuestoEjecutado?: boolean;


        // ── progress_header_section ────────────────────────────────────────
        headerTitle?: string;
        progressHeaderFields?: ProgressHeaderField[];
        progressHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        progressHeaderBorder?: 'solid' | 'none' | string;

        // ── progress_activity_section ──────────────────────────────────────
        activityVariant?: ProgressActivityVariant;
        activityColumns?: ProgressActivityColumn[];
        activityTableTitle?: string;
        activityHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        activityAllowDynamicRows?: boolean;

        // ── progress_status_section ────────────────────────────────────────
        statusTitle?: string;
        progressStatusSections?: ProgressStatusSubsection[];
        progressStatusHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        statusOptions?: string[];

        // ── project_approval_notice ────────────────────────────────────────
        ciudad_emision?: string;
        mostrarLogoHeader?: boolean;
        mostrarCompromisosCACES?: boolean;
        mostrarTablaFechas?: boolean;
        parrafo_aprobacion?: string;
        parrafo_fundamento?: string;
        textoCACES?: string;
        parrafo_invitacion?: string;
        frase_cierre?: string;
        frase_despedida?: string;

        // ── final_report_header_section ────────────────────────────────────
        finalReportTitle?: string;
        finalReportHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        showTipoInvestigacion?: boolean;
        showAlcanceProyecto?: boolean;
        showFechasProyecto?: boolean;
        showTablaInvestigadores?: boolean;

        // ── final_report_writing_section ───────────────────────────────────
        writingSections?: FinalReportWritingSubsection[];
        writingLayoutMode?: 'table_2col' | 'stacked' | string;
        writingHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        coordinador_nombre?: string;
        coordinador_cargo?: string;
        firmante_institucion?: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces del Informe de Avance (Subsecciones configurables)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressHeaderField {
    id: string;
    fieldKey: string;
    label: string;
    scribanVariable?: string;
    enabled: boolean;
    colSpan: 1 | 2;
    fieldType: 'text' | 'date' | 'checkbox_group' | 'computed';
    options?: string[];
    placeholder?: string;
    readOnly?: boolean;
}

export const DEFAULT_PROGRESS_HEADER_FIELDS: ProgressHeaderField[] = [
    { id: 'ph_numero', fieldKey: 'NumeroInforme', label: 'Número de Informe', scribanVariable: 'numero_informe', enabled: true, colSpan: 1, fieldType: 'text', readOnly: true },
    { id: 'ph_titulo', fieldKey: 'NombreProyecto', label: 'Nombre del Proyecto', scribanVariable: 'nombre_proyecto', enabled: true, colSpan: 2, fieldType: 'computed', readOnly: true },
    { id: 'ph_programa', fieldKey: 'Programa', label: 'Programa', scribanVariable: 'programa', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_grupo', fieldKey: 'GrupoInvestigacion', label: 'Grupo de Investigación', scribanVariable: 'grupo_investigacion', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_dominio', fieldKey: 'Dominio', label: 'Dominio', scribanVariable: 'dominio', enabled: true, colSpan: 2, fieldType: 'computed', readOnly: true },
    { id: 'ph_linea', fieldKey: 'LineaInvestigacion', label: 'Línea de Investigación', scribanVariable: 'linea_investigacion', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_sublinea', fieldKey: 'SublineaInvestigacion', label: 'Sublínea de Investigación', scribanVariable: 'sublinea_investigacion', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_campo_amplio', fieldKey: 'CampoAmplio', label: 'Campo Amplio', scribanVariable: 'campo_amplio', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_campo_especifico', fieldKey: 'CampoEspecifico', label: 'Campo Específico', scribanVariable: 'campo_especifico', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_campo_detallado', fieldKey: 'CampoDetallado', label: 'Campo Detallado', scribanVariable: 'campo_detallado', enabled: true, colSpan: 2, fieldType: 'computed', readOnly: true },
    { id: 'ph_carrera', fieldKey: 'Carrera', label: 'Carrera', scribanVariable: 'carrera', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_tipo', fieldKey: 'TipoInvestigacion', label: 'Tipo de Investigación', scribanVariable: 'tipo_investigacion', enabled: true, colSpan: 1, fieldType: 'checkbox_group', options: ['BÁSICA', 'APLICADA', 'DESARROLLO EXPERIMENTAL'] },
    { id: 'ph_periodo', fieldKey: 'Periodo', label: 'Período Académico', scribanVariable: 'periodo', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_director', fieldKey: 'DirectorProyecto', label: 'Director del Proyecto', scribanVariable: 'director_proyecto', enabled: true, colSpan: 1, fieldType: 'computed', readOnly: true },
    { id: 'ph_investigadores', fieldKey: 'InvestigadoresTexto', label: 'Investigadores Activos', scribanVariable: 'investigadores_texto', enabled: true, colSpan: 2, fieldType: 'computed', readOnly: true },
    { id: 'ph_fechas', fieldKey: 'Fechas', label: 'Fechas (Inicio → Fin)', scribanVariable: 'fechas', enabled: true, colSpan: 2, fieldType: 'computed', readOnly: true },
];

export type ProgressActivityVariant = 'ejecutadas' | 'no_previstas' | 'obstaculos';

export interface ProgressActivityColumn {
    id: string;
    fieldKey: string;
    label: string;
    scribanVariable?: string;
    enabled: boolean;
    colSpan: 1 | 2;
    colWidthPct?: number;
    fieldType: 'text' | 'rich_text' | 'number_pct' | 'date' | 'textarea';
    placeholder?: string;
    requirementText?: string;
    variant?: 'standard' | 'banner_gold' | 'banner_navy';
    headerColor?: 'navy' | 'gold' | 'slate';
}

export const DEFAULT_ACTIVITY_COLUMNS: ProgressActivityColumn[] = [
    { id: 'col_num', fieldKey: 'NumeroActividad', label: 'N° Actividad', scribanVariable: 'numero_actividad', enabled: true, colSpan: 1, colWidthPct: 10, fieldType: 'text', placeholder: 'Actividad 1' },
    { id: 'col_objetivo', fieldKey: 'ObjetivoAsociado', label: 'Objetivo Específico', scribanVariable: 'objetivo_asociado', enabled: false, colSpan: 2, colWidthPct: 20, fieldType: 'textarea', placeholder: 'Objetivo al que se asocia...' },
    { id: 'col_limitacion', fieldKey: 'Limitacion', label: 'Limitación / Obstáculo', scribanVariable: 'limitacion', enabled: false, colSpan: 2, colWidthPct: 20, fieldType: 'textarea', placeholder: 'Describir el obstáculo encontrado...' },
    { id: 'col_actividades', fieldKey: 'ActividadesEjecutadas', label: 'Actividades Ejecutadas', scribanVariable: 'actividades_ejecutadas', enabled: true, colSpan: 2, colWidthPct: 35, fieldType: 'rich_text', placeholder: 'Describir las actividades realizadas...', requirementText: 'DETALLAR POR CADA ACTIVIDAD REALIZADA' },
    { id: 'col_resultados', fieldKey: 'ResultadosObtenidos', label: 'Resultados Obtenidos', scribanVariable: 'resultados_obtenidos', enabled: true, colSpan: 2, colWidthPct: 25, fieldType: 'rich_text', placeholder: 'Resultados alcanzados...', requirementText: 'INCLUIR EVIDENCIAS EN ANEXOS' },
    { id: 'col_pct', fieldKey: 'PorcentajeAvance', label: '% Avance', scribanVariable: 'porcentaje_avance', enabled: true, colSpan: 1, colWidthPct: 8, fieldType: 'number_pct', placeholder: '0' },
    { id: 'col_participantes', fieldKey: 'Participantes', label: 'Participantes', scribanVariable: 'participantes', enabled: true, colSpan: 1, colWidthPct: 12, fieldType: 'text', placeholder: 'Director + Investigadores' },
    { id: 'col_inicio', fieldKey: 'FechaInicio', label: 'Fecha Inicio', scribanVariable: 'fecha_inicio', enabled: true, colSpan: 1, colWidthPct: 10, fieldType: 'date' },
    { id: 'col_fin', fieldKey: 'FechaFin', label: 'Fecha Fin', scribanVariable: 'fecha_fin', enabled: true, colSpan: 1, colWidthPct: 10, fieldType: 'date' },
    { id: 'col_obs', fieldKey: 'Observaciones', label: 'Observaciones', scribanVariable: 'observaciones', enabled: true, colSpan: 2, colWidthPct: 15, fieldType: 'textarea', placeholder: 'Ver Anexo N°...' },
];

export interface ProgressStatusSubsection {
    id: string;
    fieldKey: string;
    title: string;
    enabled: boolean;
    colSpan: 1 | 2;
    fieldType: 'status_table' | 'rich_text' | 'readonly_text';
    placeholder?: string;
    requirementText?: string;
    scribanVariable?: string;
    accessRole?: 'all' | 'director' | 'admin';
    variant?: 'standard' | 'banner_gold' | 'banner_navy' | 'header_only';
}

export const DEFAULT_PROGRESS_STATUS_SUBSECTIONS: ProgressStatusSubsection[] = [
    { id: 'ps_estado', fieldKey: 'EstadoEjecucion', title: 'ESTADO DE EJECUCIÓN DEL PROYECTO', enabled: true, colSpan: 2, fieldType: 'status_table', scribanVariable: 'estado_ejecucion', accessRole: 'all', variant: 'banner_navy', requirementText: 'MARCAR CON X EL ESTADO ACTUAL' },
    { id: 'ps_descripcion', fieldKey: 'DescripcionFaseActual', title: 'DESCRIPCIÓN DE LA FASE ACTUAL', enabled: true, colSpan: 2, fieldType: 'rich_text', scribanVariable: 'descripcion_fase_actual', accessRole: 'all', variant: 'standard', placeholder: 'Describir brevemente el estado actual del proyecto...', requirementText: 'DETALLAR EN 3 A 6 LÍNEAS' },
    { id: 'ps_obs_director', fieldKey: 'ObservacionesDirector', title: 'OBSERVACIONES DEL DIRECTOR', enabled: true, colSpan: 2, fieldType: 'rich_text', scribanVariable: 'observaciones_director', accessRole: 'director', variant: 'banner_gold', placeholder: 'Observaciones del Director del Proyecto...' },
    { id: 'ps_obs_coord', fieldKey: 'ObservacionesCoordinador', title: 'OBSERVACIONES DEL COORDINADOR DIITRA', enabled: true, colSpan: 2, fieldType: 'rich_text', scribanVariable: 'observaciones_coordinador', accessRole: 'admin', variant: 'banner_gold', placeholder: 'Revisión y observaciones del Coordinador de Investigación...' },
];

