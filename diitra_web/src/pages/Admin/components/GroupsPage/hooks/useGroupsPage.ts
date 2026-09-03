import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../../../api/axios_config';
import { useAuth } from '../../../../../api/AuthContext';
import type { Group, ResearchLine, Domain, Career, PendingDraft, ConfirmDialogState } from '../types';
import { useGroupsReview } from './useGroupsReview';

export function useGroupsPage() {
    const { user, isAdmin } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open');

    const [groups, setGroups] = useState<Group[]>([]);
    const [lines, setLines] = useState<ResearchLine[]>([]);
    const [dominios, setDominios] = useState<Domain[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'my'>('my');

    // Drawer / Modal states for creation and edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Draft state
    const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);

    // Detail drawer state
    const [detailGroup, setDetailGroup] = useState<Group | null>(null);
    const [detailGroupIsEditing, setDetailGroupIsEditing] = useState(false);
    const [lastActiveGroupId, setLastActiveGroupId] = useState<string | null>(null);
    const lastOpenedUuidRef = useRef<string | null>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    // Carga de catálogos estáticos (una sola vez al montar)
    useEffect(() => {
        let isMounted = true;
        const loadCatalogs = async () => {
            try {
                const [linesRes, dominiosRes, carrerasRes] = await Promise.all([
                    api.get('/Convocatorias/catalogos/lineas'),
                    api.get('/catalogs/dominios'),
                    api.get('/catalogs/carreras')
                ]);
                if (isMounted) {
                    setLines(linesRes.data || []);
                    setDominios(dominiosRes.data || []);
                    setCarreras(carrerasRes.data || []);
                }
            } catch (err) {
                console.error("Error fetching static catalogs:", err);
            }
        };
        loadCatalogs();
        return () => { isMounted = false; };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const groupsRes = await api.get(`/Groups?search=${encodeURIComponent(search)}`);
            setGroups(groupsRes.data || []);

            if (detailGroup) {
                const updated = (groupsRes.data || []).find((g: Group) => g.uuid === detailGroup.uuid);
                if (updated) {
                    setDetailGroup(prev => prev ? { ...prev, ...updated } : updated);
                }
            }
        } catch (err) {
            console.error("Error fetching groups data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    // Deep-link handling from notifications, emails, or CommandPalette: ?open=GROUP_UUID
    useEffect(() => {
        if (!openUuid || loading) return;
        if (openUuid === lastOpenedUuidRef.current) return;
        lastOpenedUuidRef.current = openUuid;
        let cancelled = false;

        const clearOpenParam = () => {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('open');
                return next;
            });
        };

        const openFromDeepLink = async () => {
            const target = groups.find(g => g.uuid === openUuid);
            if (target) {
                if (cancelled) return;
                setDetailGroup(target);
                setSearch(target.nombre);
                setLastActiveGroupId(null);
                clearOpenParam();
                return;
            }

            try {
                const res = await api.get(`/Groups/${openUuid}`);
                if (cancelled) return;
                setDetailGroup(res.data);
                setSearch(res.data.nombre);
                setLastActiveGroupId(null);
                clearOpenParam();
            } catch (err) {
                if (cancelled) return;
                console.error('No se pudo abrir el grupo desde el enlace:', openUuid, err);
            }
        };

        openFromDeepLink();
        return () => {
            cancelled = true;
            lastOpenedUuidRef.current = null;
        };
    }, [openUuid, groups, loading, setSearchParams]);

    const handleCloseGroupDetail = () => {
        if (detailGroup) {
            setLastActiveGroupId(detailGroup.uuid);
        }
        setDetailGroup(null);
        setDetailGroupIsEditing(false);
    };

    const refreshDraftMetadata = () => {
        const metaStr = localStorage.getItem('groups_draft_metadata');
        if (metaStr) {
            try {
                setPendingDraft(JSON.parse(metaStr));
            } catch (e) {
                console.error("Error reading draft metadata", e);
                setPendingDraft(null);
            }
        } else {
            setPendingDraft(null);
        }
    };

    useEffect(() => {
        refreshDraftMetadata();

        const handleRefresh = () => refreshDraftMetadata();
        window.addEventListener('diitra:group-draft-cleared', handleRefresh);
        return () => {
            window.removeEventListener('diitra:group-draft-cleared', handleRefresh);
        };
    }, []);

    const handleRestoreDraft = () => {
        if (!pendingDraft) return;

        if (pendingDraft.type === 'new') {
            setEditingGroup(null);
            setIsReadOnly(false);
            setIsModalOpen(true);
        } else if (pendingDraft.type === 'edit' && pendingDraft.uuid) {
            const group = groups.find(g => g.uuid === pendingDraft.uuid);
            if (group) {
                setDetailGroup(group);
                setDetailGroupIsEditing(true);
                setLastActiveGroupId(null);
            } else {
                alert("No se pudo encontrar el grupo original en la lista. Es posible que haya sido eliminado o no tenga permisos.");
            }
        }
    };

    const handleDiscardDraft = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Descartar Borrador',
            message: '¿Está seguro de descartar el borrador guardado? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => {
                localStorage.removeItem('groups_draft_metadata');
                localStorage.removeItem('new_group_form_draft');
                if (pendingDraft?.type === 'edit' && pendingDraft.uuid) {
                    localStorage.removeItem(`edit_group_form_draft_${pendingDraft.uuid}`);
                }
                setPendingDraft(null);
            }
        });
    };

    const handleOpenModal = (group?: Group, readOnly = false) => {
        setIsReadOnly(readOnly);
        setEditingGroup(group || null);
        setIsModalOpen(true);
    };

    const handleDelete = (uuid: string, name: string) => {
        const title = isAdmin ? 'Desactivar Grupo' : 'Eliminar Propuesta';
        const confirmMsg = isAdmin
            ? `¿Está seguro de desactivar el grupo "${name}"?`
            : `¿Está seguro de eliminar su propuesta de grupo "${name}"? Se enviará a la papelera de reciclaje y se conservará por 30 días antes de eliminarse de forma automática y definitiva.`;

        setConfirmDialog({
            isOpen: true,
            title,
            message: confirmMsg,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/Groups/${uuid}`);
                    fetchData();
                } catch (error: any) {
                    console.error('Error deactivating/deleting group:', error);
                    alert('No se pudo procesar la acción: ' + error.message);
                }
            }
        });
    };

    const review = useGroupsReview({
        fetchData,
        setConfirmDialog,
        setDetailGroup
    });

    return {
        user,
        isAdmin,
        groups,
        lines,
        dominios,
        carreras,
        loading,
        search,
        setSearch,
        viewMode,
        setViewMode,
        isModalOpen,
        setIsModalOpen,
        isReadOnly,
        editingGroup,
        handleOpenModal,
        pendingDraft,
        setPendingDraft,
        handleRestoreDraft,
        handleDiscardDraft,
        detailGroup,
        setDetailGroup,
        detailGroupIsEditing,
        setDetailGroupIsEditing,
        lastActiveGroupId,
        setLastActiveGroupId,
        handleCloseGroupDetail,
        handleDelete,
        confirmDialog,
        setConfirmDialog,
        fetchData,
        review
    };
}
