import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import _withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Clock, Bell } from 'lucide-react';
import { CATEGORIAS_CONFIG } from '../../../services/calendarioService';
import type { CalendarEventExtended } from '../types/calendarioTypes';
import './CalendarView.css';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const withDragAndDrop = (typeof _withDragAndDrop === 'function'
    ? _withDragAndDrop
    : (_withDragAndDrop as any).default) as any;

const DnDCalendar = withDragAndDrop(Calendar as any);

const EventoEnCelda: React.FC<{ event: CalendarEventExtended }> = ({ event }) => {
    const ev = event.resource;
    const isCompleted = ev.estado === 'Completado';
    const isInProgress = ev.estado === 'EnProgreso';
    const isPersonal = ev.categoria_global === 'Personal';

    return (
        <span className="evento-celda-inner">
            {isPersonal && isCompleted && (
                <CheckCircle size={9} className="evento-estado-icon completado" />
            )}
            {isPersonal && isInProgress && (
                <Clock size={9} className="evento-estado-icon en-progreso" />
            )}
            {ev.alerta_dias != null && ev.alerta_dias > 0 && (
                <Bell size={9} className="evento-estado-icon alerta" />
            )}
            <span className={`evento-titulo-text ${isCompleted ? 'completado' : ''}`}>
                {event.title as string}
            </span>
        </span>
    );
};

const EventoEnAgenda: React.FC<{ event: CalendarEventExtended }> = ({ event }) => {
    const ev = event.resource;
    const isCompleted = ev.estado === 'Completado';
    const color = ev.color_hex || CATEGORIAS_CONFIG[ev.categoria_global]?.color || '#6B7280';

    const colorHex = color.toUpperCase();
    const colorClassMap: Record<string, string> = {
        '#F59E0B': 'orange',
        '#3B82F6': 'blue',
        '#10B981': 'green',
        '#EC4899': 'pink',
        '#8B5CF6': 'purple',
        '#EF4444': 'red',
        '#1E3A8A': 'darkblue',
    };
    const colorName = colorClassMap[colorHex] || 'gray';

    const badgeBg = `${color}14`;
    const badgeBorder = `${color}30`;

    return (
        <div
            className={`agenda-event-badge color-${colorName} ${isCompleted ? 'completado' : ''}`}
            style={{
                '--event-color': color,
                '--event-bg': badgeBg,
                '--event-border': badgeBorder
            } as React.CSSProperties}
        >
            <div className="agenda-event-badge-content">
                <span className="agenda-event-dot" />
                <span className="agenda-event-title">{ev.titulo}</span>
                {ev.descripcion && (
                    <span className="agenda-event-desc">— {ev.descripcion}</span>
                )}
            </div>
        </div>
    );
};

interface CalendarViewProps {
    view: View;
    setView: (view: View) => void;
    currentDate: Date;
    filteredEventos: CalendarEventExtended[];
    handleSelectEvent: (event: CalendarEventExtended) => void;
    handleSelectSlot: (slotInfo: SlotInfo) => void;
    handleNavigate: (newDate: Date) => void;
    eventStyleGetter: (event: CalendarEventExtended) => any;
    handleEventDrop: (data: any) => void;
    handleEventResize: (data: any) => void;
    isDraggable: (event: object) => boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    view,
    setView,
    currentDate,
    filteredEventos,
    handleSelectEvent,
    handleSelectSlot,
    handleNavigate,
    eventStyleGetter,
    handleEventDrop,
    handleEventResize,
    isDraggable,
}) => {
    if (view === 'agenda') {
        const sortedEvents = [...filteredEventos].sort(
            (a, b) => (a.start as Date).getTime() - (b.start as Date).getTime()
        );
        let lastDateStr = '';

        return (
            <div className="custom-agenda-view">
                <div className="custom-agenda-header">
                    <div className="custom-agenda-th th-fecha">Fecha</div>
                    <div className="custom-agenda-th th-hora">Hora</div>
                    <div className="custom-agenda-th th-evento">Evento</div>
                </div>
                <div className="custom-agenda-body">
                    {filteredEventos.length === 0 ? (
                        <div className="custom-agenda-empty">No hay eventos en este rango de fechas.</div>
                    ) : (
                        sortedEvents.map(event => {
                            const ev = event.resource;
                            const isCompleted = ev.estado === 'Completado';
                            const color = ev.color_hex || CATEGORIAS_CONFIG[ev.categoria_global]?.color || '#6B7280';

                            const dateStr = format(event.start as Date, "eee d 'de' MMM", { locale: es });
                            const showDate = dateStr !== lastDateStr ? dateStr : '';
                            lastDateStr = dateStr;

                            let horaStr = 'todo el día';
                            if (!ev.es_todo_el_dia && event.start && event.end) {
                                horaStr = `${format(event.start as Date, 'HH:mm')} - ${format(event.end as Date, 'HH:mm')}`;
                            }

                            const colorHex = color.toUpperCase();
                            const colorClassMap: Record<string, string> = {
                                '#F59E0B': 'orange',
                                '#3B82F6': 'blue',
                                '#10B981': 'green',
                                '#EC4899': 'pink',
                                '#8B5CF6': 'purple',
                                '#EF4444': 'red',
                                '#1E3A8A': 'darkblue',
                            };
                            const colorName = colorClassMap[colorHex] || 'gray';

                            return (
                                <div
                                    key={ev.uuid}
                                    onClick={() => handleSelectEvent(event)}
                                    className={`custom-agenda-row color-${colorName} ${isCompleted ? 'completado' : ''}`}
                                >
                                    <div className="custom-agenda-td td-fecha">{showDate}</div>
                                    <div className="custom-agenda-td td-hora">{horaStr}</div>
                                    <div className="custom-agenda-td td-evento">
                                        <div className="agenda-event-badge-content">
                                            <span className="agenda-event-dot" style={{ backgroundColor: color }} />
                                            <span className="agenda-event-title">{ev.titulo}</span>
                                            {ev.descripcion && (
                                                <span className="agenda-event-desc">— {ev.descripcion}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    return (
        <DnDCalendar
            localizer={localizer}
            events={filteredEventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="es"
            view={view}
            onView={(newView: View) => setView(newView)}
            onNavigate={handleNavigate}
            date={currentDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
            draggableAccessor={isDraggable}
            components={{
                event: EventoEnCelda as any,
                agenda: {
                    event: EventoEnAgenda as any
                }
            }}
            tooltipAccessor={(event: CalendarEventExtended) =>
                `${event.title}${event.resource.descripcion ? '\n' + event.resource.descripcion : ''}`
            }
            messages={{
                next: "Sig. >",
                previous: "< Ant.",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                allDay: "Todo el día",
                noEventsInRange: "No hay eventos en este rango de fechas.",
                showMore: (total: number) => `+ Ver más (${total})`
            }}
        />
    );
};
