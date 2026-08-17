import React from 'react';
import {
    Folder, Bell, BarChart3, BookOpen, Calendar as CalendarIcon,
    TrendingUp, Edit2, Trash2, ChevronRight
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    type EventoCalendario,
    CATEGORIAS_CONFIG
} from '../../../services/calendarioService';
import type { Event as BigCalendarEvent } from 'react-big-calendar';
import './CalendarioSidebar.css';

export interface CalendarEventExtended extends BigCalendarEvent {
    resource: EventoCalendario;
}

interface CalendarioSidebarProps {
    categoriasVisibles: Record<string, boolean>;
    toggleCategoria: (key: string) => void;
    stickyNotes: EventoCalendario[];
    draggingUuid: string | null;
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
    categoriasVisibles,
    toggleCategoria,
    stickyNotes,
    draggingUuid,
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
    handleGenerarToken
}) => {
    const hoy = startOfDay(new Date());

    return (
        <div className="calendario-sidebar">
            {/* Próximos Eventos */}
            <div className="sidebar-section proximos-section">
                <h3>Próximos Eventos</h3>
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

            {/* Notas Rápidas (Inbox) */}
            <div className="sidebar-section sticky-notes-section">
                <h3>Notas Rápidas</h3>
                <p className="ical-help-text mb-3">Arrastra las notas al tablero <strong>Kanban</strong> para planificarlas.</p>

                <div className="sticky-notes-grid">
                    {stickyNotes.length === 0 ? (
                        <p className="proximos-empty">Bandeja vacía</p>
                    ) : (
                        stickyNotes.map(note => {
                            // Derivar chip de contexto desde url_accion
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
                                        {contextoChip && (
                                            <div className="sticky-note-ctx-chip">
                                                <contextoChip.icon size={10} className="opacity-70" />
                                                <span>{contextoChip.label}</span>
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

            {/* Filtros */}
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

            {/* iCal */}
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
        </div>
    );
};
