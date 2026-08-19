import React from 'react';
import {
    Image,
    Heading1,
    AlignLeft,
    Grid,
    LayoutTemplate,
    Columns2,
    Minus,
    BarChart2,
    BookOpen,
    Users,
    FileText,
    DollarSign,
    Award,
    Target,
    PenLine,
    Table,
    Layout,
    GraduationCap,
    ClipboardCheck
} from 'lucide-react';
import type { BlockType, DocumentBlock } from '../types';

interface BlockPaletteProps {
    blocks: DocumentBlock[];
    uniqueBlockTypes: BlockType[];
    onAddBlock: (type: BlockType) => void;
    onClose: () => void;
}

interface PaletteItem {
    type: BlockType;
    icon: React.ElementType;
    label: string;
    desc: string;
    color: string;
}

interface PaletteCategory {
    title: string;
    items: PaletteItem[];
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({
    blocks,
    uniqueBlockTypes,
    onAddBlock,
    onClose
}) => {
    const categories: PaletteCategory[] = [
        {
            title: 'Bloques Estructurales & Contenido',
            items: [
                { type: 'cover', icon: Image, label: 'Portada Institucional', desc: 'Portada del PDF con logos y título.', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'title', icon: Heading1, label: 'Título de Sección', desc: 'Encabezado de sección para el PDF.', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'rich_text', icon: AlignLeft, label: 'Párrafo Enriquecido', desc: 'Editor colaborativo en el Workspace.', color: 'text-pink-500 bg-pink-500/5' },
                { type: 'advanced_table', icon: Grid, label: 'Tabla Avanzada', desc: 'Tabla con filas y columnas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'multi_section_table', icon: LayoutTemplate, label: 'Tabla Multi-Sección', desc: 'Conjunto de sub-tablas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'two_column', icon: Columns2, label: 'Dos Columnas', desc: 'Dos bloques de texto lado a lado.', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'page_break', icon: Minus, label: 'Salto de Página', desc: 'Forzar salto de página en el PDF.', color: 'text-zinc-400 bg-zinc-400/5' },
                { type: 'gantt', icon: BarChart2, label: 'Diagrama de Gantt', desc: 'Pestaña de Cronograma en Workspace.', color: 'text-indigo-500 bg-indigo-500/5' }
            ]
        },
        {
            title: 'Bloques de Base de Datos (Dinámicos)',
            items: [
                { type: 'project_general_section', icon: BookOpen, label: 'Ficha de Identificación', desc: 'Metadatos (título, carrera, plazos).', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'researchers_table', icon: Users, label: 'Equipo de Investigadores', desc: 'Participantes del proyecto científico.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'project_technical_section', icon: FileText, label: 'Plan Técnico', desc: '8 sub-secciones de redacción (Antecedentes, Metodología, etc.).', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'project_budget_section', icon: DollarSign, label: 'Recursos y Presupuesto', desc: 'Tablas de recursos y financiamiento del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'project_progress_report', icon: BarChart2, label: 'Avance de Ejecución', desc: 'Hitos, evidencias y avance presupuestario.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'expected_products', icon: Target, label: 'Productos Esperados', desc: 'Tabla de entregables, patentes o publicaciones.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'impacts', icon: Target, label: 'Matriz de Impactos', desc: 'Áreas e impactos del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'rubric_table', icon: Award, label: 'Rúbrica de Calificación', desc: 'Criterios para los revisores pares.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'project_approval_notice', icon: FileText, label: 'Oficio de Aprobación', desc: 'Metadatos y dictamen formal de aprobación legal.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'arbitration_dictamen_section', icon: Award, label: 'Dictamen de Arbitraje', desc: 'Matriz de pares evaluadores, promedio y resolución CACES.', color: 'text-emerald-500 bg-emerald-500/5' },
                { type: 'signatures', icon: PenLine, label: 'Bloque de Firmas', desc: 'Firmas físicas o electrónica CACES.', color: 'text-emerald-500 bg-emerald-500/5' }
            ]
        },
        {
            title: 'Bloques de Plan de Aprendizaje & Evaluación (APE)',
            items: [
                { type: 'learning_plan_header_section', icon: GraduationCap, label: '1. Ficha Plan y Estudiante', desc: 'Metadatos del proyecto, estudiante asignado y objetivo general (ISTPET).', color: 'text-emerald-600 bg-emerald-600/5' },
                { type: 'learning_plan_eval_parameters_section', icon: Award, label: '2. Parámetros de Evaluación', desc: 'Escala cualitativa oficial ISTPET (4 Muy Adecuado a 1 No Adecuado).', color: 'text-purple-600 bg-purple-600/5' },
                { type: 'learning_plan_prerequisites_section', icon: ClipboardCheck, label: '3. Matriz de Prerrequisitos', desc: 'Prerrequisitos cognitivos y procedimentales (Modo Plan o Evaluación).', color: 'text-teal-600 bg-teal-600/5' },
                { type: 'learning_plan_activities_section', icon: Table, label: '4. Matriz de Actividades APE', desc: 'Planificación o evaluación de actividades ejecutadas y RdA asociados.', color: 'text-blue-600 bg-blue-600/5' },
                { type: 'learning_plan_evaluation_table', icon: Award, label: '5. Resultados Generales (Admin)', desc: 'Consolidado de promedios cognitivos, procedimentales y dictamen final.', color: 'text-amber-600 bg-amber-600/5' }
            ]
        },
        {
            title: 'Bloques de Informe de Avance',
            items: [
                { type: 'progress_header_section', icon: FileText, label: 'Encabezado Informe Avance', desc: 'Datos generales auto-poblados del proyecto (ISTPET).', color: 'text-blue-500 bg-blue-500/5' },
                { type: 'progress_activity_section', icon: Table, label: 'Matriz Actividades Avance', desc: 'Tabla configurable (Ejecutadas, NP u Obstáculos).', color: 'text-amber-500 bg-amber-500/5' },
                { type: 'progress_status_section', icon: Layout, label: 'Estado y Observaciones', desc: 'Estado del proyecto y redacción con permisos de rol.', color: 'text-indigo-500 bg-indigo-500/5' }
            ]
        },
        {
            title: 'Bloques de Informe Final',
            items: [
                { type: 'final_report_header_section', icon: BookOpen, label: 'Encabezado Informe Final', desc: 'Datos del proyecto, tipo de investigación, alcance, plazos e investigadores.', color: 'text-purple-500 bg-purple-500/5' },
                { type: 'final_report_writing_section', icon: FileText, label: 'Plan de Redacción Informe Final', desc: '15 sub-secciones de redacción científica pre-cargadas.', color: 'text-indigo-500 bg-indigo-500/5' }
            ]
        },
        {
            title: 'Bloques de Certificados & Reconocimientos',
            items: [
                { type: 'certificate_header', icon: Award, label: 'Encabezado de Certificado', desc: 'Título, marco y subtítulo oficial del certificado.', color: 'text-amber-500 bg-amber-500/5' },
                { type: 'certificate_recipient_badge', icon: Users, label: 'Destinatario y Rol', desc: 'Nombre del estudiante/docente e insignia de rol.', color: 'text-amber-500 bg-amber-500/5' },
                { type: 'certificate_body', icon: FileText, label: 'Cuerpo del Certificado', desc: 'Texto de logro, proyecto, fecha y firma de autoridades.', color: 'text-amber-500 bg-amber-500/5' }
            ]
        }
    ];

    return (
        <div className="absolute top-full right-0 mt-2 z-[100] bg-surface border border-border-thin rounded-xl shadow-2xl p-4 w-[520px] max-h-[72vh] overflow-y-auto custom-scrollbar animate-fade-in-up flex flex-col gap-4">
            {categories.map((cat, catIdx) => (
                <div key={cat.title} className={catIdx > 0 ? 'border-t border-border-thin/30 pt-3' : ''}>
                    <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">
                        {cat.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {cat.items.map((item) => {
                            const ItemIcon = item.icon;
                            const alreadyExists = uniqueBlockTypes.includes(item.type) && blocks.some(b => b.type === item.type);
                            return (
                                <button
                                    key={item.type}
                                    type="button"
                                    disabled={alreadyExists}
                                    onClick={() => {
                                        onAddBlock(item.type);
                                        onClose();
                                    }}
                                    className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists
                                        ? 'opacity-35 cursor-not-allowed'
                                        : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                        <ItemIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                            <span>{item.label}</span>
                                            {alreadyExists && (
                                                <span className="text-[8px] font-medium font-mono bg-surface-hover border border-border-thin/30 px-1.5 py-0.5 rounded text-text-dim shrink-0">
                                                    Añadido
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
