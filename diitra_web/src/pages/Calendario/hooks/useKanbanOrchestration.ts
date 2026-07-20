import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
}

export const useKanbanOrchestration = ({
    eventos,
    setEventos,
    setStickyNotes,
    fetchStickyNotes,
    fetchEventos,
    currentDate,
    handleGlobalDragEndFromNotes,
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
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const [planificando, setPlanificando] = useState<PlanificandoState | null>(null);

    const handleNoteDragStart = (e: React.DragEvent, note: Evento) => {
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
        setDraggingUuid(null);
        setDragOverColumn(null);
        document.body.classList.remove('body-dragging-active');
        if (handleGlobalDragEndFromNotes) {
            handleGlobalDragEndFromNotes();
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
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        }).catch(err => {
            console.error('Error al confirmar planificación:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        });
    };

    const handleDevolverAInbox = async (uuid: string) => {
        try {
            setEventos(prev => prev.filter(ev => ev.resource.uuid !== uuid));
            await devolverAInbox(uuid);
            fetchStickyNotes();
            fetchEventos(currentDate);
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        } catch (err) {
            console.error('Error al devolver evento a Inbox:', err);
            fetchStickyNotes();
            fetchEventos(currentDate);
        }
    };

    return {
        viewMode,
        setViewMode,
        draggingUuid,
        setDraggingUuid,
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
    };
};
