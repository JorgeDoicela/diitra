import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../api/AuthContext';

export interface RecentProjectItem {
    uuid: string;
    lastVisitedAt: number; // Timestamp en ms
    titulo?: string;
    codigo?: string;
}

const STORAGE_RECENTS_PREFIX = 'diitra_recents_';
const STORAGE_PINNED_PREFIX = 'diitra_pinned_';
const MAX_RECENT_ITEMS = 20;

export function useProjectPreferences() {
    const { user } = useAuth();
    const userKey = user?.id_referencia || user?.usuario || 'anonymous_user';

    const recentsKey = `${STORAGE_RECENTS_PREFIX}${userKey}`;
    const pinnedKey = `${STORAGE_PINNED_PREFIX}${userKey}`;

    // Estado local sincronizado
    const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>(() => {
        try {
            const raw = localStorage.getItem(recentsKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [pinnedUuids, setPinnedUuids] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(pinnedKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // Cargar datos cuando cambie de usuario
    useEffect(() => {
        try {
            const rawRecents = localStorage.getItem(recentsKey);
            setRecentProjects(rawRecents ? JSON.parse(rawRecents) : []);

            const rawPinned = localStorage.getItem(pinnedKey);
            setPinnedUuids(rawPinned ? JSON.parse(rawPinned) : []);
        } catch (e) {
            console.error('[DIITRA Preferences] Error al cargar preferencias:', e);
        }
    }, [recentsKey, pinnedKey]);

    // Sincronización entre componentes o pestañas mediante CustomEvent
    useEffect(() => {
        const handleSync = () => {
            try {
                const rawRecents = localStorage.getItem(recentsKey);
                if (rawRecents) setRecentProjects(JSON.parse(rawRecents));

                const rawPinned = localStorage.getItem(pinnedKey);
                if (rawPinned) setPinnedUuids(JSON.parse(rawPinned));
            } catch {}
        };

        window.addEventListener('diitra-project-preferences-changed', handleSync);
        window.addEventListener('storage', handleSync);

        return () => {
            window.removeEventListener('diitra-project-preferences-changed', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [recentsKey, pinnedKey]);

    /**
     * Registra o actualiza el acceso a un proyecto (LRU)
     */
    const touchProject = useCallback((uuid: string, titulo?: string, codigo?: string) => {
        if (!uuid) return;
        try {
            const raw = localStorage.getItem(recentsKey);
            const current: RecentProjectItem[] = raw ? JSON.parse(raw) : [];
            
            const filtered = current.filter(item => item.uuid !== uuid);
            const updated: RecentProjectItem[] = [
                {
                    uuid,
                    lastVisitedAt: Date.now(),
                    titulo: titulo || undefined,
                    codigo: codigo || undefined
                },
                ...filtered
            ].slice(0, MAX_RECENT_ITEMS);

            localStorage.setItem(recentsKey, JSON.stringify(updated));
            setRecentProjects(updated);
            window.dispatchEvent(new CustomEvent('diitra-project-preferences-changed'));
        } catch (e) {
            console.error('[DIITRA Preferences] Error al registrar touchProject:', e);
        }
    }, [recentsKey]);

    /**
     * Alterna fijar/desfijar un proyecto
     */
    const togglePin = useCallback((uuid: string) => {
        if (!uuid) return;
        try {
            const raw = localStorage.getItem(pinnedKey);
            const current: string[] = raw ? JSON.parse(raw) : [];
            
            let updated: string[];
            if (current.includes(uuid)) {
                updated = current.filter(id => id !== uuid);
            } else {
                updated = [uuid, ...current];
            }

            localStorage.setItem(pinnedKey, JSON.stringify(updated));
            setPinnedUuids(updated);
            window.dispatchEvent(new CustomEvent('diitra-project-preferences-changed'));
        } catch (e) {
            console.error('[DIITRA Preferences] Error al alternar pin:', e);
        }
    }, [pinnedKey]);

    const isPinned = useCallback((uuid: string): boolean => {
        return pinnedUuids.includes(uuid);
    }, [pinnedUuids]);

    const recentVisitsMap = useMemo(() => {
        const map = new Map<string, number>();
        recentProjects.forEach(item => {
            map.set(item.uuid, item.lastVisitedAt);
        });
        return map;
    }, [recentProjects]);

    const getLastVisited = useCallback((uuid: string): number | undefined => {
        return recentVisitsMap.get(uuid);
    }, [recentVisitsMap]);

    return {
        recentProjects,
        pinnedUuids,
        touchProject,
        togglePin,
        isPinned,
        getLastVisited,
        recentVisitsMap
    };
}
