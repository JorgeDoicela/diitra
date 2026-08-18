import React, { useState, useEffect, useCallback } from 'react';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, startOfWeek, addDays, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../api/AuthContext';
import { useConfirm } from '../../../api/ConfirmContext';
import {
    getEventos,
    createEvento,
    updateEvento,
    deleteEvento,
    buildPayload,
    resolveEventUrl,
    CATEGORIAS_CONFIG,
} from '../../../services/calendarioService';
import type { CalendarEventExtended, Evento } from '../types/calendarioTypes';

export const useCalendarioEvents = (fetchStickyNotesRefetch?: () => void) => {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [eventos, setEventos] = useState<CalendarEventExtended[]>([]);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [view, setView] = useState<View>('month');

    // Filtros de Categorías
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
    const confirm = useConfirm();

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUuid, setEditingUuid] = useState<string | null>(null);

    const [formTitulo, setFormTitulo] = useState('');
    const [formDescripcion, setFormDescripcion] = useState('');
    const [formTipo, setFormTipo] = useState('Personal');
    const [formFechaInicio, setFormFechaInicio] = useState('');
    const [formFechaFin, setFormFechaFin] = useState('');
    const [formEsTodoElDia, setFormEsTodoElDia] = useState(true);
    const [formColorHex, setFormColorHex] = useState('#F59E0B');
    const [formEsPrivado, setFormEsPrivado] = useState(true);
    const [formPrioridad, setFormPrioridad] = useState('Media');
    const [formEstado, setFormEstado] = useState('Pendiente');
    const [formAlertaDias, setFormAlertaDias] = useState<number | ''>('');
    const [formRecurrenciaAnual, setFormRecurrenciaAnual] = useState(false);

    const resetForm = () => {
        setFormTitulo('');
        setFormDescripcion('');
        setFormTipo('Personal');
        setFormFechaInicio(format(new Date(), 'yyyy-MM-dd'));
        setFormFechaFin(format(new Date(), 'yyyy-MM-dd'));
        setFormEsTodoElDia(true);
        setFormColorHex('#F59E0B');
        setFormEsPrivado(true);
        setFormPrioridad('Media');
        setFormEstado('Pendiente');
        setFormAlertaDias('');
        setFormRecurrenciaAnual(false);
        setIsEditing(false);
        setEditingUuid(null);
    };

    const handleNewEventClick = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        resetForm();
        const inicio = format(slotInfo.start, 'yyyy-MM-dd');
        const fin = format(slotInfo.end instanceof Date ? addDays(slotInfo.end, -1) : slotInfo.start, 'yyyy-MM-dd');
        setFormFechaInicio(inicio);
        setFormFechaFin(fin < inicio ? inicio : fin);
        setIsFormOpen(true);
    }, []);

    const handleEditEventClick = (ev: Evento) => {
        setFormTitulo(ev.titulo);
        setFormDescripcion(ev.descripcion || '');
        setFormTipo(ev.subcategoria || 'Personal');
        setFormFechaInicio(ev.fecha_inicio || '');
        setFormFechaFin(ev.fecha_fin || ev.fecha_inicio || '');
        setFormEsTodoElDia(ev.es_todo_el_dia);
        setFormColorHex(ev.color_hex || '#F59E0B');
        setFormEsPrivado(ev.es_privado);
        setFormPrioridad(ev.prioridad || 'Media');
        setFormEstado(ev.estado || 'Pendiente');
        setFormAlertaDias(ev.alerta_dias ?? '');
        setFormRecurrenciaAnual(ev.recurrencia_anual ?? false);
        setEditingUuid(ev.uuid);
        setIsEditing(true);
        setIsFormOpen(true);
        setSelectedEvent(null);
    };

    const getFormPayload = () => buildPayload({
        titulo: formTitulo,
        descripcion: formDescripcion,
        tipo: formTipo,
        fechaInicio: formFechaInicio,
        fechaFin: formFechaFin,
        esTodoElDia: formEsTodoElDia,
        colorHex: formColorHex,
        esPrivado: formEsPrivado,
        prioridad: formPrioridad,
        estado: formEstado,
        alertaDias: formAlertaDias,
        recurrenciaAnual: formRecurrenciaAnual,
    });

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitulo.trim()) return;
        try {
            setLoading(true);
            if (isEditing && editingUuid) {
                await updateEvento(editingUuid, getFormPayload());
            } else {
                await createEvento(getFormPayload());
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
        const ok = await confirm({
            title: 'Eliminar Evento',
            message: '¿Está seguro de que desea eliminar este evento/tarea?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'destructive'
        });
        if (!ok) return;

        try {
            setLoading(true);
            await deleteEvento(uuid);
            setSelectedEvent(null);
            fetchEventos(currentDate);
            if (fetchStickyNotesRefetch) fetchStickyNotesRefetch();
        } catch (error) {
            console.error('Error al eliminar evento de usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickComplete = async (ev: Evento) => {
        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo: ev.subcategoria,
            fechaInicio: ev.fecha_inicio,
            fechaFin: ev.fecha_fin || '',
            esTodoElDia: ev.es_todo_el_dia,
            colorHex: ev.color_hex || '#F59E0B',
            esPrivado: ev.es_privado,
            prioridad: ev.prioridad,
            estado: 'Completado',
            alertaDias: ev.alerta_dias ?? '',
            recurrenciaAnual: ev.recurrencia_anual ?? false,
            urlAccion: ev.url_accion,
        });
        try {
            setLoading(true);
            await updateEvento(ev.uuid, payload);
            setSelectedEvent(null);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al completar evento de usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
        const ev: Evento = event.resource;
        if (ev.categoria_global !== 'Personal') return;

        const nuevaInicio = format(start as Date, 'yyyy-MM-dd');
        const nuevaFin = format(end as Date, 'yyyy-MM-dd');

        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo: ev.subcategoria,
            fechaInicio: nuevaInicio,
            fechaFin: nuevaFin,
            esTodoElDia: ev.es_todo_el_dia,
            colorHex: ev.color_hex || '#F59E0B',
            esPrivado: ev.es_privado,
            prioridad: ev.prioridad,
            estado: ev.estado,
            alertaDias: ev.alerta_dias ?? '',
            recurrenciaAnual: ev.recurrencia_anual ?? false,
            urlAccion: ev.url_accion,
        });

        try {
            await updateEvento(ev.uuid, payload);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al mover evento:', error);
        }
    }, [currentDate]);

    const handleEventResize = useCallback(async ({ event, start, end }: any) => {
        const ev: Evento = event.resource;
        if (ev.categoria_global !== 'Personal') return;

        const nuevaInicio = format(start as Date, 'yyyy-MM-dd');
        const nuevaFin = format(end as Date, 'yyyy-MM-dd');

        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo: ev.subcategoria,
            fechaInicio: nuevaInicio,
            fechaFin: nuevaFin,
            esTodoElDia: ev.es_todo_el_dia,
            colorHex: ev.color_hex || '#F59E0B',
            esPrivado: ev.es_privado,
            prioridad: ev.prioridad,
            estado: ev.estado,
            alertaDias: ev.alerta_dias ?? '',
            recurrenciaAnual: ev.recurrencia_anual ?? false,
            urlAccion: ev.url_accion,
        });
        try {
            await updateEvento(ev.uuid, payload);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al redimensionar evento:', error);
        }
    }, [currentDate]);

    const fetchEventos = useCallback(async (date: Date) => {
        try {
            setLoading(true);
            const raw = await getEventos(date);
            const parsed: CalendarEventExtended[] = raw
                .filter(ev => Boolean(ev.fecha_inicio || (ev as any).fechaInicio))
                .map((ev) => {
                    const fInicio = (ev.fecha_inicio || (ev as any).fechaInicio) as string;
                    const fFin = (ev.fecha_fin || (ev as any).fechaFin) as string | null;
                    const [yI, mI, dI] = fInicio.split('-').map(Number);
                    const start = new Date(yI, mI - 1, dI);
                    let end = start;
                    if (fFin) {
                        const [yF, mF, dF] = fFin.split('-').map(Number);
                        end = new Date(yF, mF - 1, dF);
                    }
                    const normalizedResource: Evento = {
                        ...ev,
                        categoria_global: ev.categoria_global || (ev as any).categoriaGlobal || 'Personal',
                        subcategoria: ev.subcategoria || (ev as any).subcategoria || 'General',
                        fecha_inicio: fInicio,
                        fecha_fin: fFin,
                        es_todo_el_dia: ev.es_todo_el_dia ?? (ev as any).esTodoElDia ?? true,
                        color_hex: ev.color_hex || (ev as any).colorHex || null,
                        url_accion: ev.url_accion || (ev as any).urlAccion || null,
                    };
                    return {
                        title: ev.titulo,
                        start,
                        end,
                        allDay: normalizedResource.es_todo_el_dia,
                        resource: normalizedResource
                    };
                });
            setEventos(parsed);
        } catch (error) {
            console.error('Error al cargar eventos del calendario:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEventos(currentDate);
    }, [currentDate, fetchEventos]);

    const handleNavigate = (newDate: Date) => setCurrentDate(newDate);
    const handleSelectEvent = (event: CalendarEventExtended) => setSelectedEvent(event.resource);

    const handleGoToEventAction = (ev: Evento) => {
        setSelectedEvent(null);
        const targetUrl = resolveEventUrl(ev, isAdmin);
        if (targetUrl) {
            if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                window.open(targetUrl, '_blank');
            } else {
                navigate(targetUrl);
            }
        }
    };

    const eventStyleGetter = (event: CalendarEventExtended) => {
        const ev = event.resource;
        const isCompleted = ev.estado === 'Completado';
        const color = ev.color_hex || CATEGORIAS_CONFIG[ev.categoria_global]?.color || '#6B7280';
        return {
            style: {
                backgroundColor: isCompleted ? 'transparent' : color,
                borderRadius: '6px',
                opacity: categoriasVisibles[ev.categoria_global] !== false ? 1 : 0.15,
                color: isCompleted ? color : '#ffffff',
                border: isCompleted ? `1.5px solid ${color}` : '0px',
                display: 'block',
                fontSize: '11.5px',
                padding: '2px 6px',
                fontWeight: '500',
                transition: 'opacity 0.2s',
                textDecoration: isCompleted ? 'line-through' : 'none',
            }
        };
    };

    const toggleCategoria = (cat: string) => {
        setCategoriasVisibles(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const filteredEventos = eventos.filter(ev =>
        categoriasVisibles[ev.resource.categoria_global] !== false
    );

    const hoy = startOfDay(new Date());
    const proximosEventos = [...eventos]
        .filter(ev => isAfter(ev.start as Date, hoy) || format(ev.start as Date, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd'))
        .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime())
        .slice(0, 7);

    const isDraggable = (event: object) => {
        return (event as CalendarEventExtended).resource?.categoria_global === 'Personal';
    };

    const handleNavigateClick = (action: 'PREV' | 'NEXT' | 'TODAY') => {
        let newDate = new Date(currentDate);
        if (action === 'TODAY') {
            newDate = new Date();
        } else {
            const multiplier = action === 'PREV' ? -1 : 1;
            if (view === 'month') {
                newDate.setMonth(newDate.getMonth() + multiplier);
            } else if (view === 'week') {
                newDate.setDate(newDate.getDate() + (7 * multiplier));
            } else if (view === 'day') {
                newDate.setDate(newDate.getDate() + multiplier);
            } else if (view === 'agenda') {
                newDate.setMonth(newDate.getMonth() + multiplier);
            }
        }
        setCurrentDate(newDate);
    };

    const getLabelFecha = () => {
        if (view === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase());
        }
        if (view === 'day') {
            return format(currentDate, "d 'de' MMMM", { locale: es });
        }
        if (view === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = addDays(start, 6);
            return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
        }
        return format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase());
    };

    return {
        loading,
        setLoading,
        eventos,
        setEventos,
        currentDate,
        setCurrentDate,
        view,
        setView,
        categoriasVisibles,
        toggleCategoria,
        filteredEventos,
        proximosEventos,
        selectedEvent,
        setSelectedEvent,
        isFormOpen,
        setIsFormOpen,
        isEditing,
        editingUuid,
        formTitulo,
        setFormTitulo,
        formDescripcion,
        setFormDescripcion,
        formTipo,
        setFormTipo,
        formFechaInicio,
        setFormFechaInicio,
        formFechaFin,
        setFormFechaFin,
        formEsTodoElDia,
        setFormEsTodoElDia,
        formColorHex,
        setFormColorHex,
        formEsPrivado,
        setFormEsPrivado,
        formPrioridad,
        setFormPrioridad,
        formEstado,
        setFormEstado,
        formAlertaDias,
        setFormAlertaDias,
        formRecurrenciaAnual,
        setFormRecurrenciaAnual,
        resetForm,
        handleNewEventClick,
        handleSelectSlot,
        handleEditEventClick,
        handleSaveEvent,
        handleDeleteEvent,
        handleQuickComplete,
        handleEventDrop,
        handleEventResize,
        fetchEventos,
        handleNavigate,
        handleSelectEvent,
        handleGoToEventAction,
        eventStyleGetter,
        isDraggable,
        handleNavigateClick,
        getLabelFecha,
    };
};
