import React from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface LaptopMockupProps {
    laptopContainerRef: React.RefObject<HTMLDivElement | null>;
    laptopScale: number;
    activeModule: number | null;
    onModuleSelect: (id: number | null) => void;
    onPrevModule: () => void;
    onNextModule: () => void;
    children: React.ReactNode;
}

export const LaptopMockup: React.FC<LaptopMockupProps> = ({
    laptopContainerRef,
    laptopScale,
    activeModule,
    onModuleSelect,
    onPrevModule,
    onNextModule,
    children
}) => {
    return (
        <div
            ref={laptopContainerRef}
            className="lg:col-span-8 flex flex-col items-center justify-center relative overflow-visible w-full"
            style={{ height: `${512 * laptopScale}px` }}
        >
            <div
                className="absolute top-0 flex flex-col items-center justify-center overflow-visible"
                style={{
                    transform: `scale(${laptopScale})`,
                    transformOrigin: 'top center',
                    width: '740px',
                    zIndex: 10
                }}
            >

                {/* ÚNICO BOTÓN X flotante en la esquina superior derecha del contenedor de la laptop */}
                {activeModule !== null && (
                    <button
                        onClick={() => onModuleSelect(null)}
                        className="absolute -top-6 right-0 lg:-right-4 z-30 w-8 h-8 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface/95 dark:bg-black/90 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                        title="Cerrar detalle"
                    >
                        <X size={14} className="stroke-[2.5]" />
                    </button>
                )}

                {/* Botonera de navegación vertical (Subir / Bajar módulo) */}
                {activeModule !== null && (
                    <div className="absolute -left-6 lg:-left-12 top-[74%] -translate-y-1/2 z-30 flex flex-col gap-2">
                        <button
                            onClick={onPrevModule}
                            className="w-8.5 h-8.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface dark:bg-black/95 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:border-border-hover"
                            title="Módulo Anterior"
                        >
                            <ChevronUp size={14} className="stroke-[2.5]" />
                        </button>
                        <button
                            onClick={onNextModule}
                            className="w-8.5 h-8.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface dark:bg-black/95 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:border-border-hover"
                            title="Módulo Siguiente"
                        >
                            <ChevronDown size={14} className="stroke-[2.5]" />
                        </button>
                    </div>
                )}

                {/* TAPA/PANTALLA DE LA LAPTOP */}
                <div className="laptop-lid w-full">
                    <div className="laptop-screen-glass">

                        {/* Cámara Web de la laptop */}
                        <div className="laptop-camera" />

                        {/* Reflejo/Brillo sobre el cristal */}
                        <div className="laptop-screen-glare" />

                        {/* PANTALLA ACTIVA */}
                        <div className="laptop-display p-4 flex flex-col justify-between select-none screen-transition" key={activeModule ?? 'dashboard'}>
                            {children}
                        </div>

                    </div>
                </div>

                {/* CUERPO/BASE DE LA LAPTOP */}
                <div className="laptop-base-wrapper">
                    <div className="laptop-base">
                        <div className="laptop-notch" />
                    </div>
                    <div className="laptop-shadow" />
                </div>

            </div>
        </div>
    );
};
