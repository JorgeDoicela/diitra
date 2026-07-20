import React from 'react';
import { Calendar, AlertCircle, Copy, Plus } from 'lucide-react';

interface TimelineHeaderProps {
    projectStartDate: Date | null;
    projectEndDate: Date | null;
    durationText: string;
    activeTab: 'gantt' | 'cards' | 'calendar';
    setActiveTab: (tab: 'gantt' | 'cards' | 'calendar') => void;
    cronogramaCount: number;
    readOnly: boolean;
    onLoadSuggested: () => void;
    onAdd: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
    projectStartDate,
    projectEndDate,
    durationText,
    activeTab,
    setActiveTab,
    cronogramaCount,
    readOnly,
    onLoadSuggested,
    onAdd
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-bg-deep/40 p-5 border border-border-thin rounded-2xl">
            <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
                    <Calendar size={18} /> 7. Planificación y Cronograma
                </h4>
                <p className="text-[10px] text-text-dim leading-relaxed">
                    Administra las etapas de tu proyecto. 
                    {projectStartDate && projectEndDate ? (
                        <span className="text-emerald-500 font-bold block mt-0.5">
                            {durationText}
                        </span>
                    ) : (
                        <span className="text-amber-500 font-bold block mt-0.5 flex items-center gap-1">
                            <AlertCircle size={11} /> Configura la duración del proyecto en "Identificación" para activar el mapeo en calendario.
                        </span>
                    )}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
                {/* Selectores de vista */}
                <div className="flex bg-bg-deep border border-border-thin p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('gantt')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'gantt' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Vista Gantt
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'calendar' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Calendario
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'cards' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Detalle ({cronogramaCount})
                    </button>
                </div>

                {cronogramaCount === 0 && (
                    <button
                        onClick={onLoadSuggested}
                        className="px-3.5 py-2 border border-border-thin hover:bg-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 text-text-dim hover:text-text-main"
                    >
                        <Copy size={11}/> Sugerido CACES
                    </button>
                )}
                {!readOnly && (
                    <button 
                        onClick={onAdd} 
                        className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow flex items-center gap-1.5"
                    >
                        <Plus size={11}/> Nueva Actividad
                    </button>
                )}
            </div>
        </div>
    );
};
