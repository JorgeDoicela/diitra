import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, BookOpen, Check } from 'lucide-react';
import { useAuth } from '../../../api/AuthContext';
import { getWelcomeConfigByRole } from './welcomeConfigs';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenGuide?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    isOpen,
    onClose,
    onOpenGuide
}) => {
    const { user, isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName } = useAuth();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const config = getWelcomeConfigByRole(isAdmin, isDocente, isEstudiante, isRevisor);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Keyboard support (Escape to close)
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
        if (dontShowAgain && user?.id_referencia) {
            try {
                localStorage.setItem(`diitra_welcome_dismissed_${user.id_referencia}`, 'true');
            } catch {
                // Silencioso en modo incógnito
            }
        }
        onClose();
    };

    const handleOpenInteractiveGuide = () => {
        handleFinish();
        if (onOpenGuide) {
            setTimeout(() => {
                onOpenGuide();
            }, 100);
        }
    };

    // Nombre de pila o saludo amigable
    const userFirstName = user?.nombre_completo 
        ? user.nombre_completo.split(' ')[0] 
        : 'Colega';

    return (
        <div 
            className="modal-overlay !z-[9999]"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a DIITRA"
        >
            {/* Modal Card con clase oficial y efecto Glow */}
            <div className="modal-card modal-card--lg bg-glow !max-w-2xl !rounded-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[90vh]">
                
                {/* Decorative Header con tokens semánticos */}
                <div className="modal-header !p-6 !pb-5 !bg-surface flex flex-col gap-3 relative shrink-0">
                    <div className="flex items-start justify-between w-full relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
                                <Sparkles size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="section-label !text-brand leading-none">
                                        Ecosistema Institucional
                                    </span>
                                    <span className="badge-vercel !text-[8px] !py-0.5 !px-2 uppercase font-mono font-bold text-brand border-brand/20">
                                        {roleDisplayName || config.roleLabel}
                                    </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-main font-sans">
                                    Hola, {userFirstName} 👋
                                </h2>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                            title="Cerrar Bienvenida"
                            aria-label="Cerrar Bienvenida"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <p className="text-[12px] text-text-dim leading-relaxed font-normal relative z-10 max-w-xl">
                        {config.greeting} {config.subtitle}
                    </p>
                </div>

                {/* Features Grid con Bento Cards */}
                <div className="modal-body custom-scrollbar !p-6 space-y-4">
                    <div className="space-y-1">
                        <span className="section-label !text-text-dim !block">
                            ¿Cómo DIITRA facilitará tu labor académica?
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {config.features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bento-card !p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="p-2 rounded-lg bg-surface border border-border group-hover:scale-105 transition-transform">
                                        {feature.icon}
                                    </div>
                                    {feature.badge && (
                                        <span className="badge-vercel !text-[7.5px] !py-0 !px-1.5 font-mono uppercase">
                                            {feature.badge}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-text-main group-hover:text-brand transition-colors font-sans mb-0.5">
                                        {feature.title}
                                    </h4>
                                    <p className="text-[10.5px] text-text-dim leading-relaxed font-normal">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Motivational Quote Banner con bento-card-static */}
                    <div className="bento-card-static !p-3.5 flex items-center gap-3">
                        <div className="w-1.5 self-stretch bg-brand rounded-full shrink-0" />
                        <p className="text-[11px] italic text-text-dim font-serif leading-snug">
                            {config.quote}
                        </p>
                    </div>
                </div>

                {/* Footer Actions con botones oficiales */}
                <div className="modal-footer !p-4 !px-6 !bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    {/* Checkbox persistencia */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <div 
                            onClick={() => setDontShowAgain(v => !v)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                dontShowAgain 
                                    ? 'bg-brand border-brand text-white' 
                                    : 'border-border bg-surface hover:border-fg/50'
                            }`}
                        >
                            {dontShowAgain && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span 
                            onClick={() => setDontShowAgain(v => !v)}
                            className="text-[10.5px] text-text-dim group-hover:text-text-main font-medium transition-colors"
                        >
                            No volver a mostrar al iniciar sesión
                        </span>
                    </label>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        {onOpenGuide && (
                            <button
                                onClick={handleOpenInteractiveGuide}
                                className="btn-vercel-secondary !text-[10px] !py-1.5 !px-3 !gap-1.5 cursor-pointer font-medium"
                                title="Abrir Guía Detallada"
                            >
                                <BookOpen size={13} className="text-brand" />
                                <span>Ver Guía</span>
                            </button>
                        )}

                        <button
                            onClick={handleFinish}
                            className="btn-brand !text-[10px] !py-1.5 !px-4 !gap-1.5 cursor-pointer shadow-md font-semibold"
                            title={config.primaryActionLabel}
                        >
                            <span>{config.primaryActionLabel}</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
