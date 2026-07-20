import { useState, useEffect, useRef } from 'react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { Group } from '../types';

export const useGroupDetail = (uuid?: string) => {
    const { user, isAdmin, isAuthenticated } = useAuth();

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [fetchedUuid, setFetchedUuid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<number>(1);
    const [selectedProjectUuid, setSelectedProjectUuid] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

    const [uploading, setUploading] = useState(false);
    const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

    const workspaceCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const memberCardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const fetchGroupDetail = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/groups/public/${id}`);
            setSelectedGroup(res.data || null);
            setFetchedUuid(id);
        } catch (e) {
            console.error(e);
            setSelectedGroup(null);
            setFetchedUuid(id);
        } finally {
            setLoading(false);
        }
    };

    // Cargar detalle del grupo
    useEffect(() => {
        window.scrollTo(0, 0);
        if (uuid) {
            fetchGroupDetail(uuid);
        } else {
            setSelectedGroup(null);
            setFetchedUuid(null);
        }
    }, [uuid]);

    // Auto-inicializar las sub-selecciones de los paneles interactivos al cargar el grupo
    useEffect(() => {
        if (selectedGroup) {
            if (selectedGroup.proyectos && selectedGroup.proyectos.length > 0) {
                setSelectedProjectUuid(selectedGroup.proyectos[0].uuid);
            } else {
                setSelectedProjectUuid(null);
            }
            setSelectedMemberId(null);
            setActiveWorkspaceTab(1);
        }
    }, [selectedGroup]);

    // Sincronización de scroll (Scroll-Spy)
    useEffect(() => {
        if (!uuid || !selectedGroup) return;

        const handleScroll = () => {
            const viewportHeight = window.innerHeight;
            const center = viewportHeight / 2;

            // 1. Sincronización del Editor Workspace
            let closestWorkspaceIndex = 0;
            let closestWorkspaceDistance = Infinity;
            for (let idx = 0; idx < 5; idx++) {
                const ref = workspaceCardRefs.current[idx];
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const cardCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(cardCenter - center);

                    if (distance < closestWorkspaceDistance) {
                        closestWorkspaceDistance = distance;
                        closestWorkspaceIndex = idx;
                    }
                }
            }
            setActiveWorkspaceTab(closestWorkspaceIndex + 1);

            // 2. Sincronización de Investigadores (Miembros)
            if (selectedGroup.miembros && selectedGroup.miembros.length > 0) {
                let closestMemberIndex = -1;
                let closestMemberDistance = Infinity;

                const headerRef = document.getElementById('investigadores-header');
                if (headerRef) {
                    const rect = headerRef.getBoundingClientRect();
                    const headerCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(headerCenter - center);
                    if (distance < closestMemberDistance) {
                        closestMemberDistance = distance;
                        closestMemberIndex = -1;
                    }
                }

                selectedGroup.miembros.forEach((_, idx) => {
                    const ref = memberCardRefs.current[idx];
                    if (ref) {
                        const rect = ref.getBoundingClientRect();
                        const cardCenter = rect.top + rect.height / 2;
                        const distance = Math.abs(cardCenter - center);

                        if (distance < closestMemberDistance) {
                            closestMemberDistance = distance;
                            closestMemberIndex = idx;
                        }
                    }
                });

                if (closestMemberIndex === -1) {
                    setSelectedMemberId(null);
                } else {
                    const activeRef = memberCardRefs.current[closestMemberIndex];
                    if (activeRef) {
                        const rect = activeRef.getBoundingClientRect();
                        if (rect.top < viewportHeight && rect.bottom > 0) {
                            setSelectedMemberId(selectedGroup.miembros[closestMemberIndex].idGrupoMiembro);
                        }
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [uuid, selectedGroup]);

    const handleWorkspaceTabClick = (tabId: number) => {
        setActiveWorkspaceTab(tabId);
        const targetRef = workspaceCardRefs.current[tabId - 1];
        if (targetRef) {
            targetRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handleMemberCardClick = (memberId: number, idx: number) => {
        setSelectedMemberId(memberId);
        const targetRef = memberCardRefs.current[idx];
        if (targetRef) {
            targetRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const canEdit = Boolean(isAuthenticated && (
        isAdmin ||
        (user && selectedGroup && (
            user.id_usuario === selectedGroup.idCoordinador ||
            user.id_referencia === selectedGroup.idProfesorCoordinador
        ))
    ));

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroup) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await api.post('/collaboration/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = uploadRes.data.url;

            const currentPhotos = selectedGroup.fotoUrl ? selectedGroup.fotoUrl.split(',') : [];
            const updatedPhotos = [...currentPhotos, newUrl].join(',');

            const payload = {
                nombre: selectedGroup.nombre,
                siglas: selectedGroup.siglas,
                tipo_grupo: selectedGroup.tipoGrupo,
                id_dominio: selectedGroup.idDominio,
                id_coordinador: selectedGroup.idCoordinador,
                id_profesor_coordinador: selectedGroup.idProfesorCoordinador,
                objetivo_general: selectedGroup.objetivoGeneral,
                mision: selectedGroup.mision,
                vision: selectedGroup.vision,
                resolucion_aprobacion: selectedGroup.resolucionAprobacion,
                fecha_creacion: selectedGroup.fechaCreacion,
                categoria_consolidacion: selectedGroup.categoriaConsolidacion,
                link_whatsapp: selectedGroup.linkWhatsapp,
                telefono_coordinador: selectedGroup.telefonoCoordinador,
                lineas_ids: selectedGroup.lineasIds || [],
                carreras_ids: selectedGroup.carrerasIds || [],
                foto_url: updatedPhotos
            };

            await api.put(`/groups/${selectedGroup.uuid}`, payload);
            setSelectedGroup(prev => prev ? { ...prev, fotoUrl: updatedPhotos } : null);
        } catch (error) {
            console.error('Error al subir fotografía:', error);
            alert('No se pudo subir la fotografía.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoUrlToDelete: string) => {
        if (!selectedGroup) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta fotografía de la galería?')) return;

        setUploading(true);
        try {
            const currentPhotos = selectedGroup.fotoUrl ? selectedGroup.fotoUrl.split(',') : [];
            const updatedPhotos = currentPhotos.filter(url => url !== photoUrlToDelete).join(',');

            const payload = {
                nombre: selectedGroup.nombre,
                siglas: selectedGroup.siglas,
                tipo_grupo: selectedGroup.tipoGrupo,
                id_dominio: selectedGroup.idDominio,
                id_coordinador: selectedGroup.idCoordinador,
                id_profesor_coordinador: selectedGroup.idProfesorCoordinador,
                objetivo_general: selectedGroup.objetivoGeneral,
                mision: selectedGroup.mision,
                vision: selectedGroup.vision,
                resolucion_aprobacion: selectedGroup.resolucionAprobacion,
                fecha_creacion: selectedGroup.fechaCreacion,
                categoria_consolidacion: selectedGroup.categoriaConsolidacion,
                link_whatsapp: selectedGroup.linkWhatsapp,
                telefono_coordinador: selectedGroup.telefonoCoordinador,
                lineas_ids: selectedGroup.lineasIds || [],
                carreras_ids: selectedGroup.carrerasIds || [],
                foto_url: updatedPhotos
            };

            await api.put(`/groups/${selectedGroup.uuid}`, payload);
            setSelectedGroup(prev => prev ? { ...prev, fotoUrl: updatedPhotos } : null);
        } catch (error) {
            console.error('Error al eliminar fotografía:', error);
            alert('No se pudo eliminar la fotografía.');
        } finally {
            setUploading(false);
        }
    };

    return {
        selectedGroup,
        fetchedUuid,
        loading,
        activeWorkspaceTab,
        selectedProjectUuid,
        setSelectedProjectUuid,
        selectedMemberId,
        uploading,
        activePhotoUrl,
        setActivePhotoUrl,
        canEdit,
        workspaceCardRefs,
        memberCardRefs,
        handleWorkspaceTabClick,
        handleMemberCardClick,
        handleUploadPhoto,
        handleDeletePhoto
    };
};
