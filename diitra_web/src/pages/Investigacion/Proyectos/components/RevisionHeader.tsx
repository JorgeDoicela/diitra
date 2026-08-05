import React from 'react';
import { ArrowLeft, FileText, Eye, Scale, History } from 'lucide-react';
import { useAuth } from '../../../../api/AuthContext';

interface RevisionHeaderProps {
    projectTitle: string;
    projectUuid: string | undefined;
    projectStatus?: string;
    viewMode: 'interactive' | 'pdf';
    setViewMode: (mode: 'interactive' | 'pdf') => void;
    onNavigateBack: () => void;
    onOpenFinalizeModal: () => void;
    isReadonly?: boolean;
}

export const RevisionHeader: React.FC<RevisionHeaderProps> = ({
    projectTitle,
    projectStatus,
    viewMode,
    setViewMode,
    onNavigateBack,
    onOpenFinalizeModal,
    isReadonly = false
}) => {
    const { isAdmin } = useAuth();
    const isAuditActive = isAdmin && (projectStatus === 'Enviado' || projectStatus === 'En Corrección');

    return (
        <div className="px-4 md:px-8 py-3 border-b border-border-thin bg-bg-deep/75 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 z-[50] shrink-0">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <div className="flex items-center gap-3">
                    {/* Botón Volver/Cerrar */}
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center gap-2 py-1.5 text-text-dim hover:text-text-main transition-all duration-200 group cursor-pointer text-[10px] md:text-xs font-bold uppercase tracking-wider bg-transparent border-0 active:scale-95"
                        title="Salir del documento"
                        aria-label="Salir del documento"
                    >
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Volver</span>
                    </button>

                    {/* Divisor Vertical */}
                    <div className="h-5 w-[1px] bg-border-thin mx-1" />

                    {/* Identidad */}
                    <div className="min-w-0">
                        <h2 className="text-xs md:text-sm font-black text-text-main tracking-tighter uppercase leading-none truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]" title={projectTitle}>
                            {projectTitle || 'Cargando...'}
                        </h2>
                        <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest mt-0.5 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-[380px] lg:max-w-[500px]">
                            Revisión Técnica del Protocolo de Investigación
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Selector de Vista — solo en modo auditoría activo */}
                {!isReadonly && (
                    <div className="flex items-center gap-1.5 border border-border-thin bg-surface-hover/30 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('pdf')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'pdf'
                                ? 'bg-text-main text-bg-deep font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                }`}
                        >
                            <FileText size={12} />
                            Vista PDF
                        </button>
                        <button
                            onClick={() => setViewMode('interactive')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'interactive'
                                ? 'bg-text-main text-bg-deep font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                }`}
                        >
                            <Eye size={12} />
                            Revisión Contextual
                        </button>
                    </div>
                )}

                {/* Badge o botón según modo */}
                {isReadonly ? (
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-surface border border-border-thin text-text-dim flex items-center gap-1.5">
                        <History size={11} />
                        Historial de Revisión
                    </span>
                ) : isAuditActive ? (
                    <button
                        onClick={onOpenFinalizeModal}
                        className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-brand text-white hover:bg-brand/90 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-150"
                    >
                        <Scale size={12} />
                        Finalizar Auditoría
                    </button>
                ) : (
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-surface border border-border-thin text-text-dim flex items-center gap-1.5">
                        Vista de Consulta
                    </span>
                )}
            </div>
        </div>
    );
};
