import React from 'react';
import { FileText } from 'lucide-react';
import { PendingUserDraft, PendingExternalDraft } from '../../hooks/useUsersPage';

interface DraftBannersProps {
    pendingUserDraft: PendingUserDraft | null;
    handleRestoreUserDraft: () => void;
    handleDiscardUserDraft: () => void;
    pendingExternalDraft: PendingExternalDraft | null;
    handleRestoreExternalDraft: () => void;
    handleDiscardExternalDraft: () => void;
}

export const DraftBanners: React.FC<DraftBannersProps> = ({
    pendingUserDraft,
    handleRestoreUserDraft,
    handleDiscardUserDraft,
    pendingExternalDraft,
    handleRestoreExternalDraft,
    handleDiscardExternalDraft
}) => {
    return (
        <>
            {/* Banner de Recuperación de Borrador de Perfil de Investigador */}
            {pendingUserDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-text-main">Perfil en borrador</h4>
                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                    No guardado
                                </span>
                            </div>
                            <p className="text-xs text-text-dim">
                                Tienes cambios sin guardar en el perfil de <span className="text-text-main font-medium">"{pendingUserDraft.userName}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingUserDraft.timestamp).toLocaleDateString()} a las {new Date(pendingUserDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreUserDraft}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar perfil
                        </button>
                        <button
                            onClick={handleDiscardUserDraft}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* Banner de Recuperación de Borrador de Evaluador Externo */}
            {pendingExternalDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-text-main">Borrador de evaluador</h4>
                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                    No guardado
                                </span>
                            </div>
                            <p className="text-xs text-text-dim">
                                Tienes un borrador de nuevo evaluador externo: <span className="text-text-main font-medium">"{pendingExternalDraft.name}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingExternalDraft.timestamp).toLocaleDateString()} a las {new Date(pendingExternalDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreExternalDraft}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar evaluador
                        </button>
                        <button
                            onClick={handleDiscardExternalDraft}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
