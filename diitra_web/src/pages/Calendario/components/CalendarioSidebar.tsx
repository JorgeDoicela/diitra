import React from 'react';
import {
    Folder, Bell, BarChart3, BookOpen, Calendar as CalendarIcon,
    TrendingUp, Edit2, Trash2, ChevronRight, RotateCcw
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    type EventoCalendario,
    CATEGORIAS_CONFIG
} from '../../../services/calendarioService';
import { getModuleContext } from '../../../utils/moduleContext';
import type { Event as BigCalendarEvent } from 'react-big-calendar';
import type { CalendarViewMode } from '../types/calendarioTypes';
import './CalendarioSidebar.css';

export interface CalendarEventExtended extends BigCalendarEvent {
    resource: EventoCalendario;
}

interface CalendarioSidebarProps {
    viewMode?: CalendarViewMode;
    categoriasVisibles: Record<string, boolean>;
    toggleCategoria: (key: string) => void;
    stickyNotes: EventoCalendario[];
    draggingUuid: string | null;
    draggingType?: 'note' | 'kanban' | null;
    onDropEventToInbox?: (uuid: string) => void;
    handleNoteDragStart: (e: React.DragEvent, note: EventoCalendario) => void;
    handleGlobalDragEnd: () => void;
    handleEditEventClick: (note: EventoCalendario) => void;
    handleDeleteStickyNote: (uuid: string) => Promise<void>;
    proximosEventos: CalendarEventExtended[];
    setSelectedEvent: (ev: EventoCalendario) => void;
    icalUrl: string;
    copied: boolean;
    generatingToken: boolean;
    handleCopyIcal: () => void;
    handleGenerarToken: () => void;
}

export const CalendarioSidebar: React.FC<CalendarioSidebarProps> = ({
    viewMode = 'calendar',
    categoriasVisibles,
    toggleCategoria,
    stickyNotes,
    draggingUuid,
    draggingType,
    onDropEventToInbox,
    handleNoteDragStart,
    handleGlobalDragEnd,
    handleEditEventClick,
    handleDeleteStickyNote,
    proximosEventos,
    setSelectedEvent,
    icalUrl,
    copied,
    generatingToken,
    handleCopyIcal,
    handleGenerarToken,
}) => {
    const hoy = startOfDay(new Date());
    const [isOverInboxDropZone, setIsOverInboxDropZone] = React.useState(false);

    return (
        <aside className="calendario-sidebar" aria-label="Panel lateral de calendario">
            {/* Próximos Eventos */}
            <div className="sidebar-section proximos-section">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="!mb-0">Próximos Eventos</h3>
                </div>
                {proximosEventos.length === 0 ? (
                    <p className="proximos-empty">Sin eventos próximos</p>
                ) : (
                    <div className="proximos-lista">
                        {proximosEventos.map(ev => {
                            const r = ev.resource;
                            const esMismo = format(ev.start as Date, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');
                            return (
                                <button
                                    key={r.uuid}
                                    className="proximo-item"
                                    style={{ '--ev-color': r.color_hex || '#6B7280' } as React.CSSProperties}
                                    onClick={() => setSelectedEvent(r)}
                                >
                                    <span className="proximo-dot" />
                                    <div className="proximo-info">
                                        <span className="proximo-titulo">{r.titulo}</span>
                                        <span className="proximo-fecha">
                                            {esMismo ? 'Hoy' : format(ev.start as Date, 'd MMM', { locale: es })}
                                        </span>
                                    </div>
                                    <ChevronRight size={12} className="proximo-arrow" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notas Rápidas (Inbox) con Soporte de Drop para Devolver */}
            <div
                className={`sidebar-section sticky-notes-section ${isOverInboxDropZone ? 'drop-target-active' : ''}`}
                onDragOver={(e) => {
                    if (draggingType === 'kanban' || e.dataTransfer.types.includes('diitra/kanban-event')) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (!isOverInboxDropZone) setIsOverInboxDropZone(true);
                    }
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsOverInboxDropZone(false);
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsOverInboxDropZone(false);
                    const uuid = e.dataTransfer.getData('diitra/kanban-event') || e.dataTransfer.getData('text/plain') || draggingUuid;
                    handleGlobalDragEnd();
                    if (uuid && onDropEventToInbox) {
                        onDropEventToInbox(uuid);
                    }
                }}
            >
                <h3>Notas Rápidas</h3>
                <p className="ical-help-text mb-3">Arrastra las notas al tablero <strong>Kanban</strong> para planificarlas.</p>

                {isOverInboxDropZone && (
                    <div className="sticky-notes-drop-overlay">
                        <RotateCcw size={20} className="text-brand" />
                        <span className="drop-overlay-title">Soltar para devolver</span>
                    </div>
                )}

                <div className="sticky-notes-grid">
                    {stickyNotes.length === 0 ? (
                        <p className="proximos-empty">Bandeja vacía</p>
                    ) : (
                        stickyNotes.map(note => {
                            const ctx = getModuleContext(note.url_accion || '');

                            return (
                                <div
                                    key={note.uuid}
                                    draggable
                                    onDragStart={(e) => handleNoteDragStart(e, note)}
                                    onDragEnd={handleGlobalDragEnd}
                                    className={`sticky-note-card ${draggingUuid === note.uuid ? 'dragging' : ''}`}
                                    style={{ '--note-color': note.color_hex || '#F59E0B' } as React.CSSProperties}
                                >
                                    <div className="sticky-note-content">
                                        <p className="sticky-note-text">{note.titulo}</p>
                                        {note.nota_detalle && (
                                            <p className="sticky-note-detalle">{note.nota_detalle}</p>
                                        )}
                                        {ctx && (
                                            <div className="sticky-note-ctx-chip" title={`${ctx.modulo}${ctx.submodulo ? ` › ${ctx.submodulo}` : ''}`}>
                                                <ctx.Icon size={10} className="opacity-70 shrink-0" />
                                                <span className="truncate">{ctx.modulo}</span>
                                                {ctx.submodulo && (
                                                    <>
                                                        <span className="opacity-40">›</span>
                                                        <span className="font-semibold truncate">{ctx.submodulo}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="sticky-note-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            className="sticky-note-action-btn"
                                            onClick={() => handleEditEventClick(note)}
                                            title="Editar nota"
                                        >
                                            <Edit2 size={11} />
                                        </button>
                                        <button
                                            type="button"
                                            className="sticky-note-action-btn delete"
                                            onClick={() => handleDeleteStickyNote(note.uuid)}
                                            title="Eliminar nota"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Filtros de Agenda - Solo en vista calendario */}
            {viewMode === 'calendar' && (
                <div className="sidebar-section">
                    <h3>Filtros de Agenda</h3>
                    <div className="filtros-lista">
                        {Object.entries(CATEGORIAS_CONFIG).map(([key, { label, color }]) => (
                            <label key={key} className="filtro-item" style={{ '--color': color } as React.CSSProperties}>
                                <input
                                    type="checkbox"
                                    checked={categoriasVisibles[key]}
                                    onChange={() => toggleCategoria(key)}
                                />
                                <span className="color-dot" />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* iCal - Solo en vista calendario */}
            {viewMode === 'calendar' && (
                <div className="sidebar-section ical-section">
                    <h3>Sincronización de Agenda</h3>
                    <p className="ical-help-text">Integra tus hitos en Google Calendar, Outlook o Apple Calendar.</p>
                    {icalUrl ? (
                        <div className="ical-container">
                            <input
                                type="text"
                                readOnly
                                value={icalUrl}
                                className="ical-input"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <div className="ical-buttons">
                                <button onClick={handleCopyIcal} className="ical-btn primary">
                                    {copied ? '¡Copiado!' : 'Copiar'}
                                </button>
                                <button onClick={handleGenerarToken} className="ical-btn secondary" disabled={generatingToken}>
                                    {generatingToken ? '...' : 'Regenerar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleGenerarToken} className="ical-btn generate" disabled={generatingToken}>
                            {generatingToken ? 'Obtener Enlace iCal' : 'Obtener Enlace iCal'}
                        </button>
                    )}
                </div>
            )}
        </aside>
    );
};
