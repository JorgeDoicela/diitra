import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Plus, Calendar, FileText, CheckCircle,
    Trash2, Edit2, Activity,
    AlertCircle,
    X, Save, ShieldCheck,
    Layers
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';

interface Convocatoria {
    uuid: string;
    codigo_convocatoria: string;
    titulo: string;
    id_periodo: string;
    periodo_nombre: string;
    anio: string;
    descripcion: string;
    url_bases: string;
    requisitos_minimos: string;
    id_tipo_convocatoria?: number;
    fecha_apertura: string;
    fecha_cierre: string;
    estado: 'Borrador' | 'Abierta' | 'Cerrada' | 'Anulada';
    proyectos?: { uuid: string; titulo: string; codigo_institucional?: string; estado: string }[];
}

interface Periodo {
    id_periodo: string;
    detalle: string;
}

interface Catalogo {
    id: number;
    nombre: string;
}



const codigoDuplicadoMessage = (codigo: string) =>
    `Ya existe una convocatoria con el código "${codigo}". Usa un código diferente.`;

const parseCodigoDuplicadoFromApi = (raw?: string) => {
    if (!raw) return null;
    const duplicateMatch = raw.match(/Duplicate entry '([^']+)'/i);
    if (duplicateMatch) return codigoDuplicadoMessage(duplicateMatch[1]);
    if (raw.toLowerCase().includes('ya existe') && raw.toLowerCase().includes('código')) return raw;
    return null;
};

const getConvocatoriaSaveErrorMessage = (error: unknown, fallback = 'Error al guardar la convocatoria.') => {
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

const DIAS_PROXIMO_CIERRE = 30;

const getProximasACerrar = (items: Convocatoria[]) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + DIAS_PROXIMO_CIERRE);

    return items.filter(c => {
        if (c.estado !== 'Abierta' || !c.fecha_cierre) return false;
        const cierre = new Date(c.fecha_cierre);
        if (Number.isNaN(cierre.getTime())) return false;
        cierre.setHours(0, 0, 0, 0);
        return cierre >= hoy && cierre <= limite;
    }).length;
};

const canEditConvocatoria = (estado: Convocatoria['estado']) => estado !== 'Cerrada';

const getAnioDisplay = (conv: Convocatoria) => {
    if (!conv.fecha_apertura || !conv.fecha_cierre) return conv.anio.toString();
    try {
        const startYear = new Date(conv.fecha_apertura).getFullYear();
        const endYear = new Date(conv.fecha_cierre).getFullYear();
        if (!Number.isNaN(startYear) && !Number.isNaN(endYear) && startYear !== endYear) {
            return `${startYear} - ${endYear}`;
        }
    } catch (e) {
        // Fallback
    }
    return conv.anio.toString();
};

const ConvocatoriasPage = () => {
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open'); // deep-link from CommandPalette
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
        descripcion: '',
        url_bases: '',
        requisitos_minimos: '',
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

            // Deep-link: ?open=UUID opens that convocatoria's side panel automatically
            if (openUuid && !selectedConvocatoria) {
                const target = data.find(c => c.uuid === openUuid);
                if (target) {
                    setSelectedConvocatoria(target);
                    setLastActiveUuid(null);
                    setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.delete('open');
                        return next;
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching convocatorias:', error);
        } finally {
            setLoading(false);
        }
    };

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
    };    const handleRestoreDraft = () => {
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
                            anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear(),
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
                                anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear(),
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
                        anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear(),
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
    };

    const handleCloseModal = async () => {
        // Check if metadata has changes from officialMetadata
        let hasChanges = false;
        if (isEditing && selectedUuid) {
            const conv = convocatorias.find(c => c.uuid === selectedUuid);
            if (conv) {
                hasChanges =
                    formData.codigo_convocatoria !== conv.codigo_convocatoria ||
                    formData.titulo !== conv.titulo ||
                    formData.id_periodo !== conv.id_periodo ||
                    formData.anio !== conv.anio ||
                    formData.descripcion !== (conv.descripcion || '') ||
                    formData.fecha_apertura !== conv.fecha_apertura ||
                    formData.fecha_cierre !== conv.fecha_cierre;
            }
        } else {
            hasChanges =
                formData.codigo_convocatoria.trim() !== '' ||
                formData.titulo.trim() !== '' ||
                formData.descripcion.trim() !== '';
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
                        anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear(),
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
                codigo_convocatoria: conv.codigo_convocatoria,
                titulo: conv.titulo,
                id_periodo: conv.id_periodo,
                anio: conv.anio,
                descripcion: conv.descripcion || '',
                url_bases: conv.url_bases || '',
                requisitos_minimos: conv.requisitos_minimos || '',
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
            addToast('Convocatoria Eliminada', 'La convocatoria se eliminó correctamente.', 'success');
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

        // Optimistically update lists and selected state
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
            // Revert state on failure
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
            descripcion: '',
            url_bases: '',
            requisitos_minimos: '',
            id_tipo_convocatoria: undefined,
            fecha_apertura: '',
            fecha_cierre: ''
        });
        setIsEditing(false);
        setSelectedUuid(null);
        setIsDraftRestored(false);
    };

    const getStatusTextClass = (estado: string) => {
        switch (estado) {
            case 'Abierta': return 'text-xs font-semibold text-success';
            case 'Borrador': return 'text-xs font-semibold text-text-dim';
            case 'Cerrada': return 'text-xs font-semibold text-error';
            case 'Anulada': return 'text-xs font-semibold text-error';
            default: return 'text-xs font-semibold text-text-dim';
        }
    };

    const convocatoriasAbiertas = convocatorias.filter(c => c.estado === 'Abierta').length;
    const proximasACerrar = getProximasACerrar(convocatorias);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <style>{`
                .row-last-active {
                    background-color: rgba(0, 112, 243, 0.05) !important;
                    border-color: rgba(0, 112, 243, 0.35) !important;
                    box-shadow: 0 0 12px rgba(0, 112, 243, 0.08) !important;
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label">
                        <Activity size={10} strokeWidth={2} />
                        <span>Gestión de Investigación - Convocatorias</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">Ciclos de Investigación</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración de convocatorias anuales para proyectos de investigación.
                        Alineado con estándares CACES y SENESCYT.
                    </p>
                </div>

                <div className="w-full lg:w-auto">
                    <button
                        onClick={handleNewConvocatoria}
                        className="btn-vercel-primary w-full lg:w-auto"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Convocatoria
                    </button>
                </div>
            </header>

            {/* Banner de Recuperación de Borrador */}
            {pendingDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-text-main">Borrador detectado</h4>
                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                    No guardado
                                </span>
                            </div>
                            <p className="text-xs text-text-dim">
                                Tienes un borrador sin guardar de: <span className="text-text-main font-medium">"{pendingDraft.groupName}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingDraft.timestamp).toLocaleDateString()} a las {new Date(pendingDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreDraft}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar borrador
                        </button>
                        <button
                            onClick={handleDiscardDraft}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up" style={{ animationDelay: '100ms' }}>

                {/* Main Content: List View (Left Column) */}
                <div className="lg:col-span-3 space-y-5 md:space-y-4">
                    {convocatorias.map((conv) => (
                        <div
                            key={conv.uuid}
                            onClick={() => { setSelectedConvocatoria(conv); setLastActiveUuid(null); }}
                            className={`bento-card px-5 py-6 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-0 group cursor-pointer transition-all ${selectedConvocatoria?.uuid === conv.uuid
                                    ? 'bg-brand/[0.05] border-brand/35 shadow-[0_0_12px_rgba(0,112,243,0.08)]'
                                    : (!selectedConvocatoria && lastActiveUuid === conv.uuid)
                                        ? 'row-last-active'
                                        : ''
                                }`}
                        >
                            <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 w-full">
                                <div className="icon-circle-brand shrink-0 mt-0.5 md:mt-0">
                                    <FileText size={20} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-3 md:space-y-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <span className={getStatusTextClass(conv.estado)}>
                                            {conv.estado}
                                        </span>
                                        <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">{conv.codigo_convocatoria}</span>
                                    </div>
                                    <h4 className="text-[15px] md:text-lg font-bold tracking-tight text-text-main leading-normal md:leading-snug break-words group-hover:translate-x-0.5 transition-transform">
                                        {conv.titulo}
                                    </h4>
                                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1.5 text-[10px] text-text-dim font-medium uppercase tracking-tight">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <span className="flex items-center gap-1 shrink-0"><Calendar size={12} /> {getAnioDisplay(conv)}</span>
                                            <span className="flex items-center gap-1 min-w-0 break-words"><ShieldCheck size={12} className="shrink-0" /> {conv.periodo_nombre || conv.id_periodo}</span>
                                        </div>
                                        {/* Simplificado: Sin Fondo, Tope ni Rúbrica */}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 border-border-thin pt-5 mt-1 md:pt-0 md:mt-0 shrink-0">
                                <div className="text-left md:text-right md:mr-4">
                                    <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Cierre</p>
                                    <p className="text-xs font-mono text-text-main">{conv.fecha_cierre}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {conv.estado === 'Borrador' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(conv.uuid, 'Abierta');
                                            }}
                                            className="p-2 text-text-dim hover:text-success hover:bg-surface-hover rounded transition-colors"
                                            title="Publicar Convocatoria"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}

                                    {canEditConvocatoria(conv.estado) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(conv);
                                            }}
                                            className="p-2 text-text-dim hover:text-text-main hover:bg-surface-hover rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(conv.uuid);
                                        }}
                                        className="p-2 text-text-dim hover:text-error hover:bg-surface-hover rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {convocatorias.length === 0 && !loading && (
                        <div className="empty-state py-20">
                            <div className="icon-circle-neutral mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-text-main font-bold uppercase tracking-widest">No hay convocatorias activas</p>
                                <p className="text-xs text-text-dim">Empieza creando una nueva convocatoria para este periodo.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Metrics (Right Column) */}
                <div className="space-y-6">
                    <VercelUsageCard
                        title="Resumen del Periodo"
                        items={[
                            {
                                label: 'Total Anual',
                                value: convocatorias.length,
                                displayValue: `${convocatorias.length} ciclos`,
                                max: 10,
                                color: 'var(--brand)',
                                hint: 'Cantidad total de convocatorias registradas en el sistema.'
                            },
                            {
                                label: 'Abiertas',
                                value: convocatoriasAbiertas,
                                displayValue: `${convocatoriasAbiertas} vigentes`,
                                max: convocatorias.length || 1,
                                color: 'var(--success)',
                                hint: 'Convocatorias en estado Abierta, disponibles para postulaciones de docentes.'
                            },
                            {
                                label: 'Próximas a Cerrar',
                                value: proximasACerrar,
                                displayValue: proximasACerrar === 1 ? '1 en 30 días' : `${proximasACerrar} en 30 días`,
                                max: convocatoriasAbiertas || 1,
                                color: 'var(--warning)',
                                hint: 'Convocatorias abiertas cuya fecha de cierre está dentro de los próximos 30 días.'
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Modal - Create/Edit */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={handleCloseModal}
                    />
                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                        <div className="modal-header">
                            <div>
                                <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                    {isEditing ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
                                </h3>
                                <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Registro de Ciclo de Investigación</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="modal-body space-y-6">
                            {isDraftRestored && (
                                <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-text-main shrink-0" />
                                        <p className="text-xs text-text-dim">
                                            <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditing && selectedUuid) {
                                                const conv = convocatorias.find(c => c.uuid === selectedUuid);
                                                if (conv) {
                                                    setFormData({
                                                        codigo_convocatoria: conv.codigo_convocatoria,
                                                        titulo: conv.titulo,
                                                        id_periodo: conv.id_periodo,
                                                        anio: conv.anio,
                                                        descripcion: conv.descripcion || '',
                                                        url_bases: conv.url_bases || '',
                                                        requisitos_minimos: conv.requisitos_minimos || '',
                                                        id_tipo_convocatoria: conv.id_tipo_convocatoria,
                                                        fecha_apertura: conv.fecha_apertura,
                                                        fecha_cierre: conv.fecha_cierre
                                                    });
                                                }
                                            } else {
                                                setFormData({
                                                    codigo_convocatoria: '',
                                                    titulo: '',
                                                    id_periodo: periodos[0]?.id_periodo || '',
                                                    anio: new Date().getFullYear().toString(),
                                                    descripcion: '',
                                                    url_bases: '',
                                                    requisitos_minimos: '',
                                                    id_tipo_convocatoria: undefined,
                                                    fecha_apertura: '',
                                                    fecha_cierre: ''
                                                });
                                            }
                                            localStorage.removeItem('new_convocatoria_form_draft');
                                            localStorage.removeItem('convocatoria_draft_metadata');
                                            if (selectedUuid) {
                                                localStorage.removeItem(`edit_convocatoria_form_draft_${selectedUuid}`);
                                            }
                                            setIsDraftRestored(false);
                                            setPendingDraft(null);
                                        }}
                                        className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                                    >
                                        Descartar borrador
                                    </button>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Código Identificador</label>
                                    <input
                                        required
                                        className={`input-vercel ${formFieldErrors.codigo_convocatoria ? 'border-error focus:border-error' : ''}`}
                                        placeholder="EJ: CONV-2024-TEC"
                                        value={formData.codigo_convocatoria}
                                        onChange={e => {
                                            setFormFieldErrors(prev => ({ ...prev, codigo_convocatoria: undefined }));
                                            setFormData({ ...formData, codigo_convocatoria: e.target.value });
                                        }}
                                        aria-invalid={!!formFieldErrors.codigo_convocatoria}
                                    />
                                    {formFieldErrors.codigo_convocatoria && (
                                        <p className="text-[10px] text-error ml-1">{formFieldErrors.codigo_convocatoria}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Año Calendario</label>
                                    <input
                                        type="text"
                                        required
                                        className={`input-vercel ${formFieldErrors.anio ? 'border-error focus:border-error' : ''}`}
                                        placeholder="EJ: 2026 o 2026 - 2027"
                                        value={formData.anio}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, anio: val });
                                            
                                            const anioRegex = /^(?:19|20|21)\d{2}(?:\s*[-\/]\s*(?:19|20|21)\d{2})?$/;
                                            if (val.trim() && !anioRegex.test(val.trim())) {
                                                setFormFieldErrors(prev => ({ 
                                                    ...prev, 
                                                    anio: 'Formato inválido. Ejemplos válidos: 2026, 2026 - 2027, 2026/2027.' 
                                                }));
                                            } else {
                                                setFormFieldErrors(prev => ({ 
                                                    ...prev, 
                                                    anio: undefined 
                                                }));
                                            }
                                        }}
                                        aria-invalid={!!formFieldErrors.anio}
                                    />
                                    {formFieldErrors.anio && (
                                        <p className="text-[10px] text-error ml-1 mt-1">{formFieldErrors.anio}</p>
                                    )}
                                    {formData.fecha_apertura && formData.fecha_cierre && (() => {
                                        try {
                                            const startYear = new Date(formData.fecha_apertura).getFullYear();
                                            const endYear = new Date(formData.fecha_cierre).getFullYear();
                                            if (!Number.isNaN(startYear) && !Number.isNaN(endYear) && startYear !== endYear) {
                                                return (
                                                    <p className="text-[10px] text-brand ml-1 mt-1 font-medium animate-fade-in">
                                                        Vigencia detectada: {startYear} - {endYear} (Plurianual)
                                                    </p>
                                                );
                                            }
                                        } catch (e) {}
                                        return null;
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Título de la Convocatoria</label>
                                <input
                                    required
                                    className="input-vercel"
                                    placeholder="Nombre oficial de la convocatoria..."
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Periodo SIGAFI (Inicio)</label>
                                    <select
                                        className="input-vercel"
                                        value={formData.id_periodo}
                                        onChange={e => setFormData({ ...formData, id_periodo: e.target.value })}
                                    >
                                        {periodos.map(p => (
                                            <option key={p.id_periodo} value={p.id_periodo}>{p.detalle}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tipo de Convocatoria</label>
                                    <select
                                        className="input-vercel"
                                        required
                                        value={formData.id_tipo_convocatoria || ''}
                                        onChange={e => setFormData({ ...formData, id_tipo_convocatoria: e.target.value ? parseInt(e.target.value) : undefined })}
                                    >
                                        <option value="">Seleccionar Tipo...</option>
                                        {tiposConv.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Apertura</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-vercel"
                                        value={formData.fecha_apertura}
                                        onChange={e => setFormData({ ...formData, fecha_apertura: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Cierre</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-vercel"
                                        value={formData.fecha_cierre}
                                        onChange={e => setFormData({ ...formData, fecha_cierre: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    <Save size={14} />
                                    {isEditing ? 'Actualizar Convocatoria' : 'Guardar Convocatoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Detail Panel */}
            {selectedConvocatoria && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => { setLastActiveUuid(selectedConvocatoria.uuid); setSelectedConvocatoria(null); }}
                    />

                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    {selectedConvocatoria.codigo_convocatoria}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                                    <span className={`dot dot-pulse ${selectedConvocatoria.estado === 'Abierta' ? 'dot-success' : 'dot-warning'}`} />
                                    <span className={selectedConvocatoria.estado === 'Abierta' ? 'text-success' : 'text-warning'}>
                                        {selectedConvocatoria.estado === 'Abierta' ? 'Convocatoria Activa' : `Estado: ${selectedConvocatoria.estado}`}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setLastActiveUuid(selectedConvocatoria.uuid); setSelectedConvocatoria(null); }}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedConvocatoria.titulo}
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    {selectedConvocatoria.descripcion || 'Sin descripción detallada.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} /> Fecha de Apertura
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-mono">
                                        {selectedConvocatoria.fecha_apertura}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} /> Fecha de Cierre (Límite)
                                    </div>
                                    <div className="text-sm font-bold text-error font-mono">
                                        {selectedConvocatoria.fecha_cierre}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                    <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers size={12} /> Tipo de Convocatoria
                                    </div>
                                    <div className="text-sm font-bold text-text-main">
                                        {tiposConv.find(t => t.id === selectedConvocatoria.id_tipo_convocatoria)?.nombre || 'Estándar'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={12} /> Proyectos Asociados
                                    </h4>
                                    {selectedConvocatoria.proyectos && selectedConvocatoria.proyectos.length > 0 && (
                                        <span className="px-2 py-0.5 text-[10px] bg-brand/10 text-brand rounded-full font-bold">
                                            {selectedConvocatoria.proyectos.length}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {selectedConvocatoria.proyectos && selectedConvocatoria.proyectos.length > 0 ? (
                                        selectedConvocatoria.proyectos.map((proyecto, idx) => (
                                            <Link
                                                key={idx}
                                                to={buildWorkspacePath('PROTOCOLO_INVESTIGACION', proyecto.uuid, '', '/investigacion')}
                                                onClick={() => {
                                                    setLastActiveUuid(null);
                                                    setSelectedConvocatoria(null);
                                                }}
                                                className="flex items-center justify-between p-3 bento-card static text-xs hover:border-brand transition-all duration-200 group cursor-pointer decoration-none"
                                            >
                                                <div className="flex flex-col min-w-0 pr-3">
                                                    <span className="font-bold text-text-main truncate group-hover:text-brand transition-colors">
                                                        {proyecto.titulo}
                                                    </span>
                                                    {proyecto.codigo_institucional && (
                                                        <span className="text-[10px] text-text-dim font-mono mt-0.5">
                                                            {proyecto.codigo_institucional}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase tracking-wider ${
                                                    proyecto.estado === 'Aprobado' || proyecto.estado === 'Ejecución' ? 'bg-success/10 text-success' :
                                                    proyecto.estado === 'Borrador' ? 'bg-text-dim/10 text-text-dim' :
                                                    'bg-brand/10 text-brand'
                                                }`}>
                                                    {proyecto.estado}
                                                </span>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-xs text-text-dim">No hay proyectos registrados en esta convocatoria.</p>
                                    )}
                                </div>
                            </div>

                            {/* Simplificado: Se ha removido la documentación obligatoria */}
                        </div>

                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            {canEditConvocatoria(selectedConvocatoria.estado) && (
                                <button
                                    onClick={() => {
                                        handleEdit(selectedConvocatoria);
                                        setLastActiveUuid(null);
                                        setSelectedConvocatoria(null);
                                    }}
                                    className="btn-vercel-primary flex-1"
                                >
                                    Editar Convocatoria
                                </button>
                            )}
                            {selectedConvocatoria.estado === 'Borrador' && (
                                <button
                                    onClick={() => {
                                        handleStatusChange(selectedConvocatoria.uuid, 'Abierta');
                                        setLastActiveUuid(null);
                                        setSelectedConvocatoria(null);
                                    }}
                                    className="btn-brand flex-1"
                                >
                                    Publicar Ahora
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </main>
    );
};

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: {
    title: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    items: {
        label: string;
        value: number;
        displayValue?: string;
        max?: number;
        color?: string;
        hint?: string;
    }[];
}) => {
    const [activeHint, setActiveHint] = useState<number | null>(null);

    return (
        <div className="bento-card static p-5 flex flex-col relative overflow-visible bg-surface border border-border-thin shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-5">
                <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
                {buttonLabel && (
                    <button
                        onClick={onButtonClick}
                        className="px-3 py-1 bg-black text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-[#eaeaea] rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                        {buttonLabel}
                    </button>
                )}
            </div>
            <div className="space-y-1">
                {items.map((item, idx) => {
                    const percentage = item.max ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
                    const radius = 6.5;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                    const isHintOpen = activeHint === idx;

                    return (
                        <div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 rounded-md transition-all"
                            style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 18 18">
                                        <circle
                                            cx="9"
                                            cy="9"
                                            r={radius}
                                            className="fill-none"
                                            strokeWidth="1.8"
                                            style={{ stroke: 'var(--accents-2)' }}
                                        />
                                        <circle
                                            cx="9"
                                            cy="9"
                                            r={radius}
                                            className="fill-none transition-all duration-500"
                                            stroke={item.color || 'var(--brand)'}
                                            strokeWidth="1.8"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={item.max ? strokeDashoffset : 0}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[13px] font-medium text-text-main truncate">
                                        {item.label}
                                    </span>
                                    {item.hint && (
                                        <span className="relative inline-flex shrink-0 group/hint">
                                            <button
                                                type="button"
                                                aria-label={item.hint}
                                                aria-expanded={isHintOpen}
                                                onClick={() => setActiveHint(isHintOpen ? null : idx)}
                                                className="text-text-dim/40 hover:text-text-main transition-colors cursor-help focus:outline-none focus:text-text-main"
                                            >
                                                <svg
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    aria-hidden="true"
                                                >
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                            </button>
                                            <span
                                                role="tooltip"
                                                className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] z-50 w-52 max-w-[min(13rem,calc(100vw-3rem))] px-3 py-2 rounded-lg text-[10px] font-normal normal-case leading-relaxed tracking-normal text-text-main bg-surface border border-border-thin shadow-lg pointer-events-none transition-opacity duration-150 ${isHintOpen
                                                        ? 'opacity-100 visible'
                                                        : 'opacity-0 invisible group-hover/hint:opacity-100 group-hover/hint:visible'
                                                    }`}
                                            >
                                                {item.hint}
                                                <span
                                                    className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 rotate-45 bg-surface border-r border-b border-border-thin"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                                {item.displayValue || item.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConvocatoriasPage;
