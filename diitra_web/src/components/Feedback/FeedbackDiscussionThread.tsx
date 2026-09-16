import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, Loader2, Lock, MessageSquare, ShieldCheck, 
    CornerDownRight, Sparkles
} from 'lucide-react';
import { 
    sendFeedbackMessage, 
    type FeedbackReporte, 
    type FeedbackMensaje 
} from '../../services/feedbackService';
import { useAuth } from '../../api/AuthContext';

interface FeedbackDiscussionThreadProps {
    report: FeedbackReporte;
    isAdmin?: boolean;
    onMessageSent?: (updatedReport: FeedbackReporte) => void;
}

export const FeedbackDiscussionThread: React.FC<FeedbackDiscussionThreadProps> = ({
    report,
    isAdmin = false,
    onMessageSent
}) => {
    const { user } = useAuth();
    const [mensajeText, setMensajeText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const reportId = report.id_feedback || report.idFeedback;
    const conversacion = report.conversacion || [];
    const estadoNorm = (report.estado || '').toUpperCase();
    const isClosed = estadoNorm === 'DESCARTADO' || estadoNorm === 'ATENDIDO' || estadoNorm === 'CERRADO' || estadoNorm === 'RESUELTO';
    const canWrite = isAdmin || !isClosed;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversacion.length]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!reportId || !mensajeText.trim() || isSending) return;

        setIsSending(true);
        setErrorMsg(null);

        try {
            const updated = await sendFeedbackMessage(reportId, mensajeText.trim());
            setMensajeText('');
            if (onMessageSent) {
                onMessageSent(updated);
            }
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
        } catch (err: any) {
            console.error('Error al enviar mensaje:', err);
            setErrorMsg(err.response?.data?.message || 'Error al enviar el mensaje.');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatFecha = (fechaStr?: string) => {
        if (!fechaStr) return '';
        try {
            const d = new Date(fechaStr);
            if (isNaN(d.getTime())) return fechaStr;
            return d.toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return fechaStr;
        }
    };

    const isCurrentUser = (msg: FeedbackMensaje) => {
        if (user?.id_usuario && (msg.id_usuario === user.id_usuario || msg.idUsuario === user.id_usuario)) {
            return true;
        }
        const currentName = (user?.nombre_completo || '').trim().toLowerCase();
        const authorName = (msg.nombre_autor || msg.nombreAutor || '').trim().toLowerCase();
        if (currentName && authorName && currentName === authorName) {
            return true;
        }
        return false;
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-4">
            {/* Encabezado de la Conversación */}
            <div className="flex items-center justify-between pb-2 border-b border-border-thin">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                        <MessageSquare size={13} />
                    </div>
                    <h4 className="text-[13px] font-bold text-text-main tracking-tight">
                        Conversación
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-text-dim border border-border-thin">
                        {conversacion.length} {conversacion.length === 1 ? 'mensaje' : 'mensajes'}
                    </span>
                </div>

                {isClosed && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-text-dim border border-border-thin">
                        <Lock size={11} /> Ticket cerrado
                    </span>
                )}
            </div>

            {/* Contenedor del Chat (Burbujas de Diálogo) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-bg-deep/50 border border-border-thin space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
                
                {/* 1. Mensaje Inicial de Apertura de Incidencia */}
                <div className="space-y-2">
                    <div className="flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-medium text-text-dim px-3 py-1 rounded-full bg-surface border border-border-thin shadow-2xs">
                            <Sparkles size={11} className="text-brand" />
                            <span>Apertura de la incidencia · {formatFecha(report.fecha_creacion || report.fechaCreacion)}</span>
                        </span>
                    </div>

                    <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] mr-auto">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-text-main text-[11px] font-bold flex items-center justify-center shrink-0 border border-border-thin shadow-2xs">
                            {getInitials(report.nombre_usuario || report.nombreUsuario)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2 pl-1">
                                <span className="text-[12px] font-semibold text-text-main">
                                    {report.nombre_usuario || report.nombreUsuario || 'Autor del reporte'}
                                </span>
                                <span className="text-[10px] font-mono text-text-dim">
                                    {report.rol_usuario || report.rolUsuario || 'USUARIO'}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-2xl rounded-tl-xs bg-surface border border-border-thin text-[13px] text-text-main leading-relaxed shadow-xs whitespace-pre-wrap">
                                {report.descripcion}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Mensajes del Hilo de Conversación */}
                {conversacion.map((msg: FeedbackMensaje, idx: number) => {
                    const isMe = isCurrentUser(msg);
                    const esAdmin = msg.es_admin ?? msg.esAdmin;
                    const autorNombre = msg.nombre_autor || msg.nombreAutor || (esAdmin ? 'Soporte DIITRA' : 'Usuario');
                    const autorRol = msg.rol_autor || msg.rolAutor;

                    return (
                        <div 
                            key={msg.id || idx}
                            className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse ml-auto max-w-[92%] sm:max-w-[85%]' : 'mr-auto max-w-[92%] sm:max-w-[85%]'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs border ${
                                isMe 
                                    ? 'bg-brand text-white border-brand' 
                                    : (esAdmin 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-zinc-200 dark:bg-zinc-800 text-text-main border-border-thin')
                            }`}>
                                {esAdmin ? <ShieldCheck size={14} /> : getInitials(autorNombre)}
                            </div>

                            {/* Contenido de la Burbuja */}
                            <div className={`space-y-1 min-w-0 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                                <div className={`flex items-baseline gap-2 ${isMe ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                    <span className="text-[12px] font-semibold text-text-main">
                                        {isMe ? 'Tú' : autorNombre}
                                    </span>
                                    {autorRol && (
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                            esAdmin 
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                                                : 'bg-accents-1 text-text-dim border-border-thin'
                                        }`}>
                                            {esAdmin ? 'SOPORTE' : autorRol}
                                        </span>
                                    )}
                                    <span className="text-[10.5px] font-mono text-text-dim">
                                        {formatFecha(msg.fecha)}
                                    </span>
                                </div>

                                {/* Burbuja de Mensaje estilo Chat */}
                                <div className={`p-3.5 text-[13px] leading-relaxed shadow-xs whitespace-pre-wrap break-words ${
                                    isMe
                                        ? 'bg-brand/10 dark:bg-brand/15 border border-brand/30 text-text-main rounded-2xl rounded-tr-xs'
                                        : (esAdmin
                                            ? 'bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-text-main rounded-2xl rounded-tl-xs'
                                            : 'bg-surface border border-border-thin text-text-main rounded-2xl rounded-tl-xs')
                                }`}>
                                    {msg.mensaje}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {conversacion.length === 0 && (
                    <div className="py-2 text-center text-text-dim text-[11.5px]">
                        No hay respuestas adicionales registradas en este hilo.
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje estilo Chat */}
            {canWrite ? (
                <form onSubmit={handleSendMessage} className="space-y-2 pt-1">
                    {errorMsg && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                            {errorMsg}
                        </div>
                    )}
                    <div className="rounded-xl border border-border-thin bg-surface focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all p-2.5">
                        <textarea
                            value={mensajeText}
                            onChange={(e) => setMensajeText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAdmin ? "Escribe una respuesta técnica o solicitud de aclaración..." : "Escribe una aclaración o comentario adicional..."}
                            rows={3}
                            disabled={isSending}
                            className="w-full bg-transparent text-[13px] text-text-main placeholder:text-text-dim/60 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-border-thin/60 mt-1">
                            <span className="text-[11px] font-mono text-text-dim flex items-center gap-1">
                                <CornerDownRight size={12} /> Presiona Ctrl+Enter para enviar
                            </span>
                            <button
                                type="submit"
                                disabled={isSending || !mensajeText.trim()}
                                className="btn-vercel-primary text-xs font-medium px-4 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={13} />
                                        <span>Enviar mensaje</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-border-thin flex items-center gap-2.5 text-text-dim text-[12px]">
                    <Lock size={14} className="shrink-0 text-text-dim" />
                    <span>Este ticket ha sido cerrado o resuelto. No es posible enviar más mensajes.</span>
                </div>
            )}
        </div>
    );
};
