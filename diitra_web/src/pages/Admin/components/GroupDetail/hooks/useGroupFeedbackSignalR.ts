import { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../../../../../api/axios_config';
import { coworkLog } from '../../../../../core/cowork/utils/log';
import type { Group } from '../useGroupDetail';

interface UseGroupFeedbackSignalRProps {
    isOpen: boolean;
    detailGroup: Group | null;
    isMember: boolean | undefined;
    user: any;
    isAdmin: boolean;
    audioBlob: Blob | null;
    setAudioBlob: (blob: Blob | null) => void;
    setAudioUrl: (url: string) => void;
    confirm: (options: any) => Promise<boolean>;
}

export const useGroupFeedbackSignalR = ({
    isOpen,
    detailGroup,
    isMember,
    user,
    isAdmin,
    audioBlob,
    setAudioBlob,
    setAudioUrl,
    confirm
}: UseGroupFeedbackSignalRProps) => {
    const [feedbackComments, setFeedbackComments] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [newFeedbackText, setNewFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Contextual field feedback states
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
    const [activeFieldName, setActiveFieldName] = useState<string>('');
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [highlightedField, setHighlightedField] = useState<string | null>(null);

    // SignalR Hub Connection
    const [collabConnection, setCollabConnection] = useState<signalR.HubConnection | null>(null);

    const fetchFeedbackComments = async (uuid: string) => {
        setLoadingFeedback(true);
        try {
            const res = await api.get(`/collaboration/${uuid}/pulse`);
            if (res.data && res.data.comments) {
                const mappedComments = res.data.comments.map((c: any) => ({
                    idComentario: c.idComentario ?? c.id_comentario ?? c.idComentario,
                    usuarioUuid: c.usuarioUuid ?? c.usuario_uuid ?? '',
                    nombreUsuario: c.nombreUsuario ?? c.nombre_usuario ?? 'Usuario',
                    contenido: c.contenido ?? '',
                    idPadre: c.idPadre ?? c.id_padre ?? null,
                    creadoEn: c.creadoEn ?? c.creado_en ?? new Date().toISOString()
                }));
                const sorted = [...mappedComments].reverse();
                setFeedbackComments(sorted);
            } else {
                setFeedbackComments([]);
            }
        } catch (err) {
            console.error("Error al cargar comentarios de retroalimentación:", err);
            setFeedbackComments([]);
        } finally {
            setLoadingFeedback(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid || !isMember) return;
        fetchFeedbackComments(detailGroup.uuid);
    }, [isOpen, detailGroup?.uuid, isMember]);

    // SignalR Connection Effect
    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid || !isMember) {
            if (collabConnection) {
                collabConnection.stop();
                setCollabConnection(null);
            }
            return;
        }

        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const apiRoot = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;
        const hubUrl = `${apiRoot}/hubs/collaboration`;
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .build();

        let isSubscribed = true;

        newConnection.start()
            .then(async () => {
                if (!isSubscribed) {
                    newConnection.stop();
                    return;
                }
                coworkLog('[GroupsPage] Conexión de colaboración en tiempo real establecida');

                const userName = user?.nombre_completo || 'Usuario';
                const userUuid = user?.id_referencia || '0';
                const userRole = isAdmin ? 'Admin' : 'Docente';

                try {
                    await newConnection.invoke(
                        'JoinDocument',
                        detailGroup.uuid.toLowerCase().trim(),
                        userName,
                        userUuid,
                        userRole
                    );
                    coworkLog('[GroupsPage] Unido a la sala de colaboración:', detailGroup.uuid);
                } catch (err) {
                    console.error('[GroupsPage] Error al unirse a la sala:', err);
                }

                newConnection.on('NewCommentReceived', (data: any) => {
                    setFeedbackComments(prev => {
                        const commentId = data.idComentario || data.id_comentario || data.idComentario;
                        if (prev.some(c => (c.idComentario || c.id_comentario) === commentId)) {
                            return prev;
                        }
                        
                        const normalizedComment = {
                            idComentario: commentId,
                            usuarioUuid: data.usuarioUuid || data.usuario_uuid,
                            nombreUsuario: data.nombreUsuario || data.nombre_usuario,
                            contenido: data.contenido,
                            idPadre: data.idPadre || data.id_padre,
                            creadoEn: data.creadoEn || data.creado_en || new Date().toISOString()
                        };
                        return [...prev, normalizedComment];
                    });
                });

                newConnection.on('CommentUpdated', (data: any) => {
                    setFeedbackComments(prev => prev.map(c => {
                        const commentId = c.idComentario || c.id_comentario;
                        if (commentId === data.idComentario) {
                            return { ...c, contenido: data.contenido };
                        }
                        return c;
                    }));
                });

                newConnection.on('CommentDeleted', (data: any) => {
                    setFeedbackComments(prev => prev.filter(c => {
                        const commentId = c.idComentario || c.id_comentario;
                        return commentId !== data.idComentario;
                    }));
                });
            })
            .catch(err => {
                if (err.name === 'AbortError' || err.message?.includes('stop() was called')) {
                    return;
                }
                console.error('[GroupsPage] Error de conexión de SignalR:', err);
            });

        setCollabConnection(newConnection);

        return () => {
            isSubscribed = false;
            newConnection.stop().catch(() => {});
        };
    }, [isOpen, detailGroup?.uuid, isMember]);

    const handleSendFeedbackMessage = async (groupUuid: string, parentId?: number) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        setSendingFeedback(true);
        try {
            let contentStr = '';

            if (audioBlob) {
                const formDataObj = new FormData();
                formDataObj.append('file', audioBlob, `audio_feedback_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const payload = {
                    type: 'audio',
                    audioUrl: uploadRes.data.url,
                    text: newFeedbackText.trim() || 'Explicación de audio adjunta'
                };
                contentStr = JSON.stringify(payload);
            } else {
                contentStr = newFeedbackText.trim();
            }

            await api.post('/collaboration/comments', {
                documentoUuid: groupUuid,
                DocumentoUuid: groupUuid,
                documento_uuid: groupUuid,
                contenido: contentStr,
                Contenido: contentStr,
                idPadre: parentId || null,
                IdPadre: parentId || null,
                id_padre: parentId || null
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(groupUuid);
        } catch (err: any) {
            console.error("Error al enviar comentario de retroalimentación:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    const handleUpdateComment = async (id: number, nuevoContenido: string) => {
        try {
            await api.put(`/collaboration/comments/${id}`, { contenido: nuevoContenido });
            setEditingCommentId(null);
            setEditingCommentText('');
            if (detailGroup?.uuid) {
                await fetchFeedbackComments(detailGroup.uuid);
            }
        } catch (err: any) {
            console.error("Error al actualizar comentario:", err);
            alert("No se pudo actualizar el comentario: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteComment = async (id: number) => {
        const hasConfirmed = await confirm({
            title: 'Eliminar Comentario',
            message: '¿Está seguro de que desea eliminar este comentario? Esta acción eliminará también sus respuestas.',
            variant: 'destructive',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
        if (!hasConfirmed) return;

        try {
            await api.delete(`/collaboration/comments/${id}`);
            if (detailGroup?.uuid) {
                await fetchFeedbackComments(detailGroup.uuid);
            }
        } catch (err: any) {
            console.error("Error al eliminar comentario:", err);
            alert("No se pudo eliminar el comentario: " + (err.response?.data?.message || err.message));
        }
    };

    const parseCommentContent = (contenido: string) => {
        try {
            if (contenido.trim().startsWith('{')) {
                const parsed = JSON.parse(contenido);
                return parsed;
            }
        } catch (e) {}
        return null;
    };

    const getFieldComments = (fieldKey: string) => {
        return feedbackComments.filter(c => {
            const parsed = parseCommentContent(c.contenido);
            return parsed && parsed.type === 'field_feedback' && parsed.field === fieldKey;
        });
    };

    const openFieldFeedbackDrawer = (fieldKey: string, fieldName: string) => {
        setActiveFieldKey(fieldKey);
        setActiveFieldName(fieldName);
        setIsFieldModalOpen(true);
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleSendFieldFeedback = async (fieldKey: string, fieldName: string) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        if (!detailGroup?.uuid) {
            alert("Error: No se pudo identificar el grupo.");
            return;
        }
        setSendingFeedback(true);
        try {
            let uploadedAudioUrl = '';
            if (audioBlob) {
                const formDataObj = new FormData();
                formDataObj.append('file', audioBlob, `audio_field_${fieldKey}_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedAudioUrl = uploadRes.data.url;
            }

            const payload = {
                type: 'field_feedback',
                field: fieldKey,
                fieldName: fieldName,
                text: newFeedbackText.trim(),
                audioUrl: uploadedAudioUrl
            };
            const contentStr = JSON.stringify(payload);

            await api.post('/collaboration/comments', {
                documentoUuid: detailGroup.uuid,
                DocumentoUuid: detailGroup.uuid,
                documento_uuid: detailGroup.uuid,
                contenido: contentStr,
                Contenido: contentStr,
                idPadre: null,
                IdPadre: null,
                id_padre: null
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(detailGroup.uuid);
        } catch (err: any) {
            console.error("Error al enviar comentario de retroalimentación de campo:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    return {
        feedbackComments,
        loadingFeedback,
        newFeedbackText,
        setNewFeedbackText,
        sendingFeedback,
        editingCommentId,
        setEditingCommentId,
        editingCommentText,
        setEditingCommentText,
        activeFieldKey,
        setActiveFieldKey,
        activeFieldName,
        setActiveFieldName,
        isFieldModalOpen,
        setIsFieldModalOpen,
        highlightedField,
        setHighlightedField,
        fetchFeedbackComments,
        handleSendFeedbackMessage,
        handleUpdateComment,
        handleDeleteComment,
        getFieldComments,
        openFieldFeedbackDrawer,
        handleSendFieldFeedback
    };
};
