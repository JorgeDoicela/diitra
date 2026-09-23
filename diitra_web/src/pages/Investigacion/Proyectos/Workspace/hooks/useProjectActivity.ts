// ═══════════════════════════════════════════════════════════════════
// DIITRA — useProjectActivity (Custom Hook Enterprise)
//
// Hook de orquestación reactiva para el panel de Actividad Reciente.
// Combina Server-Push por canal SignalR (latencia <50ms, 0 HTTP) con
// revalidación resiliente SWR ante reconexión y enfoque de pestaña.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../../../../api/axios_config';
import { useNotifications } from '../../../../../api/NotificationsContext';

export interface ActividadItem {
    tipo: string;
    nombreUsuario: string;
    rolUsuario: string;
    descripcion: string;
    fecha: string;
    icono: string;
}

export function timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'ahora mismo';

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'ahora mismo';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)  return `hace ${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'ayer';
    return `hace ${diffDays}d`;
}

function normalizeItem(raw: any): ActividadItem {
    return {
        tipo: raw.tipo ?? raw.Tipo ?? 'acceso',
        nombreUsuario: raw.nombreUsuario ?? raw.nombre_usuario ?? raw.NombreUsuario ?? 'Usuario',
        rolUsuario: raw.rolUsuario ?? raw.rol_usuario ?? raw.RolUsuario ?? '',
        descripcion: raw.descripcion ?? raw.Descripcion ?? '',
        fecha: raw.fecha ?? raw.Fecha ?? new Date().toISOString(),
        icono: raw.icono ?? raw.Icono ?? 'edit'
    };
}

export function useProjectActivity(projectUuid: string) {
    const { isConnected, joinProjectChannel, leaveProjectChannel, onProjectActivity } = useNotifications();
    const [actividad, setActividad] = useState<ActividadItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setTick] = useState(0);

    const lastFetchRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);

    // 1. Carga inicial / SWR silencioso
    const fetchActivity = useCallback(async (silent = false) => {
        if (!projectUuid || isFetchingRef.current) return;
        isFetchingRef.current = true;
        if (!silent) setIsLoading(true);
        else setIsSyncing(true);

        try {
            const res = await api.get(`/projects/${projectUuid}/activity`, {
                params: { maxItems: 20 }
            });
            const items = (res.data || []).map(normalizeItem);
            setActividad(items);
            setError(null);
            lastFetchRef.current = Date.now();
        } catch (err: any) {
            if (!silent) {
                setError('No se pudo cargar la actividad.');
            }
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
            isFetchingRef.current = false;
        }
    }, [projectUuid]);

    // 2. Suscripción al Canal SignalR del Proyecto
    useEffect(() => {
        if (!projectUuid) return;

        joinProjectChannel(projectUuid);
        fetchActivity(false);

        // Listener nativo del stream SignalR
        const unbindSignalR = onProjectActivity((payload: any) => {
            const rawActivity = payload?.activity ?? payload;
            if (!rawActivity) return;

            const newItem = normalizeItem(rawActivity);
            setActividad(prev => {
                // Deduplicación en memoria: evitar insertar duplicados exactos en ventana de 2 segundos
                const isDupe = prev.some(item =>
                    item.nombreUsuario === newItem.nombreUsuario &&
                    item.descripcion === newItem.descripcion &&
                    Math.abs(new Date(item.fecha).getTime() - new Date(newItem.fecha).getTime()) < 2000
                );
                if (isDupe) return prev;
                return [newItem, ...prev.slice(0, 19)];
            });
        });

        // 3. Resiliencia SWR: Revalidación al enfocar ventana o reconectar
        const onVisibilityOrFocus = () => {
            if (document.visibilityState !== 'visible') return;
            const now = Date.now();
            if (now - lastFetchRef.current > 15000) {
                fetchActivity(true);
            }
        };

        const onProjectChanged = () => {
            fetchActivity(true);
        };

        window.addEventListener('focus', onVisibilityOrFocus);
        document.addEventListener('visibilitychange', onVisibilityOrFocus);
        window.addEventListener('diitra-projects-changed', onProjectChanged);
        window.addEventListener('diitra-project-team-updated', onProjectChanged);
        window.addEventListener('diitra-activity-updated', onProjectChanged);

        return () => {
            leaveProjectChannel(projectUuid);
            unbindSignalR();
            window.removeEventListener('focus', onVisibilityOrFocus);
            document.removeEventListener('visibilitychange', onVisibilityOrFocus);
            window.removeEventListener('diitra-projects-changed', onProjectChanged);
            window.removeEventListener('diitra-project-team-updated', onProjectChanged);
            window.removeEventListener('diitra-activity-updated', onProjectChanged);
        };
    }, [projectUuid, joinProjectChannel, leaveProjectChannel, onProjectActivity, fetchActivity]);

    // 4. Tick local ligero cada 30s: recalcula timeAgo sin consumo de red
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return {
        actividad,
        isLoading,
        isSyncing,
        isLive: isConnected,
        error
    };
}
