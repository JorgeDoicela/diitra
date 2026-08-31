import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import type { Convocatoria, Periodo, Catalogo } from '../types';

// Constants
const DIAS_PROXIMO_CIERRE = 30;

// Utility functions
export const codigoDuplicadoMessage = (codigo: string) =>
    `Ya existe una convocatoria con el código "${codigo}". Usa un código diferente.`;

export const parseCodigoDuplicadoFromApi = (raw?: string) => {
    if (!raw) return null;
    const duplicateMatch = raw.match(/Duplicate entry '([^']+)'/i);
    if (duplicateMatch) return codigoDuplicadoMessage(duplicateMatch[1]);
    if (raw.toLowerCase().includes('ya existe') && raw.toLowerCase().includes('código')) return raw;
    return null;
};

export const getConvocatoriaSaveErrorMessage = (error: unknown, fallback = 'Error al guardar la convocatoria.') => {
    const data = (error as { response?: { data?: Record<string, string> } })?.response?.data;
    if (!data) return fallback;

    const dupMessage =
        parseCodigoDuplicadoFromApi(data.inner_exception)
        ?? parseCodigoDuplicadoFromApi(data.innerException)
        ?? parseCodigoDuplicadoFromApi(data.message);
    if (dupMessage) return dupMessage;

    if (data.message && !data.message.includes('An error occurred while saving')) {
        return data.message;
    }

    return fallback;
};

export const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    const onlyDate = dateStr.split('T')[0];
    const parts = onlyDate.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

export const getProximasACerrar = (items: Convocatoria[]) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + DIAS_PROXIMO_CIERRE);

    return items.filter(c => {
        if (c.estado !== 'Abierta' || !c.fecha_cierre) return false;
        const cierre = parseLocalDate(c.fecha_cierre);
        if (!cierre) return false;
        cierre.setHours(0, 0, 0, 0);
        return cierre >= hoy && cierre <= limite;
    }).length;
};

export const canEditConvocatoria = (estado: Convocatoria['estado']) => estado !== 'Cerrada';

export const getAnioDisplay = (conv: Convocatoria) => {
    if (!conv.fecha_apertura || !conv.fecha_cierre) return conv.anio.toString();
    try {
        const start = parseLocalDate(conv.fecha_apertura);
        const end = parseLocalDate(conv.fecha_cierre);
        if (start && end) {
            const startYear = start.getFullYear();
            const endYear = end.getFullYear();
            if (startYear !== endYear) {
                return `${startYear} - ${endYear}`;
            }
        }
    } catch (e) {
        // Fallback
    }
    return conv.anio.toString();
};

export const getStatusTextClass = (estado: string) => {
    switch (estado) {
        case 'Abierta': return 'text-xs font-semibold text-success';
        case 'Borrador': return 'text-xs font-semibold text-text-dim';
        case 'Cerrada': return 'text-xs font-semibold text-error';
        case 'Anulada': return 'text-xs font-semibold text-error';
        default: return 'text-xs font-semibold text-text-dim';
    }
};

export const useConvocatorias = () => {
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open');

    // States
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [tiposConv, setTiposConv] = useState<Catalogo[]>([]);
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
    const [lastActiveUuid, setLastActiveUuid] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
    const [formFieldErrors, setFormFieldErrors] = useState<{ codigo_convocatoria?: string; anio?: string }>({});

    // Publish with audience drawer states
    const [publishDrawerTarget, setPublishDrawerTarget] = useState<Convocatoria | null>(null);
    const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);

    // Draft management states
    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const isInitializedRef = useRef(false);
    const [pendingDraft, setPendingDraft] = useState<{
        type: 'new' | 'edit';
        uuid?: string;
        groupName: string;
        timestamp: number;
    } | null>(null);

    const [formData, setFormData] = useState({
        codigo_convocatoria: '',
        titulo: '',
        id_periodo: '',
        anio: new Date().getFullYear().toString(),
        id_tipo_convocatoria: undefined as number | undefined,
        fecha_apertura: '',
        fecha_cierre: ''
    });

    const fetchConvocatorias = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Convocatorias');
            const data: Convocatoria[] = response.data;
            setConvocatorias(data);
        } catch (error) {
            console.error('Error fetching convocatorias:', error);
        } finally {
            setLoading(false);
        }
    };

    // Deep-link handling reactively for Convocatorias (e.g. from CommandPalette or notifications)
    useEffect(() => {
        if (!openUuid || convocatorias.length === 0) return;
        const target = convocatorias.find(c => c.uuid === openUuid);
        if (target) {
            setSelectedConvocatoria(target);
            setLastActiveUuid(null);
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('open');
                return next;
            }, { replace: true });
        }
    }, [openUuid, convocatorias, setSearchParams]);

    const fetchCatalogos = async () => {
        try {
            const [pRes, tRes] = await Promise.all([
                api.get('/Convocatorias/periodos'),
                api.get('/Convocatorias/catalogos/tipos')
            ]);
            setPeriodos(pRes.data);
            setTiposConv(tRes.data);

            if (pRes.data.length > 0 && !formData.id_periodo) {
                setFormData(prev => ({ ...prev, id_periodo: pRes.data[0].id_periodo }));
            }
        } catch (error) {
            console.error('Error fetching catalogos:', error);
        }
    };

    // Load draft metadata on mount
    useEffect(() => {
        fetchConvocatorias();
        fetchCatalogos();

        const metaStr = localStorage.getItem('convocatoria_draft_metadata');
        if (metaStr) {
            try {
                setPendingDraft(JSON.parse(metaStr));
            } catch (e) {
                console.error("Error reading draft metadata", e);
            }
        }
    }, []);

    // Reset init reference when modal closes
    useEffect(() => {
        if (!showModal) {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
        }
    }, [showModal]);

    // Auto-save draft on state changes
    useEffect(() => {
        if (!showModal || !isInitializedRef.current) return;

        const draftData = { formData };

        if (isEditing && selectedUuid) {
            const draftKey = `edit_convocatoria_form_draft_${selectedUuid}`;
            localStorage.setItem(draftKey, JSON.stringify(draftData));

            const meta = {
                type: 'edit',
                uuid: selectedUuid,
                groupName: formData.titulo || 'Convocatoria sin título',
                timestamp: Date.now()
            };
            localStorage.setItem('convocatoria_draft_metadata', JSON.stringify(meta));
        } else {
            localStorage.setItem('new_convocatoria_form_draft', JSON.stringify(draftData));

            const meta = {
                type: 'new',
                groupName: formData.titulo || 'Nueva Convocatoria',
                timestamp: Date.now()
            };
            localStorage.setItem('convocatoria_draft_metadata', JSON.stringify(meta));
        }
    }, [formData, showModal, isEditing, selectedUuid]);

    const clearDraft = () => {
        localStorage.removeItem('new_convocatoria_form_draft');
        localStorage.removeItem('convocatoria_draft_metadata');
        if (selectedUuid) {
            localStorage.removeItem(`edit_convocatoria_form_draft_${selectedUuid}`);
        }
        setPendingDraft(null);
        setIsDraftRestored(false);
    };

    const handleRestoreDraft = () => {
        if (!pendingDraft) return;

        if (pendingDraft.type === 'new') {
            setIsEditing(false);
            setSelectedUuid(null);
            const draftKey = 'new_convocatoria_form_draft';
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                        const validated = {
                            codigo_convocatoria: parsed.formData.codigo_convocatoria || '',
                            titulo: parsed.formData.titulo || '',
                            id_periodo: parsed.formData.id_periodo || '',
                            anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear().toString(),
                            descripcion: parsed.formData.descripcion || '',
                            url_bases: parsed.formData.url_bases || '',
                            requisitos_minimos: parsed.formData.requisitos_minimos || '',
                            id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                            fecha_apertura: parsed.formData.fecha_apertura || '',
                            fecha_cierre: parsed.formData.fecha_cierre || ''
                        };
                        setFormData(validated);
                        setIsDraftRestored(true);
                    } else {
                        throw new Error("Estructura de borrador de nueva convocatoria inválida");
                    }
                } catch (e) {
                    console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                    localStorage.removeItem(draftKey);
                    localStorage.removeItem('convocatoria_draft_metadata');
                    setIsDraftRestored(false);
                }
            }
            isInitializedRef.current = true;
            setShowModal(true);
        } else if (pendingDraft.type === 'edit' && pendingDraft.uuid) {
            const item = convocatorias.find(c => c.uuid === pendingDraft.uuid);
            if (item && !canEditConvocatoria(item.estado)) {
                addToast('Edición no permitida', 'No se puede editar una convocatoria cerrada.', 'error');
                clearDraft();
                return;
            }
            if (item) {
                setIsEditing(true);
                setSelectedUuid(item.uuid);
                const draftKey = `edit_convocatoria_form_draft_${item.uuid}`;
                const draft = localStorage.getItem(draftKey);
                if (draft) {
                    try {
                        const parsed = JSON.parse(draft);
                        if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                            const validated = {
                                codigo_convocatoria: parsed.formData.codigo_convocatoria || '',
                                titulo: parsed.formData.titulo || '',
                                id_periodo: parsed.formData.id_periodo || '',
                                anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear().toString(),
                                descripcion: parsed.formData.descripcion || '',
                                url_bases: parsed.formData.url_bases || '',
                                requisitos_minimos: parsed.formData.requisitos_minimos || '',
                                id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                                fecha_apertura: parsed.formData.fecha_apertura || '',
                                fecha_cierre: parsed.formData.fecha_cierre || ''
                            };
                            setFormData(validated);
                            setIsDraftRestored(true);
                        } else {
                            throw new Error("Estructura de borrador de edición de convocatoria inválida");
                        }
                    } catch (e) {
                        console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                        localStorage.removeItem(draftKey);
                        localStorage.removeItem('convocatoria_draft_metadata');
                        setIsDraftRestored(false);
                    }
                } else {
                    setFormData({
                        codigo_convocatoria: item.codigo_convocatoria,
                        titulo: item.titulo,
                        id_periodo: item.id_periodo,
                        anio: item.anio,
                        descripcion: item.descripcion || '',
                        url_bases: item.url_bases || '',
                        requisitos_minimos: item.requisitos_minimos || '',
                        id_tipo_convocatoria: item.id_tipo_convocatoria,
                        fecha_apertura: item.fecha_apertura,
                        fecha_cierre: item.fecha_cierre
                    });
                }
                isInitializedRef.current = true;
                setShowModal(true);
            } else {
                addToast('Error', 'No se pudo encontrar el registro original de la convocatoria.', 'error');
            }
        }
    };

    const handleDiscardDraft = async () => {
        if (await confirm({
            title: "Descartar Borrador",
            message: "¿Está seguro de descartar el borrador guardado? Esta acción no se puede deshacer.",
            confirmText: "Descartar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) {
            localStorage.removeItem('convocatoria_draft_metadata');
            localStorage.removeItem('new_convocatoria_form_draft');
            if (pendingDraft?.type === 'edit' && pendingDraft.uuid) {
                localStorage.removeItem(`edit_convocatoria_form_draft_${pendingDraft.uuid}`);
            }
            setPendingDraft(null);
            setIsDraftRestored(false);
        }
    };

    const handleNewConvocatoria = () => {
        resetForm();
        const draftKey = 'new_convocatoria_form_draft';
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                    const validated = {
                        codigo_convocatoria: parsed.formData.codigo_convocatoria || '',
                        titulo: parsed.formData.titulo || '',
                        id_periodo: parsed.formData.id_periodo || '',
                        anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear().toString(),
                        id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                        fecha_apertura: parsed.formData.fecha_apertura || '',
                        fecha_cierre: parsed.formData.fecha_cierre || ''
                    };
                    setFormData(validated);
                    setIsDraftRestored(true);
                } else {
                    throw new Error("Estructura de borrador de nueva convocatoria inválida");
                }
            } catch (e) {
                console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                localStorage.removeItem(draftKey);
                localStorage.removeItem('convocatoria_draft_metadata');
                setIsDraftRestored(false);
            }
        }
        isInitializedRef.current = true;
        setShowModal(true);
    };

    const handleCloseModal = async () => {
        let hasChanges = false;
        if (isEditing && selectedUuid) {
            const conv = convocatorias.find(c => c.uuid === selectedUuid);
            if (conv) {
                hasChanges =
                    formData.codigo_convocatoria !== conv.codigo_convocatoria ||
                    formData.titulo !== conv.titulo ||
                    formData.id_periodo !== conv.id_periodo ||
                    formData.anio !== conv.anio ||
                    formData.id_tipo_convocatoria !== conv.id_tipo_convocatoria ||
                    formData.fecha_apertura !== conv.fecha_apertura ||
                    formData.fecha_cierre !== conv.fecha_cierre;
            }
        } else {
            hasChanges =
                formData.codigo_convocatoria.trim() !== '' ||
                formData.titulo.trim() !== '' ||
                formData.fecha_apertura.trim() !== '' ||
                formData.fecha_cierre.trim() !== '';
        }

        if (hasChanges) {
            if (await confirm({
                title: "Salir del Formulario",
                message: "¿Está seguro de salir? Perderá todos los cambios no guardados en este formulario.",
                confirmText: "Salir",
                cancelText: "Cancelar",
                variant: "warning"
            })) {
                clearDraft();
                setShowModal(false);
                resetForm();
            }
        } else {
            clearDraft();
            setShowModal(false);
            resetForm();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && selectedUuid) {
            const conv = convocatorias.find(c => c.uuid === selectedUuid);
            if (conv && !canEditConvocatoria(conv.estado)) {
                addToast('Edición no permitida', 'No se puede editar una convocatoria cerrada.', 'error');
                return;
            }
        }
        try {
            const codigo = formData.codigo_convocatoria.trim();
            if (!codigo) {
                addToast('Código requerido', 'Ingresa un código único para la convocatoria.', 'error');
                return;
            }
            const codigoDuplicado = convocatorias.some(c =>
                c.codigo_convocatoria.trim().toLowerCase() === codigo.toLowerCase()
                && (!isEditing || c.uuid !== selectedUuid)
            );
            if (codigoDuplicado) {
                const msg = codigoDuplicadoMessage(codigo);
                setFormFieldErrors({ codigo_convocatoria: msg });
                addToast('Código duplicado', msg, 'error');
                return;
            }

            const titulo = formData.titulo.trim();
            if (!titulo) {
                addToast('Título requerido', 'Ingresa un título para la convocatoria.', 'error');
                return;
            }

            const anioVal = formData.anio.trim();
            if (!anioVal) {
                addToast('Año requerido', 'Ingresa el año o periodo de la convocatoria.', 'error');
                return;
            }
            
            const anioRegex = /^(?:19|20|21)\d{2}(?:\s*[-\/]\s*(?:19|20|21)\d{2})?$/;
            if (!anioRegex.test(anioVal)) {
                addToast('Año inválido', 'El año debe ser de 4 dígitos (ej: 2026) o un rango de años válido (ej: 2026 - 2027).', 'error');
                return;
            }

            if (!formData.id_tipo_convocatoria) {
                addToast('Tipo de Convocatoria requerido', 'Selecciona el tipo de convocatoria.', 'error');
                return;
            }

            if (!formData.fecha_apertura || !formData.fecha_cierre) {
                addToast('Fechas requeridas', 'Ingresa la fecha de apertura y cierre.', 'error');
                return;
            }

            const apertura = new Date(formData.fecha_apertura);
            const cierre = new Date(formData.fecha_cierre);
            if (apertura > cierre) {
                addToast('Fechas inválidas', 'La fecha de apertura debe ser anterior o igual a la fecha de cierre.', 'error');
                return;
            }

            setFormFieldErrors({});
            const payload = {
                ...formData,
                anio: anioVal
            };
            if (isEditing && selectedUuid) {
                await api.put(`/Convocatorias/${selectedUuid}`, payload);
            } else {
                await api.post('/Convocatorias', payload);
            }
            clearDraft();
            setShowModal(false);
            fetchConvocatorias();
            resetForm();
        } catch (error: unknown) {
            console.error('Error saving convocatoria:', error);
            const message = getConvocatoriaSaveErrorMessage(error);
            const isCodigoDuplicado = message.toLowerCase().includes('código') && message.toLowerCase().includes('existe');
            setFormFieldErrors(isCodigoDuplicado ? { codigo_convocatoria: message } : {});
            addToast(isCodigoDuplicado ? 'Código duplicado' : 'Error', message, 'error');
        }
    };

    const handleEdit = (conv: Convocatoria) => {
        if (!canEditConvocatoria(conv.estado)) {
            addToast('Edición no permitida', 'No se puede editar una convocatoria cerrada.', 'error');
            return;
        }
        setIsEditing(true);
        setSelectedUuid(conv.uuid);

        const draftKey = `edit_convocatoria_form_draft_${conv.uuid}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                    const validated = {
                        codigo_convocatoria: parsed.formData.codigo_convocatoria || '',
                        titulo: parsed.formData.titulo || '',
                        id_periodo: parsed.formData.id_periodo || '',
                        anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear().toString(),
                        id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                        fecha_apertura: parsed.formData.fecha_apertura || '',
                        fecha_cierre: parsed.formData.fecha_cierre || ''
                    };
                    setFormData(validated);
                    setIsDraftRestored(true);
                } else {
                    throw new Error("Estructura de borrador de edición de convocatoria inválida");
                }
            } catch (e) {
                console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                localStorage.removeItem(draftKey);
                localStorage.removeItem('convocatoria_draft_metadata');
                setIsDraftRestored(false);
            }
        } else {
            setFormData({
                codigo_convocatoria: conv.codigo_convocatoria,
                titulo: conv.titulo,
                id_periodo: conv.id_periodo,
                anio: conv.anio,
                id_tipo_convocatoria: conv.id_tipo_convocatoria,
                fecha_apertura: conv.fecha_apertura,
                fecha_cierre: conv.fecha_cierre
            });
            setIsDraftRestored(false);
        }
        isInitializedRef.current = true;
        setShowModal(true);
    };

    const handleDelete = async (uuid: string) => {
        if (!await confirm({
            title: "Eliminar Convocatoria",
            message: "¿Estás seguro de eliminar esta convocatoria? Se enviará a la papelera de reciclaje y se conservará por 30 días antes de eliminarse de forma automática y definitiva.",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/Convocatorias/${uuid}`);
            fetchConvocatorias();
            addToast(
                'Convocatoria Eliminada',
                'La convocatoria se envió a la papelera de reciclaje.',
                'success',
                undefined,
                async () => {
                    try {
                        await api.post(`/recyclebin/restore/convocatoria/${uuid}`);
                        addToast('Acción Revertida', 'La convocatoria ha sido restaurada con éxito.', 'success');
                        fetchConvocatorias();
                    } catch (err: any) {
                        console.error('[Undo Delete Convocatoria] Failed:', err);
                        addToast('Error al Restaurar', err.response?.data?.message || 'No se pudo restaurar la convocatoria.', 'error');
                    }
                }
            );
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Ocurrió un error inesperado al intentar eliminar la convocatoria.';
            addToast('Error al Eliminar', errorMsg, 'error');
        }
    };

    const handleStatusChange = async (uuid: string, newStatus: string) => {
        if (newStatus === 'Abierta') {
            if (!await confirm({
                title: "Publicar Convocatoria",
                message: "¿Estás seguro de publicar esta convocatoria? Una vez publicada, estará visible para que los docentes inicien sus postulaciones.",
                confirmText: "Publicar",
                cancelText: "Cancelar",
                variant: "warning"
            })) return;
        }

        const previousConvocatorias = [...convocatorias];
        const previousSelected = selectedConvocatoria;

        // Optimistically update
        setConvocatorias(prev => prev.map(c => c.uuid === uuid ? { ...c, estado: newStatus as any } : c));
        if (selectedConvocatoria && selectedConvocatoria.uuid === uuid) {
            setSelectedConvocatoria(prev => prev ? { ...prev, estado: newStatus as any } : null);
        }

        try {
            await api.patch(`/Convocatorias/${uuid}/status?status=${newStatus}`);
            if (newStatus === 'Abierta') {
                addToast('Publicación Exitosa', 'Convocatoria publicada exitosamente. Se ha notificado a los docentes en segundo plano.', 'success');
            } else {
                addToast('Estado Actualizado', `Estado actualizado a ${newStatus}.`, 'success');
            }
            fetchConvocatorias();
        } catch (error: any) {
            setConvocatorias(previousConvocatorias);
            setSelectedConvocatoria(previousSelected);

            const message = error?.response?.status === 403
                ? 'No tienes permisos para realizar esta acción.'
                : `Error al cambiar el estado: ${error?.response?.data?.message || error.message}`;
            addToast('Error', message, 'error');
        }
    };

    const resetForm = () => {
        setFormFieldErrors({});
        setFormData({
            codigo_convocatoria: '',
            titulo: '',
            id_periodo: periodos[0]?.id_periodo || '',
            anio: new Date().getFullYear().toString(),
            id_tipo_convocatoria: undefined,
            fecha_apertura: '',
            fecha_cierre: ''
        });
        setIsEditing(false);
        setSelectedUuid(null);
        setIsDraftRestored(false);
    };

    const handleOpenPublishDrawer = (conv: Convocatoria) => {
        setPublishDrawerTarget(conv);
        setIsPublishDrawerOpen(true);
    };

    const handleClosePublishDrawer = () => {
        setIsPublishDrawerOpen(false);
        setPublishDrawerTarget(null);
    };

    const handlePublishSuccess = () => {
        addToast('Convocatoria Publicada', 'La convocatoria ha sido abierta y los comunicados se han despachado a los destinatarios seleccionados.', 'success');
        fetchConvocatorias();
    };

    const convocatoriasAbiertas = convocatorias.filter(c => c.estado === 'Abierta').length;
    const proximasACerrar = getProximasACerrar(convocatorias);

    return {
        // States
        convocatorias,
        periodos,
        tiposConv,
        selectedConvocatoria,
        setSelectedConvocatoria,
        lastActiveUuid,
        setLastActiveUuid,
        loading,
        showModal,
        isEditing,
        selectedUuid,
        formFieldErrors,
        setFormFieldErrors,
        isDraftRestored,
        setIsDraftRestored,
        pendingDraft,
        setPendingDraft,
        formData,
        setFormData,
        convocatoriasAbiertas,
        proximasACerrar,
        publishDrawerTarget,
        isPublishDrawerOpen,

        // Handlers
        fetchConvocatorias,
        handleRestoreDraft,
        handleDiscardDraft,
        handleNewConvocatoria,
        handleCloseModal,
        handleSave,
        handleEdit,
        handleDelete,
        handleStatusChange,
        handleOpenPublishDrawer,
        handleClosePublishDrawer,
        handlePublishSuccess,
        resetForm
    };
};
