import React from 'react';
import { Printer, RotateCcw } from 'lucide-react';

interface PlannerHeaderProps {
    isSimulating: boolean;
    onReset: () => void;
    totalProjectsCount: number;
    periodLabel: string;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
    isSimulating,
    onReset,
    totalProjectsCount,
    periodLabel
}) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bento-card static p-5 md:p-6 bg-surface border border-border-thin rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
                            Modelo CACES ISTT
                        </span>
                        <span className="text-text-dim text-xs">•</span>
                        <h2 className="text-base md:text-lg font-semibold text-text-main tracking-tight">
                            Planificador y Simulador CACES & TRL
                        </h2>
                        <span className="text-text-dim text-xs">•</span>
                        {isSimulating ? (
                            <span className="text-[11px] font-mono font-medium text-warning">
                                Simulación Predictiva
                            </span>
                        ) : (
                            <span className="text-[11px] font-mono text-text-dim">
                                Datos Reales ({periodLabel})
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-text-dim leading-relaxed font-normal max-w-3xl">
                        Herramienta predictiva de planificación institucional basada en las 2 fórmulas oficiales de evaluación externa CACES para Institutos Superiores Técnicos y Tecnológicos: Tasa de Producción Científica docente (T<sub>prod</sub> ≥ 0.5) y Madurez Tecnológica (TRL ≥ 5 / Transferencia).
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {isSimulating && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="btn-vercel-secondary text-xs flex items-center gap-1.5 py-2 px-3"
                            title="Restablecer todos los valores a los datos reales registrados"
                        >
                            <RotateCcw size={13} />
                            <span>Restablecer Reales</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn-vercel-primary text-xs flex items-center gap-1.5 py-2 px-3 print:hidden"
                        title="Imprimir o exportar ficha de proyección CACES"
                    >
                        <Printer size={13} />
                        <span>Ficha Técnica</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-text-dim pt-2 border-t border-border-thin/50">
                <span>Portafolio Analizado: <strong className="text-text-main font-semibold">{totalProjectsCount} proyectos</strong></span>
                <span>Resolución Técnica CACES - Criterio I+D+i</span>
            </div>
        </div>
    );
};
