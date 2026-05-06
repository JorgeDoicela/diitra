// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Main Hook: useCoWork
//
// Este es el ÚNICO punto de entrada para usar DIITRA CoWork.
// Encapsula TODA la lógica de colaboración:
//   - Gestión del ciclo de vida de la conexión (connect/disconnect/reconnect)
//   - Sincronización del estado Yjs con todos los participantes
//   - Presencia de usuarios (cursores, avatares, awareness)
//   - Identidad real del usuario desde JWT (no aleatorio)
//   - Resiliencia ante desconexiones de red
//
// Uso básico:
// ────────────
// const { session, ydoc, awareness } = useCoWork({
//   documentId: proyecto.uuid,
//   user: coworkUserFromAuth(auth),  // ← identidad real del JWT
// });
//
// El hook gestiona AUTOMÁTICAMENTE:
//   ✓ Conectar al montar el componente
//   ✓ Desconectar al desmontar el componente (sin memory leaks)
//   ✓ Reintentar si se cae la red del IST
//   ✓ Sincronizar documentos con múltiples colaboradores simultáneos
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

    // Yjs Doc: el "libro de verdad" del documento colaborativo
    const ydocRef = useRef<Y.Doc>(new Y.Doc());

    // Awareness: el "tablero de presencia" (quién está conectado, posición de cursores)
    const awarenessRef = useRef<awarenessProtocol.Awareness>(
        new awarenessProtocol.Awareness(ydocRef.current)
    );

    // Transport: el canal de red (por defecto SignalR, reemplazable por cualquier ICoWorkTransport)
    const transportRef = useRef<ICoWorkTransport>(
        new SignalRTransport(config.transportUrl)
    );

    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const updateCounterRef = useRef(0);

    /**
     * Fuerza una compactación manual del historial de cambios.
     */
    const compact = useCallback(async () => {
        const fullState = Y.encodeStateAsUpdate(ydocRef.current);
        const fullB64 = btoa(String.fromCharCode(...fullState));
        await transportRef.current.submitFullSnapshot(config.documentId, fullB64);
        updateCounterRef.current = 0;
    }, [config.documentId]);

    /**
     * Desconecta manualmente la sesión.
     * También se llama automáticamente al desmontar el componente.
     */
    const disconnect = useCallback(async () => {
        await transportRef.current.disconnect();
        setSession(s => ({ ...s, isConnected: false }));
    }, []);

    useEffect(() => {
        const ydoc = ydocRef.current;
        const awareness = awarenessRef.current;
        const transport = transportRef.current;
        let isMounted = true;

        // ─────────────────────────────────────────────────────────────
        // PASO 1: Registrar handlers de ENTRADA (servidor → este cliente)
        // ─────────────────────────────────────────────────────────────

        // Historial de actualizaciones al unirse (sincronización inicial robusta)
        transport.onUpdateHistory((updatesBase64: string[]) => {
            try {
                ydoc.transact(() => {
                    updatesBase64.forEach(b64 => {
                        const update = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                        Y.applyUpdate(ydoc, update, 'history-sync');
                    });
                }, 'history-sync');
                console.info(`[DIITRA CoWork] Sincronización inicial exitosa: ${updatesBase64.length} actualizaciones aplicadas.`);
            } catch (err) {
                console.warn('[DIITRA CoWork] Error aplicando historial de actualizaciones:', err);
            }
        });

        transport.onYjsUpdate((updateBase64: string) => {
            try {
                const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
                // Aplicar con origen 'remote' para no re-enviar al servidor (evitar loop)
                Y.applyUpdate(ydoc, update, 'remote');
            } catch (err) {
                console.warn('[DIITRA CoWork] Error aplicando Yjs update:', err);
            }
        });

        transport.onAwarenessUpdate((updateBase64: string) => {
            try {
                const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
                awarenessProtocol.applyAwarenessUpdate(awareness, update, 'remote');
            } catch (err) {
                console.warn('[DIITRA CoWork] Error aplicando awareness update:', err);
            }
        });

        // ─────────────────────────────────────────────────────────────
        // PASO 2: Registrar handlers de SALIDA (este cliente → servidor)
        // ─────────────────────────────────────────────────────────────

        const onYdocUpdate = (update: Uint8Array, origin: unknown) => {
            // Solo enviar si el cambio vino de este usuario (no de uno remoto)
            if (origin !== 'remote' && transport.isConnected) {
                const b64 = btoa(String.fromCharCode(...update));
                transport.sendYjsUpdate(config.documentId, b64);

                // ESTRATEGIA PLATINUM: Compactación Automática
                // Cada 50 cambios locales, enviamos el documento completo para limpiar deltas en el servidor.
                updateCounterRef.current++;
                if (updateCounterRef.current >= 50) {
                    const fullState = Y.encodeStateAsUpdate(ydoc);
                    const fullB64 = btoa(String.fromCharCode(...fullState));
                    transport.submitFullSnapshot(config.documentId, fullB64);
                    updateCounterRef.current = 0;
                    console.debug(`[DIITRA CoWork] Compactación automática ejecutada para ${config.documentId}`);
                }

                if (isMounted) {
                    setSession(s => ({ ...s, isSyncing: true, lastSyncedAt: new Date() }));
                    // Ocultar el indicador de "guardando" después de un breve delay visual
                    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                    syncTimeoutRef.current = setTimeout(() => {
                        if (isMounted) setSession(s => ({ ...s, isSyncing: false }));
                    }, 600);
                }
            }
        };

        const onAwarenessUpdate = (
            { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
            origin: unknown
        ) => {
            // Sincronizar el estado de presencia con el servidor
            if (origin !== 'remote' && transport.isConnected) {
                const changedIds = [...added, ...updated, ...removed];
                const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedIds);
                transport.sendAwarenessUpdate(
                    config.documentId,
                    btoa(String.fromCharCode(...update))
                );
            }

            // Actualizar la lista de usuarios conectados en el estado local
            const users: CoWorkUser[] = [];
            awareness.getStates().forEach((state: Record<string, unknown>) => {
                if (state.user) users.push(state.user as CoWorkUser);
            });
            if (isMounted) {
                setSession(s => ({
                    ...s,
                    connectedUsers: Array.from(new Map(users.map(u => [u.id, u])).values()),
                }));
            }
        };

        ydoc.on('update', onYdocUpdate);
        awareness.on('update', onAwarenessUpdate);

        // ─────────────────────────────────────────────────────────────
        // PASO 3: Conectar y registrar la identidad REAL del usuario
        // ─────────────────────────────────────────────────────────────

        transport
            .connect(config.documentId, config.user)
            .then(() => {
                if (!isMounted) return;

                setSession(s => ({ ...s, isConnected: true, error: null }));

                // Registrar presencia con datos reales del JWT, no con Math.random()
                const coworkUser: CoWorkUser = {
                    id: config.user.id,
                    name: config.user.name,
                    role: config.user.role,
                    color: getUserColor(config.user.id),
                    initials: getUserInitials(config.user.name),
                };
                awareness.setLocalStateField('user', coworkUser);
                config.onSynced?.();
            })
            .catch((err: any) => {
                if (!isMounted) return;
                
                // Ignorar errores de aborto causados por el ciclo de vida de React 19 en desarrollo
                if (err?.name === 'AbortError' || err?.message?.includes('stop()')) {
                    return;
                }

                const errorMsg = `[DIITRA CoWork] No se pudo conectar: ${err?.message ?? 'Error desconocido'}`;
                console.error(errorMsg);
                setSession(s => ({ ...s, isConnected: false, error: errorMsg }));
                config.onError?.(errorMsg);
            });

        // ─────────────────────────────────────────────────────────────
        // PASO 4: Limpieza al desmontar (sin memory leaks)
        // ─────────────────────────────────────────────────────────────
        const handleUnload = () => {
            transport.disconnect();
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            isMounted = false;
            window.removeEventListener('beforeunload', handleUnload);
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            ydoc.off('update', onYdocUpdate);
            awareness.off('update', onAwarenessUpdate);
            transport.disconnect();
        };

        // El effect solo se re-ejecuta si cambia el documento o el usuario
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.documentId, config.user.id]);

    const submitFinalContent = useCallback(async (html: string, json: string) => {
        await transportRef.current.submitFinalContent(config.documentId, html, json);
    }, [config.documentId]);

    return {
        session,
        ydoc: ydocRef.current,
        awareness: awarenessRef.current,
        disconnect,
        submitFinalContent,
        compact,
    };
}
