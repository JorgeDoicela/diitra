import { useState, useEffect, useRef } from 'react';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import type { CoWorkHandle } from '../../../../../core/cowork/types';

export interface UseBuilderNetworkMonitorProps {
    cowork: CoWorkHandle;
    isSaving: boolean;
}

export const useBuilderNetworkMonitor = ({
    cowork,
    isSaving
}: UseBuilderNetworkMonitorProps) => {
    const { addToast } = useNotifications();

    const isOnline = cowork.session.isConnected;
    const isSyncing = isSaving || cowork.session.isSyncing;
    const users = cowork.session.connectedUsers;

    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const prevIsOnlineRef = useRef(isOnline);
    const offlineTimeoutRef = useRef<any>(null);
    const hasShownOfflineRef = useRef(false);

    // ── Monitoreo de Micro-cortes (Anti-Flicker de alertas) ──
    useEffect(() => {
        if (!isOnline && prevIsOnlineRef.current) {
            if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);

            offlineTimeoutRef.current = setTimeout(() => {
                addToast(
                    'Conexión inestable',
                    'Tu señal de internet es débil o inestable. Puedes seguir editando; tus cambios se sincronizarán automáticamente al reconectar.',
                    'warning'
                );
                hasShownOfflineRef.current = true;
            }, 1500);
        } else if (isOnline && !prevIsOnlineRef.current) {
            if (offlineTimeoutRef.current) {
                clearTimeout(offlineTimeoutRef.current);
                offlineTimeoutRef.current = null;
            }
            setIsSlowConnection(false);

            if (hasShownOfflineRef.current) {
                addToast(
                    'Conexión restablecida',
                    'El editor se ha sincronizado con el servidor correctamente.',
                    'success'
                );
                hasShownOfflineRef.current = false;
            }
        }

        prevIsOnlineRef.current = isOnline;

        return () => {
            if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
        };
    }, [isOnline, addToast]);

    // ── Monitoreo de calidad/velocidad de red ──
    useEffect(() => {
        if (!isOnline) {
            setIsSlowConnection(false);
            return;
        }

        let intervalId: any;
        let lastAlertTime = 0;

        const checkLatency = async () => {
            try {
                const start = Date.now();
                await api.get('/ping', { timeout: 3500 });
                const rtt = Date.now() - start;

                if (rtt > 1500) {
                    setIsSlowConnection(true);
                    const now = Date.now();
                    if (now - lastAlertTime > 60000) {
                        addToast(
                            'Señal de internet débil',
                            `Hemos detectado que tu conexión es lenta (latencia de ${rtt}ms). La sincronización colaborativa podría experimentar retrasos.`,
                            'warning'
                        );
                        lastAlertTime = now;
                    }
                } else {
                    setIsSlowConnection(false);
                }
            } catch (err: any) {
                if (isOnline) {
                    setIsSlowConnection(true);
                }
                if (err?.code !== 'ECONNABORTED' && isOnline) {
                    console.warn('[Network Quality] Error al medir latencia:', err);
                }
            }
        };

        checkLatency();
        intervalId = setInterval(checkLatency, 4000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isOnline, addToast]);

    return {
        isOnline,
        isSyncing,
        users,
        isSlowConnection
    };
};
