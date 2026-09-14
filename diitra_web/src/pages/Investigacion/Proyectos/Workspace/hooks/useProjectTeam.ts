import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../../../../api/axios_config';
import { fetchCatalogCached } from '../../../../../api/catalogsCache';
import { useAuth } from '../../../../../api/AuthContext';
import { useNotifications } from '../../../../../api/NotificationsContext';
import { useConfirm } from '../../../../../api/ConfirmContext';
import { mapInvestigador } from './useProjectCore';
import { mapGroupRoleToProjectRole, isProjectDirector, PROJECT_ROLES } from '../../../../../utils/roleCatalog';

export const formatCareerName = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
};

export function useProjectTeam(
    currentProject: any,
    setCurrentProject: React.Dispatch<React.SetStateAction<any>>,
    resolvedProjectUuid: string | null,
    isLoadingProject: boolean,
    _isPreproposalState: boolean
) {
    const { user, isAdmin, roles } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [modalidadEquipo, setModalidadEquipo] = useState<'INDIVIDUAL' | 'EQUIPO' | 'GRUPO'>('EQUIPO');
    const [tieneGrupo, setTieneGrupo] = useState<boolean>(false);
    const [grupoInvestigacion, setGrupoInvestigacion] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [isSyncingGroupMembers, setIsSyncingGroupMembers] = useState(false);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [teamChangeRequests, setTeamChangeRequests] = useState<any[]>([]);
    const [isLoadingTeamChangeRequests, setIsLoadingTeamChangeRequests] = useState(false);
    const [isSubmittingTeamChangeRequest, setIsSubmittingTeamChangeRequest] = useState(false);
    const [teamChangeForm, setTeamChangeForm] = useState({
        tipo: 'ALTA',
        cedulaObjetivo: '',
        rolPropuesto: 'Co-Investigador',
        motivo: '',
        resolucionReferencia: ''
    });

    const [availableProfessors, setAvailableProfessors] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [requestSearchQuery, setRequestSearchQuery] = useState('');
    const [requestSearchResults, setRequestSearchResults] = useState<any[]>([]);
    const [isRequestSearching, setIsRequestSearching] = useState(false);
    const [showRequestSearchResults, setShowRequestSearchResults] = useState(false);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferDirector, setTransferDirector] = useState<any>(null);
    const [newDirectorCedula, setNewDirectorCedula] = useState('');
    const [transferMotivo, setTransferMotivo] = useState('Reasignación institucional');
    const [transferDescripcion, setTransferDescripcion] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferSearchQuery, setTransferSearchQuery] = useState('');
    const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
    const [isTransferSearching, setIsTransferSearching] = useState(false);
    const [showTransferSearchResults, setShowTransferSearchResults] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isChangeRequestsExpanded, setIsChangeRequestsExpanded] = useState(false);
    const lastSyncedGroupRef = useRef<string | null>(null);

    const [detailGroup, setDetailGroup] = useState<any>(null);
    const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
    const [dominios, setDominios] = useState<any[]>([]);
    const [carreras, setCarreras] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);

    const approvedGroups = availableGroups.filter(g => g.activo && g.estado === 'Aprobado');
    const canReviewTeamChanges = isAdmin || roles?.includes('DIITRA_ADMIN');

    const handleOpenGroupDetail = async (groupUuid: string) => {
        const group = approvedGroups.find(g => g.uuid === groupUuid);
        if (!group) return;

        setDetailGroup(group);
        setIsGroupDetailOpen(true);

        if (dominios.length === 0 || carreras.length === 0 || lines.length === 0) {
            try {
                const [domRes, carRes, linRes] = await Promise.all([
                    fetchCatalogCached('/catalogs/dominios', () => api.get('/catalogs/dominios')),
                    fetchCatalogCached('/catalogs/carreras', () => api.get('/catalogs/carreras')),
                    fetchCatalogCached('/Convocatorias/catalogos/lineas', () => api.get('/Convocatorias/catalogos/lineas'))
                ]);
                setDominios(Array.isArray(domRes) ? domRes : (domRes?.data || []));
                setCarreras(Array.isArray(carRes) ? carRes : (carRes?.data || []));
                setLines(Array.isArray(linRes) ? linRes : (linRes?.data || []));
            } catch (e) {
                console.error("Error loading catalogs for GroupDetailDrawer", e);
            }
        }
    };

    const handleCloseGroupDetail = () => {
        setIsGroupDetailOpen(false);
        setDetailGroup(null);
    };

    const fetchGroups = useCallback(async () => {
        try {
            const params: any = {};
            if (!isAdmin && user?.id_referencia) {
                params.memberCedula = user.id_referencia;
            }
            const res = await api.get('/groups', { params });
            setAvailableGroups(res.data || []);
        } catch (err) {
            console.error("[DIITRA] Error al cargar grupos de investigación", err);
        }
    }, [isAdmin, user]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const fetchTeamChangeRequests = useCallback(async (projectUuid?: string) => {
        const uuidToUse = projectUuid || currentProject?.uuid || resolvedProjectUuid;
        if (!uuidToUse) {
            setTeamChangeRequests([]);
            return;
        }
        setIsLoadingTeamChangeRequests(true);
        try {
            const res = await api.get(`/projects/${uuidToUse}/team-change-requests`);
            setTeamChangeRequests(res.data || []);
        } catch (err) {
            console.error("[DIITRA] Error al obtener solicitudes de cambio de equipo", err);
        } finally {
            setIsLoadingTeamChangeRequests(false);
        }
    }, [currentProject?.uuid, resolvedProjectUuid]);

    useEffect(() => {
        const fetchAvailableUsers = async () => {
            try {
                const [profRes, alumRes] = await Promise.all([
                    api.get('/Admin/users?type=DOCENTE&soloConHoras=false&pageSize=100'),
                    api.get('/Admin/users?type=ESTUDIANTE&origenEstudiante=TODOS&estadoEstudiante=TODOS&pageSize=100')
                ]);
                const mapUser = (u: any) => ({
                    cedula: u.id_profesor || u.id_sigafi || '',
                    nombre: u.nombre_completo || u.nombre || '',
                    email: u.email || u.email_institucional || '',
                    carrera: u.carrera || '',
                    telefono: '',
                    nivelAcademico: 'Tercer Nivel',
                    horasDisponibles: u.horas_investigacion || 0,
                    horasAsignadas: u.horas_asignadas || 0,
                    id_usuario: u.id_usuario || 0,
                    tipo: u.type === 'ESTUDIANTE' ? 'alumno' : 'profesor'
                });
                setAvailableProfessors((profRes.data?.items || []).map(mapUser));
                setAvailableStudents((alumRes.data?.items || []).map(mapUser));
            } catch (err) {
                console.error("[DIITRA] Error fetching available users for request form", err);
            }
        };
        if (resolvedProjectUuid && isChangeRequestsExpanded) {
            fetchAvailableUsers();
        }
    }, [resolvedProjectUuid, isChangeRequestsExpanded]);

    useEffect(() => {
        if (!requestSearchQuery.trim() || requestSearchQuery.length < 2) {
            setRequestSearchResults([]);
            return;
        }

        const isStudentRole = ['Semillerista', 'SEMILLERISTA', 'Auxiliar de Investigación', 'alumno'].some(r => teamChangeForm.rolPropuesto.toLowerCase().includes(r.toLowerCase()));
        const targetType = (teamChangeForm.tipo === 'CAMBIO_DIRECTOR') ? 'DOCENTE' : (isStudentRole ? 'ESTUDIANTE' : 'DOCENTE');

        const isAlreadySelected = (targetType === 'DOCENTE' ? availableProfessors : availableStudents)
            .some(u => u.nombre === requestSearchQuery);
        if (isAlreadySelected) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsRequestSearching(true);
            try {
                const endpoint = `/Admin/users?type=${targetType}&soloConHoras=false&estadoEstudiante=TODOS&origenEstudiante=TODOS&search=${encodeURIComponent(requestSearchQuery.trim())}&pageSize=30`;
                const res = await api.get(endpoint);
                const mapped = (res.data?.items || []).map((u: any) => ({
                    cedula: u.id_profesor || u.id_sigafi || '',
                    nombre: u.nombre_completo || u.nombre || '',
                    email: u.email || u.email_institucional || '',
                    carrera: u.carrera || '',
                    telefono: '',
                    nivelAcademico: 'Tercer Nivel',
                    horasDisponibles: u.horas_investigacion || 0,
                    horasAsignadas: u.horas_asignadas || 0,
                    id_usuario: u.id_usuario || 0,
                    tipo: targetType === 'ESTUDIANTE' ? 'alumno' : 'profesor'
                }));
                setRequestSearchResults(mapped);
                setShowRequestSearchResults(true);
            } catch (err) {
                console.error("[DIITRA] Error searching users", err);
            } finally {
                setIsRequestSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [requestSearchQuery, teamChangeForm.rolPropuesto, teamChangeForm.tipo, availableProfessors, availableStudents]);

    useEffect(() => {
        if (!transferSearchQuery.trim()) {
            setTransferSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            setIsTransferSearching(true);
            try {
                const res = await api.get(`/Admin/users?type=DOCENTE&soloConHoras=false&search=${encodeURIComponent(transferSearchQuery.trim())}&pageSize=30`);
                const mapped = (res.data?.items || []).map((u: any) => ({
                    cedula: u.id_profesor || u.id_sigafi || '',
                    nombre: u.nombre_completo || u.nombre || '',
                    email: u.email || u.email_institucional || '',
                    carrera: u.carrera || '',
                    telefono: '',
                    nivelAcademico: 'Tercer Nivel',
                    horasDisponibles: u.horas_investigacion || 0,
                    horasAsignadas: u.horas_asignadas || 0,
                    id_usuario: u.id_usuario || 0,
                    tipo: 'profesor'
                }));
                setTransferSearchResults(mapped);
                setShowTransferSearchResults(true);
            } catch (err) {
                console.error("[DIITRA] Error al buscar directores", err);
            } finally {
                setIsTransferSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [transferSearchQuery]);

    useEffect(() => {
        if (!grupoInvestigacion || approvedGroups.length === 0) return;

        const alreadyUuid = approvedGroups.some(g => g.uuid === grupoInvestigacion);
        if (alreadyUuid) return;

        const byLegacyName = approvedGroups.find(g => g.nombre === grupoInvestigacion || g.siglas === grupoInvestigacion);
        if (byLegacyName?.uuid) {
            setGrupoInvestigacion(byLegacyName.uuid);
        }
    }, [approvedGroups, grupoInvestigacion]);

    const handleSyncGroupMembers = useCallback(async (options?: { groupUuid?: string; silent?: boolean }) => {
        const targetGroupUuid = options?.groupUuid ?? grupoInvestigacion;
        const silent = options?.silent ?? false;

        if (!targetGroupUuid) {
            if (!silent) {
                addToast("Sincronización", "Por favor seleccione un grupo de investigación adscrito primero.", "warning");
            }
            return;
        }

        const selectedGroup = approvedGroups.find(g => g.uuid === targetGroupUuid);
        if (!selectedGroup) {
            if (!silent) {
                addToast("Sincronización", "Debe seleccionar un grupo aprobado y activo de la lista institucional.", "error");
            }
            return;
        }

        setIsSyncingGroupMembers(true);
        try {
            const res = await api.get(`/groups/${selectedGroup.uuid}`);
            const groupDetail = res.data;
            const groupMembers = groupDetail?.miembros || [];
            if (groupMembers.length === 0) {
                if (!silent) {
                    addToast("Sincronización", "El grupo seleccionado no tiene miembros activos registrados.", "warning");
                }
                return;
            }

            const memberHoursMap: Record<string, { horasDisponibles: number, horasAsignadas: number }> = {};
            const activeMembers = groupMembers.filter((m: any) => m.activo !== false && m.cedula?.trim());

            if (activeMembers.length > 0) {
                await Promise.all(activeMembers.map(async (m: any) => {
                    const ced = m.cedula.trim();
                    try {
                        const searchRes = await api.get(`/Admin/users`, {
                            params: { search: ced, pageSize: 5 }
                        });
                        const items = searchRes.data?.items || [];
                        const found = items.find((u: any) => (u.id_profesor?.trim() === ced) || (u.id_sigafi?.trim() === ced));
                        if (found) {
                            memberHoursMap[ced] = {
                                horasDisponibles: found.horas_investigacion ?? 0,
                                horasAsignadas: found.horas_asignadas ?? 0
                            };
                        }
                    } catch (e) {
                        console.error("[DIITRA] Error al consultar capacidad de miembro: " + ced, e);
                    }
                }));
            }

            let addedCount = 0;
            setInvestigadores(prev => {
                const updatedMembers = [...prev];

                groupMembers.forEach((m: any) => {
                    const isActive = m.activo !== false;
                    if (!isActive) return;

                    const memberCedula = m.cedula?.trim();
                    if (!memberCedula) return;

                    const exists = updatedMembers.some(inv => inv.cedula?.trim() === memberCedula);
                    if (!exists) {
                        const hasDirector = updatedMembers.some(inv => inv.rol?.toLowerCase().includes("director"));
                        const projectRol = mapGroupRoleToProjectRole(m.rol, m.tipo, hasDirector);

                        const hoursData = memberHoursMap[memberCedula] || { horasDisponibles: 0, horasAsignadas: 0 };

                        updatedMembers.push({
                            nombre: m.nombre_completo || m.nombreCompleto || "Desconocido",
                            cedula: memberCedula,
                            rol: projectRol,
                            nivelAcademico: "Tercer Nivel",
                            telefono: "",
                            horasSemanales: 0,
                            horasDisponibles: hoursData.horasDisponibles,
                            horasAsignadas: hoursData.horasAsignadas,
                            carrera: m.carrera || ""
                        });
                        addedCount++;
                    }
                });

                return addedCount > 0 ? updatedMembers : prev;
            });

            if (addedCount > 0 && !silent) {
                addToast("Equipo actualizado", `Se importaron ${addedCount} miembro${addedCount !== 1 ? 's' : ''} del grupo automáticamente.`, "success");
            } else if (!silent) {
                addToast("Sincronización", "Todos los miembros activos de este grupo ya forman parte del equipo.", "info");
            }
        } catch (err) {
            console.error("[DIITRA] Error al sincronizar miembros del grupo", err);
            lastSyncedGroupRef.current = null;
            addToast("Error de Sincronización", "No se pudieron obtener los miembros del grupo de investigación.", "error");
        } finally {
            setIsSyncingGroupMembers(false);
        }
    }, [grupoInvestigacion, approvedGroups, addToast]);

    useEffect(() => {
        if (!grupoInvestigacion) {
            lastSyncedGroupRef.current = null;
            return;
        }
        if (!tieneGrupo || isLoadingProject || currentProject?.puedeEditar === false) return;
        if (lastSyncedGroupRef.current === grupoInvestigacion) return;

        const selectedGroup = availableGroups.find(
            g => g.uuid === grupoInvestigacion && g.activo && g.estado === 'Aprobado'
        );
        if (!selectedGroup) return;

        lastSyncedGroupRef.current = grupoInvestigacion;
        handleSyncGroupMembers({ groupUuid: grupoInvestigacion, silent: true });
    }, [tieneGrupo, grupoInvestigacion, availableGroups, currentProject?.puedeEditar, isLoadingProject, handleSyncGroupMembers]);

    const handleOpenTransferModal = (director: any) => {
        setTransferDirector(director);
        setNewDirectorCedula('');
        setTransferSearchQuery('');
        setTransferMotivo('Reasignación institucional');
        setTransferDescripcion('');
        setShowTransferModal(true);
    };

    const handleConfirmTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDirectorCedula) {
            addToast("Validación de Relevo", "Por favor selecciona un nuevo director.", "warning");
            return;
        }
        setIsTransferring(true);
        try {
            const res = await api.post(`/projects/${currentProject.uuid}/transfer-director`, {
                nuevo_director_cedula: newDirectorCedula,
                motivo: transferMotivo,
                descripcion: transferDescripcion
            });
            if (res.data.success) {
                addToast("Transferencia Exitosa", "¡Transferencia de dirección realizada con éxito!", "success");
                setShowTransferModal(false);
                const updatedProjectRes = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores((updatedProjectRes.data.investigadores || []).map(mapInvestigador));

                const groupUuid = updatedProjectRes.data.grupo_investigacion_uuid ?? updatedProjectRes.data.grupoInvestigacionUuid ?? updatedProjectRes.data.grupo_investigacion ?? updatedProjectRes.data.grupoInvestigacion ?? '';
                const hasGroup = !!(updatedProjectRes.data.tiene_grupo_investigacion ?? updatedProjectRes.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
                setTieneGrupo(hasGroup);

                setCurrentProject((prev: any) => ({
                    ...prev,
                    investigadores: updatedProjectRes.data.investigadores || [],
                    tieneGrupoInvestigacion: hasGroup
                }));
                window.dispatchEvent(new CustomEvent('diitra-project-team-updated', {
                    detail: {
                        projectUuid: currentProject.uuid,
                        team: updatedProjectRes.data.investigadores || []
                    }
                }));
            } else {
                addToast("Error de Transferencia", res.data.message || "Error al realizar la transferencia.", "error");
            }
        } catch (err: any) {
            console.error("[DIITRA] Error en transferencia de director", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || "Error al realizar la transferencia.";
            addToast("Error de Transferencia", errMsg, "error");
        } finally {
            setIsTransferring(false);
        }
    };

    const hasActiveDirector = useMemo(() => {
        return investigadores.some(inv => isProjectDirector(inv.rol) || inv.esDirector);
    }, [investigadores]);

    const handleUpdateMember = (cedula: string, field: string, value: any) => {
        if (tieneGrupo && field !== 'horasSemanales') {
            addToast("Acción no permitida", "En proyectos asociativos la edición del equipo se realiza únicamente en /grupos.", "warning");
            return;
        }
        setInvestigadores(prev => {
            const isSettingDirector = field === 'rol' && isProjectDirector(value);
            const updated = prev.map(inv => {
                if (inv.cedula === cedula) {
                    return {
                        ...inv,
                        [field]: value,
                        ...(field === 'rol' ? { esDirector: isSettingDirector } : {})
                    };
                }
                // Regla Institucional / CACES: Solo puede existir un único Director de Proyecto en el equipo
                if (isSettingDirector && (isProjectDirector(inv.rol) || inv.esDirector)) {
                    return {
                        ...inv,
                        rol: PROJECT_ROLES.CO_INVESTIGADOR,
                        esDirector: false
                    };
                }
                return inv;
            });

            // Si se cambió el rol y no quedó ningún Director en el equipo, auto-promover al primer integrante elegible (docente)
            if (field === 'rol' && !isSettingDirector) {
                const hasActiveDir = updated.some(inv => (isProjectDirector(inv.rol) || inv.esDirector) && inv.activo !== false);
                if (!hasActiveDir && updated.filter(inv => inv.activo !== false).length > 0) {
                    const activeList = updated.filter(inv => inv.activo !== false);
                    let candidateIdx = activeList.findIndex(inv => inv.cedula !== cedula && (inv.tipo || '').toUpperCase() !== 'ESTUDIANTE');
                    if (candidateIdx === -1) candidateIdx = activeList.findIndex(inv => inv.cedula !== cedula);
                    if (candidateIdx !== -1) {
                        const candidateCedula = activeList[candidateIdx].cedula;
                        return updated.map(inv => inv.cedula === candidateCedula ? { ...inv, rol: PROJECT_ROLES.DIRECTOR, esDirector: true } : inv);
                    }
                }
            }

            return updated;
        });

        if (field === 'rol' && isProjectDirector(value)) {
            addToast("Dirección de Proyecto", "Se ha reasignado la dirección del proyecto. El director anterior pasa a Co-Investigador.", "info");
        }
    };

    const handleRemoveMember = (cedula: string) => {
        if (tieneGrupo) {
            addToast("Acción no permitida", "No puedes remover integrantes de un grupo aprobado desde aquí. Hazlo en la sección de grupos.", "warning");
            return;
        }

        const target = investigadores.find(inv => (inv.cedula || '').trim().toLowerCase() === cedula.trim().toLowerCase());
        const wasDirector = target && (isProjectDirector(target.rol) || target.esDirector || target.EsDirector);
        const remaining = investigadores.filter(inv => (inv.cedula || '').trim().toLowerCase() !== cedula.trim().toLowerCase());

        let promotedMemberName: string | null = null;
        if (remaining.length > 0) {
            const hasOtherActiveDir = remaining.some(inv => isProjectDirector(inv.rol) || inv.esDirector || inv.EsDirector);
            if (!hasOtherActiveDir) {
                let nextIdx = remaining.findIndex(inv => {
                    const cleanTipo = (inv.tipo || inv.TipoParticipante || '').toUpperCase();
                    const nivel = (inv.nivelAcademico || inv.NivelAcademico || '').toLowerCase();
                    return cleanTipo !== 'ESTUDIANTE' && cleanTipo !== 'ALUMNO' && nivel !== 'pregrado';
                });
                if (nextIdx === -1) nextIdx = 0;
                promotedMemberName = remaining[nextIdx].nombre;
            }
        }

        setInvestigadores(prev => {
            const rem = prev.filter(inv => (inv.cedula || '').trim().toLowerCase() !== cedula.trim().toLowerCase());
            if (rem.length === 0) return rem;

            const hasActiveDir = rem.some(inv => isProjectDirector(inv.rol) || inv.esDirector || inv.EsDirector);
            if (!hasActiveDir) {
                let nextIdx = rem.findIndex(inv => {
                    const cleanTipo = (inv.tipo || inv.TipoParticipante || '').toUpperCase();
                    const nivel = (inv.nivelAcademico || inv.NivelAcademico || '').toLowerCase();
                    return cleanTipo !== 'ESTUDIANTE' && cleanTipo !== 'ALUMNO' && nivel !== 'pregrado';
                });
                if (nextIdx === -1) nextIdx = 0;

                return rem.map((inv, idx) => {
                    if (idx === nextIdx) {
                        return {
                            ...inv,
                            rol: PROJECT_ROLES.DIRECTOR,
                            esDirector: true
                        };
                    }
                    return inv;
                });
            }

            return rem;
        });

        if (promotedMemberName) {
            addToast("Dirección Transferida", `Se removió al director. La dirección del proyecto fue transferida automáticamente a ${promotedMemberName}.`, "info");
        } else {
            addToast("Integrante removido", "El integrante ha sido retirado del equipo del proyecto.", "success");
        }
    };

    const handleSaveTeam = async () => {
        setIsSavingTeam(true);
        setTeamMessage(null);
        try {
            if (tieneGrupo && !grupoInvestigacion) {
                addToast("Validación CACES", "Para proyectos asociativos debes seleccionar un grupo de investigación aprobado.", "warning");
                return;
            }

            const payload = investigadores.map(inv => ({
                nombre: inv.nombre,
                cedula: inv.cedula,
                rol: inv.rol,
                nivel_academico: inv.nivelAcademico,
                telefono: inv.telefono || "",
                activo: inv.activo !== false,
                horas_semanales: inv.horasSemanales !== undefined && inv.horasSemanales !== null && inv.horasSemanales !== '' ? parseFloat(inv.horasSemanales) : null
            }));
            const res = await api.patch(`/projects/${currentProject.uuid}/team`, payload, {
                params: {
                    grupoInvestigacion: grupoInvestigacion || null,
                    tieneGrupoInvestigacion: modalidadEquipo === 'GRUPO',
                    modalidadProyecto: modalidadEquipo
                }
            });
            if (res.data.success) {
                const toastTitle = modalidadEquipo === 'GRUPO' 
                    ? "Equipo Asociativo" 
                    : (modalidadEquipo === 'INDIVIDUAL' ? "Proyecto Individual" : "Equipo de Proyecto");
                const toastMsg = modalidadEquipo === 'GRUPO'
                    ? "¡Equipo asociativo guardado y sincronizado con el grupo!"
                    : (modalidadEquipo === 'INDIVIDUAL' ? "¡Datos de investigación individual guardados con éxito!" : "¡Equipo de proyecto guardado con éxito!");

                addToast(toastTitle, toastMsg, "success");

                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                if (refreshed.data) {
                    populateTeamFromProject(refreshed.data);
                }

                setCurrentProject((prev: any) => ({
                    ...prev,
                    investigadores: refreshed.data.investigadores || [],
                    tieneGrupoInvestigacion: hasGroup,
                    grupoInvestigacion: refreshed.data.grupo_investigacion ?? refreshed.data.grupoInvestigacion ?? null,
                    grupoInvestigacionUuid: refreshed.data.grupo_investigacion_uuid ?? refreshed.data.grupoInvestigacionUuid ?? null
                }));
                window.dispatchEvent(new CustomEvent('diitra-project-team-updated', {
                    detail: {
                        projectUuid: currentProject.uuid,
                        team: refreshed.data.investigadores || []
                    }
                }));
                await fetchTeamChangeRequests(currentProject.uuid);
            } else {
                addToast("Error al Guardar", res.data.message || 'Error al guardar los cambios.', "error");
            }
        } catch (err: any) {
            console.error("[DIITRA] Error al guardar equipo de trabajo", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error inesperado al guardar.';
            addToast("Error al Guardar", errMsg, "error");
        } finally {
            setIsSavingTeam(false);
        }
    };

    const handleCreateTeamChangeRequest = async () => {
        if (!currentProject?.uuid) return;
        if (!teamChangeForm.cedulaObjetivo.trim() || !teamChangeForm.motivo.trim()) {
            addToast("Solicitud incompleta", "Debes indicar cédula objetivo y motivo de la solicitud.", "warning");
            return;
        }

        setIsSubmittingTeamChangeRequest(true);
        try {
            const payload = {
                tipo: teamChangeForm.tipo,
                cedula_objetivo: teamChangeForm.cedulaObjetivo.trim(),
                rol_propuesto: teamChangeForm.tipo === 'BAJA' ? null : teamChangeForm.rolPropuesto,
                motivo: teamChangeForm.motivo.trim(),
                resolucion_referencia: teamChangeForm.resolucionReferencia.trim() || null
            };
            const res = await api.post(`/projects/${currentProject.uuid}/team-change-requests`, payload);
            if (res.data?.success) {
                addToast("Solicitud registrada", "La solicitud de cambio quedó registrada para revisión.", "success");
                setTeamChangeForm({
                    tipo: 'ALTA',
                    cedulaObjetivo: '',
                    rolPropuesto: 'Co-Investigador',
                    motivo: '',
                    resolucionReferencia: ''
                });
                setRequestSearchQuery('');
                await fetchTeamChangeRequests(currentProject.uuid);
            } else {
                addToast("No se pudo registrar", res.data?.message || "Error al registrar solicitud.", "error");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Error al registrar solicitud de cambio.';
            addToast("Error de Solicitud", errMsg, "error");
        } finally {
            setIsSubmittingTeamChangeRequest(false);
        }
    };

    const handleReviewTeamChangeRequest = async (requestUuid: string, aprobar: boolean) => {
        if (!currentProject?.uuid) return;
        try {
            const res = await api.patch(`/projects/${currentProject.uuid}/team-change-requests/${requestUuid}/review`, {
                aprobar,
                ejecutar: aprobar,
                observacion_revision: aprobar ? "Aprobado por autoridad competente." : "Rechazado por autoridad competente."
            });
            if (res.data?.success) {
                addToast("Revisión completada", res.data.message || "Solicitud procesada.", "success");
                await fetchTeamChangeRequests(currentProject.uuid);
                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                populateTeamFromProject(refreshed.data);
                setCurrentProject((prev: any) => ({
                    ...prev,
                    investigadores: refreshed.data.investigadores || []
                }));
                window.dispatchEvent(new CustomEvent('diitra-project-team-updated', {
                    detail: {
                        projectUuid: currentProject.uuid,
                        team: refreshed.data.investigadores || []
                    }
                }));
            } else {
                addToast("Error de revisión", res.data?.message || "No se pudo revisar la solicitud.", "error");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "No se pudo revisar la solicitud.";
            addToast("Error de revisión", errMsg, "error");
        }
    };

    const handleSelectModalidad = async (newMod: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO') => {
        if (newMod === modalidadEquipo) return;

        if (newMod === 'INDIVIDUAL') {
            const activeMembers = investigadores.filter(m => m.activo !== false);
            if (activeMembers.length > 1) {
                const confirmed = await confirm({
                    title: "Cambiar a Modalidad Individual",
                    message: "La modalidad Individual es unipersonal y admite exclusivamente al Director del Proyecto. Al cambiar a Individual se conservará al Director y se removerán los demás integrantes. ¿Deseas proceder?",
                    confirmText: "Conservar solo Director y Cambiar",
                    cancelText: "Cancelar"
                });
                if (!confirmed) return;

                const dir = investigadores.find(i => (isProjectDirector(i.rol) || i.esDirector) && i.activo !== false) || investigadores[0];
                setInvestigadores([{ ...dir, rol: PROJECT_ROLES.DIRECTOR, esDirector: true }]);
            }
            setTieneGrupo(false);
            setGrupoInvestigacion('');
            lastSyncedGroupRef.current = null;
            setModalidadEquipo('INDIVIDUAL');
            addToast("Modalidad Individual", "Proyecto configurado en modalidad Individual (unipersonal).", "info");
            return;
        }

        if (newMod === 'EQUIPO') {
            setTieneGrupo(false);
            setGrupoInvestigacion('');
            lastSyncedGroupRef.current = null;
            setModalidadEquipo('EQUIPO');
            addToast("Equipo de Proyecto", "Modalidad Equipo de Proyecto activada. Ahora puedes gestionar libremente directores, co-investigadores y semilleristas.", "info");
            return;
        }

        if (newMod === 'GRUPO') {
            setTieneGrupo(true);
            setModalidadEquipo('GRUPO');
            addToast("Modalidad Asociativa", "Modalidad Asociativa activada. Selecciona un grupo de investigación aprobado para sincronizar a sus miembros.", "info");
            return;
        }
    };

    const handleToggleTieneGrupo = async (val: boolean) => {
        if (val) {
            await handleSelectModalidad('GRUPO');
        } else {
            const activeCount = investigadores.filter(m => m.activo !== false).length;
            await handleSelectModalidad(activeCount > 1 ? 'EQUIPO' : 'INDIVIDUAL');
        }
    };

    const handleAddMember = async (newMember: any) => {
        if (modalidadEquipo === 'GRUPO' || tieneGrupo) {
            addToast("Acción no permitida", "En proyectos asociativos la nómina proviene del grupo de investigación institucional.", "warning");
            return;
        }

        if (modalidadEquipo === 'INDIVIDUAL') {
            const confirmed = await confirm({
                title: "Cambiar a Equipo de Proyecto",
                message: "El proyecto se encuentra en modalidad Individual (unipersonal). Para incorporar más investigadores o semilleristas, el proyecto cambiará a modalidad 'Equipo de Proyecto'. ¿Deseas continuar?",
                confirmText: "Cambiar a Equipo y Añadir",
                cancelText: "Cancelar"
            });
            if (!confirmed) return;
            setModalidadEquipo('EQUIPO');
        }

        const cedula = (newMember.cedula || '').trim();
        if (!cedula) return;

        const exists = investigadores.some(inv => (inv.cedula || '').trim().toLowerCase() === cedula.toLowerCase());
        if (exists) {
            addToast("Ya registrado", "Esta persona ya forma parte del equipo de investigación.", "warning");
            return;
        }

        const hasDirectorAlready = investigadores.some(inv => isProjectDirector(inv.rol) || inv.esDirector);
        let adjusted = { ...newMember };
        if (hasDirectorAlready && isProjectDirector(adjusted.rol)) {
            adjusted.rol = PROJECT_ROLES.CO_INVESTIGADOR;
            adjusted.esDirector = false;
        }

        setInvestigadores(prev => [...prev, adjusted]);
        addToast("Integrante añadido", `${newMember.nombre} se incorporó al equipo del proyecto. Recuerda guardar los cambios.`, "success");
    };

    const populateTeamFromProject = useCallback((data: any) => {
        if (!data) return;
        const mapped = (data.investigadores || []).map(mapInvestigador);

        let hasAssignedDirector = false;
        const normalized = mapped.map((inv: any) => {
            const isStudent = (inv.tipo || '').toUpperCase() === 'ESTUDIANTE' ||
                              (inv.tipo || '').toUpperCase() === 'ALUMNO' ||
                              (inv.nivelAcademico || '').toLowerCase() === 'pregrado' ||
                              (inv.rol || '').toLowerCase().includes('semillerista');

            if (isStudent) {
                return {
                    ...inv,
                    rol: PROJECT_ROLES.SEMILLERISTA,
                    esDirector: false
                };
            }

            const isDir = isProjectDirector(inv.rol) || inv.esDirector;
            if (isDir) {
                if (!hasAssignedDirector && inv.activo !== false) {
                    hasAssignedDirector = true;
                    return {
                        ...inv,
                        rol: PROJECT_ROLES.DIRECTOR,
                        esDirector: true
                    };
                } else {
                    return {
                        ...inv,
                        rol: PROJECT_ROLES.CO_INVESTIGADOR,
                        esDirector: false
                    };
                }
            }

            return inv;
        });

        if (!hasAssignedDirector && normalized.some((i: any) => i.activo !== false)) {
            const activeList = normalized.filter((i: any) => i.activo !== false);
            let firstDocenteIdx = activeList.findIndex((i: any) => (i.nivelAcademico || '').toLowerCase() !== 'pregrado');
            if (firstDocenteIdx === -1) firstDocenteIdx = 0;
            const targetCedula = activeList[firstDocenteIdx].cedula;
            setInvestigadores(normalized.map((i: any) => i.cedula === targetCedula ? { ...i, rol: PROJECT_ROLES.DIRECTOR, esDirector: true } : i));
        } else {
            setInvestigadores(normalized);
        }

        const groupUuid = data.grupo_investigacion_uuid ?? data.grupoInvestigacionUuid ?? data.grupo_invest_uuid ?? data.grupoInvestigacion ?? '';
        const hasGroup = !!(data.tiene_grupo_investigacion ?? data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
        setTieneGrupo(hasGroup);
        setGrupoInvestigacion(groupUuid);

        const rawMod = (data.modalidad_proyecto ?? data.modalidadProyecto ?? '').toUpperCase();
        if (rawMod === 'INDIVIDUAL' || rawMod === 'EQUIPO' || rawMod === 'GRUPO') {
            setModalidadEquipo(rawMod as any);
        } else if (hasGroup) {
            setModalidadEquipo('GRUPO');
        } else if (normalized.filter((i: any) => i.activo !== false).length > 1) {
            setModalidadEquipo('EQUIPO');
        } else {
            setModalidadEquipo('INDIVIDUAL');
        }

        if (data.estado !== 'Prepropuesta' && data.estado !== 'Prepropuesta Rechazada') {
            fetchTeamChangeRequests(data.uuid);
        }
    }, [fetchTeamChangeRequests]);

    return {
        investigadores,
        setInvestigadores,
        hasActiveDirector,
        tieneGrupo,
        setTieneGrupo,
        grupoInvestigacion,
        setGrupoInvestigacion,
        availableGroups,
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
        showTransferModal,
        setShowTransferModal,
        transferDirector,
        newDirectorCedula,
        setNewDirectorCedula,
        transferMotivo,
        setTransferMotivo,
        transferDescripcion,
        setTransferDescripcion,
        isTransferring,
        transferSearchQuery,
        setTransferSearchQuery,
        transferSearchResults,
        isTransferSearching,
        showTransferSearchResults,
        setShowTransferSearchResults,
        isHistoryExpanded,
        setIsHistoryExpanded,
        isChangeRequestsExpanded,
        setIsChangeRequestsExpanded,
        detailGroup,
        setDetailGroup,
        isGroupDetailOpen,
        dominios,
        carreras,
        lines,
        fetchTeamChangeRequests,
        handleOpenGroupDetail,
        handleCloseGroupDetail,
        handleSyncGroupMembers,
        handleOpenTransferModal,
        handleConfirmTransfer,
        handleUpdateMember,
        handleRemoveMember,
        handleAddMember,
        handleSaveTeam,
        handleCreateTeamChangeRequest,
        handleReviewTeamChangeRequest,
        modalidadEquipo,
        setModalidadEquipo,
        handleSelectModalidad,
        handleToggleTieneGrupo,
        populateTeamFromProject,
        formatCareerName
    };
}
