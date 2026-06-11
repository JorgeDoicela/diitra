import React from 'react';
import { Shield, UploadCloud, BarChart } from 'lucide-react';
import WorkspaceActivityPanel from '../WorkspaceActivityPanel';

interface WorkspaceSidebarProps {
    currentProject: {
        linea: string;
        presupuesto: number;
    };
    resolvedProjectUuid: string | null;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
    currentProject,
    resolvedProjectUuid
}) => {
    return (
        <div className="flex flex-col gap-3">
            {/* Firmas */}
            <div className="bento-card static p-6 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-brand/10 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <Shield size={16} className="text-brand group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Bóveda de Firmas</h3>
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed mt-1">Sube tu certificado digital (.p12 o .pfx) para la firma electrónica del protocolo institucional.</p>
                </div>
                <div className="mt-5 space-y-2.5">
                    <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between hover:border-border-hover hover:bg-surface-hover/20 transition-all">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-main">Director de Proyecto</p>
                            <div className="flex items-center">
                                <span className="badge-vercel badge-vercel-warning text-[9px] font-semibold py-0">
                                    <span className="dot dot-warning dot-pulse" />
                                    Pendiente
                                </span>
                            </div>
                        </div>
                        <button type="button" className="p-2.5 bg-surface border border-border-thin hover:border-text-main hover:bg-surface-hover text-text-dim hover:text-text-main rounded-xl transition-all shadow-sm cursor-pointer" title="Cargar certificado digital">
                            <UploadCloud size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="bento-card static p-6 flex flex-col justify-between group">
                <div>
                    <div className="flex items-center gap-2.5 mb-3">
                        <BarChart size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Datos normativos CACES</h3>
                    </div>
                </div>
                <div className="space-y-2.5 mt-2">
                    <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all space-y-1">
                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Línea de Investigación</span>
                        <span className="text-xs font-medium text-text-main leading-relaxed">{currentProject.linea || 'No definida'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Presupuesto Aprobado</span>
                            <span className="text-sm font-bold text-success font-mono">
                                ${Number(currentProject.presupuesto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <span className="badge-vercel badge-vercel-success text-[8px] font-bold uppercase tracking-wider">USD</span>
                    </div>
                </div>
            </div>

            {/* Panel de Actividad Reciente */}
            {resolvedProjectUuid && (
                <div className="bento-card static flex flex-col overflow-hidden">
                    <WorkspaceActivityPanel
                        projectUuid={resolvedProjectUuid}
                    />
                </div>
            )}
        </div>
    );
};

export default WorkspaceSidebar;
