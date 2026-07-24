import React from 'react';
import type { Group } from '../types';

interface GroupMembersSectionProps {
    selectedGroup: Group;
    selectedMemberId: number | null;
    handleMemberCardClick: (memberId: number, idx: number) => void;
    memberCardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export const GroupMembersSection: React.FC<GroupMembersSectionProps> = ({
    selectedGroup,
    selectedMemberId,
    handleMemberCardClick,
    memberCardRefs
}) => {
    return (
        <section className="py-28 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Izquierda (lg:col-span-8): Laptop Mockup */}
                <div className="lg:col-span-8 lg:order-last lg:sticky lg:top-[32vh] border border-border-thin rounded-xl bg-surface shadow-md p-6 font-mono text-xs tracking-tight relative overflow-hidden transition-all duration-300">
                    {/* Window controls */}
                    <div className="flex items-center justify-between border-b border-border-thin pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-error/50" />
                            <span className="w-3.5 h-3.5 rounded-full bg-warning/50" />
                            <span className="w-3.5 h-3.5 rounded-full bg-success/50" />
                        </div>
                        <span className="text-xs text-text-dim font-mono">Perfil_Investigador://{selectedGroup.siglas || 'grupo'}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-success font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                            <span>REGISTRO OFICIAL</span>
                        </div>
                    </div>

                    {/* Output Profile inside Laptop Mockup */}
                    {selectedMemberId && selectedGroup.miembros ? (
                        (() => {
                            const m = selectedGroup.miembros.find(mb => mb.idGrupoMiembro === selectedMemberId);
                            if (!m) return null;
                            const initials = (m.nombreCompleto || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
                            const isCoord = (m.rol || '').toLowerCase() === 'coordinador';

                            return (
                                <div className="space-y-6 font-sans py-4 flex flex-col md:flex-row gap-6 items-center animate-fade-in">
                                    {/* Avatar grande */}
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border shrink-0 relative overflow-hidden transition-all duration-300 ${isCoord ? 'bg-gradient-to-br from-brand/20 to-purple-500/20 text-brand border-brand/30 shadow-[0_4px_20px_rgba(0,112,243,0.15)]' : 'bg-gradient-to-br from-surface to-surface-hover border-border-thin text-text-main'}`}>
                                        <div className="absolute inset-0 vercel-grid opacity-30" />
                                        <span className="relative z-10 filter drop-shadow-sm font-mono tracking-wider">{initials}</span>
                                    </div>

                                    {/* Info de perfil */}
                                    <div className="flex-1 space-y-3 min-w-0 w-full text-center md:text-left">
                                        <div>
                                            <span className={`badge-vercel text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isCoord ? 'badge-vercel-violet' : 'badge-vercel-neutral'}`}>
                                                {m.rol}
                                            </span>
                                            <h3 className="text-lg font-bold text-text-main leading-snug mt-2">{m.nombreCompleto}</h3>
                                            {m.gradoAcademicoMaximo && (
                                                <p className="text-[10px] text-brand font-bold font-mono tracking-wider uppercase mt-1">
                                                    {m.gradoAcademicoMaximo}
                                                </p>
                                            )}
                                            {m.carrera && <p className="text-xs text-text-dim mt-0.5 font-medium">{m.carrera}</p>}
                                            {m.especialidad && (
                                                <p className="text-xs text-text-dim/80 italic mt-2 leading-relaxed">
                                                    Especialidad: {m.especialidad}
                                                </p>
                                            )}
                                        </div>

                                        <div className="border-t border-border-thin/40 pt-3.5 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2.5 text-[10px] text-text-dim font-mono items-center">
                                            <span>ESTADO: {m.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                                            <span className="flex items-center gap-1.5 mr-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                                ADSCRITO
                                            </span>

                                            {/* Perfiles Académicos */}
                                            {(m.orcidId || m.googleScholarUrl || m.researchGateUrl || m.scopusId) && (
                                                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start md:border-l md:border-border-thin/40 md:pl-4 py-0.5">
                                                    {m.orcidId && (
                                                        <a
                                                            href={`https://orcid.org/${m.orcidId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-text-dim hover:text-brand transition-colors font-semibold"
                                                            title="Perfil ORCID"
                                                        >
                                                            ORCID
                                                        </a>
                                                    )}
                                                    {m.googleScholarUrl && (
                                                        <a
                                                            href={m.googleScholarUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-text-dim hover:text-brand transition-colors font-semibold"
                                                            title="Perfil Google Scholar"
                                                        >
                                                            Scholar
                                                        </a>
                                                    )}
                                                    {m.researchGateUrl && (
                                                        <a
                                                            href={m.researchGateUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-text-dim hover:text-brand transition-colors font-semibold"
                                                            title="Perfil ResearchGate"
                                                        >
                                                            ResearchGate
                                                        </a>
                                                    )}
                                                    {m.scopusId && (
                                                        <a
                                                            href={`https://www.scopus.com/authid/detail.uri?authorId=${m.scopusId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-text-dim hover:text-brand transition-colors font-semibold"
                                                            title="Perfil Scopus"
                                                        >
                                                            Scopus
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="py-12 text-center text-text-dim font-sans text-xs">
                            Selecciona un miembro del equipo para inspeccionar su ficha
                        </div>
                    )}
                </div>

                {/* Derecha (lg:col-span-4): Integrantes e Selector dinámico con scroll-spy */}
                <div className="lg:col-span-4 lg:order-first space-y-[40vh] font-sans py-12 lg:pb-[40vh]">
                    <div
                        id="investigadores-header"
                        className="transition-all duration-500"
                        style={{
                            opacity: selectedMemberId === null ? 1 : 0,
                            transform: `translateY(${selectedMemberId === null ? 0 : -12}px)`,
                            pointerEvents: selectedMemberId === null ? 'auto' : 'none'
                        }}
                    >
                        <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">// Investigadores</p>
                        <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter leading-tight text-text-main mt-1">
                            Equipo de Investigación
                        </h2>
                        <p className="text-text-dim text-xs leading-relaxed mt-3">
                            Coordinadores y profesores investigadores asociados adscritos formalmente a este grupo.
                        </p>
                    </div>

                    {selectedGroup.miembros && selectedGroup.miembros.length > 0 ? (
                        <div className="space-y-[40vh] mt-[40vh]">
                            {selectedGroup.miembros.map((miembro, index) => (
                                <div
                                    key={miembro.idGrupoMiembro}
                                    ref={el => { memberCardRefs.current[index] = el; }}
                                    onClick={() => handleMemberCardClick(miembro.idGrupoMiembro, index)}
                                    className="cursor-pointer select-none"
                                    style={{
                                        opacity: selectedMemberId === miembro.idGrupoMiembro ? 1 : 0,
                                        transform: `translateY(${selectedMemberId === miembro.idGrupoMiembro ? 0 : 12}px)`,
                                        pointerEvents: selectedMemberId === miembro.idGrupoMiembro ? 'auto' : 'none',
                                        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                >
                                    <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-2.5">// 0{index + 1}. {miembro.rol}</p>
                                    <h3 className="text-3xl font-black text-text-main leading-tight">{miembro.nombreCompleto}</h3>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-dim text-xs italic">El grupo no tiene miembros registrados.</p>
                    )}
                </div>
            </div>
        </section>
    );
};
