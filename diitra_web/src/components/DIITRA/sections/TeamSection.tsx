import React from 'react';
import { Users } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TeamSectionProps {
    investigadores: any[];
    cowork: CoWorkHandle;
    onUpdate: (index: number, field: string, value: any) => void;
    formData?: any;
    readOnly?: boolean;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
    investigadores,
    cowork,
    onUpdate,
    formData,
    readOnly = false
}) => {
    const isAssociative = formData?.GrupoInvestigacionTipo === 'SI';
    return (
        <div className="space-y-6">
            {isAssociative && (
                <div className="mb-6 p-5 rounded-xl bg-warning/5 border border-warning/20 flex gap-4 animate-fade-in relative overflow-hidden">
                    <div className="icon-circle shrink-0 !p-3 bg-warning/10 border border-warning/20 flex items-center justify-center rounded-lg">
                        <Users size={18} className="text-warning" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-warning uppercase tracking-widest">
                            Integrantes Vinculados al Grupo de Investigación
                        </h4>
                        <p className="text-xs text-text-dim mt-2 leading-relaxed max-w-3xl font-medium">
                            Este proyecto está asociado a un Grupo de Investigación. Los integrantes y sus roles oficiales se sincronizan automáticamente desde la nómina del grupo aprobada en la administración central. Las altas, bajas y modificaciones de integrantes deben gestionarse a través del director del grupo en la pantalla de <strong>Grupos de Investigación</strong>. Solo se permite registrar las horas semanales de dedicación asignadas para este proyecto.
                        </p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Users size={18}/> 2. Investigadores (Docentes y Estudiantes)
                </h4>
            </div>
            <div className="space-y-4">
                {investigadores.map((_inv, idx) => (
                    <div key={_inv.id || idx} className="p-8 bg-bg-deep border border-border-thin rounded-3xl shadow-sm animate-fade-in relative">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                            <div className="md:col-span-5">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_nombre`} 
                                    cowork={cowork} 
                                    label="Nombre y Apellidos"
                                    onValueChange={(v) => onUpdate(idx, 'Nombre', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold"
                                    readOnly={true}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_cedula`} 
                                    cowork={cowork} 
                                    label="Cédula"
                                    onValueChange={(v) => onUpdate(idx, 'Cedula', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    readOnly={true}
                                />
                            </div>
                            <div className="md:col-span-4">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_email`} 
                                    cowork={cowork} 
                                    label="Email"
                                    onValueChange={(v) => onUpdate(idx, 'Email', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    readOnly={true}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_telefono`} 
                                    cowork={cowork} 
                                    label="Teléfono"
                                    onValueChange={(v) => onUpdate(idx, 'Telefono', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    readOnly={readOnly}
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
                                    readOnly={true}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CoWorkField 
                                    name={`Inv_${_inv.id || idx}_rol`} 
                                    cowork={cowork} 
                                    label="Rol"
                                    onValueChange={(v) => onUpdate(idx, 'Rol', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                    readOnly={true}
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
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
