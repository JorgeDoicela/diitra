import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    FolderKanban, ArrowRight, Search, 
    Layers, PlusCircle, FileText, Package, Calendar
} from 'lucide-react';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';
import { getProjectProgress } from '../utils/projectProgress';

export interface DocenteProjectItem {
    uuid: string;
    titulo: string;
    estado: string;
    rol_en_proyecto?: string;
    total_informes?: number;
    informes_aprobados?: number;
    total_productos?: number;
    total_investigadores?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_registro?: string;
    fecha_modificacion?: string;
    codigo_institucional?: string;
    template_code?: string;
    templateCode?: string;
}

export interface DocenteDashboardStats {
    mis_proyectos_activos: number;
    mis_proyectos_borrador: number;
    mis_proyectos_en_revision: number;
    mis_productos_registrados: number;
    mis_informes_pendientes: number;
    mis_horas_investigacion: number;
    horas_disponibles_distributivo?: number;
}

interface DocenteProjectsProgressWidgetProps {
    projects: DocenteProjectItem[];
    stats?: DocenteDashboardStats | null;
    loading?: boolean;
}

type FilterTab = 'todos' | 'ejecucion' | 'revision' | 'borradores';

export const DocenteProjectsProgressWidget: React.FC<DocenteProjectsProgressWidgetProps> = ({
    projects,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState<FilterTab>('todos');
    const [searchQuery, setSearchQuery] = useState('');

    // Filtrar proyectos según tab y búsqueda
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const estadoUpper = (p.estado || '').toUpperCase();
            
            // Tab filter
            if (activeTab === 'ejecucion') {
                if (estadoUpper !== 'EN EJECUCIÓN' && estadoUpper !== 'EN_EJECUCION' && estadoUpper !== 'APROBADO') {
                    return false;
                }
            } else if (activeTab === 'revision') {
                if (estadoUpper !== 'EN REVISIÓN' && estadoUpper !== 'EN_REVISION' && estadoUpper !== 'ENVIADO' && estadoUpper !== 'PENDIENTE' && estadoUpper !== 'EN CORRECCIÓN') {
                    return false;
                }
            } else if (activeTab === 'borradores') {
                if (estadoUpper !== 'BORRADOR' && estadoUpper !== 'PREPROPUESTA') {
                    return false;
                }
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (p.titulo || '').toLowerCase().includes(q);
                const matchCode = (p.codigo_institucional || '').toLowerCase().includes(q);
                const matchRole = (p.rol_en_proyecto || '').toLowerCase().includes(q);
                return matchTitle || matchCode || matchRole;
            }

            return true;
        });
    }, [projects, activeTab, searchQuery]);

    // Contadores integrados para pestañas
    const tabCounts = useMemo(() => {
        let ejecucion = 0;
        let revision = 0;
        let borradores = 0;

        projects.forEach(p => {
            const u = (p.estado || '').toUpperCase();
            if (u === 'EN EJECUCIÓN' || u === 'EN_EJECUCION' || u === 'APROBADO') ejecucion++;
            else if (u === 'EN REVISIÓN' || u === 'EN_REVISION' || u === 'ENVIADO' || u === 'PENDIENTE' || u === 'EN CORRECCIÓN') revision++;
            else if (u === 'BORRADOR' || u === 'PREPROPUESTA') borradores++;
        });

        return { todos: projects.length, ejecucion, revision, borradores };
    }, [projects]);

    return (
        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden animate-fade-up">
            {/* Cabecera Vercel Geist: Limpia, sin cajas gigantes */}
            <div className="p-6 border-b border-border-thin flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FolderKanban size={14} className="text-text-dim" />
                        <span className="text-[11px] font-semibold text-text-dim uppercase tracking-widest font-mono">
                            Mis Proyectos I+D
                        </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-text-main">
                        Seguimiento y Avance de Proyectos
                    </h3>
                    <p className="text-xs text-text-dim font-medium mt-0.5">
                        Monitorea en tiempo real el ciclo de vida, porcentaje de cumplimiento e informes técnicos aprobados.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/investigacion/mis-proyectos"
                        className="btn-vercel-secondary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-2 no-underline"
                    >
                        <span>Ver todos los proyectos</span>
                        <ArrowRight size={13} className="opacity-70" />
                    </Link>
                </div>
            </div>

            {/* Barra de Filtros Segmentados tipo Vercel / Linear (Conteo integrado sin KPIs gigantes) */}
            <div className="px-6 py-3 bg-bg-deep/20 border-b border-border-thin flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-surface border border-border-thin rounded-lg">
                    <button
                        type="button"
                        onClick={() => setActiveTab('todos')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'todos'
                                ? 'bg-text-main text-surface font-semibold shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>Todos</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            activeTab === 'todos' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.todos}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ejecucion')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'ejecucion'
                                ? 'bg-text-main text-surface font-semibold shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>En Ejecución</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            activeTab === 'ejecucion' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.ejecucion}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('revision')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'revision'
                                ? 'bg-text-main text-surface font-semibold shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>En Revisión</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            activeTab === 'revision' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.revision}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('borradores')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'borradores'
                                ? 'bg-text-main text-surface font-semibold shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>Borradores</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            activeTab === 'borradores' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.borradores}
                        </span>
                    </button>
                </div>

                {projects.length > 2 && (
                    <div className="relative w-full sm:w-56">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por título o código..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-lg pl-8 pr-2.5 py-1 text-xs text-text-main placeholder:text-text-dim/50 focus:outline-none focus:border-text-dim transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* Estructura Tabular de 1 Sola Capa (divide-y divide-border-thin) */}
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim/50 mb-3 shadow-inner">
                        <Layers size={22} />
                    </div>
                    <h4 className="text-sm font-semibold text-text-main mb-1">Aún no tienes proyectos asignados</h4>
                    <p className="text-xs text-text-dim max-w-sm leading-relaxed mb-4">
                        Puedes postular una nueva propuesta académica en las convocatorias institucionales vigentes o formular un nuevo protocolo.
                    </p>
                    <Link
                        to="/convocatorias"
                        className="btn-vercel-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5 no-underline"
                    >
                        <PlusCircle size={14} />
                        <span>Postular a Convocatoria</span>
                    </Link>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xs text-text-dim">No se encontraron proyectos para el filtro seleccionado.</p>
                </div>
            ) : (
                <div className="divide-y divide-border-thin">
                    {filteredProjects.map((p) => {
                        const progress = getProjectProgress(p);
                        const tCode = p.template_code || p.templateCode || 'PROTOCOLO_INVESTIGACION';
                        const workspaceUrl = buildWorkspacePath(tCode, p.uuid, '', '/investigacion/mis-proyectos');
                        const roleLabel = p.rol_en_proyecto || 'Director';

                        return (
                            <Link
                                key={p.uuid}
                                to={workspaceUrl}
                                className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-hover/50 transition-colors group no-underline text-inherit cursor-pointer"
                            >
                                {/* Columna 1: Información del Proyecto */}
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        {p.codigo_institucional && (
                                            <span className="font-mono text-[10px] text-text-dim font-bold uppercase tracking-wider">
                                                {p.codigo_institucional}
                                            </span>
                                        )}
                                        <span className={`badge-vercel ${progress.badgeClass} !py-0.5 !px-2 text-[9px] font-semibold uppercase tracking-wider`}>
                                            {progress.badgeLabel}
                                        </span>
                                        <span className="badge-vercel badge-vercel-neutral !py-0.5 !px-2 text-[9px] font-medium tracking-wide">
                                            {roleLabel}
                                        </span>
                                    </div>

                                    <h4 
                                        className="text-[14px] font-semibold text-text-main group-hover:text-brand transition-colors tracking-tight leading-snug"
                                        title={p.titulo}
                                    >
                                        {p.titulo || 'Proyecto sin título registrado'}
                                    </h4>

                                    <div className="flex items-center gap-4 text-[11px] text-text-dim mt-2">
                                        {p.fecha_inicio && (
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                                                <Calendar size={11} className="opacity-60" />
                                                <span>Inicio: {new Date(p.fecha_inicio).toLocaleDateString('es-EC')}</span>
                                            </span>
                                        )}
                                        {p.fecha_modificacion && (
                                            <span className="font-mono text-[10px] opacity-70">
                                                Actualizado: {new Date(p.fecha_modificacion).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Columna 2: Avance Visual y Métricas Técnicas */}
                                <div className="w-full lg:w-72 shrink-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                                        <span className="text-[11px] text-text-dim truncate max-w-[190px]" title={progress.label}>
                                            {progress.label}
                                        </span>
                                        <span className="font-semibold text-text-main text-[12px]">
                                            {progress.percentage}%
                                        </span>
                                    </div>

                                    {/* Barra de Progreso Elegante Geist */}
                                    <div className="w-full h-1.5 bg-bg-deep border border-border-thin/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{
                                                width: `${progress.percentage}%`,
                                                backgroundColor: progress.statusColor
                                            }}
                                        />
                                    </div>

                                    {/* Sub-métricas: Informes y Productos */}
                                    <div className="flex items-center justify-between text-[10px] text-text-dim font-mono mt-2">
                                        {(p.total_informes !== undefined && p.total_informes > 0) ? (
                                            <span className="inline-flex items-center gap-1">
                                                <FileText size={10} className="text-info" />
                                                <span>{p.informes_aprobados ?? 0}/{p.total_informes} inf. aprobados</span>
                                            </span>
                                        ) : (
                                            <span className="opacity-50">Sin informes requeridos</span>
                                        )}

                                        {(p.total_productos !== undefined && p.total_productos > 0) && (
                                            <span className="inline-flex items-center gap-1">
                                                <Package size={10} className="text-brand" />
                                                <span>{p.total_productos} prod.</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Columna 3: Acción Directa */}
                                <div className="hidden lg:flex items-center justify-end pl-2 text-text-dim group-hover:text-brand transition-colors">
                                    <span className="text-[11px] font-medium font-mono mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Workspace
                                    </span>
                                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
