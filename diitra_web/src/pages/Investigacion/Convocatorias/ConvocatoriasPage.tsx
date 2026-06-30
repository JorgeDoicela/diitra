import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Calendar, DollarSign, FileText, CheckCircle,
    Trash2, Edit2, Activity,
    AlertCircle,
    ChevronRight, CalendarDays, X, Save, ShieldCheck,
    BookOpen, Layers
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';

interface Convocatoria {
    uuid: string;
    codigo_convocatoria: string;
    titulo: string;
    id_periodo: string;
    periodo_nombre: string;
    anio: number;
    descripcion: string;
    presupuesto_total: number;
    monto_maximo_proyecto: number;
    url_bases: string;
    requisitos_minimos: string;
    id_tipo_convocatoria?: number;
    id_agenda_zonal?: number;
    id_rubrica?: number;
    rubrica_nombre?: string;
    puntaje_minimo_aprobacion: number;
    financiamiento_ext: boolean;
    meta_produccion?: string;
    fecha_apertura: string;
    fecha_cierre: string;
    estado: 'Borrador' | 'Abierta' | 'Cerrada' | 'Anulada';
    lineas_ids: number[];
    hitos: { uuid?: string; nombre_hito: string; fecha_hito: string; es_critico: boolean; descripcion?: string }[];
    documentos_req: { uuid?: string; nombre_documento: string; descripcion?: string; es_obligatorio: boolean }[];
}

interface Periodo {
    id_periodo: string;
    detalle: string;
}

interface Catalogo {
    id: number;
    nombre: string;
}

const formatMonto = (value: number) => `$${value.toLocaleString('es-EC')}`;

const formatMontoInputDisplay = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('es-EC', { maximumFractionDigits: 2 });
};

const parseMontoInput = (raw: string): number | string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? '' : num;
};

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

const getFondoConvocatoria = (c: { presupuesto_total?: number | null }) => c.presupuesto_total ?? 0;

const getTopeProyecto = (c: { monto_maximo_proyecto?: number | null }) =>
    c.monto_maximo_proyecto != null && c.monto_maximo_proyecto > 0 ? c.monto_maximo_proyecto : null;

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

const getFondoTotalConvocatorias = (items: Convocatoria[]) =>
    items.reduce((acc, c) => acc + (c.presupuesto_total || 0), 0);

const ConvocatoriasPage = () => {
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open'); // deep-link from CommandPalette
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [tiposConv, setTiposConv] = useState<Catalogo[]>([]);
    const [agendas, setAgendas] = useState<Catalogo[]>([]);
    const [rubricas, setRubricas] = useState<Catalogo[]>([]);
    const [lineas, setLineas] = useState<Catalogo[]>([]);
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
    const [lastActiveUuid, setLastActiveUuid] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
    const [formFieldErrors, setFormFieldErrors] = useState<{ codigo_convocatoria?: string }>({});

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
        anio: new Date().getFullYear() as number | string,
        descripcion: '',
        presupuesto_total: 0 as number | string,
        monto_maximo_proyecto: 0 as number | string,
        url_bases: '',
        requisitos_minimos: '',
        id_tipo_convocatoria: undefined as number | undefined,
        id_agenda_zonal: undefined as number | undefined,
        id_rubrica: undefined as number | undefined,
        puntaje_minimo_aprobacion: 70.00 as number | string,
        financiamiento_ext: false,
        meta_produccion: '',
        fecha_apertura: '',
        fecha_cierre: '',
        lineas_ids: [] as number[],
        hitos: [] as { nombre_hito: string; fecha_hito: string; es_critico: boolean; descripcion?: string }[],
        documentos_req: [] as { nombre_documento: string; descripcion?: string; es_obligatorio: boolean }[]
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
            const [pRes, tRes, aRes, rRes, lRes] = await Promise.all([
                api.get('/Convocatorias/periodos'),
                api.get('/Convocatorias/catalogos/tipos'),
                api.get('/Convocatorias/catalogos/agendas'),
                api.get('/Convocatorias/catalogos/rubricas'),
                api.get('/Convocatorias/catalogos/lineas')
            ]);
            setPeriodos(pRes.data);
            setTiposConv(tRes.data);
            setAgendas(aRes.data);
            setRubricas(rRes.data);
            setLineas(lRes.data);

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
                            anio: (typeof parsed.formData.anio === 'number' || typeof parsed.formData.anio === 'string') ? parsed.formData.anio : new Date().getFullYear(),
                            descripcion: parsed.formData.descripcion || '',
                            presupuesto_total: (typeof parsed.formData.presupuesto_total === 'number' || typeof parsed.formData.presupuesto_total === 'string') ? parsed.formData.presupuesto_total : 0,
                            monto_maximo_proyecto: (typeof parsed.formData.monto_maximo_proyecto === 'number' || typeof parsed.formData.monto_maximo_proyecto === 'string') ? parsed.formData.monto_maximo_proyecto : 0,
                            url_bases: parsed.formData.url_bases || '',
                            requisitos_minimos: parsed.formData.requisitos_minimos || '',
                            id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                            id_agenda_zonal: parsed.formData.id_agenda_zonal,
                            id_rubrica: parsed.formData.id_rubrica,
                            puntaje_minimo_aprobacion: (typeof parsed.formData.puntaje_minimo_aprobacion === 'number' || typeof parsed.formData.puntaje_minimo_aprobacion === 'string') ? parsed.formData.puntaje_minimo_aprobacion : 70.00,
                            financiamiento_ext: !!parsed.formData.financiamiento_ext,
                            meta_produccion: parsed.formData.meta_produccion || '',
                            fecha_apertura: parsed.formData.fecha_apertura || '',
                            fecha_cierre: parsed.formData.fecha_cierre || '',
                            lineas_ids: Array.isArray(parsed.formData.lineas_ids) ? parsed.formData.lineas_ids : [],
                            hitos: Array.isArray(parsed.formData.hitos) ? parsed.formData.hitos : [],
                            documentos_req: Array.isArray(parsed.formData.documentos_req) ? parsed.formData.documentos_req : []
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
                                presupuesto_total: (typeof parsed.formData.presupuesto_total === 'number' || typeof parsed.formData.presupuesto_total === 'string') ? parsed.formData.presupuesto_total : 0,
                                monto_maximo_proyecto: (typeof parsed.formData.monto_maximo_proyecto === 'number' || typeof parsed.formData.monto_maximo_proyecto === 'string') ? parsed.formData.monto_maximo_proyecto : 0,
                                url_bases: parsed.formData.url_bases || '',
                                requisitos_minimos: parsed.formData.requisitos_minimos || '',
                                id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                                id_agenda_zonal: parsed.formData.id_agenda_zonal,
                                id_rubrica: parsed.formData.id_rubrica,
                                puntaje_minimo_aprobacion: (typeof parsed.formData.puntaje_minimo_aprobacion === 'number' || typeof parsed.formData.puntaje_minimo_aprobacion === 'string') ? parsed.formData.puntaje_minimo_aprobacion : 70.00,
                                financiamiento_ext: !!parsed.formData.financiamiento_ext,
                                meta_produccion: parsed.formData.meta_produccion || '',
                                fecha_apertura: parsed.formData.fecha_apertura || '',
                                fecha_cierre: parsed.formData.fecha_cierre || '',
                                lineas_ids: Array.isArray(parsed.formData.lineas_ids) ? parsed.formData.lineas_ids : [],
                                hitos: Array.isArray(parsed.formData.hitos) ? parsed.formData.hitos : [],
                                documentos_req: Array.isArray(parsed.formData.documentos_req) ? parsed.formData.documentos_req : []
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
                        presupuesto_total: item.presupuesto_total || 0,
                        monto_maximo_proyecto: item.monto_maximo_proyecto || 0,
                        url_bases: item.url_bases || '',
                        requisitos_minimos: item.requisitos_minimos || '',
                        id_tipo_convocatoria: item.id_tipo_convocatoria,
                        id_agenda_zonal: item.id_agenda_zonal,
                        id_rubrica: item.id_rubrica,
                        puntaje_minimo_aprobacion: item.puntaje_minimo_aprobacion || 70,
                        financiamiento_ext: item.financiamiento_ext,
                        meta_produccion: item.meta_produccion || '',
                        fecha_apertura: item.fecha_apertura,
                        fecha_cierre: item.fecha_cierre,
                        lineas_ids: item.lineas_ids || [],
                        hitos: item.hitos || [],
                        documentos_req: item.documentos_req || []
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
                        presupuesto_total: (typeof parsed.formData.presupuesto_total === 'number' || typeof parsed.formData.presupuesto_total === 'string') ? parsed.formData.presupuesto_total : 0,
                        monto_maximo_proyecto: (typeof parsed.formData.monto_maximo_proyecto === 'number' || typeof parsed.formData.monto_maximo_proyecto === 'string') ? parsed.formData.monto_maximo_proyecto : 0,
                        url_bases: parsed.formData.url_bases || '',
                        requisitos_minimos: parsed.formData.requisitos_minimos || '',
                        id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                        id_agenda_zonal: parsed.formData.id_agenda_zonal,
                        id_rubrica: parsed.formData.id_rubrica,
                        puntaje_minimo_aprobacion: (typeof parsed.formData.puntaje_minimo_aprobacion === 'number' || typeof parsed.formData.puntaje_minimo_aprobacion === 'string') ? parsed.formData.puntaje_minimo_aprobacion : 70.00,
                        financiamiento_ext: !!parsed.formData.financiamiento_ext,
                        meta_produccion: parsed.formData.meta_produccion || '',
                        fecha_apertura: parsed.formData.fecha_apertura || '',
                        fecha_cierre: parsed.formData.fecha_cierre || '',
                        lineas_ids: Array.isArray(parsed.formData.lineas_ids) ? parsed.formData.lineas_ids : [],
                        hitos: Array.isArray(parsed.formData.hitos) ? parsed.formData.hitos : [],
                        documentos_req: Array.isArray(parsed.formData.documentos_req) ? parsed.formData.documentos_req : []
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
                    Number(formData.anio) !== conv.anio ||
                    formData.descripcion !== (conv.descripcion || '') ||
                    Number(formData.presupuesto_total) !== (conv.presupuesto_total || 0) ||
                    Number(formData.monto_maximo_proyecto) !== (conv.monto_maximo_proyecto || 0) ||
                    formData.fecha_apertura !== conv.fecha_apertura ||
                    formData.fecha_cierre !== conv.fecha_cierre ||
                    Number(formData.puntaje_minimo_aprobacion) !== (conv.puntaje_minimo_aprobacion || 70) ||
                    JSON.stringify(formData.lineas_ids.slice().sort()) !== JSON.stringify((conv.lineas_ids || []).slice().sort()) ||
                    JSON.stringify(formData.hitos) !== JSON.stringify(conv.hitos || []) ||
                    JSON.stringify(formData.documentos_req) !== JSON.stringify(conv.documentos_req || []);
            }
        } else {
            hasChanges =
                formData.codigo_convocatoria.trim() !== '' ||
                formData.titulo.trim() !== '' ||
                formData.descripcion.trim() !== '' ||
                formData.lineas_ids.length > 0 ||
                formData.hitos.length > 0 ||
                formData.documentos_req.length > 0;
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

            setFormFieldErrors({});
            const payload = {
                ...formData,
                anio: parseInt(formData.anio.toString()) || new Date().getFullYear(),
                presupuesto_total: formData.presupuesto_total === '' ? 0 : parseFloat(formData.presupuesto_total.toString()),
                monto_maximo_proyecto: formData.monto_maximo_proyecto === '' ? 0 : parseFloat(formData.monto_maximo_proyecto.toString()),
                puntaje_minimo_aprobacion: formData.puntaje_minimo_aprobacion === '' ? 70.00 : parseFloat(formData.puntaje_minimo_aprobacion.toString())
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
                        presupuesto_total: (typeof parsed.formData.presupuesto_total === 'number' || typeof parsed.formData.presupuesto_total === 'string') ? parsed.formData.presupuesto_total : 0,
                        monto_maximo_proyecto: (typeof parsed.formData.monto_maximo_proyecto === 'number' || typeof parsed.formData.monto_maximo_proyecto === 'string') ? parsed.formData.monto_maximo_proyecto : 0,
                        url_bases: parsed.formData.url_bases || '',
                        requisitos_minimos: parsed.formData.requisitos_minimos || '',
                        id_tipo_convocatoria: parsed.formData.id_tipo_convocatoria,
                        id_agenda_zonal: parsed.formData.id_agenda_zonal,
                        id_rubrica: parsed.formData.id_rubrica,
                        puntaje_minimo_aprobacion: (typeof parsed.formData.puntaje_minimo_aprobacion === 'number' || typeof parsed.formData.puntaje_minimo_aprobacion === 'string') ? parsed.formData.puntaje_minimo_aprobacion : 70.00,
                        financiamiento_ext: !!parsed.formData.financiamiento_ext,
                        meta_produccion: parsed.formData.meta_produccion || '',
                        fecha_apertura: parsed.formData.fecha_apertura || '',
                        fecha_cierre: parsed.formData.fecha_cierre || '',
                        lineas_ids: Array.isArray(parsed.formData.lineas_ids) ? parsed.formData.lineas_ids : [],
                        hitos: Array.isArray(parsed.formData.hitos) ? parsed.formData.hitos : [],
                        documentos_req: Array.isArray(parsed.formData.documentos_req) ? parsed.formData.documentos_req : []
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
                presupuesto_total: conv.presupuesto_total || 0,
                monto_maximo_proyecto: conv.monto_maximo_proyecto || 0,
                url_bases: conv.url_bases || '',
                requisitos_minimos: conv.requisitos_minimos || '',
                id_tipo_convocatoria: conv.id_tipo_convocatoria,
                id_agenda_zonal: conv.id_agenda_zonal,
                id_rubrica: conv.id_rubrica,
                puntaje_minimo_aprobacion: conv.puntaje_minimo_aprobacion || 70,
                financiamiento_ext: conv.financiamiento_ext,
                meta_produccion: conv.meta_produccion || '',
                fecha_apertura: conv.fecha_apertura,
                fecha_cierre: conv.fecha_cierre,
                lineas_ids: conv.lineas_ids || [],
                hitos: conv.hitos || [],
                documentos_req: conv.documentos_req || []
            });
            setIsDraftRestored(false);
        }
        isInitializedRef.current = true;
        setShowModal(true);
    };

    const handleDelete = async (uuid: string) => {
        if (!await confirm({
            title: "Eliminar Convocatoria",
            message: "¿Estás seguro de eliminar esta convocatoria?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/Convocatorias/${uuid}`);
            fetchConvocatorias();
        } catch (error) {
            console.error('Error deleting convocatoria:', error);
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
            anio: new Date().getFullYear(),
            descripcion: '',
            presupuesto_total: 0,
            monto_maximo_proyecto: 0,
            url_bases: '',
            requisitos_minimos: '',
            id_tipo_convocatoria: undefined,
            id_agenda_zonal: undefined,
            id_rubrica: undefined,
            puntaje_minimo_aprobacion: 70.00,
            financiamiento_ext: false,
            meta_produccion: '',
            fecha_apertura: '',
            fecha_cierre: '',
            lineas_ids: [],
            hitos: [],
            documentos_req: []
        });
        setIsEditing(false);
        setSelectedUuid(null);
        setShowAdvanced(false);
        setIsDraftRestored(false);
    };

    const toggleLinea = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id)
                ? prev.lineas_ids.filter(lineaId => lineaId !== id)
                : [...prev.lineas_ids, id]
        }));
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
    const fondoTotalPeriodo = getFondoTotalConvocatorias(convocatorias);
    const proximasACerrar = getProximasACerrar(convocatorias);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <style>{`
                .row-last-active {
                    border-left-color: var(--brand, #0070f3) !important;
                    background-color: var(--brand-subtle, rgba(0, 112, 243, 0.06)) !important;
                    border-left-width: 2px !important;
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
                            className={`bento-card px-5 py-6 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-0 group cursor-pointer border-l-2 ${
                                selectedConvocatoria?.uuid === conv.uuid 
                                    ? 'bg-brand/10 border-brand' 
                                    : (!selectedConvocatoria && lastActiveUuid === conv.uuid)
                                        ? 'row-last-active'
                                        : 'border-transparent'
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
                                            <span className="flex items-center gap-1 shrink-0"><Calendar size={12} /> {conv.anio}</span>
                                            <span className="flex items-center gap-1 min-w-0 break-words"><ShieldCheck size={12} className="shrink-0" /> {conv.periodo_nombre || conv.id_periodo}</span>
                                        </div>
                                        {(getFondoConvocatoria(conv) > 0 || getTopeProyecto(conv) != null) && (
                                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 normal-case">
                                                {getFondoConvocatoria(conv) > 0 && (
                                                    <span className="flex items-center gap-1.5 text-text-main font-semibold">
                                                        <DollarSign size={12} className="text-brand shrink-0" />
                                                        <span className="text-[10px] text-text-dim font-medium uppercase tracking-tight">Fondo</span>
                                                        {formatMonto(getFondoConvocatoria(conv))}
                                                    </span>
                                                )}
                                                {getTopeProyecto(conv) != null && (
                                                    <span className="flex items-center gap-1.5 text-text-dim font-medium">
                                                        <span className="text-[10px] uppercase tracking-tight">Max/proy</span>
                                                        {formatMonto(getTopeProyecto(conv)!)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {conv.rubrica_nombre && (
                                            <span className="flex items-start gap-1.5 min-w-0 break-words normal-case leading-relaxed">
                                                <Layers size={12} className="shrink-0 mt-px" />
                                                {conv.rubrica_nombre}
                                            </span>
                                        )}
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
                                label: 'Fondo Total',
                                value: fondoTotalPeriodo,
                                displayValue: formatMonto(fondoTotalPeriodo),
                                max: Math.max(fondoTotalPeriodo, 1),
                                color: 'var(--info)',
                                hint: 'Suma del presupuesto institucional (fondo) de cada convocatoria. No es el tope máximo por proyecto.'
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
                                                        presupuesto_total: conv.presupuesto_total || 0,
                                                        monto_maximo_proyecto: conv.monto_maximo_proyecto || 0,
                                                        url_bases: conv.url_bases || '',
                                                        requisitos_minimos: conv.requisitos_minimos || '',
                                                        id_tipo_convocatoria: conv.id_tipo_convocatoria,
                                                        id_agenda_zonal: conv.id_agenda_zonal,
                                                        id_rubrica: conv.id_rubrica,
                                                        puntaje_minimo_aprobacion: conv.puntaje_minimo_aprobacion || 70,
                                                        financiamiento_ext: conv.financiamiento_ext,
                                                        meta_produccion: conv.meta_produccion || '',
                                                        fecha_apertura: conv.fecha_apertura,
                                                        fecha_cierre: conv.fecha_cierre,
                                                        lineas_ids: conv.lineas_ids || [],
                                                        hitos: conv.hitos || [],
                                                        documentos_req: conv.documentos_req || []
                                                    });
                                                }
                                            } else {
                                                setFormData({
                                                    codigo_convocatoria: '',
                                                    titulo: '',
                                                    id_periodo: periodos[0]?.id_periodo || '',
                                                    anio: new Date().getFullYear(),
                                                    descripcion: '',
                                                    presupuesto_total: 0,
                                                    monto_maximo_proyecto: 0,
                                                    url_bases: '',
                                                    requisitos_minimos: '',
                                                    id_tipo_convocatoria: undefined,
                                                    id_agenda_zonal: undefined,
                                                    id_rubrica: undefined,
                                                    puntaje_minimo_aprobacion: 70.00,
                                                    financiamiento_ext: false,
                                                    meta_produccion: '',
                                                    fecha_apertura: '',
                                                    fecha_cierre: '',
                                                    lineas_ids: [],
                                                    hitos: [],
                                                    documentos_req: []
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
                                        Revertir al original
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
                                        type="number"
                                        required
                                        className="input-vercel"
                                        value={formData.anio}
                                        onChange={e => setFormData({ ...formData, anio: e.target.value })}
                                    />
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fondo Total</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="input-vercel !pl-10"
                                            value={formatMontoInputDisplay(formData.presupuesto_total)}
                                            onChange={e => setFormData({ ...formData, presupuesto_total: parseMontoInput(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tope por Proyecto</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="input-vercel !pl-10"
                                            placeholder="Tope por propuesta postulada"
                                            value={formatMontoInputDisplay(formData.monto_maximo_proyecto)}
                                            onChange={e => setFormData({ ...formData, monto_maximo_proyecto: parseMontoInput(e.target.value) })}
                                        />
                                    </div>
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

                            {/* Section: Líneas de Investigación */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <BookOpen size={12} /> Líneas de Investigación Habilitadas
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {lineas.map(l => (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => toggleLinea(l.id)}
                                            className={`text-left px-3 py-2 rounded border text-[11px] transition-all ${formData.lineas_ids.includes(l.id)
                                                    ? 'bg-text-main/10 border-text-main text-text-main font-bold'
                                                    : 'bg-surface border-border-thin text-text-dim hover:border-text-main'
                                                }`}
                                        >
                                            {l.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Section Toggle */}
                            <div className="pt-4 border-t border-border-thin">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest hover:text-text-main transition-colors"
                                >
                                    <ChevronRight size={14} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                    Configuración Avanzada (Excelencia 2026)
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="space-y-6 animate-fade-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Rúbrica de Evaluación</label>
                                            <select
                                                className="input-vercel"
                                                value={formData.id_rubrica || ''}
                                                onChange={e => setFormData({ ...formData, id_rubrica: e.target.value ? parseInt(e.target.value) : undefined })}
                                            >
                                                <option value="">Seleccionar Rúbrica...</option>
                                                {rubricas.map(r => (
                                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Puntaje Mínimo (Aprobación)</label>
                                            <input
                                                type="number"
                                                className="input-vercel"
                                                value={formData.puntaje_minimo_aprobacion}
                                                onChange={e => setFormData({ ...formData, puntaje_minimo_aprobacion: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tipo de Convocatoria</label>
                                            <select
                                                className="input-vercel"
                                                value={formData.id_tipo_convocatoria || ''}
                                                onChange={e => setFormData({ ...formData, id_tipo_convocatoria: e.target.value ? parseInt(e.target.value) : undefined })}
                                            >
                                                <option value="">Seleccionar Tipo...</option>
                                                {tiposConv.map(t => (
                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Agenda Zonal Prioritaria</label>
                                            <select
                                                className="input-vercel"
                                                value={formData.id_agenda_zonal || ''}
                                                onChange={e => setFormData({ ...formData, id_agenda_zonal: e.target.value ? parseInt(e.target.value) : undefined })}
                                            >
                                                <option value="">Seleccionar Agenda...</option>
                                                {agendas.map(a => (
                                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Meta de Producción Esperada</label>
                                        <input
                                            className="input-vercel"
                                            placeholder="EJ: Artículo Scopus / Patente SENADI"
                                            value={formData.meta_produccion}
                                            onChange={e => setFormData({ ...formData, meta_produccion: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-surface p-4 rounded-md border border-border-thin">
                                        <input
                                            type="checkbox"
                                            id="financiamiento_ext"
                                            className="w-4 h-4 rounded bg-bg-deep border-border-thin text-text-main focus:ring-0"
                                            checked={formData.financiamiento_ext}
                                            onChange={e => setFormData({ ...formData, financiamiento_ext: e.target.checked })}
                                        />
                                        <label htmlFor="financiamiento_ext" className="text-xs text-text-main font-medium cursor-pointer">
                                            Requiere Cofinanciamiento Externo (Empresa/ONG)
                                        </label>
                                    </div>

                                    {/* Nueva Sección: Calendario del Proceso (Hitos) */}
                                    <div className="space-y-4 pt-4 border-t border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <CalendarDays size={12} /> Calendario del Proceso (Hitos)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, hitos: [...formData.hitos, { nombre_hito: '', fecha_hito: '', es_critico: false }] })}
                                                className="btn-vercel-secondary"
                                            >
                                                + Añadir Hito
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.hitos.map((hito, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-3 bg-surface p-3 rounded border border-border-thin relative group">
                                                    <div className="col-span-6">
                                                        <input
                                                            className="input-vercel text-xs py-1.5"
                                                            placeholder="Nombre del hito (Ej: Resultados)"
                                                            value={hito.nombre_hito}
                                                            onChange={e => {
                                                                const newHitos = [...formData.hitos];
                                                                newHitos[idx].nombre_hito = e.target.value;
                                                                setFormData({ ...formData, hitos: newHitos });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input
                                                            type="date"
                                                            className="input-vercel text-xs py-1.5"
                                                            value={hito.fecha_hito}
                                                            onChange={e => {
                                                                const newHitos = [...formData.hitos];
                                                                newHitos[idx].fecha_hito = e.target.value;
                                                                setFormData({ ...formData, hitos: newHitos });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, hitos: formData.hitos.filter((_, i) => i !== idx) })}
                                                            className="text-text-dim hover:text-error transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Nueva Sección: Documentación Requerida */}
                                    <div className="space-y-4 pt-4 border-t border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <FileText size={12} /> Documentación Obligatoria (Checklist)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, documentos_req: [...formData.documentos_req, { nombre_documento: '', es_obligatorio: true }] })}
                                                className="btn-vercel-secondary"
                                            >
                                                + Añadir Documento
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.documentos_req.map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-surface p-3 rounded border border-border-thin relative group">
                                                    <input
                                                        className="input-vercel flex-1 text-xs py-1.5"
                                                        placeholder="Nombre del documento (Ej: Certificado de Título)"
                                                        value={doc.nombre_documento}
                                                        onChange={e => {
                                                            const newDocs = [...formData.documentos_req];
                                                            newDocs[idx].nombre_documento = e.target.value;
                                                            setFormData({ ...formData, documentos_req: newDocs });
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={doc.es_obligatorio}
                                                            onChange={e => {
                                                                const newDocs = [...formData.documentos_req];
                                                                newDocs[idx].es_obligatorio = e.target.checked;
                                                                setFormData({ ...formData, documentos_req: newDocs });
                                                            }}
                                                        />
                                                        <span className="text-[9px] font-bold text-text-dim uppercase">Obligatorio</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, documentos_req: formData.documentos_req.filter((_, i) => i !== idx) })}
                                                        className="text-text-dim hover:text-error transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} /> Fondo Total
                                    </div>
                                    <div className="text-sm font-bold text-brand font-mono">
                                        {getFondoConvocatoria(selectedConvocatoria) > 0
                                            ? formatMonto(getFondoConvocatoria(selectedConvocatoria))
                                            : 'No configurado'}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} /> Tope por Proyecto
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-mono">
                                        {getTopeProyecto(selectedConvocatoria) != null
                                            ? formatMonto(getTopeProyecto(selectedConvocatoria)!)
                                            : 'No configurado'}
                                    </div>
                                </div>
                                <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers size={12} /> Rúbrica Evaluativa
                                    </div>
                                    <div className="text-sm font-bold text-text-main break-words leading-snug">
                                        {selectedConvocatoria.rubrica_nombre || 'Rúbrica Estándar ISTPET'}
                                    </div>
                                </div>
                            </div>

                            <div className="bento-card static p-6 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-main uppercase tracking-wider">
                                    <BookOpen size={14} /> Configuración Académica & Auditoría
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                    Esta convocatoria tiene un puntaje mínimo de aprobación de <strong>{selectedConvocatoria.puntaje_minimo_aprobacion}%</strong> para la evaluación anónima por pares. Cualquier cambio de estado a "Abierta" publicará las bases a los docentes inmediatamente.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Requisitos & Documentos Exigidos</h4>
                                <div className="space-y-2">
                                    {selectedConvocatoria.documentos_req && selectedConvocatoria.documentos_req.length > 0 ? (
                                        selectedConvocatoria.documentos_req.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bento-card static text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main">{doc.nombre_documento}</span>
                                                    {doc.descripcion && <span className="text-[10px] text-text-dim">{doc.descripcion}</span>}
                                                </div>
                                                <span className={doc.es_obligatorio ? 'text-xs font-semibold text-error' : 'text-xs font-semibold text-text-dim'}>
                                                    {doc.es_obligatorio ? 'Obligatorio' : 'Opcional'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-text-dim">No se configuraron documentos específicos.</p>
                                    )}
                                </div>
                            </div>
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
                                            className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] z-50 w-52 max-w-[min(13rem,calc(100vw-3rem))] px-3 py-2 rounded-lg text-[10px] font-normal normal-case leading-relaxed tracking-normal text-text-main bg-surface border border-border-thin shadow-lg pointer-events-none transition-opacity duration-150 ${
                                                isHintOpen
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
