import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getStickyNotes,
    deleteEvento,
    updateEvento,
    reordenarBandeja,
    buildPayload,
} from '../../../services/calendarioService';
import type { Evento } from '../types/calendarioTypes';

export const useStickyNotes = (setLoading?: (l: boolean) => void) => {
    const [stickyNotes, setStickyNotes] = useState<Evento[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilterContext, setSelectedFilterContext] = useState<string | null>(null);
    const [selectedFilterColor, setSelectedFilterColor] = useState<string | null>(null);

    // Reordenamiento de notas en rejilla (Keep-style)
    const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
    const [draggedNote, setDraggedNote] = useState<Evento | null>(null);
    const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [draggedSize, setDraggedSize] = useState<{ width: number; height: number }>({ width: 280, height: 150 });
    const dragPreviewRef = useRef<HTMLDivElement | null>(null);

    const draggedNoteIndexRef = useRef<number | null>(null);
    const draggedNoteRef = useRef<Evento | null>(null);
    const lastSwapTimeRef = useRef<number>(0);

    const fetchStickyNotes = useCallback(async () => {
        try {
            const data = await getStickyNotes();
            setStickyNotes(data);
        } catch (err) {
            console.error('Error al cargar notas adhesivas:', err);
        }
    }, []);

    useEffect(() => {
        fetchStickyNotes();
    }, [fetchStickyNotes]);

    useEffect(() => {
        const handleNoteCreated = () => {
            fetchStickyNotes();
        };
        window.addEventListener('diitra:note-created', handleNoteCreated);
        return () => {
            window.removeEventListener('diitra:note-created', handleNoteCreated);
        };
    }, [fetchStickyNotes]);

    useEffect(() => {
        draggedNoteIndexRef.current = draggedNoteIndex;
        draggedNoteRef.current = draggedNote;
    }, [draggedNoteIndex, draggedNote]);

    const handleGlobalDragEnd = useCallback(async () => {
        const wasReorderingInbox = draggedNoteIndexRef.current !== null;
        const currentNotes = [...stickyNotes];

        setDraggedNoteIndex(null);
        setDraggedNote(null);
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
    }, [stickyNotes, fetchStickyNotes]);

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
    }, [handleGlobalDragEnd]);

    const handleInboxPointerDown = (e: React.PointerEvent<HTMLDivElement>, note: Evento, index: number) => {
        const target = e.target as HTMLElement;
        if (
            target.closest('.inbox-note-actions') ||
            target.closest('.inbox-note-priority-select') ||
            target.closest('.inbox-note-quick-colors') ||
            target.closest('button') ||
            target.closest('select') ||
            target.closest('option')
        ) {
            return;
        }

        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const startOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        setDraggedNote(note);
        setDraggedNoteIndex(index);
        setDraggedSize({ width: rect.width, height: rect.height });
        setDragStartOffset(startOffset);
        lastSwapTimeRef.current = 0;

        document.body.classList.add('body-dragging-active');
        e.currentTarget.setPointerCapture(e.pointerId);

        setTimeout(() => {
            if (dragPreviewRef.current) {
                dragPreviewRef.current.style.left = `${e.clientX - startOffset.x}px`;
                dragPreviewRef.current.style.top = `${e.clientY - startOffset.y}px`;
            }
        }, 0);
    };

    const handleInboxPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggedNote === null || draggedNoteIndex === null) return;
        e.preventDefault();

        if (dragPreviewRef.current) {
            dragPreviewRef.current.style.left = `${e.clientX - dragStartOffset.x}px`;
            dragPreviewRef.current.style.top = `${e.clientY - dragStartOffset.y}px`;
        }

        const now = Date.now();
        if (now - lastSwapTimeRef.current < 180) {
            return;
        }

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
                    const passedHorizontal = isForward ? e.clientX > targetCenterX : e.clientX < targetCenterX;
                    const passedVertical = isForward ? e.clientY > targetCenterY : e.clientY < targetCenterY;

                    if (passedHorizontal || passedVertical) {
                        const reordered = [...stickyNotes];
                        const [removed] = reordered.splice(draggedNoteIndex, 1);
                        reordered.splice(targetIndex, 0, removed);

                        setStickyNotes(reordered);
                        setDraggedNoteIndex(targetIndex);
                        lastSwapTimeRef.current = now;
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

    const handleDeleteStickyNote = async (uuid: string) => {
        try {
            if (setLoading) setLoading(true);
            await deleteEvento(uuid);
            fetchStickyNotes();
            window.dispatchEvent(new CustomEvent('diitra:note-created'));
        } catch (err) {
            console.error('Error al eliminar nota adhesiva:', err);
        } finally {
            if (setLoading) setLoading(false);
        }
    };

    const handleQuickPriorityChange = async (note: Evento, newPriority: string) => {
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

        setStickyNotes(prev => prev.map(n => n.uuid === note.uuid ? { ...n, prioridad: newPriority } : n));

        try {
            await updateEvento(note.uuid, payload);
            fetchStickyNotes();
        } catch (err) {
            console.error('Error al actualizar prioridad rápida:', err);
            fetchStickyNotes();
        }
    };

    const handleQuickColorChange = async (note: Evento, newColor: string) => {
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

        setStickyNotes(prev => prev.map(n => n.uuid === note.uuid ? { ...n, color_hex: newColor } : n));

        try {
            await updateEvento(note.uuid, payload);
            fetchStickyNotes();
        } catch (err) {
            console.error('Error al actualizar color rápido:', err);
            fetchStickyNotes();
        }
    };

    return {
        stickyNotes,
        setStickyNotes,
        fetchStickyNotes,
        searchQuery,
        setSearchQuery,
        selectedFilterContext,
        setSelectedFilterContext,
        selectedFilterColor,
        setSelectedFilterColor,
        draggedNoteIndex,
        draggedNote,
        dragStartOffset,
        draggedSize,
        dragPreviewRef,
        handleInboxPointerDown,
        handleInboxPointerMove,
        handleInboxPointerUp,
        handleGlobalDragEnd,
        handleDeleteStickyNote,
        handleQuickPriorityChange,
        handleQuickColorChange,
    };
};
