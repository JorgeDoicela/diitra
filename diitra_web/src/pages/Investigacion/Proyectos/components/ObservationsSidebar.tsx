import React, { useMemo } from 'react';
import {
    MessageSquare,
    CheckCircle2,
    Send,
    Mic,
    MicOff,
    ChevronRight,
    Shield,
    AlertCircle
} from 'lucide-react';
import api from '../../../../api/axios_config';

interface SectionComment {
    id: number;
    status: 'Pendiente' | 'Aprobado' | 'Corregir';
    text: string;
    creadoEn?: string;
    nombreUsuario?: string;
}

interface ObservationsSidebarProps {
    isOpen: boolean;
    width: number;
    isDragging: boolean;
    startDragging: (e: React.MouseEvent) => void;
    toggleOpen: () => void;
    activeCommentField: string;
    setActiveCommentField: (field: string) => void;
    activeSection?: string;
    setActiveSection?: (section: string) => void;
    projectUuid?: string;
    comments: Record<string, SectionComment[]>;
    contextualInput: string;
    setContextualInput: (value: string) => void;
    isListening: boolean;
    submitting: boolean;
    editingCommentId: number | null;
    setEditingCommentId: (id: number | null) => void;
    saveContextualComment: () => Promise<void>;
    handleStartListening: () => void;
    removeCommentLocal: (section: string, id: number) => void;
    FIELD_LABELS: Record<string, string>;
    templateBlocks?: any[];
    readOnly?: boolean;
}

export const ObservationsSidebar: React.FC<ObservationsSidebarProps> = ({
    isOpen,
    width,
    isDragging,
    startDragging,
    toggleOpen,
    activeCommentField,
    setActiveCommentField,
    comments,
    contextualInput,
    setContextualInput,
    isListening,
    submitting,
    editingCommentId,
    setEditingCommentId,
    saveContextualComment,
    handleStartListening,
    removeCommentLocal,
    FIELD_LABELS,
    templateBlocks,
    readOnly = false
}) => {
    const availableFields = useMemo(() => {
        const fields: Record<string, string> = { ...FIELD_LABELS };
        if (templateBlocks && Array.isArray(templateBlocks)) {
            templateBlocks.forEach((block, bIdx) => {
                const isStandardBlock = [
                    'cover', 'project_general_section', 'researchers_table',
                    'project_technical_section', 'project_budget_section',
                    'impacts', 'gantt', 'signatures', 'title'
                ].includes(block.type);

                if (!isStandardBlock) {
                    const fieldKey = block.config?.fieldKey || block.id || `custom_block_${bIdx}`;
                    const blockTitle = block.title || `Sección ${bIdx + 1}`;
                    if (!fields[fieldKey]) {
                        fields[fieldKey] = blockTitle;
                    }
                }
            });
        }
        return fields;
    }, [FIELD_LABELS, templateBlocks]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (contextualInput.trim() && !submitting) {
                saveContextualComment();
            }
        }
    };

    return (
        <div
            style={{ width: isOpen ? `${width}px` : '0px' }}
            className={`h-full bg-bg-deep border-l border-border-thin flex flex-col shrink-0 relative overflow-hidden select-none ${
                isDragging ? 'transition-none' : 'transition-all duration-300'
            }`}
        >
            {/* Tirador Resizer izquierdo */}
            <div
                onMouseDown={startDragging}
                className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/35 active:bg-brand/50 z-20 transition-all"
                title="Arrastra para ajustar el ancho"
            />

            {/* Selector de campo bajo inspección / Cabecera */}
            <div className="p-4 py-3 border-b border-border-thin bg-surface/20 shrink-0">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                        <label className="text-[9px] font-black text-text-dim uppercase tracking-wider font-mono">
                            Campo Bajo Inspección:
                        </label>
                        {comments[activeCommentField]?.length > 0 && (
                            <span className="text-[9px] font-bold text-amber-500 font-mono flex items-center gap-1">
                                <AlertCircle size={10} />
                                {comments[activeCommentField].length} obs
                            </span>
                        )}
                    </div>
                    <button
                        onClick={toggleOpen}
                        className="p-1 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors cursor-pointer"
                        title="Contraer panel lateral"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <select
                    value={activeCommentField}
                    onChange={(e) => setActiveCommentField(e.target.value)}
                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-2 pr-8 text-xs font-bold uppercase tracking-tight text-text-main outline-none focus:border-text-main transition-all cursor-pointer font-sans appearance-none shadow-xs"
                    style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23888888' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.2em 1.2em',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {Object.entries(availableFields).map(([key, label]) => {
                        const count = comments[key]?.length || 0;
                        return (
                            <option key={key} value={key} className="bg-bg-deep text-text-main py-1">
                                {count > 0 ? `(${count}) ` : ''}{label}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Contenedor Principal de Observaciones */}
            <div className="flex-1 flex flex-col min-h-0">

                {/* Lista de Observaciones */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3.5 bg-bg-deep/40">
                    {comments[activeCommentField] && comments[activeCommentField].length > 0 ? (
                        <div className="space-y-3">
                            {comments[activeCommentField].map((com) => (
                                <div
                                    key={com.id}
                                    className="bg-surface border border-border-thin p-4 rounded-xl space-y-2.5 shadow-sm animate-fade-in"
                                >
                                    <div className="flex items-center justify-between border-b border-border-thin/40 pb-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[9px] font-bold">
                                                <Shield size={11} />
                                            </div>
                                            <span className="text-[10px] font-bold text-text-main font-mono">
                                                {com.nombreUsuario || 'Revisor'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingCommentId(com.id);
                                                    setContextualInput(com.text);
                                                }}
                                                className="text-[9px] font-bold uppercase tracking-wider text-text-dim hover:text-text-main transition-colors cursor-pointer border-0 bg-transparent"
                                                title="Editar observación"
                                            >
                                                Editar
                                            </button>
                                            <span className="text-border-thin text-[9px]">|</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.delete(`/collaboration/comments/${com.id}`);
                                                        if (editingCommentId === com.id) {
                                                            setEditingCommentId(null);
                                                            setContextualInput('');
                                                        }
                                                        removeCommentLocal(activeCommentField, com.id);
                                                    } catch (e) {
                                                        console.error("Error al eliminar comentario", e);
                                                    }
                                                }}
                                                className="text-[9px] font-bold uppercase tracking-wider text-error hover:text-error/80 transition-colors cursor-pointer border-0 bg-transparent"
                                                title="Eliminar observación"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-text-main font-mono leading-relaxed break-words bg-bg-deep/50 p-2.5 rounded-lg border border-border-thin/30">
                                        {com.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center text-text-dim p-6 py-12">
                            <div className="p-3 bg-surface rounded-full border border-border-thin mb-3 shadow-sm text-text-dim/60">
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-[11px] font-black text-text-main uppercase tracking-wider">
                                Sin observaciones
                            </p>
                            <p className="text-[10px] text-text-dim mt-1 max-w-[200px] leading-relaxed font-mono">
                                Este campo está aprobado implícitamente. Si requiere correcciones, escribe abajo.
                            </p>
                        </div>
                    )}
                </div>

                {/* Input de Feedback Inferior (solo administradores / revisores activos) */}
                {!readOnly && (
                    <div className="shrink-0 p-4 border-t border-border-thin bg-surface/30 space-y-2">
                        {editingCommentId && (
                            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider font-mono">
                                    Modo de edición activo
                                </span>
                                <button
                                    onClick={() => {
                                        setEditingCommentId(null);
                                        setContextualInput('');
                                    }}
                                    className="text-[9px] font-bold uppercase text-text-dim hover:text-text-main cursor-pointer bg-transparent border-0"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2 bg-surface border border-border-thin rounded-2xl p-2.5 focus-within:border-text-main transition-all shadow-xs">
                            <textarea
                                value={contextualInput}
                                onChange={(e) => setContextualInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe una observación... (Enter para enviar)"
                                className="flex-1 bg-transparent border-0 outline-none text-xs text-text-main placeholder:text-text-dim/60 resize-none max-h-24 min-h-[36px] font-sans leading-relaxed custom-scrollbar py-1 px-1"
                                disabled={submitting}
                                rows={1}
                            />
                            <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                                <button
                                    type="button"
                                    onClick={handleStartListening}
                                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                        isListening
                                            ? 'bg-error/15 text-error border-error/30 animate-pulse'
                                            : 'bg-bg-deep hover:bg-surface-hover border-border-thin text-text-dim hover:text-text-main'
                                    }`}
                                    title={isListening ? "Detener grabación" : "Dictar por voz"}
                                >
                                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={saveContextualComment}
                                    disabled={!contextualInput.trim() || submitting}
                                    className="p-2 rounded-xl bg-text-main hover:opacity-90 text-bg-deep disabled:opacity-30 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Registrar observación"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
