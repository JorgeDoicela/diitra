import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Trash2, ShieldCheck, Award, AlertCircle, ChevronRight } from 'lucide-react';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { MemberSearchSelector, type SelectedMemberResult, formatNombre } from '../../Common/MemberSearchSelector';
import { GeistSelect } from '../../Common/GeistSelect';
import { useDocenteDistributivo, isStudentMember } from './hooks/useDocenteDistributivo';

interface TeamSectionProps {
    investigadores: any[];
    cowork: CoWorkHandle;
    onAdd?: (tpl?: any) => void;
    onRemove?: (index: number) => void;
    onUpdate?: (index: number, field: string, value: any) => void;
    onUpdateItem?: (listName: string, index: number, field: string, value: any) => void;
    formData?: any;
    readOnly?: boolean;
    carreras?: any[];
    investigadoresReales?: any[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({
    investigadores = [],
    formData,
    onAdd,
    onRemove,
    onUpdate,
    onUpdateItem,
    readOnly = false,
    carreras: _carreras = [],
    investigadoresReales = []
}) => {
    const isAssociative = formData?.GrupoInvestigacionTipo === 'SI';
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const repairedCedulasRef = useRef<Set<string>>(new Set());

    // Hook desacoplado de lógica y sincronización de distributivo SIGAFI
    const {
        metricsByCedula,
        hasAnyExceededDocente,
        docentesConExcesoCount,
        registerMemberHours
    } = useDocenteDistributivo(investigadores, isAssociative, investigadoresReales);

    const updateMemberField = (idx: number, field: string, value: any) => {
        if (onUpdate) {
            onUpdate(idx, field, value);
        } else if (onUpdateItem) {
            onUpdateItem('Investigadores', idx, field, value);
        }
    };

    // Auto-reparación de carreras disponibles
    useEffect(() => {
        if (readOnly || (!onUpdateItem && !onUpdate) || !investigadores || !investigadoresReales || investigadores.length === 0) return;

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
                    repairedCedulasRef.current.add(cedKey);
                    updateMemberField(idx, 'Carrera', realCarrera);
                }

                if (realDisponibles && invDisponibles !== realDisponibles) {
                    repairedCedulasRef.current.add(cedKey);
                    updateMemberField(idx, 'CarrerasDisponibles', realDisponibles);
                }
            }
        });
    }, [investigadores, investigadoresReales, onUpdateItem, onUpdate, readOnly]);

    const handleAddMemberFromSearch = (member: SelectedMemberResult) => {
        if (!member) return;
        const cedula = (member.cedula || '').trim();
        
        // Evitar duplicados
        const alreadyExists = investigadores.some(inv => {
            const c = (inv.Cedula || inv.cedula || '').trim();
            return c && c.toLowerCase() === cedula.toLowerCase();
        });

        if (alreadyExists) {
            alert('Esta persona ya se encuentra registrada en el equipo de este proyecto.');
            return;
        }

        const isStudent = member.tipo === 'ESTUDIANTE';
        const defaultRole = member.rol || (isStudent ? 'Semillerista' : 'Co-Investigador');
        const defaultNivel = isStudent ? 'Pregrado' : 'Tercer Nivel';

        const newInvestigador = {
            Nombre: formatNombre(member.nombre_completo),
            Cedula: cedula,
            Email: member.email || '',
            Telefono: member.telefono || '',
            NivelAcademico: defaultNivel,
            Rol: defaultRole,
            HorasSemanales: member.horas_investigacion ?? (isStudent ? 0 : 5),
            HorasDisponibles: member.horas_investigacion ?? 0,
            HorasAsignadas: member.horas_asignadas ?? 0,
            Carrera: member.carrera || '',
            CarrerasDisponibles: member.carrera || '',
            Activo: true,
            EsDirector: false
        };

        if (!isStudent && cedula) {
            registerMemberHours(
                cedula,
                Number(member.horas_investigacion ?? 0),
                Number(member.horas_asignadas ?? 0)
            );
        }

        if (onAdd) {
            onAdd(newInvestigador);
        } else if (onUpdateItem) {
            onUpdateItem('Investigadores', investigadores.length, '', newInvestigador);
        }
        setIsAddModalOpen(false);
    };

    const existingCedulas = useMemo(() => {
        return investigadores
            .map(i => (i.Cedula || i.cedula || '').trim())
            .filter(Boolean);
    }, [investigadores]);

    const allowedTypes = useMemo<('DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO')[]>(() => {
        return !isAssociative 
            ? ['DOCENTE', 'ESTUDIANTE'] 
            : ['DOCENTE', 'ADMINISTRATIVO', 'ESTUDIANTE', 'EXTERNO'];
    }, [isAssociative]);

    return (
        <div className="space-y-6">
            {/* Callout para Proyectos Adscritos a Grupo de Investigación si aplica */}
            {isAssociative && (
                <div className="callout-vercel callout-vercel-warning mb-6 animate-fade-in">
                    <Award size={16} className="text-warning mt-0.5 shrink-0" />
                    <div>
                        <p className="callout-vercel-title">Proyecto Adscrito a Grupo de Investigación Institucional</p>
                        <p className="callout-vercel-body">
                            Los integrantes y sus roles oficiales se sincronizan automáticamente desde la nómina del <strong>Grupo de Investigación</strong> aprobado. Las altas y bajas se gestionan en el módulo de Grupos. En esta sección puedes registrar las <strong>horas semanales de dedicación</strong> asignadas para este proyecto.
                        </p>
                    </div>
                </div>
            )}

            {/* Banner reactivo si algún docente excede su distributivo SIGAFI */}
            {hasAnyExceededDocente && (
                <div className="p-3.5 bg-error/10 border border-error/30 rounded-2xl flex items-center justify-between text-xs text-error font-medium animate-fade-in">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={15} className="shrink-0 text-error" />
                        <span>
                            {docentesConExcesoCount === 1
                                ? 'Un docente investigador excede las horas disponibles en su distributivo académico de SIGAFI.'
                                : `${docentesConExcesoCount} docentes investigadores exceden las horas disponibles en su distributivo académico de SIGAFI.`}
                        </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-error/90 bg-error/15 px-2 py-0.5 rounded-md">
                        Límite Excedido
                    </span>
                </div>
            )}

            {/* Cabecera de la Sección */}
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
                    <Users size={18} /> 2. Investigadores (Docentes y Estudiantes)
                </h4>
                {!isAssociative && !readOnly && (
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <UserPlus size={13} />
                        <span>Añadir Integrante</span>
                    </button>
                )}
            </div>

            {/* Lista de Tarjetas de Investigadores en estilo DIITRA Formato 1 */}
            <div className="space-y-4">
                {investigadores.length === 0 ? (
                    <div className="p-8 bg-bg-deep border border-dashed border-border-thin rounded-3xl text-center text-text-dim">
                        <Users size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-medium">No se han registrado integrantes en el equipo del proyecto.</p>
                        {!readOnly && !isAssociative && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-4 btn-vercel-secondary"
                            >
                                <UserPlus size={14} />
                                <span>Añadir Primer Integrante</span>
                            </button>
                        )}
                    </div>
                ) : (
                    investigadores.map((_inv, idx) => {
                        const rol = _inv.Rol || _inv.rol || 'Co-Investigador';
                        const isDirector = _inv.EsDirector || _inv.esDirector || rol.toLowerCase().includes('director');
                        const isStudent = isStudentMember(_inv);
                        const cedKey = (_inv.Cedula || _inv.cedula || '').trim().toLowerCase();

                        const metrics = metricsByCedula[cedKey] || {
                            horasDisponibles: 0,
                            horasAsignadasOtros: 0,
                            cupoLibre: 0,
                            hasNoDistributivo: false,
                            isInvalidHours: false,
                            excesoHoras: 0
                        };

                        const {
                            horasDisponibles,
                            horasAsignadasOtros,
                            cupoLibre,
                            hasNoDistributivo,
                            isInvalidHours,
                            excesoHoras
                        } = metrics;

                        return (
                            <div
                                key={_inv.id || _inv.Cedula || idx}
                                className={`p-8 bg-bg-deep border ${isInvalidHours ? 'border-error/70 ring-1 ring-error/20' : 'border-border-thin'} rounded-3xl shadow-sm animate-fade-in relative`}
                            >
                                {/* Header del Integrante dentro de la tarjeta */}
                                <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-thin/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-xs font-bold text-text-main uppercase">
                                            {(_inv.Nombre || 'IN').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-main">
                                                {_inv.Nombre || 'Sin nombre'}
                                            </span>
                                            {isDirector && (
                                                <span className="badge-vercel badge-vercel-brand text-[9px] font-bold flex items-center gap-1">
                                                    <ShieldCheck size={10} /> Director
                                                </span>
                                            )}
                                            {isStudent && !isDirector && (
                                                <span className="badge-vercel badge-vercel-success text-[9px] font-bold">
                                                    Semillero
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {!readOnly && !isAssociative && !isDirector && (
                                        <button
                                            type="button"
                                            onClick={() => onRemove?.(idx)}
                                            className="p-1.5 text-text-dim hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                                            title="Remover integrante del equipo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Formulario con layout oficial de Formato 1 (Input primero, label inferior) */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                                    <div className="md:col-span-5">
                                        <input
                                            type="text"
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold text-text-main outline-none"
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
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-mono outline-none"
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
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main outline-none"
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
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main outline-none focus:border-text-main transition-colors"
                                            value={_inv.Telefono || ''}
                                            readOnly={readOnly}
                                            onChange={(e) => updateMemberField(idx, 'Telefono', e.target.value)}
                                            placeholder="0991234567"
                                        />
                                        <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                            Teléfono
                                        </label>
                                    </div>

                                    <div className="md:col-span-3">
                                        {isAssociative || readOnly ? (
                                            <input
                                                type="text"
                                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main outline-none"
                                                value={_inv.NivelAcademico || ''}
                                                readOnly={true}
                                            />
                                        ) : (
                                            <GeistSelect<string>
                                                value={_inv.NivelAcademico || 'Tercer Nivel'}
                                                onChange={(val) => updateMemberField(idx, 'NivelAcademico', val)}
                                                className="!py-2.5 !rounded-xl !text-xs"
                                            >
                                                <option value="Tercer Nivel">Tercer Nivel</option>
                                                <option value="Cuarto Nivel (Maestría)">Cuarto Nivel (Maestría)</option>
                                                <option value="Cuarto Nivel (PhD)">Cuarto Nivel (PhD)</option>
                                                <option value="Pregrado">Pregrado</option>
                                            </GeistSelect>
                                        )}
                                        <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                            Nivel Académico
                                        </label>
                                    </div>

                                    <div className="md:col-span-3">
                                        {isAssociative || readOnly || isDirector ? (
                                            <input
                                                type="text"
                                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold text-text-main outline-none"
                                                value={rol}
                                                readOnly={true}
                                            />
                                        ) : (
                                            <GeistSelect<string>
                                                value={rol}
                                                onChange={(val) => updateMemberField(idx, 'Rol', val)}
                                                className="!py-2.5 !rounded-xl !text-xs !font-bold"
                                            >
                                                <option value="Co-Investigador">Co-Investigador</option>
                                                <option value="Semillerista">Semillerista</option>
                                                <option value="Auxiliar de Investigación">Auxiliar de Investigación</option>
                                                <option value="Personal de Apoyo Técnico">Personal de Apoyo Técnico</option>
                                                <option value="Investigador Asociado">Investigador Asociado</option>
                                            </GeistSelect>
                                        )}
                                        <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                            Rol
                                        </label>
                                    </div>

                                    <div className="md:col-span-3 flex flex-col justify-between">
                                        <div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                step="0.5"
                                                className={`w-full bg-bg-deep border rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none transition-colors ${
                                                    isInvalidHours
                                                        ? 'border-error text-error bg-error/5 focus:border-error ring-1 ring-error/20'
                                                        : 'border-border-thin text-text-main focus:border-text-main'
                                                }`}
                                                value={_inv.HorasSemanales !== undefined && _inv.HorasSemanales !== null ? String(_inv.HorasSemanales) : ''}
                                                readOnly={readOnly}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateMemberField(idx, 'HorasSemanales', val === '' ? '' : parseFloat(val));
                                                }}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || isNaN(parseFloat(val))) {
                                                        updateMemberField(idx, 'HorasSemanales', 0);
                                                    }
                                                }}
                                                placeholder="0"
                                            />
                                            <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block mt-2 px-2">
                                                Horas Semanales
                                            </label>
                                        </div>

                                        {/* Indicador reactivo de horas de distributivo SIGAFI (estándar styles-diitra / Vercel Geist) */}
                                        {!isStudent ? (
                                            <div className="mt-2.5 pt-2 border-t border-border-thin/40 space-y-1">
                                                <div className="flex items-center justify-between text-[9.5px] font-mono text-text-dim">
                                                    <span>SIGAFI: <strong className="text-text-main font-semibold">{horasDisponibles}h</strong></span>
                                                    <span>Otros: <strong className="text-text-main font-semibold">{horasAsignadasOtros}h</strong></span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9.5px] font-mono">
                                                    <span className="text-text-dim">Cupo disponible:</span>
                                                    <span className={`font-bold ${cupoLibre > 0 ? 'text-text-main' : 'text-error'}`}>
                                                        {cupoLibre}h
                                                    </span>
                                                </div>

                                                {isInvalidHours && (
                                                    <div className="pt-1">
                                                        <p className="text-[9px] font-bold text-error leading-tight tracking-tight">
                                                            {hasNoDistributivo
                                                                ? 'Sin horas en distributivo SIGAFI activo'
                                                                : `Excede distributivo (+${excesoHoras.toFixed(1)}h)`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-2.5 pt-2 border-t border-border-thin/40">
                                                <span className="text-[9px] font-medium text-text-dim/80">
                                                    Semillero / Estudiante (Sin distributivo docente)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Carrera de Asociación */}
                                    <div className="md:col-span-12 mt-2.5 pt-4 border-t border-border-thin/40">
                                        {(() => {
                                            const invCarrera = _inv.Carrera || _inv.carrera || '';
                                            const invDisponibles = _inv.CarrerasDisponibles || _inv.carrerasDisponibles || '';
                                            const rawCareers = invDisponibles || invCarrera || '';
                                            const cleanOptions = rawCareers.split(',')
                                                .map((s: string) => s.trim())
                                                .filter((s: string) => s.length > 0 && s !== 'Docente' && s !== 'Estudiante');

                                            if (cleanOptions.length > 1) {
                                                const isAlreadySelected = cleanOptions.includes(invCarrera);
                                                const currentValue = isAlreadySelected ? invCarrera : '';

                                                return (
                                                    <div className="flex flex-col gap-2 animate-fade-in">
                                                        <span className="text-[10px] font-black text-warning uppercase tracking-widest flex items-center gap-1.5">
                                                            <AlertCircle size={12} /> Selecciona la carrera de asociación para este integrante:
                                                        </span>
                                                        <div className="w-full max-w-md">
                                                            <GeistSelect<string>
                                                                value={currentValue}
                                                                onChange={(val) => updateMemberField(idx, 'Carrera', val)}
                                                                disabled={readOnly}
                                                                placeholder="Seleccione una carrera..."
                                                                className="!py-2.5 !rounded-xl !text-xs !font-bold border-warning/50 focus:border-warning"
                                                            >
                                                                <option value="">Seleccione una carrera...</option>
                                                                {cleanOptions.map((opt: string) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </GeistSelect>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-text-dim uppercase tracking-widest px-2">
                                                        Carrera / Unidad:
                                                    </span>
                                                    <span className="text-xs font-bold text-brand-light px-2">
                                                        {invCarrera || (isStudent ? 'Pregrado' : 'Docente')}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Drawer Lateral a la Derecha para Añadir Integrantes (Estilo DIITRA) */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-xs cursor-pointer animate-fade-in"
                        onClick={() => setIsAddModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl md:max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden shadow-2xl">
                        {/* Header del Drawer */}
                        <div className="modal-header border-b border-border-thin px-6 py-5 flex items-center justify-between shrink-0 bg-surface">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                                    <UserPlus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-main tracking-tight uppercase">
                                        Añadir Integrante al Equipo
                                    </h3>
                                    <p className="text-[11px] text-text-dim mt-0.5">
                                        {!isAssociative
                                            ? "Docentes con horas de investigación y estudiantes con matrícula activa"
                                            : "Integrantes adscritos al grupo de investigación institucional"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-text-dim hover:text-text-main transition-colors p-2 rounded-lg hover:bg-surface-hover cursor-pointer"
                                title="Cerrar panel"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Contenido del Drawer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <MemberSearchSelector
                                title="Búsqueda de Personal"
                                subtitle={!isAssociative 
                                    ? "Filtrado en tiempo real con SIGAFI por carga horaria y matrícula vigente."
                                    : "Búsqueda en el catálogo de personal institucional."}
                                onAddMember={handleAddMemberFromSearch}
                                existingCedulas={existingCedulas}
                                allowedTypes={allowedTypes}
                                defaultType="DOCENTE"
                                soloConHorasDocentes={!isAssociative}
                                estadoEstudiante={!isAssociative ? 'ACTIVO' : 'TODOS'}
                                variant="embedded"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


