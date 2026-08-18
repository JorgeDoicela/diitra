import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ShieldCheck, X, FileCheck2, ArrowRight } from 'lucide-react';

export interface TimedSuccessModalDetail {
    label: string;
    value: string;
}

export interface TimedSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    durationMs?: number;
    title?: string;
    subtitle?: string;
    badgeText?: string;
    details?: TimedSuccessModalDetail[];
    showProgress?: boolean;
    primaryButtonText?: string;
    onPrimaryClick?: () => void;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const TimedSuccessModal: React.FC<TimedSuccessModalProps> = ({
    isOpen,
    onClose,
    durationMs = 4500,
    title = '¡Documento Firmado Exitosamente!',
    subtitle = 'Su firma institucional ha sido verificada y estampada en el documento oficial con trazabilidad inmutable.',
    badgeText = 'Firma Electrónica Certificada',
    details,
    showProgress = true,
    primaryButtonText = 'Entendido',
    onPrimaryClick,
    icon: IconComponent = ShieldCheck
}) => {
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setProgress(100);
            setIsPaused(false);
            return;
        }

        const intervalStepMs = 50;
        const decrement = (intervalStepMs / durationMs) * 100;

        const interval = setInterval(() => {
            if (!isPaused) {
                setProgress(prev => {
                    if (prev <= decrement) {
                        clearInterval(interval);
                        onClose();
                        return 0;
                    }
                    return prev - decrement;
                });
            }
        }, intervalStepMs);

        return () => clearInterval(interval);
    }, [isOpen, durationMs, isPaused, onClose]);

    // Manejo de teclado (Escape)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleAction = () => {
        if (onPrimaryClick) {
            onPrimaryClick();
        }
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-md bg-surface border border-border-thin rounded-2xl shadow-2xl overflow-hidden animate-fade-up flex flex-col text-center"
                onClick={e => e.stopPropagation()}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Botón Cerrar */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-text-dim hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer z-10"
                    title="Cerrar modal"
                >
                    <X size={18} />
                </button>

                {/* Contenido Principal */}
                <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
                    {/* Badge y Halo de Éxito */}
                    <div className="relative flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.25)] animate-pulse">
                            <IconComponent size={32} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-bg-deep rounded-full p-1 border-2 border-surface shadow-sm">
                            <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                    </div>

                    {/* Badge Superior */}
                    {badgeText && (
                        <span className="badge-vercel badge-vercel-success text-[10px] font-bold uppercase tracking-wider">
                            {badgeText}
                        </span>
                    )}

                    {/* Título y Subtítulo */}
                    <div className="space-y-1.5">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-text-main font-sans">
                            {title}
                        </h3>
                        <p className="text-xs text-text-dim leading-relaxed font-sans max-w-sm mx-auto">
                            {subtitle}
                        </p>
                    </div>

                    {/* Detalles / Metadatos (Opcional) */}
                    {details && details.length > 0 && (
                        <div className="w-full bg-bg-deep/60 border border-border-thin rounded-xl p-3.5 space-y-2 text-left mt-1">
                            {details.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim shrink-0">
                                        {item.label}:
                                    </span>
                                    <span className="font-semibold text-text-main text-right truncate">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botón de acción */}
                    <div className="w-full pt-2">
                        <button
                            type="button"
                            onClick={handleAction}
                            className="w-full py-2.5 px-4 bg-text-main text-bg-deep hover:bg-text-main/90 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>{primaryButtonText}</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Barra de Progreso Temporal (Auto-dismiss) */}
                {showProgress && (
                    <div className="w-full h-1 bg-border-thin overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
