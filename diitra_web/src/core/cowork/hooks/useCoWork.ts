// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Main Hook: useCoWork (v3.6 - Estabilidad Final)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkConfig, CoWorkHandle, CoWorkSession, CoWorkUser } from '../types';
import type { ICoWorkTransport } from '../transport/ICoWorkTransport';
import { SignalRTransport } from '../transport/SignalRTransport';
import { getUserColor, getUserInitials } from '../config';

export function useCoWork(config: CoWorkConfig): CoWorkHandle {
    const [session, setSession] = useState<CoWorkSession>({
        documentId: config.documentId,
        isConnected: false,
        connectedUsers: [],
        isSyncing: false,
        lastSyncedAt: null,
        error: null,
    });

    // Mantener referencias estables para evitar ciclos de renderizado
    const ydocRef = useRef<Y.Doc>(new Y.Doc());
    const awarenessRef = useRef<awarenessProtocol.Awareness>(new awarenessProtocol.Awareness(ydocRef.current));
    const transportRef = useRef<ICoWorkTransport>(new SignalRTransport());

    const compact = useCallback(async () => {
        const update = Y.encodeStateAsUpdate(ydocRef.current);
        const base64 = btoa(String.fromCharCode(...update));
        await transportRef.current.submitFullSnapshot(config.documentId, base64);
    }, [config.documentId]);

    const submitFinalContent = useCallback(async (html: string, json: string) => {
        await transportRef.current.submitFinalContent(config.documentId, html, json);
    }, [config.documentId]);

    const disconnect = useCallback(() => {
        transportRef.current.disconnect();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const ydoc = ydocRef.current;
        const awareness = awarenessRef.current;
        const transport = transportRef.current;

        // Logging de diagnóstico
        if (config.enabled) {
            console.log(`[useCoWork] 🚀 Motor activado para sala: ${config.documentId}`);
        } else {
            console.log(`[useCoWork] 💤 Motor en espera de sección...`);
        }

        const onYdocUpdate = (update: Uint8Array, origin: any) => {
            if (origin !== 'remote') {
                const base64 = btoa(String.fromCharCode(...update));
                transport.sendYjsUpdate(config.documentId, base64);
            }
        };

        const onAwarenessUpdate = () => {
            const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            const base64 = btoa(String.fromCharCode(...update));
            transport.sendAwarenessUpdate(config.documentId, base64);
        };

        // Suscribir eventos de transporte
        transport.onYjsUpdate((updateBase64) => {
            const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
            Y.applyUpdate(ydoc, update, 'remote');
        });

        transport.onAwarenessUpdate((updateBase64) => {
            const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
            awarenessProtocol.applyAwarenessUpdate(awareness, update, 'remote');
        });

        transport.onUpdateHistory((updatesBase64) => {
            console.log(`[useCoWork] 📚 Historial cargado: ${updatesBase64.length} actualizaciones`);
            updatesBase64.forEach(base64 => {
                const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                Y.applyUpdate(ydoc, update, 'remote');
            });
            setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
        });

        const init = async () => {
            if (!config.enabled) return;

            try {
                await transport.connect(config.documentId, config.user);
                if (!isMounted) return;

                setSession(s => ({ ...s, isConnected: true, error: null }));
                console.info(`[useCoWork] ✅ Conectado con éxito.`);

                const coworkUser: CoWorkUser = {
                    id: config.user.id,
                    name: config.user.name,
                    role: config.user.role,
                    color: getUserColor(config.user.id),
                    initials: getUserInitials(config.user.name),
                };
                awareness.setLocalStateField('user', coworkUser);
                config.onSynced?.();
            } catch (err: any) {
                if (!isMounted) return;
                if (err?.name === 'AbortError' || err?.message?.includes('stop()')) return;

                console.error("[useCoWork] ❌ Fallo en conexión:", err);
                setSession(s => ({ ...s, isConnected: false, error: err.message }));
                config.onError?.(err.message);
            }
        };

        init();

        ydoc.on('update', onYdocUpdate);
        awareness.on('update', onAwarenessUpdate);

        return () => {
            isMounted = false;
            ydoc.off('update', onYdocUpdate);
            awareness.off('update', onAwarenessUpdate);
            transport.disconnect();
            console.log(`[useCoWork] 🛑 Cleanup sala: ${config.documentId}`);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.documentId, config.user.id, config.enabled]);

    return {
        session,
        ydoc: ydocRef.current,
        awareness: awarenessRef.current,
        disconnect,
        submitFinalContent,
        compact,
    };
}
