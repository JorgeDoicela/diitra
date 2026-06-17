// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Main Hook: useCoWork (v4.0 — no ghost transport, conditional logs)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import type { CoWorkConfig, CoWorkHandle, CoWorkSession, CoWorkUser } from '../types';
import type { ICoWorkTransport } from '../transport/ICoWorkTransport';
import { SignalRTransport } from '../transport/SignalRTransport';
import { COWORK_CONFIG, getUserColor, getUserInitials } from '../config';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
import { coworkLog } from '../utils/log';

type SharedTransportEntry = {
    transport: ICoWorkTransport;
    refs: number;
    releaseTimer: ReturnType<typeof setTimeout> | null;
};

const sharedTransportByDocument = new Map<string, SharedTransportEntry>();

function normalizeDocumentId(documentId: string): string {
    return (documentId || '').toLowerCase().trim();
}

function acquireSharedTransport(documentId: string): ICoWorkTransport {
    const key = normalizeDocumentId(documentId);
    let entry = sharedTransportByDocument.get(key);

    if (!entry) {
        entry = {
            transport: new SignalRTransport(),
            refs: 0,
            releaseTimer: null
        };
        sharedTransportByDocument.set(key, entry);
    }

    if (entry.releaseTimer) {
        clearTimeout(entry.releaseTimer);
        entry.releaseTimer = null;
    }

    entry.refs += 1;
    return entry.transport;
}

function releaseSharedTransport(documentId: string, transport: ICoWorkTransport) {
    const key = normalizeDocumentId(documentId);
    const entry = sharedTransportByDocument.get(key);
    if (!entry || entry.transport !== transport) return;

    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs > 0) return;

    entry.releaseTimer = setTimeout(async () => {
        const current = sharedTransportByDocument.get(key);
        if (!current || current.transport !== transport || current.refs > 0) return;
        try {
            await transport.disconnect();
        } finally {
            sharedTransportByDocument.delete(key);
        }
    }, COWORK_CONFIG.TRANSPORT_RELEASE_GRACE_MS);
}

export function useCoWork(config: CoWorkConfig): CoWorkHandle {
    const [session, setSession] = useState<CoWorkSession>({
        documentId: config.documentId,
        isConnected: false,
        connectedUsers: [],
        isSyncing: false,
        lastSyncedAt: null,
        error: null,
    });

    const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
    const [awareness, setAwareness] = useState<awarenessProtocol.Awareness | null>(null);

    const ydocRef = useRef<Y.Doc | null>(null);
    const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
    const activeTransportRef = useRef<ICoWorkTransport | null>(null);
    const submitTimerRef = useRef<any>(null);
    const lastContentRef = useRef<{ html: string; json: string; fieldName?: string } | null>(null);
    const hasUnsavedContentRef = useRef<boolean>(false);

    const compact = useCallback(async () => {
        const transport = activeTransportRef.current;
        if (!ydocRef.current || !transport) return;
        const update = Y.encodeStateAsUpdate(ydocRef.current);
        const base64 = uint8ArrayToBase64(update);
        await transport.submitFullSnapshot(config.documentId, base64);
    }, [config.documentId]);

    const submitFinalContent = useCallback((html: string, json: string, fieldName?: string) => {
        const storageKey = fieldName ? `${config.documentId}_${fieldName}` : config.documentId;

        lastContentRef.current = { html, json, fieldName };
        hasUnsavedContentRef.current = true;

        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

        submitTimerRef.current = setTimeout(async () => {
            const transport = activeTransportRef.current;
            if (!transport) return;
            try {
                coworkLog(`[useCoWork] Saving snapshot: ${storageKey}`);
                setSession(s => ({ ...s, isSyncing: true }));
                await transport.submitFinalContent(storageKey, html, json);
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
        const transport = activeTransportRef.current;
        if (!transport) return Promise.resolve();
        return transport.notifySectionActivity(instanceUuid, sectionName, action, config.user.name);
    }, [config.user.name]);

    const updateSectionStatus = useCallback((instanceUuid: string, sectionName: string, status: string) => {
        const transport = activeTransportRef.current;
        if (!transport) return Promise.resolve();
        return transport.updateSectionStatus(instanceUuid, sectionName, status, config.user.id, config.user.name);
    }, [config.user.id, config.user.name]);

    const postComment = useCallback((instanceUuid: string, content: string, parentId?: number) => {
        const transport = activeTransportRef.current;
        if (!transport) return Promise.resolve();
        return transport.postComment(instanceUuid, config.user.id, config.user.name, content, parentId);
    }, [config.user.id, config.user.name]);

    const onSectionActivity = useCallback((handler: (data: any) => void) => {
        const transport = activeTransportRef.current;
        if (!transport) return;
        transport.onSectionActivity(handler);
    }, []);

    const onSectionStatusUpdated = useCallback((handler: (data: any) => void) => {
        const transport = activeTransportRef.current;
        if (!transport) return;
        transport.onSectionStatusUpdated(handler);
    }, []);

    const onNewCommentReceived = useCallback((handler: (data: any) => void) => {
        const transport = activeTransportRef.current;
        if (!transport) return;
        transport.onNewCommentReceived(handler);
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!config.enabled) return;

        coworkLog(`[useCoWork] Starting engine for room: ${config.documentId}`);

        const transport = acquireSharedTransport(config.documentId);
        activeTransportRef.current = transport;
        let transportReleased = false;

        const releaseTransportSafely = () => {
            if (transportReleased) return;
            transportReleased = true;
            releaseSharedTransport(config.documentId, transport);
            if (activeTransportRef.current === transport) {
                activeTransportRef.current = null;
            }
        };

        const newYdoc = new Y.Doc();
        const newAwareness = new awarenessProtocol.Awareness(newYdoc);
        ydocRef.current = newYdoc;
        awarenessRef.current = newAwareness;

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

            statusCleanup = transport.onStatusChange((isConnected) => {
                if (isMounted) {
                    coworkLog(`[useCoWork] Real-Time: ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
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
                coworkLog(`[useCoWork] Syncing history (${updates.length} deltas)`);
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
                coworkLog(`[useCoWork] User joined (${name}), re-announcing presence`);
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

            try {
                const handshake = await transport.connect(config.documentId, config.user);

                if (!isMounted) {
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

                if (handshake.deltaCount > COWORK_CONFIG.COMPACTION_DELTA_THRESHOLD) compact();

                transport.onCompactionTrigger?.(() => {
                    if (isMounted) {
                        coworkLog("[useCoWork] Server requested reactive compaction");
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

        return () => {
            coworkLog(`[useCoWork] Cleanup room: ${config.documentId}`);
            isMounted = false;
            clearInterval(cleanupInterval);
            if (statusCleanup) statusCleanup();
            if (submitTimerRef.current) clearTimeout(submitTimerRef.current);

            newYdoc.destroy();
            newAwareness.destroy();

            if (ydocRef.current === newYdoc) {
                ydocRef.current = null;
                setYdoc(null);
            }
            if (awarenessRef.current === newAwareness) {
                awarenessRef.current = null;
                setAwareness(null);
            }

            (async () => {
                if (hasUnsavedContentRef.current && lastContentRef.current) {
                    const { html, json, fieldName } = lastContentRef.current;
                    const storageKey = fieldName ? `${config.documentId}_${fieldName}` : config.documentId;
                    coworkLog(`[useCoWork] Unmounting: force-saving snapshot for: ${storageKey}`);
                    try {
                        await transport.submitFinalContent(storageKey, html, json);
                    } catch (err) {
                        console.error("[useCoWork] Error al forzar guardado de snapshot:", err);
                    }
                }
                releaseTransportSafely();
            })();
        };
    }, [config.documentId, config.enabled]);

    return useMemo(() => ({
        session,
        ydoc,
        awareness,
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
        session, ydoc, awareness,
        compact, submitFinalContent, disconnect,
        notifySectionActivity, updateSectionStatus, postComment,
        onSectionActivity, onSectionStatusUpdated, onNewCommentReceived
    ]);
}
