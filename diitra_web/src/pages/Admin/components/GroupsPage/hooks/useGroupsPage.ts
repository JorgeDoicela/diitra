import { useState, useEffect } from 'react';
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

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const promises: Promise<any>[] = [
                api.get(`/Groups?search=${search}`),
                api.get('/Convocatorias/catalogos/lineas'),
                api.get('/catalogs/dominios'),
                api.get('/catalogs/carreras')
            ];

            const [groupsRes, linesRes, dominiosRes, carrerasRes] = await Promise.all(promises);
            setGroups(groupsRes.data);
            setLines(linesRes.data);
            setDominios(dominiosRes.data);
            setCarreras(carrerasRes.data);

            if (detailGroup) {
                const updated = groupsRes.data.find((g: Group) => g.uuid === detailGroup.uuid);
                if (updated) {
                    setDetailGroup(prev => prev ? { ...prev, ...updated } : updated);
                }
            }
        } catch (err) {
            console.error("Error fetching data:", err);
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
                setDetailGroup(target);
                setSearch(target.nombre);
                setLastActiveGroupId(null);
                clearOpenParam();
                return;
            }

            try {
                const res = await api.get(`/Groups/${openUuid}`);
                setDetailGroup(res.data);
                setSearch(res.data.nombre);
                setLastActiveGroupId(null);
                clearOpenParam();
            } catch (err) {
                console.error('No se pudo abrir el grupo desde el enlace:', openUuid, err);
            }
        };

        openFromDeepLink();
    }, [openUuid, groups, loading]);

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
