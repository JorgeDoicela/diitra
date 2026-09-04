import React from 'react';
import {
    ChevronLeft,
    BookOpen,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    FileText,
    Users,
    DollarSign,
    Calendar,
    Target,
    CheckSquare,
    BarChart,
    Library,
    Award,
    Shield
} from 'lucide-react';
import { SECTIONS } from '../types/revisionTecnicaTypes';
import type { SectionComment } from '../types/revisionTecnicaTypes';
import { formatDynamicSectionLabel } from '../../../../utils/sectionNumbering';

interface SectionsSidebarProps {
    isOpen: boolean;
    width: number;
    isDraggingLeft: boolean;
    leftSidebarRef: React.RefObject<HTMLDivElement>;
    activeSection: string;
    setActiveSection: (section: string) => void;
    onClose: () => void;
    startDraggingLeft: (e: React.MouseEvent) => void;
    comments: Record<string, SectionComment[]>;
    templateBlocks?: any[];
    templateSections?: any[];
    onOpenFinalizeModal?: () => void;
}

const ICON_MAP: Record<string, any> = {
    BookOpen,
    FileText,
    Users,
    DollarSign,
    Calendar,
    Target,
    CheckSquare,
    BarChart,
    Library,
    Award,
    Shield
};

export const SectionsSidebar: React.FC<SectionsSidebarProps> = ({
    isOpen,
    width,
    isDraggingLeft,
    leftSidebarRef,
    activeSection,
    setActiveSection,
    onClose,
    startDraggingLeft,
    comments,
    templateBlocks,
    templateSections,
    onOpenFinalizeModal
}) => {
    const getSectionCommentsCount = (secId: string): number => {
        let keys: string[] = [secId];
        if (secId === 'identificacion') {
            keys = ['titulo', 'programa', 'grupo', 'dominio_linea', 'campos', 'carrera'];
        } else if (secId === 'equipo') {
            keys = ['equipo'];
        } else if (secId === 'plan_tecnico') {
            keys = ['antecedentes', 'justificacion', 'objetivos', 'metodologia'];
        } else if (secId === 'recursos') {
            keys = ['presupuesto'];
        } else if (secId === 'impacto') {
            keys = ['impacto'];
        } else if (secId === 'cronograma') {
            keys = ['cronograma'];
        } else if (secId === 'bibliografia') {
            keys = ['bibliografia'];
        }
        
        return keys.reduce((acc, k) => acc + (comments[k]?.length || 0), 0);
    };

    // Calcular las secciones visibles dinámicas
    const sectionsToDisplay = React.useMemo(() => {
        // 1. Si provienen directamente de ui-config (idéntico a DocumentEditor)
        if (templateSections && Array.isArray(templateSections) && templateSections.length > 0) {
            return templateSections.map((sec, idx) => {
                const mappedIcon = (sec.iconName && ICON_MAP[sec.iconName]) || (SECTIONS.find(s => s.id === sec.id)?.icon) || BookOpen;
                const dynamicLabel = formatDynamicSectionLabel(sec.label || sec.title || 'Sección', idx);
                return {
                    id: sec.id,
                    label: dynamicLabel,
                    icon: mappedIcon
                };
            });
        }

        // 2. Si se calcula desde templateBlocks
        if (templateBlocks && Array.isArray(templateBlocks) && templateBlocks.length > 0) {
            const dynamicList: { id: string; label: string; icon: any }[] = [];
            templateBlocks.forEach(b => {
                if (b.isActive === false) return;

                if (b.type === 'cover') {
                    // Portada PDF estática: No es sección editable/navegable
                    return;
                } else if (b.type === 'project_general_section') {
                    if (!dynamicList.some(s => s.id === 'identificacion')) {
                        dynamicList.push({ id: 'identificacion', label: b.title || 'Identificación', icon: SECTIONS[0].icon });
                    }
                } else if (b.type === 'researchers_table') {
                    if (!dynamicList.some(s => s.id === 'equipo')) {
                        dynamicList.push({ id: 'equipo', label: b.title || 'Equipo Humano', icon: SECTIONS[1].icon });
                    }
                } else if (b.type === 'project_technical_section' || b.type === 'title') {
                    if (!dynamicList.some(s => s.id === 'plan_tecnico')) {
                        dynamicList.push({ id: 'plan_tecnico', label: b.title || 'Plan Técnico', icon: SECTIONS[2].icon });
                    }
                } else if (b.type === 'project_budget_section' || b.type === 'advanced_table' || b.type === 'multi_section_table') {
                    if (!dynamicList.some(s => s.id === 'recursos')) {
                        dynamicList.push({ id: 'recursos', label: b.title || 'Recursos', icon: SECTIONS[3].icon });
                    }
                } else if (b.type === 'expected_products') {
                    if (!dynamicList.some(s => s.id === 'productos_esperados')) {
                        dynamicList.push({ id: 'productos_esperados', label: b.title || 'Productos Esperados', icon: SECTIONS[4].icon });
                    }
                } else if (b.type === 'impacts') {
                    if (!dynamicList.some(s => s.id === 'impacto')) {
                        dynamicList.push({ id: 'impacto', label: b.title || 'Matriz de Impactos', icon: SECTIONS[4].icon });
                    }
                } else if (b.type === 'gantt') {
                    if (!dynamicList.some(s => s.id === 'cronograma')) {
                        dynamicList.push({ id: 'cronograma', label: b.title || 'Cronograma (Gantt)', icon: SECTIONS[5].icon });
                    }
                } else if (b.type === 'signatures') {
                    if (!dynamicList.some(s => s.id === 'bibliografia')) {
                        dynamicList.push({ id: 'bibliografia', label: b.title || 'Bibliografía & Firmas', icon: SECTIONS[6].icon });
                    }
                } else {
                    const cleanId = b.id || `custom-${b.type}`;
                    if (!dynamicList.some(s => s.id === cleanId)) {
                        dynamicList.push({ id: cleanId, label: b.title || 'Sección', icon: BookOpen });
                    }
                }
            });

            if (dynamicList.length > 0) {
                return dynamicList.map((item, idx) => ({
                    ...item,
                    label: formatDynamicSectionLabel(item.label, idx)
                }));
            }
        }

        return SECTIONS.map((sec, idx) => ({
            ...sec,
            label: formatDynamicSectionLabel(sec.label, idx)
        }));
    }, [templateBlocks, templateSections]);

    return (
        <div
            ref={leftSidebarRef}
            style={{ width: isOpen ? `${width}px` : '0px' }}
            className={`h-full bg-bg-deep border-r border-border-thin flex flex-col shrink-0 relative overflow-hidden select-none ${
                isDraggingLeft ? 'transition-none' : 'transition-all duration-300'
            }`}
        >
            {/* Header con estilo Workspace */}
            <div className="p-5 pb-3 border-b border-border-thin flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-text-main shrink-0" />
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] font-mono">
                        Navegación del Protocolo
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    title="Contraer navegación"
                >
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* Lista de Secciones */}
            <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                {sectionsToDisplay.map((sec) => {
                    const SecIcon = sec.icon;
                    const isActive = activeSection === sec.id;
                    const commentCount = getSectionCommentsCount(sec.id);

                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all cursor-pointer group ${
                                isActive
                                    ? 'bg-text-main text-bg-deep font-bold shadow-lg translate-x-1'
                                    : 'text-text-dim hover:text-text-main hover:bg-surface-hover/80 font-semibold'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                <SecIcon
                                    size={16}
                                    className={`shrink-0 transition-transform ${
                                        isActive ? 'text-bg-deep scale-110' : 'text-text-dim group-hover:text-text-main'
                                    }`}
                                />
                                <span className="text-xs uppercase tracking-wider truncate font-sans">
                                    {sec.label}
                                </span>
                            </div>

                            {/* Badge de estado / observaciones */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {commentCount > 0 ? (
                                    <span
                                        className={`flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                            isActive
                                                ? 'bg-bg-deep/15 text-bg-deep border-bg-deep/30'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}
                                        title={`${commentCount} observación(es)`}
                                    >
                                        <AlertCircle size={10} className="shrink-0" />
                                        <span>{commentCount}</span>
                                    </span>
                                ) : (
                                    <span
                                        className={`p-0.5 rounded-full opacity-40 group-hover:opacity-100 transition-opacity ${
                                            isActive ? 'text-bg-deep' : 'text-emerald-500'
                                        }`}
                                        title="Sin observaciones"
                                    >
                                        <CheckCircle2 size={12} />
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>


            {/* Tirador Resizer derecho */}
            <div
                onMouseDown={startDraggingLeft}
                className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/35 active:bg-brand/50 z-20 transition-all"
                title="Arrastra para ajustar el ancho"
            />
        </div>
    );
};
