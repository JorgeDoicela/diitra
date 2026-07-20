import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useGroupDetail } from './useGroupDetail';

interface GroupProjectsTabProps {
    hook: ReturnType<typeof useGroupDetail>;
}

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const GroupProjectsTab: React.FC<GroupProjectsTabProps> = ({ hook }) => {
    const { detailGroup } = hook;
    
    if (!detailGroup) return null;

    const projectsList = detailGroup.proyectos || detailGroup.Proyectos || [];

    if (projectsList.length === 0) {
        return (
            <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center h-full">
                <div className="p-4 bg-surface rounded-full border border-border-thin mb-4">
                    <BookOpen size={24} className="text-text-dim" />
                </div>
                <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">Sin proyectos adscritos</p>
                <p className="text-[9px] text-text-dim/80 mt-1 max-w-[220px] leading-relaxed uppercase font-mono text-center">
                    Este grupo de investigación no cuenta con proyectos de investigación adscritos registrados.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-deep/5 custom-scrollbar">
            <div className="space-y-3.5">
                {projectsList.map((p: any, idx: number) => {
                    const projectUuid = p.uuid || p.Uuid;
                    const projectTitulo = p.titulo || p.Titulo || '(Sin título)';
                    const projectEstado = p.estado || p.Estado || 'Borrador';
                    const projectCodigo = p.codigo_institucional || p.codigoConversional || p.codigo_proyecto || p.codigoProyecto || p.CodigoInstitucional || 'N/A';
                    const projectDirector = p.director_nombre || p.directorNombre || p.DirectorNombre || 'No asignado';
                    
                    const getStatusColor = (status: string) => {
                        switch (status?.toLowerCase()) {
                            case 'aprobado': return 'badge-vercel-success';
                            case 'borrador': return 'badge-vercel-neutral';
                            case 'pendiente': return 'badge-vercel-warning';
                            case 'en evaluacion':
                            case 'en evaluación': return 'badge-vercel-info';
                            case 'rechazado': return 'badge-vercel-error';
                            default: return 'badge-vercel-info';
                        }
                    };

                    const workspaceLink = `/investigacion/workspace/protocolo-investigacion/${projectUuid}`;

                    return (
                        <div key={projectUuid || idx} className="bento-card static p-5 flex flex-col justify-between hover:border-border-hover hover:bg-surface-hover/10 transition-all duration-300 animate-fade-in">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
                                        {projectCodigo}
                                    </span>
                                    <span className={`badge-vercel ${getStatusColor(projectEstado)} text-[9px] font-bold uppercase`}>
                                        {projectEstado}
                                    </span>
                                </div>
                                <h4 className="text-xs font-semibold text-text-main leading-snug line-clamp-2 uppercase">
                                    {projectTitulo}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-text-dim mt-1.5">
                                    <span className="font-bold">Director:</span>
                                    <span className="font-mono text-text-main truncate max-w-[200px]" title={projectDirector}>
                                        {formatNombre(projectDirector)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-border-thin/20 flex justify-end">
                                <a 
                                    href={workspaceLink}
                                    className="px-3.5 py-1.5 bg-text-main text-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-95 transition-all flex items-center gap-1 shadow-md"
                                >
                                    <span>Espacio de Trabajo</span>
                                    <ChevronRight size={10} />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
