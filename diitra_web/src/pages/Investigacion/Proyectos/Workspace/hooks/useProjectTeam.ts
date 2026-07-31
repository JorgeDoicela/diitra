import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../../api/axios_config';
import { useAuth } from '../../../../../api/AuthContext';
import { useNotifications } from '../../../../../api/NotificationsContext';
import { useConfirm } from '../../../../../api/ConfirmContext';
import { mapInvestigador } from './useProjectCore';

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
                    api.get('/catalogs/dominios'),
                    api.get('/catalogs/carreras'),
                    api.get('/Convocatorias/catalogos/lineas')
                ]);
                setDominios(domRes.data || []);
                setCarreras(carRes.data || []);
                setLines(linRes.data || []);
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
                    api.get('/catalogs/search-users?tipo=profesor'),
                    api.get('/catalogs/search-users?tipo=alumno')
                ]);
                setAvailableProfessors(profRes.data || []);
                setAvailableStudents(alumRes.data || []);
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

        const targetTipo = (teamChangeForm.tipo === 'CAMBIO_DIRECTOR') ? 'profesor' :
            (['Semillerista', 'SEMILLERISTA'].includes(teamChangeForm.rolPropuesto) ? 'alumno' : 'profesor');

        const isAlreadySelected = (targetTipo === 'profesor' ? availableProfessors : availableStudents)
            .some(u => u.nombre === requestSearchQuery);
        if (isAlreadySelected) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsRequestSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(requestSearchQuery)}&tipo=${targetTipo}`);
                setRequestSearchResults(res.data || []);
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
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(transferSearchQuery)}`);
                setTransferSearchResults(res.data || []);
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
    }, [grupoInvestigacion, approvedGroups]);

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
            const groupMembers = groupDetail.miembros || [];

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
                        const searchRes = await api.get(`/catalogs/search-users`, {
                            params: { q: ced }
                        });
                        const found = (searchRes.data || []).find((u: any) => u.cedula === ced);
                        if (found) {
                            memberHoursMap[ced] = {
                                horasDisponibles: found.horasDisponibles ?? found.horas_disponibles ?? 0,
                                horasAsignadas: found.horasAsignadas ?? found.horas_asignadas ?? 0
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
                        const groupRol = m.rol || "";
                        let projectRol = "Co-Investigador";
                        if (groupRol.toLowerCase().includes("coordinador") || groupRol.toLowerCase().includes("director")) {
                            const hasDirector = updatedMembers.some(inv => inv.rol?.toLowerCase().includes("director"));
                            projectRol = hasDirector ? "Co-Investigador" : "Director de Proyecto";
                        } else if (groupRol.toLowerCase().includes("estudiante") || groupRol.toLowerCase().includes("alumno") || groupRol.toLowerCase().includes("semillerista")) {
                            projectRol = "Semillerista";
                        } else if (groupRol.toLowerCase().includes("tecnico") || groupRol.toLowerCase().includes("técnico")) {
                            projectRol = "Co-Investigador";
                        }

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
                    tieneGrupoInvestigacion: hasGroup
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

    const handleUpdateMember = (cedula: string, field: string, value: any) => {
        if (tieneGrupo && field !== 'horasSemanales') {
            addToast("Acción no permitida", "En proyectos asociativos la edición del equipo se realiza únicamente en /grupos.", "warning");
            return;
        }
        setInvestigadores(prev => prev.map(inv => inv.cedula === cedula ? { ...inv, [field]: value } : inv));
    };

    const handleRemoveMember = (cedula: string) => {
        if (tieneGrupo) {
            addToast("Acción no permitida", "No puedes remover integrantes de un grupo aprobado desde aquí. Hazlo en la sección de grupos.", "warning");
            return;
        }

        setInvestigadores(prev => prev.filter(inv => inv.cedula !== cedula));
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
                    tieneGrupoInvestigacion: tieneGrupo
                }
            });
            if (res.data.success) {
                addToast(
                    tieneGrupo ? "Equipo de Trabajo" : "Personal del Proyecto",
                    tieneGrupo ? "¡Equipo de trabajo guardado y sincronizado con éxito!" : "¡Personal del proyecto guardado con éxito!",
                    "success"
                );

                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores((refreshed.data.investigadores || []).map(mapInvestigador));

                const groupUuid = refreshed.data.grupo_investigacion_uuid ?? refreshed.data.grupoInvestigacionUuid ?? refreshed.data.grupo_investigacion ?? refreshed.data.grupoInvestigacion ?? '';
                const hasGroup = !!(refreshed.data.tiene_grupo_investigacion ?? refreshed.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
                setTieneGrupo(hasGroup);
                setGrupoInvestigacion(groupUuid);

                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: hasGroup,
                    grupoInvestigacion: refreshed.data.grupo_investigacion ?? refreshed.data.grupoInvestigacion ?? null,
                    grupoInvestigacionUuid: refreshed.data.grupo_investigacion_uuid ?? refreshed.data.grupoInvestigacionUuid ?? null
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
                setInvestigadores((refreshed.data.investigadores || []).map(mapInvestigador));
            } else {
                addToast("Error de revisión", res.data?.message || "No se pudo revisar la solicitud.", "error");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "No se pudo revisar la solicitud.";
            addToast("Error de revisión", errMsg, "error");
        }
    };

    const handleToggleTieneGrupo = async (val: boolean) => {
        if (!val) {
            const director = investigadores.find(inv => inv.rol?.toLowerCase().includes('director')) || investigadores[0];
            if (investigadores.length > 1) {
                if (await confirm({
                    title: "Trabajo Individual",
                    message: "Al cambiar a Trabajo Individual, se removerán los demás co-investigadores y estudiantes. ¿Deseas continuar?",
                    confirmText: "Continuar",
                    cancelText: "Cancelar",
                    variant: "warning"
                })) {
                    setInvestigadores(director ? [director] : []);
                    setTieneGrupo(false);
                    setGrupoInvestigacion('');
                    lastSyncedGroupRef.current = null;
                }
            } else {
                setTieneGrupo(false);
                setGrupoInvestigacion('');
                lastSyncedGroupRef.current = null;
            }
        } else {
            setTieneGrupo(true);
        }
    };

    const populateTeamFromProject = useCallback((data: any) => {
        if (!data) return;
        setInvestigadores((data.investigadores || []).map(mapInvestigador));
        const groupUuid = data.grupo_investigacion_uuid ?? data.grupoInvestigacionUuid ?? data.grupo_invest_uuid ?? data.grupoInvestigacion ?? '';
        const hasGroup = !!(data.tiene_grupo_investigacion ?? data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
        setTieneGrupo(hasGroup);
        setGrupoInvestigacion(groupUuid);
        if (data.estado !== 'Prepropuesta' && data.estado !== 'Prepropuesta Rechazada') {
            fetchTeamChangeRequests(data.uuid);
        }
    }, [fetchTeamChangeRequests]);

    return {
        investigadores,
        setInvestigadores,
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
        handleSaveTeam,
        handleCreateTeamChangeRequest,
        handleReviewTeamChangeRequest,
        handleToggleTieneGrupo,
        populateTeamFromProject,
        formatCareerName
    };
}
