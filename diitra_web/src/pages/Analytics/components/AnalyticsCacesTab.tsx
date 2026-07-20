import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ProyectoResumen, CacesIndicator } from '../types/analytics.types';
import { getProjectClassification } from '../utils/cacesCalculator';

export interface AnalyticsCacesTabProps {
    filteredProjects: ProyectoResumen[];
    cacesIndicators: readonly CacesIndicator[];
    activeCacesCode: string;
    setActiveCacesCode: (code: string) => void;
}

export const AnalyticsCacesTab: React.FC<AnalyticsCacesTabProps> = ({
    filteredProjects,
    cacesIndicators,
    activeCacesCode,
    setActiveCacesCode
}) => {
    const selectedInd = cacesIndicators.find(i => i.code === activeCacesCode) || cacesIndicators[0];

    const statusBadge = {
        CUMPLIDO: 'badge-vercel-success',
        'EN PROCESO': 'badge-vercel-warning',
        ALERTA: 'badge-vercel-error'
    }[selectedInd.status] || 'badge-vercel-neutral';

    const progressColor = {
        CUMPLIDO: 'text-success',
        'EN PROCESO': 'text-warning',
        ALERTA: 'text-error'
    }[selectedInd.status] || 'text-brand';

    const strokeColor = {
        CUMPLIDO: 'var(--success)',
        'EN PROCESO': 'var(--warning)',
        ALERTA: 'var(--error)'
    }[selectedInd.status] || 'var(--brand)';

    const { poor, warning, great } = getProjectClassification(filteredProjects, activeCacesCode);
    const totalCount = poor.length + warning.length + great.length;

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-start gap-3">
                <AlertCircle size={16} className="text-brand mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase text-brand tracking-widest">Modelos de Evaluación del CACES</h4>
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        Análisis dinámico de cumplimiento de estándares del Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES) calculados a partir de los datos en tiempo real del sistema.
                    </p>
                </div>
            </div>

            {/* Vercel Speed Insights Style Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Menú Lateral Izquierdo: Lista de Estándares */}
                <div className="space-y-2 lg:col-span-1">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim block mb-3 pl-1 font-mono">
                        Estándares de Evaluación
                    </span>
                    {cacesIndicators.map((ind) => {
                        const isActive = activeCacesCode === ind.code;
                        const barColor = {
                            CUMPLIDO: 'bg-success',
                            'EN PROCESO': 'bg-warning',
                            ALERTA: 'bg-error'
                        }[ind.status] || 'bg-text-dim';

                        const badgeColor = {
                            CUMPLIDO: 'text-success bg-success/10 border-success/20',
                            'EN PROCESO': 'text-warning bg-warning/10 border-warning/20',
                            ALERTA: 'text-error bg-error/10 border-error/20'
                        }[ind.status] || 'text-text-dim bg-surface border-border-thin';

                        return (
                            <button
                                key={ind.code}
                                onClick={() => setActiveCacesCode(ind.code)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 select-none group flex flex-col gap-2.5 relative overflow-hidden ${
                                    isActive 
                                        ? 'bg-surface border-brand shadow-sm scale-102 z-10' 
                                        : 'bg-surface/40 hover:bg-surface/80 border-border-thin hover:border-text-dim/30'
                                }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                                )}
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <span className="text-[10px] font-medium font-mono text-text-dim">
                                        {ind.code}
                                    </span>
                                    <span className={`text-[8.5px] font-medium px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                        {ind.progress}%
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h5 className="text-[11px] font-medium text-text-main group-hover:text-brand transition-colors line-clamp-1">
                                        {ind.name}
                                    </h5>
                                    <div className="w-full bg-border-thin/35 h-1 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${barColor}`} 
                                            style={{ width: `${ind.progress}%` }} 
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Panel Central de Detalle y Gráficos Visuales */}
                <div className="lg:col-span-3 bento-card static p-6 flex flex-col justify-between h-auto min-h-[400px] bg-surface border border-border-thin shadow-sm rounded-xl">
                    <div className="space-y-6">
                        {/* Header Detalle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-thin/50 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium font-mono text-brand uppercase tracking-wider">
                                        Estándar {selectedInd.code}
                                    </span>
                                    <span className={`badge-vercel ${statusBadge}`}>
                                        {selectedInd.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-medium text-text-main leading-snug">
                                    {selectedInd.name}
                                </h3>
                            </div>
                            <div className="text-left sm:text-right shrink-0 bg-bg-deep/50 border border-border-thin px-4 py-2 rounded-xl">
                                <span className="text-[8px] font-medium uppercase text-text-dim block tracking-wider">Cumplimiento Global</span>
                                <span className={`text-2xl font-medium font-mono ${progressColor}`}>{selectedInd.progress}%</span>
                            </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            {selectedInd.description}
                        </p>

                        {/* Gráfico SVG de Cumplimiento */}
                        <div className="p-5 bg-bg-deep/30 border border-border-thin/40 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 select-none animate-fade-up">
                            {/* SVG Circular de Cumplimiento */}
                            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        className="fill-none"
                                        stroke="var(--border)"
                                        strokeWidth="2.5"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        className="fill-none transition-all duration-1000"
                                        stroke={strokeColor}
                                        strokeWidth="3.2"
                                        strokeDasharray={`${selectedInd.progress} ${100 - selectedInd.progress}`}
                                        strokeDashoffset="0"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-[26px] font-medium text-text-main font-mono leading-none">
                                        {selectedInd.progress}%
                                    </span>
                                    <span className="text-[8px] font-medium text-text-dim uppercase tracking-wider mt-1.5">
                                        META INSTITUCIONAL
                                    </span>
                                </div>
                            </div>

                            {/* Resumen de Métrica */}
                            <div className="space-y-4 max-w-sm w-full font-sans">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-medium text-text-dim uppercase tracking-wider block">Estado de Auditoría</span>
                                    <p className="text-xs text-text-main font-medium leading-normal">
                                        {selectedInd.metaLabel}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-medium text-text-dim uppercase tracking-wider block">Estadística de Respaldo</span>
                                    <p className="text-xs text-text-main font-medium leading-normal">
                                        {selectedInd.currentLabel}
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-border-thin flex justify-between items-center text-[10px] font-mono font-medium text-text-dim">
                                    <span>Total Proyectos Evaluados</span>
                                    <span className="text-text-main">{totalCount}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Fila Inferior: 3 Columnas Semánticas */}
            <div className="space-y-3 mt-6 select-none animate-fade-up [animation-delay:150ms]">
                <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim pl-1 font-mono block">
                    Clasificación y Distribución del Portafolio de Proyectos
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Columna 1: Critico / Poor */}
                    <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-error/5 select-none">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-error" />
                                <span className="text-[10px] font-medium text-error uppercase tracking-wider">Crítico / Alerta</span>
                            </div>
                            <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                {poor.length}
                            </span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                            {poor.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                    <p className="text-[10px] text-text-dim italic">No hay proyectos en estado crítico para esta métrica.</p>
                                </div>
                            ) : (
                                poor.map(p => (
                                    <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                        <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                            {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                        </span>
                                        <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                            {p.titulo}
                                        </p>
                                        <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                            <span>{p.carrera || 'Tecnología'}</span>
                                            <span className="text-error">{p.estado}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Columna 2: En Progreso / Warning */}
                    <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-warning/5 select-none">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-warning" />
                                <span className="text-[10px] font-medium text-warning uppercase tracking-wider">En Progreso</span>
                            </div>
                            <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                {warning.length}
                            </span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                            {warning.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                    <p className="text-[10px] text-text-dim italic">No hay proyectos intermedios registrados.</p>
                                </div>
                            ) : (
                                warning.map(p => (
                                    <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                        <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                            {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                        </span>
                                        <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                            {p.titulo}
                                        </p>
                                        <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                            <span>{p.carrera || 'Tecnología'}</span>
                                            <span className="text-warning">{p.estado}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Columna 3: Excelente / Great */}
                    <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-success/5 select-none">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-success" />
                                <span className="text-[10px] font-medium text-success uppercase tracking-wider">Excelente</span>
                            </div>
                            <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                {great.length}
                            </span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                            {great.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                    <p className="text-[10px] text-text-dim italic">Ningún proyecto ha alcanzado la excelencia para esta métrica aún.</p>
                                </div>
                            ) : (
                                great.map(p => (
                                    <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                        <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                            {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                        </span>
                                        <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                            {p.titulo}
                                        </p>
                                        <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                            <span>{p.carrera || 'Tecnología'}</span>
                                            <span className="text-success">{p.estado}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
