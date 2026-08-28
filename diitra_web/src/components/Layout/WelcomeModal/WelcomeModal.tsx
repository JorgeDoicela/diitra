import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../../api/AuthContext';
import { getWelcomeConfigByRole } from './welcomeConfigs';
import type { WelcomeModule } from './types';

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

const ModuleDetailsCard: React.FC<{
    module: WelcomeModule;
}> = ({ module }) => {
    const details = module.details;

    return (
        <div className="h-full flex flex-col justify-between bg-[#ffffff] border border-[#eaeaea] rounded-lg p-4 shadow-sm select-none">
            
            <div className="space-y-3.5">
                {/* Module Headline */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f0]">
                    <h3 className="text-[14px] font-semibold text-[#111111] tracking-tight">
                        {details.headline}
                    </h3>
                    <span className="rounded-full border border-[#eaeaea] bg-[#fafafa] text-[11px] font-medium px-2.5 py-0.5 text-[#666666]">
                        {module.badge}
                    </span>
                </div>

                {/* DIITRA Summary List (Pattern Oficial DIITRA) */}
                <div className="border border-[#eaeaea] rounded-lg p-3 bg-[#ffffff]">
                    <h4 className="text-[12.5px] font-semibold text-[#111111] mb-2.5">
                        {details.summaryTitle}
                    </h4>
                    <div className="space-y-2">
                        {details.summaryRows.map((row, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    {/* Indicador de anillo de progreso minimalista */}
                                    <span className="w-3.5 h-3.5 rounded-full border border-[#eaeaea] flex items-center justify-center shrink-0">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            row.statusColor === 'emerald'
                                                ? 'bg-emerald-500'
                                                : row.statusColor === 'blue'
                                                    ? 'bg-[#0070f3]'
                                                    : row.statusColor === 'amber'
                                                        ? 'bg-amber-500'
                                                        : 'bg-[#888888]'
                                        }`} />
                                    </span>
                                    <span className="text-[#333333] font-medium">
                                        {row.label}
                                    </span>
                                </div>
                                <span className="text-[#111111] font-mono font-semibold text-[11.5px]">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Points / Key Capabilities List */}
                <div className="space-y-2 pt-0.5">
                    {details.actionPoints.map((point, idx) => (
                        <div 
                            key={idx}
                            className="p-2.5 rounded-md border border-[#f0f0f0] bg-[#ffffff] hover:border-[#eaeaea] transition-colors"
                        >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[12px] font-medium text-[#111111]">
                                    {point.title}
                                </span>
                                {point.tag && (
                                    <span className="text-[10px] font-mono text-[#888888] bg-[#fafafa] border border-[#eaeaea] px-1.5 py-0.5 rounded">
                                        {point.tag}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11.5px] text-[#666666] leading-relaxed">
                                {point.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Note */}
            {details.footerNote && (
                <div className="pt-2.5 border-t border-[#f0f0f0] mt-3 text-[11px] text-[#888888]">
                    {details.footerNote}
                </div>
            )}
        </div>
    );
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    isOpen,
    onClose,
    onOpenGuide
}) => {
    const { user, isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName } = useAuth();
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const config = getWelcomeConfigByRole(isAdmin, isDocente, isEstudiante, isRevisor);
    const totalModules = config.modules.length;

    // Lock body scroll
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Keyboard support (Escape to close, Arrows to select tab)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleFinish();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % totalModules);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + totalModules) % totalModules);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, totalModules, dontShowAgain, user?.id_referencia]);

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

    const userFirstName = formatTitleCase(user?.nombre_completo);
    const activeModule = config.modules[activeIndex] || config.modules[0];

    return (
        <div 
            className="modal-overlay !z-[9999] backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a DIITRA"
        >
            {/* Modal Card Vercel */}
            <div className="w-full max-w-4xl bg-white border border-[#eaeaea] rounded-xl shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[92vh]">
                
                {/* Header Breadcrumb Vercel Style */}
                <div className="p-5 pb-4 bg-white flex items-start justify-between border-b border-[#eaeaea] shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[12px] font-semibold text-[#111111]">
                                DIITRA
                            </span>
                            <span className="text-[#888888]">/</span>
                            <span className="rounded-full border border-[#eaeaea] bg-[#fafafa] text-[11px] font-medium px-2.5 py-0.5 text-[#666666]">
                                {roleDisplayName || config.roleLabel}
                            </span>
                        </div>
                        <h2 className="text-[18px] font-semibold text-[#111111] tracking-tight">
                            Bienvenido, {userFirstName}
                        </h2>
                        <p className="text-[13px] text-[#666666] leading-relaxed mt-0.5 max-w-2xl">
                            {config.subtitle}
                        </p>
                    </div>

                    <button
                        onClick={handleFinish}
                        className="p-1.5 rounded-md text-[#888888] hover:text-[#111111] hover:bg-[#fafafa] transition-colors cursor-pointer"
                        title="Cerrar"
                        aria-label="Cerrar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Two-Column Body Grid */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[380px] overflow-y-auto bg-[#fafafa]">
                    
                    {/* Left Column: Vercel Unified Navigation List (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                            <span className="text-[12px] font-semibold text-[#111111] block">
                                Módulos de tu Rol
                            </span>

                            {/* Unified High-Density Card List */}
                            <div className="border border-[#eaeaea] rounded-lg divide-y divide-[#eaeaea] overflow-hidden bg-white shadow-sm">
                                {config.modules.map((module, idx) => {
                                    const isCurrent = idx === activeIndex;
                                    return (
                                        <button
                                            key={module.id}
                                            type="button"
                                            onClick={() => setActiveIndex(idx)}
                                            className={`w-full text-left p-3.5 transition-colors cursor-pointer block ${
                                                isCurrent 
                                                    ? 'bg-[#000000]/[0.04] border-l-2 border-l-[#000000] pl-3' 
                                                    : 'hover:bg-[#fafafa] opacity-75 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={`text-[13px] font-medium truncate ${
                                                    isCurrent ? 'text-[#111111]' : 'text-[#444444]'
                                                }`}>
                                                    {module.title}
                                                </span>
                                                <span className="rounded-full border border-[#eaeaea] bg-white text-[10px] font-medium px-2 py-0.5 text-[#666666] shrink-0">
                                                    {module.badge}
                                                </span>
                                            </div>
                                            
                                            <p className="text-[12px] text-[#666666] leading-relaxed">
                                                {module.summary}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Informative Status Footer */}
                        <div className="text-[11.5px] text-[#888888] pt-1">
                            Selecciona un módulo para explorar sus capacidades.
                        </div>
                    </div>

                    {/* Right Column: Module Details & Capabilities Card (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col min-h-[320px] lg:min-h-0">
                        <ModuleDetailsCard
                            module={activeModule}
                        />
                    </div>
                </div>

                {/* Footer Vercel */}
                <div className="p-3.5 px-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#eaeaea] shrink-0">
                    
                    {/* Checkbox persistencia */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <div 
                            onClick={() => setDontShowAgain(v => !v)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                dontShowAgain 
                                    ? 'bg-[#000000] border-[#000000] text-white' 
                                    : 'border-[#eaeaea] bg-white hover:border-[#111111]'
                            }`}
                        >
                            {dontShowAgain && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span 
                            onClick={() => setDontShowAgain(v => !v)}
                            className="text-[12px] text-[#666666] group-hover:text-[#111111] font-medium transition-colors"
                        >
                            No volver a mostrar al iniciar sesión
                        </span>
                    </label>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        {onOpenGuide && (
                            <button
                                onClick={handleOpenInteractiveGuide}
                                className="border border-[#eaeaea] bg-white text-[#111111] text-[13px] font-medium h-9 px-3.5 rounded-md hover:border-[#000000] transition-colors cursor-pointer"
                                title="Abrir Guía Detallada"
                            >
                                <span>Ver Guía</span>
                            </button>
                        )}

                        <button
                            onClick={handleFinish}
                            className="bg-[#000000] text-white text-[13px] font-medium h-9 px-4 rounded-md hover:bg-[#222222] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            title={config.primaryActionLabel}
                        >
                            <span>{config.primaryActionLabel}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
