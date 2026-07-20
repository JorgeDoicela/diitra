import React from 'react';
import { Plus, X } from 'lucide-react';
import type { ModuleItem } from './hooks/useModulosOrchestration';

interface ModulosSelectorProps {
    modulesList: ModuleItem[];
    activeModule: number | null;
    showDetail: boolean;
    onModuleSelect: (id: number | null) => void;
}

export const ModulosSelector: React.FC<ModulosSelectorProps> = ({
    modulesList,
    activeModule,
    showDetail,
    onModuleSelect
}) => {
    return (
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">

            {/* Selector de pastillas/botones con scroll lateral en móvil y vertical en desktop */}
            <div className="flex flex-row lg:flex-col flex-wrap lg:flex-nowrap gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
                {modulesList.map((item) => {
                    const isSelected = activeModule === item.id;
                    const IconComponent = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleSelect(isSelected ? null : item.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs font-mono uppercase tracking-wider text-left transition-all duration-300 shrink-0 cursor-pointer ${isSelected
                                ? 'bg-text-main text-bg-deep border-text-main font-bold'
                                : 'bg-surface border-border-thin text-text-main hover:bg-surface-hover hover:border-border-hover'
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 ${isSelected
                                ? 'bg-bg-deep border-bg-deep text-text-main rotate-45'
                                : 'bg-bg-deep/50 border-border-thin text-text-dim'
                                }`}>
                                <Plus size={9} className="stroke-[2.5]" />
                            </span>
                            <IconComponent size={14} className="opacity-80" />
                            <span>{item.title}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tooltip explicativo estilo Apple "Mírala en detalle" (Glassmorphism de alta gama) */}
            <div className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetail && activeModule !== null
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden lg:h-auto lg:opacity-0'
                }`}>
                {activeModule !== null && (
                    <div className="custom-blur-panel bg-surface/85 dark:bg-black/75 border border-border-thin rounded-2xl p-6.5 relative space-y-4.5 animate-scale-up">

                        {/* Botón de cierre superior derecho del panel */}
                        <button
                            onClick={() => onModuleSelect(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-bg-deep/50 hover:bg-bg-deep transition-all cursor-pointer"
                            title="Volver al Dashboard"
                        >
                            <X size={12} />
                        </button>

                        {/* Cabecera del Tooltip */}
                        <div className="space-y-1 pr-6">
                            <span className="text-[10px] font-mono font-semibold text-brand tracking-widest block uppercase">MÓDULO 0{activeModule} // AUTOMÁTICO</span>
                            <h3 className="text-xl font-bold tracking-tight text-text-main">
                                {modulesList[activeModule - 1].subtitle}
                            </h3>
                        </div>

                        {/* Párrafo explicativo */}
                        <p className="text-xs text-text-dim leading-relaxed font-sans font-medium">
                            {modulesList[activeModule - 1].desc}
                        </p>

                    </div>
                )}
            </div>

        </div>
    );
};
