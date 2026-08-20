import React from 'react';
import { FileText, Palette, PanelLeft, GripVertical, Sparkles, Award, FlaskConical, BarChart3 } from 'lucide-react';
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

type TemplateCategoryKey = 'INVESTIGACION' | 'INNOVACION' | 'CERTIFICADOS' | 'REPORTES';

function getTemplateCategory(code: string): TemplateCategoryKey {
    const c = (code || '').toUpperCase();
    if (c.includes('INNOVACION') || c.includes('TRL')) return 'INNOVACION';
    if (c.startsWith('CERTIFICADO') || c.includes('CERTIFICADO')) return 'CERTIFICADOS';
    if (c.startsWith('REPORTE') || c.includes('ANALITICAS')) return 'REPORTES';
    return 'INVESTIGACION';
}

function getTemplateIcon(code: string) {
    const cat = getTemplateCategory(code);
    switch (cat) {
        case 'INNOVACION':
            return <Sparkles className="w-3.5 h-3.5 text-text-dim" />;
        case 'CERTIFICADOS':
            return <Award className="w-3.5 h-3.5 text-text-dim" />;
        case 'REPORTES':
            return <BarChart3 className="w-3.5 h-3.5 text-text-dim" />;
        default:
            return <FileText className="w-3.5 h-3.5 text-text-dim" />;
    }
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
    const cat = getTemplateCategory(template.code);

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
                    {getTemplateIcon(template.code)}
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {cat === 'INNOVACION' && (
                            <span className="text-[8px] font-medium uppercase px-1 py-0.2 rounded bg-surface-hover text-text-dim border border-border-thin">
                                Innovación
                            </span>
                        )}
                        {cat === 'CERTIFICADOS' && (
                            <span className="text-[8px] font-medium uppercase px-1 py-0.2 rounded bg-surface-hover text-text-dim border border-border-thin">
                                Certificado
                            </span>
                        )}
                    </div>
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

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
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
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = templates.findIndex(t => t.code === active.id);
            const newIndex = templates.findIndex(t => t.code === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newTemplates = arrayMove(templates, oldIndex, newIndex);
                if (onReorderTemplates) {
                    onReorderTemplates(newTemplates);
                }
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const activeTemplate = templates.find(t => t.code === activeId);

    // Agrupación de plantillas
    const investigacionTemplates = templates.filter(t => getTemplateCategory(t.code) === 'INVESTIGACION');
    const innovacionTemplates = templates.filter(t => getTemplateCategory(t.code) === 'INNOVACION');
    const certificadosTemplates = templates.filter(t => getTemplateCategory(t.code) === 'CERTIFICADOS');
    const reportesTemplates = templates.filter(t => getTemplateCategory(t.code) === 'REPORTES');

    return (
        <div className="w-full h-full border border-border-thin rounded-md bg-surface flex flex-col overflow-hidden min-h-0">
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
            
            {/* Lista dividida por categorías institucionales con scroll fluido */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-thin/30 custom-scrollbar min-h-0 pb-12">
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
                        <div className="flex flex-col">
                            {/* SECCIÓN 1: INVESTIGACIÓN CIENTÍFICA */}
                            {investigacionTemplates.length > 0 && (
                                <div className="border-b border-border-thin/40">
                                    <div className="px-3 py-2 bg-surface-deep/40 border-b border-border-thin/30 flex items-center justify-between">
                                        <span className="text-[9px] font-mono font-bold tracking-wider text-text-dim uppercase flex items-center gap-1.5">
                                            <FlaskConical size={11} className="text-text-dim" />
                                            Investigación (I+D+i)
                                        </span>
                                        <span className="text-[9px] font-mono text-text-dim/60">
                                            {investigacionTemplates.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {investigacionTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN 2: INNOVACIÓN Y TRANSFERENCIA */}
                            {innovacionTemplates.length > 0 && (
                                <div className="border-b border-border-thin/40">
                                    <div className="px-3 py-2 bg-surface-deep/40 border-b border-border-thin/30 flex items-center justify-between">
                                        <span className="text-[9px] font-mono font-bold tracking-wider text-text-dim uppercase flex items-center gap-1.5">
                                            <Sparkles size={11} className="text-text-dim" />
                                            Innovación & i+TT
                                        </span>
                                        <span className="text-[9px] font-mono text-text-dim/60">
                                            {innovacionTemplates.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {innovacionTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN 3: CERTIFICADOS INSTITUCIONALES */}
                            {certificadosTemplates.length > 0 && (
                                <div className="border-b border-border-thin/40">
                                    <div className="px-3 py-2 bg-surface-deep/40 border-b border-border-thin/30 flex items-center justify-between">
                                        <span className="text-[9px] font-mono font-bold tracking-wider text-text-dim uppercase flex items-center gap-1.5">
                                            <Award size={11} className="text-text-dim" />
                                            Certificados Oficiales
                                        </span>
                                        <span className="text-[9px] font-mono text-text-dim/60">
                                            {certificadosTemplates.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {certificadosTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN 4: REPORTES & ANALÍTICAS */}
                            {reportesTemplates.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 bg-surface-deep/40 border-b border-border-thin/30 flex items-center justify-between">
                                        <span className="text-[9px] font-mono font-bold tracking-wider text-text-dim uppercase flex items-center gap-1.5">
                                            <BarChart3 size={11} className="text-text-dim" />
                                            Reportes & Analíticas
                                        </span>
                                        <span className="text-[9px] font-mono text-text-dim/60">
                                            {reportesTemplates.length}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {reportesTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
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
