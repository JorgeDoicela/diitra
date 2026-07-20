import React from 'react';
import { FileSignature, Loader2, Check } from 'lucide-react';

interface AcreditacionWidgetProps {
    cacesProgress: { id: number; vinc: number; prop: number };
    exportState: 'idle' | 'loading' | 'success';
    handleExportSiies: () => void;
}

export const AcreditacionWidget: React.FC<AcreditacionWidgetProps> = ({
    cacesProgress,
    exportState,
    handleExportSiies
}) => {
    return (
        <div className="h-full flex flex-col justify-between gap-3 text-left">
            {/* Header del widget */}
            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                <span className="font-semibold text-text-main">// PANEL INDICADORES CACES (SIIES)</span>
                <span>AÑO DE EVALUACIÓN: 2026</span>
            </div>

            {/* Indicadores CACES */}
            <div className="flex-1 flex flex-col justify-center gap-4 py-2">

                {/* Indicador 1 */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-sans">
                        <span className="font-bold text-text-main leading-tight">I+D+i: Proyectos de Investigación Aplicada</span>
                        <span className="text-success font-bold text-[9px] font-mono whitespace-nowrap">100% CUMPLIDO</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-sm overflow-hidden">
                        <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: `${cacesProgress.id}%` }} />
                    </div>
                </div>

                {/* Indicador 2 */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-sans">
                        <span className="font-bold text-text-main leading-tight">Vinculación: Proyectos Sociales y Productivos</span>
                        <span className="text-success font-bold text-[9px] font-mono whitespace-nowrap">85% EXCELENTE</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-sm overflow-hidden">
                        <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: `${cacesProgress.vinc}%` }} />
                    </div>
                </div>

                {/* Indicador 3 */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-sans">
                        <span className="font-bold text-text-main leading-tight">Propiedad Intelectual: Patentes y Registros SENADI</span>
                        <span className="text-warning font-bold text-[9px] font-mono whitespace-nowrap">60% EN PROGRESO</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-sm overflow-hidden">
                        <div className="h-full bg-warning transition-all duration-500 ease-out" style={{ width: `${cacesProgress.prop}%` }} />
                    </div>
                </div>

                {/* Tarjeta de descarga de evidencias */}
                <div className="flex justify-between items-center p-3 rounded-lg border border-brand/20 bg-brand-subtle text-left mt-2">
                    <div className="flex items-center gap-2 text-brand">
                        <FileSignature size={14} className="opacity-90" />
                        <span className="text-[10px] font-semibold font-mono truncate max-w-[190px]">Reporte_Evidencias_CACES.csv</span>
                    </div>
                    <button
                        onClick={handleExportSiies}
                        disabled={exportState !== 'idle'}
                        className={`px-3.5 py-1.5 rounded transition-all text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center min-w-[110px] ${exportState === 'loading'
                            ? 'bg-neutral-800 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500 cursor-not-allowed border border-neutral-750'
                            : exportState === 'success'
                                ? 'bg-success text-white dark:bg-success dark:text-neutral-950 font-bold border border-success/30'
                                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95'
                            }`}
                    >
                        {exportState === 'loading' && <Loader2 size={10} className="animate-spin mr-1.5" />}
                        {exportState === 'success' && <Check size={10} className="mr-1" />}
                        {exportState === 'loading' ? 'SINC... (CHECKLIST)' : exportState === 'success' ? 'SINCRONIZADO ✓' : 'EXPORTAR SIIES'}
                    </button>
                </div>

            </div>
        </div>
    );
};
