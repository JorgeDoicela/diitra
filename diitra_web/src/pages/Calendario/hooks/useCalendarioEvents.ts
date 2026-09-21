import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, startOfWeek, addDays, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../api/AuthContext';
import { useConfirm } from '../../../api/ConfirmContext';
import {
    getEventos,
    createEvento,
    createNormativo,
    updateEvento,
    updateNormativo,
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
    const [formEsNormativo, setFormEsNormativo] = useState(false);
    const [formRolesVisibles, setFormRolesVisibles] = useState<string>('');

    const fetchEventos = useCallback(async (date: Date) => {
        try {
            setLoading(true);
            const raw = await getEventos(date);
            const parsed: CalendarEventExtended[] = raw
                .map((ev) => {
                    const fInicio = (ev.fecha_inicio || (ev as any).fechaInicio) as string | null;
                    const fFin = (ev.fecha_fin || (ev as any).fechaFin) as string | null;
                    let start: Date;
                    let end: Date;
                    if (fInicio) {
                        const [yI, mI, dI] = fInicio.split('-').map(Number);
                        start = new Date(yI, mI - 1, dI, 0, 0, 0);
                        end = start;
                        if (fFin && fFin !== fInicio) {
                            const [yF, mF, dF] = fFin.split('-').map(Number);
                            end = new Date(yF, mF - 1, dF, 0, 0, 0);
                        }
                    } else {
                        // Fecha centinela para tareas sin fecha (usadas en Kanban)
                        start = new Date(0);
                        end = new Date(0);
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
        setFormEsNormativo(false);
        setFormRolesVisibles('');
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
        const isNorm = ev.categoria_global === 'Normativo' || ev.tipo_entidad_origen === 'CALENDARIO_NORMATIVO';
        setFormTitulo(ev.titulo);
        setFormDescripcion(ev.descripcion || '');
        setFormTipo(ev.subcategoria || (isNorm ? 'Normativo' : 'Personal'));
        setFormFechaInicio(ev.fecha_inicio || '');
        setFormFechaFin(ev.fecha_fin || ev.fecha_inicio || '');
        setFormEsTodoElDia(ev.es_todo_el_dia);
        setFormColorHex(ev.color_hex || (isNorm ? '#1E3A8A' : '#F59E0B'));
        setFormEsPrivado(isNorm ? false : ev.es_privado);
        setFormPrioridad(ev.prioridad || 'Media');
        setFormEstado(ev.estado || 'Pendiente');
        setFormAlertaDias(ev.alerta_dias ?? '');
        setFormRecurrenciaAnual(ev.recurrencia_anual ?? false);
        setFormEsNormativo(isNorm);
        setFormRolesVisibles(ev.roles_visibles || '');
        setEditingUuid(ev.uuid);
        setIsEditing(true);
        setIsFormOpen(true);
        setSelectedEvent(null);
    };

    const handlePlanNoteInCalendar = useCallback((note: Evento, fechaStr: string) => {
        setFormTitulo(note.titulo);
        setFormDescripcion(note.descripcion || note.nota_detalle || '');
        setFormTipo(note.subcategoria || 'Personal');
        setFormFechaInicio(fechaStr);
        setFormFechaFin(fechaStr);
        setFormEsTodoElDia(note.es_todo_el_dia ?? true);
        setFormColorHex(note.color_hex || '#F59E0B');
        setFormEsPrivado(note.es_privado ?? true);
        setFormPrioridad(note.prioridad || 'Media');
        setFormEstado('Pendiente');
        setFormAlertaDias(note.alerta_dias ?? '');
        setFormRecurrenciaAnual(note.recurrencia_anual ?? false);
        setFormEsNormativo(false);
        setFormRolesVisibles('');
        setEditingUuid(note.uuid);
        setIsEditing(true);
        setIsFormOpen(true);
        setSelectedEvent(null);
    }, []);

    const getFormPayload = () => buildPayload({
        titulo: formTitulo,
        descripcion: formDescripcion,
        tipo: formTipo,
        fechaInicio: formFechaInicio,
        fechaFin: formFechaFin,
        esTodoElDia: formEsTodoElDia,
        colorHex: formColorHex,
        esPrivado: formEsNormativo ? false : formEsPrivado,
        prioridad: formPrioridad,
        estado: formEstado,
        alertaDias: formAlertaDias,
        recurrenciaAnual: formRecurrenciaAnual,
        rolesVisibles: formRolesVisibles,
    });

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitulo.trim()) return;
        try {
            setLoading(true);
            if (isAdmin && formEsNormativo) {
                if (isEditing && editingUuid) {
                    await updateNormativo(editingUuid, getFormPayload());
                } else {
                    await createNormativo(getFormPayload());
                }
            } else {
                if (isEditing && editingUuid) {
                    await updateEvento(editingUuid, getFormPayload());
                } else {
                    await createEvento(getFormPayload());
                }
            }
            setIsFormOpen(false);
            fetchEventos(currentDate);
        } catch (error) {
            console.error('Error al guardar evento:', error);
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

    const handleEventDrop = useCallback(async ({ event, start }: any) => {
        const ev: Evento = event.resource;
        const isPersonal = 
            ev.categoria_global === 'Personal' ||
            ev.subcategoria === 'Personal' ||
            ev.estado === 'Inbox' ||
            ev.estado === 'inbox' ||
            (!ev.id_entidad_origen && !ev.tipo_entidad_origen) ||
            ev.tipo_entidad_origen === 'CALENDARIO_NORMATIVO';

        if (!isPersonal) return;

        const startObj = start as Date;
        const nuevaInicio = format(startObj, 'yyyy-MM-dd');

        // Para eventos de 1 día, fin = inicio
        const duracionOriginal = (ev.fecha_inicio && ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio)
            ? Math.max(1, Math.round((new Date(ev.fecha_fin + 'T00:00:00').getTime() - new Date(ev.fecha_inicio + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1)
            : 1;

        let nuevaFin: string;
        let endObj: Date;
        if (duracionOriginal <= 1) {
            nuevaFin = nuevaInicio;
            endObj = startObj;
        } else {
            const fFinDate = new Date(startObj);
            fFinDate.setDate(fFinDate.getDate() + duracionOriginal - 1);
            nuevaFin = format(fFinDate, 'yyyy-MM-dd');
            endObj = fFinDate;
        }

        // Actualización optimista inmediata: mueve el evento en pantalla de inmediato sin duplicar
        const updatedResource: Evento = {
            ...ev,
            fecha_inicio: nuevaInicio,
            fecha_fin: nuevaFin,
        };

        setEventos(prev => prev.map(item => {
            if (item.resource.uuid === ev.uuid) {
                return {
                    ...item,
                    start: startObj,
                    end: endObj,
                    resource: updatedResource,
                };
            }
            return item;
        }));

        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo: ev.subcategoria || 'Personal',
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
            fetchEventos(currentDate);
        }
    }, [currentDate, fetchEventos, setEventos]);

    const handleEventResize = useCallback(async ({ event, start, end }: any) => {
        const ev: Evento = event.resource;
        const isPersonal = 
            ev.categoria_global === 'Personal' ||
            ev.subcategoria === 'Personal' ||
            ev.estado === 'Inbox' ||
            ev.estado === 'inbox' ||
            (!ev.id_entidad_origen && !ev.tipo_entidad_origen) ||
            ev.tipo_entidad_origen === 'CALENDARIO_NORMATIVO';

        if (!isPersonal) return;

        const startObj = start as Date;
        let endObj = end as Date;

        const origEnd = event.end instanceof Date ? event.end : new Date(event.end);
        // Si RBC modificó la fecha de fin (tirador derecho), RBC envía la fecha exclusiva (+1 día a medianoche).
        // Si se estiró desde la izquierda, endObj se mantiene igual a origEnd y no debe restarse 1 día.
        const isRightResize = endObj.getTime() !== origEnd.getTime();

        if (isRightResize && endObj.getHours() === 0 && endObj.getMinutes() === 0 && endObj.getSeconds() === 0) {
            const prevDay = addDays(endObj, -1);
            if (prevDay >= startObj) {
                endObj = prevDay;
            }
        }

        // Si la fecha de inicio supera la de fin tras el movimiento, normalizar
        if (startObj > endObj) {
            endObj = startObj;
        }

        const nuevaInicio = format(startObj, 'yyyy-MM-dd');
        const nuevaFin = format(endObj, 'yyyy-MM-dd');

        // Actualización optimista inmediata en UI
        const updatedResource: Evento = {
            ...ev,
            fecha_inicio: nuevaInicio,
            fecha_fin: nuevaFin,
        };

        setEventos(prev => prev.map(item => {
            if (item.resource.uuid === ev.uuid) {
                return {
                    ...item,
                    start: startObj,
                    end: endObj,
                    resource: updatedResource,
                };
            }
            return item;
        }));

        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo: ev.subcategoria || 'Personal',
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
            fetchEventos(currentDate);
        }
    }, [currentDate, fetchEventos, setEventos]);

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

    const eventCountsByDate = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const ev of eventos) {
            const dateStr = ev.resource?.fecha_inicio;
            if (dateStr) {
                counts[dateStr] = (counts[dateStr] || 0) + 1;
            }
        }
        return counts;
    }, [eventos]);

    const eventStyleGetter = (event: CalendarEventExtended) => {
        const ev = event.resource;
        const isCompleted = ev.estado === 'Completado';
        const color = ev.color_hex || CATEGORIAS_CONFIG[ev.categoria_global]?.color || '#6B7280';
        const dateStr = ev.fecha_inicio;
        const countOnDay = (dateStr && eventCountsByDate[dateStr]) || 1;
        const isSpacious = countOnDay <= 2;

        return {
            className: isSpacious ? 'rbc-event-spacious' : 'rbc-event-compact',
            style: {
                backgroundColor: isCompleted ? 'transparent' : color,
                borderRadius: isSpacious ? '8px' : '6px',
                opacity: categoriasVisibles[ev.categoria_global] !== false ? 1 : 0.15,
                color: isCompleted ? color : '#ffffff',
                border: isCompleted ? `1.5px solid ${color}` : '0px',
                display: 'block',
                fontSize: isSpacious ? '12.5px' : '11.5px',
                padding: isSpacious ? '6px 10px' : '2.5px 7px',
                minHeight: isSpacious ? '32px' : '22px',
                fontWeight: isSpacious ? '600' : '500',
                transition: 'all 0.15s ease',
                textDecoration: isCompleted ? 'line-through' : 'none',
                boxShadow: isSpacious ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
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
        .filter(ev => ev.resource.fecha_inicio && (isAfter(ev.start as Date, hoy) || format(ev.start as Date, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd')))
        .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime())
        .slice(0, 7);

    const isDraggable = (event: object) => {
        const ev = (event as CalendarEventExtended).resource;
        if (!ev) return false;
        return (
            ev.categoria_global === 'Personal' ||
            ev.subcategoria === 'Personal' ||
            ev.estado === 'Inbox' ||
            ev.estado === 'inbox' ||
            (!ev.id_entidad_origen && !ev.tipo_entidad_origen) ||
            ev.tipo_entidad_origen === 'CALENDARIO_NORMATIVO'
        );
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
        formEsNormativo,
        setFormEsNormativo,
        formRolesVisibles,
        setFormRolesVisibles,
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
        handlePlanNoteInCalendar,
    };
};
