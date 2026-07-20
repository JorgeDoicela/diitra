import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UseEmailHistoryResult } from '../hooks/useEmailHistory';
import type { EmailHistorial } from '../emailEngineTypes';

export interface EmailHistorySectionProps {
    historyHook: UseEmailHistoryResult;
}

export const EmailHistorySection: React.FC<EmailHistorySectionProps> = ({ historyHook }) => {
    const {
        history,
        historyLimit,
        setHistoryLimit,
        refreshing,
        fetchHistory,
        setSelectedHistoryLog,
        setIsHistoryDrawerOpen,
        getStatusBadge,
        getStatusDot
    } = historyHook;

    const handleInspect = (log: EmailHistorial) => {
        setSelectedHistoryLog(log);
        setIsHistoryDrawerOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
                    Registro de auditoría LOPDP
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 border border-border-thin rounded-lg px-3 py-1.5 bg-surface/30">
                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Mostrar:</span>
                        {[50, 100, 250, 500].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => {
                                    setHistoryLimit(n);
                                    fetchHistory(n);
                                }}
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${historyLimit === n ? 'bg-brand text-white' : 'text-text-dim hover:text-text-main'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchHistory()}
                        disabled={refreshing}
                        className="btn-vercel-secondary !p-2 h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                        title="Refrescar cola de correos"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bento-card static overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin">
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/5">Fecha y Hora</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Destinatario</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/3">Asunto</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-28">Estado</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-20">Adjuntos</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right w-20">Inspección</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {refreshing && history.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-4"><div className="h-4 bg-surface rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-text-dim">
                                        No se registran envíos en el historial de correos.
                                    </td>
                                </tr>
                            ) : (
                                history.map(log => {
                                    let attCount = 0;
                                    try {
                                        if (log.adjuntosJson) {
                                            const parsed = JSON.parse(log.adjuntosJson);
                                            if (Array.isArray(parsed)) attCount = parsed.length;
                                        }
                                    } catch { }

                                    return (
                                        <tr
                                            key={log.idEmailHistorial}
                                            onClick={() => handleInspect(log)}
                                            className="group hover:bg-surface/30 transition-all cursor-pointer"
                                        >
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="text-[11px] font-mono text-text-main">
                                                    {log.fechaEnvio ? format(new Date(log.fechaEnvio), "dd MMM yyyy, HH:mm:ss", { locale: es }) : '—'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs font-bold text-text-main">{log.nombreDestinatario || 'Externo / Desconocido'}</div>
                                                <div className="text-[10px] font-mono text-text-dim mt-0.5 truncate max-w-xs">{log.destinatario}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs font-semibold text-text-main truncate max-w-sm" title={log.asunto}>
                                                    {log.asunto}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`status-tag ${getStatusBadge(log.estado)}`}>
                                                    <span className={`dot ${getStatusDot(log.estado)}`} />
                                                    {log.estado}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {attCount > 0 ? (
                                                    <span className="badge-vercel badge-vercel-info text-[9px] font-mono font-bold">
                                                        {attCount} adj.
                                                    </span>
                                                ) : (
                                                    <span className="text-text-dim/30 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-2 rounded border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all cursor-pointer">
                                                    <ArrowRight size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmailHistorySection;
