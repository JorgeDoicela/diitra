import React from 'react';
import { Check } from 'lucide-react';
import type { HitoItem } from '../hooks/useModulosOrchestration';

interface SeguimientoWidgetProps {
    hitos: HitoItem[];
    toggleHito: (id: number) => void;
    hitosCompletedCount: number;
    hitosTotalCount: number;
}

export const SeguimientoWidget: React.FC<SeguimientoWidgetProps> = ({
    hitos,
    toggleHito,
    hitosCompletedCount,
    hitosTotalCount
}) => {
    return (
        <div className="h-full flex flex-col gap-3">

            {/* Header del widget */}
            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                <span className="font-semibold text-text-main">// MONITOREO Y HITOS</span>
                <span>MOD-02</span>
            </div>

            {/* Contenido principal de hitos */}
            <div className="flex-1 flex flex-col justify-center gap-2.5">

                {/* Panel de Auditoría y Progreso SVG en vivo */}
                <div className="grid grid-cols-12 gap-3 bg-surface/20 p-2.5 rounded border border-border-thin/30 text-left font-mono">

                    {/* SVG Circular de Progreso */}
                    <div className="col-span-5 flex items-center justify-center relative">
                        <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="22" className="stroke-border-thin" strokeWidth="2.5" fill="transparent" />
                            <circle cx="28" cy="28" r="22" className="stroke-success transition-all duration-500 ease-out" strokeWidth="2.5" fill="transparent"
                                strokeDasharray={2 * Math.PI * 22}
                                strokeDashoffset={2 * Math.PI * 22 - (2 * Math.PI * 22 * (hitosCompletedCount / hitosTotalCount))}
                            />
                        </svg>
                        <div className="absolute font-bold text-[10px] text-text-main flex flex-col items-center">
                            <span>{Math.round((hitosCompletedCount / hitosTotalCount) * 100)}%</span>
                        </div>
                    </div>

                    {/* Feed de Auditoría de Carga */}
                    <div className="col-span-7 flex flex-col justify-center text-[8.5px] border-l border-border-thin/20 pl-3 gap-1 min-h-[56px]">
                        <div className="text-[7.5px] text-text-dim uppercase font-mono tracking-wider mb-0.5">// AUDITORÍA DOCENTE</div>
                        <div className="space-y-0.5">
                            <p className={`${hitos[0].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                {hitos[0].completed ? '[OK] Cargo marco_teorico.pdf' : '[-] Falta Marco Teórico'}
                            </p>
                            <p className={`${hitos[1].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                {hitos[1].completed ? '[OK] Subio algoritmo_desglose.py' : '[-] Falta Diseño Algoritmo'}
                            </p>
                            <p className={`${hitos[2].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                {hitos[2].completed ? '[OK] Cargo evidencias_caces.docx' : '[-] Falta Evidencias y Pruebas'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Lista de hitos interactivos */}
                <div className="space-y-1.5">
                    {hitos.map((h) => (
                        <button
                            key={h.id}
                            onClick={() => toggleHito(h.id)}
                            className={`flex items-center justify-between p-2 border border-border-thin rounded bg-bg-deep/45 w-full text-left transition-all duration-200 hover:border-success/30 cursor-pointer`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-300 ${h.completed
                                    ? 'bg-success/15 border-success text-success'
                                    : 'bg-surface/20 border-border-thin text-transparent'
                                    }`}>
                                    <Check size={8} strokeWidth={3} />
                                </span>
                                <span className={`text-[10px] font-semibold font-sans ${h.completed ? 'text-success' : 'text-text-dim'}`}>
                                    {h.name}
                                </span>
                            </div>
                            <span className="text-[8.5px] font-mono text-text-dim">
                                {h.completed ? 'COMPLETADO' : 'PENDIENTE'}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Mapa de avance de docente (MC) interactivo */}
                <div className="bg-surface/30 p-2.5 rounded border border-border-thin/30 space-y-1 text-left font-mono">
                    <div className="flex justify-between items-center text-[8px] text-text-dim">
                        <span>// AVANCE DOCENTE EN VIVO: J. DOICELA</span>
                        {hitosCompletedCount === hitosTotalCount ? (
                            <span className="text-success font-bold font-sans text-[9.5px]">PROYECTO AL DÍA</span>
                        ) : (
                            <span className="text-warning font-bold font-sans text-[9.5px]">EN EJECUCIÓN</span>
                        )}
                    </div>
                    <div className="relative h-4.5 mt-1 flex items-center">
                        <div className="absolute w-full bg-border-thin h-1 rounded-full" />
                        <div
                            className="absolute h-1 bg-success rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(hitosCompletedCount / hitosTotalCount) * 100}%` }}
                        />
                        <div
                            className="absolute w-4.5 h-4.5 rounded-full bg-brand text-white border-2 border-surface flex items-center justify-center text-[6px] font-sans font-bold transition-all duration-500 ease-out shadow-md"
                            style={{ left: `calc(${(hitosCompletedCount / hitosTotalCount) * 100}% - 9px)` }}
                        >
                            JD
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
