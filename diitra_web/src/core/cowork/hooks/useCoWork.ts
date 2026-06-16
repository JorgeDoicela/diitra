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

    // 2. Estado reactivo del Yjs Doc y Awareness (CORRECCIÓN: no son simples refs)
    // Deben ser estado para que el useMemo del return y los consumers (useDIITRADocument)
    // reciban el nuevo ydoc cuando SignalR reconecta y crea nuevas instancias.
    const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
    const [awareness, setAwareness] = useState<awarenessProtocol.Awareness | null>(null);

    // Referencias internas para uso dentro del efecto (sin causar loops)
    const ydocRef = useRef<Y.Doc | null>(null);
    const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
    const activeTransportRef = useRef<ICoWorkTransport | null>(null);
    const submitTimerRef = useRef<any>(null);
    const lastContentRef = useRef<{ html: string; json: string; fieldName?: string } | null>(null);
    const hasUnsavedContentRef = useRef<boolean>(false);

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

    const submitFinalContent = useCallback((html: string, json: string, fieldName?: string) => {
        // Build the per-field storage key: {documentId}_{fieldName} or just {documentId}
        const storageKey = fieldName ? `${config.documentId}_${fieldName}` : config.documentId;

        lastContentRef.current = { html, json, fieldName };
        hasUnsavedContentRef.current = true;

        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

        submitTimerRef.current = setTimeout(async () => {
            try {
                console.log(`[useCoWork] Guardando snapshot en servidor para: ${storageKey}...`);
                setSession(s => ({ ...s, isSyncing: true }));
                await getTransport().submitFinalContent(storageKey, html, json);
                console.info(`[useCoWork] Snapshot guardado exitosamente.`);
                hasUnsavedContentRef.current = false;
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
        return getTransport().updateSectionStatus(instanceUuid, sectionName, status, config.user.id, config.user.name);
    }, [config.user.id, config.user.name]);

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

        const newYdoc = new Y.Doc();
        const newAwareness = new awarenessProtocol.Awareness(newYdoc);
        ydocRef.current = newYdoc;
        awarenessRef.current = newAwareness;

        // Notificar a React que tenemos nuevas instancias reactivas
        setYdoc(newYdoc);
        setAwareness(newAwareness);

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
                if (!isMounted || ydocRef.current !== newYdoc) return;
                const update = base64ToUint8Array(base64);
                Y.applyUpdate(newYdoc, update, 'remote');
            });

            transport.onUpdateHistory((updates) => {
                if (!isMounted || ydocRef.current !== newYdoc) return;
                console.log(`[useCoWork] Sincronizando historial (${updates.length} deltas)`);
                newYdoc.transact(() => {
                    updates.forEach(base64 => {
                        const update = base64ToUint8Array(base64);
                        Y.applyUpdate(newYdoc, update, 'remote');
                    });
                }, 'remote');
                setSession(s => ({ ...s, isSyncing: false, lastSyncedAt: new Date() }));
            });

            transport.onAwarenessUpdate((base64) => {
                if (!isMounted || awarenessRef.current !== newAwareness) return;
                const update = base64ToUint8Array(base64);
                awarenessProtocol.applyAwarenessUpdate(newAwareness, update, 'remote');
                syncUserList();
            });

            transport.onUserJoined?.((name) => {
                if (!isMounted || awarenessRef.current !== newAwareness) return;
                console.log(`[useCoWork] Nuevo usuario detectado (${name}), re-anunciando presencia local...`);
                const localState = newAwareness.getLocalState();
                if (localState) {
                    newAwareness.setLocalState(localState);
                }
            });

            cleanupInterval = setInterval(() => {
                if (isMounted) {
                    syncUserList();
                }
            }, 5000);

            // C) EVENTOS DE SALIDA
            newYdoc.on('update', (update, origin) => {
                if (origin !== 'remote' && isMounted) {
                    const base64 = uint8ArrayToBase64(update);
                    transport.sendYjsUpdate(config.documentId, base64);
                }
            });

            newAwareness.on('update', ({ added, updated, removed }: any, origin: any) => {
                if (isMounted) {
                    syncUserList();
                    if (origin !== 'remote') {
                        const update = awarenessProtocol.encodeAwarenessUpdate(newAwareness, [
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

                const isReadOnly = config.readonly || (handshake as any).readOnly || (handshake as any).ReadOnly || false;
                const isBlindMode = (handshake as any).isBlindMode ?? (handshake as any).IsBlindMode ?? false;
                const isOversightObserver = (handshake as any).isOversightObserver ?? (handshake as any).IsOversightObserver ?? false;

                setSession(s => ({
                    ...s,
                    isConnected: true,
                    readOnly: isReadOnly,
                    isBlindMode: isBlindMode,
                    isOversightObserver: isOversightObserver,
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

                newAwareness.setLocalStateField('user', {
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

            newYdoc.destroy();
            newAwareness.destroy();

            // Nullificar referencias internas y estado reactivo
            if (ydocRef.current === newYdoc) {
                ydocRef.current = null;
                setYdoc(null);
            }
            if (awarenessRef.current === newAwareness) {
                awarenessRef.current = null;
                setAwareness(null);
            }

            // Guardar cambios pendientes de CoWork antes de cerrar físicamente la conexión
            (async () => {
                if (hasUnsavedContentRef.current && lastContentRef.current) {
                    const { html, json, fieldName } = lastContentRef.current;
                    const storageKey = fieldName ? `${config.documentId}_${fieldName}` : config.documentId;
                    console.log(`[useCoWork] Desmontando: Forzando guardado de snapshot antes de desconectar para: ${storageKey}...`);
                    try {
                        await transport.submitFinalContent(storageKey, html, json);
                        console.log(`[useCoWork] Desmontado: Snapshot guardado forzadamente.`);
                    } catch (err) {
                        console.error("[useCoWork] Error al forzar guardado de snapshot:", err);
                    }
                }
                console.log(`[useCoWork] Desconectando transporte para sala: ${config.documentId}`);
                await transport.disconnect();
                if (activeTransportRef.current === transport) activeTransportRef.current = null;
            })();
        };
    }, [config.documentId, config.enabled]);

    return useMemo(() => ({
        session,
        ydoc,        // ← Estado reactivo: React re-renderiza cuando cambia
        awareness,   // ← Estado reactivo: React re-renderiza cuando cambia
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
        session, ydoc, awareness,   // ← ydoc y awareness son dependencias reactivas
        compact, submitFinalContent, disconnect,
        notifySectionActivity, updateSectionStatus, postComment,
        onSectionActivity, onSectionStatusUpdated, onNewCommentReceived
    ]);
}
