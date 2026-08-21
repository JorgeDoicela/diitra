import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';

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
}

export const TimedSuccessModal: React.FC<TimedSuccessModalProps> = ({
    isOpen,
    onClose,
    durationMs = 5000,
    title = 'Documento Firmado Exitosamente',
    subtitle = 'Su firma institucional ha sido estampada y certificada en el documento oficial con trazabilidad inmutable.',
    badgeText = 'Firma Electrónica Certificada',
    details,
    showProgress = true,
    primaryButtonText = 'Entendido',
    onPrimaryClick
}) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!isOpen) {
            setProgress(100);
            return;
        }

        const intervalStepMs = 40;
        const decrement = (intervalStepMs / durationMs) * 100;

        // Temporizador ininterrumpido: avanza continuamente con o sin cursor
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev <= decrement) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return prev - decrement;
            });
        }, intervalStepMs);

        return () => clearInterval(interval);
    }, [isOpen, durationMs, onClose]);

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
        <div className="fixed inset-0 z-[10000] flex justify-end select-none">
            {/* Backdrop con desenfoque suave */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel Lateral Derecho (Side Drawer) */}
            <div
                className="relative flex h-full w-full max-w-lg bg-surface border-l border-border-thin shadow-2xl flex-col z-10 animate-fade-in-right overflow-hidden font-sans"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Barra Superior de Progreso Temporal (Auto-cierre ininterrumpido) */}
                {showProgress && (
                    <div className="w-full h-1 bg-border-thin overflow-hidden shrink-0">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Cabecera Minimalista del Drawer */}
                <div className="border-b border-border-thin flex justify-between items-start p-5 sm:p-6 shrink-0 bg-surface">
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-text-main font-sans truncate">
                            {title}
                        </h3>
                        <p className="section-label text-text-dim">
                            {badgeText} — DIITRA
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-surface-hover rounded-xl text-text-dim hover:text-text-main transition-all cursor-pointer shrink-0"
                        title="Cerrar panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Cuerpo del Drawer con Scroll */}
                <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                    {/* Bloque 1: Metadatos del Documento y Firma */}
                    {details && details.length > 0 && (
                        <div className="space-y-2">
                            <span className="section-label">Información de Firma</span>
                            <div className="w-full bg-bg-deep/60 border border-border-thin rounded-2xl p-4 space-y-3">
                                {details.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs gap-3 border-b border-border-thin/40 pb-2.5 last:border-0 last:pb-0">
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-text-dim shrink-0">
                                            {item.label}:
                                        </span>
                                        <span className="font-semibold text-text-main text-right truncate font-mono text-[11.5px]">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bloque 2: Estado del Certificado y Seguridad */}
                    <div className="space-y-2">
                        <span className="section-label">Certificación y Seguridad</span>
                        <div className="w-full bg-bg-deep/60 border border-border-thin rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs border-b border-border-thin/40 pb-2.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
                                    Estado del Certificado:
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Firmado y Certificado
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-b border-border-thin/40 pb-2.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
                                    Estándar Criptográfico:
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-text-main">
                                    PKI X.509 / SHA-256
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-b border-border-thin/40 pb-2.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
                                    Trazabilidad CACES:
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-text-main">
                                    Inmutable y Auditada
                                </span>
                            </div>
                            <div className="pt-1">
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Fijo con Acciones */}
                <div className="p-4 sm:p-5 border-t border-border-thin bg-surface shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 btn-vercel-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handleAction}
                        className="py-2 px-5 btn-vercel-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>{primaryButtonText}</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
