import React, { useState } from 'react';
import {
    Users, AlertCircle, ExternalLink, RefreshCw, X,
    Search, History, CheckSquare, UserPlus, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

const normalizeRole = (role: string | null | undefined): string => {
    if (!role) return "Co-Investigador";
    const r = role.toLowerCase().trim();
    if (r.includes("director") || r.includes("principal")) return "Director de Proyecto";
    if (r.includes("semillerista") || r.includes("estudiante") || r.includes("alumno")) return "Semillerista";
    return "Co-Investigador";
};

interface TeamManagementProps {
    currentProject: {
        puedeEditar: boolean;
        puedeSolicitarCambioEquipo: boolean;
        uuid: string;
    };
    investigadores: any[];
    tieneGrupo: boolean;
    grupoInvestigacion: string;
    approvedGroups: any[];
    isSyncingGroupMembers: boolean;
    isSavingTeam: boolean;
    teamMessage: { type: 'success' | 'error', text: string } | null;
    teamChangeRequests: any[];
    isLoadingTeamChangeRequests: boolean;
    isSubmittingTeamChangeRequest: boolean;
    teamChangeForm: {
        tipo: string;
        cedulaObjetivo: string;
        rolPropuesto: string;
        motivo: string;
        resolucionReferencia: string;
    };
    setTeamChangeForm: React.Dispatch<React.SetStateAction<{
        tipo: string;
        cedulaObjetivo: string;
        rolPropuesto: string;
        motivo: string;
        resolucionReferencia: string;
    }>>;
    availableProfessors: any[];
    setAvailableProfessors: React.Dispatch<React.SetStateAction<any[]>>;
    availableStudents: any[];
    setAvailableStudents: React.Dispatch<React.SetStateAction<any[]>>;
    requestSearchQuery: string;
    setRequestSearchQuery: (val: string) => void;
    requestSearchResults: any[];
    isRequestSearching: boolean;
    showRequestSearchResults: boolean;
    setShowRequestSearchResults: (val: boolean) => void;
    canReviewTeamChanges: boolean;
    isHistoryExpanded: boolean;
    setIsHistoryExpanded: (val: boolean) => void;
    isChangeRequestsExpanded: boolean;
    setIsChangeRequestsExpanded: (val: boolean) => void;
    onToggleTieneGrupo: (val: boolean) => void;
    onSetGrupoInvestigacion: (val: string) => void;
    onSaveTeam: () => void;
    onCreateTeamChangeRequest: () => void;
    onReviewTeamChangeRequest: (requestUuid: string, aprobar: boolean) => void;
    onOpenTransferModal: (member: any) => void;
    onUpdateMember: (cedula: string, field: string, value: any) => void;
    onRemoveMember: (cedula: string) => void;
    onOpenGroupDetail: (groupUuid: string) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
    currentProject,
    investigadores,
    tieneGrupo,
    grupoInvestigacion,
    approvedGroups,
    isSyncingGroupMembers,
    isSavingTeam,
    teamMessage,
    teamChangeRequests,
    isLoadingTeamChangeRequests,
    isSubmittingTeamChangeRequest,
    teamChangeForm,
    setTeamChangeForm,
    availableProfessors,
    setAvailableProfessors,
    availableStudents,
    setAvailableStudents,
    requestSearchQuery,
    setRequestSearchQuery,
    requestSearchResults,
    isRequestSearching,
    showRequestSearchResults,
    setShowRequestSearchResults,
    canReviewTeamChanges,
    isHistoryExpanded,
    setIsHistoryExpanded,
    isChangeRequestsExpanded,
    setIsChangeRequestsExpanded,
    onToggleTieneGrupo,
    onSetGrupoInvestigacion,
    onSaveTeam,
    onCreateTeamChangeRequest,
    onReviewTeamChangeRequest,
    onOpenTransferModal,
    onUpdateMember,
    onRemoveMember,
    onOpenGroupDetail
}) => {

    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                    <Users size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                        {tieneGrupo ? 'Equipo de Trabajo' : 'Personal del Proyecto'}
                    </h3>
                </div>
                <p className="text-xs text-text-dim font-normal leading-relaxed">
                    {tieneGrupo 
                        ? 'Gestión dinámica del talento humano del proyecto' 
                        : 'Dedicación y detalles del investigador principal'}
                </p>
            </div>

            <div className="mt-6 space-y-4">
                {/* Toggle Individual / Asociativo */}
                <div className="flex bg-surface-hover rounded-md border border-border-thin overflow-hidden">
                    <button
                        type="button"
                        disabled={currentProject.puedeEditar === false}
                        onClick={() => onToggleTieneGrupo(false)}
                        className={`flex-1 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${!tieneGrupo ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                    >
                        Individual
                    </button>
                    <button
                        type="button"
                        disabled={currentProject.puedeEditar === false}
                        onClick={() => onToggleTieneGrupo(true)}
                        className={`flex-1 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 border-l border-border-thin ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${tieneGrupo ? 'bg-text-main text-bg-deep border-l-transparent' : 'text-text-dim hover:text-text-main'}`}
                    >
                        Asociativo (Grupo)
                    </button>
                </div>

                {/* Selector de Grupo de Investigación Adscrito */}
                {tieneGrupo && (
                    <div className="space-y-1.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Grupo de Investigación Adscrito</label>
                            {grupoInvestigacion && (
                                (() => {
                                    const selectedGroupObj = approvedGroups.find(g => g.uuid === grupoInvestigacion);
                                    return selectedGroupObj?.uuid ? (
                                        <button
                                            type="button"
                                            onClick={() => onOpenGroupDetail(selectedGroupObj.uuid)}
                                            className="text-[9px] text-brand hover:text-brand-light font-bold flex items-center gap-0.5 hover:underline"
                                            title="Ver Ficha del Grupo"
                                        >
                                            <span>Ficha del Grupo</span>
                                            <ExternalLink size={10} />
                                        </button>
                                    ) : null;
                                })()
                            )}
                        </div>
                        <div className="flex gap-2 items-center">
                            <select
                                value={grupoInvestigacion}
                                disabled={currentProject.puedeEditar === false || isSyncingGroupMembers}
                                onChange={(e) => onSetGrupoInvestigacion(e.target.value)}
                                className="flex-1 bg-surface border border-border-thin rounded px-2.5 py-2 text-xs text-text-main outline-none focus:border-text-main transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Seleccione Grupo Aprobado --</option>
                                {approvedGroups.map((g: any) => (
                                    <option key={g.id_grupo || g.idGrupo} value={g.uuid}>
                                        {g.nombre} {g.siglas ? `(${g.siglas})` : ''}
                                    </option>
                                ))}
                            </select>
                            {isSyncingGroupMembers && (
                                <RefreshCw size={14} className="animate-spin text-brand shrink-0" />
                            )}
                        </div>
                    </div>
                )}



                {/* Modo Solo Lectura Banner */}
                {currentProject.puedeEditar === false && !currentProject.puedeSolicitarCambioEquipo && (
                    <div className="callout-vercel callout-vercel-warning animate-fade-in mb-4 w-full">
                        <ShieldBanner />
                    </div>
                )}

                {/* Lista de Integrantes */}
                <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">
                        {tieneGrupo ? 'Integrantes Activos' : 'Investigador Activo'} ({investigadores.filter((m: any) => m.activo !== false).length})
                    </label>

                    {investigadores.filter((member: any) => member.activo !== false).length === 0 ? (
                        <div className="p-6 rounded-xl border border-dashed border-border-thin text-center text-[10px] text-text-dim uppercase tracking-wider font-mono">
                            {tieneGrupo ? 'Sin investigadores activos' : 'Sin investigador asignado'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {investigadores.filter((member: any) => member.activo !== false).map((member: any, idx: number) => {
                                const isDirector = member.rol?.toLowerCase().includes('director');
                                
                                // Normalized variables to support both camelCase and snake_case API data
                                const nivelAcademico = member.nivelAcademico ?? member.nivel_academico ?? 'Tercer Nivel';
                                const horasSemanales = member.horasSemanales ?? member.horas_semanales ?? null;
                                const horasDisponibles = member.horasDisponibles ?? member.horas_disponibles;
                                const horasAsignadas = member.horasAsignadas ?? member.horas_asignadas ?? 0;

                                const isEstudiante = member.rol?.toLowerCase().includes('estudiante') || nivelAcademico === 'Pregrado';

                                return (
                                    <div
                                        key={member.cedula || idx}
                                        className="p-4 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover hover:bg-surface-hover/20 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                            <div className={`w-9 h-9 shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${isDirector
                                                ? 'text-brand'
                                                : isEstudiante
                                                    ? 'text-success'
                                                    : 'text-text-main'
                                                }`}>
                                                {member.nombre ? member.nombre.substring(0, 2).toUpperCase() : 'IN'}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-semibold text-text-main truncate">{formatNombre(member.nombre)}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDirector
                                                        ? 'text-violet-400'
                                                        : isEstudiante
                                                            ? 'text-success'
                                                            : 'text-brand-light'
                                                        }`}>
                                                        {member.rol}
                                                    </span>
                                                    {isDirector && currentProject.puedeEditar !== false && tieneGrupo && grupoInvestigacion && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenTransferModal(member)}
                                                            className="btn-vercel-secondary !py-0.5 !px-2 !text-[9px] !h-auto flex items-center gap-1 transition-all"
                                                            title="Transferir Dirección"
                                                        >
                                                            <RefreshCw size={8} /> Relevo
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-text-dim flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {member.carrera && (
                                                        <span className="text-[10px] text-brand-light font-semibold truncate max-w-[200px]" title={member.carrera}>
                                                            {member.carrera}
                                                        </span>
                                                    )}
                                                    <span className="font-mono">C.I. {member.cedula || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col xl:flex-row xl:items-center gap-4 w-full xl:w-auto xl:justify-end">
                                            {horasDisponibles !== undefined && horasDisponibles !== null && (
                                                <div className={`text-[10px] flex items-center gap-1 w-full sm:w-auto shrink-0 ${(horasSemanales || 0) > (horasDisponibles - (horasAsignadas || 0))
                                                    ? 'text-error animate-pulse font-bold'
                                                    : 'text-text-dim font-medium'
                                                    }`}>
                                                    <AlertCircle size={11} className="shrink-0" />
                                                    <span>
                                                        {(horasSemanales || 0) > (horasDisponibles - (horasAsignadas || 0))
                                                            ? `Excede límite! (Máx disp: ${Math.max(0, horasDisponibles - (horasAsignadas || 0))}h)`
                                                            : `Disp: ${horasDisponibles - (horasAsignadas || 0)}h / ${horasDisponibles}h`
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full lg:w-auto">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
                                                    <div className="flex flex-col gap-1 w-full lg:w-36">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Rol</span>
                                                        <select
                                                            value={normalizeRole(member.rol)}
                                                            disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                            onChange={(e) => onUpdateMember(member.cedula, 'rol', e.target.value)}
                                                            className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="Director de Proyecto">Director de Proyecto</option>
                                                            <option value="Co-Investigador">Co-Investigador</option>
                                                            <option value="Semillerista">Semillerista</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-col gap-1 w-full lg:w-36">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Nivel</span>
                                                        <select
                                                            value={nivelAcademico}
                                                            disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                            onChange={(e) => onUpdateMember(member.cedula, 'nivelAcademico', e.target.value)}
                                                            className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="Tercer Nivel">Tercer Nivel</option>
                                                            <option value="Cuarto Nivel (Maestría)">Maestría</option>
                                                            <option value="Cuarto Nivel (PhD)">PhD</option>
                                                            <option value="Pregrado">Pregrado</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-col gap-1 w-full lg:w-20">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Horas</span>
                                                        <input
                                                            type="number"
                                                            value={horasSemanales ?? ''}
                                                            disabled={currentProject.puedeEditar === false}
                                                            onChange={(e) => onUpdateMember(member.cedula, 'horasSemanales', e.target.value ? parseFloat(e.target.value) : null)}
                                                            placeholder="0"
                                                            min="0"
                                                            max="40"
                                                            className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>

                                                {currentProject.puedeEditar !== false && !tieneGrupo && !isDirector && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveMember(member.cedula)}
                                                        className="p-2 text-text-dim hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg transition-all self-end md:self-end md:mb-[3px] shrink-0"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Historial de Ex-Integrantes */}
                {investigadores.some((member: any) => member.activo === false) && (
                    <div className="border-t border-border-thin pt-4">
                        <button
                            type="button"
                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            className="w-full flex items-center justify-between text-[10px] font-semibold text-text-dim uppercase tracking-wider hover:text-text-main transition-colors py-1 outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <History size={12} className="text-brand-light" />
                                <span>
                                    {tieneGrupo ? 'Ex-Integrantes' : 'Ex-Investigadores'} ({investigadores.filter((m: any) => m.activo === false).length})
                                </span>
                            </div>
                            <span className="font-mono text-[10px]">{isHistoryExpanded ? '▲' : '▼'}</span>
                        </button>
                        {isHistoryExpanded && (
                            <div className="mt-3 space-y-2 animate-fade-in">
                                {investigadores.filter((member: any) => member.activo === false).map((member: any, idx: number) => {
                                    const isExDirector = member.rol?.toLowerCase().includes('director');
                                    return (
                                        <div key={member.cedula || idx} className="p-3 rounded-md bg-bg-deep border border-border-thin/50 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[9px] font-semibold border uppercase ${isExDirector ? 'icon-circle-brand !p-0 !w-7 !h-7' : 'bg-surface border-border-thin text-text-dim'}`}>
                                                    {member.nombre ? member.nombre.substring(0, 2) : 'EX'}
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-semibold text-text-main">{formatNombre(member.nombre)}</span>
                                                    <span className="text-[9px] text-text-dim font-mono ml-1.5">C.I. {member.cedula || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <span className="badge-vercel badge-vercel-error text-[9px] font-semibold">
                                                Baja
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}



                {/* Toast message display */}
                {teamMessage && (
                    <div className={`badge-vercel !rounded-md !p-3 !text-[11px] flex gap-2 items-center leading-relaxed animate-fade-in w-full ${teamMessage.type === 'success'
                        ? 'badge-vercel-success'
                        : 'badge-vercel-error'
                        }`}>
                        <CheckSquare size={14} className="shrink-0" />
                        <span className="font-medium">{teamMessage.text}</span>
                    </div>
                )}

                {/* Guardar equipo button */}
                {currentProject.puedeEditar !== false && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            disabled={isSavingTeam}
                            onClick={onSaveTeam}
                            className={`btn-vercel-primary !py-2.5 ${isSavingTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSavingTeam ? (
                                <>
                                    <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-text-dim rounded-full"></div>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={12} />
                                    <span>{tieneGrupo ? 'Guardar Equipo' : 'Guardar Cambios'}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {(tieneGrupo || currentProject.puedeSolicitarCambioEquipo || teamChangeRequests.length > 0) && (
                    <div className="border border-border-thin rounded-md p-3 bg-bg-deep/50 transition-all duration-300">
                        <button
                            type="button"
                            onClick={() => setIsChangeRequestsExpanded(!isChangeRequestsExpanded)}
                            className="w-full flex items-center justify-between outline-none group/btn text-left"
                        >
                            <div className="flex items-center gap-2">
                                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-main group-hover/btn:text-brand transition-colors">Solicitudes Formales de Cambio</h4>
                                <span className="text-[9px] text-text-dim">Con registro y revisión</span>
                            </div>
                            <div className="text-text-dim group-hover/btn:text-text-main transition-colors flex items-center gap-1.5">
                                {teamChangeRequests.length > 0 && !isChangeRequestsExpanded && (
                                    <span className="badge-vercel badge-vercel-info text-[8px] font-bold px-1.5 py-0.5" title="Solicitudes registradas">
                                        {teamChangeRequests.length}
                                    </span>
                                )}
                                {isChangeRequestsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </button>

                        {isChangeRequestsExpanded && (
                            <div className="space-y-3 mt-3 animate-fade-in">
                                {currentProject.puedeSolicitarCambioEquipo && (() => {
                                    const isStudentRole = ['Semillerista', 'SEMILLERISTA'].includes(teamChangeForm.rolPropuesto);
                                    const suggestedUsers = (teamChangeForm.tipo === 'CAMBIO_DIRECTOR' || !isStudentRole)
                                        ? availableProfessors
                                        : availableStudents;
                                    return (
                                        <div className="space-y-4 animate-fade-in">
                                            {/* Row 1: Tipo & Referencia */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Tipo de Solicitud</label>
                                                    <select
                                                        value={teamChangeForm.tipo}
                                                        onChange={(e) => {
                                                            setTeamChangeForm(prev => ({ ...prev, tipo: e.target.value, cedulaObjetivo: '' }));
                                                            setRequestSearchQuery('');
                                                        }}
                                                        className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                    >
                                                        <option value="ALTA">{tieneGrupo ? 'Alta de integrante' : 'Alta de personal'}</option>
                                                        <option value="BAJA">{tieneGrupo ? 'Baja de integrante' : 'Baja de personal'}</option>
                                                        <option value="CAMBIO_DIRECTOR">Cambio de director</option>
                                                        <option value="CAMBIO_GRUPO">Cambio de grupo de investigación</option>
                                                    </select>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Referencia Acta / Memo (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={teamChangeForm.resolucionReferencia}
                                                        onChange={(e) => setTeamChangeForm(prev => ({ ...prev, resolucionReferencia: e.target.value }))}
                                                        placeholder="Ej. ACTA-INV-2026-004"
                                                        className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main placeholder-text-muted outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Dynamic Fields (Rol and Target User) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                {teamChangeForm.tipo === 'ALTA' && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Rol Propuesto</label>
                                                        <select
                                                            value={teamChangeForm.rolPropuesto}
                                                            onChange={(e) => {
                                                                setTeamChangeForm(prev => ({ ...prev, rolPropuesto: e.target.value, cedulaObjetivo: '' }));
                                                                setRequestSearchQuery('');
                                                            }}
                                                            className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                        >
                                                            <option value="Director de Proyecto">Director de Proyecto</option>
                                                            <option value="Co-Investigador">Co-Investigador</option>
                                                            <option value="Semillerista">Semillerista</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className={`flex flex-col gap-1.5 ${teamChangeForm.tipo === 'ALTA' ? '' : 'md:col-span-2'}`}>
                                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">
                                                        {teamChangeForm.tipo === 'ALTA' && (tieneGrupo ? 'Integrante a Vincular' : 'Personal a Vincular')}
                                                        {teamChangeForm.tipo === 'BAJA' && (tieneGrupo ? 'Integrante a dar de Baja' : 'Personal a dar de Baja')}
                                                        {teamChangeForm.tipo === 'CAMBIO_DIRECTOR' && 'Nuevo Director Propuesto'}
                                                        {teamChangeForm.tipo === 'CAMBIO_GRUPO' && 'Grupo de Investigación Destino'}
                                                    </label>

                                                    {teamChangeForm.tipo === 'CAMBIO_GRUPO' ? (
                                                        <select
                                                            value={teamChangeForm.cedulaObjetivo}
                                                            onChange={(e) => setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: e.target.value }))}
                                                            className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                        >
                                                            <option value="">-- Seleccione Grupo Destino --</option>
                                                            {approvedGroups.map((g: any) => (
                                                                <option key={g.uuid} value={g.uuid}>
                                                                    {g.nombre} {g.siglas ? `(${g.siglas})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : teamChangeForm.tipo === 'BAJA' ? (
                                                        <select
                                                            value={teamChangeForm.cedulaObjetivo}
                                                            onChange={(e) => setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: e.target.value }))}
                                                            className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                        >
                                                            <option value="">{tieneGrupo ? '-- Seleccione Integrante --' : '-- Seleccione Personal --'}</option>
                                                            {investigadores.filter((m: any) => m.activo !== false).map((m: any) => (
                                                                <option key={m.cedula} value={m.cedula}>
                                                                    {formatNombre(m.nombre)} ({m.cedula}) - {m.rol}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="w-full relative">
                                                            {teamChangeForm.cedulaObjetivo ? (
                                                                (() => {
                                                                    const selectedUserObj = [...availableProfessors, ...availableStudents, ...requestSearchResults].find(u => u.cedula === teamChangeForm.cedulaObjetivo);
                                                                    return (
                                                                        <div className="border border-border-thin bg-surface rounded-md px-3 py-2 flex items-center justify-between animate-fade-in">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="h-7 w-7 rounded-full bg-text-main/10 border border-text-main/10 flex items-center justify-center font-bold text-[10px] text-text-main">
                                                                                    {selectedUserObj?.nombre?.substring(0, 2).toUpperCase() || 'CI'}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-semibold text-text-main leading-tight">{selectedUserObj ? formatNombre(selectedUserObj.nombre) : 'Usuario Seleccionado'}</p>
                                                                                    <p className="text-[9px] text-text-dim font-mono leading-none mt-0.5">
                                                                                        C.I. {teamChangeForm.cedulaObjetivo} {selectedUserObj?.tipo ? `· ${selectedUserObj.tipo === 'profesor' ? 'Docente' : 'Estudiante'}` : ''}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: '' }));
                                                                                    setRequestSearchQuery('');
                                                                                }}
                                                                                className="text-text-dim hover:text-brand hover:bg-surface-hover transition-all p-1 rounded-full"
                                                                                title="Cambiar integrante"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <div className="relative">
                                                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                                    <input
                                                                        type="text"
                                                                        value={requestSearchQuery}
                                                                        onChange={(e) => setRequestSearchQuery(e.target.value)}
                                                                        onFocus={() => setShowRequestSearchResults(true)}
                                                                        placeholder="Buscar por nombre o cédula..."
                                                                        className="w-full bg-surface border border-border-thin rounded-md pl-9 pr-8 py-2 text-xs text-text-main placeholder-text-muted outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all font-sans"
                                                                    />
                                                                    {isRequestSearching && (
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-brand border-t-transparent rounded-full"></div>
                                                                        </div>
                                                                    )}

                                                                    {showRequestSearchResults && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-20" onClick={() => setShowRequestSearchResults(false)}></div>
                                                                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-bg-deep border border-border-thin rounded-lg shadow-2xl max-h-48 overflow-y-auto z-30 divide-y divide-border-thin/40">
                                                                                {(!requestSearchQuery.trim() || requestSearchQuery.length < 2) ? (
                                                                                    <>
                                                                                        <div className="px-3 py-1.5 text-[8.5px] font-bold text-text-dim uppercase tracking-wider bg-surface-hover/30">
                                                                                            Sugerencias disponibles ({suggestedUsers.length})
                                                                                        </div>
                                                                                        {suggestedUsers.length === 0 ? (
                                                                                            <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                                                {tieneGrupo ? 'No hay integrantes disponibles' : 'No hay personal disponible'}
                                                                                            </div>
                                                                                        ) : (
                                                                                            suggestedUsers.map((su: any) => (
                                                                                                <button
                                                                                                    key={su.cedula}
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: su.cedula }));
                                                                                                        setRequestSearchQuery(formatNombre(su.nombre));
                                                                                                        setShowRequestSearchResults(false);
                                                                                                    }}
                                                                                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface text-left text-[11px] transition-colors"
                                                                                                >
                                                                                                    <div>
                                                                                                        <p className="font-semibold text-text-main">{formatNombre(su.nombre)}</p>
                                                                                                        <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {su.cedula}</p>
                                                                                                    </div>
                                                                                                    <span className="badge-vercel text-[8px] font-bold px-1.5 py-0.5 badge-vercel-violet">
                                                                                                        Docente
                                                                                                    </span>
                                                                                                </button>
                                                                                            ))
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="px-3 py-1.5 text-[8.5px] font-bold text-text-dim uppercase tracking-wider bg-surface-hover/30">
                                                                                            Resultados de búsqueda
                                                                                        </div>
                                                                                        {requestSearchResults.length === 0 ? (
                                                                                            <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                                                Sin resultados
                                                                                            </div>
                                                                                        ) : (
                                                                                            requestSearchResults.map((su: any) => (
                                                                                                <button
                                                                                                    key={su.cedula}
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: su.cedula }));
                                                                                                        setRequestSearchQuery(formatNombre(su.nombre));
                                                                                                        setShowRequestSearchResults(false);

                                                                                                        const isTeacher = su.tipo === 'profesor';
                                                                                                        if (isTeacher) {
                                                                                                            if (!availableProfessors.some(p => p.cedula === su.cedula)) {
                                                                                                                setAvailableProfessors(prev => [su, ...prev]);
                                                                                                            }
                                                                                                        } else {
                                                                                                            if (!availableStudents.some(s => s.cedula === su.cedula)) {
                                                                                                                setAvailableStudents(prev => [su, ...prev]);
                                                                                                            }
                                                                                                        }
                                                                                                    }}
                                                                                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface text-left text-[11px] transition-colors"
                                                                                                >
                                                                                                    <div>
                                                                                                        <p className="font-semibold text-text-main">{formatNombre(su.nombre)}</p>
                                                                                                        <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {su.cedula}</p>
                                                                                                    </div>
                                                                                                    <span className={`badge-vercel text-[8px] font-bold px-1.5 py-0.5 ${su.tipo === 'profesor' ? 'badge-vercel-violet' : 'badge-vercel-success'}`}>
                                                                                                        {su.tipo === 'profesor' ? 'Docente' : 'Estudiante'}
                                                                                                    </span>
                                                                                                </button>
                                                                                            ))
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Row 3: Motivo */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Motivo Formal del Cambio</label>
                                                <textarea
                                                    value={teamChangeForm.motivo}
                                                    onChange={(e) => setTeamChangeForm(prev => ({ ...prev, motivo: e.target.value }))}
                                                    placeholder="Describa detalladamente el motivo de esta solicitud..."
                                                    className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-xs text-text-main placeholder-text-muted outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all min-h-[64px] font-sans resize-y"
                                                />
                                            </div>

                                            {/* Row 4: Submit Button */}
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    disabled={isSubmittingTeamChangeRequest}
                                                    onClick={onCreateTeamChangeRequest}
                                                    className="btn-vercel-primary !py-2 !px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 justify-center"
                                                >
                                                    {isSubmittingTeamChangeRequest ? 'Registrando...' : 'Registrar Solicitud'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {currentProject.puedeEditar === false && currentProject.puedeSolicitarCambioEquipo && (
                                    <div className="badge-vercel badge-vercel-info !rounded-md !p-2.5 !text-[10px] !font-normal !leading-relaxed w-full">
                                        El protocolo está en solo lectura, pero como integrante del proyecto o del grupo puedes registrar solicitudes formales (alta, baja, cambio de director o de grupo). Solo el administrador puede aprobarlas y ejecutarlas.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {isLoadingTeamChangeRequests ? (
                                        <div className="text-[10px] text-text-dim uppercase tracking-wider">Cargando solicitudes...</div>
                                    ) : teamChangeRequests.length === 0 ? (
                                        <div className="text-[10px] text-text-dim uppercase tracking-wider">Sin solicitudes registradas</div>
                                    ) : (
                                        teamChangeRequests.map((req: any) => (
                                            <div key={req.requestUuid} className="p-2 rounded border border-border-thin bg-surface">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-semibold text-text-main uppercase">{req.tipo} · {req.estado}</span>
                                                    <span className="text-[9px] text-text-dim">
                                                        {req.tipo === 'CAMBIO_GRUPO'
                                                            ? (approvedGroups.find((g: any) => g.uuid === req.cedulaObjetivo)?.siglas || 'Grupo')
                                                            : (req.cedulaObjetivo || 'N/A')}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-text-dim mt-1">{req.motivo}</p>
                                                {canReviewTeamChanges && req.estado === 'PENDIENTE' && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button type="button" className="btn-vercel-secondary !py-1.5 !px-2 text-[10px]" onClick={() => onReviewTeamChangeRequest(req.requestUuid, true)}>
                                                            Aprobar y Ejecutar
                                                        </button>
                                                        <button type="button" className="btn-vercel-outline !py-1.5 !px-2 text-[10px]" onClick={() => onReviewTeamChangeRequest(req.requestUuid, false)}>
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ShieldBanner = () => {
    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-warning mt-0.5 shrink-0"
            >
                <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
            </svg>
            <div>
                <p className="callout-vercel-title">Modo solo lectura</p>
                <p className="callout-vercel-body">No tienes permisos para modificar el equipo de investigadores o transferir la dirección del proyecto.</p>
            </div>
        </>
    );
};

export default TeamManagement;

