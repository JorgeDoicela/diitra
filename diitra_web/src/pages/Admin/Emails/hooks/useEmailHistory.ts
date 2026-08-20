import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../../../../api/axios_config';
import type { EmailHistorial } from '../emailEngineTypes';
import { mapHistorialToCamelCase } from './useEmailEngineData';

export interface UseEmailHistoryResult {
    history: EmailHistorial[];
    historyLimit: number;
    setHistoryLimit: (limit: number) => void;
    refreshing: boolean;
    selectedHistoryLog: EmailHistorial | null;
    setSelectedHistoryLog: (log: EmailHistorial | null) => void;
    isHistoryDrawerOpen: boolean;
    setIsHistoryDrawerOpen: (open: boolean) => void;
    fetchHistory: (limit?: number, silent?: boolean) => Promise<void>;
    getStatusBadge: (state: string) => string;
    getStatusDot: (state: string) => string;
}

export const useEmailHistory = (): UseEmailHistoryResult => {
    const [history, setHistory] = useState<EmailHistorial[]>([]);
    const [historyLimit, setHistoryLimit] = useState<number>(100);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedHistoryLog, setSelectedHistoryLog] = useState<EmailHistorial | null>(null);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const selectedLogRef = useRef<EmailHistorial | null>(null);
    selectedLogRef.current = selectedHistoryLog;

    const fetchHistory = useCallback(async (limit?: number, silent = false) => {
        const effectiveLimit = limit ?? historyLimit;
        if (!silent) setRefreshing(true);
        try {
            const res = await api.get<any[]>(`/Admin/email-engine/history?limit=${effectiveLimit}`);
            const mapped = res.data.map(mapHistorialToCamelCase);
            setHistory(mapped);

            // Si el drawer está abierto inspeccionando un log, actualizar su estado en vivo
            if (selectedLogRef.current) {
                const currentId = selectedLogRef.current.idEmailHistorial || selectedLogRef.current.id_email_historial;
                const updated = mapped.find(item => (item.idEmailHistorial || item.id_email_historial) === currentId);
                if (updated) {
                    setSelectedHistoryLog(updated);
                }
            }
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error loading email logs:', e);
        } finally {
            if (!silent) setRefreshing(false);
        }
    }, [historyLimit]);

    // Escuchar actualizaciones en tiempo real (SignalR WebSocket)
    useEffect(() => {
        const handleEmailChange = () => {
            fetchHistory(undefined, true);
        };

        window.addEventListener('diitra-emails-changed', handleEmailChange);
        return () => {
            window.removeEventListener('diitra-emails-changed', handleEmailChange);
        };
    }, [fetchHistory]);

    const getStatusBadge = (state: string) => {
        switch (state.toUpperCase()) {
            case 'ENVIADO':
                return 'badge-vercel-success';
            case 'FALLIDO':
            case 'REBOTADO':
                return 'badge-vercel-error';
            default:
                return 'badge-vercel-warning';
        }
    };

    const getStatusDot = (state: string) => {
        switch (state.toUpperCase()) {
            case 'ENVIADO':
                return 'dot-success';
            case 'FALLIDO':
            case 'REBOTADO':
                return 'dot-error';
            default:
                return 'dot-neutral';
        }
    };

    return {
        history,
        historyLimit,
        setHistoryLimit,
        refreshing,
        selectedHistoryLog,
        setSelectedHistoryLog,
        isHistoryDrawerOpen,
        setIsHistoryDrawerOpen,
        fetchHistory,
        getStatusBadge,
        getStatusDot
    };
};
