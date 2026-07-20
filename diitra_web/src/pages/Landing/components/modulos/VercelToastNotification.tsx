import React from 'react';

interface VercelToastNotificationProps {
    showToast: boolean;
}

export const VercelToastNotification: React.FC<VercelToastNotificationProps> = ({ showToast }) => {
    if (!showToast) return null;

    return (
        <div className="toast-container-vercel select-none animate-fade-up">
            <div className="toast-vercel flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
                <div className="flex-1 font-sans">
                    <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider font-mono">Exportación Sincronizada</h4>
                    <p className="text-[10px] text-text-dim mt-0.5 leading-tight">Archivo CACES compilado y cargado en el validador SIIES.</p>
                </div>
            </div>
        </div>
    );
};
