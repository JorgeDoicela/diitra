import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, UploadCloud, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { useWorkflowStates, normalizeStateKey } from '../../../../../hooks/useWorkflowStates';

interface WorkspaceHeaderProps {
    currentProject: {
        id: string;
        uuid: string;
        title: string;
        status: string;
        presupuesto: number;
        linea: string;
    };
    isSidebarCollapsed: boolean;
    isPublishingDSpace: boolean;
    urlPrefix: string;
    templateCode?: string;
    onExportCaces: () => void;
    onPublishDSpace: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
    currentProject,
    isSidebarCollapsed,
    isPublishingDSpace,
    urlPrefix,
    templateCode,
    onExportCaces,
    onPublishDSpace
}) => {
    const { states } = useWorkflowStates();
    const isInnovacion = (templateCode || '').includes('INNOVACION') || window.location.pathname.includes('innovacion');
    const returnPath = isInnovacion ? '/innovacion' : urlPrefix;
    const returnLabel = isInnovacion ? 'Innovación' : (urlPrefix.endsWith('mis-proyectos') ? 'Mis Proyectos' : 'Investigación');
    const projectCode = (currentProject as any).codigo_institucional || (currentProject as any).codigo || `Proyecto #${currentProject.id}`;

    // Visibilidad exclusiva en etapa de ejecución / informes de avance
    const normStatus = normalizeStateKey(currentProject?.status || '');
    const matchedState = states.find(s => normalizeStateKey(s.estado) === normStatus);
    const isAvancePhase = matchedState
        ? (matchedState.permiteInformes || matchedState.esFinal)
        : (normStatus.includes('ejecucion') || normStatus.includes('finalizado'));

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 w-full animate-fade-in">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-dim">
                <Link 
                    to={returnPath} 
                    className="p-1 -ml-1 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors inline-flex items-center justify-center no-underline cursor-pointer"
                    title={`Volver a ${returnLabel}`}
                >
                    <ArrowLeft size={14} />
                </Link>
                <Link 
                    to={returnPath}
                    className="hover:text-text-main cursor-pointer transition-colors font-medium no-underline text-inherit"
                >
                    {returnLabel}
                </Link>
                <ChevronRight size={12} className="opacity-50 shrink-0" />
                <span className="text-text-main font-semibold font-mono">{projectCode}</span>
            </nav>

            {isAvancePhase && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end animate-fade-in">
                    <button 
                        onClick={onExportCaces}
                        className="btn-vercel-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 justify-center font-medium cursor-pointer"
                    >
                        <FileText size={13} />
                        <span>Exportar CACES</span>
                    </button>
                    <button 
                        disabled={isPublishingDSpace}
                        onClick={onPublishDSpace}
                        className={`btn-vercel-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 justify-center font-medium cursor-pointer ${isPublishingDSpace ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <UploadCloud size={13} className={isPublishingDSpace ? "animate-pulse" : ""} />
                        <span>{isPublishingDSpace ? 'Publicando...' : 'DSpace'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkspaceHeader;
