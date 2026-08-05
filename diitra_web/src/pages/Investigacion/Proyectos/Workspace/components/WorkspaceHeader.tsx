import React from 'react';
import { ChevronRight, FileText, UploadCloud, ArrowLeft } from 'lucide-react';
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
    navigate: (path: string) => void;
    onExportCaces: () => void;
    onPublishDSpace: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
    currentProject,
    isSidebarCollapsed,
    isPublishingDSpace,
    urlPrefix,
    navigate,
    onExportCaces,
    onPublishDSpace
}) => {
    return (
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-4 bg-bg-deep border-b border-border-thin z-50 gap-4 sm:gap-0">
            <div className="flex items-center gap-4">
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
                <button 
                    onClick={() => navigate(urlPrefix)} 
                    className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    title="Volver"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-dim">
                        <span 
                            className="hover:text-text-main cursor-pointer transition-colors duration-150"
                            onClick={() => navigate(urlPrefix)}
                        >
                            {urlPrefix.endsWith('mis-proyectos') ? 'Mis Proyectos' : 'Investigación'}
                        </span>
                        <ChevronRight size={10} className="opacity-60" />
                        <span className="text-text-main font-semibold font-mono">Proyecto #{currentProject.id}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                    onClick={onExportCaces}
                    className="btn-vercel-secondary !py-2 text-xs flex-1 sm:flex-none justify-center"
                >
                    <FileText size={14} />
                    <span>Exportar CACES</span>
                </button>
                <button 
                    disabled={isPublishingDSpace}
                    onClick={onPublishDSpace}
                    className={`btn-vercel-primary !py-2 text-xs flex-1 sm:flex-none justify-center ${isPublishingDSpace ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <UploadCloud size={14} className={isPublishingDSpace ? "animate-pulse" : ""} />
                    <span>{isPublishingDSpace ? 'Publicando...' : 'DSpace'}</span>
                </button>
            </div>
        </header>
    );
};

export default WorkspaceHeader;
