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
    | 'project_budget_section'
    | 'project_progress_report'
    | 'project_ethics_report'
    | 'resources'
    | 'expected_products'
    | 'impacts'
    | 'project_approval_notice'
    | 'progress_header_section'
    | 'progress_activity_section'
    | 'progress_status_section';

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
        carreraPorDefecto?: string;
        periodoPorDefecto?: string;
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
        progressStatusSections?: ProgressStatusSubsection[];
        progressStatusHeaderColor?: 'navy' | 'gold' | 'slate' | string;
        statusOptions?: string[];
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

