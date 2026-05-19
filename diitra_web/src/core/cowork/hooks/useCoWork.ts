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
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';

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

    // 2. Referencias persistentes
    const ydocRef = useRef<Y.Doc | null>(null);
    const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
    const activeTransportRef = useRef<ICoWorkTransport | null>(null);
    const submitTimerRef = useRef<any>(null);

    // Getters seguros para el handle
    const getTransport = () => {
        if (!activeTransportRef.current) {
            activeTransportRef.current = new SignalRTransport();
        }
        return activeTransportRef.current;
    };

    // 3. Acciones del Handle
    const compact = useCallback(async () => {
        if (!ydocRef.current) return;
        const update = Y.encodeStateAsUpdate(ydocRef.current);
        const base64 = uint8ArrayToBase64(update);
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
        if (activeTransportRef.current) activeTransportRef.current.disconnect();
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

    // 4. Ciclo de vida de la colaboración (Efecto Principal Aislado)
    useEffect(() => {
        let isMounted = true;

        if (!config.enabled) return;

        console.log(`[useCoWork] Activando motor para sala: ${config.documentId}`);

        // A) CREACIÓN: Instancias aisladas exclusivas de este ciclo de efecto
        const transport = new SignalRTransport();
        activeTransportRef.current = transport;

        const ydoc = new Y.Doc();
        const awareness = new awarenessProtocol.Awareness(ydoc);
        ydocRef.current = ydoc;
        awarenessRef.current = awareness;

        let cleanupInterval: any;
        let statusCleanup: (() => void) | undefined;

        const init = async () => {
            if (!isMounted) return;

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

            // B) EVENTOS DE ENTRADA
            statusCleanup = transport.onStatusChange((isConnected) => {
                if (isMounted) {
                    console.log(`[useCoWork] Telemetría Real-Time: ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
                    setSession(s => (s.isConnected === isConnected ? s : { ...s, isConnected }));
                }
            });

            if (transport.isConnected) {
                setSession(s => ({ ...s, isConnected: true }));
            }

            transport.onYjsUpdate((base64) => {
                if (!isMounted || ydocRef.current !== ydoc) return;
                const update = base64ToUint8Array(base64);
                Y.applyUpdate(ydoc, update, 'remote');
            });

            transport.onUpdateHistory((updates) => {
                if (!isMounted || ydocRef.current !== ydoc) return;
                console.log(`[useCoWork] Sincronizando historial (${updates.length} deltas)`);
                ydoc.transact(() => {
                    updates.forEach(base64 => {
                        const update = base64ToUint8Array(base64);
                        Y.applyUpdate(ydoc, update, 'remote');
                    });
                }, 'remote');
                setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
            });

            transport.onAwarenessUpdate((base64) => {
                if (!isMounted || awarenessRef.current !== awareness) return;
                const update = base64ToUint8Array(base64);
                awarenessProtocol.applyAwarenessUpdate(awareness, update, 'remote');
                syncUserList();
            });

            transport.onUserJoined?.((name) => {
                if (!isMounted || awarenessRef.current !== awareness) return;
                console.log(`[useCoWork] Nuevo usuario detectado (${name}), re-anunciando presencia local...`);
                const localState = awareness.getLocalState();
                if (localState) {
                    awareness.setLocalState(localState);
                }
            });

            cleanupInterval = setInterval(() => {
                if (isMounted) {
                    syncUserList();
                }
            }, 5000);

            // C) EVENTOS DE SALIDA
            ydoc.on('update', (update, origin) => {
                if (origin !== 'remote' && isMounted) {
                    const base64 = uint8ArrayToBase64(update);
                    transport.sendYjsUpdate(config.documentId, base64);
                }
            });

            awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
                if (isMounted) {
                    syncUserList();
                    if (origin !== 'remote') {
                        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
                            ...added, ...updated, ...removed
                        ]);
                        const base64 = uint8ArrayToBase64(update);
                        transport.sendAwarenessUpdate(config.documentId, base64);
                    }
                }
            });

            // D) CONEXIÓN (Handshake)
            try {
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
                    isBlindMode: isBlindMode,
                    error: null
                }));

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

                awareness.setLocalStateField('user', {
                    ...userToAnnounce,
                    color: getUserColor(config.user.id, tabId),
                    initials: getUserInitials(userToAnnounce.name),
                    tabId: tabId
                });

                syncUserList();
                setTimeout(() => {
                    if (isMounted) syncUserList();
                }, 1000);

                if (handshake.deltaCount > 500) compact();

                transport.onCompactionTrigger?.(() => {
                    if (isMounted) {
                        console.log("[useCoWork] Servidor solicitó compactación reactiva automática por acumulación de deltas.");
                        compact();
                    }
                });

                config.onSynced?.();

            } catch (err: any) {
                console.error("[useCoWork] Error de conexión:", err);
                if (isMounted) setSession(s => ({ ...s, isConnected: false, error: err.message }));
            }
        };

        init();

        // E) LIMPIEZA EXTREMA: Desconectar y destruir SOLO los recursos de este efecto
        return () => {
            console.log(`[useCoWork] Cleanup sala: ${config.documentId}`);
            isMounted = false;
            clearInterval(cleanupInterval);
            if (statusCleanup) statusCleanup();
            if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

            ydoc.destroy();
            awareness.destroy();

            // Nullificar la referencia central únicamente si no ha sido ya suplantada por un efecto posterior
            if (ydocRef.current === ydoc) ydocRef.current = null;
            if (awarenessRef.current === awareness) awarenessRef.current = null;

            transport.disconnect();
            if (activeTransportRef.current === transport) activeTransportRef.current = null;
        };
    }, [config.documentId, config.enabled]);

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
