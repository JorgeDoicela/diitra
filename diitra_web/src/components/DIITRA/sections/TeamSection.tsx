import React from 'react';
import { Users } from 'lucide-react';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TeamSectionProps {
    investigadores: any[];
    cowork: CoWorkHandle;
    onUpdateItem?: (listName: string, index: number, field: string, value: any) => void;
    formData?: any;
    readOnly?: boolean;
    carreras?: any[];
    investigadoresReales?: any[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({
    investigadores,
    formData,
    onUpdateItem,
    readOnly = false,
    carreras = [],
    investigadoresReales = []
}) => {
    const isAssociative = formData?.GrupoInvestigacionTipo === 'SI';
    const repairedCedulasRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        if (readOnly || !onUpdateItem || !investigadores || !investigadoresReales || investigadores.length === 0) return;

        investigadores.forEach((inv, idx) => {
            const invCedula = inv.Cedula || inv.cedula;
            if (!invCedula) return;

            const cedKey = invCedula.trim().toLowerCase();
            if (repairedCedulasRef.current.has(cedKey)) return;

            const realInv = investigadoresReales.find(ri => {
                const riCedula = ri.Cedula || ri.cedula;
                return riCedula && riCedula.trim().toLowerCase() === cedKey;
            });
            if (realInv) {
                const invCarrera = inv.Carrera || inv.carrera || '';
                const realCarrera = realInv.Carrera || realInv.carrera || '';
                const realDisponibles = realInv.CarrerasDisponibles || realInv.carrerasDisponibles || '';
                const invDisponibles = inv.CarrerasDisponibles || inv.carrerasDisponibles || '';

                const isGeneric = !invCarrera || 
                                  invCarrera.trim() === '' || 
                                  invCarrera.trim() === 'Docente' || 
                                  invCarrera.trim() === 'Estudiante';
                
                const hasRealCareer = realCarrera && 
                                      realCarrera.trim() !== '' && 
                                      realCarrera.trim() !== 'Docente' && 
                                      realCarrera.trim() !== 'Estudiante';

                if (isGeneric && hasRealCareer) {
                    console.log(`[DIITRA CoWork Auto-Repair] Reparando carrera de ${(inv.Nombre || inv.nombre)} a: ${realCarrera}`);
                    repairedCedulasRef.current.add(cedKey);
                    onUpdateItem('Investigadores', idx, 'Carrera', realCarrera);
                }

                if (realDisponibles && invDisponibles !== realDisponibles) {
                    repairedCedulasRef.current.add(cedKey);
                    onUpdateItem('Investigadores', idx, 'CarrerasDisponibles', realDisponibles);
                }
            }
        });
    }, [investigadores, investigadoresReales, onUpdateItem, readOnly]);

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
                    <Users size={18} /> 2. Investigadores (Docentes y Estudiantes)
                </h4>
            </div>
            <div className="space-y-4">
                {investigadores.map((_inv, idx) => (
                    <div key={_inv.id || idx} className="p-8 bg-bg-deep border border-border-thin rounded-3xl shadow-sm animate-fade-in relative">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                            <div className="md:col-span-5">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold text-text-main"
                                    value={_inv.Nombre || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Nombre y Apellidos
                                </label>
                            </div>
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.Cedula || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Cédula
                                </label>
                            </div>
                            <div className="md:col-span-4">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.Email || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Email
                                </label>
                            </div>
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.Telefono || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Teléfono
                                </label>
                            </div>
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.NivelAcademico || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Nivel Académico
                                </label>
                            </div>
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.Rol || ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Rol
                                </label>
                            </div>
                            <div className="md:col-span-3">
                                <input
                                    type="text"
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main"
                                    value={_inv.HorasSemanales !== undefined && _inv.HorasSemanales !== null ? String(_inv.HorasSemanales) : ''}
                                    readOnly={true}
                                />
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                    Horas Semanales
                                </label>
                            </div>
                            <div className="md:col-span-12 mt-2.5 pt-4 border-t border-border-thin/40">
                                {(() => {
                                    const invCarrera = _inv.Carrera || _inv.carrera || '';
                                    const invDisponibles = _inv.CarrerasDisponibles || _inv.carrerasDisponibles || '';
                                    const rawCareers = invDisponibles || invCarrera || '';
                                    const cleanOptions = rawCareers.split(',')
                                        .map((s: string) => s.trim())
                                        .filter((s: string) => s.length > 0 && s !== 'Docente' && s !== 'Estudiante');

                                    const isStudent = (_inv.Rol || _inv.rol)?.toLowerCase().includes('semillerista') ||
                                        (_inv.Rol || _inv.rol)?.toLowerCase().includes('estudiante') ||
                                        (_inv.Rol || _inv.rol)?.toLowerCase().includes('alumno') ||
                                        (_inv.NivelAcademico || _inv.nivelAcademico) === 'Pregrado';

                                    if (cleanOptions.length === 0) {
                                        return (
                                            <div className="flex flex-col gap-2 animate-fade-in">
                                                <span className="text-[10px] font-black text-warning uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                                    Alerta: No se encontraron carreras pre-cargadas para este {isStudent ? 'estudiante' : 'docente'}. Selecciónala manualmente:
                                                </span>
                                                <select
                                                    value={invCarrera}
                                                    onChange={(e) => onUpdateItem?.('Investigadores', idx, 'Carrera', e.target.value)}
                                                    disabled={readOnly}
                                                    className="w-full max-w-md bg-bg-deep border border-warning/50 rounded-xl px-4 py-3 text-xs font-bold text-text-main outline-none focus:border-warning"
                                                >
                                                    <option value="">Seleccione una carrera...</option>
                                                    {carreras.map(c => {
                                                        const cid = c.id_carrera ?? c.idCarrera ?? 0;
                                                        const cname = c.nombre_carrera ?? c.carrera1 ?? c.carrera ?? 'Sin Nombre';
                                                        return (
                                                            <option key={cid} value={cname}>{cname}</option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        );
                                    }

                                    if (cleanOptions.length > 1) {
                                        const isAlreadySelected = cleanOptions.includes(invCarrera);
                                        const currentValue = isAlreadySelected ? invCarrera : '';

                                        return (
                                            <div className="flex flex-col gap-2 animate-fade-in">
                                                <span className="text-[10px] font-black text-warning uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                                    Alerta: Este integrante pertenece a múltiples carreras. Debes elegir a qué carrera estará asociada la persona para este proyecto:
                                                </span>
                                                <select
                                                    value={currentValue}
                                                    onChange={(e) => onUpdateItem?.('Investigadores', idx, 'Carrera', e.target.value)}
                                                    disabled={readOnly}
                                                    className="w-full max-w-md bg-bg-deep border border-warning/50 rounded-xl px-4 py-3 text-xs font-bold text-text-main outline-none focus:border-warning"
                                                >
                                                    <option value="">Seleccione una carrera...</option>
                                                    {cleanOptions.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    }

                                    const fallbackLabel = isStudent ? 'Estudiante' : 'Docente';
                                    return (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-text-dim uppercase tracking-widest px-2">
                                                Carrera / Unidad de Asociación
                                            </span>
                                            <span className="text-xs font-bold text-brand-light px-2 mt-0.5">
                                                {invCarrera || fallbackLabel}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
