import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {
    Users, Shield, Award, Calendar, CheckCircle, XCircle, AlertTriangle, BookOpen, GraduationCap, User, MessageSquare, Send, Mic, Loader2, Edit2, ChevronRight
} from 'lucide-react';
import api from '../../../api/axios_config';
import { AudioBubblePlayer } from './AudioBubblePlayer';

interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    carrera?: string;
}

interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    carrera_coordinador?: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    categoria_consolidacion?: string;
    activo: boolean;
    estado?: string;
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
}

interface Domain {
    id_dominio: number;
    nombre: string;
}

interface Career {
    id_carrera: number;
    carrera1: string;
}

interface ResearchLine {
    id: number;
    nombre: string;
}

interface GroupDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    detailGroup: Group | null;
    setDetailGroup: React.Dispatch<React.SetStateAction<Group | null>>;
    isAdmin: boolean;
    user: any;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    handleOpenModal: (group: Group, readOnly: boolean) => void;
    handleOpenReview: (group: Group) => void;
}

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
    isOpen,
    onClose,
    detailGroup,
    setDetailGroup,
    isAdmin,
    user,
    dominios,
    carreras,
    lines,
    formatCareerName,
    handleOpenModal,
    handleOpenReview
}) => {
    const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
    const [detailTab, setDetailTab] = useState<'info' | 'feedback'>('info');
    const [feedbackComments, setFeedbackComments] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [newFeedbackText, setNewFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    // Contextual field feedback states
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
    const [activeFieldName, setActiveFieldName] = useState<string>('');
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [highlightedField, setHighlightedField] = useState<string | null>(null);

    // Audio recording state & refs
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    // Conexión a SignalR en tiempo real
    const [collabConnection, setCollabConnection] = useState<signalR.HubConnection | null>(null);

    // Fetch detail members and feedback when drawer is open
    useEffect(() => {
        if (!isOpen || !detailGroup) return;

        const loadDetailData = async () => {
            setDetailTab('info');
            fetchFeedbackComments(detailGroup.uuid);
            try {
                const res = await api.get(`/Groups/${detailGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup) {
                    setDetailGroup(fullGroup);
                    if (fullGroup.miembros) {
                        setDetailMembers(fullGroup.miembros.filter((m: any) => m.activo));
                    } else {
                        setDetailMembers([]);
                    }
                }
            } catch (err) {
                console.error("Error loading group detail:", err);
                setDetailMembers([]);
            }
        };

        loadDetailData();
    }, [isOpen, detailGroup?.uuid]);

    // SignalR Effect
    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid) {
            if (collabConnection) {
                collabConnection.stop();
                setCollabConnection(null);
            }
            return;
        }

        const hubUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5175'}/hubs/collaboration`;
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
                console.log('[GroupsPage] Conexión de colaboración en tiempo real establecida');

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
                    console.log('[GroupsPage] Unido a la sala de colaboración:', detailGroup.uuid);
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
            })
            .catch(err => {
                console.error('[GroupsPage] Error de conexión de SignalR:', err);
            });

        setCollabConnection(newConnection);

        return () => {
            isSubscribed = false;
            newConnection.stop();
        };
    }, [isOpen, detailGroup?.uuid]);

    const fetchFeedbackComments = async (uuid: string) => {
        setLoadingFeedback(true);
        try {
            const res = await api.get(`/collaboration/${uuid}/pulse`);
            if (res.data && res.data.comments) {
                const sorted = [...res.data.comments].reverse();
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

    // Voice recording helpers
    const startRecording = async () => {
        try {
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
        } catch (err) {
            console.error("Error starting voice recorder:", err);
            alert("No se pudo acceder al micrófono. Verifique los permisos.");
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
            console.error("Error: detailGroup.uuid is undefined or null");
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

    const renderFieldFeedbackButton = (fieldKey: string, fieldName: string) => {
        const comments = getFieldComments(fieldKey);
        const hasComments = comments.length > 0;
        
        if (!hasComments && !isAdmin) return null;
        
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    openFieldFeedbackDrawer(fieldKey, fieldName);
                }}
                className={`flex items-center gap-1 p-1.5 rounded-lg transition-all active:scale-95 shrink-0 ${
                    hasComments
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                        : 'text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                }`}
                title={hasComments ? `Ver ${comments.length} observaciones` : 'Agregar observación contextual'}
            >
                <MessageSquare size={13} className={hasComments ? 'fill-amber-500/10 text-amber-400' : ''} />
                {hasComments && (
                    <span className="text-[8px] font-mono font-bold leading-none bg-amber-500 text-bg-deep px-1 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                )}
            </button>
        );
    };

    if (!isOpen || !detailGroup) return null;

    const teachers = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return !rolLower.includes('semillerista') && !rolLower.includes('estudiante');
    });

    const students = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return rolLower.includes('semillerista') || rolLower.includes('estudiante');
    });

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={() => {
                    onClose();
                    setIsFieldModalOpen(false);
                    setActiveFieldKey(null);
                }}
            />

            {/* Docked Side Panel for Field Feedback */}
            {isFieldModalOpen && activeFieldKey && (
                <div className="relative w-full max-w-[340px] h-full bg-surface border-r border-border-thin flex flex-col z-20 animate-fade-in shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
                    <div className="modal-header shrink-0 !py-3 !px-4 bg-bg-deep/40 border-b border-border-thin">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)] shrink-0">
                                <MessageSquare size={14} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[10px] font-black text-text-main uppercase tracking-tight truncate leading-none mb-1">Observación Contextual</h4>
                                <p className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest truncate leading-none">{activeFieldName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsFieldModalOpen(false);
                                setActiveFieldKey(null);
                                setAudioBlob(null);
                                setAudioUrl('');
                            }}
                            className="p-1 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors shrink-0"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* List of comments for this field */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-deep/5 custom-scrollbar">
                        {(() => {
                            const comments = getFieldComments(activeFieldKey);
                            if (comments.length === 0) {
                                return (
                                    <div className="text-center py-16 opacity-50 flex flex-col items-center justify-center h-full">
                                        <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                            <MessageSquare size={18} className="text-text-dim" />
                                        </div>
                                        <p className="text-[9px] font-black text-text-main uppercase tracking-wider">Sin observaciones</p>
                                        <p className="text-[8px] text-text-dim mt-1 max-w-[180px] leading-relaxed uppercase font-mono text-center">
                                            {isAdmin 
                                                ? "Agregue observaciones por escrito o grabe explicaciones de voz sobre este campo."
                                                : "No se han registrado observaciones en este campo."
                                            }
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-3">
                                    {comments.map((c, i) => {
                                        const parsed = parseCommentContent(c.contenido);
                                        const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                        const isMe = c.usuarioUuid === user?.id_referencia;
                                        
                                        return (
                                            <div
                                                key={c.idComentario || i} 
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
                                                        {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className={`rounded-xl p-3 border shadow-sm select-text transition-all duration-300 ${
                                                    isMe
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                        : isMsgFromAdmin
                                                            ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                            : 'bg-surface border-border-thin text-text-main rounded-tl-none hover:border-border-hover'
                                                }`}>
                                                    {parsed ? (
                                                        <div className="space-y-2">
                                                            {parsed.text && <p className="text-[11px] font-medium leading-relaxed">{parsed.text}</p>}
                                                            {parsed.audioUrl && (
                                                                <div className="mt-1">
                                                                    <AudioBubblePlayer src={parsed.audioUrl} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-medium leading-relaxed">{c.contenido}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Chat field feedback Input */}
                    <div className="p-4 border-t border-border-thin bg-surface-hover/30 shrink-0 space-y-3">
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

                        <div className="flex items-end gap-1.5 relative">
                            <textarea
                                value={newFeedbackText}
                                onChange={(e) => setNewFeedbackText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendFieldFeedback(activeFieldKey, activeFieldName);
                                    }
                                }}
                                placeholder={isAdmin ? "Observación..." : "Responder..."}
                                className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-2 pr-12 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-12 transition-all custom-scrollbar placeholder:text-text-dim/60 font-medium"
                            />

                            <div className="absolute right-1.5 bottom-1.5 flex gap-0.5">
                                {!audioUrl && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                        title="Grabar Audio Explicativo"
                                    >
                                        <Mic size={12} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                    onClick={() => handleSendFieldFeedback(activeFieldKey, activeFieldName)}
                                    className="p-1 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                >
                                    {sendingFeedback ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            <Award size={20} />
                        </div>
                        <div
                            id="field-container-siglas"
                            className={`transition-all duration-500 rounded-lg px-2 py-1 ${
                                highlightedField === 'siglas'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold text-text-main tracking-tight">{detailGroup.nombre}</h3>
                            <div className="flex items-center gap-2">
                                <p className="section-label text-text-dim">
                                    {detailGroup.tipo_grupo === 'Semillero' ? 'Semillero' : 'Grupo de Investigación'} — {detailGroup.siglas || 'SIN_SIGLAS'}
                                </p>
                                {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-dim hover:text-text-main transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-border-thin bg-surface-hover/20 shrink-0">
                    <button
                        onClick={() => setDetailTab('info')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                            detailTab === 'info'
                                ? 'border-text-main text-text-main bg-text-main/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <Award size={13} />
                        <span>Información General</span>
                    </button>
                    <button
                        onClick={() => setDetailTab('feedback')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 relative ${
                            detailTab === 'feedback'
                                ? 'border-text-main text-text-main bg-text-main/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <MessageSquare size={13} />
                        <span>Canal de Retroalimentación</span>
                        {detailGroup.estado === 'Pendiente' && (
                            <span className="absolute top-2.5 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        )}
                    </button>
                </div>

                {detailTab === 'info' ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Status & Type & Consolidation */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">
                                    <Shield size={12} /> Estado
                                </label>
                                {(!detailGroup.estado || detailGroup.estado === 'Aprobado') && (
                                    <span className="badge-vercel badge-vercel-success">
                                        <CheckCircle size={10} /> Aprobado
                                    </span>
                                )}
                                {detailGroup.estado === 'Pendiente' && (
                                    <span className="badge-vercel badge-vercel-warning">
                                        <Calendar size={10} /> Pendiente
                                    </span>
                                )}
                                {detailGroup.estado === 'Rechazado' && (
                                    <span className="badge-vercel badge-vercel-error">
                                        <XCircle size={10} /> Rechazado
                                    </span>
                                )}
                                <p className={`text-[8px] font-mono tracking-wider uppercase mt-1 ${detailGroup.activo ? 'text-success' : 'text-text-dim/60'}`}>
                                    ● {detailGroup.activo ? 'Vigente' : 'Inactivo'}
                                </p>
                            </div>

                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">Tipo de Grupo</label>
                                <p className="text-xs font-black text-text-main uppercase tracking-tight">
                                    {detailGroup.tipo_grupo || 'Investigación'}
                                </p>
                            </div>

                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">Consolidación</label>
                                <span className={`badge-vercel ${
                                    detailGroup.categoria_consolidacion === 'Consolidado'
                                        ? 'badge-vercel-success'
                                        : 'badge-vercel-neutral'
                                }`}>
                                    {detailGroup.categoria_consolidacion || 'En Formación'}
                                </span>
                            </div>
                        </div>

                        {/* Coordinator */}
                        <div
                            id="field-container-coordinador"
                            className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                highlightedField === 'coordinador'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <label className="section-label text-text-dim flex items-center gap-1.5">
                                    <User size={12} /> Coordinador Responsable
                                </label>
                                {renderFieldFeedbackButton('coordinador', 'Coordinador Responsable')}
                            </div>
                            <p className="text-sm font-semibold text-text-main">{detailGroup.nombre_coordinador ? formatNombre(detailGroup.nombre_coordinador) : 'No asignado'}</p>
                            {detailGroup.id_profesor_coordinador && (
                                <p className="text-[10px] font-mono text-text-dim">C.I. {detailGroup.id_profesor_coordinador}</p>
                            )}
                        </div>

                        {/* Domain */}
                        {detailGroup.id_dominio && (
                            <div className="bento-card static p-4 space-y-2">
                                <label className="section-label text-text-dim">Dominio Académico</label>
                                <p className="text-xs font-semibold text-text-main">
                                    {dominios.find(d => d.id_dominio === detailGroup.id_dominio)?.nombre || 'Sin dominio'}
                                </p>
                            </div>
                        )}

                        {/* Objective */}
                        {detailGroup.objetivo_general && (
                            <div
                                id="field-container-objetivo"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'objetivo'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Objetivo General</label>
                                    {renderFieldFeedbackButton('objetivo', 'Objetivo General')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.objetivo_general}</p>
                            </div>
                        )}

                        {/* Mission */}
                        {detailGroup.mision && (
                            <div
                                id="field-container-mision"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'mision'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Misión</label>
                                    {renderFieldFeedbackButton('mision', 'Misión')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.mision}</p>
                            </div>
                        )}

                        {/* Vision */}
                        {detailGroup.vision && (
                            <div
                                id="field-container-vision"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'vision'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Visión</label>
                                    {renderFieldFeedbackButton('vision', 'Visión')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.vision}</p>
                            </div>
                        )}

                        {/* Resolution & Dates */}
                        {(detailGroup.resolucion_aprobacion || detailGroup.fecha_creacion) && (
                            <div className="grid grid-cols-2 gap-4">
                                {detailGroup.resolucion_aprobacion && (
                                    <div className="bento-card static p-4 space-y-1">
                                        <label className="section-label text-text-dim">Resolución</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{detailGroup.resolucion_aprobacion}</p>
                                    </div>
                                )}
                                {detailGroup.fecha_creacion && (
                                    <div className="bento-card static p-4 space-y-1">
                                        <label className="section-label text-text-dim">Fecha Creación</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{new Date(detailGroup.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Lines of Research */}
                        {detailGroup.lineas_ids && detailGroup.lineas_ids.length > 0 && (
                            <div
                                id="field-container-lineas"
                                className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'lineas'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim flex items-center gap-1">
                                        <BookOpen size={12} /> Líneas de Investigación
                                    </label>
                                    {renderFieldFeedbackButton('lineas', 'Líneas de Investigación')}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {detailGroup.lineas_ids.map(lineId => {
                                        const line = lines.find(l => l.id === lineId);
                                        if (!line) return null;
                                        return (
                                            <span key={lineId} className="text-xs font-bold text-text-main uppercase tracking-tight bg-bg-deep border border-border-thin rounded-xl p-2.5">
                                                {line.nombre}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Careers */}
                        {detailGroup.carreras_ids && detailGroup.carreras_ids.length > 0 && (
                            <div
                                id="field-container-carreras"
                                className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'carreras'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim flex items-center gap-1">
                                        <GraduationCap size={12} /> Carreras / Programas
                                    </label>
                                    {renderFieldFeedbackButton('carreras', 'Carreras / Programas')}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {detailGroup.carreras_ids.map(carrId => {
                                        const career = carreras.find(c => c.id_carrera === carrId);
                                        if (!career) return null;
                                        return (
                                            <span key={carrId} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                                                {formatCareerName(career.carrera1)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Detailed Members Lists */}
                        <div
                            id="field-container-integrantes"
                            className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                highlightedField === 'integrantes'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-2 mb-2">
                                <label className="section-label text-text-dim flex items-center gap-1">
                                    <Users size={12} /> Integrantes del Grupo
                                </label>
                                {renderFieldFeedbackButton('integrantes', 'Integrantes del Grupo')}
                            </div>

                            {detailMembers.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Docentes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                                            <User size={10} />
                                            <span>Docentes Investigadores ({teachers.length})</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {teachers.map(member => (
                                                <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-emerald-500/10">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                            <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                                {member.rol}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {member.cedula && (
                                                        <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {teachers.length === 0 && (
                                                <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin docentes investigadores</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Estudiantes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-400">
                                            <GraduationCap size={10} />
                                            <span>Estudiantes Semilleristas ({students.length})</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {students.map(member => (
                                                <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-blue-500/10">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                            <GraduationCap size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                            <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                                {member.rol}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {member.cedula && (
                                                        <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {students.length === 0 && (
                                                <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin estudiantes semilleristas</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Users size={20} className="mx-auto text-text-dim/30 mb-2" />
                                    <p className="text-[10px] text-text-dim font-medium uppercase tracking-widest">Sin integrantes registrados</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-bg-deep/10 h-full">
                        {/* Timelines and observations */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loadingFeedback ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-70 h-full">
                                    <Loader2 size={24} className="animate-spin text-text-main" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Cargando buzón oficial...</span>
                                </div>
                            ) : feedbackComments.length === 0 ? (
                                <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center h-full">
                                    <div className="p-4 bg-surface rounded-full border border-border-thin mb-4">
                                        <MessageSquare size={24} className="text-text-dim" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">Sin observaciones registradas</p>
                                    <p className="text-[9px] text-text-dim/80 mt-1 max-w-[220px] leading-relaxed uppercase font-mono text-center">
                                        No hay historial en el canal. El evaluador y el equipo pueden iniciar la comunicación aquí.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedbackComments.map((c, i) => {
                                        let isAudio = false;
                                        let audioData = null;
                                        let isFieldFeedback = false;
                                        let fieldFeedbackData = null;
                                        try {
                                            if (c.contenido.startsWith('{')) {
                                                const parsed = JSON.parse(c.contenido);
                                                if (parsed.type === 'field_feedback') {
                                                    isFieldFeedback = true;
                                                    fieldFeedbackData = parsed;
                                                } else if (parsed.type === 'audio') {
                                                    isAudio = true;
                                                    audioData = parsed;
                                                }
                                            }
                                        } catch (e) {}

                                        const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                        const isMe = c.usuarioUuid === user?.id_referencia;

                                        if (isFieldFeedback && fieldFeedbackData) {
                                            return (
                                                <div 
                                                    key={c.idComentario || i} 
                                                    className={`flex flex-col w-full max-w-[90%] ${
                                                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                    } animate-fade-up`}
                                                >
                                                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                            isMe
                                                                ? 'text-emerald-400'
                                                                : isMsgFromAdmin
                                                                    ? 'text-amber-400'
                                                                    : 'text-brand'
                                                        }`}>
                                                            {isMe ? 'Tú' : c.nombreUsuario} (Retroalimentación de Campo)
                                                        </span>
                                                        <span className="text-[8px] text-text-dim font-mono">
                                                            {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <div className={`rounded-2xl p-4 border shadow-sm w-full select-text transition-all duration-300 ${
                                                        isMe
                                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                            : isMsgFromAdmin
                                                                ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                                : 'bg-surface border-border-thin text-text-main rounded-tl-none hover:border-border-hover'
                                                    }`}>
                                                        <div className="flex items-center justify-between border-b border-border-thin/20 pb-2 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle size={12} className={isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand'} />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                                    isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand'
                                                                }`}>
                                                                    Observación: {fieldFeedbackData.fieldName || fieldFeedbackData.field}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setDetailTab('info');
                                                                    setHighlightedField(fieldFeedbackData.field);
                                                                    setTimeout(() => {
                                                                        const element = document.getElementById(`field-container-${fieldFeedbackData.field}`);
                                                                        if (element) {
                                                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }
                                                                    }, 300);
                                                                    setTimeout(() => {
                                                                        setHighlightedField(null);
                                                                    }, 3500);
                                                                }}
                                                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border active:scale-95 transition-all ${
                                                                    isMe
                                                                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400'
                                                                        : isMsgFromAdmin
                                                                            ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400'
                                                                            : 'bg-bg-deep border-border-thin hover:border-border-hover text-text-dim'
                                                                }`}
                                                            >
                                                                Ver Campo
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fieldFeedbackData.text && <p className="text-[11px] font-medium leading-relaxed">{fieldFeedbackData.text}</p>}
                                                            {fieldFeedbackData.audioUrl && (
                                                                <div className="mt-1">
                                                                    <AudioBubblePlayer src={fieldFeedbackData.audioUrl} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div 
                                                key={c.idComentario || i} 
                                                className={`flex flex-col w-full max-w-[80%] ${
                                                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                } animate-fade-up`}
                                            >
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                        isMe
                                                            ? 'text-emerald-400'
                                                            : isMsgFromAdmin
                                                                ? 'text-amber-400'
                                                                : 'text-brand'
                                                    }`}>
                                                        {isMe ? 'Tú' : c.nombreUsuario}
                                                    </span>
                                                    <span className="text-[8px] text-text-dim font-mono">
                                                        {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className={`rounded-2xl p-4 border shadow-sm select-text transition-all duration-300 ${
                                                    isMe
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                        : isMsgFromAdmin
                                                            ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                            : 'bg-surface border-border-thin text-text-main rounded-tl-none hover:border-border-hover'
                                                }`}>
                                                    {isAudio && audioData ? (
                                                        <div className="space-y-2">
                                                            {audioData.text && <p className="text-[11px] font-medium leading-relaxed">{audioData.text}</p>}
                                                            <div className="mt-1">
                                                                <AudioBubblePlayer src={audioData.audioUrl} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-medium leading-relaxed">{c.contenido}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Live collaborative chat Input */}
                        <div className="p-4 border-t border-border-thin bg-surface-hover/30 shrink-0 space-y-3">
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

                            <div className="flex items-end gap-2 relative">
                                <textarea
                                    value={newFeedbackText}
                                    onChange={(e) => setNewFeedbackText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendFeedbackMessage(detailGroup.uuid);
                                        }
                                    }}
                                    placeholder="Escriba observaciones de retroalimentación oficial..."
                                    className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-3 pr-16 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-16 transition-all custom-scrollbar placeholder:text-text-dim/60 font-medium"
                                />

                                <div className="absolute right-2 bottom-2 flex gap-1">
                                    {!audioUrl && (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="p-1.5 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                            title="Grabar Audio Explicativo"
                                        >
                                            <Mic size={14} />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                        onClick={() => handleSendFeedbackMessage(detailGroup.uuid)}
                                        className="p-1.5 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                    >
                                        {sendingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-footer shrink-0">
                    <button onClick={onClose} className="btn-vercel-secondary">Cerrar</button>
                    {isAdmin && detailGroup.estado === 'Pendiente' && (
                        <button
                            onClick={() => handleOpenReview(detailGroup)}
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 shrink-0"
                        >
                            Evaluar Propuesta
                        </button>
                    )}
                    {(isAdmin || (detailGroup.id_profesor_coordinador === user?.id_referencia && detailGroup.estado !== 'Pendiente' && detailGroup.estado !== 'Aprobado')) && (
                        <button
                            onClick={() => handleOpenModal(detailGroup, false)}
                            className="btn-vercel-brand flex items-center gap-2"
                        >
                            <Edit2 size={14} /> Editar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
