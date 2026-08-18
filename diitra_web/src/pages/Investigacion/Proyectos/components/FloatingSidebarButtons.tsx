import React from 'react';
import { BookOpen, Activity } from 'lucide-react';

interface FloatingSidebarButtonsProps {
    isLeftSidebarOpen: boolean;
    seccionesButtonTop: number;
    seccionesButtonLeft: number | null;
    isDraggingSeccionesButton: boolean;
    handleSeccionesButtonDragStart: (e: React.MouseEvent) => void;
    isRightSidebarOpen: boolean;
    auditoriaButtonTop: number;
    auditoriaButtonLeft: number | null;
    isDraggingButton: boolean;
    handleButtonDragStart: (e: React.MouseEvent) => void;
}

export const FloatingSidebarButtons: React.FC<FloatingSidebarButtonsProps> = ({
    isLeftSidebarOpen,
    seccionesButtonTop,
    seccionesButtonLeft,
    isDraggingSeccionesButton,
    handleSeccionesButtonDragStart,
    isRightSidebarOpen,
    auditoriaButtonTop,
    auditoriaButtonLeft,
    isDraggingButton,
    handleButtonDragStart
}) => {
    return (
        <>
            {/* Pestaña flotante de reapertura del Panel de Secciones (Izquierda) */}
            {!isLeftSidebarOpen && (
                <button
                    type="button"
                    onMouseDown={handleSeccionesButtonDragStart}
                    style={{
                        top: `${seccionesButtonTop}px`,
                        left: seccionesButtonLeft !== null ? `${seccionesButtonLeft}px` : '0px',
                    }}
                    className={`fixed z-[60] py-7 px-2.5 bg-surface hover:bg-bg-deep border border-border-thin text-text-dim hover:text-text-main shadow-xl flex flex-col items-center gap-2 transition-all duration-200 animate-fade-in group cursor-grab active:cursor-grabbing select-none ${
                        isDraggingSeccionesButton || (seccionesButtonLeft !== null && seccionesButtonLeft > 5)
                            ? 'rounded-full scale-[1.05] shadow-2xl border-text-main text-text-main bg-bg-deep'
                            : 'rounded-r-xl border-l-0'
                    }`}
                    title="Arrastra para mover / Clic para abrir navegación"
                >
                    <BookOpen size={14} className="text-text-main group-hover:scale-110 transition-transform shrink-0" />
                    <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-opacity font-mono">
                        Nav
                    </span>
                </button>
            )}

            {/* Pestaña flotante de reapertura del Panel de Auditoría (Derecha) */}
            {!isRightSidebarOpen && (
                <button
                    type="button"
                    onMouseDown={handleButtonDragStart}
                    style={{
                        top: `${auditoriaButtonTop}px`,
                        left: auditoriaButtonLeft !== null ? `${auditoriaButtonLeft}px` : undefined,
                        right: auditoriaButtonLeft !== null ? 'auto' : '0px'
                    }}
                    className={`fixed z-[60] py-7 px-2.5 bg-surface hover:bg-bg-deep border border-border-thin text-text-dim hover:text-text-main shadow-xl flex flex-col items-center gap-2 transition-all duration-200 animate-fade-in group cursor-grab active:cursor-grabbing select-none ${
                        isDraggingButton || (auditoriaButtonLeft !== null)
                            ? 'rounded-full scale-[1.05] shadow-2xl border-text-main text-text-main bg-bg-deep'
                            : 'rounded-l-xl border-r-0'
                    }`}
                    title="Arrastra para mover / Clic para abrir auditoría"
                >
                    <Activity size={14} className="text-text-main animate-pulse group-hover:scale-110 transition-transform shrink-0" />
                    <span className="[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-opacity font-mono">
                        Auditoría
                    </span>
                </button>
            )}
        </>
    );
};
