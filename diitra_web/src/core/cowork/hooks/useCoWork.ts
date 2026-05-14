// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Main Hook: useCoWork (v3.9 - Isolation & Stability)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
        isConnected: false, // Se actualizará en el init inmediatamente
        connectedUsers: [],
        isSyncing: false,
        lastSyncedAt: null,
        error: null,
    });

    // 2. Referencias persistentes
    const ydocRef = useRef<Y.Doc | null>(null);
    const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
    const transportRef = useRef<ICoWorkTransport | null>(null);
    const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Getters seguros
    const getTransport = () => {
        if (!transportRef.current) transportRef.current = new SignalRTransport();
        return transportRef.current;
    };

    // 3. Acciones del Handle
    const compact = useCallback(async () => {
        if (!ydocRef.current) return;
        const update = Y.encodeStateAsUpdate(ydocRef.current);
        const base64 = btoa(String.fromCharCode(...update));
        await getTransport().submitFullSnapshot(config.documentId, base64);
    }, [config.documentId]);

    const submitFinalContent = useCallback((html: string, json: string) => {
        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

        submitTimerRef.current = setTimeout(async () => {
            try {
                console.log(`[useCoWork] Guardando snapshot en servidor para: ${config.documentId}...`);
                setSession(s => ({ ...s, isSyncing: true }));
                await getTransport().submitFinalContent(config.documentId, html, json);
                console.info(`[useCoWork] Snapshot guardado exitosamente.`);
                setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
            } catch (err) {
                console.error("[useCoWork] Error al guardar:", err);
                setSession(s => ({ ...s, isSyncing: false }));
            }
        }, 1500);
    }, [config.documentId]);

    const disconnect = useCallback(() => {
        if (transportRef.current) transportRef.current.disconnect();
    }, []);

    const notifySectionActivity = useCallback((instanceUuid: string, sectionName: string, action: string) => {
        return getTransport().notifySectionActivity(instanceUuid, sectionName, action, config.user.name);
    }, [config.user.name]);

    const updateSectionStatus = useCallback((instanceUuid: string, sectionName: string, status: string) => {
        return getTransport().updateSectionStatus(instanceUuid, sectionName, status, config.user.id);
    }, [config.user.id]);

    const postComment = useCallback((instanceUuid: string, content: string, parentId?: number) => {
        return getTransport().postComment(instanceUuid, config.user.id, config.user.name, content, parentId);
    }, [config.user.id, config.user.name]);

    const onSectionActivity = useCallback((handler: (data: any) => void) => {
        getTransport().onSectionActivity(handler);
    }, []);

    const onSectionStatusUpdated = useCallback((handler: (data: any) => void) => {
        getTransport().onSectionStatusUpdated(handler);
    }, []);

    const onNewCommentReceived = useCallback((handler: (data: any) => void) => {
        getTransport().onNewCommentReceived(handler);
    }, []);

    // 4. Ciclo de vida de la colaboración (Efecto Principal)
    useEffect(() => {
        let isMounted = true;
        let transport: ICoWorkTransport;
        let cleanupInterval: NodeJS.Timeout;
        let statusCleanup: (() => void) | undefined;

        const init = async () => {
            if (!config.enabled || !isMounted) return;

            console.log(`[useCoWork] Activando motor para sala: ${config.documentId}`);

            // A) LIMPIEZA EXTREMA: Destruir instancias previas para evitar fugas de datos
            if (ydocRef.current) {
                console.log(`[useCoWork] Limpiando sala anterior...`);
                ydocRef.current.destroy();
                ydocRef.current = null;
            }
            if (awarenessRef.current) {
                awarenessRef.current.destroy();
                awarenessRef.current = null;
            }

            // B) CREACIÓN: Nuevas instancias aisladas para esta sección
            const ydoc = new Y.Doc();
            const awareness = new awarenessProtocol.Awareness(ydoc);
            ydocRef.current = ydoc;
            awarenessRef.current = awareness;
            transport = getTransport();

            const syncUserList = () => {
                if (!isMounted || !awarenessRef.current) return;
                const states = awarenessRef.current.getStates();
                const usersMap = new Map<string, CoWorkUser>();
                states.forEach((state: any) => {
                    if (state.user) {
                        usersMap.set(state.user.id + (state.user.tabId || ""), state.user);
                    }
                });
                setSession(s => ({ ...s, connectedUsers: Array.from(usersMap.values()) }));
            };

            // C) EVENTOS DE ENTRADA (Desde el servidor)
            statusCleanup = transport.onStatusChange((isConnected) => {
                if (isMounted) {
                    console.log(`[useCoWork] Telemetría Real-Time: ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
                    setSession(s => (s.isConnected === isConnected ? s : { ...s, isConnected }));
                }
            });

            // Sincronizar estado inicial inmediatamente
            if (transport.isConnected) {
                setSession(s => ({ ...s, isConnected: true }));
            }

            transport.onYjsUpdate((base64) => {
                if (!isMounted || !ydocRef.current) return;
                const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                Y.applyUpdate(ydocRef.current, update, 'remote');
            });

            transport.onUpdateHistory((updates) => {
                if (!isMounted || !ydocRef.current) return;
                console.log(`[useCoWork] Sincronizando historial (${updates.length} deltas)`);
                ydocRef.current.transact(() => {
                    updates.forEach(base64 => {
                        const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                        Y.applyUpdate(ydocRef.current!, update, 'remote');
                    });
                }, 'remote');
                setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
            });

            transport.onAwarenessUpdate((base64) => {
                if (!isMounted || !awarenessRef.current) return;
                const update = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                awarenessProtocol.applyAwarenessUpdate(awarenessRef.current, update, 'remote');
                syncUserList(); // Refrescar al recibir de otros
            });

            // F) EVENTOS DE RED (Optimización de Sincronización)
            transport.onUserJoined?.((name) => {
                if (!isMounted || !awarenessRef.current) return;
                console.log(`[useCoWork] Nuevo usuario detectado (${name}), re-anunciando presencia local...`);
                
                // Forzar re-anuncio local para que el nuevo usuario nos vea de inmediato
                const localState = awarenessRef.current.getLocalState();
                if (localState) {
                    awarenessRef.current.setLocalState(localState);
                }
            });

            // G) LIMPIEZA DE "FANTASMAS" (Timeouts)
            cleanupInterval = setInterval(() => {
                if (isMounted && awarenessRef.current) {
                    const beforeCount = awarenessRef.current.getStates().size;
                    // Yjs awarenessProtocol.removeAwarenessStates no está disponible directamente como cleanup,
                    // pero podemos usar la lógica interna de Yjs si estuviera el provider.
                    // Como es manual, verificamos estados inactivos.
                    // Nota: y-protocols/awareness maneja internamente el tiempo si se usa correctamente.
                    // Forzamos un syncUserList para limpiar UI si Yjs ya los quitó.
                    syncUserList();
                }
            }, 5000);

            // D) EVENTOS DE SALIDA (Hacia el servidor)
            ydoc.on('update', (update, origin) => {
                if (origin !== 'remote' && isMounted) {
                    const base64 = btoa(String.fromCharCode(...update));
                    transport.sendYjsUpdate(config.documentId, base64);
                }
            });

            awareness.on('update', ({ added, updated, removed }, origin) => {
                if (isMounted) {
                    syncUserList(); // Refrescar siempre que algo cambie (local o remoto)
                    
                    if (origin !== 'remote') {
                        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
                            ...added, ...updated, ...removed
                        ]);
                        const base64 = btoa(String.fromCharCode(...update));
                        transport.sendAwarenessUpdate(config.documentId, base64);
                    }
                }
            });

            // E) CONEXIÓN (Handshake)
            try {
                // 4. Iniciar Conexión (Handshake)
                const handshake = await transport.connect(config.documentId, config.user);
                
                if (!isMounted) {
                    transport.disconnect();
                    return;
                }

                if (!handshake) throw new Error("Handshake fallido");

                const isReadOnly = (handshake as any).readOnly ?? (handshake as any).ReadOnly ?? false;
                const isBlindMode = (handshake as any).isBlindMode ?? (handshake as any).IsBlindMode ?? false;

                setSession(s => ({ 
                    ...s, 
                    isConnected: true, 
                    readOnly: isReadOnly, 
                    error: null 
                }));

                // Configurar Identidad (Blind Mode aware)
                // Usar sessionStorage para que el tabId sea persistente al refrescar la misma pestaña
                const sessionKey = `diitra_tab_id_${config.documentId}`;
                let tabId = sessionStorage.getItem(sessionKey);
                if (!tabId) {
                    tabId = Math.random().toString(36).substring(7);
                    sessionStorage.setItem(sessionKey, tabId);
                }
                
                const userToAnnounce = { ...config.user, tabId };

                if (isBlindMode) {
                    const prefix = config.user.role === 'Revisor' ? 'Revisor Anónimo' : 'Investigador (Autor)';
                    userToAnnounce.name = `${prefix} #${tabId.substring(0, 3)}`;
                }

                // Aunciar presencia local
                awareness.setLocalStateField('user', {
                    ...userToAnnounce,
                    color: getUserColor(config.user.id, tabId),
                    initials: getUserInitials(userToAnnounce.name),
                    tabId: tabId
                });

                // FORZAR SINCRONIZACIÓN INICIAL:
                // 1. Inmediata para capturar lo que ya llegó
                syncUserList();
                // 2. Retrasada para capturar estados que lleguen con latencia de red
                setTimeout(() => {
                    if (isMounted) syncUserList();
                }, 1000);

                if (handshake.deltaCount > 500) compact();
                config.onSynced?.();

            } catch (err: any) {
                console.error("[useCoWork] Error de conexión:", err);
                if (isMounted) setSession(s => ({ ...s, isConnected: false, error: err.message }));
            }
        };

        init();

        return () => {
            console.log(`[useCoWork] Cleanup sala: ${config.documentId}`);
            isMounted = false;
            clearInterval(cleanupInterval);
            if (statusCleanup) statusCleanup();
            if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
            if (transport) transport.disconnect();
        };
    }, [config.documentId, config.enabled]); // <--- CRÍTICO: Re-ejecutar al cambiar de sala

    return useMemo(() => ({
        session,
        ydoc: ydocRef.current,
        awareness: awarenessRef.current,
        compact,
        submitFinalContent,
        disconnect,
        notifySectionActivity,
        updateSectionStatus,
        postComment,
        onSectionActivity,
        onSectionStatusUpdated,
        onNewCommentReceived
    }), [
        session, compact, submitFinalContent, disconnect, 
        notifySectionActivity, updateSectionStatus, postComment,
        onSectionActivity, onSectionStatusUpdated, onNewCommentReceived
    ]);
}
