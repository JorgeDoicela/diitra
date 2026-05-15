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
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
    cronograma,
    cowork,
    onAdd,
    onRemove,
    onUpdate
}) => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={18}/> 7. Cronograma de Actividades
                </h4>
                <button 
                    onClick={onAdd} 
                    className="px-5 py-2.5 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                    + Nueva Actividad
                </button>
            </div>
            <div className="space-y-4">
                {cronograma.map((_c, i) => (
                    <div key={i} className="p-6 bg-surface border border-border-thin rounded-2xl flex gap-6 items-end shadow-sm">
                        <div className="flex-1">
                            <CoWorkField 
                                name={`Cron_${i}_act`} 
                                cowork={cowork} 
                                label="Actividad"
                                onValueChange={(v) => onUpdate(i, 'Actividad', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs font-bold"
                            />
                        </div>
                        <div className="w-24">
                            <CoWorkField 
                                name={`Cron_${i}_num`} 
                                cowork={cowork} 
                                label="Orden"
                                onValueChange={(v) => onUpdate(i, 'Numero', parseInt(v) || 0)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                            />
                        </div>
                        <div className="w-48">
                            <CoWorkField 
                                name={`Cron_${i}_rec`} 
                                cowork={cowork} 
                                label="Recursos"
                                onValueChange={(v) => onUpdate(i, 'RecursosNecesarios', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                            />
                        </div>
                        <button 
                            onClick={() => onRemove(i)} 
                            className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
