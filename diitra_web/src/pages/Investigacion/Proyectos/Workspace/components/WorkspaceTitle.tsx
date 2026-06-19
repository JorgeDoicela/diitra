import React from 'react';
import { FileSignature } from 'lucide-react';
import { useWorkflowStates } from '../../../../../hooks/useWorkflowStates';

interface WorkspaceTitleProps {
    currentProject: {
        title: string;
        status: string;
        uuid: string;
        id: string;
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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-text-main uppercase tracking-[0.3em]">
                        <span className={`badge-vercel ${cfg.badge} text-[9px]`} style={cfg.style}>
                            <span className={`dot ${cfg.dot}`} style={cfg.dotStyle} />
                            {cfg.label}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">{currentProject.title?.trim() || '(Sin título)'}</h2>
                    <p className="text-sm text-text-dim max-w-lg font-medium">Gestión del ciclo de vida institucional del proyecto de investigación.</p>
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
                            <p className="text-xs text-text-dim mt-1.5 leading-relaxed max-w-xl">
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
