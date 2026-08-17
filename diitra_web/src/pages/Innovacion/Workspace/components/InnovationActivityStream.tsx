import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface Props {
    assetUuid: string;
}

export const InnovationActivityStream: React.FC<Props> = () => {
    return (
        <div className="bento-card static p-5 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-text-dim group-hover:text-text-main transition-colors" />
                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                        Actividad Reciente
                    </h3>
                </div>
                <button
                    className="p-1 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors border-0 bg-transparent cursor-pointer"
                    title="Actualizar actividad"
                >
                    <RefreshCw size={12} />
                </button>
            </div>

            <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-border-thin flex items-center justify-center mx-auto text-text-dim">
                    <Activity size={14} />
                </div>
                <p className="text-xs text-text-dim">
                    Sin actividad registrada aún en este activo.
                </p>
            </div>
        </div>
    );
};
