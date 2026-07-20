import { useState, useEffect, useCallback } from 'react';
import api from '../../../../../api/axios_config';
import { useNotifications } from '../../../../../api/NotificationsContext';
import { useConfirm } from '../../../../../api/ConfirmContext';

export interface ParsedObservations {
    general?: string;
    carrera?: string;
    titulo?: string;
    descripcion?: string;
    presupuesto?: string;
}

export const parseObservation = (obsText: string): ParsedObservations => {
    if (!obsText) return {};

    const hasAnyTag = obsText.includes('[GENERAL]') ||
        obsText.includes('[CARRERA/UNIDAD]') ||
        obsText.includes('[TEMA/TÍTULO]') ||
        obsText.includes('[DESCRIPCIÓN]') ||
        obsText.includes('[PRESUPUESTO]');

    if (!hasAnyTag) {
        return { general: obsText };
    }

    const parsed: ParsedObservations = {};

    const regexGeneral = /\[GENERAL\]\s*([\s\S]*?)(?=\[CARRERA\/UNIDAD\]|\[TEMA\/TÍTULO\]|\[DESCRIPCIÓN\]|\[PRESUPUESTO\]|$)/i;
    const regexCarrera = /\[CARRERA\/UNIDAD\]\s*([\s\S]*?)(?=\[GENERAL\]|\[TEMA\/TÍTULO\]|\[DESCRIPCIÓN\]|\[PRESUPUESTO\]|$)/i;
    const regexTitulo = /\[TEMA\/TÍTULO\]\s*([\s\S]*?)(?=\[GENERAL\]|\[CARRERA\/UNIDAD\]|\[DESCRIPCIÓN\]|\[PRESUPUESTO\]|$)/i;
    const regexDescripcion = /\[DESCRIPCIÓN\]\s*([\s\S]*?)(?=\[GENERAL\]|\[CARRERA\/UNIDAD\]|\[TEMA\/TÍTULO\]|\[PRESUPUESTO\]|$)/i;
    const regexPresupuesto = /\[PRESUPUESTO\]\s*([\s\S]*?)(?=\[GENERAL\]|\[CARRERA\/UNIDAD\]|\[TEMA\/TÍTULO\]|\[DESCRIPCIÓN\]|$)/i;

    const matchGeneral = obsText.match(regexGeneral);
    const matchCarrera = obsText.match(regexCarrera);
    const matchTitulo = obsText.match(regexTitulo);
    const matchDescripcion = obsText.match(regexDescripcion);
    const matchPresupuesto = obsText.match(regexPresupuesto);

    if (matchGeneral && matchGeneral[1].trim()) parsed.general = matchGeneral[1].trim();
    if (matchCarrera && matchCarrera[1].trim()) parsed.carrera = matchCarrera[1].trim();
    if (matchTitulo && matchTitulo[1].trim()) parsed.titulo = matchTitulo[1].trim();
    if (matchDescripcion && matchDescripcion[1].trim()) parsed.descripcion = matchDescripcion[1].trim();
    if (matchPresupuesto && matchPresupuesto[1].trim()) parsed.presupuesto = matchPresupuesto[1].trim();

    return parsed;
};

export const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return '';
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(num);
};

export function usePreproposalState(
    currentProject: any,
    resolvedProjectUuid: string | null,
    activeDocument: string | null,
    fetchProject: () => Promise<void>
) {
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [adminObservation, setAdminObservation] = useState('');
    const [feedbackMode, setFeedbackMode] = useState<'general' | 'secciones'>('general');
    const [sectionObservations, setSectionObservations] = useState({
        carrera: '',
        titulo: '',
        descripcion: '',
        presupuesto: ''
    });
    const [activeSectionTab, setActiveSectionTab] = useState<'carrera' | 'titulo' | 'descripcion' | 'presupuesto'>('carrera');
    const [isSubmittingAdminReview, setIsSubmittingAdminReview] = useState(false);

    const [editTitulo, setEditTitulo] = useState('');
    const [editDescripcion, setEditDescripcion] = useState('');
    const [editPresupuesto, setEditPresupuesto] = useState('');
    const [isSavingPreproposal, setIsSavingPreproposal] = useState(false);

    const [trazabilidad, setTrazabilidad] = useState<any[]>([]);
    const [isLoadingTrazabilidad, setIsLoadingTrazabilidad] = useState(false);

    const fetchTrazabilidad = useCallback(async () => {
        if (!resolvedProjectUuid) return;
        setIsLoadingTrazabilidad(true);
        try {
            const res = await api.get(`/projects/${resolvedProjectUuid}/traceability`);
            setTrazabilidad(res.data || []);
        } catch (e) {
            console.error("Error al cargar la trazabilidad", e);
        } finally {
            setIsLoadingTrazabilidad(false);
        }
    }, [resolvedProjectUuid]);

    useEffect(() => {
        fetchTrazabilidad();
    }, [fetchTrazabilidad]);

    useEffect(() => {
        if (currentProject) {
            setEditTitulo(currentProject.title || '');
            setEditDescripcion(currentProject.descripcion || '');
            setEditPresupuesto(currentProject.presupuesto?.toString() || '');
        }
    }, [currentProject]);

    const handleGuardarYReenviar = async (nuevoTitulo: string, nuevaDescripcion: string, nuevoPresupuesto: string) => {
        if (!nuevoTitulo.trim()) {
            addToast("Validación", "El título de la prepropuesta es obligatorio.", "warning");
            return;
        }
        if (!nuevaDescripcion.trim()) {
            addToast("Validación", "La descripción de la prepropuesta es obligatoria.", "warning");
            return;
        }
        const parsedBudget = parseFloat(nuevoPresupuesto);
        if (isNaN(parsedBudget) || parsedBudget <= 0) {
            addToast("Validación", "Debe ingresar un presupuesto estimado válido y mayor a cero.", "warning");
            return;
        }

        setIsSavingPreproposal(true);
        try {
            const docInstanceRes = await api.get(`/documents/instances/resolve`, {
                params: {
                    templateCode: 'PROTOCOLO_INVESTIGACION',
                    entityUuid: resolvedProjectUuid
                }
            });
            const pInstanceUuid = docInstanceRes.data?.uuid || docInstanceRes.data?.Uuid;
            if (!pInstanceUuid) throw new Error("No se pudo resolver el expediente del protocolo.");

            const instanceRes = await api.get(`/documents/instances/${pInstanceUuid}`);
            const currentMetadata = instanceRes.data?.data_snapshot_json
                ? JSON.parse(instanceRes.data.data_snapshot_json)
                : {};

            const updatedMetadata = {
                ...currentMetadata,
                Titulo: nuevoTitulo.trim().toUpperCase(),
                DescripcionProyecto: nuevaDescripcion.trim(),
                CostoTotal: parsedBudget,
                costoTotal: parsedBudget,
                costo_total: parsedBudget,
                PresupuestoEstimado: parsedBudget,
                presupuestoEstimado: parsedBudget,
                presupuesto_estimado: parsedBudget,
                Estado: 'Prepropuesta'
            };

            await api.patch(`/documents/instances/${pInstanceUuid}/metadata`, updatedMetadata);

            await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reenvío de prepropuesta corregida")}`);

            addToast(
                "Reenvío Exitoso",
                "Su prepropuesta ha sido corregida y reenviada para revisión.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta%20Rechazada&observation=${encodeURIComponent("Reversión (Undo): Cancelación del reenvío de la prepropuesta.")}`);
                        addToast("Acción Revertida", "El reenvío ha sido cancelado. Proyecto en estado: Prepropuesta Rechazada (en corrección)", "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        await fetchProject();
                    } catch (err: any) {
                        console.error("[Undo Resubmission] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer el reenvío de la prepropuesta.", "error");
                    }
                }
            );
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al reenviar prepropuesta", e);
            addToast("Error al Reenviar", e.response?.data?.message || "Ocurrió un error al intentar reenviar la prepropuesta.", "error");
        } finally {
            setIsSavingPreproposal(false);
        }
    };

    const handleAdminAprobarPrepropuesta = async () => {
        if (!currentProject?.uuid) return;

        if (!currentProject.title?.trim()) {
            addToast("Validación de Prepropuesta", "No se puede aprobar la prepropuesta porque el tema/título está vacío.", "warning");
            return;
        }

        if (!currentProject.descripcion?.trim()) {
            addToast("Validación de Prepropuesta", "No se puede aprobar la prepropuesta porque la descripción está vacía.", "warning");
            return;
        }

        if (!await confirm({
            title: "Aprobar Prepropuesta",
            message: `¿Está seguro de aprobar la idea del proyecto "${currentProject.title}"? Esto habilitará al docente para iniciar la formulación completa.`,
            confirmText: "Aprobar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        setIsSubmittingAdminReview(true);
        try {
            const lines = [];
            if (adminObservation.trim()) {
                lines.push(`[GENERAL] ${adminObservation.trim()}`);
            }
            if (sectionObservations.carrera.trim()) {
                lines.push(`[CARRERA/UNIDAD] ${sectionObservations.carrera.trim()}`);
            }
            if (sectionObservations.titulo.trim()) {
                lines.push(`[TEMA/TÍTULO] ${sectionObservations.titulo.trim()}`);
            }
            if (sectionObservations.descripcion.trim()) {
                lines.push(`[DESCRIPCIÓN] ${sectionObservations.descripcion.trim()}`);
            }
            if (sectionObservations.presupuesto.trim()) {
                lines.push(`[PRESUPUESTO] ${sectionObservations.presupuesto.trim()}`);
            }
            const finalObservation = lines.join('\n\n');

            const obs = finalObservation || "Idea de proyecto aprobada por Dirección de Investigación";
            await api.post(`/projects/${currentProject.uuid}/transition?newState=Borrador&observation=${encodeURIComponent(obs)}`);
            addToast(
                "Idea Aprobada",
                "La prepropuesta ha sido aprobada con éxito. Se ha notificado al docente.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reversión (Undo): Cancelación de la aprobación de la prepropuesta.")}`);
                        addToast("Acción Revertida", "La aprobación ha sido cancelada. Proyecto en estado: Prepropuesta", "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        await fetchProject();
                    } catch (err: any) {
                        console.error("[Undo Approval] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la aprobación de la prepropuesta.", "error");
                    }
                }
            );
            setAdminObservation('');
            setSectionObservations({ carrera: '', titulo: '', descripcion: '', presupuesto: '' });
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al aprobar prepropuesta", e);
            addToast("Error", e.response?.data?.message || "Ocurrió un error al intentar aprobar la prepropuesta.", "error");
        } finally {
            setIsSubmittingAdminReview(false);
        }
    };

    const handleAdminDevolverPrepropuesta = async () => {
        if (!currentProject?.uuid) return;

        const lines = [];
        if (adminObservation.trim()) {
            lines.push(`[GENERAL] ${adminObservation.trim()}`);
        }
        if (sectionObservations.carrera.trim()) {
            lines.push(`[CARRERA/UNIDAD] ${sectionObservations.carrera.trim()}`);
        }
        if (sectionObservations.titulo.trim()) {
            lines.push(`[TEMA/TÍTULO] ${sectionObservations.titulo.trim()}`);
        }
        if (sectionObservations.descripcion.trim()) {
            lines.push(`[DESCRIPCIÓN] ${sectionObservations.descripcion.trim()}`);
        }
        if (sectionObservations.presupuesto.trim()) {
            lines.push(`[PRESUPUESTO] ${sectionObservations.presupuesto.trim()}`);
        }
        const finalObservation = lines.join('\n\n');

        if (!finalObservation) {
            addToast("Validación", "Debe ingresar una observación detallando los motivos de la devolución.", "warning");
            return;
        }

        if (finalObservation.length < 10) {
            addToast("Validación", "Debe ingresar una observación detallada de al menos 10 caracteres para justificar la devolución.", "warning");
            return;
        }

        if (!await confirm({
            title: "Devolver Prepropuesta",
            message: "¿Está seguro de devolver esta prepropuesta al docente para correcciones?",
            confirmText: "Devolver",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;

        setIsSubmittingAdminReview(true);
        try {
            await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta%20Rechazada&observation=${encodeURIComponent(finalObservation)}`);
            addToast(
                "Prepropuesta Devuelta",
                "La prepropuesta ha sido devuelta al docente con sus observaciones.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reversión (Undo): Cancelación de la devolución de la prepropuesta.")}`);
                        addToast("Acción Revertida", "La devolución ha sido cancelada. Proyecto en estado: Prepropuesta", "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        await fetchProject();
                    } catch (err: any) {
                        console.error("[Undo Return] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la devolución de la prepropuesta.", "error");
                    }
                }
            );
            setAdminObservation('');
            setSectionObservations({ carrera: '', titulo: '', descripcion: '', presupuesto: '' });
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al devolver prepropuesta", e);
            addToast("Error", e.response?.data?.message || "Ocurrió un error al intentar devolver la prepropuesta.", "error");
        } finally {
            setIsSubmittingAdminReview(false);
        }
    };

    return {
        adminObservation,
        setAdminObservation,
        feedbackMode,
        setFeedbackMode,
        sectionObservations,
        setSectionObservations,
        activeSectionTab,
        setActiveSectionTab,
        isSubmittingAdminReview,
        editTitulo,
        setEditTitulo,
        editDescripcion,
        setEditDescripcion,
        editPresupuesto,
        setEditPresupuesto,
        isSavingPreproposal,
        trazabilidad,
        isLoadingTrazabilidad,
        fetchTrazabilidad,
        handleGuardarYReenviar,
        handleAdminAprobarPrepropuesta,
        handleAdminDevolverPrepropuesta
    };
}
