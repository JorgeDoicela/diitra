import React from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
    Search, X, Folder, Bell, BarChart3, BookOpen, Calendar as CalendarIcon,
    RotateCcw, FileText, Clock, Edit2, Trash2, TrendingUp
} from 'lucide-react';
import { COLORES_OPCIONES } from '../../../services/calendarioService';
import type { Evento, PlanificandoState } from '../types/calendarioTypes';

interface InboxViewProps {
    stickyNotes: Evento[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedFilterContext: string | null;
    setSelectedFilterContext: (c: string | null) => void;
    selectedFilterColor: string | null;
    setSelectedFilterColor: React.Dispatch<React.SetStateAction<string | null>>;
    draggedNoteIndex: number | null;
    draggedNote: Evento | null;
    draggedSize: { width: number; height: number };
    dragPreviewRef: React.RefObject<HTMLDivElement | null>;
    handleInboxPointerDown: (e: React.PointerEvent<HTMLDivElement>, note: Evento, index: number) => void;
    handleInboxPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    handleInboxPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    setPlanificando: React.Dispatch<React.SetStateAction<PlanificandoState | null>>;
    handleEditEventClick: (ev: Evento) => void;
    handleDeleteStickyNote: (uuid: string) => void;
    handleQuickPriorityChange: (note: Evento, prio: string) => void;
    handleQuickColorChange: (note: Evento, col: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
    stickyNotes,
    searchQuery,
    setSearchQuery,
    selectedFilterContext,
    setSelectedFilterContext,
    selectedFilterColor,
    setSelectedFilterColor,
    draggedNoteIndex,
    draggedNote,
    draggedSize,
    dragPreviewRef,
    handleInboxPointerDown,
    handleInboxPointerMove,
    handleInboxPointerUp,
    setPlanificando,
    handleEditEventClick,
    handleDeleteStickyNote,
    handleQuickPriorityChange,
    handleQuickColorChange,
}) => {
    return (
        <div className="sticky-inbox-view">
            {/* ── Barra de herramientas premium (Búsqueda + Filtros) ── */}
            <div className="sticky-inbox-toolbar animate-slide-up">
                <div className="sticky-inbox-search-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por título o contenido de la nota..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="sticky-inbox-search-input"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="search-clear-btn"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div className="sticky-inbox-filters-wrapper">
                    {/* Filtro por módulo de origen */}
                    <div className="sticky-inbox-context-filters">
                        <button
                            type="button"
                            className={`inbox-filter-chip ${selectedFilterContext === null ? 'active' : ''}`}
                            onClick={() => setSelectedFilterContext(null)}
                        >
                            Todos
                        </button>
                        {[
                            { key: 'Proyectos', label: 'Proyectos', icon: Folder },
                            { key: 'Convocatorias', label: 'Convocatorias', icon: Bell },
                            { key: 'Monitoreo', label: 'Monitoreo', icon: BarChart3 },
                            { key: 'Investigacion', label: 'Investigación', icon: BookOpen },
                            { key: 'Agenda', label: 'Agenda', icon: CalendarIcon },
                        ].map(ctx => (
                            <button
                                key={ctx.key}
                                type="button"
                                className={`inbox-filter-chip ${selectedFilterContext === ctx.key ? 'active' : ''}`}
                                onClick={() => setSelectedFilterContext(ctx.key)}
                            >
                                <ctx.icon size={11} className="mr-1.5 opacity-70" />
                                {ctx.label}
                            </button>
                        ))}
                    </div>

                    {/* Filtro por color de tarjeta */}
                    <div className="sticky-inbox-color-filters">
                        {COLORES_OPCIONES.map(col => (
                            <button
                                key={col.value}
                                type="button"
                                className={`inbox-color-filter-dot ${selectedFilterColor === col.value ? 'active' : ''}`}
                                style={{ backgroundColor: col.value }}
                                onClick={() => setSelectedFilterColor(prev => prev === col.value ? null : col.value)}
                                title={`Filtrar por ${col.label}`}
                            />
                        ))}
                        {selectedFilterColor && (
                            <button
                                type="button"
                                className="inbox-color-filter-clear"
                                onClick={() => setSelectedFilterColor(null)}
                                title="Limpiar filtro de color"
                            >
                                <RotateCcw size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Rejilla responsiva de notas filtradas ── */}
            <div className="sticky-inbox-grid">
                {(() => {
                    const filteredNotes = stickyNotes.filter(note => {
                        const matchesSearch = note.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (note.nota_detalle || '').toLowerCase().includes(searchQuery.toLowerCase());

                        const matchesContext = !selectedFilterContext ? true : (() => {
                            const url = note.url_accion || '';
                            if (selectedFilterContext === 'Proyectos') return url.startsWith('/investigacion/proyectos');
                            if (selectedFilterContext === 'Convocatorias') return url.startsWith('/investigacion/convocatorias');
                            if (selectedFilterContext === 'Monitoreo') return url.startsWith('/investigacion/monitoreo');
                            if (selectedFilterContext === 'Investigacion') return url.startsWith('/investigacion') && !url.includes('/proyectos') && !url.includes('/convocatorias');
                            if (selectedFilterContext === 'Agenda') return url.startsWith('/agenda');
                            return false;
                        })();

                        const matchesColor = !selectedFilterColor ? true : note.color_hex === selectedFilterColor;

                        return matchesSearch && matchesContext && matchesColor;
                    });

                    if (filteredNotes.length === 0) {
                        return (
                            <div className="sticky-inbox-empty col-span-full animate-slide-up">
                                <div className="text-center p-12 bg-surface border border-border-thin rounded-xl max-w-md mx-auto">
                                    <FileText size={40} className="text-text-dim mx-auto mb-4 opacity-50" />
                                    <h4 className="text-sm font-bold text-fg mb-1">Sin notas coincidentes</h4>
                                    <p className="text-xs text-text-dim leading-relaxed">
                                        {stickyNotes.length === 0
                                            ? 'Usa el botón flotante en la esquina inferior derecha o el botón "Añadir Nota" de arriba para guardar recordatorios rápidos.'
                                            : 'Prueba a cambiar tus términos de búsqueda o a limpiar los filtros activos de arriba.'
                                        }
                                    </p>
                                    {(searchQuery || selectedFilterContext || selectedFilterColor) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedFilterContext(null);
                                                setSelectedFilterColor(null);
                                            }}
                                            className="btn-vercel-secondary text-[11px] py-1.5 px-4 mt-4 rounded mx-auto"
                                        >
                                            Limpiar Filtros
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return filteredNotes.map((note, index) => {
                        const indexReal = stickyNotes.findIndex(n => n.uuid === note.uuid);

                        const contextoChip = (() => {
                            const url = note.url_accion || '';
                            if (url.startsWith('/investigacion/proyectos')) return { label: 'Proyectos', icon: Folder };
                            if (url.startsWith('/investigacion/convocatorias')) return { label: 'Convocatorias', icon: Bell };
                            if (url.startsWith('/investigacion/monitoreo')) return { label: 'Monitoreo', icon: BarChart3 };
                            if (url.startsWith('/investigacion')) return { label: 'Investigación', icon: BookOpen };
                            if (url.startsWith('/agenda')) return { label: 'Agenda', icon: CalendarIcon };
                            if (url.startsWith('/analiticas')) return { label: 'Analíticas', icon: TrendingUp };
                            return null;
                        })();

                        return (
                            <motion.div
                                key={note.uuid}
                                layout
                                onPointerDown={(e) => handleInboxPointerDown(e, note, indexReal !== -1 ? indexReal : index)}
                                onPointerMove={handleInboxPointerMove}
                                onPointerUp={handleInboxPointerUp}
                                data-note-uuid={note.uuid}
                                className={`inbox-note-card animate-slide-up ${draggedNoteIndex === (indexReal !== -1 ? indexReal : index) ? 'dragging' : ''}`}
                                style={{
                                    '--note-color': note.color_hex || '#F59E0B',
                                    animationDelay: `${index * 0.04}s`,
                                    touchAction: 'none'
                                } as React.CSSProperties}
                                transition={{
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 26
                                }}
                            >
                                <div className="inbox-note-header">
                                    <h4 className="inbox-note-title">{note.titulo}</h4>
                                    <div className="inbox-note-actions">
                                        <button
                                            type="button"
                                            className="inbox-note-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                setPlanificando({
                                                    note,
                                                    targetEstado: 'Pendiente',
                                                    anchorPos: { x: btnRect.left + btnRect.width / 2, y: btnRect.top + window.scrollY - 10 }
                                                });
                                            }}
                                            title="Planificar en Agenda"
                                        >
                                            <Clock size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="inbox-note-btn"
                                            onClick={() => handleEditEventClick(note)}
                                            title="Editar nota"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="inbox-note-btn delete"
                                            onClick={() => handleDeleteStickyNote(note.uuid)}
                                            title="Eliminar nota"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {note.nota_detalle && (
                                    <p className="inbox-note-description">{note.nota_detalle}</p>
                                )}

                                <div className="inbox-note-footer">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {contextoChip && (
                                            <div className="inbox-note-context">
                                                <contextoChip.icon size={10} className="opacity-70" />
                                                <span>{contextoChip.label}</span>
                                            </div>
                                        )}

                                        <select
                                            value={note.prioridad}
                                            onChange={(e) => handleQuickPriorityChange(note, e.target.value)}
                                            className="inbox-note-priority-select"
                                            title="Cambiar prioridad"
                                        >
                                            <option value="Baja">Prioridad Baja</option>
                                            <option value="Media">Prioridad Media</option>
                                            <option value="Alta">Prioridad Alta</option>
                                        </select>
                                    </div>

                                    <div className="inbox-note-quick-colors">
                                        {COLORES_OPCIONES.map(col => (
                                            <button
                                                key={col.value}
                                                type="button"
                                                className={`inbox-note-quick-color-dot ${note.color_hex === col.value ? 'active' : ''}`}
                                                style={{ backgroundColor: col.value }}
                                                onClick={() => handleQuickColorChange(note, col.value)}
                                                title={col.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    });
                })()}
            </div>
            {draggedNote && (() => {
                const draggedContextoChip = (() => {
                    const url = draggedNote.url_accion || '';
                    if (url.startsWith('/investigacion/proyectos')) return { label: 'Proyectos', icon: Folder };
                    if (url.startsWith('/investigacion/convocatorias')) return { label: 'Convocatorias', icon: Bell };
                    if (url.startsWith('/investigacion/monitoreo')) return { label: 'Monitoreo', icon: BarChart3 };
                    if (url.startsWith('/investigacion')) return { label: 'Investigación', icon: BookOpen };
                    if (url.startsWith('/agenda')) return { label: 'Agenda', icon: CalendarIcon };
                    if (url.startsWith('/analiticas')) return { label: 'Analíticas', icon: TrendingUp };
                    return null;
                })();

                return createPortal(
                    <div
                        ref={dragPreviewRef}
                        className="inbox-note-card-drag-preview"
                        style={{
                            position: 'fixed',
                            width: draggedSize.width,
                            height: draggedSize.height,
                            pointerEvents: 'none',
                            zIndex: 99999,
                            '--note-color': draggedNote.color_hex || '#F59E0B',
                            background: `color-mix(in srgb, ${draggedNote.color_hex || '#F59E0B'} 8%, var(--surface))`,
                            border: `1px solid color-mix(in srgb, ${draggedNote.color_hex || '#F59E0B'} 30%, var(--border))`,
                        } as React.CSSProperties}
                    >
                        <div className="inbox-note-header">
                            <h4 className="inbox-note-title">{draggedNote.titulo}</h4>
                        </div>
                        {draggedNote.nota_detalle && (
                            <p className="inbox-note-description">{draggedNote.nota_detalle}</p>
                        )}
                        <div className="inbox-note-footer" style={{ border: 'none', padding: 0 }}>
                            <div className="flex flex-col items-start gap-1.5">
                                {draggedContextoChip && (
                                    <div className="inbox-note-context" style={{ margin: 0 }}>
                                        <draggedContextoChip.icon size={10} className="opacity-70" />
                                        <span>{draggedContextoChip.label}</span>
                                    </div>
                                )}
                                {draggedNote.prioridad && (
                                    <span className="inbox-note-priority-select" style={{ cursor: 'default', margin: 0 }}>
                                        Prioridad {draggedNote.prioridad}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            })()}
        </div>
    );
};
