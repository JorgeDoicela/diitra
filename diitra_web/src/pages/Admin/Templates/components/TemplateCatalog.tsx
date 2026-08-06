import React from 'react';
import { FileText, Palette, PanelLeft, GripVertical } from 'lucide-react';
import {
    DndContext,
    rectIntersection,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DocumentTemplateDto } from '../types';

interface TemplateCatalogProps {
    templates: DocumentTemplateDto[];
    selectedTemplate: DocumentTemplateDto | null;
    onSelectTemplate: (tmpl: DocumentTemplateDto) => void;
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
    headerCollapsed?: boolean;
    onReorderTemplates?: (newTemplates: DocumentTemplateDto[]) => void;
}

interface TemplateItemProps {
    template: DocumentTemplateDto;
    isSelected: boolean;
    onSelect?: () => void;
    dragHandleProps?: any;
    isDragging?: boolean;
    isOverlay?: boolean;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
    template,
    isSelected,
    onSelect,
    dragHandleProps,
    isDragging,
    isOverlay
}) => {
    return (
        <div
            className={`group w-full flex items-center relative border-b border-border-thin/30 last:border-b-0 transition-opacity duration-150 ${
                isSelected 
                    ? 'bg-surface-hover text-text-main font-bold' 
                    : 'bg-surface hover:bg-surface-hover/40 text-text-dim hover:text-text-main'
            } ${isDragging ? 'opacity-25 bg-surface-hover/20' : 'opacity-100'} ${
                isOverlay ? 'shadow-xl border rounded border-border-hover bg-surface-hover z-[9999]' : ''
            }`}
        >
            {/* Línea de acento izquierda de selección activa */}
            {isSelected && !isDragging && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
            )}

            {/* Drag Handle */}
            <div
                {...dragHandleProps}
                className="p-3 pr-1 text-text-dim/30 hover:text-text-dim/85 cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center self-stretch touch-none transition-colors"
                title="Arrastrar para ordenar"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>
            
            <button
                type="button"
                onClick={onSelect}
                disabled={isOverlay}
                className="flex-1 text-left p-3 pl-1.5 flex items-start gap-3 transition-all min-w-0"
            >
                <div className="p-1.5 rounded bg-surface border border-border-thin/40 shrink-0 text-text-main shadow-none">
                    <FileText className="w-3.5 h-3.5" />
                </div>
                
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] leading-snug transition-colors break-words ${isSelected ? 'font-bold text-text-main' : 'font-medium text-text-main/80'}`}>
                            {template.name}
                        </span>
                        <span className="text-[8px] bg-surface-hover/60 px-1.5 py-0.5 rounded font-mono border border-border-thin/10 shrink-0 text-text-dim">
                            v{template.version}
                        </span>
                    </div>
                    <p className="text-[9px] text-text-dim mt-1 font-mono tracking-tight select-all">
                        {template.code}
                    </p>
                </div>
            </button>
        </div>
    );
};

interface SortableTemplateItemProps {
    template: DocumentTemplateDto;
    isSelected: boolean;
    onSelect: () => void;
}

const SortableTemplateItem: React.FC<SortableTemplateItemProps> = ({
    template,
    isSelected,
    onSelect
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: template.code });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <TemplateItem
                template={template}
                isSelected={isSelected}
                onSelect={onSelect}
                dragHandleProps={{ ...attributes, ...listeners }}
                isDragging={isDragging}
            />
        </div>
    );
};

export const TemplateCatalog: React.FC<TemplateCatalogProps> = ({
    templates,
    selectedTemplate,
    onSelectTemplate,
    isSidebarCollapsed,
    onToggleSidebar,
    headerCollapsed,
    onReorderTemplates
}) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id || !onReorderTemplates) return;

        const oldIndex = templates.findIndex(t => t.code === active.id);
        const newIndex = templates.findIndex(t => t.code === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(templates, oldIndex, newIndex);
            onReorderTemplates(reordered);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const activeTemplate = templates.find(t => t.code === activeId);

    return (
        <div className="w-full border border-border-thin rounded-md bg-surface flex flex-col overflow-hidden shrink-0">
            {/* Header del panel */}
            <div className="p-3 border-b border-border-thin bg-surface flex items-center justify-between shrink-0 h-10">
                <div className="flex items-center gap-2 min-w-0">
                    {onToggleSidebar && headerCollapsed && isSidebarCollapsed && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            title={isSidebarCollapsed ? "Mostrar panel lateral" : "Ocultar panel lateral"}
                            className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer shrink-0"
                        >
                            <PanelLeft className="w-4 h-4" />
                        </button>
                    )}
                    <span className="text-xs font-semibold text-text-main truncate">
                        Catálogo de Documentos ({templates.length})
                    </span>
                </div>
            </div>
            
            {/* Lista unificada sin separaciones toscas */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-thin/30">
                {/* OPCIÓN VIRTUAL: TEMA GLOBAL INSTITUCIONAL */}
                <button
                    type="button"
                    onClick={() => onSelectTemplate({
                        id: 0,
                        code: 'GLOBAL_THEME',
                        name: 'Diseño Global Institucional',
                        description: 'Configuración visual por defecto para todos los documentos de la institución (colores, márgenes, tipografía).',
                        category: 0,
                        version: 1,
                        isActive: true,
                        requiresLopdpClause: false,
                        supportsBlindMode: false,
                        requiresElectronicSignature: false,
                        signatureType: 'none',
                        themeConfigJson: '',
                        htmlContent: '',
                        customCss: '',
                        collaborativeFieldsJson: '',
                        updatedAt: new Date().toISOString(),
                        updatedBy: null
                    })}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-all relative border-b border-border-thin/50 ${
                        selectedTemplate?.code === 'GLOBAL_THEME'
                            ? 'bg-text-main/5 text-text-main font-bold'
                            : 'bg-surface hover:bg-surface-hover/40 text-text-dim hover:text-text-main'
                    }`}
                >
                    {selectedTemplate?.code === 'GLOBAL_THEME' && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                    )}
                    <div className="p-1.5 rounded bg-surface border border-border-thin/40 shrink-0 text-text-main shadow-none">
                        <Palette className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[11px] leading-snug font-bold">
                            Diseño Global Institucional
                        </span>
                        <p className="text-[9.5px] text-text-dim/80 mt-0.5 leading-normal">
                            Traversari Branding Base
                        </p>
                    </div>
                </button>

                <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={templates.map(t => t.code)} strategy={verticalListSortingStrategy}>
                        <div className="divide-y divide-border-thin/30">
                            {templates.map(t => {
                                const isSelected = selectedTemplate?.code === t.code;
                                return (
                                    <SortableTemplateItem
                                        key={t.code}
                                        template={t}
                                        isSelected={isSelected}
                                        onSelect={() => onSelectTemplate(t)}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                    
                    <DragOverlay adjustScale={false}>
                        {activeTemplate ? (
                            <TemplateItem
                                template={activeTemplate}
                                isSelected={selectedTemplate?.code === activeTemplate.code}
                                isOverlay
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};
