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
    if (icono === 'check') return <CheckCircle size={12} className="text-emerald-400 shrink-0" />;
    if (icono === 'eye')   return <Eye size={12} className="text-sky-400 shrink-0" />;
    if (icono === 'workflow') return <GitBranch size={12} className="text-violet-400 shrink-0" />;
    if (icono === 'comment') return <MessageSquare size={12} className="text-amber-400 shrink-0" />;
    return <Edit3 size={12} className="text-text-dim shrink-0" />;
}

function getBadgeClass(tipo: string): string {
    switch (tipo) {
        case 'seccion':   return 'badge-vercel badge-vercel-success';
        case 'workflow':  return 'badge-vercel badge-vercel-violet';
        case 'comentario': return 'badge-vercel badge-vercel-warning';
        default:           return 'badge-vercel badge-vercel-neutral';
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
            const mapped = (res.data || []).map((item: any) => ({
                tipo: item.tipo,
                nombreUsuario: item.nombreUsuario ?? item.nombre_usuario ?? 'Usuario',
                rolUsuario: item.rolUsuario ?? item.rol_usuario ?? '',
                descripcion: item.descripcion ?? '',
                fecha: item.fecha ?? '',
                icono: item.icono ?? ''
            }));
            setActividad(mapped);
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
                    <Activity size={12} className="text-text-dim" />
                    <span className="section-label text-text-dim">
                        Actividad Reciente
                    </span>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isLoading || isRefreshing}
                    title="Actualizar actividad"
                    className="p-1 h-6 w-6 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors disabled:opacity-40 flex items-center justify-center cursor-pointer"
                >
                    <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content */}
            <div className="flex flex-col overflow-y-auto custom-scrollbar" style={{ maxHeight: '420px' }}>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-8 px-4">
                        <div className="animate-spin h-5 w-5 border-t-2 border-brand rounded-full" />
                        <span className="text-[9px] text-text-dim uppercase tracking-widest">Cargando...</span>
                    </div>
                ) : error ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-xs text-text-dim">{error}</p>
                        <button
                            onClick={handleManualRefresh}
                            className="mt-2 text-xs text-brand hover:underline cursor-pointer"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : actividad.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Activity size={20} className="text-text-dim mx-auto mb-2 opacity-40" />
                        <p className="text-xs text-text-dim">Sin actividad registrada aún.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-thin/50">
                        {actividad.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-surface/50 transition-colors group"
                            >
                                {/* Ícono en contenedor Vercel Geist */}
                                <div className="w-6 h-6 rounded-md bg-surface border border-border-thin flex items-center justify-center shrink-0 mt-0.5 group-hover:border-border-hover transition-colors">
                                    {getIconComponent(item.icono)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        <span className="text-xs font-medium text-text-main truncate">
                                            {item.nombreUsuario || 'Usuario'}
                                        </span>
                                        <span className={`${getBadgeClass(item.tipo)} text-[8.5px] px-1.5 py-0`}>
                                            {getTypoLabel(item.tipo)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-dim leading-snug">
                                        {item.descripcion}
                                    </p>
                                    {item.rolUsuario && (
                                        <p className="text-[10px] text-text-dim/60 mt-0.5 font-mono">
                                            {item.rolUsuario}
                                        </p>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 shrink-0 mt-0.5 text-text-dim/50">
                                    <Clock size={9} />
                                    <span className="text-[10px] font-mono whitespace-nowrap">
                                        {timeAgo(item.fecha)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceActivityPanel;
