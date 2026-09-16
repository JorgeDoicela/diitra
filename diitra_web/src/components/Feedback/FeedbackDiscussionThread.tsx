import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Lock, MessageSquare, ShieldCheck, User as UserIcon, CornerDownRight } from 'lucide-react';
import { 
    sendFeedbackMessage, 
    type FeedbackReporte, 
    type FeedbackMensaje 
} from '../../services/feedbackService';

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

    return (
        <div className="space-y-4">
            {/* Encabezado del Hilo */}
            <div className="flex items-center justify-between border-b border-border-thin pb-2">
                <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-brand" />
                    <h4 className="text-[12px] font-mono font-bold text-text-main uppercase tracking-wider">
                        Hilo de Conversación ({conversacion.length})
                    </h4>
                </div>
                {isClosed && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-text-dim border border-border-thin">
                        <Lock size={10} /> Ticket finalizado
                    </span>
                )}
            </div>

            {/* Lista de Mensajes del Timeline */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {/* Mensaje Inicial (Descripción original del ticket) */}
                <div className="p-3 rounded-xl bg-bg-deep/60 border border-border-thin text-[12.5px] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-text-main">
                            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-text-dim">
                                <UserIcon size={11} />
                            </div>
                            <span>{report.nombre_usuario || report.nombreUsuario || 'Usuario'}</span>
                            <span className="text-[10px] font-mono font-normal text-text-dim">
                                ({report.rol_usuario || report.rolUsuario || 'USUARIO'})
                            </span>
                        </div>
                        <span className="font-mono text-[10px] text-text-dim">
                            {formatFecha(report.fecha_creacion || report.fechaCreacion)}
                        </span>
                    </div>
                    <p className="text-text-main whitespace-pre-wrap leading-relaxed pl-6">
                        {report.descripcion}
                    </p>
                </div>

                {/* Mensajes siguientes del hilo */}
                {conversacion.map((msg: FeedbackMensaje, idx: number) => {
                    const esAdmin = msg.es_admin ?? msg.esAdmin;
                    const autorNombre = msg.nombre_autor || msg.nombreAutor || (esAdmin ? 'Soporte DIITRA' : 'Usuario');
                    const autorRol = msg.rol_autor || msg.rolAutor;

                    return (
                        <div 
                            key={msg.id || idx}
                            className={`p-3 rounded-xl border text-[12.5px] space-y-1.5 transition-all ${
                                esAdmin 
                                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40 ml-4' 
                                    : 'bg-bg-deep/60 border-border-thin mr-4'
                            }`}
                        >
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-semibold">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                        esAdmin 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-zinc-200 dark:bg-zinc-800 text-text-dim'
                                    }`}>
                                        {esAdmin ? <ShieldCheck size={11} /> : <UserIcon size={11} />}
                                    </div>
                                    <span className={esAdmin ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-text-main'}>
                                        {autorNombre}
                                    </span>
                                    {autorRol && (
                                        <span className="text-[10px] font-mono font-normal text-text-dim">
                                            ({autorRol})
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono text-[10px] text-text-dim">
                                    {formatFecha(msg.fecha)}
                                </span>
                            </div>
                            <p className="text-text-main whitespace-pre-wrap leading-relaxed pl-6">
                                {msg.mensaje}
                            </p>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input para responder */}
            {canWrite ? (
                <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-border-thin">
                    {errorMsg && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                            {errorMsg}
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            value={mensajeText}
                            onChange={(e) => setMensajeText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isAdmin ? "Escribe una respuesta o solicitud de aclaración (Ctrl+Enter para enviar)..." : "Escribe una aclaración o comentario adicional (Ctrl+Enter)..."}
                            rows={3}
                            disabled={isSending}
                            className="w-full px-3 py-2 text-[12.5px] bg-bg-deep border border-border-thin rounded-xl text-text-main placeholder:text-text-dim/50 focus:border-brand focus:outline-none transition-colors resize-none pr-10"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-mono text-text-dim flex items-center gap-1">
                            <CornerDownRight size={11} /> Presiona Ctrl+Enter para enviar
                        </span>
                        <button
                            type="submit"
                            disabled={isSending || !mensajeText.trim()}
                            className="btn-vercel-primary text-[12px] font-medium px-4 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
                </form>
            ) : (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-border-thin flex items-center gap-2.5 text-text-dim text-[12px]">
                    <Lock size={14} className="shrink-0 text-text-dim" />
                    <span>Este ticket ha sido cerrado o resuelto. No es posible enviar más mensajes.</span>
                </div>
            )}
        </div>
    );
};
