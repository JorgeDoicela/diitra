import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

/**
 * Posición libre de un elemento expresada en porcentajes (0-100) relativos al contenedor.
 */
export interface FreeFormPosition {
    x: number; // left %
    y: number; // top %
}

/**
 * Callback invocado al finalizar el arrastre de un elemento.
 * Recibe el id del elemento y su nueva posición en %.
 */
export type OnPositionChanged<TElement extends string> = (
    elementId: TElement,
    position: FreeFormPosition
) => void;

/**
 * useFreeFormDrag — Hook genérico reutilizable para posicionamiento libre de elementos
 * dentro de un contenedor de referencia. Compatible con @dnd-kit porque intercepta
 * onPointerDown/onMouseDown antes de que el evento burbujee al SortableItem padre.
 *
 * @param containerRef  RefObject del contenedor que sirve de canvas (position: relative).
 * @param onPositionChanged  Callback ejecutado al soltar el elemento con la nueva posición.
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { isDragging, draggingId, dragHandlers, getElementStyle } = useFreeFormDrag(
 *   containerRef,
 *   (id, pos) => savePosition(id, pos)
 * );
 * return (
 *   <div ref={containerRef} style={{ position: 'relative' }}>
 *     <div style={getElementStyle({ x: 20, y: 30 }, false)} {...dragHandlers('card', { x: 20, y: 30 })}>
 *       Elemento libre
 *     </div>
 *   </div>
 * );
 */
export function useFreeFormDrag<TElement extends string>(
    containerRef: RefObject<HTMLDivElement | null>,
    onPositionChanged: OnPositionChanged<TElement>
) {
    const [draggingId, setDraggingId] = useState<TElement | null>(null);

    // Estado interno del drag sin re-renders para mayor performance
    const dragState = useRef<{
        elementId: TElement;
        startMouseX: number;
        startMouseY: number;
        startElemX: number;
        startElemY: number;
        currentX: number;
        currentY: number;
        containerW: number;
        containerH: number;
    } | null>(null);

    // Elemento DOM que se mueve durante el drag (para actualizar posición sin re-render)
    const draggingElementRef = useRef<HTMLElement | null>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.current || !draggingElementRef.current) return;
        e.preventDefault();

        const ds = dragState.current;
        const deltaX = e.clientX - ds.startMouseX;
        const deltaY = e.clientY - ds.startMouseY;

        const deltaXPct = (deltaX / ds.containerW) * 100;
        const deltaYPct = (deltaY / ds.containerH) * 100;

        const newX = Math.max(0, Math.min(90, ds.startElemX + deltaXPct));
        const newY = Math.max(0, Math.min(92, ds.startElemY + deltaYPct));

        ds.currentX = newX;
        ds.currentY = newY;

        // Mover el elemento directamente en DOM para fluidez 60fps sin re-render de React
        draggingElementRef.current.style.left = `${newX}%`;
        draggingElementRef.current.style.top = `${newY}%`;
    }, []);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        e.preventDefault();
        if (!dragState.current) return;

        const ds = dragState.current;
        onPositionChanged(ds.elementId, { x: ds.currentX, y: ds.currentY });

        setDraggingId(null);
        dragState.current = null;
        draggingElementRef.current = null;

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove('diitra-freeform-dragging');
    }, [handleMouseMove, onPositionChanged]);

    // Limpieza si el componente se desmonta durante un drag activo
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('diitra-freeform-dragging');
        };
    }, [handleMouseMove, handleMouseUp]);

    /**
     * dragHandlers — Props a adjuntar al elemento arrastrable.
     * onPointerDown con stopPropagation evita que @dnd-kit intercepte el evento
     * del SortableItem padre y arrastre el bloque completo.
     */
    const dragHandlers = useCallback((
        elementId: TElement,
        currentPosition: FreeFormPosition
    ) => ({
        onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            e.preventDefault();

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();

            dragState.current = {
                elementId,
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startElemX: currentPosition.x,
                startElemY: currentPosition.y,
                currentX: currentPosition.x,
                currentY: currentPosition.y,
                containerW: rect.width,
                containerH: rect.height,
            };

            draggingElementRef.current = e.currentTarget;
            setDraggingId(elementId);

            document.body.classList.add('diitra-freeform-dragging');
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        },
        onPointerDown: (e: React.PointerEvent) => {
            // Solo detener burbujeo hacia @dnd-kit, sin cancelar el mousedown
            e.stopPropagation();
        },
    }), [containerRef, handleMouseMove, handleMouseUp]);

    /**
     * getElementStyle — Estilo inline para `position: absolute` sobre el canvas.
     * Aplica micro-animaciones premium durante el drag.
     */
    const getElementStyle = useCallback((
        position: FreeFormPosition,
        isDragging: boolean
    ): React.CSSProperties => ({
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : 1,
        transform: isDragging ? 'scale(1.04)' : 'scale(1)',
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging
            ? '0 8px 32px rgba(99, 102, 241, 0.35), 0 0 0 2px rgba(99, 102, 241, 0.6)'
            : undefined,
        transition: isDragging
            ? 'transform 0.1s ease, box-shadow 0.1s ease'
            : 'transform 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease',
        borderRadius: '6px',
    }), []);

    return {
        /** Id del elemento que se está arrastrando actualmente, o null */
        draggingId,
        /** true cuando hay un drag activo */
        isDragging: draggingId !== null,
        /** Genera handlers de mouse para el elemento arrastrable */
        dragHandlers,
        /** Genera estilos CSS absolutos para el elemento */
        getElementStyle,
    };
}
