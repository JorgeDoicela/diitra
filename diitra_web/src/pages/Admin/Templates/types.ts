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
    | 'impacts';

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
}

export const DEFAULT_TECHNICAL_SUBSECTIONS: TechnicalSubsection[] = [
    { id: 'sec_antecedentes', fieldKey: 'Antecedentes', numberPrefix: '3.1', title: 'ANTECEDENTES ESPECÍFICOS DE LA PROBLEMÁTICA', placeholder: 'Identificar y analizar estudios previos...', requirementText: 'DETALLAR EN DOS PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, scribanVariable: 'antecedentes', legacyKey: 'showAntecedentes', colSpan: 2, variant: 'standard' },
    { id: 'sec_descripcion', fieldKey: 'DescripcionProyecto', numberPrefix: '3.2', title: 'DESCRIPCIÓN DEL PROYECTO', placeholder: 'Definir el propósito del proyecto...', requirementText: 'DETALLAR EN UN PÁRRAFO DE 8 A 12 LÍNEAS MÍNIMO', enabled: true, scribanVariable: 'descripcion_proyecto', legacyKey: 'showDescripcionProyecto', colSpan: 2, variant: 'standard' },
    { id: 'sec_justificacion', fieldKey: 'Justificacion', numberPrefix: '3.3', title: 'JUSTIFICACIÓN', placeholder: 'Especificar la importancia científica...', requirementText: 'CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, scribanVariable: 'justificacion', legacyKey: 'showJustificacion', colSpan: 2, variant: 'standard' },
    { id: 'sec_banner_objetivos', fieldKey: 'BannerObjetivos', numberPrefix: '3.4', title: 'OBJETIVOS', placeholder: '', requirementText: '', enabled: true, scribanVariable: 'banner_objetivos', colSpan: 2, variant: 'banner_gold' },
    { id: 'sec_objetivo_general', fieldKey: 'ObjetivoGeneral', numberPrefix: '', title: 'GENERAL', placeholder: 'Formular el objetivo general...', requirementText: 'VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?', enabled: true, scribanVariable: 'objetivo_general', legacyKey: 'showObjetivoGeneral', colSpan: 1, variant: 'banner_navy' },
    { id: 'sec_objetivos_especificos', fieldKey: 'ObjetivosEspecificos', numberPrefix: '', title: 'ESPECÍFICOS', placeholder: '1. Desarrollar...\n2. Implementar...', requirementText: 'INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO', enabled: true, scribanVariable: 'objetivos_especificos', legacyKey: 'showObjetivosEspecificos', colSpan: 1, variant: 'banner_navy' },
    { id: 'sec_ods', fieldKey: 'ObjetivosDesarrolloSostenible', numberPrefix: '3.5', title: 'OBJETIVOS DE DESARROLLO SOSTENIBLE', placeholder: 'Los objetivos de desarrollo sostenible de la ONU son 17...', requirementText: 'Alineación con Objetivos de Desarrollo Sostenible ONU', enabled: true, scribanVariable: 'objetivos_desarrollo_sostenible', legacyKey: 'showOds', colSpan: 2, variant: 'standard' },
    { id: 'sec_marco_teorico', fieldKey: 'MarcoTeorico', numberPrefix: '3.6', title: 'MARCO TEÓRICO', placeholder: 'Describir los conceptos clave...', requirementText: 'EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS, CITAR USANDO NORMAS APA 7MA EDICIÓN', enabled: true, scribanVariable: 'marco_teorico', legacyKey: 'showMarcoTeorico', colSpan: 2, variant: 'standard' },
    { id: 'sec_metodologia', fieldKey: 'Metodologia', numberPrefix: '3.7', title: 'METODOLOGÍA', placeholder: 'Describir el enfoque metodológico...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, scribanVariable: 'metodologia', legacyKey: 'showMetodologia', colSpan: 2, variant: 'standard' },
    { id: 'sec_evaluacion', fieldKey: 'Evaluacion', numberPrefix: '3.8', title: 'EVALUACIÓN', placeholder: 'Describir los criterios e indicadores...', requirementText: 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS', enabled: true, scribanVariable: 'evaluacion', legacyKey: 'showEvaluacion', colSpan: 2, variant: 'standard' }
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
        xInstitution?: number;     yInstitution?: number;  // default: x=10, y=4
        xTitle?: number;           yTitle?: number;         // default: x=10, y=35
        xCarrera?: number;         yCarrera?: number;       // default: x=10, y=70
        xPeriodo?: number;         yPeriodo?: number;       // default: x=10, y=80
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
        showImpactoSocial?: boolean;
        showImpactoCientifico?: boolean;
        showImpactoEconomico?: boolean;
        showImpactoPolitico?: boolean;
        showImpactoAmbiental?: boolean;
        showImpactoOtro?: boolean;
        showProductosEsperados?: boolean;

        // ── project_progress_report ────────────────────────────────────────
        showHitosCompletados?: boolean;
        showEvidencias?: boolean;
        showPresupuestoEjecutado?: boolean;
    };
}
