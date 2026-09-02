import React from 'react';
import { parseObservation } from '../hooks/usePreproposalState';

interface ProjectTraceabilitySectionProps {
    trazabilidad: any[];
    isLoadingTrazabilidad: boolean;
}

export const renderTrazabilidadObservation = (observationText: string) => {
    if (!observationText) return null;
    const parsed = parseObservation(observationText);

    const specificList = [
        { key: 'carrera', label: 'Carrera / Unidad', text: parsed.carrera },
        { key: 'titulo', label: 'Tema / Título', text: parsed.titulo },
        { key: 'descripcion', label: 'Descripción / Justificación', text: parsed.descripcion },
        { key: 'presupuesto', label: 'Presupuesto Estimado', text: parsed.presupuesto },
    ].filter(item => Boolean(item.text));

    // Si solo hay observación general simple sin campos específicos
    if (parsed.general && specificList.length === 0) {
        return (
            <div className="bg-bg-deep/70 p-2 rounded-lg border border-border-thin mt-1 text-[11px] text-text-main leading-snug whitespace-pre-wrap">
                {parsed.general}
            </div>
        );
    }

    // Si hay desglose completo (general + campos específicos)
    return (
        <div className="bg-bg-deep/70 p-2.5 rounded-lg border border-border-thin mt-1 space-y-2 text-[11px]">
            {parsed.general && (
                <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-text-main uppercase tracking-wider block">
                        Dictamen General
                    </span>
                    <p className="text-text-main leading-snug whitespace-pre-wrap pl-1">
                        {parsed.general}
                    </p>
                </div>
            )}

            {specificList.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-border-thin/60">
                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block">
                        Correcciones por Campo
                    </span>
                    <div className="space-y-1 pl-1">
                        {specificList.map(item => (
                            <div key={item.key} className="space-y-0.5">
                                <span className="text-[9px] font-bold text-error uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                                    {item.label}
                                </span>
                                <p className="text-text-dim text-[10px] leading-snug whitespace-pre-wrap pl-2.5">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
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
            {isLoadingTrazabilidad && trazabilidad.length === 0 ? (
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
                                <div className={`absolute -left-[13px] top-1.5 w-1.5 h-1.5 rounded-full ${isErrorState ? 'bg-error' : 'bg-success'}`} />
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
