import React from 'react';
import { ChevronRight, FileText, UploadCloud, ArrowLeft, Activity } from 'lucide-react';

const ESTADO_CONFIG: Record<string, { badge: string; dot: string }> = {
    'Borrador':     { badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
    'Enviado':      { badge: 'badge-vercel-info',    dot: 'dot-info' },
    'En Revisión':  { badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Aprobado':     { badge: 'badge-vercel-success', dot: 'dot-success' },
    'En Ejecución': { badge: 'badge-vercel-violet',  dot: 'dot-brand dot-pulse' },
    'Finalizado':   { badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazado':    { badge: 'badge-vercel-error',   dot: 'dot-error' },
};

const estadoConfig = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { badge: 'badge-vercel-neutral', dot: 'dot-neutral' };

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
            <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
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
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                            <Activity size={10} strokeWidth={2} className="text-brand" />
                            <span>Proyecto · ISTPET</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-dim">
                            <span>diitra</span>
                            <ChevronRight size={10} />
                            <span className="text-text-main font-mono">{currentProject.id}</span>
                        </div>
                    </div>
                </div>
                {/* Badge de estado en dispositivos móviles */}
                <div className="sm:hidden">
                    <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-semibold`}>
                        <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                        {currentProject.status}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
                {/* Badge de estado en pantallas medianas y grandes */}
                <div className="hidden sm:block mr-1">
                    <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-semibold`}>
                        <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                        {currentProject.status}
                    </span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
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
            </div>
        </header>
    );
};

export default WorkspaceHeader;
