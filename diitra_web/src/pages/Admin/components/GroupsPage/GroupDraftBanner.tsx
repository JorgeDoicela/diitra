import React from 'react';
import { FileText } from 'lucide-react';
import type { PendingDraft } from './types';

interface GroupDraftBannerProps {
    pendingDraft: PendingDraft;
    onRestore: () => void;
    onDiscard: () => void;
}

export const GroupDraftBanner: React.FC<GroupDraftBannerProps> = ({
    pendingDraft,
    onRestore,
    onDiscard,
}) => {
    return (
        <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                    <FileText size={16} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-main">Borrador detectado</h4>
                        <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                            No guardado
                        </span>
                    </div>
                    <p className="text-xs text-text-dim">
                        Tienes un borrador sin guardar del grupo <span className="text-text-main font-medium">"{pendingDraft.groupName}"</span>.
                    </p>
                    <p className="text-[10px] text-text-dim/60 font-mono">
                        Guardado automáticamente el {new Date(pendingDraft.timestamp).toLocaleDateString()} a las {new Date(pendingDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0">
                <button
                    onClick={onRestore}
                    className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                >
                    Restaurar borrador
                </button>
                <button
                    onClick={onDiscard}
                    className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                >
                    Descartar
                </button>
            </div>
        </div>
    );
};
