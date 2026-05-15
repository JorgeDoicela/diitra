import React from 'react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface GeneralSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    convocatorias: any[];
    carreras: any[];
    onUpdate: (field: string, value: any) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
    formData,
    cowork,
    convocatorias,
    carreras,
    onUpdate
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-8">
                <CoWorkField 
                    name="Titulo" 
                    cowork={cowork} 
                    label="Título del Proyecto" 
                    onValueChange={(v) => onUpdate('Titulo', v)}
                    className="w-full bg-bg-deep border border-border-thin rounded-2xl px-8 py-6 text-xl font-black text-text-main placeholder:text-text-dim/30" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Carrera / Unidad</label>
                    <select 
                        value={formData.IdCarrera || 0}
                        onChange={(e) => onUpdate('IdCarrera', Number(e.target.value))}
                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm text-text-main outline-none"
                    >
                        <option value={0}>Seleccione una carrera...</option>
                        {carreras.map(c => (
                            <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2">Convocatoria</label>
                    <select 
                        value={formData.IdConvocatoria || 0}
                        onChange={(e) => onUpdate('IdConvocatoria', Number(e.target.value))}
                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm text-text-main outline-none"
                    >
                        <option value={0}>Seleccione una convocatoria...</option>
                        {convocatorias.map(c => (
                            <option key={c.id_convocatoria} value={c.id_convocatoria}>{c.codigo_convocatoria} - {c.titulo}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CoWorkField 
                    name="Periodo" 
                    cowork={cowork} 
                    label="Periodo Académico" 
                    onValueChange={(v) => onUpdate('Periodo', v)}
                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                />
                <CoWorkField 
                    name="TiempoEjecucion" 
                    cowork={cowork} 
                    label="Tiempo Estimado (Meses)" 
                    onValueChange={(v) => onUpdate('TiempoEjecucion', v)}
                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                />
            </div>
        </div>
    );
};
