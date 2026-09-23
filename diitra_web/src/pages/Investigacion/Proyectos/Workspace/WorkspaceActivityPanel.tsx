// ═══════════════════════════════════════════════════════════════════
// DIITRA — WorkspaceActivityPanel (Vercel Geist — Pure Presentation)
//
// Panel lateral de actividad del Workspace. Conectado en tiempo real
// mediante useProjectActivity (SignalR WebSockets + SWR).
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { Activity, Edit3, CheckCircle, Eye, GitBranch, MessageSquare, Clock } from 'lucide-react';
import { useProjectActivity, timeAgo } from './hooks/useProjectActivity';

interface WorkspaceActivityPanelProps {
    projectUuid: string;
    className?: string;
}

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

const WorkspaceActivityPanel: React.FC<WorkspaceActivityPanelProps> = ({ projectUuid, className = '' }) => {
    const { actividad, isLoading, isSyncing, isLive, error } = useProjectActivity(projectUuid);

    return (
        <div className={`flex flex-col gap-0 ${className}`}>
            {/* Header Vercel Geist */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-thin select-none">
                <Activity size={12} className="text-text-dim" />
                <span className="section-label text-text-dim">
                    Actividad Reciente
                </span>
            </div>

            {/* Content con Scroll Ergonómico */}
            <div className="flex flex-col overflow-y-auto custom-scrollbar" style={{ maxHeight: '420px' }}>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-8 px-4">
                        <div className="animate-spin h-5 w-5 border-t-2 border-brand rounded-full" />
                        <span className="text-[9px] text-text-dim uppercase tracking-widest">Cargando...</span>
                    </div>
                ) : error ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-xs text-text-dim">{error}</p>
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
                                key={`${item.fecha}-${idx}`}
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
