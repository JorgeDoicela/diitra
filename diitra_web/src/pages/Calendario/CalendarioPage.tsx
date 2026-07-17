import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import _withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import type { Event as BigCalendarEvent, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../api/ConfirmContext';
import {
    X, Calendar as CalendarIcon, ArrowRight, Plus, Trash2, Edit2,
    CheckCircle, Info, Bell, RotateCcw, Clock, ChevronRight, Layers, FileText, Search,
    Folder, BarChart3, BookOpen, TrendingUp
} from 'lucide-react';
import {
    type EventoCalendario,
    getEventos, getStickyNotes, createEvento, updateEvento, deleteEvento, getIcalToken,
    devolverAInbox, reordenarBandeja,
    buildPayload, CATEGORIAS_CONFIG, PRIORIDAD_COLORS, ESTADO_LABELS, COLORES_OPCIONES,
    getContextDescription,
} from '../../services/calendarioService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarioPage.css';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// Resolver problemas de interoperabilidad CommonJS/ESM en Vite
const withDragAndDrop = (typeof _withDragAndDrop === 'function'
    ? _withDragAndDrop
    : (_withDragAndDrop as any).default) as any;

// Calendario con drag & drop
const DnDCalendar = withDragAndDrop(Calendar as any);

// Alias local para compatibilidad con el resto del componente
type Evento = EventoCalendario;

interface CalendarEventExtended extends BigCalendarEvent {
    resource: Evento;
}

// ─── Componente personalizado para el evento en la celda ──────────
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

    // Mapeo para nombres de clases de color
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

    // Crear un color de fondo translúcido (8% de opacidad)
    const badgeBg = `${color}14`; // 14 en hexadecimal es aprox 8% de opacidad
    const badgeBorder = `${color}30`; // 30 en hexadecimal es aprox 18% de opacidad

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

export const CalendarioPage: React.FC = () => {
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

    const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'inbox'>('calendar');
    const [draggingUuid, setDraggingUuid] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Estados para la búsqueda y filtros rápidos en la bandeja de notas (Inbox)
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilterContext, setSelectedFilterContext] = useState<string | null>(null);
    const [selectedFilterColor, setSelectedFilterColor] = useState<string | null>(null);

    // Reordenamiento de notas en rejilla
    const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
    const [draggedNote, setDraggedNote] = useState<EventoCalendario | null>(null);
    const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [draggedSize, setDraggedSize] = useState<{ width: number; height: number }>({ width: 280, height: 150 });
    const dragPreviewRef = useRef<HTMLDivElement | null>(null);

    // ── Popover de planificación (al soltar nota en Kanban) ───────────────────
    const [planificando, setPlanificando] = useState<{
        note: EventoCalendario;
        targetEstado: string;
        anchorPos: { x: number; y: number };
    } | null>(null);

    // Refs para evitar fugas al perder el foco en la pestaña (blur de ventana)
    const draggedNoteIndexRef = useRef<number | null>(null);
    const draggedNoteRef = useRef<EventoCalendario | null>(null);

    useEffect(() => {
        draggedNoteIndexRef.current = draggedNoteIndex;
        draggedNoteRef.current = draggedNote;
    }, [draggedNoteIndex, draggedNote]);

    useEffect(() => {
        const handleWindowBlur = () => {
            if (draggedNoteRef.current) {
                handleGlobalDragEnd();
            }
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, []);

    // Controladores de arrastre basados en PointerEvents estilo Google Keep
    const handleInboxPointerDown = (e: React.PointerEvent<HTMLDivElement>, note: EventoCalendario, index: number) => {
        const target = e.target as HTMLElement;
        if (target.closest('.inbox-note-actions') || target.closest('.inbox-note-priority-select') || target.closest('.inbox-note-quick-colors') || target.closest('button') || target.closest('select') || target.closest('option')) {
            return;
        }

        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const startOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        setDraggedNote(note);
        setDraggedNoteIndex(index);
        setDraggedSize({ width: rect.width, height: rect.height });
        setDragStartOffset(startOffset);

        document.body.classList.add('body-dragging-active');
        e.currentTarget.setPointerCapture(e.pointerId);

        // Posicionar el clon flotante inmediatamente en el primer tick
        setTimeout(() => {
            if (dragPreviewRef.current) {
                dragPreviewRef.current.style.left = `${e.clientX - startOffset.x}px`;
                dragPreviewRef.current.style.top = `${e.clientY - startOffset.y}px`;
            }
        }, 0);
    };

    const handleInboxPointerMove = (e: React.PointerEvent<HTMLDivElement>, currentIndex: number) => {
        if (draggedNote === null || draggedNoteIndex === null) return;
        e.preventDefault();

        // Mover el preview de forma imperativa en el DOM para rendimiento extremo a 120fps sin re-renders
        if (dragPreviewRef.current) {
            dragPreviewRef.current.style.left = `${e.clientX - dragStartOffset.x}px`;
            dragPreviewRef.current.style.top = `${e.clientY - dragStartOffset.y}px`;
        }

        // Encontrar elemento bajo el cursor
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (!elementUnderCursor) return;

        const cardUnderCursor = elementUnderCursor.closest('.inbox-note-card') as HTMLElement;
        if (cardUnderCursor) {
            const targetUuid = cardUnderCursor.getAttribute('data-note-uuid');
            if (targetUuid && targetUuid !== draggedNote.uuid) {
                const targetIndex = stickyNotes.findIndex(n => n.uuid === targetUuid);
                if (targetIndex !== -1 && targetIndex !== draggedNoteIndex) {
                    const targetRect = cardUnderCursor.getBoundingClientRect();
                    const targetCenterX = targetRect.left + targetRect.width / 2;
                    const targetCenterY = targetRect.top + targetRect.height / 2;

                    const isForward = draggedNoteIndex < targetIndex;

                    // Si cruzamos horizontalmente en el eje X, o verticalmente en el eje Y, disparamos el swap
                    const passedHorizontal = isForward ? e.clientX > targetCenterX : e.clientX < targetCenterX;
                    const passedVertical = isForward ? e.clientY > targetCenterY : e.clientY < targetCenterY;

                    if (passedHorizontal || passedVertical) {
                        const reordered = [...stickyNotes];
                        const [removed] = reordered.splice(draggedNoteIndex, 1);
                        reordered.splice(targetIndex, 0, removed);

                        setStickyNotes(reordered);
                        setDraggedNoteIndex(targetIndex);
                    }
                }
            }
        }
    };

    const handleInboxPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggedNote === null) return;
        e.preventDefault();

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignorar
        }

        const wasReorderingInbox = draggedNoteIndex !== null;
        const currentNotes = [...stickyNotes];

        setDraggedNote(null);
        setDraggedNoteIndex(null);
        document.body.classList.remove('body-dragging-active');

        if (wasReorderingInbox) {
            try {
                const payload = currentNotes.map((note, idx) => ({
                    uuid: note.uuid,
                    orden: idx + 1
                }));
                await reordenarBandeja(payload);
            } catch (err) {
                console.error('Error al persistir orden de bandeja:', err);
                fetchStickyNotes();
            }
        }
    };

    // Cambio rápido de prioridad desde la rejilla de notas
    const handleQuickPriorityChange = async (note: EventoCalendario, newPriority: string) => {
        const payload = buildPayload({
            titulo: note.titulo,
            descripcion: note.descripcion || '',
            tipo: note.subcategoria || 'Personal',
            fechaInicio: null,
            fechaFin: null,
            esTodoElDia: note.es_todo_el_dia,
            colorHex: note.color_hex || '#F59E0B',
            esPrivado: note.es_privado,
            prioridad: newPriority,
            estado: note.estado,
            alertaDias: note.alerta_dias ?? '',
            recurrenciaAnual: note.recurrencia_anual ?? false,
            urlAccion: note.url_accion,
            notaDetalle: note.nota_detalle,
        });

        // Actualización optimista local
        setStickyNotes(prev => prev.map(n => n.uuid === note.uuid ? { ...n, prioridad: newPriority } : n));

        try {
            await updateEvento(note.uuid, payload);
            fetchStickyNotes();
        } catch (err) {
            console.error('Error al actualizar prioridad rápida:', err);
            fetchStickyNotes();
        }
    };

    // Cambio rápido de color desde la rejilla de notas
    const handleQuickColorChange = async (note: EventoCalendario, newColor: string) => {
        const payload = buildPayload({
            titulo: note.titulo,
            descripcion: note.descripcion || '',
            tipo: note.subcategoria || 'Personal',
            fechaInicio: null,
            fechaFin: null,
            esTodoElDia: note.es_todo_el_dia,
            colorHex: newColor,
            esPrivado: note.es_privado,
            prioridad: note.prioridad,
            estado: note.estado,
            alertaDias: note.alerta_dias ?? '',
            recurrenciaAnual: note.recurrencia_anual ?? false,
            urlAccion: note.url_accion,
            notaDetalle: note.nota_detalle,
        });

        // Actualización optimista local
        setStickyNotes(prev => prev.map(n => n.uuid === note.uuid ? { ...n, color_hex: newColor } : n));

        try {
            await updateEvento(note.uuid, payload);
            fetchStickyNotes();
        } catch (err) {
            console.error('Error al actualizar color rápido:', err);
            fetchStickyNotes();
        }
    };


    const kanbanColumnas = [
        { id: 'Pendiente', label: 'Pendiente' },
        { id: 'EnProgreso', label: 'En Progreso' },
        { id: 'Completado', label: 'Completado' },
        { id: 'Cancelado', label: 'Cancelado' },
    ];

    const [stickyNotes, setStickyNotes] = useState<EventoCalendario[]>([]);
    const fetchStickyNotes = useCallback(async () => {
        try {
            const data = await getStickyNotes();
            setStickyNotes(data);
        } catch (err) {
            console.error('Error al cargar notas adhesivas:', err);
        }
    }, []);

    const handleDeleteStickyNote = async (uuid: string) => {
        try {
            setLoading(true);
            await deleteEvento(uuid);
            fetchStickyNotes();
        } catch (err) {
            console.error('Error al eliminar nota adhesiva:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNoteDragStart = (e: React.DragEvent, note: EventoCalendario) => {
        document.body.classList.add('body-dragging-active');
        e.dataTransfer.setData('diitra/note', JSON.stringify(note));
        e.dataTransfer.effectAllowed = 'copyMove';
        setTimeout(() => {
            setDraggingUuid(note.uuid);
        }, 0);
    };

    const handleDragStart = (e: React.DragEvent, uuid: string) => {
        document.body.classList.add('body-dragging-active');
        e.dataTransfer.setData('text/plain', uuid);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            setDraggingUuid(uuid);
        }, 0);
    };

    const handleGlobalDragEnd = async () => {
        const wasReorderingInbox = draggedNoteIndex !== null;
        const currentNotes = [...stickyNotes];

        setDraggingUuid(null);
        setDraggedNoteIndex(null);
        setDraggedNote(null);
        setDragOverColumn(null);
        document.body.classList.remove('body-dragging-active');

        if (wasReorderingInbox) {
            try {
                const payload = currentNotes.map((note, idx) => ({
                    uuid: note.uuid,
                    orden: idx + 1
                }));
                await reordenarBandeja(payload);
            } catch (err) {
                console.error('Error al persistir orden de bandeja:', err);
                fetchStickyNotes();
            }
        }
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        if (dragOverColumn !== columnId) {
            setDragOverColumn(columnId);
        }
    };

    const handleDrop = async (e: React.DragEvent, targetEstado: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        handleGlobalDragEnd();

        const noteData = e.dataTransfer.getData('diitra/note');
        if (noteData) {
            try {
                const note: EventoCalendario = JSON.parse(noteData);
                // Mostrar popover de planificación en lugar de fijar fecha=hoy automáticamente
                const dropRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setPlanificando({
                    note,
                    targetEstado,
                    anchorPos: { x: dropRect.left + dropRect.width / 2, y: dropRect.top + 60 },
                });
            } catch (err) {
                console.error('Error al parsear nota para planificación:', err);
            }
            return;
        }

        const uuid = e.dataTransfer.getData('text/plain') || draggingUuid;
        setDraggingUuid(null);
        if (!uuid) return;

        const eventFound = eventos.find(ev => ev.resource.uuid === uuid);
        if (!eventFound) return;

        const ev = eventFound.resource;
        const isPersonal = ev.categoria_global === 'Personal';

        if (!isPersonal) {
            alert('Solo se pueden reorganizar las tareas y eventos personales.');
            return;
        }

        if (ev.estado === targetEstado) return;

        const payload = buildPayload({
            titulo: ev.titulo,
            descripcion: ev.descripcion || '',
            tipo: ev.subcategoria || 'Personal',
            fechaInicio: ev.fecha_inicio,
            fechaFin: ev.fecha_fin || ev.fecha_inicio,
            esTodoElDia: ev.es_todo_el_dia,
            colorHex: ev.color_hex || '#F59E0B',
            esPrivado: ev.es_privado,
            prioridad: ev.prioridad,
            estado: targetEstado,
            alertaDias: ev.alerta_dias ?? '',
            recurrenciaAnual: ev.recurrencia_anual ?? false,
            urlAccion: ev.url_accion,
        });

        // Actualización Optimista
        setEventos(prev => prev.map(item => {
            if (item.resource.uuid === uuid) {
                return {
                    ...item,
                    resource: {
                        ...item.resource,
                        estado: targetEstado
                    }
                };
            }
            return item;
        }));

        // Ejecución asíncrona en segundo plano
        updateEvento(uuid, payload).then(() => {
            fetchEventos(currentDate);
        }).catch(err => {
            console.error('Error al actualizar estado del evento en Kanban:', err);
            fetchEventos(currentDate);
        });
    };

    /** Confirma la planificación de una nota: asigna fecha y la mueve al Kanban */
    const handleConfirmPlanificacion = async (fechaElegida: string) => {
        if (!planificando) return;
        const { note, targetEstado } = planificando;
        setPlanificando(null);

        const payload = buildPayload({
            titulo: note.titulo,
            descripcion: note.descripcion || '',
            tipo: note.subcategoria || 'Personal',
            fechaInicio: fechaElegida,
            fechaFin: fechaElegida,
            esTodoElDia: note.es_todo_el_dia,
            colorHex: note.color_hex || '#F59E0B',
            esPrivado: note.es_privado,
            prioridad: note.prioridad,
            estado: targetEstado,
            alertaDias: note.alerta_dias ?? '',
            recurrenciaAnual: note.recurrencia_anual ?? false,
            urlAccion: note.url_accion,
            notaDetalle: note.nota_detalle,
        });

        // Actualización optimista: quitar de la bandeja
        setStickyNotes(prev => prev.filter(n => n.uuid !== note.uuid));
        const fechaDate = new Date(fechaElegida + 'T12:00:00');
        const newEv: Evento = {
            id_evento_calendario: '0',
            uuid: note.uuid,
            titulo: note.titulo,
            descripcion: note.descripcion || '',
            categoria_global: 'Personal',
            subcategoria: note.subcategoria || 'Personal',
            fecha_inicio: fechaElegida,
            fecha_fin: fechaElegida,
            es_todo_el_dia: note.es_todo_el_dia,
            color_hex: note.color_hex || '#F59E0B',
            es_privado: note.es_privado,
            prioridad: note.prioridad,
            estado: targetEstado,
            url_accion: note.url_accion,
            creado_por: 0,
            alerta_dias: note.alerta_dias,
            recurrencia_anual: note.recurrencia_anual,
        };
        setEventos(prev => [...prev, { title: note.titulo, start: fechaDate, end: fechaDate, allDay: true, resource: newEv }]);

        updateEvento(note.uuid, payload).then(() => {
            fetchStickyNotes();
            fetchEventos(currentDate);
        }).catch(err => {
            console.error('Error al confirmar planificación:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        });
    };

    /** Devuelve una tarjeta del Kanban a la bandeja Inbox */
    const handleDevolverAInbox = async (uuid: string) => {
        try {
            // Optimista: quitar del Kanban localmente
            setEventos(prev => prev.filter(ev => ev.resource.uuid !== uuid));
            await devolverAInbox(uuid);
            fetchStickyNotes();
            fetchEventos(currentDate);
        } catch (err) {
            console.error('Error al devolver evento a Inbox:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        }
    };

    const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null);
    const navigate = useNavigate();
    const confirm = useConfirm();

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
    const [formColorHex, setFormColorHex] = useState('#F59E0B');
    const [formEsPrivado, setFormEsPrivado] = useState(true);
    const [formPrioridad, setFormPrioridad] = useState('Media');
    const [formEstado, setFormEstado] = useState('Pendiente');
    const [formAlertaDias, setFormAlertaDias] = useState<number | ''>('');
    const [formRecurrenciaAnual, setFormRecurrenciaAnual] = useState(false);

    const [icalUrl, setIcalUrl] = useState<string>('');
    const [generatingToken, setGeneratingToken] = useState(false);
    const [copied, setCopied] = useState(false);

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

    // ─── onSelectSlot: clic/drag en celda vacía ───────────────────
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
            fetchStickyNotes();
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

    // ─── Drag & Drop: mover evento (solo personales) ──────────────
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


    // ─── Drag & Drop: redimensionar (cambiar fecha fin) ──────────
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

    useEffect(() => {
        const savedUrl = localStorage.getItem('diitra_ical_url');
        if (savedUrl) setIcalUrl(savedUrl);
    }, []);

    const handleGenerarToken = async () => {
        try {
            setGeneratingToken(true);
            const data = await getIcalToken();
            if (data?.feed_url) {
                setIcalUrl(data.feed_url);
                localStorage.setItem('diitra_ical_url', data.feed_url);
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
        textArea.style.cssText = 'position:fixed;top:0;left:0;';
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
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(icalUrl)
                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
                .catch(() => fallbackCopyText(icalUrl));
        } else {
            fallbackCopyText(icalUrl);
        }
    };

    const fetchEventos = async (date: Date) => {
        try {
            setLoading(true);
            const raw = await getEventos(date);
            const parsed: CalendarEventExtended[] = raw
                .filter(ev => ev.fecha_inicio !== null)
                .map((ev) => {
                    const [yI, mI, dI] = ev.fecha_inicio!.split('-').map(Number);
                    const start = new Date(yI, mI - 1, dI);
                    let end = start;
                    if (ev.fecha_fin) {
                        const [yF, mF, dF] = ev.fecha_fin.split('-').map(Number);
                        end = new Date(yF, mF - 1, dF);
                    }
                    return { title: ev.titulo, start, end, allDay: ev.es_todo_el_dia, resource: ev };
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
        fetchStickyNotes();
    }, [currentDate, fetchStickyNotes]);

    useEffect(() => {
        const handleNoteCreated = () => {
            fetchStickyNotes();
        };
        window.addEventListener('diitra:note-created', handleNoteCreated);
        return () => {
            window.removeEventListener('diitra:note-created', handleNoteCreated);
        };
    }, [fetchStickyNotes]);

    const handleNavigate = (newDate: Date) => setCurrentDate(newDate);

    const handleSelectEvent = (event: CalendarEventExtended) => setSelectedEvent(event.resource);

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

    // ─── Panel de próximos eventos ────────────────────────────────
    const hoy = startOfDay(new Date());
    const proximosEventos = [...eventos]
        .filter(ev => isAfter(ev.start as Date, hoy) || format(ev.start as Date, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd'))
        .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime())
        .slice(0, 7);

    // ─── Drag & Drop: check si el evento es arrastrable ──────────
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

    return (
        <div className="calendario-page-container">
            <div className="calendario-sidebar">
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
                            {generatingToken ? 'Generando...' : 'Obtener Enlace iCal'}
                        </button>
                    )}
                </div>
            </div>

            <div className={`calendario-main ${loading ? 'calendario-loading' : ''}`}>

                <div className="calendario-header-actions">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="text-brand" size={18} />
                            <h2 className="text-sm font-bold text-text-main font-sans uppercase tracking-wider">
                                Agenda
                            </h2>
                        </div>

                        <div className="view-selector-pill">
                            <button
                                type="button"
                                className={`view-selector-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                                onClick={() => setViewMode('calendar')}
                            >
                                <CalendarIcon size={12} />
                                Calendario
                            </button>
                            <button
                                type="button"
                                className={`view-selector-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                <Layers size={12} />
                                Tablero Kanban
                            </button>
                            <button
                                type="button"
                                className={`view-selector-btn ${viewMode === 'inbox' ? 'active' : ''}`}
                                onClick={() => setViewMode('inbox')}
                            >
                                <FileText size={12} />
                                Bandeja de Notas
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {viewMode === 'calendar' && (
                            <>
                                {/* Navegador Temporal */}
                                <div className="view-selector-pill">
                                    <button
                                        onClick={() => handleNavigateClick('PREV')}
                                        className="view-selector-btn font-semibold"
                                        title="Anterior"
                                    >
                                        &lt;
                                    </button>
                                    <span className="text-xs font-semibold px-2 min-w-[120px] text-center text-fg font-sans select-none flex items-center justify-center">
                                        {getLabelFecha()}
                                    </span>
                                    <button
                                        onClick={() => handleNavigateClick('NEXT')}
                                        className="view-selector-btn font-semibold"
                                        title="Siguiente"
                                    >
                                        &gt;
                                    </button>
                                    <button
                                        onClick={() => handleNavigateClick('TODAY')}
                                        className="view-selector-btn text-[10px] font-bold uppercase"
                                    >
                                        Hoy
                                    </button>
                                </div>

                                {/* Selector Sub-vistas (Agenda al inicio, luego Mes, Semana, Día) */}
                                <div className="view-selector-pill">
                                    {(['agenda', 'month', 'week', 'day'] as const).map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            className={`view-selector-btn ${view === v ? 'active' : ''}`}
                                            onClick={() => setView(v)}
                                        >
                                            {v === 'agenda' ? 'Agenda' : v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Botón Global de Añadir Tarea / Nota */}
                        <button
                            type="button"
                            className="global-add-task-btn"
                            onClick={viewMode === 'inbox' ? () => {
                                // Simular el clic en el botón flotante abriendo su modal
                                const floatingTrigger = document.querySelector('.sticky-floating-trigger-btn') as HTMLElement;
                                if (floatingTrigger) floatingTrigger.click();
                            } : handleNewEventClick}
                        >
                            <Plus size={14} />
                            <span>{viewMode === 'inbox' ? 'Añadir Nota' : 'Añadir Tarea'}</span>
                        </button>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    view === 'agenda' ? (
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
                                    (() => {
                                        // Ordenar eventos por fecha de inicio
                                        const sortedEvents = [...filteredEventos].sort(
                                            (a, b) => (a.start as Date).getTime() - (b.start as Date).getTime()
                                        );

                                        let lastDateStr = '';

                                        return sortedEvents.map(event => {
                                            const ev = event.resource;
                                            const isCompleted = ev.estado === 'Completado';
                                            const color = ev.color_hex || CATEGORIAS_CONFIG[ev.categoria_global]?.color || '#6B7280';

                                            // Formatear fecha
                                            const dateStr = format(event.start as Date, "eee d 'de' MMM", { locale: es });
                                            // Si es la misma fecha que el anterior, la dejamos en blanco pero conservamos el espacio
                                            const showDate = dateStr !== lastDateStr ? dateStr : '';
                                            lastDateStr = dateStr;

                                            // Formatear hora
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
                                        });
                                    })()
                                )}
                            </div>
                        </div>
                    ) : (
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
                    )
                ) : viewMode === 'kanban' ? (
                    <div className="kanban-board-container">
                        {kanbanColumnas.map(col => {
                            const colEvents = filteredEventos.filter(ev => {
                                if (ev.resource.categoria_global !== 'Personal') return false;

                                const estado = ev.resource.estado;
                                if (col.id === 'EnProgreso') {
                                    return estado === 'EnProgreso' || estado === 'En Ejecución';
                                }
                                if (col.id === 'Pendiente') {
                                    return estado === 'Pendiente' || !estado;
                                }
                                return estado === col.id;
                            });

                            return (
                                <div
                                    key={col.id}
                                    className={`kanban-column ${dragOverColumn === col.id ? 'drag-over' : ''}`}
                                    onDragOver={(e) => handleDragOver(e, col.id)}
                                    onDragLeave={() => setDragOverColumn(null)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div className="kanban-column-header">
                                        <div className="kanban-column-title-wrapper">
                                            <span className="kanban-column-title">{col.label}</span>
                                            <span className="kanban-column-count">{colEvents.length}</span>
                                        </div>
                                    </div>
                                    <div className="kanban-cards-container">
                                        {colEvents.length === 0 ? (
                                            <div className="kanban-empty-state">
                                                Arrastra tareas aquí o usa Añadir Tarea
                                            </div>
                                        ) : (
                                            colEvents.map(ev => {
                                                const r = ev.resource;
                                                const isCompleted = r.estado === 'Completado';
                                                const isPersonal = r.categoria_global === 'Personal';
                                                const formattedDate = r.fecha_fin && r.fecha_fin !== r.fecha_inicio
                                                    ? `${format(ev.start as Date, 'd MMM', { locale: es })} - ${format(ev.end as Date, 'd MMM', { locale: es })}`
                                                    : format(ev.start as Date, 'd MMM', { locale: es });

                                                return (
                                                    <div
                                                        key={r.uuid}
                                                        draggable={isPersonal}
                                                        onDragStart={(e) => handleDragStart(e, r.uuid)}
                                                        onDragEnd={handleGlobalDragEnd}
                                                        className={`kanban-card ${draggingUuid === r.uuid ? 'dragging' : ''}`}
                                                        style={{ '--card-color': r.color_hex || '#6B7280' } as React.CSSProperties}
                                                        onClick={() => setSelectedEvent(r)}
                                                    >
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="kanban-card-tags">
                                                                <span
                                                                    className="kanban-badge categoria"
                                                                    style={{ '--badge-bg': r.color_hex || '#6B7280' } as React.CSSProperties}
                                                                >
                                                                    {r.categoria_global === 'Personal' ? 'Mi Tarea' : r.categoria_global}
                                                                </span>
                                                                {r.prioridad && (
                                                                    <span
                                                                        className="kanban-badge prioridad"
                                                                        style={{
                                                                            '--prio-bg': PRIORIDAD_COLORS[r.prioridad]?.bg || 'var(--border)',
                                                                            '--prio-text': PRIORIDAD_COLORS[r.prioridad]?.text || 'var(--text-dim)',
                                                                        } as React.CSSProperties}
                                                                    >
                                                                        {r.prioridad}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className={`kanban-card-title ${isCompleted ? 'completado' : ''}`}>
                                                                {r.titulo}
                                                            </h4>
                                                            {r.descripcion && (
                                                                <p className="kanban-card-desc">{r.descripcion}</p>
                                                            )}
                                                        </div>
                                                        <div className="kanban-card-footer">
                                                            <span className="kanban-card-date">
                                                                <CalendarIcon size={10} />
                                                                {formattedDate}
                                                            </span>
                                                            <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                                                                {isPersonal && !isCompleted && (
                                                                    <button
                                                                        type="button"
                                                                        className="kanban-action-btn complete"
                                                                        onClick={() => handleQuickComplete(r)}
                                                                        title="Marcar como Completado"
                                                                    >
                                                                        <CheckCircle size={12} />
                                                                    </button>
                                                                )}
                                                                {isPersonal && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            className="kanban-action-btn"
                                                                            onClick={() => handleDevolverAInbox(r.uuid)}
                                                                            title="Devolver a la bandeja Inbox"
                                                                        >
                                                                            <RotateCcw size={12} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="kanban-action-btn"
                                                                            onClick={() => handleEditEventClick(r)}
                                                                            title="Editar"
                                                                        >
                                                                            <Edit2 size={12} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="kanban-action-btn delete"
                                                                            onClick={() => handleDeleteEvent(r.uuid)}
                                                                            title="Eliminar"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {(r.url_accion || (!isPersonal && r.categoria_global === 'Proyecto' && r.uuid)) && (
                                                                    <button
                                                                        type="button"
                                                                        className="kanban-action-btn"
                                                                        onClick={() => handleGoToEventAction(r)}
                                                                        title="Ir al Contexto de Trabajo"
                                                                    >
                                                                        <ArrowRight size={12} />
                                                                    </button>
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
                        })}
                    </div>
                ) : (
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
                                        <motion.div
                                            key={note.uuid}
                                            layout
                                            onPointerDown={(e) => handleInboxPointerDown(e, note, indexReal !== -1 ? indexReal : index)}
                                            onPointerMove={(e) => handleInboxPointerMove(e, indexReal !== -1 ? indexReal : index)}
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

                                                    {/* Selector de prioridad rápido e interactivo */}
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

                                                {/* Mini paleta de colores flotante en hover */}
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
                )}
            </div>

            {/* Detail Drawer */}
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
                                {selectedEvent.recurrencia_anual && (
                                    <span className="px-2 py-0.5 bg-brand-subtle text-brand border border-brand/20 text-[9px] font-bold uppercase rounded flex items-center gap-1">
                                        <RotateCcw size={8} /> Anual
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
                                <h2 className={`text-3xl font-bold tracking-tight text-text-main leading-tight font-sans ${selectedEvent.estado === 'Completado' ? 'line-through opacity-60' : ''}`}>
                                    {selectedEvent.titulo}
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    {selectedEvent.descripcion || 'Sin descripción detallada.'}
                                </p>
                            </div>

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
                                        <div className="text-sm font-bold text-text-main">Todo el día</div>
                                    </div>
                                )}

                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Prioridad</div>
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded inline-block font-sans"
                                        style={{
                                            background: PRIORIDAD_COLORS[selectedEvent.prioridad]?.bg || 'var(--border-thin)',
                                            color: PRIORIDAD_COLORS[selectedEvent.prioridad]?.text || 'var(--text-dim)',
                                        }}>
                                        {selectedEvent.prioridad || 'Media'}
                                    </span>
                                </div>

                                <div className="bento-card static p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Estado</div>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded inline-block font-sans ${selectedEvent.estado === 'Completado' ? 'bg-success-subtle text-success' :
                                        selectedEvent.estado === 'EnProgreso' || selectedEvent.estado === 'En Ejecución' ? 'bg-info-subtle text-info' :
                                            selectedEvent.estado === 'Cancelado' ? 'bg-bg-deep text-text-dim' :
                                                'bg-warning-subtle text-warning'
                                        }`}>
                                        {ESTADO_LABELS[selectedEvent.estado] ?? selectedEvent.estado}
                                    </span>
                                </div>

                                {/* Contexto de Origen */}
                                {(() => {
                                    const desc = getContextDescription(selectedEvent);
                                    if (!desc) return null;
                                    return (
                                        <div className="bento-card static p-5 space-y-2 col-span-2 bg-brand-subtle/10 border border-brand/10">
                                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                                <Info size={12} /> Detalle de Contexto
                                            </div>
                                            <p className="text-xs text-text-dim leading-relaxed font-sans font-medium">
                                                {desc}
                                            </p>
                                        </div>
                                    );
                                })()}


                                {/* Alerta */}
                                {selectedEvent.alerta_dias != null && (
                                    <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                        <div className="text-[10px] font-bold text-warning uppercase tracking-widest flex items-center gap-1.5">
                                            <Bell size={12} /> Recordatorio
                                        </div>
                                        <div className="text-sm font-bold text-text-main">
                                            {selectedEvent.alerta_dias === 0
                                                ? 'El mismo día del evento'
                                                : `${selectedEvent.alerta_dias} día${selectedEvent.alerta_dias !== 1 ? 's' : ''} antes`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex flex-col gap-3">
                            {selectedEvent.categoria_global === 'Personal' ? (
                                <div className="flex gap-3 w-full">
                                    {selectedEvent.estado !== 'Completado' && (
                                        <button
                                            onClick={() => handleQuickComplete(selectedEvent)}
                                            className="flex-1 py-3 bg-success text-white hover:bg-success/90 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={15} /> Completar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditEventClick(selectedEvent)}
                                        className="flex-1 py-3 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={15} /> Editar
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
                                            Ver Detalle / Acción <ArrowRight size={14} />
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

            {/* Form Drawer */}
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
                            <div className="space-y-1">
                                <label className="section-label mb-1.5 block">Título *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Reunión de Avance del Proyecto"
                                    value={formTitulo}
                                    onChange={(e) => setFormTitulo(e.target.value)}
                                    className="input-vercel text-sm"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="space-y-1">
                                <label className="section-label mb-1.5 block">Descripción o Detalles</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ingresa notas o detalles sobre el evento..."
                                    value={formDescripcion}
                                    onChange={(e) => setFormDescripcion(e.target.value)}
                                    className="input-vercel text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Tipo */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Categoría / Tipo</label>
                                    <select
                                        value={formTipo}
                                        onChange={(e) => setFormTipo(e.target.value)}
                                        className="input-vercel text-sm"
                                    >
                                        <option value="Personal">Personal / Nota</option>
                                        <option value="Tarea">Tarea de Investigación</option>
                                        <option value="Reunion">Reunión / Tutoría</option>
                                        <option value="Hito">Hito de Proyecto</option>
                                    </select>
                                </div>

                                {/* Color */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Etiqueta Visual (Color)</label>
                                    <select
                                        value={formColorHex}
                                        onChange={(e) => setFormColorHex(e.target.value)}
                                        className="input-vercel text-sm"
                                    >
                                        {COLORES_OPCIONES.map(({ value, label }) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Fecha Inicio */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Fecha de Inicio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formFechaInicio || ''}
                                        onChange={(e) => setFormFechaInicio(e.target.value)}
                                        className="input-vercel text-sm"
                                    />
                                </div>

                                {/* Fecha Fin */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Fecha de Fin</label>
                                    <input
                                        type="date"
                                        value={formFechaFin || ''}
                                        onChange={(e) => setFormFechaFin(e.target.value)}
                                        className="input-vercel text-sm"
                                    />
                                </div>

                                {/* Prioridad */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Prioridad</label>
                                    <select
                                        value={formPrioridad}
                                        onChange={(e) => setFormPrioridad(e.target.value)}
                                        className="input-vercel text-sm"
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>

                                {/* Estado */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block">Estado</label>
                                    <select
                                        value={formEstado}
                                        onChange={(e) => setFormEstado(e.target.value)}
                                        className="input-vercel text-sm"
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="EnProgreso">En Progreso</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>

                                {/* Alerta días */}
                                <div className="space-y-1">
                                    <label className="section-label mb-1.5 block flex items-center gap-1.5">
                                        <Bell size={10} /> Recordatorio (días antes)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={90}
                                        placeholder="Ej: 3 (dejar vacío para no recordar)"
                                        value={formAlertaDias}
                                        onChange={(e) => setFormAlertaDias(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="input-vercel text-sm"
                                    />
                                </div>

                                {/* Recurrencia anual */}
                                <div className="space-y-1 flex flex-col justify-end">
                                    <label className="section-label mb-1.5 block flex items-center gap-1.5">
                                        <RotateCcw size={10} /> Repetición
                                    </label>
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border-thin rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="recurrencia_anual"
                                            checked={formRecurrenciaAnual}
                                            onChange={(e) => setFormRecurrenciaAnual(e.target.checked)}
                                            className="w-4 h-4 accent-brand cursor-pointer"
                                        />
                                        <label htmlFor="recurrencia_anual" className="text-sm text-text-main cursor-pointer select-none">
                                            Se repite cada año
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Es Privado */}
                            <div className="flex items-center gap-3 p-4 bg-surface border border-border-thin rounded-lg">
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
                                        Si está marcado, solo tú podrás ver este evento.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="btn-vercel-secondary flex-1 py-3 text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-vercel-primary flex-1 py-3 text-xs"
                            >
                                {isEditing ? 'Actualizar Evento' : 'Guardar Evento'}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
            {/* ── Popover de Planificación ───────────────────────────────────── */}
            {planificando && createPortal(
                <>
                    {/* Backdrop para cerrar al hacer click fuera */}
                    <div
                        className="kanban-popover-backdrop"
                        onClick={() => setPlanificando(null)}
                    />
                    <div
                        className="kanban-popover-planificacion animate-slide-up"
                        style={{
                            left: Math.min(planificando.anchorPos.x, window.innerWidth - 260),
                            top: planificando.anchorPos.y,
                        }}
                    >
                        <div className="kanban-popover-header">
                            <Clock size={13} />
                            <span>¿Cuándo planificarla?</span>
                            <button type="button" onClick={() => setPlanificando(null)} className="kanban-popover-close">
                                <X size={14} />
                            </button>
                        </div>
                        <p className="kanban-popover-note-title">{planificando.note.titulo}</p>
                        <div className="kanban-popover-opciones">
                            {[
                                { label: 'Hoy', fecha: format(new Date(), 'yyyy-MM-dd') },
                                { label: 'Mañana', fecha: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
                                { label: 'En 3 días', fecha: format(addDays(new Date(), 3), 'yyyy-MM-dd') },
                                { label: 'Esta semana', fecha: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
                            ].map(op => (
                                <button
                                    key={op.label}
                                    type="button"
                                    className="kanban-popover-opcion"
                                    onClick={() => handleConfirmPlanificacion(op.fecha)}
                                >
                                    {op.label}
                                </button>
                            ))}
                        </div>
                        <div className="kanban-popover-custom">
                            <label className="kanban-popover-label">O elige una fecha:</label>
                            <input
                                type="date"
                                className="kanban-popover-date-input"
                                min={format(new Date(), 'yyyy-MM-dd')}
                                onChange={(e) => e.target.value && handleConfirmPlanificacion(e.target.value)}
                            />
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
