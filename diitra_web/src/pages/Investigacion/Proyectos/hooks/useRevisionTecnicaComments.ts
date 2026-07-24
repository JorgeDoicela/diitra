import { useState, useEffect } from 'react';
import { FIELD_LABELS } from '../types/revisionTecnicaTypes';
import type { SectionComment } from '../types/revisionTecnicaTypes';
import api from '../../../../api/axios_config';

interface UseRevisionTecnicaCommentsParams {
    projectUuid: string | undefined;
    activeCommentField: string;
    addToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const useRevisionTecnicaComments = ({
    projectUuid,
    activeCommentField,
    addToast
}: UseRevisionTecnicaCommentsParams) => {
    const [comments, setComments] = useState<Record<string, SectionComment[]>>({});
    const [contextualInput, setContextualInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

    useEffect(() => {
        setContextualInput('');
        setEditingCommentId(null);
    }, [activeCommentField]);

    const addCommentLocal = (section: string, comment: SectionComment) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updated = {
                ...prev,
                [section]: [...current, comment]
            };
            if (projectUuid) {
                localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const updateCommentLocal = (section: string, id: number, text: string) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updatedList = current.map(c => c.id === id ? { ...c, text } : c);
            const updated = {
                ...prev,
                [section]: updatedList
            };
            if (projectUuid) {
                localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const removeCommentLocal = (section: string, id: number) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updatedList = current.filter(c => c.id !== id);
            const updated = {
                ...prev,
                [section]: updatedList
            };
            if (projectUuid) {
                localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const saveContextualComment = async () => {
        if (!contextualInput.trim()) return;
        const newStatus = 'Corregir';
        const label = FIELD_LABELS[activeCommentField] || activeCommentField.toUpperCase();
        const content = `[${label}] (Observación): ${contextualInput.trim()}`;

        try {
            if (editingCommentId) {
                await api.put(`/collaboration/comments/${editingCommentId}`, {
                    contenido: content,
                    Contenido: content
                });

                updateCommentLocal(activeCommentField, editingCommentId, contextualInput.trim());
                setEditingCommentId(null);
            } else {
                const res = await api.post('/collaboration/comments', {
                    documentoUuid: projectUuid,
                    DocumentoUuid: projectUuid,
                    documento_uuid: projectUuid,
                    contenido: content,
                    Contenido: content,
                    idPadre: null,
                    IdPadre: null,
                    id_padre: null
                });

                const newId = res.data?.idComentario || res.data?.id || Date.now();

                addCommentLocal(activeCommentField, {
                    id: newId,
                    status: newStatus,
                    text: contextualInput.trim()
                });
            }

            setContextualInput("");
        } catch (err: any) {
            console.error("Error al persistir comentario en backend:", err);
            addToast("Error de conexión", "No se pudo sincronizar el comentario con el servidor backend.", "error");
        }
    };

    const handleStartListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addToast("Reconocimiento de voz no soportado", "Su navegador no es compatible con el dictado por voz.", "warning");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-EC';
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onerror = (e: any) => {
                console.error("Speech recognition error:", e);
                setIsListening(false);
                if (e.error === 'not-allowed') {
                    addToast("Permiso denegado", "Habilite el acceso al micrófono en su navegador para usar el dictado por voz.", "warning");
                } else if (e.error === 'no-speech') {
                    addToast("No se detectó voz", "No se escuchó ningún sonido. Intente hablar más fuerte o cerca del micrófono.", "info");
                } else {
                    addToast("Error de dictado", "No se pudo procesar el audio. Intente de nuevo.", "error");
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setContextualInput(prev => prev ? `${prev} ${transcript}` : transcript);
                    addToast("Audio transcrito", "Se ha insertado la nota de voz en las observaciones.", "success");
                }
            };

            recognition.start();
        } catch (err) {
            console.error(err);
            setIsListening(false);
        }
    };

    return {
        comments,
        setComments,
        contextualInput,
        setContextualInput,
        isListening,
        editingCommentId,
        setEditingCommentId,
        removeCommentLocal,
        saveContextualComment,
        handleStartListening
    };
};
