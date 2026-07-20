import { useState, useCallback } from 'react';
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
    fetchHistory: (limit?: number) => Promise<void>;
    getStatusBadge: (state: string) => string;
    getStatusDot: (state: string) => string;
}

export const useEmailHistory = (): UseEmailHistoryResult => {
    const [history, setHistory] = useState<EmailHistorial[]>([]);
    const [historyLimit, setHistoryLimit] = useState<number>(100);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedHistoryLog, setSelectedHistoryLog] = useState<EmailHistorial | null>(null);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

    const fetchHistory = useCallback(async (limit?: number) => {
        const effectiveLimit = limit ?? historyLimit;
        setRefreshing(true);
        try {
            const res = await api.get<any[]>(`/Admin/email-engine/history?limit=${effectiveLimit}`);
            setHistory(res.data.map(mapHistorialToCamelCase));
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error loading email logs:', e);
        } finally {
            setRefreshing(false);
        }
    }, [historyLimit]);

    const getStatusBadge = (state: string) => {
        switch (state.toUpperCase()) {
            case 'ENVIADO':
                return 'badge-vercel-success';
            case 'FALLIDO':
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
