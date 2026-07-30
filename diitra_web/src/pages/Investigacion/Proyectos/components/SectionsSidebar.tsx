import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SECTIONS } from '../types/revisionTecnicaTypes';
import type { SectionComment } from '../types/revisionTecnicaTypes';

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
}

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
    templateBlocks
}) => {
    const hasSectionActiveComments = (secId: string): boolean => {
        if (secId === 'identificacion') {
            return ['titulo', 'programa', 'grupo', 'dominio_linea', 'campos', 'carrera'].some(k => comments[k] && comments[k].length > 0);
        } else if (secId === 'equipo') {
            return !!(comments.equipo && comments.equipo.length > 0);
        } else if (secId === 'plan_tecnico') {
            return ['antecedentes', 'justificacion', 'objetivos', 'metodologia'].some(k => comments[k] && comments[k].length > 0);
        } else if (secId === 'recursos') {
            return !!(comments.presupuesto && comments.presupuesto.length > 0);
        } else if (secId === 'impacto') {
            return !!(comments.impacto && comments.impacto.length > 0);
        } else if (secId === 'cronograma') {
            return !!(comments.cronograma && comments.cronograma.length > 0);
        } else if (secId === 'bibliografia') {
            return !!(comments.bibliografia && comments.bibliografia.length > 0);
        }
        return !!(comments[secId] && comments[secId].length > 0);
    };

    // Calcular las secciones visibles
    const sectionsToDisplay = React.useMemo(() => {
        if (!templateBlocks || templateBlocks.length === 0) {
            return SECTIONS;
        }

        const dynamicList: { id: string; label: string; icon: any }[] = [];
        templateBlocks.forEach(b => {
            if (b.type === 'cover' || b.type === 'project_general_section') {
                if (!dynamicList.some(s => s.id === 'identificacion')) {
                    dynamicList.push({ id: 'identificacion', label: 'Identificación', icon: SECTIONS[0].icon });
                }
            } else if (b.type === 'researchers_table') {
                if (!dynamicList.some(s => s.id === 'equipo')) {
                    dynamicList.push({ id: 'equipo', label: 'Equipo Humano', icon: SECTIONS[1].icon });
                }
            } else if (b.type === 'project_technical_section' || b.type === 'title') {
                if (!dynamicList.some(s => s.id === 'plan_tecnico')) {
                    dynamicList.push({ id: 'plan_tecnico', label: b.title || 'Plan Técnico', icon: SECTIONS[2].icon });
                }
            } else if (b.type === 'project_budget_section' || b.type === 'advanced_table' || b.type === 'multi_section_table') {
                if (!dynamicList.some(s => s.id === 'recursos')) {
                    dynamicList.push({ id: 'recursos', label: b.title || 'Recursos', icon: SECTIONS[3].icon });
                }
            } else if (b.type === 'impacts') {
                if (!dynamicList.some(s => s.id === 'impacto')) {
                    dynamicList.push({ id: 'impacto', label: b.title || 'Impacto & Entregables', icon: SECTIONS[4].icon });
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
                // Bloques custom creados por el administrador
                const cleanId = b.id || `custom-${b.type}`;
                if (!dynamicList.some(s => s.id === cleanId)) {
                    dynamicList.push({ id: cleanId, label: b.title || 'Sección', icon: SECTIONS[0].icon });
                }
            }
        });

        return dynamicList.length > 0 ? dynamicList : SECTIONS;
    }, [templateBlocks]);

    return (
        <div
            ref={leftSidebarRef}
            style={{ width: isOpen ? `${width}px` : '0px' }}
            className={`h-full bg-surface-hover/20 border-r border-border-thin flex flex-col shrink-0 relative overflow-hidden ${isDraggingLeft ? 'transition-none' : 'transition-all duration-300'
                }`}
        >
            <div className="px-4 pb-3 pt-4 border-b border-border-thin/50 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-black text-text-dim uppercase tracking-widest block font-mono">Secciones</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-surface-hover rounded text-text-dim hover:text-text-main cursor-pointer"
                    title="Ocultar Secciones"
                >
                    <ChevronLeft size={14} />
                </button>
            </div>
            <div className="p-4 flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
                {sectionsToDisplay.map((sec) => {
                    const SecIcon = sec.icon;
                    const isActive = activeSection === sec.id;
                    const hasActiveComments = hasSectionActiveComments(sec.id);

                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${isActive
                                ? 'bg-text-main text-bg-deep font-bold shadow-sm'
                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/60'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 truncate">
                                <SecIcon size={14} className="shrink-0" />
                                <span className="text-[10px] uppercase tracking-wider truncate">{sec.label}</span>
                            </div>
                            {hasActiveComments && (
                                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 ml-1.5" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tirador Resizer derecho */}
            <div
                onMouseDown={startDraggingLeft}
                className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/35 active:bg-brand/50 z-20 transition-all"
                title="Arrastra para cambiar ancho"
            />
        </div>
    );
};
