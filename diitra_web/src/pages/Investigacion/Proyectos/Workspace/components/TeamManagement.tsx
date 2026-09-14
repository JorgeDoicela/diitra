import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, User, Layers, Info, AlertCircle, ExternalLink, RefreshCw, X,
    Search, History, CheckSquare, UserPlus, Trash2, ChevronDown, ChevronUp, AlertTriangle, ChevronRight
} from 'lucide-react';
import { GeistSelect } from '../../../../../components/Common/GeistSelect';
import { MemberSearchSelector, type SelectedMemberResult } from '../../../../../components/Common/MemberSearchSelector';
import { normalizeProjectRole } from '../../../../../utils/roleCatalog';

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

const normalizeRole = (role: string | null | undefined): string => {
    return normalizeProjectRole(role);
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
    modalidad?: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO';
    onSelectModalidad?: (val: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO') => void;
    onToggleTieneGrupo: (val: boolean) => void;
    onSetGrupoInvestigacion: (val: string) => void;
    onSaveTeam: () => void;
    onCreateTeamChangeRequest: () => void;
    onReviewTeamChangeRequest: (requestUuid: string, almacenar: boolean) => void;
    onOpenTransferModal: (member: any) => void;
    onUpdateMember: (cedula: string, field: string, value: any) => void;
    onRemoveMember: (cedula: string) => void;
    onAddMember?: (member: any) => void;
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
    modalidad: propModalidad,
    onSelectModalidad,
    onToggleTieneGrupo,
    onSetGrupoInvestigacion,
    onSaveTeam,
    onCreateTeamChangeRequest,
    onReviewTeamChangeRequest,
    onOpenTransferModal,
    onUpdateMember,
    onRemoveMember,
    onAddMember,
    onOpenGroupDetail
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const activeModalidad: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO' = propModalidad ?? (tieneGrupo ? 'GRUPO' : (investigadores.filter((m: any) => m.activo !== false).length > 1 ? 'EQUIPO' : 'INDIVIDUAL'));

    const handleSwitchModalidad = (target: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO') => {
        if (onSelectModalidad) {
            onSelectModalidad(target);
        } else {
            onToggleTieneGrupo(target === 'GRUPO');
        }
    };

    const hasActiveDirector = useMemo(() => {
        return (investigadores || []).some((inv: any) => {
            const r = inv.rol || inv.Rol || '';
            return r.toLowerCase().includes('director') || inv.esDirector === true || inv.EsDirector === true;
        });
    }, [investigadores]);

    const existingCedulas = useMemo(() => {
        return investigadores
            .map((i: any) => (i.cedula || i.Cedula || '').trim())
            .filter(Boolean);
    }, [investigadores]);

    const handleAddMemberFromSearch = (member: SelectedMemberResult) => {
        if (!member) return;
        const cedula = (member.cedula || '').trim();
        if (!cedula) return;

        const isStudent = member.tipo === 'ESTUDIANTE';
        let defaultRole = member.rol || (isStudent ? 'Semillerista' : 'Co-Investigador');
        if (hasActiveDirector && defaultRole.toLowerCase().includes('director')) {
            defaultRole = 'Co-Investigador';
        }
        const defaultNivel = isStudent ? 'Pregrado' : 'Tercer Nivel';

        const newInvestigador = {
            nombre: formatNombre(member.nombre_completo),
            cedula: cedula,
            email: member.email || '',
            telefono: member.telefono || '',
            nivelAcademico: defaultNivel,
            rol: defaultRole,
            horasSemanales: member.horas_investigacion ?? (isStudent ? 0 : 5),
            horasDisponibles: member.horas_investigacion ?? 0,
            horasAsignadas: member.horas_asignadas ?? 0,
            carrera: member.carrera || '',
            carrerasDisponibles: member.carrera || '',
            activo: true,
            esDirector: false
        };

        if (onAddMember) {
            onAddMember(newInvestigador);
        }
        setIsAddModalOpen(false);
    };

    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                    <Users size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                        {activeModalidad === 'GRUPO' 
                            ? 'Equipo Adscrito a Grupo Institucional' 
                            : (activeModalidad === 'INDIVIDUAL' ? 'Investigación Individual (Unipersonal)' : 'Equipo de Investigación del Proyecto')}
                    </h3>
                </div>
                <p className="text-xs text-text-dim font-normal leading-relaxed">
                    {activeModalidad === 'GRUPO' 
                        ? 'Gestión del talento humano vinculado al grupo de investigación formal institucional' 
                        : (activeModalidad === 'INDIVIDUAL' 
                            ? 'Gestión del docente director a cargo de la investigación unipersonal' 
                            : 'Gestión ágil de docentes investigadores, semilleristas y colaboradores del proyecto')}
                </p>
            </div>

            <div className="mt-6 space-y-4">
                {/* Selector de Modalidad de Proyecto (INDIVIDUAL | EQUIPO | GRUPO FORMAL) */}
                <div className="space-y-2">
                    <div className="flex bg-surface-hover/80 p-1 rounded-lg border border-border-thin gap-1">
                        <button
                            type="button"
                            disabled={currentProject.puedeEditar === false}
                            onClick={() => handleSwitchModalidad('INDIVIDUAL')}
                            className={`flex-1 py-2 px-2.5 rounded-md text-[10px] font-semibold tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeModalidad === 'INDIVIDUAL' ? 'bg-bg-deep text-text-main shadow-xs border border-border-thin font-bold' : 'text-text-dim hover:text-text-main hover:bg-surface-hover'}`}
                        >
                            <User size={12} className={activeModalidad === 'INDIVIDUAL' ? 'text-brand' : 'opacity-70'} />
                            <span>Individual</span>
                        </button>
                        <button
                            type="button"
                            disabled={currentProject.puedeEditar === false}
                            onClick={() => handleSwitchModalidad('EQUIPO')}
                            className={`flex-1 py-2 px-2.5 rounded-md text-[10px] font-semibold tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeModalidad === 'EQUIPO' ? 'bg-bg-deep text-text-main shadow-xs border border-border-thin font-bold' : 'text-text-dim hover:text-text-main hover:bg-surface-hover'}`}
                        >
                            <Users size={12} className={activeModalidad === 'EQUIPO' ? 'text-brand' : 'opacity-70'} />
                            <span>Equipo de Proyecto</span>
                        </button>
                        <button
                            type="button"
                            disabled={currentProject.puedeEditar === false}
                            onClick={() => handleSwitchModalidad('GRUPO')}
                            className={`flex-1 py-2 px-2.5 rounded-md text-[10px] font-semibold tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${activeModalidad === 'GRUPO' ? 'bg-bg-deep text-text-main shadow-xs border border-border-thin font-bold' : 'text-text-dim hover:text-text-main hover:bg-surface-hover'}`}
                        >
                            <Layers size={12} className={activeModalidad === 'GRUPO' ? 'text-brand' : 'opacity-70'} />
                            <span>Grupo Formal</span>
                        </button>
                    </div>

                    {/* Explicación contextual de la modalidad activa */}
                    <div className="px-3 py-2 rounded-lg bg-surface-hover/40 border border-border-thin/50 flex items-center gap-2 text-[11px] text-text-dim">
                        <Info size={13} className="text-brand shrink-0" />
                        <span>
                            {activeModalidad === 'INDIVIDUAL' && 'Modalidad Unipersonal: Proyecto liderado exclusivamente por 1 Director de Proyecto. No requiere co-investigadores ni semilleristas.'}
                            {activeModalidad === 'EQUIPO' && 'Equipo Multidisciplinario: 1 Director de Proyecto al frente de un equipo libre de docentes co-investigadores y semilleristas.'}
                            {activeModalidad === 'GRUPO' && 'Modalidad Asociativa: Adscrito a un Grupo de Investigación formal aprobado. La nómina base procede de los miembros del grupo.'}
                        </span>
                    </div>
                </div>

                {/* Selector de Grupo de Investigación Adscrito */}
                {activeModalidad === 'GRUPO' && (
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
                            <div className="flex-1 min-w-0">
                                <GeistSelect<string>
                                    value={grupoInvestigacion}
                                    disabled={currentProject.puedeEditar === false || isSyncingGroupMembers}
                                    onChange={(val) => onSetGrupoInvestigacion(val)}
                                    placeholder="-- Seleccione Grupo Aprobado --"
                                    className="!py-2 !rounded-lg !text-xs"
                                >
                                    <option value="">-- Seleccione Grupo Aprobado --</option>
                                    {approvedGroups.map((g: any) => (
                                        <option key={g.id_grupo || g.idGrupo} value={g.uuid}>
                                            {g.nombre} {g.siglas ? `(${g.siglas})` : ''}
                                        </option>
                                    ))}
                                </GeistSelect>
                            </div>
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">
                                {activeModalidad === 'GRUPO' 
                                    ? 'Integrantes Activos del Grupo' 
                                    : (activeModalidad === 'INDIVIDUAL' ? 'Investigador Principal' : 'Integrantes del Equipo')} ({investigadores.filter((m: any) => m.activo !== false).length})
                            </label>
                            {activeModalidad === 'INDIVIDUAL' && (
                                <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.5 !px-1.5 font-medium">
                                    Unipersonal
                                </span>
                            )}
                        </div>
                        {currentProject.puedeEditar !== false && activeModalidad !== 'GRUPO' && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeModalidad === 'INDIVIDUAL') {
                                        handleSwitchModalidad('EQUIPO');
                                    }
                                    setIsAddModalOpen(true);
                                }}
                                className="btn-vercel-primary !py-1 !px-2.5 !text-[10px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                title={activeModalidad === 'INDIVIDUAL' ? "Convertir a Equipo y Añadir Integrante" : "Añadir Docente o Estudiante al Equipo"}
                            >
                                <UserPlus size={12} />
                                <span>{activeModalidad === 'INDIVIDUAL' ? 'Convertir a Equipo y Añadir' : 'Añadir Integrante'}</span>
                            </button>
                        )}
                    </div>

                    {investigadores.filter((member: any) => member.activo !== false).length === 0 ? (
                        <div className="p-6 rounded-xl border border-dashed border-border-thin text-center text-[10px] text-text-dim uppercase tracking-wider font-mono">
                            {tieneGrupo ? 'Sin investigadores activos' : 'Sin integrantes registrados en el equipo'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {investigadores.filter((member: any) => member.activo !== false).map((member: any, idx: number) => {
                                const isDirector = member.rol?.toLowerCase().includes('director') || member.esDirector === true || member.EsDirector === true;
                                
                                // Normalized variables to support both camelCase and snake_case API data
                                const nivelAcademico = member.nivelAcademico ?? member.nivel_academico ?? 'Tercer Nivel';
                                const horasSemanales = member.horasSemanales ?? member.horas_semanales ?? null;
                                const horasDisponibles = member.horasDisponibles ?? member.horas_disponibles;
                                const horasAsignadas = member.horasAsignadas ?? member.horas_asignadas ?? 0;

                                const isEstudiante = member.rol?.toLowerCase().includes('estudiante') || nivelAcademico === 'Pregrado';

                                return (
                                    <div
                                        key={member.cedula || idx}
                                        className="p-4 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover hover:bg-surface-hover/20 transition-all flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4"
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
                                                    {isDirector && currentProject.puedeEditar !== false && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenTransferModal(member)}
                                                            className="btn-vercel-secondary !py-0.5 !px-2 !text-[9px] !h-auto flex items-center gap-1 transition-all"
                                                            title="Transferir Dirección formalmente"
                                                        >
                                                            <RefreshCw size={8} /> Relevo
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-text-dim flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {(() => {
                                                        const rawCareers = member.carrerasDisponibles || member.carrera || '';
                                                        const cleanOptions = rawCareers.split(',')
                                                            .map((s: string) => s.trim())
                                                            .filter((s: string) => s.length > 0 && s !== 'Docente' && s !== 'Estudiante');
                                                        
                                                        if (cleanOptions.length > 1) {
                                                            const isAlreadySelected = cleanOptions.includes(member.carrera);
                                                            const currentValue = isAlreadySelected ? member.carrera : '';
                                                            
                                                            return (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-[8px] font-bold text-warning uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                                                            <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-500" /> Elegir Carrera de Asociación
                                                                        </span>
                                                                        <div className="w-[220px]">
                                                                            <GeistSelect<string>
                                                                                value={currentValue}
                                                                                onChange={(val) => onUpdateMember(member.cedula, 'carrera', val)}
                                                                                placeholder="Seleccione una carrera..."
                                                                                className="!py-1 !px-2 !text-[9px] !rounded border-warning/40"
                                                                            >
                                                                                <option value="">Seleccione una carrera...</option>
                                                                                {cleanOptions.map((opt: string) => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </GeistSelect>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return member.carrera ? (
                                                            <span className="text-[10px] text-brand-light font-semibold truncate max-w-[200px]" title={member.carrera}>
                                                                {member.carrera}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                    <span className="font-mono">C.I. {member.cedula || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-4 w-full 2xl:w-auto 2xl:justify-end">
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

                                            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full 2xl:w-auto">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full 2xl:w-auto">
                                                    <div className="flex flex-col gap-1 w-full 2xl:w-36 min-w-0">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Rol</span>
                                                        <GeistSelect<string>
                                                            value={normalizeRole(member.rol)}
                                                            disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                            onChange={(val) => onUpdateMember(member.cedula, 'rol', val)}
                                                            className="!py-2 !rounded-lg !text-xs"
                                                        >
                                                            {isEstudiante ? (
                                                                <option value="Semillerista">Semillerista</option>
                                                            ) : (
                                                                <>
                                                                    <option value="Director de Proyecto">Director de Proyecto</option>
                                                                    <option value="Co-Investigador">Co-Investigador</option>
                                                                </>
                                                            )}
                                                        </GeistSelect>
                                                    </div>

                                                    <div className="flex flex-col gap-1 w-full 2xl:w-36 min-w-0">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Nivel</span>
                                                        <GeistSelect<string>
                                                            value={nivelAcademico}
                                                            disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                            onChange={(val) => onUpdateMember(member.cedula, 'nivelAcademico', val)}
                                                            className="!py-2 !rounded-lg !text-xs"
                                                        >
                                                            <option value="Tercer Nivel">Tercer Nivel</option>
                                                            <option value="Cuarto Nivel (Maestría)">Maestría</option>
                                                            <option value="Cuarto Nivel (PhD)">PhD</option>
                                                            <option value="Pregrado">Pregrado</option>
                                                        </GeistSelect>
                                                    </div>

                                                    <div className="flex flex-col gap-1 w-full 2xl:w-20 min-w-0">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Horas</span>
                                                        <input
                                                            type="number"
                                                            value={horasSemanales ?? ''}
                                                            disabled={currentProject.puedeEditar === false}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                onUpdateMember(member.cedula, 'horasSemanales', val === '' ? '' : (isNaN(parseFloat(val)) ? '' : parseFloat(val)));
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || isNaN(parseFloat(val))) {
                                                                    onUpdateMember(member.cedula, 'horasSemanales', 0);
                                                                }
                                                            }}
                                                            placeholder="0"
                                                            min="0"
                                                            max="40"
                                                            className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all w-full max-w-full min-w-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>

                                                {currentProject.puedeEditar !== false && activeModalidad !== 'GRUPO' && (
                                                    <button
                                                        type="button"
                                                        disabled={activeModalidad === 'INDIVIDUAL'}
                                                        onClick={() => onRemoveMember(member.cedula)}
                                                        className={`p-2 rounded-lg transition-all self-end md:self-end md:mb-[3px] shrink-0 ${activeModalidad === 'INDIVIDUAL' ? 'opacity-25 cursor-not-allowed text-text-dim' : 'text-text-dim hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 cursor-pointer'}`}
                                                        title={activeModalidad === 'INDIVIDUAL' ? "En modalidad Individual el Director es obligatorio. Use Relevo o cambie a Equipo." : "Remover Integrante"}
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
                                                    <GeistSelect<string>
                                                        value={teamChangeForm.tipo}
                                                        onChange={(val) => {
                                                            setTeamChangeForm(prev => ({ ...prev, tipo: val, cedulaObjetivo: '' }));
                                                            setRequestSearchQuery('');
                                                        }}
                                                        className="!py-2 !rounded-md !text-xs"
                                                    >
                                                        <option value="ALTA">{tieneGrupo ? 'Alta de integrante' : 'Alta de personal'}</option>
                                                        <option value="BAJA">{tieneGrupo ? 'Baja de integrante' : 'Baja de personal'}</option>
                                                        <option value="CAMBIO_DIRECTOR">Cambio de director</option>
                                                        <option value="CAMBIO_GRUPO">Cambio de grupo de investigación</option>
                                                    </GeistSelect>
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
                                                        <GeistSelect<string>
                                                            value={teamChangeForm.rolPropuesto}
                                                            onChange={(val) => {
                                                                setTeamChangeForm(prev => ({ ...prev, rolPropuesto: val, cedulaObjetivo: '' }));
                                                                setRequestSearchQuery('');
                                                            }}
                                                            className="!py-2 !rounded-md !text-xs"
                                                        >
                                                            <option value="Director de Proyecto" disabled={hasActiveDirector}>
                                                                {hasActiveDirector ? "Director de Proyecto (Usar relevo de Director)" : "Director de Proyecto"}
                                                            </option>
                                                            <option value="Co-Investigador">Co-Investigador</option>
                                                            <option value="Semillerista">Semillerista</option>
                                                        </GeistSelect>
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
                                                        <GeistSelect<string>
                                                            value={teamChangeForm.cedulaObjetivo}
                                                            onChange={(val) => setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: val }))}
                                                            placeholder="-- Seleccione Grupo Destino --"
                                                            className="!py-2 !rounded-md !text-xs"
                                                        >
                                                            <option value="">-- Seleccione Grupo Destino --</option>
                                                            {approvedGroups.map((g: any) => (
                                                                <option key={g.uuid} value={g.uuid}>
                                                                    {g.nombre} {g.siglas ? `(${g.siglas})` : ''}
                                                                </option>
                                                            ))}
                                                        </GeistSelect>
                                                    ) : teamChangeForm.tipo === 'BAJA' ? (
                                                        <GeistSelect<string>
                                                            value={teamChangeForm.cedulaObjetivo}
                                                            onChange={(val) => setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: val }))}
                                                            placeholder={tieneGrupo ? '-- Seleccione Integrante --' : '-- Seleccione Personal --'}
                                                            className="!py-2 !rounded-md !text-xs"
                                                        >
                                                            <option value="">{tieneGrupo ? '-- Seleccione Integrante --' : '-- Seleccione Personal --'}</option>
                                                            {investigadores.filter((m: any) => m.activo !== false).map((m: any) => (
                                                                <option key={m.cedula} value={m.cedula}>
                                                                    {formatNombre(m.nombre)} ({m.cedula}) - {m.rol}
                                                                </option>
                                                            ))}
                                                        </GeistSelect>
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
                                                                            <div className="absolute left-0 right-0 top-full mt-1.5 popover-vercel z-30 custom-scrollbar">
                                                                                {(!requestSearchQuery.trim() || requestSearchQuery.length < 2) ? (
                                                                                    <>
                                                                                        <div className="popover-header-vercel">
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
                                                                                                    className="popover-item-vercel transition-colors"
                                                                                                >
                                                                                                    <div>
                                                                                                        <p className="font-medium text-text-main text-xs">{formatNombre(su.nombre)}</p>
                                                                                                        <p className="text-text-dim font-mono text-[10px] mt-0.5">C.I. {su.cedula}</p>
                                                                                                    </div>
                                                                                                    <span className="badge-vercel text-[10px] font-medium px-2 py-0.5 badge-vercel-violet">
                                                                                                        Docente
                                                                                                    </span>
                                                                                                </button>
                                                                                            ))
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="popover-header-vercel">
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
                                                                                                    className="popover-item-vercel transition-colors"
                                                                                                >
                                                                                                    <div>
                                                                                                        <p className="font-medium text-text-main text-xs">{formatNombre(su.nombre)}</p>
                                                                                                        <p className="text-text-dim font-mono text-[10px] mt-0.5">C.I. {su.cedula}</p>
                                                                                                    </div>
                                                                                                    <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${su.tipo === 'profesor' ? 'badge-vercel-violet' : 'badge-vercel-success'}`}>
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

            {/* Drawer Lateral a la Derecha para Añadir Integrantes (Estilo Vercel Geist DIITRA) */}
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
                                        Docentes con horas de investigación y estudiantes con matrícula activa (SIGAFI)
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
                                subtitle="Filtrado en tiempo real con SIGAFI por carga horaria y matrícula vigente."
                                onAddMember={handleAddMemberFromSearch}
                                existingCedulas={existingCedulas}
                                allowedTypes={['DOCENTE', 'ESTUDIANTE']}
                                defaultType="DOCENTE"
                                soloConHorasDocentes={true}
                                estadoEstudiante="ACTIVO"
                                variant="embedded"
                                context="PROJECT"
                                hasDirector={hasActiveDirector}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
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

