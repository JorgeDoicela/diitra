import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TimelineSectionProps {
    cronograma: any[];
    cowork: CoWorkHandle;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    readOnly?: boolean;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
    cronograma,
    cowork,
    onAdd,
    onRemove,
    onUpdate,
    readOnly = false
}) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={18}/> 7. Cronograma de Actividades
                </h4>
                {!readOnly && (
                    <button 
                        onClick={onAdd} 
                        className="px-5 py-2.5 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 shadow-lg"
                    >
                        + Nueva Actividad
                    </button>
                )}
            </div>
            <div className="space-y-6">
                {cronograma.map((_c, i) => (
                    <div key={_c.id || _c.uuid || i} className="p-6 bg-bg-deep border border-border-thin rounded-2xl flex flex-col gap-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-6 items-end">
                            <div className="flex-1 w-full">
                                <CoWorkField 
                                    name={`Cron_${_c.id || i}_act`} 
                                    cowork={cowork} 
                                    label="Actividad"
                                    onValueChange={(v) => onUpdate(i, 'Actividad', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs font-bold"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="w-full sm:w-24">
                                <CoWorkField 
                                    name={`Cron_${_c.id || i}_num`} 
                                    cowork={cowork} 
                                    label="Orden"
                                    onValueChange={(v) => onUpdate(i, 'Numero', parseInt(v) || 0)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <CoWorkField 
                                    name={`Cron_${_c.id || i}_rec`} 
                                    cowork={cowork} 
                                    label="Recursos"
                                    onValueChange={(v) => onUpdate(i, 'RecursosNecesarios', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                                    readOnly={readOnly}
                                />
                            </div>
                            {!readOnly && (
                                <button 
                                    onClick={() => onRemove(i)} 
                                    className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 self-center sm:self-end"
                                    title="Eliminar Actividad"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>

                        {/* Gantt Weeks Grid */}
                        <div className="border-t border-border-thin pt-4">
                            <div className="text-[9px] font-black text-text-dim uppercase tracking-wider mb-3">
                                Cronograma Semanal (Gantt - 12 Semanas)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[0, 1, 2].map((mIdx) => (
                                    <div key={mIdx} className="bg-bg-deep/40 rounded-xl p-3 border border-border-thin">
                                        <div className="text-[8px] font-black text-text-dim uppercase tracking-widest mb-2.5 text-center border-b border-border-thin/60 pb-1">
                                            Mes {mIdx + 1}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {[0, 1, 2, 3].map((wIdx) => {
                                                const weekNum = mIdx * 4 + wIdx;
                                                return (
                                                    <div key={weekNum} className="flex flex-col items-center gap-1">
                                                        <span className="text-[8px] font-bold text-text-dim">S{weekNum + 1}</span>
                                                        <CoWorkField
                                                            name={`Cron_${_c.id || i}_sem_${weekNum}`}
                                                            cowork={cowork}
                                                            type="checkbox"
                                                            onValueChange={(val) => {
                                                                const currentSemanas = _c.Semanas || Array(12).fill(false);
                                                                const updated = [...currentSemanas];
                                                                while (updated.length < 12) updated.push(false);
                                                                updated[weekNum] = val === 'true' || val === true;
                                                                onUpdate(i, 'Semanas', updated);
                                                            }}
                                                            readOnly={readOnly}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
