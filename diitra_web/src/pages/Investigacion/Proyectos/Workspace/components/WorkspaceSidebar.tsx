import React from 'react';
import { Shield, BarChart, FileSignature, CheckCircle2 } from 'lucide-react';
import WorkspaceActivityPanel from '../WorkspaceActivityPanel';

interface WorkspaceSidebarProps {
    currentProject: {
        linea: string;
        presupuesto: number;
        status: string;
        puedeEditar?: boolean;
        puedeFirmar?: boolean;
        directorProyecto?: string;
        dominio?: string;
    };
    resolvedProjectUuid: string | null;
    setActiveDocument?: (doc: string) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
    currentProject,
    resolvedProjectUuid,
    setActiveDocument
}) => {
    const isSigned = currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección';

    return (
        <div className="flex flex-col gap-3">
            {/* Firmas */}
            <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-brand/10 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <Shield size={16} className="text-brand group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Firmas del Protocolo</h3>
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                        Estado de validez y firmas electrónicas del protocolo institucional.
                    </p>
                </div>
                <div className="mt-5">
                    {/* Tarjeta del firmante (Director) */}
                    <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between hover:border-border-hover hover:bg-surface-hover/20 transition-all mb-4">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-main">Director de Proyecto</p>
                            <div className="flex items-center">
                                {isSigned ? (
                                    <span className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1">
                                        <CheckCircle2 size={10} />
                                        Firmado
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-semibold text-warning flex items-center gap-1">
                                        <span className="dot dot-warning dot-pulse" />
                                        Pendiente
                                    </span>
                                )}
                            </div>
                        </div>
                        {isSigned && (
                            <span className="text-emerald-500/80 p-1" title="Firma electrónica válida">
                                <CheckCircle2 size={16} />
                            </span>
                        )}
                    </div>

                    {/* Botón de acción principal */}
                    {!isSigned && currentProject.puedeFirmar && setActiveDocument && (
                        <button
                            type="button"
                            onClick={() => setActiveDocument('PROTOCOLO_INVESTIGACION')}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-brand hover:bg-brand/90 text-bg-deep text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer mb-1"
                        >
                            <FileSignature size={12} />
                            <span>Ir a Firmar Documento</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="bento-card static p-5 flex flex-col justify-between group">
                <div>
                    <div className="flex items-center gap-2.5 mb-3">
                        <BarChart size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Datos normativos CACES</h3>
                    </div>
                </div>
                <div className="space-y-2.5 mt-2">
                    {currentProject.dominio && (
                        <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all space-y-1">
                            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Dominio Académico</span>
                            <span className="text-xs font-medium text-text-main leading-relaxed">{currentProject.dominio}</span>
                        </div>
                    )}
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
                        <span className="text-[8px] font-bold uppercase tracking-wider text-success">USD</span>
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
