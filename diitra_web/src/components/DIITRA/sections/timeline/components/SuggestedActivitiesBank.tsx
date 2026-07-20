import React from 'react';
import { Compass, Plus, Move } from 'lucide-react';

interface SuggestedActivitiesBankProps {
    readOnly: boolean;
    suggestedCatalog: any[];
    onAddSuggestedActivity: (item: any) => void;
}

export const SuggestedActivitiesBank: React.FC<SuggestedActivitiesBankProps> = ({
    readOnly,
    suggestedCatalog,
    onAddSuggestedActivity
}) => {
    return (
        <div className="bg-bg-deep/70 border border-border-thin rounded-2xl p-4.5 space-y-4.5 sticky top-4">
            <div className="flex items-center gap-2 border-b border-border-thin/60 pb-2.5">
                <Compass size={15} className="text-text-main" />
                <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Banco de Actividades</h5>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
                Arrastra estas actividades sugeridas por la SENESCYT/CACES y suéltalas directamente sobre la grilla Gantt o la lista de tareas.
            </p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {suggestedCatalog.map((item, idx) => (
                    <div
                        key={idx}
                        draggable={!readOnly}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('suggested_activity', JSON.stringify(item));
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="p-4 bg-bg-deep border border-border-thin/80 hover:border-text-main/40 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:shadow relative group select-none"
                    >
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                            <div className="flex items-start gap-2 min-w-0">
                                <div 
                                    className="w-1.5 h-3.5 rounded-full shrink-0 mt-0.5" 
                                    style={{ backgroundColor: item.colorHex }} 
                                />
                                <span className="text-[12.5px] font-bold text-text-main leading-snug whitespace-normal pr-1">{item.Actividad}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddSuggestedActivity(item);
                                        }}
                                        className="p-1 hover:bg-bg-deep-hover hover:text-text-main rounded-md text-text-dim transition-colors cursor-pointer"
                                        title="Agregar actividad al cronograma"
                                    >
                                        <Plus size={13} />
                                    </button>
                                )}
                                <Move size={13} className="text-text-dim opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <p className="text-[11px] text-text-dim/80 leading-relaxed mt-2">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
