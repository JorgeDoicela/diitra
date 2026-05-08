import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkUser } from '../types';

interface RemoteCursorsProps {
    editor: Editor | null;
    awareness: awarenessProtocol.Awareness | null;
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
        if (!editor || !editor.view || !containerRef.current || !awareness) return;

        const states = awareness.getStates();
        const nextCursors: CursorState[] = [];
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Mapa para deduplicar: si un mismo usuario+pestaña aparece con varios clientIDs (fantasmas), 
        // nos quedamos con el más reciente (el clientId más alto suele ser el nuevo).
        const uniqueUsers = new Map<string, { clientId: number, state: any }>();

        states.forEach((state: any, clientId) => {
            if (clientId === awareness.clientID) return;
            if (!state.user || typeof state.anchor !== 'number') return;

            const userKey = `${state.user.id}_${state.user.tabId || clientId}`;
            const existing = uniqueUsers.get(userKey);
            
            if (!existing || clientId > existing.clientId) {
                uniqueUsers.set(userKey, { clientId, state });
            }
        });

        uniqueUsers.forEach(({ clientId, state }) => {
            try {
                const head = state.head ?? state.anchor;
                const coords = editor.view.coordsAtPos(head);
                
                const selectionRects: CursorState['selectionRects'] = [];
                if (state.anchor !== head) {
                    const from = Math.min(state.anchor, head);
                    const to = Math.max(state.anchor, head);
                    
                    // Obtener rectángulos de selección reales del DOM para mayor precisión
                    const range = editor.view.state.doc.slice(from, to);
                    if (range) {
                        const startCoords = editor.view.coordsAtPos(from);
                        const endCoords = editor.view.coordsAtPos(to);

                        if (startCoords.top === endCoords.top) {
                            selectionRects.push({
                                x: startCoords.left - containerRect.left,
                                y: startCoords.top - containerRect.top,
                                width: endCoords.left - startCoords.left,
                                height: startCoords.bottom - startCoords.top
                            });
                        } else {
                            // Multilínea simplificado para evitar flickering
                            selectionRects.push({
                                x: startCoords.left - containerRect.left,
                                y: startCoords.top - containerRect.top,
                                width: containerRect.width - (startCoords.left - containerRect.left) - 40,
                                height: startCoords.bottom - startCoords.top
                            });
                        }
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
            } catch (e) {}
        });

        setCursors(nextCursors);
    };

    useEffect(() => {
        if (!editor || !awareness) return;
        const handleUpdate = () => updateCursors();
        
        awareness.on('update', handleUpdate);
        window.addEventListener('resize', handleUpdate);
        const interval = setInterval(handleUpdate, 80); // Mayor frecuencia para suavidad

        return () => {
            awareness.off('update', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
            clearInterval(interval);
        };
    }, [editor, awareness]);

    if (!editor) return null;

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
            {cursors.map((cursor) => (
                <React.Fragment key={cursor.clientId}>
                    {/* ── Resaltado de Selección (Highlight) ── */}
                    {cursor.selectionRects.map((rect, i) => (
                        <div 
                            key={i}
                            className="absolute opacity-20 transition-all duration-200 rounded-[2px]"
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
                        className="absolute transition-all duration-150 ease-out"
                        style={{ 
                            left: `${cursor.x}px`, 
                            top: `${cursor.y}px`,
                            height: `${cursor.height}px` 
                        }}
                    >
                        {/* Línea Principal con Pulso */}
                        <div 
                            className="w-[2.5px] h-full relative"
                            style={{ backgroundColor: cursor.user.color }}
                        >
                            {/* Efecto de Pulso en la punta */}
                            <div 
                                className="absolute -top-1 -left-[3px] w-2.5 h-2.5 rounded-full animate-ping opacity-40"
                                style={{ backgroundColor: cursor.user.color }}
                            />
                        </div>

                        {/* Etiqueta Flotante (Pill Style) */}
                        <div 
                            className="absolute top-0 left-0 px-2 py-1 rounded-full rounded-tl-none whitespace-nowrap text-[10px] font-black text-white shadow-lg flex items-center gap-1.5 transform -translate-y-[110%] transition-transform hover:scale-105"
                            style={{ 
                                backgroundColor: cursor.user.color,
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
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

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};
