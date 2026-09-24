import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowRight, 
    Layers, PlusCircle
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
    director_nombre?: string;
    carrera?: string;
    linea_investigacion?: string;
    convocatoria_titulo?: string;
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

type FilterTab = 'todos' | 'ejecucion' | 'revision' | 'borradores' | 'inconclusos';

export const DocenteProjectsProgressWidget: React.FC<DocenteProjectsProgressWidgetProps> = ({
    projects,
    loading: _loading = false
}) => {
    const [activeTab, setActiveTab] = useState<FilterTab>('todos');

    // Filtrar proyectos según tab
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const estadoUpper = (p.estado || '').toUpperCase();
            
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
            } else if (activeTab === 'inconclusos') {
                if (estadoUpper !== 'INCONCLUSO') {
                    return false;
                }
            }

            return true;
        });
    }, [projects, activeTab]);

    // Contadores de pestañas
    const tabCounts = useMemo(() => {
        let ejecucion = 0;
        let revision = 0;
        let borradores = 0;
        let inconclusos = 0;

        projects.forEach(p => {
            const u = (p.estado || '').toUpperCase();
            if (u === 'EN EJECUCIÓN' || u === 'EN_EJECUCION' || u === 'APROBADO') ejecucion++;
            else if (u === 'EN REVISIÓN' || u === 'EN_REVISION' || u === 'ENVIADO' || u === 'PENDIENTE' || u === 'EN CORRECCIÓN') revision++;
            else if (u === 'BORRADOR' || u === 'PREPROPUESTA') borradores++;
            else if (u === 'INCONCLUSO') inconclusos++;
        });

        return { todos: projects.length, ejecucion, revision, borradores, inconclusos };
    }, [projects]);

    return (
        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden animate-fade-up">
            {/* Cabecera y Filtros */}
            <div className="p-5 pb-3.5 border-b border-border-thin">
                <h3 className="text-lg font-bold tracking-tight text-text-main mb-3">
                    Seguimiento y Avance de Proyectos
                </h3>

                {/* Barra de Filtros Minimalista */}
                <div className="flex items-center gap-1 p-0.5 bg-surface border border-border-thin rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('todos')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'todos'
                                ? 'bg-text-main text-surface font-semibold shadow-xs'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>Todos</span>
                        <span className={`text-[10px] font-mono px-1 rounded-full ${
                            activeTab === 'todos' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.todos}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ejecucion')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'ejecucion'
                                ? 'bg-text-main text-surface font-semibold shadow-xs'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>En Ejecución</span>
                        <span className={`text-[10px] font-mono px-1 rounded-full ${
                            activeTab === 'ejecucion' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.ejecucion}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('revision')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'revision'
                                ? 'bg-text-main text-surface font-semibold shadow-xs'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>En Revisión</span>
                        <span className={`text-[10px] font-mono px-1 rounded-full ${
                            activeTab === 'revision' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.revision}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('borradores')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'borradores'
                                ? 'bg-text-main text-surface font-semibold shadow-xs'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        <span>Borradores</span>
                        <span className={`text-[10px] font-mono px-1 rounded-full ${
                            activeTab === 'borradores' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                        }`}>
                            {tabCounts.borradores}
                        </span>
                    </button>
                    {tabCounts.inconclusos > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('inconclusos')}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'inconclusos'
                                    ? 'bg-text-main text-surface font-semibold shadow-xs'
                                    : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            <span>Inconclusos</span>
                            <span className={`text-[10px] font-mono px-1 rounded-full ${
                                activeTab === 'inconclusos' ? 'bg-surface/20 text-surface' : 'bg-bg-deep text-text-dim'
                            }`}>
                                {tabCounts.inconclusos}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Listado Limpio y de Alta Densidad */}
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim/50 mb-2.5">
                        <Layers size={18} />
                    </div>
                    <h4 className="text-xs font-semibold text-text-main mb-1">Sin proyectos registrados</h4>
                    <p className="text-xs text-text-dim max-w-xs mb-3">
                        No tienes propuestas en curso en este periodo académico.
                    </p>
                    <Link
                        to="/convocatorias"
                        className="btn-vercel-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 no-underline"
                    >
                        <PlusCircle size={13} />
                        <span>Postular Convocatoria</span>
                    </Link>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-xs text-text-dim">No hay proyectos para el filtro seleccionado.</p>
                </div>
            ) : (
                <div className="divide-y divide-border-thin">
                    {filteredProjects.map((p) => {
                        const progress = getProjectProgress(p);
                        const tCode = p.template_code || p.templateCode || 'PROTOCOLO_INVESTIGACION';
                        const workspaceUrl = buildWorkspacePath(tCode, p.uuid, '', '/investigacion/mis-proyectos');
                        const fechaFormateada = p.fecha_modificacion
                            ? new Date(p.fecha_modificacion).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })
                            : p.fecha_inicio
                            ? new Date(p.fecha_inicio).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })
                            : null;

                        return (
                            <Link
                                key={p.uuid}
                                to={workspaceUrl}
                                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-surface-hover/60 transition-colors group no-underline text-inherit cursor-pointer"
                            >
                                {/* Información Mínima: Estado + Fecha + Título */}
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap text-[11px] text-text-dim">
                                        {/* Estado en texto con color semántico directo (sin bordes ni fondo) */}
                                        <span
                                            className="font-bold uppercase tracking-wider text-[10px]"
                                            style={{ color: progress.statusColor }}
                                        >
                                            {progress.badgeLabel}
                                        </span>

                                        {/* Fecha mínima */}
                                        {fechaFormateada && (
                                            <span className="font-mono text-[10px] text-text-dim/60">
                                                · {fechaFormateada}
                                            </span>
                                        )}
                                    </div>

                                    {/* Título Limpio */}
                                    <h4 
                                        className="text-[13.5px] font-medium text-text-main group-hover:text-brand transition-colors tracking-tight leading-snug truncate"
                                        title={p.titulo}
                                    >
                                        {p.titulo || 'Proyecto sin título'}
                                    </h4>
                                </div>

                                {/* Progreso Mínimo y Flecha */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-24 sm:w-32 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-bg-deep border border-border-thin/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.max(progress.percentage, 3)}%`,
                                                    backgroundColor: progress.statusColor
                                                }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono font-medium text-text-dim w-7 text-right">
                                            {progress.percentage}%
                                        </span>
                                    </div>

                                    <ArrowRight size={14} className="text-text-dim/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
