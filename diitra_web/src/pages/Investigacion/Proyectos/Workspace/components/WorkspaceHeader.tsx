import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, UploadCloud, ArrowLeft } from 'lucide-react';
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
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-3.5 bg-bg-deep border-b border-border-thin z-50 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
                {isSidebarCollapsed && (
                    <>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('diitra-toggle-sidebar', { detail: 'expand' }))}
                            className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors duration-150 cursor-pointer animate-fade-in"
                            title="Mostrar panel lateral"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M9 3v18" />
                            </svg>
                        </button>
                        <div className="h-4 w-[1px] bg-border-thin mx-1" />
                    </>
                )}
                <Link 
                    to={returnPath} 
                    className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer inline-flex items-center justify-center"
                    title="Volver"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-dim font-medium">
                        <Link 
                            to={returnPath}
                            className="hover:text-text-main cursor-pointer transition-colors duration-150 no-underline text-inherit"
                        >
                            {returnLabel}
                        </Link>
                        <ChevronRight size={10} className="opacity-60" />
                        <span className="text-text-main font-semibold font-mono">{projectCode}</span>
                    </div>
                </div>
            </div>

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
        </header>
    );
};

export default WorkspaceHeader;
