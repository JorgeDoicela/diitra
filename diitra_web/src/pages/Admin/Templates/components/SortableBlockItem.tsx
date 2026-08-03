import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Copy, Trash2, GripVertical } from 'lucide-react';
import type { DocumentBlock, BlockType } from '../types';
import { RenderCover } from './canvasRenderers/RenderCover';
import {
    RenderAdvancedTable,
    RenderMultiSectionTable,
    RenderResearchersTable,
    RenderRubricTable,
} from './canvasRenderers/RenderTables';
import {
    RenderTitle,
    RenderRichText,
    RenderTwoColumn,
    RenderGantt,
    RenderSignatures,
} from './canvasRenderers/RenderMisc';
import {
    RenderProjectGeneralSection,
    RenderProjectTechnicalSection,
    RenderImpacts,
    RenderExpectedProducts,
} from './canvasRenderers/RenderSections';
import {
    RenderProjectBudgetSection,
    RenderProjectProgressReport,
    RenderProjectEthicsReport,
} from './canvasRenderers/RenderReports';

/** Tipos de bloques de los que solo se permite una única instancia */
const UNIQUE_BLOCK_TYPES: BlockType[] = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'project_ethics_report',
    'researchers_table',
    'gantt',
    'signatures',
    'impacts',
    'rubric_table',
    'resources'
];

interface SortableBlockItemProps {
    block: DocumentBlock;
    index: number;
    isActive: boolean;
    coverImage?: string;
    onSelectBlock: (id: string | null) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    themeConfig?: any;
}

export const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
    block,
    index,
    isActive,
    coverImage,
    onSelectBlock,
    onToggleActive,
    onDeleteBlock,
    onDuplicateBlock,
    onUpdateConfig,
    themeConfig,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : block.isActive ? 1 : 0.45,
    };

    const renderContent = () => {
        if (!block.isActive) {
            return (
                <div className="py-3 px-4 border border-dashed border-slate-200 bg-slate-50/50 rounded text-center text-slate-400 italic text-[10px]">
                    Bloque "{block.title}" oculto en la generación del PDF
                </div>
            );
        }

        switch (block.type) {
            case 'cover':
                return <RenderCover config={block.config} coverImage={coverImage} blockId={block.id} onUpdateConfig={onUpdateConfig} themeConfig={themeConfig} />;
            case 'title':
                return <RenderTitle config={block.config} themeConfig={themeConfig} />;
            case 'rich_text':
                return <RenderRichText config={block.config} />;
            case 'advanced_table':
                return <RenderAdvancedTable config={block.config} />;
            case 'multi_section_table':
                return <RenderMultiSectionTable config={block.config} />;
            case 'two_column':
                return <RenderTwoColumn config={block.config} />;
            case 'gantt':
                return <RenderGantt config={block.config} />;
            case 'researchers_table':
                return <RenderResearchersTable config={block.config} />;
            case 'rubric_table':
                return <RenderRubricTable config={block.config} />;
            case 'signatures':
                return <RenderSignatures config={block.config} />;
            case 'project_general_section':
                return <RenderProjectGeneralSection config={block.config} blockId={block.id} onUpdateConfig={onUpdateConfig} />;
            case 'project_technical_section':
                return <RenderProjectTechnicalSection config={block.config} blockId={block.id} onUpdateConfig={onUpdateConfig} />;
            case 'project_budget_section':
            case 'resources':
                return <RenderProjectBudgetSection config={block.config} />;
            case 'project_progress_report':
                return <RenderProjectProgressReport config={block.config} />;
            case 'project_ethics_report':
                return <RenderProjectEthicsReport config={block.config} />;
            case 'expected_products':
                return <RenderExpectedProducts config={block.config} blockId={block.id} onUpdateConfig={onUpdateConfig} />;
            case 'impacts':
                return <RenderImpacts config={block.config} />;
            default:
                return null;
        }
    };

    const isCover = block.type === 'cover';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onSelectBlock(block.id)}
            className={`group relative cursor-grab active:cursor-grabbing rounded-xs transition-all ${isCover ? 'p-0 border-none w-full flex-1 flex flex-col' : 'p-2 border border-slate-200 bg-white hover:border-slate-300'
                } ${isDragging
                    ? 'shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-slate-300 opacity-80 scale-[0.97] rotate-[-0.5deg] z-[999]'
                    : isActive
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10'
                        : 'hover:ring-1 hover:ring-indigo-300/40'
                }`}
        >
            {/* Toolbar flotante superior Notion-style para reordenamiento y acciones */}
            <div className="absolute top-1 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-800 border border-slate-200/80 rounded-md px-2 py-1 shadow-lg flex items-center gap-1.5 text-[10px] dark:bg-slate-900 dark:text-white dark:border-slate-800">
                <div
                    className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white cursor-grab active:cursor-grabbing flex items-center justify-center"
                    title="Arrastra para reordenar este bloque arriba o abajo"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleActive(index); }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    title={block.isActive ? "Ocultar bloque en PDF" : "Mostrar bloque en PDF"}
                >
                    {block.isActive ? <Eye className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <EyeOff className="w-3 h-3 text-amber-500 dark:text-amber-400" />}
                </button>
                {!UNIQUE_BLOCK_TYPES.includes(block.type) && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDuplicateBlock(block.id); }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                        title="Duplicar bloque"
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors cursor-pointer"
                    title="Eliminar bloque"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Contenido del bloque */}
            <div className={`relative ${isCover ? 'flex-1 flex flex-col' : 'pt-5'}`}>
                {renderContent()}
            </div>
        </div>
    );
};
