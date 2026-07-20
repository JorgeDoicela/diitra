import React from 'react';
import { Filter, Clock, Building2 } from 'lucide-react';

export interface AnalyticsFiltersProps {
    period: string;
    setPeriod: (p: string) => void;
    carrera: string;
    setCarrera: (c: string) => void;
    dbPeriods: string[];
    dbCareers: string[];
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
    period,
    setPeriod,
    carrera,
    setCarrera,
    dbPeriods,
    dbCareers
}) => {
    return (
        <div className="bento-card static p-4 flex flex-wrap items-center justify-between gap-4 bg-surface/40 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <Filter size={13} className="text-text-dim" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-main">Variables de Corte:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                {/* Select Periodo */}
                <div className="relative group">
                    <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="input-vercel !pl-8 !pr-7 !py-1.5 text-[10px] font-black uppercase tracking-wider bg-bg-deep cursor-pointer focus:border-text-main"
                        id="period-filter-select"
                    >
                        <option value="TODOS">Todos los Periodos</option>
                        {dbPeriods.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* Select Carrera */}
                <div className="relative group">
                    <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <select
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value)}
                        className="input-vercel !pl-8 !pr-7 !py-1.5 text-[10px] font-black uppercase tracking-wider bg-bg-deep cursor-pointer focus:border-text-main"
                        id="carrera-filter-select"
                    >
                        <option value="TODAS">Todas las Tecnologías</option>
                        {dbCareers.map((c, idx) => (
                            <option key={idx} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
