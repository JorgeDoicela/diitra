import React, { useState } from 'react';
import { ArrowLeft, FileText, Eye, Scale, History, Download, Sun, Moon, Edit3, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../api/AuthContext';

interface RevisionHeaderProps {
    projectTitle: string;
    projectUuid: string | undefined;
    projectStatus?: string;
    viewMode: 'interactive' | 'pdf' | 'history';
    setViewMode: (mode: 'interactive' | 'pdf' | 'history') => void;
    onNavigateBack: () => void;
    onOpenFinalizeModal: () => void;
    isReadonly?: boolean;
    pdfUrl?: string | null;
}

export const RevisionHeader: React.FC<RevisionHeaderProps> = ({
    projectTitle,
    projectUuid,
    projectStatus,
    viewMode,
    setViewMode,
    onNavigateBack,
    onOpenFinalizeModal,
    isReadonly = false,
    pdfUrl
}) => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const isAuditActive = isAdmin && (projectStatus === 'Enviado' || projectStatus === 'En Corrección');

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    });

    const toggleTheme = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        document.documentElement.setAttribute('data-theme', nextMode ? 'dark' : 'light');
        localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    };

    const handleDownloadPdf = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        const safeName = projectTitle
            ? projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
            : 'Protocolo_Investigacion';
        link.download = `Protocolo_${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = () => {
        if (!projectStatus) return null;
        let colorClass = 'bg-surface border-border-thin text-text-dim';
        if (projectStatus === 'Enviado') colorClass = 'bg-brand/10 border-brand/30 text-brand';
        else if (projectStatus === 'En Corrección') colorClass = 'bg-warning/10 border-warning/30 text-warning';
        else if (projectStatus === 'En Revisión') colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-500';
        else if (projectStatus === 'Aprobado' || projectStatus === 'En Ejecución') colorClass = 'bg-success/10 border-success/30 text-success';
        
        return (
            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border font-mono ${colorClass}`}>
                {projectStatus}
            </span>
        );
    };

    return (
        <div className="px-4 md:px-6 py-2.5 border-b border-border-thin bg-bg-deep/85 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 z-[50] shrink-0 font-sans">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="flex items-center gap-3">
                    {/* Botón Volver */}
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-border-thin hover:bg-surface-hover text-text-dim hover:text-text-main transition-all duration-200 group cursor-pointer text-[10px] font-bold uppercase tracking-wider bg-surface shadow-2xs active:scale-95"
                        title="Volver al Workspace"
                        aria-label="Volver al Workspace"
                    >
                        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Volver</span>
                    </button>

                    {/* Divisor Vertical */}
                    <div className="h-5 w-[1px] bg-border-thin mx-0.5" />

                    {/* Identidad */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs md:text-sm font-black text-text-main tracking-tight uppercase leading-none truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[460px]" title={projectTitle}>
                                {projectTitle || 'Cargando...'}
                            </h2>
                            {getStatusBadge()}
                        </div>
                        <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest mt-1 truncate">
                            Revisión Técnica del Protocolo de Investigación
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
                {/* Enlaces Rápidos a Workspace y Editor */}
                {projectUuid && (
                    <div className="flex items-center gap-1 border border-border-thin bg-surface p-1 rounded-xl shadow-2xs">
                        <button
                            onClick={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`)}
                            className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-text-dim hover:text-text-main hover:bg-surface-hover transition-all flex items-center gap-1 cursor-pointer"
                            title="Ir al Workspace del Proyecto"
                        >
                            <LayoutDashboard size={11} />
                            <span className="hidden sm:inline">Workspace</span>
                        </button>
                        <button
                            onClick={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}?edit=protocolo-investigacion`)}
                            className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-brand hover:text-brand/90 hover:bg-brand/10 transition-all flex items-center gap-1 cursor-pointer"
                            title="Abrir en Editor Colaborativo"
                        >
                            <Edit3 size={11} />
                            <span>Abrir Editor</span>
                        </button>
                    </div>
                )}

                {/* Selector de Vistas Tri-estado */}
                <div className="flex items-center gap-1 border border-border-thin bg-surface p-1 rounded-xl shadow-2xs">
                    <button
                        onClick={() => setViewMode('interactive')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'interactive'
                            ? 'bg-text-main text-bg-deep font-bold shadow-xs'
                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                            }`}
                        title="Inspeccionar secciones del protocolo"
                    >
                        <Eye size={11} />
                        <span>Revisión Contextual</span>
                    </button>
                    <button
                        onClick={() => setViewMode('pdf')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'pdf'
                            ? 'bg-text-main text-bg-deep font-bold shadow-xs'
                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                            }`}
                        title="Ver documento en PDF oficial"
                    >
                        <FileText size={11} />
                        <span>Vista PDF</span>
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'history'
                            ? 'bg-text-main text-bg-deep font-bold shadow-xs'
                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                            }`}
                        title="Ver dictamen y trazabilidad oficial"
                    >
                        <History size={11} />
                        <span>Historial & Dictamen</span>
                    </button>
                </div>

                {/* Botón Descargar PDF */}
                {pdfUrl && (
                    <button
                        onClick={handleDownloadPdf}
                        className="p-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-thin text-text-main shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                        title="Descargar archivo PDF"
                        aria-label="Descargar archivo PDF"
                    >
                        <Download size={13} />
                    </button>
                )}

                {/* Botón Alternar Tema */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-thin text-text-main shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95"
                    title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    {isDarkMode ? (
                        <Sun size={13} className="text-amber-400 hover:rotate-45 transition-transform" />
                    ) : (
                        <Moon size={13} className="text-text-main hover:-rotate-12 transition-transform" />
                    )}
                </button>

                {/* Botón de Auditoría Activa */}
                {isAuditActive ? (
                    <button
                        onClick={onOpenFinalizeModal}
                        className="px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-brand text-white hover:bg-brand/90 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                        <Scale size={12} />
                        Emitir Dictamen
                    </button>
                ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-surface border border-border-thin text-text-dim flex items-center gap-1.5 font-mono shadow-2xs">
                        Consulta
                    </span>
                )}
            </div>
        </div>
    );
};
