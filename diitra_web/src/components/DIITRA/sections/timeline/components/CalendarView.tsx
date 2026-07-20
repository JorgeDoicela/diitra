import React from 'react';
import { CalendarDays } from 'lucide-react';

interface CalendarViewProps {
    cronograma: any[];
    months: { name: string; year: number; weeksCount: number; weekOffset: number }[];
    setActiveTab: (tab: 'gantt' | 'cards' | 'calendar') => void;
    setExpandedCard: (idx: number | null) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    cronograma,
    months,
    setActiveTab,
    setExpandedCard
}) => {
    return (
        <div className="bg-bg-deep border border-border-thin rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border-thin/60 pb-3">
                <CalendarDays size={16} className="text-text-main" />
                <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Agenda y Hitos Mensuales</h5>
            </div>

            {cronograma.length === 0 ? (
                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-xl">
                    No hay actividades para estructurar en el calendario.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {months.map((m, mIdx) => {
                        const startWeekIndex = m.weekOffset;

                        return (
                            <div key={mIdx} className="bg-bg-deep/40 border border-border-thin rounded-xl p-4.5 space-y-3.5 hover:border-border-thin/80 transition-colors">
                                <div className="text-xs font-bold text-text-main uppercase tracking-widest border-b border-border-thin/50 pb-2 flex justify-between items-center">
                                    <span>{m.name}</span>
                                    <span className="opacity-50 text-[10px]">{m.year}</span>
                                </div>

                                <div className="space-y-3.5 text-xs">
                                    {Array.from({ length: m.weeksCount }).map((_, wOffset) => {
                                        const currentWeekNum = startWeekIndex + wOffset;
                                        const activeActs = cronograma.filter(c => c.Semanas?.[currentWeekNum] === true);

                                        return (
                                            <div key={wOffset} className="space-y-1.5">
                                                <div className="text-[9.5px] font-bold text-text-dim uppercase tracking-wider">
                                                    Semana {currentWeekNum + 1}
                                                </div>
                                                {activeActs.length === 0 ? (
                                                    <div className="text-[9.5px] italic text-text-dim/60 pl-2">Sin actividad</div>
                                                ) : (
                                                    <div className="space-y-1.5 pl-1">
                                                        {activeActs.map((act, actIdx) => {
                                                            const idx = cronograma.indexOf(act);
                                                            return (
                                                                <div 
                                                                    key={actIdx}
                                                                    onClick={() => {
                                                                        setActiveTab('cards');
                                                                        setExpandedCard(idx);
                                                                    }}
                                                                    className="bg-bg-deep hover:bg-bg-deep/80 border border-border-thin px-2.5 py-2 rounded-md text-[11px] flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                                                                >
                                                                    <div className="truncate flex items-center gap-1.5 font-semibold text-text-main">
                                                                        <div 
                                                                            className="w-1.5 h-3 rounded-full shrink-0" 
                                                                            style={{ backgroundColor: act.colorHex || '#0070f3' }} 
                                                                        />
                                                                        <span className="font-mono text-[10px] font-bold text-text-dim">
                                                                            {String(act.Numero || (idx + 1)).padStart(2, '0')}.
                                                                        </span>
                                                                        <span className="truncate">{act.Actividad}</span>
                                                                    </div>
                                                                    {act.Responsable && (
                                                                        <span className="text-[9px] text-text-dim font-bold shrink-0 bg-bg-deep/50 px-1.5 py-0.5 rounded border border-border-thin">
                                                                            {act.Responsable.split(' ')[0]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
