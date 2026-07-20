import { useState } from 'react';
import api from '../../../../../api/axios_config';
import type { Group, ConfirmDialogState } from '../types';
import { getGroupChanges } from '../utils';
import { useVoiceRecorder } from './useVoiceRecorder';

interface UseGroupsReviewOptions {
    fetchData: () => Promise<void>;
    setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
    setDetailGroup: React.Dispatch<React.SetStateAction<Group | null>>;
}

export function useGroupsReview({ fetchData, setConfirmDialog, setDetailGroup }: UseGroupsReviewOptions) {
    const [reviewingGroup, setReviewingGroup] = useState<Group | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewResolution, setReviewResolution] = useState('');
    const [rejectObservations, setRejectObservations] = useState('');
    const [isReviewRejecting, setIsReviewRejecting] = useState(false);
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const voiceRecorder = useVoiceRecorder();

    const handleCloseReviewModal = async () => {
        if (reviewingGroup) {
            try {
                await api.patch(`/Groups/${reviewingGroup.uuid}/cancel-review`);
            } catch (err) {
                console.error("Error al desbloquear el grupo:", err);
            }
        }
        setReviewResolution('');
        setRejectObservations('');
        voiceRecorder.clearAudio();
        setIsReviewModalOpen(false);
        setReviewingGroup(null);
        fetchData();
    };

    const handleOpenReview = async (group: Group) => {
        try {
            // Verificar concurrencia al abrir el panel de evaluación
            const freshRes = await api.get(`/Groups/${group.uuid}`);
            const freshGroup = freshRes.data;

            // skipMembers=true: el objeto `group` viene de la tabla (no tiene miembros completos)
            const changesList = getGroupChanges(freshGroup, group, true);
            if (changesList.length > 0) {
                const fieldsStr = changesList.join(', ');
                setConfirmDialog({
                    isOpen: true,
                    title: 'Propuesta Modificada',
                    message: `¡Atención! La propuesta de grupo ha sido modificada por otro usuario mientras la revisabas. Se detectaron cambios específicos en: [${fieldsStr}]. La propuesta se recargará con los nuevos cambios para que puedas revisarlos antes de evaluar.`,
                    type: 'warning',
                    isAlert: true,
                    confirmText: 'Aceptar',
                    onConfirm: () => {
                        setDetailGroup(freshGroup);
                        fetchData();
                    }
                });
                return;
            }

            // Bloquear la propuesta cambiando su estado a "En Evaluación"
            await api.patch(`/Groups/${freshGroup.uuid}/start-review`);

            setDetailGroup(null);
            setReviewingGroup({ ...freshGroup, estado: 'En Evaluación' });
            setReviewResolution('');
            setRejectObservations('');
            voiceRecorder.clearAudio();
            setIsReviewRejecting(false);
            setIsReviewModalOpen(true);
        } catch (err: any) {
            console.error("Error al abrir evaluación:", err);
            setConfirmDialog({
                isOpen: true,
                title: 'Error de Carga',
                message: 'No se pudieron cargar los datos actualizados del grupo para evaluar o el grupo ya se encuentra bajo revisión.',
                type: 'danger',
                isAlert: true,
                confirmText: 'Aceptar',
                onConfirm: () => { }
            });
        }
    };

    const handleApprove = async () => {
        if (!reviewResolution.trim()) {
            setConfirmDialog({
                isOpen: true,
                title: 'Campo Obligatorio',
                message: 'Debe especificar el número de resolución de aprobación.',
                type: 'warning',
                isAlert: true,
                confirmText: 'Aceptar',
                onConfirm: () => { }
            });
            return;
        }
        if (!reviewingGroup) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Aprobación',
            message: `¿Está seguro de aprobar formalmente el grupo "${reviewingGroup.nombre}" bajo la resolución ${reviewResolution}?`,
            type: 'success',
            onConfirm: async () => {
                setIsConfirming(true);
                try {
                    const freshRes = await api.get(`/Groups/${reviewingGroup.uuid}`);
                    const freshGroup = freshRes.data;
                    const changesList = getGroupChanges(freshGroup, reviewingGroup);
                    const filteredChanges = changesList.filter(c => c !== "Estado");

                    if (filteredChanges.length > 0) {
                        const fieldsStr = filteredChanges.join(', ');
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Propuesta Modificada',
                            message: `¡Atención! La propuesta de grupo ha sido modificada por otro usuario mientras la evaluabas. Se detectaron cambios específicos en: [${fieldsStr}]. La propuesta se recargará con los nuevos cambios para que puedas revisarlos antes de evaluar.`,
                            type: 'warning',
                            isAlert: true,
                            confirmText: 'Aceptar',
                            onConfirm: () => {
                                setIsReviewModalOpen(false);
                                setReviewingGroup(null);
                                setDetailGroup(freshGroup);
                                fetchData();
                            }
                        });
                        return;
                    }

                    await api.patch(`/Groups/${reviewingGroup.uuid}/review`, {
                        aprobado: true,
                        resolucion: reviewResolution.trim(),
                    });
                    setIsReviewModalOpen(false);
                    setReviewingGroup(null);
                    setReviewResolution('');
                    fetchData();
                } catch (err: any) {
                    console.error("Error al aprobar grupo:", err);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error de Servidor',
                        message: "Error al procesar la aprobación: " + (err.response?.data?.message || err.message),
                        type: 'danger',
                        isAlert: true,
                        confirmText: 'Aceptar',
                        onConfirm: () => { }
                    });
                } finally {
                    setIsConfirming(false);
                }
            }
        });
    };

    const handleRejectReview = async () => {
        if (!rejectObservations.trim() && !voiceRecorder.audioBlob) {
            setConfirmDialog({
                isOpen: true,
                title: 'Campos Obligatorios',
                message: 'Debe ingresar observaciones escritas o grabar retroalimentación de voz explicando los motivos del rechazo.',
                type: 'warning',
                isAlert: true,
                confirmText: 'Aceptar',
                onConfirm: () => { }
            });
            return;
        }
        if (!reviewingGroup) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Rechazo',
            message: `¿Está seguro de rechazar la propuesta del grupo "${reviewingGroup.nombre}"? Se devolverá al docente para correcciones.`,
            type: 'danger',
            onConfirm: async () => {
                setSendingFeedback(true);
                setIsConfirming(true);
                try {
                    const freshRes = await api.get(`/Groups/${reviewingGroup.uuid}`);
                    const freshGroup = freshRes.data;
                    const changesList = getGroupChanges(freshGroup, reviewingGroup);
                    const filteredChanges = changesList.filter(c => c !== "Estado");

                    if (filteredChanges.length > 0) {
                        const fieldsStr = filteredChanges.join(', ');
                        setConfirmDialog({
                            isOpen: true,
                            title: 'Propuesta Modificada',
                            message: `¡Atención! La propuesta de grupo ha sido modificada por otro usuario mientras la evaluabas. Se detectaron cambios específicos en: [${fieldsStr}]. La propuesta se recargará con los nuevos cambios para que puedas revisarlos antes de evaluar.`,
                            type: 'warning',
                            isAlert: true,
                            confirmText: 'Aceptar',
                            onConfirm: () => {
                                setIsReviewModalOpen(false);
                                setReviewingGroup(null);
                                setDetailGroup(freshGroup);
                                fetchData();
                            }
                        });
                        return;
                    }

                    let contentStr = rejectObservations.trim();

                    if (voiceRecorder.audioBlob) {
                        const formDataObj = new FormData();
                        formDataObj.append('file', voiceRecorder.audioBlob, `audio_reject_${Date.now()}.webm`);
                        const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });

                        const payload = {
                            type: 'audio',
                            audioUrl: uploadRes.data.url,
                            text: rejectObservations.trim() || 'Retroalimentación de voz del evaluador'
                        };
                        contentStr = JSON.stringify(payload);
                    }

                    if (contentStr) {
                        await api.post('/collaboration/comments', {
                            documentoUuid: reviewingGroup.uuid,
                            DocumentoUuid: reviewingGroup.uuid,
                            documento_uuid: reviewingGroup.uuid,
                            contenido: contentStr,
                            Contenido: contentStr,
                        });
                    }

                    await api.patch(`/Groups/${reviewingGroup.uuid}/review`, {
                        aprobado: false,
                    });

                    setIsReviewModalOpen(false);
                    setReviewingGroup(null);
                    fetchData();
                } catch (err: any) {
                    console.error("Error al rechazar grupo:", err);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Error de Servidor',
                        message: "Error al procesar el rechazo: " + (err.response?.data?.message || err.message),
                        type: 'danger',
                        isAlert: true,
                        confirmText: 'Aceptar',
                        onConfirm: () => { }
                    });
                } finally {
                    setSendingFeedback(false);
                    setIsConfirming(false);
                }
            }
        });
    };

    return {
        reviewingGroup,
        isReviewModalOpen,
        reviewResolution,
        setReviewResolution,
        rejectObservations,
        setRejectObservations,
        isReviewRejecting,
        setIsReviewRejecting,
        sendingFeedback,
        isConfirming,
        handleCloseReviewModal,
        handleOpenReview,
        handleApprove,
        handleRejectReview,
        voiceRecorder
    };
}
