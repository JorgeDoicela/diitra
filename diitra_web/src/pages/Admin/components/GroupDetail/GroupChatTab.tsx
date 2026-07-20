import React from 'react';
import {
    MessageSquare, Loader2, Edit2, XCircle, AlertTriangle, Mic, Send
} from 'lucide-react';
import { useGroupDetail } from './useGroupDetail';
import { AudioBubblePlayer } from '../AudioBubblePlayer';

interface GroupChatTabProps {
    hook: ReturnType<typeof useGroupDetail>;
    user: any;
}

export const GroupChatTab: React.FC<GroupChatTabProps> = ({
    hook,
    user
}) => {
    const {
        feedbackComments,
        loadingFeedback,
        newFeedbackText,
        setNewFeedbackText,
        sendingFeedback,
        editingCommentId,
        setEditingCommentId,
        editingCommentText,
        setEditingCommentText,
        isRecording,
        recordingTime,
        audioUrl,
        audioBlob,
        setAudioBlob,
        setAudioUrl,
        detailGroup,
        setDetailTab,
        setHighlightedField,
        handleDeleteComment,
        handleUpdateComment,
        cancelRecording,
        stopRecording,
        startRecording,
        handleSendFeedbackMessage
    } = hook;

    if (!detailGroup) return null;

    return (
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
                                                        : 'text-brand-light'
                                            }`}>
                                                {isMe ? 'Tú' : c.nombreUsuario} (Retroalimentación de Campo)
                                            </span>
                                            <span className="text-[8px] text-text-dim font-mono">
                                                {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                                    {!fieldFeedbackData.audioUrl && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(c.idComentario);
                                                                setEditingCommentText(fieldFeedbackData.text);
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

                                        <div className={`rounded-xl p-4 border shadow-sm w-full select-text transition-all duration-300 ${
                                            isMe
                                                ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/30'
                                                : isMsgFromAdmin
                                                    ? 'bg-amber-500/[0.03] border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/30'
                                                    : 'bg-brand/[0.03] border-brand/20 text-text-main rounded-tl-none hover:border-brand/30'
                                        }`}>
                                            <div className="flex items-center justify-between border-b border-border-thin/20 pb-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={12} className={isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand-light'} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand-light'
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
                                                    className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-border-thin bg-surface-hover hover:border-border-hover text-text-dim active:scale-95 transition-all"
                                                >
                                                    Ver Campo
                                                </button>
                                            </div>
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
                                                                const updatedContent = JSON.stringify({ ...fieldFeedbackData, text: editingCommentText });
                                                                handleUpdateComment(c.idComentario, updatedContent);
                                                            }}
                                                            className="px-2 py-0.5 bg-emerald-500 text-bg-deep rounded text-[8px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {fieldFeedbackData.text && <p className="text-[11px] font-medium leading-relaxed">{fieldFeedbackData.text}</p>}
                                                    {fieldFeedbackData.audioUrl && (
                                                        <div className="mt-1">
                                                            <AudioBubblePlayer src={fieldFeedbackData.audioUrl} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                                    : 'text-brand-light'
                                        }`}>
                                            {isMe ? 'Tú' : c.nombreUsuario}
                                        </span>
                                        <span className="text-[8px] text-text-dim font-mono">
                                            {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                                {!isAudio && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(c.idComentario);
                                                            setEditingCommentText(c.contenido);
                                                        }}
                                                        className="text-[8px] text-text-dim hover:text-text-main"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={10} />
                                                    </button>
                                                )}
                                                {isAudio && audioData && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(c.idComentario);
                                                            setEditingCommentText(audioData.text || '');
                                                        }}
                                                        className="text-[8px] text-text-dim hover:text-text-main"
                                                        title="Editar Texto"
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

                                    <div className={`rounded-xl p-4 border shadow-sm select-text transition-all duration-300 w-full ${
                                        isMe
                                            ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/30'
                                            : isMsgFromAdmin
                                                ? 'bg-amber-500/[0.03] border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/30'
                                                : 'bg-brand/[0.03] border-brand/20 text-text-main rounded-tl-none hover:border-brand/30'
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
                                                            if (isAudio && audioData) {
                                                                updatedContent = JSON.stringify({ ...audioData, text: editingCommentText });
                                                            }
                                                            handleUpdateComment(c.idComentario, updatedContent);
                                                        }}
                                                        className="px-2 py-0.5 bg-emerald-500 text-bg-deep rounded text-[8px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isAudio && audioData ? (
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
    );
};
