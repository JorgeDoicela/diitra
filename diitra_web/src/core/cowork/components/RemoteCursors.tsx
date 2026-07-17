import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkUser } from '../types';


interface RemoteCursorsProps {
    editor: Editor | null;
    awareness: awarenessProtocol.Awareness | null;
    field?: string;
}

interface CursorState {
    clientId: number;
    user: CoWorkUser;
    anchor: number;
    head: number;
    x: number;
    y: number;
    height: number;
    selectionRects: Array<{ x: number, y: number, width: number, height: number }>;
    isNearRightEdge?: boolean;
}

// Comparador para evitar re-renders innecesarios en React
const cursorsAreEqual = (a: CursorState[], b: CursorState[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const ca = a[i];
        const cb = b[i];
        if (ca.clientId !== cb.clientId ||
            ca.x !== cb.x ||
            ca.y !== cb.y ||
            ca.height !== cb.height ||
            ca.user.color !== cb.user.color ||
            ca.user.name !== cb.user.name ||
            ca.isNearRightEdge !== cb.isNearRightEdge ||
            ca.selectionRects.length !== cb.selectionRects.length) {
            return false;
        }
        for (let j = 0; j < ca.selectionRects.length; j++) {
            const ra = ca.selectionRects[j];
            const rb = cb.selectionRects[j];
            if (ra.x !== rb.x || ra.y !== rb.y || ra.width !== rb.width || ra.height !== rb.height) {
                return false;
            }
        }
    }
    return true;
};

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ editor, awareness, field = 'default' }) => {
    const [cursors, setCursors] = useState<CursorState[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const timeoutRef = useRef<any>(null);
    // Mapa clientId → último estado válido renderizado. Evita saltos al borrar texto.
    const lastValidCursorRef = useRef<Map<number, CursorState>>(new Map());

    const updateCursors = () => {
        if (!editor || !editor.view || !containerRef.current || !awareness) return;

        const states = awareness.getStates();
        const nextCursors: CursorState[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        // Mapa para deduplicar: si un mismo usuario+pestaña aparece con varios clientIDs (fantasmas),
        // nos quedamos con el más reciente (el clientId más alto suele ser el nuevo).
        const uniqueUsers = new Map<string, { clientId: number, state: any }>();

        states.forEach((state: any, clientId) => {
            if (clientId === awareness.clientID) return;

            const anchor = state[`anchor_${field}`];

            if (!state.user || typeof anchor !== 'number') return;

            // FILTRAR CURSOR: Dibujar el cursor únicamente si este campo es el enfocado por el usuario remoto
            if (state.focusedField !== field) return;

            const userKey = `${state.user.id}_${state.user.tabId || clientId}`;
            const existing = uniqueUsers.get(userKey);

            if (!existing || clientId > existing.clientId) {
                uniqueUsers.set(userKey, { clientId, state });
            }
        });

        const docSize = editor.state.doc.content.size;

        uniqueUsers.forEach(({ clientId, state }) => {
            try {
                const rawAnchor = state[`anchor_${field}`];
                const rawHead = state[`head_${field}`] ?? rawAnchor;

                if (typeof rawAnchor !== 'number') return;

                // Si la posición remota está fuera del documento local (borrado reciente),
                // reutilizamos la última posición válida renderizada para ESTE cursor.
                // Esto evita el salto al fondo del doc que producía clampear al docSize.
                if (rawHead < 0 || rawHead > docSize || rawAnchor < 0) {
                    const last = lastValidCursorRef.current.get(clientId);
                    if (last) nextCursors.push(last);
                    return;
                }

                const head = rawHead;
                const anchor = rawAnchor <= docSize ? rawAnchor : head;

                const coords = editor.view.coordsAtPos(head);
                if (!coords) return;

                const selectionRects: CursorState['selectionRects'] = [];
                // Solo dibujar el resaltado si la selección abarca más de 1 carácter.
                // Esto previene micro-resaltados fantasmas (de 1 carácter) causados por desincronizaciones de red durante la escritura fluida.
                if (Math.abs(anchor - head) > 1) {
                    const from = Math.min(anchor, head);
                    const to = Math.max(anchor, head);

                    try {
                        // Obtener los rangos del DOM y rectángulos exactos por cada línea (Multilínea Perfecto)
                        const start = editor.view.domAtPos(from);
                        const end = editor.view.domAtPos(to);

                        if (start && end) {
                            const range = document.createRange();
                            range.setStart(start.node, start.offset);
                            range.setEnd(end.node, end.offset);

                            const rects = range.getClientRects();
                            for (let i = 0; i < rects.length; i++) {
                                const rect = rects[i];
                                if (rect.width > 0 && rect.height > 0) {
                                    selectionRects.push({
                                        x: rect.left - containerRect.left,
                                        y: rect.top - containerRect.top,
                                        width: rect.width,
                                        height: rect.height
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // Fallback básico si falla la selección por DOM Range
                        const startCoords = editor.view.coordsAtPos(from);
                        const endCoords = editor.view.coordsAtPos(to);
                        if (startCoords && endCoords) {
                            if (startCoords.top === endCoords.top) {
                                selectionRects.push({
                                    x: startCoords.left - containerRect.left,
                                    y: startCoords.top - containerRect.top,
                                    width: endCoords.left - startCoords.left,
                                    height: startCoords.bottom - startCoords.top
                                });
                            } else {
                                selectionRects.push({
                                    x: startCoords.left - containerRect.left,
                                    y: startCoords.top - containerRect.top,
                                    width: containerRect.width - (startCoords.left - containerRect.left) - 40,
                                    height: startCoords.bottom - startCoords.top
                                });
                            }
                        }
                    }
                }

                const x = coords.left - containerRect.left;
                const y = coords.top - containerRect.top;
                const lineH = coords.bottom - coords.top;
                const badgeWidth = 220;
                const isNearRightEdge = x > (containerRect.width - badgeWidth) && x > badgeWidth;

                // Validar que la posición sea razonable (no NaN, no negativa extrema).
                // Coordenadas fuera de rango significan un estado de transición del DOM; conservamos la última.
                if (!isFinite(x) || !isFinite(y) || lineH <= 0 || lineH > 500) {
                    const last = lastValidCursorRef.current.get(clientId);
                    if (last) nextCursors.push(last);
                    return;
                }

                const cursorEntry: CursorState = {
                    clientId,
                    user: state.user,
                    anchor,
                    head,
                    x,
                    y,
                    height: lineH,
                    selectionRects,
                    isNearRightEdge
                };
                lastValidCursorRef.current.set(clientId, cursorEntry);
                nextCursors.push(cursorEntry);
            } catch (e) {
                // Silently catch errors for individual cursors to not crash others
            }
        });

        setCursors(prev => {
            if (cursorsAreEqual(prev, nextCursors)) {
                return prev;
            }
            return nextCursors;
        });
    };

    useEffect(() => {
        if (!editor || !awareness) return;

        let rafId: number | null = null;

        const handleUpdate = () => {
            const now = Date.now();
            const remaining = 30 - (now - lastUpdateRef.current);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            const scheduleUpdate = () => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    try {
                        updateCursors();
                    } catch (error: any) {
                        console.error(`[RemoteCursors:${field}] Error inside updateCursors:`, error);
                    }
                });
            };

            if (remaining <= 0) {
                lastUpdateRef.current = now;
                scheduleUpdate();
            } else {
                timeoutRef.current = setTimeout(() => {
                    timeoutRef.current = null;
                    lastUpdateRef.current = Date.now();
                    scheduleUpdate();
                }, remaining);
            }
        };

        // Escuchar actualizaciones del protocolo de awareness
        awareness.on('update', handleUpdate);

        // Escuchar redimensiones de la ventana
        window.addEventListener('resize', handleUpdate);

        // Escuchar cambios de contenido y de selección (después de actualizar el DOM)
        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);

        // Escuchar cambios de tamaño en el editor para cuando colapsan/expanden el sidebar
        const resizeObserver = new ResizeObserver(() => {
            handleUpdate();
        });

        if (editor?.view?.dom?.parentElement) {
            resizeObserver.observe(editor.view.dom.parentElement);
        }

        // Ejecutar primer renderizado al montar
        handleUpdate();

        return () => {
            awareness.off('update', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
            resizeObserver.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [editor, awareness, field]);

    if (!editor) return null;

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
            {cursors.map((cursor) => (
                <React.Fragment key={cursor.clientId}>
                    {/* ── Resaltado de Selección (Highlight) ── */}
                    {cursor.selectionRects.map((rect, i) => (
                        <div
                            key={i}
                            className="absolute opacity-25 rounded-[2px] pointer-events-none"
                            style={{
                                left: rect.x,
                                top: rect.y,
                                width: rect.width,
                                height: rect.height,
                                backgroundColor: cursor.user.color,
                            }}
                        />
                    ))}

                    {/* ── Cursor Line ── */}
                    <div
                        className="absolute"
                        style={{
                            left: `${cursor.x}px`,
                            top: `${cursor.y}px`,
                            height: `${cursor.height}px`
                        }}
                    >
                        {/* Línea Principal del Cursor */}
                        <div
                            className="w-[2.5px] h-full"
                            style={{ backgroundColor: cursor.user.color }}
                        />

                        {/* Etiqueta Flotante (Pill Style) */}
                        <div
                            className={`absolute top-0 px-2 py-1 rounded-full whitespace-nowrap text-[10px] font-black text-white shadow-lg flex items-center gap-1.5 ${
                                cursor.isNearRightEdge
                                    ? 'right-0 rounded-tr-none'
                                    : 'left-0 rounded-tl-none'
                            }`}
                            style={{
                                backgroundColor: cursor.user.color,
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                                transform: 'translateY(calc(-100% - 4px))'
                            }}
                        >
                            {/* Avatar/Iniciales Círculo */}
                            <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[8px]">
                                {cursor.user.initials}
                            </div>
                            <span className="tracking-tight">{cursor.user.name}</span>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};
