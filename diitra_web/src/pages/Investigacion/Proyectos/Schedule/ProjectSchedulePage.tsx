import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import api from '../../../../api/axios_config';
import { ProjectScheduleModule } from '../../../../modules/schedule';

export const ProjectSchedulePage: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const isMisProyectos = location.pathname.includes('/mis-proyectos');
    const templateCode = (project?.template_code || project?.templateCode || 'PROTOCOLO_INVESTIGACION').toLowerCase().replace(/_/g, '-');

    const workspaceUrl = projectUuid
        ? (isMisProyectos
            ? `/investigacion/mis-proyectos/workspace/${templateCode}/${projectUuid}`
            : `/investigacion/workspace/${templateCode}/${projectUuid}`)
        : '/investigacion/mis-proyectos';

    useEffect(() => {
        if (!projectUuid) return;
        const fetchProject = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get(`/projects/${projectUuid}/detail`);
                setProject(res.data);
            } catch (err: any) {
                console.error('[ProjectSchedulePage] Error fetching project:', err);
                setError(err.response?.data?.message || 'No se pudo cargar la información del proyecto.');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectUuid]);

    if (loading && !project) {
        return (
            <div className="flex-1 bg-bg-deep min-h-screen p-6 md:p-10 space-y-6 animate-pulse">
                <div className="h-6 bg-surface-hover/60 rounded w-1/4"></div>
                <div className="h-10 bg-surface-hover/40 rounded w-1/2"></div>
                <div className="h-96 bg-surface-hover/20 rounded-2xl"></div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="flex-1 bg-bg-deep min-h-screen flex items-center justify-center p-6 text-center">
                <div className="bento-card bg-surface p-8 max-w-md space-y-4 shadow-xl border border-border-thin">
                    <h3 className="text-red-500 font-bold text-base">Error al Cargar Cronograma</h3>
                    <p className="text-xs text-text-dim">{error}</p>
                    <Link to={workspaceUrl} className="btn-vercel-primary text-xs py-2 px-4 inline-block no-underline">
                        Volver al Workspace
                    </Link>
                </div>
            </div>
        );
    }

    const title = project?.titulo || project?.title || 'Proyecto de Investigación';
    const code = project?.codigo_institucional || project?.codigoInstitucional || project?.codigo || (projectUuid ? `#${projectUuid.slice(0, 8).toUpperCase()}` : '');
    const estado = project?.estado || 'En Ejecución';

    return (
        <div className="flex-1 bg-bg-deep min-h-screen text-text-main p-4 md:p-8 space-y-6">
            {/* Cabecera y Navegación de Retorno */}
            <div className="space-y-3 border-b border-border-thin pb-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(workspaceUrl)}
                        className="p-2 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all cursor-pointer"
                        title="Volver al Workspace del Proyecto"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="flex items-center gap-2 text-xs text-text-dim">
                        <Link to={isMisProyectos ? '/investigacion/mis-proyectos' : '/investigacion'} className="hover:text-text-main no-underline text-text-dim">
                            {isMisProyectos ? 'Mis Proyectos' : 'Investigación'}
                        </Link>
                        <span>›</span>
                        <Link to={workspaceUrl} className="hover:text-text-main no-underline text-text-dim font-mono">
                            Proyecto {code}
                        </Link>
                        <span>›</span>
                        <span className="text-text-main font-semibold">Cronograma de Actividades</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="badge-vercel badge-vercel-neutral font-mono text-[10px] font-bold">
                                {code}
                            </span>
                            <span className="badge-vercel text-[10px] font-medium">
                                {estado}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-main mt-1">
                            {title}
                        </h1>
                    </div>

                    <Link
                        to={workspaceUrl}
                        className="btn-vercel-secondary text-xs py-2 px-3 self-start md:self-auto flex items-center gap-1.5 no-underline"
                    >
                        <ArrowLeft size={13} />
                        <span>Volver al Workspace</span>
                    </Link>
                </div>
            </div>

            {/* Módulo Principal de Cronograma en Vista Completa Dedicada */}
            {projectUuid && (
                <div className="animate-fade-in">
                    <ProjectScheduleModule
                        projectUuid={projectUuid}
                        projectTitle={title}
                        modalidad={project?.modalidad}
                        modalidadEquipo={project?.modalidadEquipo || (project?.idGrupo ? 'GRUPO' : 'INDIVIDUAL')}
                        grupoInvestigacion={project?.grupoInvestigacionNombre || project?.grupoInvestigacion}
                    />
                </div>
            )}
        </div>
    );
};

export default ProjectSchedulePage;
