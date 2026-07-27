import React, { useState, DragEvent, PointerEvent, MouseEvent } from 'react';

/**
 * Hook reutilizable para gestionar el arrastre y soltado (Drag & Drop) 
 * de elementos entre zonas receptoras utilizando la API nativa de HTML5.
 * 
 * @param onElementMoved Callback ejecutado al soltar exitosamente un elemento en una zona.
 */
export function useZoneDragDrop<TElement extends string, TZone extends string>(
    onElementMoved: (elementId: TElement, zoneId: TZone) => void
) {
    const [draggingElement, setDraggingElement] = useState<TElement | null>(null);
    const [activeZone, setActiveZone] = useState<TZone | null>(null);

    const handleDragStart = (e: DragEvent, elementId: TElement) => {
        setDraggingElement(elementId);
        e.dataTransfer.setData('text/plain', elementId);
        e.dataTransfer.effectAllowed = 'move';
        
        // Agregar una clase global temporal al body para styling si es necesario
        document.body.classList.add('diitra-dragging-active');
    };

    const handleDragEnd = () => {
        setDraggingElement(null);
        setActiveZone(null);
        document.body.classList.remove('diitra-dragging-active');
    };

    const handleDragOver = (e: DragEvent, zoneId: TZone) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e: DragEvent, zoneId: TZone) => {
        e.preventDefault();
        setActiveZone(zoneId);
    };

    const handleDragLeave = (e: DragEvent, zoneId: TZone) => {
        e.preventDefault();
        // Solo remover la zona activa si realmente estamos saliendo de ella
        setActiveZone(prev => (prev === zoneId ? null : prev));
    };

    const handleDrop = (e: DragEvent, zoneId: TZone) => {
        e.preventDefault();
        const elementId = e.dataTransfer.getData('text/plain') as TElement;
        if (elementId) {
            onElementMoved(elementId, zoneId);
        }
        setDraggingElement(null);
        setActiveZone(null);
        document.body.classList.remove('diitra-dragging-active');
    };

    return {
        draggingElement,
        activeZone,
        dragProps: (elementId: TElement) => ({
            draggable: true,
            onDragStart: (e: DragEvent) => handleDragStart(e, elementId),
            onDragEnd: handleDragEnd,
            onPointerDown: (e: PointerEvent) => e.stopPropagation(),
            onMouseDown: (e: MouseEvent) => e.stopPropagation(),
            className: "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-indigo-500/30 rounded transition-all",
        }),
        zoneProps: (zoneId: TZone) => ({
            onDragOver: (e: DragEvent) => handleDragOver(e, zoneId),
            onDragEnter: (e: DragEvent) => handleDragEnter(e, zoneId),
            onDragLeave: (e: DragEvent) => handleDragLeave(e, zoneId),
            onDrop: (e: DragEvent) => handleDrop(e, zoneId),
        }),
    };
}
