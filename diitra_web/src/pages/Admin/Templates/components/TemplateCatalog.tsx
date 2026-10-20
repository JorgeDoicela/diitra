import React, { useState, useMemo } from 'react';
import { FileText, PanelLeft, GripVertical, Sparkles, Award, FlaskConical, BarChart3, Eye, Download, Search, X, FileSearch } from 'lucide-react';
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
    onPreviewTemplate?: (tmpl: DocumentTemplateDto) => void;
    onDownloadPdf?: (tmpl: DocumentTemplateDto) => void;
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
    onPreview?: (tmpl: DocumentTemplateDto) => void;
    onDownload?: (tmpl: DocumentTemplateDto) => void;
    dragHandleProps?: any;
    isDragging?: boolean;
    isOverlay?: boolean;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
    template,
    isSelected,
    onSelect,
    onPreview,
    onDownload,
    dragHandleProps,
    isDragging,
    isOverlay
}) => {
    const cat = getTemplateCategory(template.code);

    return (
        <div
            className={`group w-full flex items-center relative border-b border-border-thin/30 last:border-b-0 transition-opacity duration-150 ${isSelected
                    ? 'bg-surface-hover text-text-main font-bold'
                    : 'bg-surface hover:bg-surface-hover/40 text-text-dim hover:text-text-main'
                } ${isDragging ? 'opacity-25 bg-surface-hover/20' : 'opacity-100'} ${isOverlay ? 'shadow-xl border rounded border-border-hover bg-surface-hover z-[9999]' : ''
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
                    <span className={`text-[11px] leading-snug transition-colors break-words block ${isSelected ? 'font-bold text-text-main' : 'font-medium text-text-main/80'}`}>
                        {template.name}
                    </span>
                    {(cat === 'INNOVACION' || cat === 'CERTIFICADOS') && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
                    )}
                </div>
            </button>

            {/* Acciones Rápidas: Previsualizar y Descargar directamente */}
            {!isOverlay && (
                <div className="flex items-center gap-0.5 pr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview?.(template);
                        }}
                        title={`Previsualizar ${template.name}`}
                        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload?.(template);
                        }}
                        title={`Descargar PDF oficial de ${template.name}`}
                        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

interface SortableTemplateItemProps {
    template: DocumentTemplateDto;
    isSelected: boolean;
    onSelect: () => void;
    onPreview?: (tmpl: DocumentTemplateDto) => void;
    onDownload?: (tmpl: DocumentTemplateDto) => void;
}

const SortableTemplateItem: React.FC<SortableTemplateItemProps> = ({
    template,
    isSelected,
    onSelect,
    onPreview,
    onDownload
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
                onPreview={onPreview}
                onDownload={onDownload}
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
    onPreviewTemplate,
    onDownloadPdf,
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

    const [searchQuery, setSearchQuery] = useState('');

    // Normalizador de texto insensible a mayúsculas, tildes y diacríticos
    const normalizeSearchText = (text: string): string => {
        return (text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    };

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;

        const rawQuery = normalizeSearchText(searchQuery);
        const tokens = rawQuery.split(/\s+/).filter(Boolean);

        const scored = templates
            .map(t => {
                const nameNorm = normalizeSearchText(t.name);
                const codeNorm = normalizeSearchText(t.code);
                const descNorm = normalizeSearchText(t.description || '');
                const regCodeNorm = normalizeSearchText(t.regulatoryCode || t.regulatory_code || '');
                const catNorm = normalizeSearchText(getTemplateCategory(t.code));
                const combined = `${nameNorm} ${codeNorm} ${descNorm} ${regCodeNorm} ${catNorm}`;

                // Requerimiento: todas las palabras ingresadas deben coincidir en el documento
                const matchesAllTokens = tokens.every(token => combined.includes(token));
                if (!matchesAllTokens) return { template: t, score: -1 };

                let score = 10;
                // Prioridad máxima si el nombre empieza con la frase buscada
                if (nameNorm.startsWith(rawQuery)) {
                    score += 120;
                } else if (nameNorm.includes(rawQuery)) {
                    score += 70;
                }

                // Bonificación por palabras individuales que coincidan en el nombre o código
                tokens.forEach(tok => {
                    if (nameNorm.includes(tok)) score += 25;
                    if (codeNorm.includes(tok)) score += 10;
                    if (regCodeNorm.includes(tok)) score += 15;
                });

                return { template: t, score };
            })
            .filter(item => item.score > 0);

        // Ordenar por relevancia cuando hay una búsqueda activa
        scored.sort((a, b) => b.score - a.score);
        return scored.map(item => item.template);
    }, [templates, searchQuery]);

    // Agrupación de plantillas
    const investigacionTemplates = filteredTemplates.filter(t => getTemplateCategory(t.code) === 'INVESTIGACION');
    const innovacionTemplates = filteredTemplates.filter(t => getTemplateCategory(t.code) === 'INNOVACION');
    const certificadosTemplates = filteredTemplates.filter(t => getTemplateCategory(t.code) === 'CERTIFICADOS');
    const reportesTemplates = filteredTemplates.filter(t => getTemplateCategory(t.code) === 'REPORTES');

    return (
        <div className="w-full h-full border border-border-thin rounded-md bg-surface flex flex-col overflow-hidden min-h-0">
            {/* Header del panel con buscador potente por nombre */}
            <div className="p-2.5 border-b border-border-thin bg-surface flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
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
                            Catálogo ({filteredTemplates.length}{searchQuery ? ` de ${templates.length}` : ''})
                        </span>
                    </div>
                </div>

                {/* Input de búsqueda en tiempo real potente por nombre */}
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim/60" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') setSearchQuery('');
                        }}
                        placeholder="Buscar documento por nombre..."
                        className="w-full bg-surface-hover/50 border border-border-thin rounded pl-8 pr-7 py-1.5 text-xs text-text-main placeholder:text-text-dim/50 focus:outline-none focus:border-border-hover transition-colors font-sans"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            title="Limpiar búsqueda (Esc)"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim/60 hover:text-text-main transition-colors p-0.5 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Lista dividida por categorías institucionales con scroll fluido */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-thin/30 custom-scrollbar min-h-0 pb-12">
                {filteredTemplates.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-text-dim gap-2 min-h-[220px]">
                        <FileSearch className="w-8 h-8 text-text-dim/40 stroke-[1.5]" />
                        <p className="text-xs font-semibold text-text-main">No se encontraron documentos</p>
                        <p className="text-[11px] text-text-dim max-w-[210px] leading-relaxed">
                            Ninguna plantilla coincide con &ldquo;{searchQuery}&rdquo;.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="mt-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                ) : (
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
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {investigacionTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                                onPreview={onPreviewTemplate}
                                                onDownload={onDownloadPdf}
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
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {innovacionTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                                onPreview={onPreviewTemplate}
                                                onDownload={onDownloadPdf}
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
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {certificadosTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                                onPreview={onPreviewTemplate}
                                                onDownload={onDownloadPdf}
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
                                    </div>
                                    <div className="divide-y divide-border-thin/30">
                                        {reportesTemplates.map(t => (
                                            <SortableTemplateItem
                                                key={t.code}
                                                template={t}
                                                isSelected={selectedTemplate?.code === t.code}
                                                onSelect={() => onSelectTemplate(t)}
                                                onPreview={onPreviewTemplate}
                                                onDownload={onDownloadPdf}
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
                )}
            </div>
        </div>
    );
};
