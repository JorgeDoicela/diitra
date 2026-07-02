import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { Event as BigCalendarEvent, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, ArrowRight, Plus, Trash2, Edit2, CheckCircle, Info } from 'lucide-react';
import api from '../../api/axios_config';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarioPage.css';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes primer día de la semana
    getDay,
    locales,
});

interface Evento {
    id_evento_calendario: string;
    uuid: string;
    titulo: string;
    descripcion: string;
    categoria_global: string;
    subcategoria: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    es_todo_el_dia: boolean;
    color_hex: string | null;
    url_accion: string | null;
    es_privado: boolean;
    prioridad: string;
    estado: string;
    creado_por: number | null;
}

interface CalendarEventExtended extends BigCalendarEvent {
    resource: Evento;
}

export const CalendarioPage: React.FC = () => {
    const [eventos, setEventos] = useState<CalendarEventExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<View>('month');
    const [categoriasVisibles, setCategoriasVisibles] = useState<Record<string, boolean>>({
        'Normativo': true,
        'Convocatoria': true,
        'Proyecto': true,
        'Monitoreo': true,
        'PeerReview': true,
        'Personal': true,
    });

    const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
    const navigate = useNavigate();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUuid, setEditingUuid] = useState<string | null>(null);

    // Campos del formulario
    const [formTitulo, setFormTitulo] = useState('');
    const [formDescripcion, setFormDescripcion] = useState('');
    const [formTipo, setFormTipo] = useState('Personal');
    const [formFechaInicio, setFormFechaInicio] = useState('');
    const [formFechaFin, setFormFechaFin] = useState('');
    const [formEsTodoElDia, setFormEsTodoElDia] = useState(true);
    const [formColorHex, setFormColorHex] = useState('#3B82F6');
    const [formEsPrivado, setFormEsPrivado] = useState(true);
    const [formPrioridad, setFormPrioridad] = useState('Media');
    const [formEstado, setFormEstado] = useState('Pendiente');

    const [icalUrl, setIcalUrl] = useState<string>('');
    const [generatingToken, setGeneratingToken] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleNewEventClick = () => {
        setFormTitulo('');
        setFormDescripcion('');
        setFormTipo('Personal');
        setFormFechaInicio(format(new Date(), 'yyyy-MM-dd'));
        setFormFechaFin(format(new Date(), 'yyyy-MM-dd'));
        setFormEsTodoElDia(true);
        setFormColorHex('#3B82F6');
        setFormEsPrivado(true);
        setFormPrioridad('Media');
        setFormEstado('Pendiente');
        setIsEditing(false);
        setEditingUuid(null);
        setIsFormOpen(true);
    };

    const handleEditEventClick = (ev: Evento) => {
        setFormTitulo(ev.titulo);
        setFormDescripcion(ev.descripcion || '');
        setFormTipo(ev.subcategoria || 'Personal');
        setFormFechaInicio(ev.fecha_inicio);
        setFormFechaFin(ev.fecha_fin || ev.fecha_inicio);
        setFormEsTodoElDia(ev.es_todo_el_dia);
        setFormColorHex(ev.color_hex || '#3B82F6');
        setFormEsPrivado(ev.es_privado);
        setFormPrioridad(ev.prioridad || 'Media');
        setFormEstado(ev.estado || 'Pendiente');
        setEditingUuid(ev.uuid);
        setIsEditing(true);
        setIsFormOpen(true);
        setSelectedEvent(null);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitulo.trim()) return;

        // payload en snake_case
        const payload = {
            titulo: formTitulo,
            descripcion: formDescripcion,
            tipo_evento: formTipo,
            fecha_inicio: formFechaInicio,
            fecha_fin: formFechaFin || null,
            es_todo_el_dia: formEsTodoElDia,
            recurrencia_anual: false,
            recurrencia_hasta: null,
            roles_visibles: null,
            modulo_origen: 'PERSONAL',
            url_accion: null,
            color_hex: formColorHex,
            alerta_dias: null,
            activo: true,
            es_privado: formEsPrivado,
            prioridad: formPrioridad,
            estado: formEstado
        };

        try {
            setLoading(true);
            if (isEditing && editingUuid) {
                await api.put(`/calendario/usuario/eventos/${editingUuid}`, payload);
            } else {
                await api.post('/calendario/usuario/eventos', payload);
            }
            setIsFormOpen(false);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al guardar evento de usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (uuid: string) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este evento/tarea?')) return;
        try {
            setLoading(true);
            await api.delete(`/calendario/usuario/eventos/${uuid}`);
            setSelectedEvent(null);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al eliminar evento de usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickComplete = async (ev: Evento) => {
        // payload en snake_case
        const payload = {
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo_evento: ev.subcategoria,
            fecha_inicio: ev.fecha_inicio,
            fecha_fin: ev.fecha_fin,
            es_todo_el_dia: ev.es_todo_el_dia,
            recurrencia_anual: false,
            recurrencia_hasta: null,
            roles_visibles: null,
            modulo_origen: 'PERSONAL',
            url_accion: ev.url_accion,
            color_hex: ev.color_hex,
            alerta_dias: null,
            activo: true,
            es_privado: ev.es_privado,
            prioridad: ev.prioridad,
            estado: 'Completado'
        };

        try {
            setLoading(true);
            await api.put(`/calendario/usuario/eventos/${ev.uuid}`, payload);
            setSelectedEvent(null);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al completar evento de usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedUrl = localStorage.getItem('diitra_ical_url');
        if (savedUrl) {
            setIcalUrl(savedUrl);
        }
    }, []);

    const handleGenerarToken = async () => {
        try {
            setGeneratingToken(true);
            const response = await api.post('/calendario/ical/token');
            const feedUrl = response.data?.feed_url;
            if (feedUrl) {
                setIcalUrl(feedUrl);
                localStorage.setItem('diitra_ical_url', feedUrl);
            }
        } catch (error) {
            console.error('Error al generar enlace iCal:', error);
        } finally {
            setGeneratingToken(false);
        }
    };

    const fallbackCopyText = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback de copia fallido:', err);
        }
        document.body.removeChild(textArea);
    };

    const handleCopyIcal = () => {
        if (!icalUrl) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(icalUrl)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Error al usar clipboard API:', err);
                    fallbackCopyText(icalUrl);
                });
        } else {
            fallbackCopyText(icalUrl);
        }
    };

    const fetchEventos = async (date: Date) => {
        try {
            setLoading(true);
            // Rango amplio del mes actual
            const desde = new Date(date.getFullYear(), date.getMonth() - 1, 1);
            const hasta = new Date(date.getFullYear(), date.getMonth() + 2, 0);

            const formatLocal = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            const desdeStr = formatLocal(desde);
            const hastaStr = formatLocal(hasta);

            const response = await api.get('/calendario/eventos', {
                params: { desde: desdeStr, hasta: hastaStr }
            });

            const parsed: CalendarEventExtended[] = (response.data || []).map((ev: any) => {
                const [yI, mI, dI] = ev.fecha_inicio.split('-').map(Number);
                const start = new Date(yI, mI - 1, dI);
                let end = start;

                if (ev.fecha_fin) {
                    const [yF, mF, dF] = ev.fecha_fin.split('-').map(Number);
                    end = new Date(yF, mF - 1, dF);
                }

                return {
                    title: ev.titulo,
                    start,
                    end,
                    allDay: ev.es_todo_el_dia,
                    resource: {
                        id_evento_calendario: ev.id_evento_calendario,
                        uuid: ev.uuid,
                        titulo: ev.titulo,
                        descripcion: ev.descripcion,
                        categoria_global: ev.categoria_global,
                        subcategoria: ev.subcategoria,
                        fecha_inicio: ev.fecha_inicio,
                        fecha_fin: ev.fecha_fin,
                        es_todo_el_dia: ev.es_todo_el_dia,
                        color_hex: ev.color_hex,
                        url_accion: ev.url_accion,
                        es_privado: !!ev.es_privado,
                        prioridad: ev.prioridad || 'Media',
                        estado: ev.estado || 'Pendiente',
                        creado_por: ev.creado_por
                    },
                };
            });

            setEventos(parsed);
        } catch (error) {
            console.error('Error al cargar eventos del calendario:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventos(currentDate);
    }, [currentDate]);

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const handleSelectEvent = (event: CalendarEventExtended) => {
        setSelectedEvent(event.resource);
    };

    const handleGoToEventAction = (ev: Evento) => {
        setSelectedEvent(null);
        if (ev.url_accion) {
            if (ev.url_accion.startsWith('http://') || ev.url_accion.startsWith('https://')) {
                window.open(ev.url_accion, '_blank');
            } else {
                navigate(ev.url_accion);
            }
        } else if (ev.categoria_global === 'Proyecto' && ev.uuid) {
            navigate(`/proyectos/${ev.uuid}`);
        }
    };

    const eventStyleGetter = (event: CalendarEventExtended) => {
        const ev = event.resource;
        const isVisible = categoriasVisibles[ev.categoria_global] !== false;

        return {
            style: {
                backgroundColor: ev.color_hex || '#6B7280',
                borderRadius: '6px',
                opacity: isVisible ? 1 : 0.15,
                color: '#ffffff',
                border: '0px',
                display: 'block',
                fontSize: '12px',
                padding: '2px 6px',
                fontWeight: '500',
                transition: 'opacity 0.2s',
            }
        };
    };

    const toggleCategoria = (cat: string) => {
        setCategoriasVisibles(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    const filteredEventos = eventos.filter(ev =>
        categoriasVisibles[ev.resource.categoria_global] !== false
    );

    return (
        <div className="calendario-page-container">
            <div className="calendario-sidebar">
                <button
                    onClick={handleNewEventClick}
                    className="w-full py-3 bg-fg text-bg border border-fg hover:bg-accents-7 hover:border-accents-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mb-2 shadow-sm"
                >
                    <Plus size={14} />
                    Añadir Tarea / Evento
                </button>

                <div className="sidebar-section">
                    <h3>Filtros de Agenda</h3>
                    <div className="filtros-lista">
                        <label className="filtro-item" style={{ '--color': '#1E3A8A' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['Normativo']}
                                onChange={() => toggleCategoria('Normativo')}
                            />
                            <span className="color-dot"></span>
                            <span>CACES / Normativa</span>
                        </label>

                        <label className="filtro-item" style={{ '--color': '#3B82F6' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['Convocatoria']}
                                onChange={() => toggleCategoria('Convocatoria')}
                            />
                            <span className="color-dot"></span>
                            <span>Convocatorias</span>
                        </label>

                        <label className="filtro-item" style={{ '--color': '#10B981' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['Proyecto']}
                                onChange={() => toggleCategoria('Proyecto')}
                            />
                            <span className="color-dot"></span>
                            <span>Proyectos</span>
                        </label>

                        <label className="filtro-item" style={{ '--color': '#8B5CF6' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['Monitoreo']}
                                onChange={() => toggleCategoria('Monitoreo')}
                            />
                            <span className="color-dot"></span>
                            <span>Monitoreo (Informes)</span>
                        </label>

                        <label className="filtro-item" style={{ '--color': '#EC4899' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['PeerReview']}
                                onChange={() => toggleCategoria('PeerReview')}
                            />
                            <span className="color-dot"></span>
                            <span>Evaluaciones</span>
                        </label>

                        <label className="filtro-item" style={{ '--color': '#F59E0B' } as React.CSSProperties}>
                            <input
                                type="checkbox"
                                checked={categoriasVisibles['Personal']}
                                onChange={() => toggleCategoria('Personal')}
                            />
                            <span className="color-dot"></span>
                            <span>Mis Tareas / Agenda</span>
                        </label>
                    </div>
                </div>

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
                            {generatingToken ? 'Generando...' : 'Obtener Enlace iCal'}
                        </button>
                    )}
                </div>

            </div>

            <div className="calendario-main">
                {loading && <div className="calendario-loading-bar">Actualizando eventos...</div>}
                <Calendar
                    localizer={localizer}
                    events={filteredEventos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture="es"
                    view={view}
                    onView={(newView) => setView(newView)}
                    onNavigate={handleNavigate}
                    date={currentDate}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
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
                        noEventsInRange: "No hay eventos en este rango de fechas."
                    }}
                />
            </div>

            {/* Detail Drawer deslizable derecho */}
            {selectedEvent && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setSelectedEvent(null)}
                    />

                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span 
                                    className="px-2.5 py-1 text-[10px] font-mono uppercase rounded-md border text-white font-bold"
                                    style={{ backgroundColor: selectedEvent.color_hex || '#6B7280', borderColor: selectedEvent.color_hex || '#6B7280' }}
                                >
                                    {selectedEvent.categoria_global === 'Personal' ? 'Mi Tarea' : selectedEvent.categoria_global}
                                </span>
                                {selectedEvent.subcategoria && selectedEvent.categoria_global !== 'Personal' && (
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                                        • {selectedEvent.subcategoria}
                                    </div>
                                )}
                                {selectedEvent.es_privado && (
                                    <span className="px-2 py-0.5 bg-bg-deep text-text-dim border border-border-thin text-[9px] font-bold uppercase rounded">
                                        Privado
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedEvent.titulo}
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    {selectedEvent.descripcion || 'Sin descripción detallada.'}
                                </p>
                            </div>

                            {/* Bento Grid para Organización Profesional de Tareas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <CalendarIcon size={12} /> Fecha de Inicio
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-mono">
                                        {selectedEvent.fecha_inicio}
                                    </div>
                                </div>
                                {selectedEvent.fecha_fin && selectedEvent.fecha_fin !== selectedEvent.fecha_inicio ? (
                                    <div className="bento-card static p-5 space-y-1.5">
                                        <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
                                            <CalendarIcon size={12} /> Fecha de Finalización
                                        </div>
                                        <div className="text-sm font-bold text-error font-mono">
                                            {selectedEvent.fecha_fin}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bento-card static p-5 space-y-1.5">
                                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            <Info size={12} /> Duración
                                        </div>
                                        <div className="text-sm font-bold text-text-main">
                                            Todo el día
                                        </div>
                                    </div>
                                )}

                                {/* Datos organizativos del evento personal */}
                                {selectedEvent.categoria_global === 'Personal' && (
                                    <>
                                        <div className="bento-card static p-5 space-y-1.5">
                                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                                Prioridad
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                                                    selectedEvent.prioridad === 'Alta' ? 'bg-error-subtle text-error' :
                                                    selectedEvent.prioridad === 'Baja' ? 'bg-success-subtle text-success' :
                                                    'bg-warning-subtle text-warning'
                                                }`}>
                                                    {selectedEvent.prioridad}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bento-card static p-5 space-y-1.5">
                                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                                Estado
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                                                    selectedEvent.estado === 'Completado' ? 'bg-success-subtle text-success' :
                                                    selectedEvent.estado === 'EnProgreso' ? 'bg-info-subtle text-info' :
                                                    selectedEvent.estado === 'Cancelado' ? 'bg-bg-deep text-text-dim' :
                                                    'bg-warning-subtle text-warning'
                                                }`}>
                                                    {selectedEvent.estado === 'EnProgreso' ? 'En Progreso' : selectedEvent.estado}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Botones de acción del Drawer */}
                        <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex flex-col gap-3">
                            {selectedEvent.categoria_global === 'Personal' ? (
                                <div className="flex gap-3 w-full">
                                    {selectedEvent.estado !== 'Completado' && (
                                        <button
                                            onClick={() => handleQuickComplete(selectedEvent)}
                                            className="flex-1 py-3 bg-success text-white hover:bg-success/90 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={15} />
                                            Completar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditEventClick(selectedEvent)}
                                        className="flex-1 py-3 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={15} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(selectedEvent.uuid)}
                                        className="py-3 px-4 bg-error-subtle text-error hover:bg-error hover:text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                                        title="Eliminar tarea"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(selectedEvent.url_accion || (selectedEvent.categoria_global === 'Proyecto' && selectedEvent.uuid)) ? (
                                        <button
                                            onClick={() => handleGoToEventAction(selectedEvent)}
                                            className="w-full py-3.5 bg-fg text-bg border border-fg hover:bg-accents-7 hover:border-accents-7 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            Ver Detalle / Acción
                                            <ArrowRight size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="w-full py-3.5 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all"
                                        >
                                            Cerrar Panel
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Form Drawer (Crear / Editar Tareas y Eventos de Usuario) */}
            {isFormOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => setIsFormOpen(false)}
                    />

                    <form
                        onSubmit={handleSaveEvent}
                        className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right"
                    >
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <h2 className="text-xl font-bold tracking-tight text-text-main font-sans">
                                {isEditing ? 'Editar Tarea o Evento' : 'Nueva Tarea / Evento de Agenda'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-surface">
                            {/* Título */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Título de la Tarea/Evento *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Reunión de Avance del Proyecto"
                                    value={formTitulo}
                                    onChange={(e) => setFormTitulo(e.target.value)}
                                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Descripción o Detalles</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ingresa notas o detalles sobre el evento..."
                                    value={formDescripcion}
                                    onChange={(e) => setFormDescripcion(e.target.value)}
                                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Tipo de Evento */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Categoría / Tipo</label>
                                    <select
                                        value={formTipo}
                                        onChange={(e) => setFormTipo(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    >
                                        <option value="Personal">Personal / Nota</option>
                                        <option value="Tarea">Tarea de Investigación</option>
                                        <option value="Reunion">Reunión / Tutoría</option>
                                        <option value="Hito">Hito de Proyecto</option>
                                    </select>
                                </div>

                                {/* Color Hex */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Etiqueta Visual (Color)</label>
                                    <select
                                        value={formColorHex}
                                        onChange={(e) => setFormColorHex(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    >
                                        <option value="#F59E0B">Naranja (Predeterminado)</option>
                                        <option value="#3B82F6">Azul (Reuniones)</option>
                                        <option value="#10B981">Verde (Hitos)</option>
                                        <option value="#EC4899">Rosado (Revisiones)</option>
                                        <option value="#8B5CF6">Morado (Monitoreo)</option>
                                        <option value="#EF4444">Rojo (Urgente)</option>
                                    </select>
                                </div>

                                {/* Fecha Inicio */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Fecha de Inicio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formFechaInicio}
                                        onChange={(e) => setFormFechaInicio(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    />
                                </div>

                                {/* Fecha Fin */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Fecha de Fin</label>
                                    <input
                                        type="date"
                                        value={formFechaFin}
                                        onChange={(e) => setFormFechaFin(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    />
                                </div>

                                {/* Prioridad */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Prioridad</label>
                                    <select
                                        value={formPrioridad}
                                        onChange={(e) => setFormPrioridad(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>

                                {/* Estado */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider">Estado inicial</label>
                                    <select
                                        value={formEstado}
                                        onChange={(e) => setFormEstado(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:border-brand focus:outline-none"
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="EnProgreso">En Progreso</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Es Privado Checkbox */}
                            <div className="flex items-center gap-3 p-4 bg-bg border border-border rounded-xl mt-4">
                                <input
                                    type="checkbox"
                                    id="es_privado"
                                    checked={formEsPrivado}
                                    onChange={(e) => setFormEsPrivado(e.target.checked)}
                                    className="w-5 h-5 border border-border rounded accent-brand cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <label htmlFor="es_privado" className="text-sm font-bold text-text-main cursor-pointer select-none">
                                        Evento Privado / Personal
                                    </label>
                                    <span className="text-[11px] text-text-dim leading-snug">
                                        Si está marcado, solo tú podrás ver este evento. Desmárcalo para compartirlo.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="flex-1 py-3 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-fg text-bg border border-fg hover:bg-accents-7 hover:border-accents-7 rounded-lg text-sm font-bold transition-all"
                            >
                                {isEditing ? 'Actualizar Evento' : 'Guardar Evento'}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
};
