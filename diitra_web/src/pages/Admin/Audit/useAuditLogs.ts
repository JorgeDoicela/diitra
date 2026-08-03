import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios_config';
import { formatDateSafe } from './auditTypes';
import type { AuditLog, PagedResult } from './auditTypes';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export const useAuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState('');
    const [modulo, setModulo] = useState('');
    const [action, setAction] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [snapshotView, setSnapshotView] = useState<'diff' | 'before' | 'after'>('diff');

    useEffect(() => {
        setSnapshotView('diff');
    }, [selectedLog]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '15',
                search: search,
                modulo: modulo,
                action: action,
                from: fromDate,
                to: toDate
            });
            const response = await api.get<PagedResult>(`/Admin/audit/advanced?${params}`);
            setLogs(response.data.items);
            setTotalPages(response.data.total_pages);
            setTotalCount(response.data.total_count);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, modulo, action, fromDate, toDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = () => {
        try {
            if (logs.length === 0) return;

            const excelData = logs.map(log => ({
                "Fecha y Hora": formatDateSafe(log.date, "yyyy-MM-dd HH:mm:ss"),
                "Administrador": log.admin_name || '—',
                "Acción": log.action || '—',
                "Módulo": log.modulo || 'SISTEMA',
                "Afectado": log.target_name || 'Global',
                "Detalles": log.details || '—',
                "IP de Red": log.ip_address || '—',
                "Navegador": log.user_agent || '—'
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            worksheet['!cols'] = [
                { wch: 20 },
                { wch: 22 },
                { wch: 25 },
                { wch: 15 },
                { wch: 25 },
                { wch: 50 },
                { wch: 15 },
                { wch: 50 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría");

            let dateStr = 'export';
            try {
                dateStr = format(new Date(), "yyyyMMdd_HHmmss");
            } catch {
                const now = new Date();
                dateStr = now.toISOString().replace(/[:.]/g, '-');
            }

            XLSX.writeFile(workbook, `auditoria_${dateStr}.xlsx`);
        } catch (error) {
            console.error('Error al exportar reporte de auditoria a Excel XLSX:', error);
        }
    };

    return {
        logs,
        loading,
        page,
        setPage,
        totalPages,
        totalCount,
        search,
        setSearch,
        modulo,
        setModulo,
        action,
        setAction,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        selectedLog,
        setSelectedLog,
        isDrawerOpen,
        setIsDrawerOpen,
        snapshotView,
        setSnapshotView,
        fetchLogs,
        handleExport,
    };
};
