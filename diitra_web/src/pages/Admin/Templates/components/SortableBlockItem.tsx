import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import type { DocumentBlock } from '../types';
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
} from './canvasRenderers/RenderSections';

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
        opacity: isDragging ? 0.4 : block.isActive ? 1 : 0.45,
    };

    const renderContent = () => {
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
                return <RenderProjectTechnicalSection config={block.config} />;
            case 'impacts':
                return <RenderImpacts config={block.config} />;
            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onSelectBlock(block.id);
            }}
            className={`group relative rounded-xs transition-all duration-200 ${isActive
                ? 'ring-2 ring-blue-500/80 bg-blue-500/5 shadow-xs'
                : 'hover:ring-1 hover:ring-slate-300'
                }`}
        >
            {/* Barra flotante de acciones (drag, visible, copiar, eliminar) */}
            <div className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 flex items-center gap-1 bg-slate-900/90 text-white text-[9px] px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="p-1 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing text-slate-300 hover:text-white"
                    title="Arrastrar para reordenar"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>
                <div className="w-px h-3 bg-white/20 my-auto" />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleActive(index);
                    }}
                    className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white cursor-pointer"
                    title={block.isActive ? "Ocultar en PDF" : "Mostrar en PDF"}
                >
                    {block.isActive ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateBlock(block.id);
                    }}
                    className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white cursor-pointer"
                    title="Duplicar bloque"
                >
                    <Copy className="w-3 h-3" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                    }}
                    className="p-1 hover:bg-red-500/40 rounded text-slate-300 hover:text-red-300 cursor-pointer"
                    title="Eliminar bloque"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {renderContent()}
        </div>
    );
};
