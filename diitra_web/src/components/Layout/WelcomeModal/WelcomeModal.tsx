import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../api/AuthContext';
import { getWelcomeConfigByRole } from './welcomeConfigs';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenGuide?: () => void;
}

const formatTitleCase = (str?: string): string => {
    if (!str) return 'Colega';
    const first = str.trim().split(' ')[0] || '';
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    isOpen,
    onClose
}) => {
    const { user, isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName } = useAuth();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const config = getWelcomeConfigByRole(isAdmin, isDocente, isEstudiante, isRevisor);

    // Bloquear scroll del fondo
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Navegación por teclado (Escape para cerrar)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleFinish();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, dontShowAgain, user?.id_referencia]);

    if (!isOpen) return null;

    const handleFinish = () => {
        if (dontShowAgain && user) {
            const userKey = user.id_referencia || user.id_usuario?.toString() || user.usuario || 'default';
            try {
                localStorage.setItem(`diitra_welcome_dismissed_${userKey}`, 'true');
            } catch {
                // Silencioso en modo incógnito
            }
        }
        onClose();
    };

    const userFirstName = formatTitleCase(user?.nombre_completo);

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a DIITRA"
        >
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleFinish}
            />

            {/* Panel lateral derecho (Drawer Vercel Geist) */}
            <div className="relative w-full max-w-lg md:max-w-xl h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                
                {/* Header Institucional */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-text-main tracking-tight">
                            DIITRA
                        </span>
                        <span className="text-text-dim/40 font-light">/</span>
                        <span className="rounded-full border border-border-thin bg-surface-hover text-[10.5px] font-mono font-medium px-2.5 py-0.5 text-text-dim">
                            {roleDisplayName || config.roleLabel}
                        </span>
                    </div>

                    <button
                        onClick={handleFinish}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Cerrar"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body: Contenido con scroll y aprovechamiento vertical */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface custom-scrollbar">
                    {/* Hero Saludo */}
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight leading-tight">
                            Hola, {userFirstName}
                        </h2>
                        <p className="text-[13px] text-text-dim leading-relaxed font-normal">
                            {config.systemDescription}
                        </p>
                    </div>

                    {/* Áreas Diseñadas */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin">
                            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-text-dim">
                                {config.sectionTitle}
                            </span>
                            <span className="text-[10.5px] font-mono text-text-dim/60">
                                Áreas Principales
                            </span>
                        </div>

                        {/* Lista de tarjetas que aprovechan el ancho y alto del panel */}
                        <div className="space-y-3">
                            {config.benefits.map((benefit, idx) => (
                                <div 
                                    key={idx}
                                    className="bento-card p-4 flex flex-col justify-between cursor-default hover:border-border-hover transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-[11px] font-mono font-bold text-text-dim/50 shrink-0">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <h3 className="text-[13.5px] font-semibold text-text-main tracking-tight truncate">
                                                {benefit.title}
                                            </h3>
                                        </div>
                                        <span className="rounded-md border border-border-thin bg-surface-hover text-[10px] font-mono font-medium px-2 py-0.5 text-text-dim shrink-0">
                                            {benefit.tag}
                                        </span>
                                    </div>
                                    <p className="text-[12.5px] text-text-dim leading-relaxed font-normal pl-6">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Vercel Minimalista */}
                <div className="p-4 px-6 sm:px-8 border-t border-border-thin bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    
                    {/* Checkbox persistencia */}
                    <label 
                        onClick={() => setDontShowAgain(v => !v)}
                        className="flex items-center gap-2.5 cursor-pointer select-none group py-1"
                    >
                        <div 
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                dontShowAgain 
                                    ? 'bg-brand border-brand text-white shadow-xs' 
                                    : 'border-border-thin bg-surface group-hover:border-border-hover'
                            }`}
                        >
                            {dontShowAgain && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-[12px] text-text-dim group-hover:text-text-main font-medium transition-colors">
                            No volver a mostrar al iniciar sesión
                        </span>
                    </label>

                    {/* Botón Comenzar */}
                    <button
                        onClick={handleFinish}
                        className="btn-vercel-primary !h-10 !px-6 !text-[12px] w-full sm:w-auto"
                        title="Comenzar"
                    >
                        <span>Comenzar</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
