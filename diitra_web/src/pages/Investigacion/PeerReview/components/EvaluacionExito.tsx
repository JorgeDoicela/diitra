import React from 'react';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import type { EvaluacionDetalle } from '../hooks/useEvaluacionPage';

interface EvaluacionExitoProps {
    dictamenPreview: string;
    dictamenCfg: any;
    puntajeTotal: number;
    detalles: EvaluacionDetalle[];
    navigate: any;
}

export const EvaluacionExito: React.FC<EvaluacionExitoProps> = ({
    dictamenPreview,
    dictamenCfg,
    puntajeTotal,
    detalles,
    navigate
}) => {
    return (
        <main className="flex-1 bg-bg-deep flex items-center justify-center p-8 lg:p-10">
            <div className="bento-card static p-8 text-center max-w-lg w-full shadow-2xl relative z-10 border-border-hover bg-surface animate-scale-up">
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                    {dictamenPreview === 'Aprobado'
                        ? <CheckCircle2 size={36} style={{ color: dictamenCfg.color }} />
                        : <XCircle size={36} style={{ color: dictamenCfg.color }} />
                    }
                </div>

                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-main mb-2">
                    Evaluación Registrada
                </h2>
                <p className="text-text-dim text-sm mb-4">
                    Su dictamen ha sido recibido exitosamente por el comité académico.
                </p>

                <div className="my-6 p-4 bg-bg-deep rounded-xl border border-border-thin space-y-3">
                    <div className="flex justify-between items-center border-b border-border-thin pb-2">
                        <span className="text-xs text-text-dim">Dictamen Emitido:</span>
                        <span className="text-sm font-semibold uppercase tracking-wider font-mono" style={{ color: dictamenCfg.color }}>
                            {dictamenCfg.label}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border-thin pb-2">
                        <span className="text-xs text-text-dim">Puntaje Final:</span>
                        <span className="text-sm font-semibold text-text-main font-mono">
                            {puntajeTotal.toFixed(1)} / 100
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-dim">Fecha de Registro:</span>
                        <span className="text-xs text-text-main font-semibold">
                            {new Date().toLocaleString('es-EC')}
                        </span>
                    </div>
                </div>

                <div className="space-y-2.5 mb-8">
                    <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider text-left">Resumen de Calificaciones</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                        {detalles.map(d => (
                            <div key={d.idCriterio} className="flex justify-between items-center p-2.5 bg-surface-hover/30 border border-border-thin rounded-lg text-left">
                                <span className="text-[11px] text-text-dim truncate pr-2 max-w-[125px]">{d.criterio}</span>
                                <span className="text-[11px] font-semibold text-text-main font-mono">{d.puntaje} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/revisiones')}
                    className="btn-brand w-full py-3 text-xs flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                    Volver a Mis Revisiones
                    <ArrowLeft size={12} className="rotate-180" />
                </button>
            </div>
        </main>
    );
};
