import React from 'react';
import { parseObservation } from '../hooks/usePreproposalState';

interface ProjectTraceabilitySectionProps {
    trazabilidad: any[];
    isLoadingTrazabilidad: boolean;
}

export const renderTrazabilidadObservation = (observationText: string) => {
    if (!observationText) return null;
    const parsed = parseObservation(observationText);

    if (parsed.general && !parsed.carrera && !parsed.titulo && !parsed.descripcion && !parsed.presupuesto) {
        return (
            <p className="text-[10px] text-text-dim italic bg-bg-deep p-2.5 rounded border border-border-thin mt-1 break-words font-mono whitespace-pre-wrap">
                {parsed.general}
            </p>
        );
    }

    return (
        <div className="bg-bg-deep p-2.5 rounded border border-border-thin mt-1 space-y-2 font-mono text-[9px] text-text-dim">
            {parsed.general && (
                <div className="border-b border-border-thin pb-1.5 mb-1.5">
                    <span className="font-bold text-text-main block mb-0.5 text-[8px] uppercase tracking-wider">General</span>
                    <p className="whitespace-pre-wrap italic">{parsed.general}</p>
                </div>
            )}
            {parsed.carrera && (
                <div>
                    <span className="font-bold text-error block mb-0.5 text-[8px] uppercase tracking-wider">Carrera / Unidad</span>
                    <p className="whitespace-pre-wrap italic">{parsed.carrera}</p>
                </div>
            )}
            {parsed.titulo && (
                <div>
                    <span className="font-bold text-error block mb-0.5 text-[8px] uppercase tracking-wider">Tema / Título</span>
                    <p className="whitespace-pre-wrap italic">{parsed.titulo}</p>
                </div>
            )}
            {parsed.descripcion && (
                <div>
                    <span className="font-bold text-error block mb-0.5 text-[8px] uppercase tracking-wider">Descripción</span>
                    <p className="whitespace-pre-wrap italic">{parsed.descripcion}</p>
                </div>
            )}
            {parsed.presupuesto && (
                <div>
                    <span className="font-bold text-error block mb-0.5 text-[8px] uppercase tracking-wider">Presupuesto</span>
                    <p className="whitespace-pre-wrap italic">{parsed.presupuesto}</p>
                </div>
            )}
        </div>
    );
};

export const ProjectTraceabilitySection: React.FC<ProjectTraceabilitySectionProps> = ({
    trazabilidad,
    isLoadingTrazabilidad
}) => {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Línea de Tiempo del Estado</label>
            {isLoadingTrazabilidad ? (
                <div className="text-[10px] text-text-dim animate-pulse pl-2 font-mono">Cargando historial...</div>
            ) : trazabilidad.length === 0 ? (
                <div className="text-[10px] text-text-dim italic pl-2">Sin transiciones registradas.</div>
            ) : (
                <div className="space-y-4 pl-2 border-l border-border-thin ml-2">
                    {trazabilidad.map((item: any, index: number) => {
                        const statusName = String(item.estadoNuevo ?? item.EstadoNuevo ?? 'Estado Desconocido');
                        const dateStr = item.fechaTransicion ?? item.FechaTransicion;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleString('es-EC') : '';
                        const observationText = String(item.observacion ?? item.Observacion ?? '');
                        const isErrorState = statusName.toLowerCase().includes('rechazado') || statusName.toLowerCase().includes('devuelto');

                        return (
                            <div key={index} className="relative">
                                <div className={`absolute -left-[13px] top-1.5 w-1.5 h-1.5 rounded-full ${isErrorState ? 'bg-error animate-pulse' : 'bg-success'}`} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-text-main uppercase tracking-widest">{statusName}</p>
                                    {formattedDate && <p className="text-[8px] text-text-dim font-mono">{formattedDate}</p>}
                                    {observationText && renderTrazabilidadObservation(observationText)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
