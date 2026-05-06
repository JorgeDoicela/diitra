// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Main Hook: useCoWork (v3.8 - Rendimiento y Estabilidad)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkConfig, CoWorkHandle, CoWorkSession, CoWorkUser } from '../types';
import type { ICoWorkTransport } from '../transport/ICoWorkTransport';
import { SignalRTransport } from '../transport/SignalRTransport';
import { getUserColor, getUserInitials } from '../config';

export function useCoWork(config: CoWorkConfig): CoWorkHandle {
    // 1. Estado de la sesión
    const [session, setSession] = useState<CoWorkSession>({
        documentId: config.documentId,
        isConnected: false,
        connectedUsers: [],
        isSyncing: false,
        lastSyncedAt: null,
        error: null,
    });

    // 2. Referencias persistentes (Lazy Initialization para evitar fugas de memoria)
    // Usamos refs que se inicializan solo cuando se necesitan
    const ydocRef = useRef<Y.Doc | null>(null);
    const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
    const transportRef = useRef<ICoWorkTransport | null>(null);

    // Getters para obtener las instancias (creándolas si no existen)
    const getYdoc = () => {
        if (!ydocRef.current) ydocRef.current = new Y.Doc();
        return ydocRef.current;
    };
    const getAwareness = () => {
        if (!awarenessRef.current) awarenessRef.current = new awarenessProtocol.Awareness(getYdoc());
        return awarenessRef.current;
    };
    const getTransport = () => {
        if (!transportRef.current) transportRef.current = new SignalRTransport();
        return transportRef.current;
    };

    // 3. Acciones del Handle
    const compact = useCallback(async () => {
        const update = Y.encodeStateAsUpdate(getYdoc());
        const base64 = btoa(String.fromCharCode(...update));
        await getTransport().submitFullSnapshot(config.documentId, base64);
    }, [config.documentId]);

    const submitFinalContent = useCallback(async (html: string, json: string) => {
        await getTransport().submitFinalContent(config.documentId, html, json);
    }, [config.documentId]);

    const disconnect = useCallback(() => {
        getTransport().disconnect();
    }, []);

    // 4. Ciclo de vida de la colaboración
    useEffect(() => {
        let isMounted = true;
        const ydoc = getYdoc();
        const awareness = getAwareness();
        const transport = getTransport();

        if (config.enabled) {
            console.log(`[useCoWork] 🚀 Motor activado: ${config.documentId}`);
        }

        const onYdocUpdate = (update: Uint8Array, origin: any) => {
            if (origin !== 'remote') {
                const base64 = btoa(String.fromCharCode(...update));
                transport.sendYjsUpdate(config.documentId, base64);
            }
        };

        const handleAwarenessUpdate = (_: any, origin: any) => {
            if (origin !== 'remote') {
                const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
                const base64 = btoa(String.fromCharCode(...update));
                transport.sendAwarenessUpdate(config.documentId, base64);
            }

            const states = awareness.getStates();
            const usersMap = new Map<string, CoWorkUser>();
            states.forEach((state: any) => {
                if (state.user) {
                    usersMap.set(state.user.id + (state.user.tabId || ""), state.user);
                }
            });

            // Diferir para evitar "Cannot update a component while rendering"
            setTimeout(() => {
                if (isMounted) {
                    setSession(s => ({ ...s, connectedUsers: Array.from(usersMap.values()) }));
                }
            }, 0);
        };

        transport.onYjsUpdate((base64) => {
            const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            Y.applyUpdate(ydoc, update, 'remote');
        });

        transport.onAwarenessUpdate((base64) => {
            const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            awarenessProtocol.applyAwarenessUpdate(awareness, update, 'remote');
        });

        transport.onUpdateHistory((updates) => {
            console.log(`[useCoWork] 📚 Historial: ${updates.length} deltas`);
            updates.forEach(base64 => {
                Y.applyUpdate(ydoc, Uint8Array.from(atob(base64), c => c.charCodeAt(0)), 'remote');
            });
            setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
        });

        const init = async () => {
            if (!config.enabled) return;
            try {
                await transport.connect(config.documentId, config.user);
                if (!isMounted) return;

                setSession(s => ({ ...s, isConnected: true, error: null }));
                
                awareness.setLocalStateField('user', {
                    ...config.user,
                    color: getUserColor(config.user.id),
                    initials: getUserInitials(config.user.name),
                    tabId: Math.random().toString(36).substring(7)
                });
                config.onSynced?.();
            } catch (err: any) {
                if (isMounted) setSession(s => ({ ...s, isConnected: false, error: err.message }));
            }
        };

        init();
        ydoc.on('update', onYdocUpdate);
        awareness.on('update', handleAwarenessUpdate);

        return () => {
            isMounted = false;
            ydoc.off('update', onYdocUpdate);
            awareness.off('update', handleAwarenessUpdate);
            transport.disconnect();
            console.log(`[useCoWork] 🛑 Cleanup: ${config.documentId}`);
        };
    }, [config.documentId, config.user.id, config.enabled]);

    return {
        session,
        ydoc: getYdoc(),
        awareness: getAwareness(),
        disconnect,
        submitFinalContent,
        compact,
    };
}
