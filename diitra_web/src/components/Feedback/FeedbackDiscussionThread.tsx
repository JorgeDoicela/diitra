import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, Loader2, Lock, ShieldCheck, CheckCircle2
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
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const reportId = report.id_feedback || report.idFeedback;
    const conversacion = report.conversacion || [];
    const estadoNorm = (report.estado || '').toUpperCase();
    const isClosed = estadoNorm === 'DESCARTADO' || estadoNorm === 'CERRADO';
    const isResolved = estadoNorm === 'ATENDIDO' || estadoNorm === 'RESUELTO';
    const canWrite = isAdmin || !isClosed;

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
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
        if (e.key === 'Enter' && !e.shiftKey) {
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
        const msgUserId = msg.id_usuario ?? msg.idUsuario;
        const currentUserId = user?.id_usuario;
        if (currentUserId && msgUserId && Number(msgUserId) === Number(currentUserId)) {
            return true;
        }
        const currentName = (user?.nombre_completo || '').trim().toLowerCase();
        const authorName = (msg.nombre_autor || msg.nombreAutor || '').trim().toLowerCase();
        if (currentName && authorName && currentName === authorName) {
            return true;
        }
        if (isAdmin && (msg.es_admin ?? msg.esAdmin) && (!msgUserId || msgUserId === currentUserId)) {
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
                    <h4 className="text-[13px] font-bold text-text-main tracking-tight">
                        Conversación
                    </h4>
                </div>

                {isClosed && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text-dim">
                        <Lock size={11} /> Incidencia cerrada
                    </span>
                )}
                {isResolved && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={12} /> Incidencia resuelta
                    </span>
                )}
            </div>

            {/* Contenedor del Chat (Burbujas de Diálogo) - Solo si hay mensajes */}
            {conversacion.length > 0 && (
                <div ref={chatContainerRef} className="p-3 sm:p-3.5 rounded-xl bg-bg-deep/40 border border-border-thin space-y-3 max-h-60 sm:max-h-64 overflow-y-auto custom-scrollbar">
                    {/* Mensajes del Hilo de Conversación */}
                    {conversacion.map((msg: FeedbackMensaje, idx: number) => {
                        const isMe = isCurrentUser(msg);
                        const esAdmin = msg.es_admin ?? msg.esAdmin;
                        const autorNombre = esAdmin ? 'Superadministrador' : (msg.nombre_autor || msg.nombreAutor || 'Usuario');
                        const nombreVisual = isMe ? (esAdmin && isAdmin ? 'Tú (Superadministrador)' : 'Tú') : autorNombre;

                        return (
                            <div 
                                key={msg.id || idx}
                                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse ml-auto max-w-[92%] sm:max-w-[80%]' : 'mr-auto max-w-[92%] sm:max-w-[80%]'}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs border ${
                                    isMe 
                                        ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 border-zinc-700/40' 
                                        : (esAdmin 
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-700/50' 
                                            : 'bg-zinc-200 dark:bg-zinc-800 text-text-main border-border-thin')
                                }`}>
                                    {esAdmin && !isMe ? <ShieldCheck size={14} /> : getInitials(nombreVisual)}
                                </div>

                                {/* Contenido de la Burbuja */}
                                <div className={`space-y-1 min-w-0 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                                    <div className={`flex items-baseline gap-1.5 ${isMe ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                        <span className={`text-[12px] font-semibold ${esAdmin && !isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-main'}`}>
                                            {nombreVisual}
                                        </span>
                                        <span className="text-[10.5px] font-mono text-text-dim">
                                            · {formatFecha(msg.fecha)}
                                        </span>
                                    </div>

                                    {/* Burbuja de Mensaje estilo Chat */}
                                    <div className={`p-3 text-[13px] leading-relaxed shadow-xs whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] ${
                                        isMe
                                            ? 'bg-zinc-100 dark:bg-zinc-800/80 border border-border-thin text-text-main rounded-2xl rounded-tr-xs'
                                            : (esAdmin
                                                ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-800/50 text-text-main rounded-2xl rounded-tl-xs'
                                                : 'bg-surface border border-border-thin text-text-main rounded-2xl rounded-tl-xs')
                                    }`}>
                                        {msg.mensaje}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Input de Mensaje estilo Chat */}
            {canWrite ? (
                <form onSubmit={handleSendMessage} className="space-y-2 pt-1">
                    {errorMsg && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                            {errorMsg}
                        </div>
                    )}
                    <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl border border-border-thin bg-surface focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all shadow-2xs">
                        <textarea
                            value={mensajeText}
                            onChange={(e) => setMensajeText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAdmin ? "Escribe una respuesta o aclaración..." : "Escribe un mensaje..."}
                            rows={1}
                            disabled={isSending}
                            className="flex-1 bg-transparent text-[13px] text-text-main placeholder:text-text-dim/60 border-none outline-none focus:outline-none focus:ring-0 resize-none py-1.5 max-h-32 custom-scrollbar leading-relaxed"
                            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        />
                        <button
                            type="submit"
                            disabled={isSending || !mensajeText.trim()}
                            className="p-2 rounded-lg bg-brand text-white hover:opacity-90 active:scale-95 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-xs"
                            title="Enviar mensaje (Enter)"
                            aria-label="Enviar mensaje"
                        >
                            {isSending ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Send size={15} />
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-border-thin flex items-center gap-2.5 text-text-dim text-[12px]">
                    <Lock size={14} className="shrink-0 text-text-dim" />
                    <span>Esta incidencia ha sido cerrada. No es posible enviar más mensajes.</span>
                </div>
            )}
        </div>
    );
};
