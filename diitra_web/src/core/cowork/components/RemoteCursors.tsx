import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkUser } from '../types';

interface RemoteCursorsProps {
    editor: Editor | null;
    awareness: awarenessProtocol.Awareness;
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
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ editor, awareness }) => {
    const [cursors, setCursors] = useState<CursorState[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateCursors = () => {
        if (!editor || !editor.view || !containerRef.current) return;

        const states = awareness.getStates();
        const nextCursors: CursorState[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        states.forEach((state: any, clientId) => {
            if (clientId === awareness.clientID) return;
            if (!state.user || typeof state.anchor !== 'number') return;

            try {
                // 1. Posición del Cursor (Caret)
                const head = state.head ?? state.anchor;
                const coords = editor.view.coordsAtPos(head);
                
                // 2. Rectángulos de Selección (Highlight)
                const selectionRects: CursorState['selectionRects'] = [];
                if (state.anchor !== head) {
                    const from = Math.min(state.anchor, head);
                    const to = Math.max(state.anchor, head);
                    
                    // Usar la API de ProseMirror para obtener rectángulos de una selección
                    // Esto es mucho más preciso que hacerlo manualmente
                    const startCoords = editor.view.coordsAtPos(from);
                    const endCoords = editor.view.coordsAtPos(to);

                    if (startCoords.top === endCoords.top) {
                        // Selección en la misma línea
                        selectionRects.push({
                            x: startCoords.left - containerRect.left,
                            y: startCoords.top - containerRect.top,
                            width: endCoords.left - startCoords.left,
                            height: startCoords.bottom - startCoords.top
                        });
                    } else {
                        // Selección multilínea (simplificada para rendimiento enterprise)
                        // En una versión más compleja usaríamos getClientRects() del DOM
                        selectionRects.push({
                            x: startCoords.left - containerRect.left,
                            y: startCoords.top - containerRect.top,
                            width: containerRect.width - (startCoords.left - containerRect.left) - 40,
                            height: startCoords.bottom - startCoords.top
                        });
                    }
                }

                nextCursors.push({
                    clientId,
                    user: state.user,
                    anchor: state.anchor,
                    head,
                    x: coords.left - containerRect.left,
                    y: coords.top - containerRect.top,
                    height: coords.bottom - coords.top,
                    selectionRects
                });
            } catch (e) {
                // Evitar crashes si el documento cambia rápido
            }
        });

        setCursors(nextCursors);
    };

    useEffect(() => {
        const handleUpdate = () => updateCursors();
        awareness.on('update', handleUpdate);
        window.addEventListener('resize', handleUpdate);
        const interval = setInterval(handleUpdate, 100);

        return () => {
            awareness.off('update', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
            clearInterval(interval);
        };
    }, [editor, awareness]);

    if (!editor) return null;

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {cursors.map((cursor) => (
                <React.Fragment key={cursor.clientId}>
                    {/* Resaltado de Selección (Highlight) */}
                    {cursor.selectionRects.map((rect, i) => (
                        <div 
                            key={i}
                            className="absolute opacity-20 transition-all duration-150"
                            style={{
                                left: rect.x,
                                top: rect.y,
                                width: rect.width,
                                height: rect.height,
                                backgroundColor: cursor.user.color,
                            }}
                        />
                    ))}

                    {/* Línea del Cursor y Etiqueta */}
                    <div 
                        className="absolute transition-all duration-100 ease-out"
                        style={{ 
                            left: `${cursor.x}px`, 
                            top: `${cursor.y}px`,
                            height: `${cursor.height}px` 
                        }}
                    >
                        <div 
                            className="w-[2px] h-full"
                            style={{ backgroundColor: cursor.user.color }}
                        />
                        <div 
                            className="absolute top-0 left-0 px-1.5 py-0.5 rounded-sm rounded-tl-none whitespace-nowrap text-[10px] font-bold text-white shadow-md transform -translate-y-full flex items-center gap-1"
                            style={{ backgroundColor: cursor.user.color }}
                        >
                            <span className="opacity-80">{cursor.user.initials}</span>
                            <span>{cursor.user.name}</span>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};
