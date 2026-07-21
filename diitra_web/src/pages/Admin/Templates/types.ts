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
}

export interface TableRow {
    cells: string[];
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
    | 'project_general_section';

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
        // ── cover ──────────────────────────────────────────────────────────
        tituloSuperior?: string;
        carreraPorDefecto?: string;
        periodoPorDefecto?: string;
        colorTema?: string;

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
    };
}
