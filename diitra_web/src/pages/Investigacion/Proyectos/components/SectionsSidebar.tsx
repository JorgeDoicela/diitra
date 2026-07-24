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
    comments
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
        return false;
    };

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
                {SECTIONS.map((sec) => {
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
