import React, { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../../api/NotificationsContext';
import {
    devolverAInbox,
    updateEvento,
    buildPayload,
} from '../../../services/calendarioService';
import type { CalendarEventExtended, Evento, PlanificandoState, CalendarViewMode } from '../types/calendarioTypes';

interface UseKanbanOrchestrationOptions {
    eventos: CalendarEventExtended[];
    setEventos: React.Dispatch<React.SetStateAction<CalendarEventExtended[]>>;
    stickyNotes: Evento[];
    setStickyNotes: React.Dispatch<React.SetStateAction<Evento[]>>;
    fetchStickyNotes: () => void;
    fetchEventos: (date: Date) => void;
    currentDate: Date;
    handleGlobalDragEndFromNotes?: () => void;
    onPlanNoteInCalendar?: (note: Evento, fechaStr: string) => void;
}

export const useKanbanOrchestration = ({
    eventos,
    setEventos,
    stickyNotes,
    setStickyNotes,
    fetchStickyNotes,
    fetchEventos,
    currentDate,
    handleGlobalDragEndFromNotes,
    onPlanNoteInCalendar,
}: UseKanbanOrchestrationOptions) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlViewMode = searchParams.get('view') as CalendarViewMode;
    const viewMode = (urlViewMode === 'calendar' || urlViewMode === 'kanban' || urlViewMode === 'inbox') ? urlViewMode : 'calendar';

    const setViewMode = (mode: CalendarViewMode) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', mode);
            return next;
        }, { replace: true });
    };

    const [draggingUuid, setDraggingUuid] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'note' | 'kanban' | null>(null);
    const draggingNoteRef = useRef<Evento | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const [planificando, setPlanificando] = useState<PlanificandoState | null>(null);
    const { addToast } = useNotifications();

    const createDragGhost = (e: React.DragEvent) => {
        try {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            const clone = target.cloneNode(true) as HTMLElement;

            clone.classList.remove('dragging');
            // Replica el estilo flotante elevado y con rotación de Notas (Keep style)
            clone.style.position = 'fixed';
            clone.style.top = `${rect.top}px`;
            clone.style.left = `${rect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.boxSizing = 'border-box';
            clone.style.transform = 'rotate(2deg) scale(1.02)';
            clone.style.transformOrigin = 'center center';
            clone.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.18), 0 15px 30px rgba(0, 0, 0, 0.12)';
            clone.style.opacity = '1';
            clone.style.pointerEvents = 'none';
            clone.style.zIndex = '999999';

            document.body.appendChild(clone);
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(clone, offsetX, offsetY);

            setTimeout(() => {
                if (document.body.contains(clone)) {
                    document.body.removeChild(clone);
                }
            }, 0);
        } catch (err) {
            console.error('Error creating drag ghost:', err);
        }
    };

    const handleNoteDragStart = (e: React.DragEvent, note: Evento) => {
        document.body.classList.add('body-dragging-active');
        e.dataTransfer.setData('diitra/note', JSON.stringify(note));
        e.dataTransfer.setData('text/plain', note.uuid);
        e.dataTransfer.effectAllowed = 'copyMove';
        createDragGhost(e);
        draggingNoteRef.current = note;
        setTimeout(() => {
            setDraggingUuid(note.uuid);
            setDraggingType('note');
        }, 0);
    };

    const handleDragStart = (e: React.DragEvent, uuid: string) => {
        document.body.classList.add('body-dragging-active');
        e.dataTransfer.setData('diitra/kanban-event', uuid);
        e.dataTransfer.setData('text/plain', uuid);
        e.dataTransfer.effectAllowed = 'move';
        createDragGhost(e);
        setTimeout(() => {
            setDraggingUuid(uuid);
            setDraggingType('kanban');
        }, 0);
    };

    const handleGlobalDragEnd = useCallback(async () => {
        setDraggingUuid(null);
        setDraggingType(null);
        setDragOverColumn(null);
        document.body.classList.remove('body-dragging-active');
        setTimeout(() => {
            draggingNoteRef.current = null;
        }, 150);
        if (handleGlobalDragEndFromNotes) {
            handleGlobalDragEndFromNotes();
        }
    }, [handleGlobalDragEndFromNotes]);

    React.useEffect(() => {
        const handleWindowDragEnd = () => {
            handleGlobalDragEnd();
        };
        window.addEventListener('dragend', handleWindowDragEnd);
        return () => window.removeEventListener('dragend', handleWindowDragEnd);
    }, [handleGlobalDragEnd]);

    const handleDropNoteOnCalendar = useCallback(async (args: { start: any }) => {
        const note = draggingNoteRef.current;
        if (!note) return;

        const dateObj = args.start instanceof Date ? args.start : new Date(args.start);
        const fechaElegida = format(dateObj, 'yyyy-MM-dd');

        handleGlobalDragEnd();

        // Normalización para span estricto de 1 día (medianoche local)
        const [y, m, d] = fechaElegida.split('-').map(Number);
        const start = new Date(y, m - 1, d, 0, 0, 0);
        const end = start;

        // Actualización optimista inmediata en UI
        const updatedResource: Evento = {
            ...note,
            fecha_inicio: fechaElegida,
            fecha_fin: fechaElegida,
            estado: 'Pendiente',
            categoria_global: 'Personal',
            subcategoria: note.subcategoria || 'General',
            es_todo_el_dia: true,
        };

        const newCalEvent: CalendarEventExtended = {
            title: note.titulo,
            start,
            end,
            allDay: true,
            resource: updatedResource,
        };

        setStickyNotes(prev => prev.filter(n => n.uuid !== note.uuid));
        setEventos(prev => [...prev.filter(ev => ev.resource.uuid !== note.uuid), newCalEvent]);

        // Persistencia asíncrona en backend
        try {
            const payload = buildPayload({
                titulo: note.titulo,
                descripcion: note.descripcion || note.nota_detalle || '',
                tipo: note.subcategoria || 'General',
                fechaInicio: fechaElegida,
                fechaFin: fechaElegida,
                esTodoElDia: true,
                colorHex: note.color_hex || '#F59E0B',
                esPrivado: true,
                prioridad: note.prioridad || 'Media',
                estado: 'Pendiente',
                alertaDias: note.alerta_dias ?? '',
                recurrenciaAnual: false,
                urlAccion: note.url_accion,
            });

            await updateEvento(note.uuid, payload);
            addToast(
                'Nota planificada',
                `Programada para el ${format(dateObj, "d 'de' MMMM", { locale: es })}`,
                'success'
            );
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
            fetchStickyNotes();
            fetchEventos(currentDate);
        } catch (err) {
            console.error('Error al planificar nota en calendario:', err);
            addToast('Error', 'No se pudo planificar la nota en el calendario', 'error');
            fetchStickyNotes();
            fetchEventos(currentDate);
        }
    }, [handleGlobalDragEnd, setStickyNotes, setEventos, addToast, currentDate, fetchStickyNotes, fetchEventos]);

    const dragFromOutsideItem = useCallback(() => {
        const note = draggingNoteRef.current;
        if (!note) return null;
        return {
            title: note.titulo,
            start: new Date(),
            end: new Date(),
            allDay: true,
            resource: note,
        };
    }, []);

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
                const note: Evento = JSON.parse(noteData);
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

        updateEvento(uuid, payload).then(() => {
            fetchEventos(currentDate);
        }).catch(err => {
            console.error('Error al actualizar estado del evento en Kanban:', err);
            fetchEventos(currentDate);
        });
    };

    const handleConfirmPlanificacion = async (fechaElegida: string | null, tituloEditado?: string) => {
        if (!planificando) return;
        const { note, targetEstado } = planificando;
        setPlanificando(null);

        const finalTitulo = (tituloEditado && tituloEditado.trim()) ? tituloEditado.trim() : note.titulo;

        const payload = buildPayload({
            titulo: finalTitulo,
            descripcion: note.descripcion || '',
            tipo: note.subcategoria || 'Personal',
            fechaInicio: fechaElegida || null,
            fechaFin: fechaElegida || null,
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

        setStickyNotes(prev => prev.filter(n => n.uuid !== note.uuid));
        const fechaDate = fechaElegida ? new Date(fechaElegida + 'T12:00:00') : new Date(0);
        const newEv: Evento = {
            id_evento_calendario: '0',
            uuid: note.uuid,
            titulo: finalTitulo,
            descripcion: note.descripcion || '',
            categoria_global: 'Personal',
            subcategoria: note.subcategoria || 'Personal',
            fecha_inicio: fechaElegida || null,
            fecha_fin: fechaElegida || null,
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
        setEventos(prev => [...prev, { title: finalTitulo, start: fechaDate, end: fechaDate, allDay: true, resource: newEv }]);

        updateEvento(note.uuid, payload).then(() => {
            fetchStickyNotes();
            fetchEventos(currentDate);
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        }).catch(err => {
            console.error('Error al confirmar planificación:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        });
    };

    const handleDevolverAInbox = useCallback(async (uuid: string) => {
        setDraggingUuid(null);
        setDraggingType(null);
        document.body.classList.remove('body-dragging-active');
        const sidebarZone = document.querySelector('.sticky-notes-section');
        if (sidebarZone) sidebarZone.classList.remove('drop-target-active');

        try {
            const eventFound = eventos.find(ev => ev.resource.uuid === uuid);
            // Actualización optimista: quitar de eventos
            setEventos(prev => prev.filter(ev => ev.resource.uuid !== uuid));

            // Actualización optimista: reincorporar a notas rápidas inmediatamente
            if (eventFound) {
                const noteRestored: Evento = {
                    ...eventFound.resource,
                    estado: 'inbox',
                    fecha_inicio: '',
                    fecha_fin: '',
                };
                setStickyNotes(prev => [noteRestored, ...prev.filter(n => n.uuid !== uuid)]);
            }

            await devolverAInbox(uuid);
            fetchStickyNotes();
            fetchEventos(currentDate);
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        } catch (err) {
            console.error('Error al devolver evento a Inbox:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        }
    }, [eventos, setEventos, setStickyNotes, fetchStickyNotes, fetchEventos, currentDate]);

    // Soporte para devolver al soltar arrastrando con mouse desde el Calendario
    React.useEffect(() => {
        if (!draggingUuid || draggingType !== 'kanban') return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            const isOver = !!targetEl?.closest('.sticky-notes-section');
            const sidebarZone = document.querySelector('.sticky-notes-section');
            if (sidebarZone) {
                if (isOver) {
                    sidebarZone.classList.add('drop-target-active');
                } else {
                    sidebarZone.classList.remove('drop-target-active');
                }
            }
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            const dropZone = targetEl?.closest('.sticky-notes-section');
            const sidebarZone = document.querySelector('.sticky-notes-section');
            if (sidebarZone) sidebarZone.classList.remove('drop-target-active');

            if (dropZone && draggingUuid) {
                const uuidToRestore = draggingUuid;
                handleGlobalDragEnd();
                handleDevolverAInbox(uuidToRestore);
            }
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
            const sidebarZone = document.querySelector('.sticky-notes-section');
            if (sidebarZone) sidebarZone.classList.remove('drop-target-active');
        };
    }, [draggingUuid, draggingType, handleGlobalDragEnd, handleDevolverAInbox]);

    return {
        viewMode,
        setViewMode,
        draggingUuid,
        setDraggingUuid,
        draggingType,
        setDraggingType,
        dragOverColumn,
        setDragOverColumn,
        planificando,
        setPlanificando,
        handleNoteDragStart,
        handleDragStart,
        handleGlobalDragEnd,
        handleDragOver,
        handleDrop,
        handleConfirmPlanificacion,
        handleDevolverAInbox,
        handleDropNoteOnCalendar,
        dragFromOutsideItem,
    };
};
