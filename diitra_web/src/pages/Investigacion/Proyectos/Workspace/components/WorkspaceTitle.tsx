import React from 'react';
import { FileSignature } from 'lucide-react';
import { useWorkflowStates } from '../../../../../hooks/useWorkflowStates';

interface WorkspaceTitleProps {
    currentProject: {
        title: string;
        status: string;
        uuid: string;
        id: string;
        tieneGrupoInvestigacion?: boolean;
        grupoInvestigacion?: string;
    };
    user: any;
    templateCode: string;
    setActiveDocument: (doc: string) => void;
}

export const WorkspaceTitle: React.FC<WorkspaceTitleProps> = ({
    currentProject,
    templateCode,
    setActiveDocument
}) => {
    const { getEstadoConfig } = useWorkflowStates();
    const cfg = getEstadoConfig(currentProject.status);
    return (
        <>
            {/* ── Page Title ── */}
            <header className="mb-6 md:mb-8 animate-fade-in">
                <div className="space-y-3 max-w-4xl">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight leading-snug break-words">
                        {currentProject.title?.trim() || '(Sin título)'}
                    </h1>

                    {/* Metadatos y Badges en una sola línea ordenada */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {((currentProject as any).codigo_institucional || (currentProject as any).codigo) && (
                            <span className="text-[11px] font-mono bg-surface border border-border-thin rounded px-2 py-0.5 text-text-dim font-medium">
                                {(currentProject as any).codigo_institucional || (currentProject as any).codigo}
                            </span>
                        )}
                        <div className={`badge-vercel ${cfg.badge} text-[11px] !py-0.5 !px-2.5 font-medium`}>
                            <span className={`dot ${cfg.dot}`} />
                            {cfg.label}
                        </div>
                        {currentProject.tieneGrupoInvestigacion && currentProject.grupoInvestigacion && (
                            <span className="badge-vercel badge-vercel-brand text-[11px] !py-0.5 !px-2.5 font-medium">
                                Grupo: {currentProject.grupoInvestigacion}
                            </span>
                        )}
                        {(currentProject as any).linea && (
                            <span className="text-[11px] text-text-dim bg-surface border border-border-thin rounded px-2 py-0.5 truncate max-w-[280px]" title={(currentProject as any).linea}>
                                {(currentProject as any).linea}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {templateCode && templateCode !== 'PROTOCOLO_INVESTIGACION' && (
                <div className="mb-8 p-6 rounded-2xl bg-surface border border-brand/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-5 -mt-5 group-hover:bg-brand/10 transition-colors duration-500" />
                    <div className="flex items-start gap-4">
                        <div className="icon-circle-brand shrink-0 !p-3">
                            <FileSignature size={18} className="text-brand" />
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-text-main uppercase tracking-widest">
                                {templateCode === 'INFORME_FINAL_INVESTIGACION' ? 'Informe Final en Proceso' : 'Documento en Edición'}
                            </h3>
                            <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                                Estás en el espacio de trabajo de este proyecto. Puedes continuar completando los campos colaborativos del {templateCode === 'INFORME_FINAL_INVESTIGACION' ? 'informe final' : 'documento'} o revisar el estado institucional abajo.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveDocument(templateCode)}
                        className="btn-vercel-primary py-3 px-6 text-xs w-full md:w-auto shrink-0 justify-center"
                    >
                        <FileSignature size={14} />
                        <span>Continuar Editando</span>
                    </button>
                </div>
            )}
        </>
    );
};

export default WorkspaceTitle;
