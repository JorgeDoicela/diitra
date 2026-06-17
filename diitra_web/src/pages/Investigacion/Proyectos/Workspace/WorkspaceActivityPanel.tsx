// ═══════════════════════════════════════════════════════════════════
// DIITRA — WorkspaceActivityPanel
//
// Panel lateral de actividad del Workspace. Desacoplado del
// ProjectWorkspace principal: consume /api/projects/{uuid}/activity
// con polling liviano cada 30s. Puede extenderse a SignalR en el futuro
// sin cambios en los demás componentes.
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Edit3, CheckCircle, Eye, GitBranch, MessageSquare, RefreshCw, Clock } from 'lucide-react';
import api from '../../../../api/axios_config';

interface ActividadItem {
    tipo: string;
    nombreUsuario: string;
    rolUsuario: string;
    descripcion: string;
    fecha: string;
    icono: string;
}

interface WorkspaceActivityPanelProps {
    projectUuid: string;
    className?: string;
}

const POLL_INTERVAL_MS = 30_000;

function getIconComponent(icono: string) {
    if (icono === 'check') return <CheckCircle size={13} className="text-emerald-400 shrink-0" />;
    if (icono === 'eye')   return <Eye size={13} className="text-sky-400 shrink-0" />;
    if (icono === 'workflow') return <GitBranch size={13} className="text-violet-400 shrink-0" />;
    if (icono === 'comment') return <MessageSquare size={13} className="text-amber-400 shrink-0" />;
    // tipo 'acceso' y el resto
    return <Edit3 size={13} className="text-brand shrink-0" />;
}

function getBadgeStyle(tipo: string): string {
    switch (tipo) {
        case 'seccion':  return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
        case 'workflow': return 'bg-violet-400/10 text-violet-400 border-violet-400/20';
        case 'comentario': return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
        default:          return 'bg-brand/10 text-brand border-brand/20';
    }
}

function getTypoLabel(tipo: string): string {
    switch (tipo) {
        case 'seccion':   return 'Sección';
        case 'workflow':  return 'Estado';
        case 'comentario': return 'Comentario';
        default:           return 'Acceso';
    }
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1)  return 'ahora mismo';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)  return `hace ${diffHr}h`;
    return `hace ${Math.floor(diffHr / 24)}d`;
}

const WorkspaceActivityPanel: React.FC<WorkspaceActivityPanelProps> = ({ projectUuid, className = '' }) => {
    const [actividad, setActividad] = useState<ActividadItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchActivity = useCallback(async (silent = false) => {
        if (!projectUuid) return;
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await api.get(`/projects/${projectUuid}/activity`, {
                params: { maxItems: 20 }
            });
            setActividad(res.data || []);
            setLastFetch(new Date());
            setError(null);
        } catch (err: any) {
            // No mostrar error en polling silencioso para no molestar al usuario
            if (!silent) {
                setError('No se pudo cargar la actividad.');
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [projectUuid]);

    useEffect(() => {
        fetchActivity(false);
        pollRef.current = setInterval(() => fetchActivity(true), POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchActivity]);

    const handleManualRefresh = () => {
        fetchActivity(false);
    };

    return (
        <div className={`flex flex-col gap-0 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-thin">
                <div className="flex items-center gap-2">
                    <Activity size={12} className="text-brand" />
                    <span className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                        Actividad Reciente
                    </span>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isLoading || isRefreshing}
                    title="Actualizar actividad"
                    className="p-1 rounded-md hover:bg-surface text-text-dim hover:text-text-main transition-all disabled:opacity-40"
                >
                    <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content */}
            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '420px' }}>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-8 px-4">
                        <div className="animate-spin h-5 w-5 border-t-2 border-brand rounded-full" />
                        <span className="text-[9px] text-text-dim uppercase tracking-widest">Cargando...</span>
                    </div>
                ) : error ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-[10px] text-text-dim">{error}</p>
                        <button
                            onClick={handleManualRefresh}
                            className="mt-2 text-[10px] text-brand hover:underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : actividad.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Activity size={20} className="text-text-dim mx-auto mb-2 opacity-40" />
                        <p className="text-[10px] text-text-dim">Sin actividad registrada aún.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-thin/50">
                        {actividad.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-surface/40 transition-colors group"
                            >
                                {/* Ícono */}
                                <div className="mt-0.5 flex-shrink-0">
                                    {getIconComponent(item.icono)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className="text-[11px] font-semibold text-text-main truncate">
                                            {item.nombreUsuario || 'Usuario'}
                                        </span>
                                        <span className={`text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getBadgeStyle(item.tipo)}`}>
                                            {getTypoLabel(item.tipo)}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-snug">
                                        {item.descripcion}
                                    </p>
                                    {item.rolUsuario && (
                                        <p className="text-[9px] text-text-dim/60 mt-0.5">
                                            {item.rolUsuario}
                                        </p>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                    <Clock size={9} className="text-text-dim/40" />
                                    <span className="text-[9px] text-text-dim/60 whitespace-nowrap">
                                        {timeAgo(item.fecha)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer con última actualización */}
            {lastFetch && (
                <div className="px-4 py-2 border-t border-border-thin/50 flex items-center gap-1">
                    <Clock size={9} className="text-text-dim/40" />
                    <span className="text-[9px] text-text-dim/50">
                        Actualizado {timeAgo(lastFetch.toISOString())}
                    </span>
                </div>
            )}
        </div>
    );
};

export default WorkspaceActivityPanel;
