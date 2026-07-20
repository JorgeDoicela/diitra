import React, { useRef } from 'react';
import { MessageSquare, ChevronRight, Edit2, XCircle, Mic, Send, Loader2 } from 'lucide-react';
import { useGroupDetail } from './useGroupDetail';
import { AudioBubblePlayer } from '../AudioBubblePlayer';

interface FieldFeedbackDrawerProps {
    hook: ReturnType<typeof useGroupDetail>;
    user: any;
    isAdmin: boolean;
}

export const FieldFeedbackDrawer: React.FC<FieldFeedbackDrawerProps> = ({
    hook,
    user,
    isAdmin
}) => {
    const {
        isFieldModalOpen,
        setIsFieldModalOpen,
        activeFieldKey,
        setActiveFieldKey,
        activeFieldName,
        setAudioBlob,
        setAudioUrl,
        getFieldComments,
        editingCommentId,
        setEditingCommentId,
        editingCommentText,
        setEditingCommentText,
        handleDeleteComment,
        handleUpdateComment,
        isRecording,
        recordingTime,
        audioUrl,
        audioBlob,
        cancelRecording,
        stopRecording,
        startRecording,
        newFeedbackText,
        setNewFeedbackText,
        sendingFeedback,
        handleSendFieldFeedback
    } = hook;

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    if (!isFieldModalOpen || !activeFieldKey) return null;

    const parseCommentContent = (contenido: string) => {
        try {
            if (contenido.trim().startsWith('{')) {
                const parsed = JSON.parse(contenido);
                return parsed;
            }
        } catch (e) {}
        return null;
    };

    return (
        <div className="absolute md:right-[calc(100%+16px)] right-4 left-4 md:left-auto md:top-[40%] md:-translate-y-1/2 bottom-6 md:bottom-auto w-auto md:w-[340px] max-h-[calc(100vh-48px)] h-fit bg-surface border border-border-thin rounded-2xl flex flex-col z-20 animate-fade-in shadow-xl overflow-hidden">
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
                        ref={textareaRef}
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendFieldFeedback(activeFieldKey, activeFieldName);
                            }
                        }}
                        placeholder={isAdmin ? "Observación..." : "Responder..."}
                        className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-2 pr-12 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-12 transition-colors custom-scrollbar placeholder:text-text-dim/60 font-medium"
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
    );
};
