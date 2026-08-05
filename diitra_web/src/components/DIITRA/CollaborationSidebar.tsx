import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    MessageSquare,
    CheckCircle,
    Clock,
    Send,
    User,
    Activity,
    ChevronRight,
    Loader,
    Mic,
    Edit2,
    XCircle,
    Edit3,
    Eye,
    Shield
} from 'lucide-react';
import type { CoWorkHandle } from '../../core/cowork/types';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useConfirm } from '../../api/ConfirmContext';
import { coworkLog } from '../../core/cowork/utils/log';
import { AudioBubblePlayer } from '../../pages/Admin/components/AudioBubblePlayer';


interface CollaborationSidebarProps {
    instanceUuid: string;
    sectionName: string;
    cowork: CoWorkHandle;
    allSections: string[];
    entityUuid?: string;
    projectStatus?: string;
    templateCode?: string;
    onClose: () => void;
}

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
    instanceUuid,
    sectionName,
    cowork,
    allSections,
    entityUuid,
    projectStatus,
    templateCode,
    onClose
}) => {
    const { user } = useAuth();
    const confirm = useConfirm();

    const parseAuditComment = (contenido: string) => {
        const match = contenido.match(/^\[(.*?)\]\s*\((.*?)\):\s*(.*)$/);
        if (match) {
            return {
                seccion: match[1],
                estado: match[2],
                texto: match[3]
            };
        }
        return null;
    };

    const isProtocolDocument = useMemo(() => {
        return !templateCode || templateCode === 'PROTOCOLO_INVESTIGACION' || templateCode === 'PROTOCOLO_PEER_REVIEW';
    }, [templateCode]);

    const [activeTab, setActiveTabState] = useState<'comments' | 'status' | 'activity' | 'correcciones'>(() => {
        if (isProtocolDocument && projectStatus === 'En Corrección') return 'correcciones';
        const saved = localStorage.getItem('document_sidebar_tab');
        if (saved === 'correcciones' && !isProtocolDocument) return 'comments';
        return (saved === 'comments' || saved === 'status' || saved === 'activity' || saved === 'correcciones') ? saved : 'comments';
    });

    const setActiveTab = useCallback((tab: 'comments' | 'status' | 'activity' | 'correcciones') => {
        localStorage.setItem('document_sidebar_tab', tab);
        setActiveTabState(tab);
    }, []);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [sectionStatuses, setSectionStatuses] = useState<Record<string, string>>({});
    const [isLoadingPulse, setIsLoadingPulse] = useState(true);

    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Audio recording state & refs
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [sendingAudio, setSendingAudio] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [trazabilidad, setTrazabilidad] = useState<any[]>([]);
    const [isLoadingTrazabilidad, setIsLoadingTrazabilidad] = useState(false);

    useEffect(() => {
        const fetchTrazabilidad = async () => {
            if (!entityUuid) return;
            setIsLoadingTrazabilidad(true);
            try {
                const res = await api.get(`/projects/${entityUuid}/traceability`);
                setTrazabilidad(res.data || []);
            } catch (e) {
                console.error("Error al cargar la trazabilidad en Sidebar", e);
            } finally {
                setIsLoadingTrazabilidad(false);
            }
        };
        fetchTrazabilidad();
    }, [entityUuid]);

    const ultimaObservacion = useMemo(() => {
        if (isLoadingTrazabilidad) return "Cargando observaciones...";
        const lastCorrection = [...trazabilidad]
            .reverse()
            .find((t: any) => (t.estadoNuevo || t.EstadoNuevo) === 'En Corrección');
        return lastCorrection ? (lastCorrection.observacion || lastCorrection.Observacion) : null;
    }, [trazabilidad, isLoadingTrazabilidad]);

    const commentsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        requestAnimationFrame(() => {
            commentsEndRef.current?.scrollIntoView({ behavior, block: 'end' });
        });
    }, []);

    useEffect(() => {
        if (activeTab === 'comments' && comments.length > 0) {
            scrollToBottom('auto');
            const timer = setTimeout(() => scrollToBottom('smooth'), 100);
            return () => clearTimeout(timer);
        }
    }, [comments.length, activeTab, scrollToBottom]);

    // Cargar Pulso Inicial (Historial de comentarios y estados)
    useEffect(() => {
        const fetchInitialPulse = async () => {
            setIsLoadingPulse(true);
            try {
                const normalizedUuid = instanceUuid?.toLowerCase().trim();
                coworkLog('[TeamPulse] Fetching pulse for:', normalizedUuid);
                const res = await api.get(`/collaboration/${normalizedUuid}/pulse`);
                coworkLog('[TeamPulse] Response activities:', res.data.activities?.length, res.data.activities);
                if (res.data.comments) {
                    const mappedComments = res.data.comments.map((c: any) => ({
                        idComentario: c.idComentario ?? c.id_comentario ?? c.idComentario,
                        usuarioUuid: c.usuarioUuid ?? c.usuario_uuid ?? '',
                        nombreUsuario: c.nombreUsuario ?? c.nombre_usuario ?? 'Usuario',
                        contenido: c.contenido ?? '',
                        idPadre: c.idPadre ?? c.id_padre ?? null,
                        creadoEn: c.creadoEn ?? c.creado_en ?? new Date().toISOString()
                    }));
                    setComments(mappedComments.reverse());
                }
                if (res.data.statuses) {
                    const mappedStatuses: Record<string, string> = {};
                    Object.entries(res.data.statuses).forEach(([key, val]: [string, any]) => {
                        mappedStatuses[key] = typeof val === 'string' ? val : (val?.estado || 'Borrador');
                    });
                    setSectionStatuses(mappedStatuses);
                }
                if (res.data.activities) {
                    const mappedActivities = res.data.activities.map((a: any) => ({
                        userName: a.userName ?? a.user_name ?? 'Usuario',
                        action: a.action ?? '',
                        sectionName: a.sectionName ?? a.section_name ?? '',
                        timestamp: a.timestamp ?? ''
                    }));
                    setActivities(mappedActivities);
                }
            } catch (err) {
                console.error("[Team Pulse] Error al cargar pulso inicial:", err);
            } finally {
                setIsLoadingPulse(false);
            }
        };

        if (instanceUuid) {
            fetchInitialPulse();
        }
    }, [instanceUuid]);

    // Suscribirse a eventos de tiempo real del Hub CoWork
    useEffect(() => {
        if (!cowork) return;

        cowork.onNewCommentReceived((data) => {
            const normalized = {
                idComentario: data.idComentario ?? data.id_comentario ?? data.idComentario,
                usuarioUuid: data.usuarioUuid ?? data.usuario_uuid ?? '',
                nombreUsuario: data.nombreUsuario ?? data.nombre_usuario ?? 'Usuario',
                contenido: data.contenido ?? '',
                idPadre: data.idPadre ?? data.id_padre ?? null,
                creadoEn: data.creadoEn ?? data.creado_en ?? new Date().toISOString()
            };
            setComments(prev => {
                const commentId = normalized.idComentario;
                if (prev.some(c => c.idComentario === commentId)) return prev;
                return [...prev, normalized].slice(-50);
            });
        });

        cowork.onCommentUpdated?.((data) => {
            const updatedId = data.idComentario ?? data.id_comentario ?? data.idComentario;
            setComments(prev => prev.map(c => {
                if (c.idComentario === updatedId) {
                    return { ...c, contenido: data.contenido ?? data.Contenido ?? c.contenido };
                }
                return c;
            }));
        });

        cowork.onCommentDeleted?.((data) => {
            const deletedId = data.idComentario ?? data.id_comentario ?? data.idComentario;
            setComments(prev => prev.filter(c => c.idComentario !== deletedId));
        });

        cowork.onSectionActivity((data) => {
            const userName = data.userName ?? data.user_name ?? 'Usuario';
            const action = data.action ?? '';
            const sectionName = data.sectionName ?? data.section_name ?? '';
            const timestamp = data.timestamp ?? '';

            setActivities(prev => {
                // Deduplicar: no añadir si el mismo usuario+acción+sección llegó en los últimos 2 min
                const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
                const isDuplicate = prev.some((a: any) =>
                    a.userName === userName &&
                    a.action === action &&
                    a.sectionName === sectionName &&
                    new Date(a.timestamp).getTime() > twoMinutesAgo
                );
                if (isDuplicate) return prev;
                
                const normalized = {
                    userName,
                    action,
                    sectionName,
                    timestamp
                };
                return [normalized, ...prev].slice(0, 20);
            });
        });

        cowork.onSectionStatusUpdated((data) => {
            setSectionStatuses(prev => ({
                ...prev,
                [data.sectionName]: data.status
            }));
        });
    }, [cowork]);

    // Voice recording helpers
    const startRecording = async () => {
        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                alert("El acceso al micrófono requiere una conexión segura (HTTPS) o acceder desde localhost.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err: any) {
            console.error("Error starting voice recorder:", err);
            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                alert("Permiso denegado para el micrófono. Por favor permite el acceso en tu navegador.");
            } else {
                alert("No se pudo acceder al micrófono. Verifique que la conexión sea HTTPS y los permisos del navegador.");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleUpdateComment = async (id: number, nuevoContenido: string) => {
        try {
            await api.put(`/collaboration/comments/${id}`, { contenido: nuevoContenido });
            setEditingCommentId(null);
            setEditingCommentText('');
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
        } catch (err: any) {
            console.error("Error al eliminar comentario:", err);
            alert("No se pudo eliminar el comentario: " + (err.response?.data?.message || err.message));
        }
    };

    const parseCommentContent = (contenido: string) => {
        try {
            if (contenido.trim().startsWith('{')) {
                return JSON.parse(contenido);
            }
        } catch (e) {}
        return null;
    };

    // Cálculo dinámico de progreso global basado en aprobaciones
    const globalProgress = useMemo(() => {
        if (!allSections.length) return 0;
        const approvedCount = allSections.filter(s => sectionStatuses[s] === 'Aprobado').length;
        return Math.round((approvedCount / allSections.length) * 100);
    }, [allSections, sectionStatuses]);

    // Publicar comentario en tiempo real
    const handlePostComment = async () => {
        if (!comment.trim() && !audioBlob) return;
        setSendingAudio(true);
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
                    text: comment.trim() || 'Explicación de audio adjunta'
                };
                contentStr = JSON.stringify(payload);
            } else {
                contentStr = comment.trim();
            }

            await cowork.postComment(instanceUuid, contentStr);
            setComment('');
            setAudioBlob(null);
            setAudioUrl('');
        } catch (err) {
            console.error("[Team Pulse] Error al enviar comentario:", err);
        } finally {
            setSendingAudio(false);
        }
    };

    // Actualizar estado de sección colaborativa
    const handleUpdateStatus = async (status: string) => {
        try {
            await cowork.updateSectionStatus(instanceUuid, sectionName, status);
        } catch (err) {
            console.error("[Team Pulse] Error al actualizar estado:", err);
        }
    };

    // Formatear hora de forma legible
    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <aside className="w-full h-full bg-bg-deep flex flex-col z-40">
            {/* Header */}
            <div className="p-4 border-b border-border-thin flex items-center justify-between bg-bg-deep/50">
                <div className="flex items-center gap-2">
                    <Activity size={15} className="text-text-main animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-main">Actividad del equipo</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                    title="Cerrar panel lateral"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-thin bg-surface-hover/30">
                {isProtocolDocument && (projectStatus === 'En Corrección' || comments.some(c => parseAuditComment(c.contenido) !== null)) && (
                    <button
                        onClick={() => setActiveTab('correcciones')}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'correcciones' ? 'border-text-main text-text-main bg-text-main/5' : 'border-transparent text-text-dim hover:text-text-main'
                            }`}
                    >
                        <Shield size={14} className={projectStatus === 'En Corrección' ? 'text-warning animate-pulse' : ''} />
                        <span>Correcciones</span>
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'comments' ? 'border-text-main text-text-main bg-text-main/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <MessageSquare size={14} />
                    <span>Chat</span>
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'status' ? 'border-text-main text-text-main bg-text-main/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <CheckCircle size={14} />
                    <span>Estado</span>
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'activity' ? 'border-text-main text-text-main bg-text-main/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <Clock size={14} />
                    <span>Actividad</span>
                </button>
            </div>

            {/* Content Container */}
            <div className={`flex-1 ${activeTab === 'comments' ? 'overflow-hidden' : 'overflow-y-auto'} p-4 custom-scrollbar bg-bg-deep/10 flex flex-col`}>
                {isLoadingPulse ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 opacity-70">
                        <Loader size={24} className="animate-spin text-text-main" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Cargando datos...</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'comments' && (
                            <div className="flex flex-col h-full flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                                    {(() => {
                                        const chatComments = comments.filter(c => parseAuditComment(c.contenido) === null);
                                        if (chatComments.length === 0) {
                                            return (
                                                <div className="text-center py-12 opacity-50 flex flex-col items-center justify-center">
                                                    <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                                        <MessageSquare size={20} className="text-text-dim" />
                                                    </div>
                                                    <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Sin comentarios aún</p>
                                                    <p className="text-[8px] text-text-dim mt-1 max-w-[150px] leading-relaxed">Escribe un mensaje para coordinar la redacción.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-3 flex flex-col">
                                                {chatComments.map((c, i) => {
                                                    const parsed = parseCommentContent(c.contenido);
                                                    const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                                    const isMe = c.usuarioUuid === user?.id_referencia;

                                                    return (
                                                        <div
                                                            key={c.idComentario || c.uuid || i}
                                                            className={`flex flex-col w-full max-w-[90%] ${
                                                                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                            } animate-fade-up`}
                                                        >
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className={`text-[8px] font-black uppercase tracking-wider ${
                                                                    isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand'
                                                                }`}>
                                                                    {isMe ? 'Tú' : c.nombreUsuario}
                                                                </span>
                                                                <span className="text-[7px] text-text-dim font-mono">
                                                                    {formatTime(c.creadoEn)}
                                                                </span>
                                                                {isMe && (
                                                                    <div className="flex items-center gap-1 ml-2 opacity-60 hover:opacity-100 transition-opacity">
                                                                        {!parsed?.audioUrl && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingCommentId(c.idComentario);
                                                                                    setEditingCommentText(parsed ? parsed.text : c.contenido);
                                                                                }}
                                                                                className="text-[8px] text-text-dim hover:text-text-main"
                                                                                title="Editar"
                                                                            >
                                                                                <Edit2 size={10} />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleDeleteComment(c.idComentario)}
                                                                            className="text-[8px] text-text-dim hover:text-red-500"
                                                                            title="Eliminar"
                                                                        >
                                                                            <XCircle size={10} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className={`rounded-xl p-3 border shadow-sm select-text transition-all duration-300 w-full ${
                                                                isMe
                                                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                                    : isMsgFromAdmin
                                                                        ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                                        : 'bg-surface border-border-thin text-text-main rounded-tl-none hover:border-border-hover'
                                                            }`}>
                                                                {editingCommentId === c.idComentario ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={editingCommentText}
                                                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-[11px] text-text-main focus:outline-none focus:border-text-main outline-none resize-none h-12 transition-colors custom-scrollbar placeholder:text-text-dim/60 font-medium"
                                                                        />
                                                                        <div className="flex justify-end gap-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingCommentId(null);
                                                                                    setEditingCommentText('');
                                                                                }}
                                                                                className="px-2 py-0.5 rounded border border-border-thin bg-surface-hover hover:border-border-hover text-[8px] font-bold uppercase tracking-wider text-text-dim transition-all"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    let updatedContent = editingCommentText;
                                                                                    if (parsed) {
                                                                                        updatedContent = JSON.stringify({ ...parsed, text: editingCommentText });
                                                                                    }
                                                                                    handleUpdateComment(c.idComentario, updatedContent);
                                                                                }}
                                                                                className="px-2 py-0.5 bg-emerald-500 text-bg-deep rounded text-[8px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
                                                                            >
                                                                                Guardar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : parsed ? (
                                                                    <div className="space-y-2">
                                                                        {parsed.text && <p className="text-xs text-text-main leading-relaxed select-text">{parsed.text}</p>}
                                                                        {parsed.audioUrl && (
                                                                            <div className="mt-1">
                                                                                <AudioBubblePlayer src={parsed.audioUrl} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-text-main leading-relaxed select-text">{c.contenido}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                    <div ref={commentsEndRef} />
                                </div>
                                <div className="mt-auto pt-2 shrink-0 space-y-3">
                                    {isRecording ? (
                                        <div className="flex items-center justify-between bg-red-500/5 border border-red-500/25 rounded-xl p-2 px-3 animate-pulse">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                                <span className="text-[8px] font-black uppercase text-red-400 tracking-wider font-mono">
                                                    Grabando ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={cancelRecording}
                                                    className="px-1.5 py-0.5 hover:bg-surface border border-border-thin rounded text-[8px] font-bold uppercase tracking-widest text-text-dim transition-all"
                                                >
                                                    x
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                                                >
                                                    ok
                                                </button>
                                            </div>
                                        </div>
                                    ) : audioUrl ? (
                                        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 animate-fade-in">
                                            <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                                                <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Audio grabado</span>
                                                <AudioBubblePlayer src={audioUrl} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                                className="px-1.5 py-0.5 hover:bg-red-500/10 rounded text-[8px] font-bold uppercase tracking-widest text-red-500 transition-all shrink-0"
                                            >
                                                Descartar
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="relative">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handlePostComment();
                                                }
                                            }}
                                            placeholder="Escribe un mensaje al equipo..."
                                            className="w-full bg-surface border border-border-thin rounded-xl p-3 pr-20 text-xs focus:ring-2 focus:ring-text-main/10 focus:border-text-main outline-none resize-none h-20 transition-all custom-scrollbar placeholder:text-text-dim/60"
                                        />
                                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                                            {!audioUrl && !isRecording && (
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="p-1.5 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                                    title="Grabar Audio"
                                                >
                                                    <Mic size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={handlePostComment}
                                                disabled={sendingAudio || (!comment.trim() && !audioBlob)}
                                                className="p-2 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center"
                                                title="Enviar mensaje"
                                            >
                                                {sendingAudio ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'status' && (
                            <div className="space-y-5">
                                {sectionName !== 'output' && (
                                    <div className="bg-surface border border-border-thin rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-[9px] font-black uppercase text-text-dim mb-3 tracking-widest">Mi Sección Actual</h4>
                                        <p className="text-xs font-black text-text-main mb-4 capitalize">{(sectionName || '').replace(/_/g, ' ')}</p>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {[
                                                { label: 'Borrador', value: 'Borrador', desc: 'Edición activa por los redactores', icon: <Edit3 size={14} className="shrink-0" />, activeStyle: 'bg-surface border-border-hover text-text-main shadow-md font-bold' },
                                                { label: 'Revisión', value: 'Revisión', desc: 'Lista para control de calidad', icon: <Eye size={14} className="shrink-0" />, activeStyle: 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md font-bold' },
                                                { label: 'Aprobado', value: 'Aprobado', desc: 'Sección consolidada y cerrada', icon: <CheckCircle size={14} className="shrink-0" />, activeStyle: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md font-bold' }
                                            ].map(s => {
                                                const isActive = (sectionStatuses[sectionName] || 'Borrador') === s.value;
                                                return (
                                                    <button
                                                        key={s.value}
                                                        onClick={() => handleUpdateStatus(s.value)}
                                                        className={`w-full px-4 py-3 rounded-xl text-left border transition-all duration-300 flex items-center justify-between group ${
                                                            isActive
                                                                ? s.activeStyle
                                                                : 'bg-bg-deep/50 border-border-thin/60 text-text-dim hover:text-text-main hover:bg-surface-hover hover:border-border-hover'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-lg transition-colors ${
                                                                isActive 
                                                                    ? (s.value === 'Aprobado' ? 'bg-emerald-500/20' : s.value === 'Revisión' ? 'bg-amber-500/20' : 'bg-surface-hover')
                                                                    : 'bg-bg-deep group-hover:bg-surface'
                                                            }`}>
                                                                {s.icon}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[10px] font-black uppercase tracking-wider">{s.label}</p>
                                                                <p className="text-[8px] text-text-dim font-semibold leading-none mt-0.5">{s.desc}</p>
                                                            </div>
                                                        </div>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 bg-surface border border-border-thin rounded-2xl space-y-4 shadow-sm hover:border-border-hover transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase text-text-dim tracking-widest mb-0.5">Progreso de Redacción</h4>
                                            <p className="text-[8px] text-text-dim uppercase leading-relaxed font-bold tracking-tight">
                                                {allSections.filter(s => sectionStatuses[s] === 'Aprobado').length} de {allSections.length} secciones aprobadas
                                            </p>
                                        </div>
                                        <span className="text-[14px] font-mono font-black text-text-main">{globalProgress}%</span>
                                    </div>
                                    <div className="w-full bg-bg-deep h-2 rounded-full overflow-hidden p-[1px] border border-border-thin/40">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand to-emerald-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${globalProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                {activities.length === 0 ? (
                                    <div className="text-center py-12 opacity-50 flex flex-col items-center justify-center">
                                        <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                            <Activity size={20} className="text-text-dim" />
                                        </div>
                                        <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Esperando actividad...</p>
                                        <p className="text-[8px] text-text-dim mt-1 max-w-[150px] leading-relaxed">Los movimientos del equipo aparecerán en este panel en tiempo real.</p>
                                    </div>
                                ) : (
                                    activities.map((a, i) => (
                                        <div key={i} className="flex items-start gap-3 border-l-2 border-border-hover pl-3 py-1 animate-fade-up">
                                            <div className="mt-0.5 shrink-0">
                                                <User size={12} className="text-text-dim" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-text-main leading-relaxed">
                                                    <span className="font-black text-text-main text-[10px] uppercase tracking-wider">{a.userName || 'Usuario'}</span> {a.action}
                                                </p>
                                                <p className="text-[9px] text-text-dim/80 font-bold uppercase tracking-wider mt-0.5">
                                                    {(a.sectionName || '').replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-[8px] text-text-dim font-mono mt-1">
                                                    {formatTime(a.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'correcciones' && (
                            <div className="flex flex-col h-full flex-1 overflow-hidden space-y-5">
                                {/* Observación General del Administrador */}
                                {ultimaObservacion && (
                                    <div className="p-4 rounded-xl border border-error/20 bg-error/[0.02] space-y-2 animate-fade-in shadow-inner">
                                        <div className="flex items-center gap-2">
                                            <Shield size={13} className="text-error shrink-0" />
                                            <span className="text-[10px] font-black text-error uppercase tracking-widest block">Observación General del Administrador</span>
                                        </div>
                                        <p className="text-[11px] text-text-main font-medium italic font-mono leading-relaxed break-words pl-5">
                                            "{ultimaObservacion}"
                                        </p>
                                    </div>
                                )}

                                {/* Checklist de correcciones por sección */}
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                    <div className="pb-1.5 border-b border-border-thin flex justify-between items-center">
                                        <h4 className="text-[9px] font-black text-text-dim uppercase tracking-widest">Ajustes Solicitados</h4>
                                        <span className="text-[8px] font-mono font-bold text-text-dim/60">
                                            {comments.filter(c => parseAuditComment(c.contenido) !== null).length} Observaciones
                                        </span>
                                    </div>
                                    
                                    {(() => {
                                        const auditItems = comments
                                            .map(c => ({ comment: c, audit: parseAuditComment(c.contenido) }))
                                            .filter((item): item is { comment: any; audit: { seccion: string; estado: string; texto: string } } => item.audit !== null);

                                        if (auditItems.length === 0) {
                                            return (
                                                <div className="text-center py-12 opacity-60 flex flex-col items-center justify-center">
                                                    <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                                        <CheckCircle size={20} className="text-success" />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-text-main uppercase tracking-wider">Sin observaciones de sección</p>
                                                    <p className="text-[8px] text-text-dim mt-1 max-w-[180px] leading-relaxed">El administrador no ha registrado observaciones específicas en los campos del protocolo.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-2.5 pt-1.5">
                                                {auditItems.map((item, idx) => {
                                                    const isAprobado = item.audit.estado === 'Aprobado';
                                                    return (
                                                        <div key={idx} className="p-3.5 rounded-2xl border border-border-thin bg-surface hover:border-border-hover transition-all space-y-2 shadow-sm">
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-[9px] font-black text-text-main uppercase tracking-wider truncate" title={item.audit.seccion}>
                                                                    {item.audit.seccion}
                                                                </span>
                                                                <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                                                                    isAprobado 
                                                                        ? 'bg-success/15 text-success border border-success/20' 
                                                                        : 'bg-warning/15 text-warning border border-warning/20'
                                                                }`}>
                                                                    {item.audit.estado}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-text-dim font-medium leading-relaxed">
                                                                {item.audit.texto}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

        </aside>
    );
};

export default CollaborationSidebar;
