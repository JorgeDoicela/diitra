import React from 'react';
import type { ProyectoResumen } from '../types/analytics.types';
import { formatCurrency } from '../utils/cacesCalculator';

export interface AnalyticsProductsTabProps {
    filteredProjects: ProyectoResumen[];
    activeProjectUuid: string | null;
    setActiveProjectUuid: (uuid: string) => void;
}

export const AnalyticsProductsTab: React.FC<AnalyticsProductsTabProps> = ({
    filteredProjects,
    activeProjectUuid,
    setActiveProjectUuid
}) => {
    const selectedProj = filteredProjects.find(p => p.uuid === (activeProjectUuid || filteredProjects[0]?.uuid)) || filteredProjects[0];

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Layout estilo Vercel de Proyectos e I+D */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Menú Lateral Izquierdo: Selector de Proyectos */}
                <div className="space-y-2 lg:col-span-1 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim block mb-3 pl-1 font-mono">
                        Proyectos en Portafolio
                    </span>
                    {filteredProjects.map((p) => {
                        const isActive = (activeProjectUuid || filteredProjects[0]?.uuid) === p.uuid;
                        const pctGasto = p.presupuestoTotal && p.presupuestoTotal > 0
                            ? Math.min(100, Math.round(((p.presupuestoEjecutado || 0) / p.presupuestoTotal) * 100))
                            : 0;

                        return (
                            <button
                                key={p.uuid}
                                onClick={() => setActiveProjectUuid(p.uuid)}
                                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 select-none group flex flex-col gap-2 relative overflow-hidden ${
                                    isActive 
                                        ? 'bg-surface border-brand shadow-sm scale-102 z-10' 
                                        : 'bg-surface/40 hover:bg-surface/80 border-border-thin hover:border-text-dim/30'
                                }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                                )}
                                <div className="flex items-center justify-between gap-1 w-full text-[9px] font-medium">
                                    <span className="font-mono text-brand truncate">
                                        {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                    </span>
                                    <span className="text-text-dim">
                                        Gasto: {pctGasto}%
                                    </span>
                                </div>
                                <h5 className="text-[10.5px] font-medium text-text-main line-clamp-2 leading-snug group-hover:text-brand transition-colors" title={p.titulo}>
                                    {p.titulo}
                                </h5>
                                <div className="w-full bg-border-thin/35 h-0.5 rounded-full overflow-hidden mt-1">
                                    <div 
                                        className="h-full rounded-full bg-brand" 
                                        style={{ width: `${pctGasto}%` }} 
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Panel Central de Detalle del Proyecto Seleccionado */}
                {selectedProj && (
                    (() => {
                        const pctGasto = selectedProj.presupuestoTotal && selectedProj.presupuestoTotal > 0
                            ? Math.min(100, Math.round(((selectedProj.presupuestoEjecutado || 0) / selectedProj.presupuestoTotal) * 100))
                            : 0;

                        return (
                            <div className="lg:col-span-3 bento-card static p-6 flex flex-col justify-between h-auto min-h-[400px] bg-surface border border-border-thin shadow-sm rounded-xl space-y-6">
                                {/* Header Proyecto */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-thin/50 pb-4">
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] font-semibold font-mono text-brand uppercase tracking-wider">
                                                {selectedProj.codigoInstitucional || `PROY-${selectedProj.uuid.substring(0, 5).toUpperCase()}`}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                                                selectedProj.estado === 'Aprobado' || selectedProj.estado === 'En Ejecución'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {selectedProj.estado}
                                            </span>
                                            {selectedProj.entidadAliada && (
                                                <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                                                    Co-Ejecutor
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-semibold text-text-main leading-snug">
                                            {selectedProj.titulo}
                                        </h3>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0 bg-bg-deep/50 border border-border-thin px-4 py-2.5 rounded-xl">
                                        <span className="text-[8px] font-medium uppercase text-text-dim block tracking-wider">Presupuesto Asignado</span>
                                        <span className="text-xl font-semibold font-mono text-text-main">{formatCurrency(selectedProj.presupuestoTotal || 0)}</span>
                                    </div>
                                </div>

                                {/* Fila Detalle KPIs */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-bg-deep/20 border border-border-thin/40 rounded-2xl select-none">
                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Gasto Ejecutado</span>
                                        <span className="text-xs font-bold font-mono text-text-main block mt-0.5">{formatCurrency(selectedProj.presupuestoEjecutado || 0)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Semilleristas (Alumnos)</span>
                                        <span className="text-xs font-bold font-mono text-text-main block mt-0.5">{selectedProj.totalEstudiantes || 0} estudiantes</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Productos Científicos</span>
                                        <span className="text-xs font-bold font-mono text-success block mt-0.5">{selectedProj.totalProductos || 0} registrados</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Nivel TRL Actual</span>
                                        <span className="text-xs font-bold font-mono text-purple-400 block mt-0.5">TRL {selectedProj.trlActual || 1} / meta: TRL {selectedProj.trlMeta || 9}</span>
                                    </div>
                                </div>

                                {/* Visual Progress Scale */}
                                <div className="p-5 bg-bg-deep/30 border border-border-thin/40 rounded-2xl flex flex-col sm:flex-row items-center justify-around gap-6 select-none animate-fade-up">
                                    {/* Circular Gasto Progress */}
                                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15.915"
                                                className="fill-none"
                                                stroke="var(--border)"
                                                strokeWidth="2"
                                            />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15.915"
                                                className="fill-none transition-all duration-1000"
                                                stroke="var(--brand)"
                                                strokeWidth="2.8"
                                                strokeDasharray={`${pctGasto} ${100 - pctGasto}`}
                                                strokeDashoffset="0"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                            <span className="text-xl font-black text-text-main font-mono leading-none">
                                                {pctGasto}%
                                            </span>
                                            <span className="text-[7.5px] font-black text-text-dim uppercase tracking-wider mt-1">
                                                GASTO REALIZADO
                                            </span>
                                        </div>
                                    </div>

                                    {/* Línea de Investigación de Respaldo */}
                                    <div className="space-y-3.5 flex-1 max-w-md w-full">
                                        <div className="space-y-0.5">
                                            <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Línea de Investigación</span>
                                            <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.lineaInvestigacion || 'General'}>
                                                {selectedProj.lineaInvestigacion || 'Línea de Investigación General / Institucional'}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Convocatoria de Origen</span>
                                            <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.convocatoriaTitulo || 'General'}>
                                                {selectedProj.convocatoriaTitulo || 'Sin convocatoria asignada'}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Vinculación Plan Nacional (PND)</span>
                                            <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.objetivoPnd || 'No requerido'}>
                                                {selectedProj.objetivoPnd || 'No requerido para este tipo de proyecto'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fila Inferior de Productos Entregables */}
                                <div className="space-y-3 pt-4 border-t border-brand/20 select-none animate-fade-up">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-dim pl-1 font-mono block">
                                        Entregables Científicos de este Proyecto
                                    </span>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        
                                        {/* Columna 1: Borrador / Planificación */}
                                        <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                            <div className="flex items-center justify-between text-[9px] font-black text-text-dim uppercase pb-1.5 border-b border-border-thin">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                                    Planificación
                                                </span>
                                                <span className="font-mono">1</span>
                                            </div>
                                            <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                    <p className="leading-snug line-clamp-2">Informe Técnico y Ficha de Viabilidad del Proyecto</p>
                                                    <span className="text-[7.5px] font-mono font-bold text-text-dim uppercase mt-0.5">Reporte Interno</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Columna 2: En Revisión */}
                                        <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                            <div className="flex items-center justify-between text-[9px] font-black text-warning uppercase pb-1.5 border-b border-border-thin">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                                                    En Revisión
                                                </span>
                                                <span className="font-mono">{selectedProj.totalProductos > 1 ? 1 : 0}</span>
                                            </div>
                                            <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                {selectedProj.totalProductos > 1 ? (
                                                    <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                        <p className="leading-snug line-clamp-2">Artículo de Investigación — Revisión Regional (Latindex)</p>
                                                        <span className="text-[7.5px] font-mono font-bold text-warning uppercase mt-0.5">Peer Review</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-text-dim font-bold text-center py-5 italic">Sin entregables en revisión.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Columna 3: Validado / Publicado */}
                                        <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                            <div className="flex items-center justify-between text-[9px] font-black text-success uppercase pb-1.5 border-b border-border-thin">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                                    Publicado / Validado
                                                </span>
                                                <span className="font-mono">{selectedProj.totalProductos > 0 ? (selectedProj.totalProductos > 1 ? selectedProj.totalProductos - 1 : 1) : 0}</span>
                                            </div>
                                            <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                {selectedProj.totalProductos > 0 ? (
                                                    <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                        <p className="leading-snug line-clamp-2">Producto de Investigación o Innovación Científica</p>
                                                        <span className="text-[7.5px] font-mono font-bold text-success uppercase mt-0.5">Scopus / Patente</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-text-dim font-bold text-center py-5 italic">No se han registrado publicaciones aún.</p>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};
