import React, { useState, useEffect } from 'react';
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
        if (dontShowAgain && user?.id_referencia) {
            try {
                localStorage.setItem(`diitra_welcome_dismissed_${user.id_referencia}`, 'true');
            } catch {
                // Silencioso en modo incógnito
            }
        }
        onClose();
    };

    const userFirstName = formatTitleCase(user?.nombre_completo);

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a DIITRA"
        >
            {/* Modal Dialog Card Vercel Geist */}
            <div className="relative w-full max-w-[680px] bg-white border border-zinc-200/80 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.15)] flex flex-col z-10 animate-scale-up overflow-hidden max-h-[92vh]">
                
                {/* Header Institucional */}
                <div className="p-7 pb-5 bg-white flex items-start justify-between border-b border-zinc-100 shrink-0">
                    <div className="space-y-1.5 pr-4">
                        {/* Breadcrumb de rol */}
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-zinc-900 tracking-tight">
                                DIITRA
                            </span>
                            <span className="text-zinc-300 font-light">/</span>
                            <span className="rounded-full border border-zinc-200 bg-zinc-50/80 text-[10.5px] font-mono font-medium px-2.5 py-0.5 text-zinc-600">
                                {roleDisplayName || config.roleLabel}
                            </span>
                        </div>

                        {/* Título de Bienvenida */}
                        <h2 className="text-[26px] font-bold text-zinc-950 tracking-[-0.03em] leading-tight pt-1">
                            Hola, {userFirstName}
                        </h2>

                        {/* Descripción concisa */}
                        <p className="text-[13.5px] text-zinc-600 leading-relaxed font-normal pt-0.5">
                            {config.systemDescription}
                        </p>
                    </div>

                    {/* Botón Cerrar */}
                    <button
                        onClick={handleFinish}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 mt-0.5"
                        title="Cerrar"
                        aria-label="Cerrar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body: Cuadrícula Bento 2x2 Espaciosa */}
                <div className="p-7 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/40">
                    <div className="flex items-center justify-between pb-0.5">
                        <span className="text-[11.5px] font-mono uppercase tracking-wider font-semibold text-zinc-500">
                            {config.sectionTitle}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                            Áreas Principales
                        </span>
                    </div>

                    {/* Bento Grid 2x2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {config.benefits.map((benefit, idx) => (
                            <div 
                                key={idx}
                                className="group bg-white border border-zinc-200/80 hover:border-zinc-400/80 rounded-xl p-4.5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all duration-200 cursor-default"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-[13.5px] font-semibold text-zinc-900 tracking-tight group-hover:text-black">
                                            {benefit.title}
                                        </h3>
                                        <span className="rounded-md border border-zinc-200/70 bg-zinc-50 text-[10px] font-mono font-medium px-2 py-0.5 text-zinc-500 shrink-0">
                                            {benefit.tag}
                                        </span>
                                    </div>
                                    <p className="text-[12.5px] text-zinc-500 leading-relaxed font-normal group-hover:text-zinc-600">
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Vercel Minimalista */}
                <div className="p-4 px-7 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 shrink-0">
                    
                    {/* Checkbox persistencia */}
                    <label 
                        onClick={() => setDontShowAgain(v => !v)}
                        className="flex items-center gap-2.5 cursor-pointer select-none group py-1"
                    >
                        <div 
                            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                dontShowAgain 
                                    ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs' 
                                    : 'border-zinc-300 bg-white group-hover:border-zinc-500'
                            }`}
                        >
                            {dontShowAgain && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-[12.5px] text-zinc-500 group-hover:text-zinc-900 font-medium transition-colors">
                            No volver a mostrar al iniciar sesión
                        </span>
                    </label>

                    {/* Botón Comenzar */}
                    <button
                        onClick={handleFinish}
                        className="w-full sm:w-auto h-10 px-6 rounded-lg bg-zinc-950 text-white text-[13px] font-medium hover:bg-black active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1.5"
                        title="Comenzar"
                    >
                        <span>Comenzar</span>
                        <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};
