import React, { useState, useRef } from 'react';
import { MessageSquare, Mic, MicOff, Send, X } from 'lucide-react';
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
    templateBlocks
}) => {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const availableFields = React.useMemo(() => {
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

    const handlePanelDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, select, input, textarea')) {
            return;
        }

        e.preventDefault();
        setIsDraggingPanel(true);

        const panelEl = panelRef.current;
        if (!panelEl) return;

        const rect = panelEl.getBoundingClientRect();
        const shiftX = e.clientX - rect.left;
        const shiftY = e.clientY - rect.top;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            let newX = moveEvent.clientX - shiftX;
            let newY = moveEvent.clientY - shiftY;

            newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newX));
            newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDraggingPanel(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            style={{ 
                width: `${width}px`,
                left: position ? `${position.x}px` : undefined,
                top: position ? `${position.y}px` : undefined
            }}
            className={`fixed right-4 top-[70px] h-[440px] z-50 flex flex-col border border-border-thin bg-surface/95 backdrop-blur-md rounded-2xl shrink-0 animate-fade-in font-sans select-none shadow-[0_12px_40px_rgba(0,0,0,0.18)] overflow-hidden ${
                isDragging ? 'border-brand/45 ring-1 ring-brand/20 shadow-[0_12px_40px_rgba(99,102,241,0.12)]' : ''
            } ${isDraggingPanel ? 'shadow-[0_20px_50px_rgba(0,0,0,0.25)] border-brand/50 ring-1 ring-brand/35' : ''}`}
        >
            {/* Resizer Manija (Draggable Area) */}
            <div
                onMouseDown={startDragging}
                className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-brand/30 active:bg-brand/50 transition-colors z-20"
            />

            {/* Cabecera Superior Integrada (Arrastrable) */}
            <div 
                onMouseDown={handlePanelDragStart}
                className="py-2.5 px-3.5 border-b border-border-thin bg-surface/50 shrink-0 cursor-grab active:cursor-grabbing relative pr-11"
            >
                <span className="text-[8px] font-black text-brand uppercase tracking-widest block mb-1 font-mono">Campo bajo Inspección:</span>
                <select
                    value={activeCommentField}
                    onChange={(e) => setActiveCommentField(e.target.value)}
                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-1.5 pr-10 text-xs font-bold uppercase tracking-tight text-text-main outline-none focus:border-brand/45 transition-all cursor-pointer font-sans appearance-none relative z-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25em 1.25em',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {Object.entries(availableFields).map(([key, label]) => (
                        <option key={key} value={key} className="bg-bg-deep text-text-main py-1">
                            {label}
                        </option>
                    ))}
                </select>

                {/* Botón X de Cierre Flotante en la Esquina */}
                <button
                    onClick={toggleOpen}
                    className="absolute right-3 top-2.5 p-1.5 hover:bg-surface-hover border border-border-thin rounded-lg text-text-dim hover:text-text-main transition-all cursor-pointer z-30"
                    title="Ocultar panel de comentarios"
                >
                    <X size={12} />
                </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">

                {/* Observación Actual */}
                <div className="flex-1 overflow-y-auto p-4 bg-bg-deep/5 custom-scrollbar space-y-4">
                    {comments[activeCommentField] && comments[activeCommentField].length > 0 ? (
                        <div className="space-y-3">
                            {comments[activeCommentField].map((com) => (
                                <div key={com.id} className="bg-surface border border-border-thin p-4 rounded-xl space-y-3.5 shadow-sm animate-fade-in">
                                    <div className="flex items-center justify-between border-b border-border-thin/20 pb-1.5">
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider font-mono">
                                            {editingCommentId === com.id ? 'Editando Observación:' : 'Observación Registrada:'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingCommentId(com.id);
                                                    setContextualInput(com.text);
                                                }}
                                                className="text-[8px] font-bold uppercase tracking-widest text-brand hover:text-brand/80 transition-all cursor-pointer border-0 bg-transparent"
                                                title="Editar observación"
                                            >
                                                Editar
                                            </button>
                                            <span className="text-text-dim/20 text-[8px]">|</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        // Eliminar comentario físicamente del backend (DELETE)
                                                        await api.delete(`/collaboration/comments/${com.id}`);
                                                        if (editingCommentId === com.id) {
                                                            setEditingCommentId(null);
                                                            setContextualInput('');
                                                        }
                                                        removeCommentLocal(activeCommentField, com.id);
                                                    } catch (e) {
                                                        console.error("Error al eliminar comentario en backend", e);
                                                    }
                                                }}
                                                className="text-[8px] font-bold uppercase tracking-widest text-error hover:text-error/80 transition-all cursor-pointer border-0 bg-transparent"
                                                title="Eliminar observación"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-main font-mono leading-relaxed italic break-words">
                                        "{com.text}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center text-text-dim p-4">
                            <div className="p-3 bg-surface rounded-full border border-border-thin mb-3 shadow-sm text-brand/60">
                                <MessageSquare size={16} />
                            </div>
                            <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Sin observaciones</p>
                            <p className="text-[9px] text-text-dim mt-1.5 max-w-[200px] leading-relaxed uppercase font-mono">
                                Este campo está aprobado implícitamente. Si requiere correcciones, escriba o dicte su observación abajo.
                            </p>
                        </div>
                    )}
                </div>

                {/* Formulario de Comentario de Campo */}
                <div className="shrink-0 py-2.5 px-3.5 border-t border-border-thin bg-surface-hover/20">
                    {editingCommentId && (
                        <div className="mb-1.5 flex items-center justify-between bg-brand/5 border border-brand/10 px-3 py-1 rounded-lg">
                            <span className="text-[9px] font-bold text-brand uppercase tracking-wider font-mono">Modo de edición activo</span>
                            <button
                                onClick={() => {
                                    setEditingCommentId(null);
                                    setContextualInput('');
                                }}
                                className="text-[8px] font-bold uppercase text-text-dim hover:text-text-main cursor-pointer bg-transparent border-0"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-bg-deep border border-border-thin rounded-xl px-3 py-1.5 focus-within:border-brand/45 transition-all">
                        <textarea
                            value={contextualInput}
                            onChange={(e) => setContextualInput(e.target.value)}
                            placeholder="Escriba la retroalimentación..."
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-text-main placeholder:text-text-dim/60 resize-none h-8 font-mono leading-relaxed custom-scrollbar"
                            disabled={submitting}
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                            <style>{`
                                @keyframes soundwave {
                                    0% { height: 4px; }
                                    100% { height: 20px; }
                                }
                            `}</style>
                            {isListening && (
                                <div className="flex items-center gap-0.5 px-1 shrink-0 h-6">
                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.1s', height: '12px' }} />
                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.4s', height: '18px' }} />
                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.2s', height: '14px' }} />
                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.6s', height: '16px' }} />
                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.3s', height: '10px' }} />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleStartListening}
                                className={`p-1.5 rounded-full border transition-all cursor-pointer ${isListening
                                    ? 'bg-error/15 text-error border-error/30 animate-pulse'
                                    : 'bg-surface hover:bg-surface-hover border-border-thin text-text-dim hover:text-text-main'
                                    }`}
                                title={isListening ? "Detener voz" : "Grabar explicación de voz"}
                            >
                                {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                            </button>
                            <button
                                type="button"
                                onClick={saveContextualComment}
                                disabled={!contextualInput.trim()}
                                className="p-1.5 rounded-full bg-text-main hover:bg-text-main/90 text-bg-deep disabled:opacity-30 transition-all cursor-pointer"
                                title="Guardar dictamen"
                            >
                                <Send size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
