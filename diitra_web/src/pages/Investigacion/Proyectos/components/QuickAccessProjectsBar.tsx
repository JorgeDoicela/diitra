import React from 'react';
import { Link } from 'react-router-dom';
import { Pin, Clock, Sparkles, ArrowUpRight } from 'lucide-react';
import { buildWorkspacePath } from '../../../../core/documents/templateUrl';
export interface QuickAccessProjectItem {
    uuid: string;
    titulo: string;
    estado: string;
    codigo_institucional?: string;
    fecha_registro?: string;
    fecha_modificacion?: string;
    [key: string]: any;
}

interface QuickAccessProjectsBarProps {
    proyectos: QuickAccessProjectItem[];
    pinnedUuids: string[];
    recentVisitsMap: Map<string, number>;
    onTogglePin: (uuid: string) => void;
    basePath?: string;
    templateCode?: string;
}

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin}m`;
    if (diffHour < 24) return `hace ${diffHour}h`;
    if (diffDay === 1) return 'ayer';
    if (diffDay < 7) return `hace ${diffDay}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const QuickAccessProjectsBar: React.FC<QuickAccessProjectsBarProps> = ({
    proyectos,
    pinnedUuids,
    recentVisitsMap,
    onTogglePin,
    basePath = '/investigacion',
    templateCode
}) => {
    const targetTemplate = templateCode || (basePath.startsWith('/innovacion') ? 'PROTOCOLO_INNOVACION' : 'PROTOCOLO_INVESTIGACION');

    // Mapa rápido de proyectos por uuid
    const projectMap = React.useMemo(() => {
        const map = new Map<string, QuickAccessProjectItem>();
        proyectos.forEach(p => map.set(p.uuid, p));
        return map;
    }, [proyectos]);

    // Obtener proyectos fijados que existan en el dataset
    const pinnedProjects = React.useMemo(() => {
        return pinnedUuids
            .map(uuid => projectMap.get(uuid))
            .filter((p): p is QuickAccessProjectItem => !!p);
    }, [pinnedUuids, projectMap]);

    // Obtener proyectos visitados recientemente que NO estén ya fijados
    const recentProjects = React.useMemo(() => {
        const list: { project: QuickAccessProjectItem; lastVisitedAt: number }[] = [];
        recentVisitsMap.forEach((lastVisitedAt, uuid) => {
            if (pinnedUuids.includes(uuid)) return; // ya está en fijados
            const project = projectMap.get(uuid);
            if (project) {
                list.push({ project, lastVisitedAt });
            }
        });

        // Ordenar por visita más reciente
        list.sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
        return list.slice(0, 4).map(item => ({ ...item.project, lastVisitedAt: item.lastVisitedAt }));
    }, [recentVisitsMap, pinnedUuids, projectMap]);

    const totalActive = pinnedProjects.length + recentProjects.length;
    if (totalActive === 0) {
        return null;
    }

    return (
        <div className="mb-6 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                            Espacio de Trabajo Inteligente
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                {pinnedProjects.length > 0 ? `${pinnedProjects.length} fijado(s)` : ''}
                                {pinnedProjects.length > 0 && recentProjects.length > 0 ? ' • ' : ''}
                                {recentProjects.length > 0 ? `${recentProjects.length} reciente(s)` : ''}
                            </span>
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Proyectos Fijados */}
                {pinnedProjects.map(project => {
                    const workspaceUrl = buildWorkspacePath(targetTemplate, project.uuid, '', basePath);
                    return (
                        <div
                            key={`pinned-${project.uuid}`}
                            className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                            Fijado
                                        </span>
                                        {project.codigo_institucional && (
                                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                                                {project.codigo_institucional}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onTogglePin(project.uuid);
                                        }}
                                        title="Desfijar de accesos rápidos"
                                        className="p-1 rounded-lg text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
                                    >
                                        <Pin className="w-3.5 h-3.5 fill-amber-400" />
                                    </button>
                                </div>

                                <Link
                                    to={workspaceUrl}
                                    className="block font-semibold text-xs text-slate-100 hover:text-indigo-300 transition-colors line-clamp-2 leading-snug"
                                    title={project.titulo}
                                >
                                    {project.titulo || 'PROYECTO SIN TÍTULO'}
                                </Link>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 text-[10px] truncate max-w-[130px]">
                                    {project.estado}
                                </span>
                                <Link
                                    to={workspaceUrl}
                                    className="inline-flex items-center gap-0.5 font-medium text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform text-[11px]"
                                >
                                    Abrir
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {/* Proyectos Recientes (No Fijados) */}
                {recentProjects.map(project => {
                    const workspaceUrl = buildWorkspacePath(targetTemplate, project.uuid, '', basePath);
                    const lastVisitedAt = recentVisitsMap.get(project.uuid);
                    return (
                        <div
                            key={`recent-${project.uuid}`}
                            className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                                            {lastVisitedAt ? formatRelativeTime(lastVisitedAt) : 'reciente'}
                                        </span>
                                        {project.codigo_institucional && (
                                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[90px]">
                                                {project.codigo_institucional}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onTogglePin(project.uuid);
                                        }}
                                        title="Fijar en accesos rápidos"
                                        className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                    >
                                        <Pin className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <Link
                                    to={workspaceUrl}
                                    className="block font-medium text-xs text-slate-200 hover:text-indigo-300 transition-colors line-clamp-2 leading-snug"
                                    title={project.titulo}
                                >
                                    {project.titulo || 'PROYECTO SIN TÍTULO'}
                                </Link>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 text-[10px] truncate max-w-[130px]">
                                    {project.estado}
                                </span>
                                <Link
                                    to={workspaceUrl}
                                    className="inline-flex items-center gap-0.5 font-medium text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-[11px]"
                                >
                                    Abrir
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
