import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TeamSectionProps {
    investigadores: any[];
    cowork: CoWorkHandle;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
    investigadores,
    cowork,
    onAdd,
    onRemove,
    onUpdate
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Users size={18}/> 2. Investigadores (Docentes y Estudiantes)
                </h4>
                <button 
                    onClick={onAdd} 
                    className="px-5 py-2.5 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 shadow-lg"
                >
                    <Plus size={16}/> Añadir Investigador
                </button>
            </div>
            <div className="space-y-4">
                {investigadores.map((_inv, idx) => (
                    <div key={_inv.id || idx} className="p-8 bg-bg-deep border border-border-thin rounded-3xl shadow-sm animate-fade-in relative">
                        <button 
                            onClick={() => onRemove(idx)} 
                            className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                        >
                            <Trash2 size={18}/>
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                            <div className="md:col-span-5">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_nombre`} 
                                    cowork={cowork} 
                                    label="Nombre y Apellidos"
                                    onValueChange={(v) => onUpdate(idx, 'Nombre', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_cedula`} 
                                    cowork={cowork} 
                                    label="Cédula"
                                    onValueChange={(v) => onUpdate(idx, 'Cedula', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_email`} 
                                    cowork={cowork} 
                                    label="Email"
                                    onValueChange={(v) => onUpdate(idx, 'Email', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_telefono`} 
                                    cowork={cowork} 
                                    label="Teléfono"
                                    onValueChange={(v) => onUpdate(idx, 'Telefono', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_nivel`} 
                                    cowork={cowork} 
                                    label="Nivel Académico"
                                    onValueChange={(v) => onUpdate(idx, 'NivelAcademico', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    placeholder="Ej: Magíster en..."
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_rol`} 
                                    cowork={cowork} 
                                    label="Rol"
                                    onValueChange={(v) => onUpdate(idx, 'Rol', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_horas`} 
                                    cowork={cowork} 
                                    label="Horas Semanales"
                                    onValueChange={(v) => onUpdate(idx, 'HorasSemanales', v ? parseFloat(v) : null)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    placeholder="Ej: 12"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
