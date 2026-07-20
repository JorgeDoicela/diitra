import React from 'react';
import { BookOpen, Shield } from 'lucide-react';

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
            {/* Botón flotante unificado de reapertura del Panel de Secciones (izquierda) si está cerrado */}
            {!isLeftSidebarOpen && (
                <div
                    onMouseDown={handleSeccionesButtonDragStart}
                    style={{
                        top: `${seccionesButtonTop}px`,
                        left: seccionesButtonLeft !== null ? `${seccionesButtonLeft}px` : '0px',
                    }}
                    className={`fixed z-[60] py-4 px-2.5 w-[36px] bg-surface hover:bg-surface-hover border border-border-thin rounded-full text-text-dim hover:text-text-main flex flex-col items-center gap-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing select-none active:scale-95 group font-bold ${
                        isDraggingSeccionesButton ? 'transition-none cursor-grabbing border-brand/50 ring-1 ring-brand/20 shadow-[0_8px_24px_rgba(99,102,241,0.18)]' : 'transition-all duration-300'
                    }`}
                    title="Arrastra libremente por la pantalla / Clic para abrir"
                >
                    <BookOpen size={13} className="text-brand group-hover:scale-110 transition-transform shrink-0" />
                    <span className="[writing-mode:vertical-lr] tracking-widest text-[9px] font-black uppercase text-center cursor-pointer select-none">
                        Secciones
                    </span>
                </div>
            )}

            {/* Botón flotante unificado de reapertura del Panel de Auditoría (derecha) si está cerrado */}
            {!isRightSidebarOpen && (
                <div
                    onMouseDown={handleButtonDragStart}
                    style={{
                        top: `${auditoriaButtonTop}px`,
                        left: auditoriaButtonLeft !== null ? `${auditoriaButtonLeft}px` : undefined,
                        right: auditoriaButtonLeft !== null ? 'auto' : '0px'
                    }}
                    className={`fixed z-[60] py-4 px-2.5 w-[36px] bg-surface hover:bg-surface-hover border border-border-thin rounded-full text-text-dim hover:text-text-main flex flex-col items-center gap-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing select-none active:scale-95 group font-bold ${
                        isDraggingButton ? 'transition-none cursor-grabbing border-brand/50 ring-1 ring-brand/20 shadow-[0_8px_24px_rgba(99,102,241,0.18)]' : 'transition-all duration-300'
                    }`}
                    title="Arrastra libremente por la pantalla / Clic para abrir"
                >
                    <Shield size={13} className="text-brand group-hover:scale-110 transition-transform shrink-0" />
                    <span className="[writing-mode:vertical-lr] tracking-widest text-[9px] font-black uppercase text-center cursor-pointer select-none">
                        Auditoría
                    </span>
                </div>
            )}
        </>
    );
};
