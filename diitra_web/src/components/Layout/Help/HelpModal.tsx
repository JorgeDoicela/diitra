import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Award, Zap, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import type { HelpConfig, DiitraRole } from './types';
import { HELP_MAP, DEFAULT_CONFIG, normalizePathname } from './configs';
import { useAuth } from '../../../api/AuthContext';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    pathname: string;
}

interface LayoutMockupProps {
    highlight: 'sidebar' | 'topbar' | 'content-top' | 'content-bottom' | 'all' | 'none';
    stepTitle: string;
    config: HelpConfig;
}

const LayoutMockup: React.FC<LayoutMockupProps> = ({ highlight, stepTitle, config }) => {
    // Determine pointer positions dynamically based on highlight target area
    const getPointerStyle = () => {
        switch (highlight) {
            case 'sidebar':
                return { left: '12%', top: '55%' };
            case 'topbar':
                return { left: '60%', top: '15%' };
            case 'content-top':
                return { left: '55%', top: '35%' };
            case 'content-bottom':
                return { left: '55%', top: '65%' };
            case 'all':
                return { left: '50%', top: '50%' };
            default:
                return null;
        }
    };

    const pointerPos = getPointerStyle();

    // Dynamically render the page mockup content
    const renderContentMockup = () => {
        const isHighlightTop = highlight === 'content-top';
        const isHighlightBottom = highlight === 'content-bottom';
        const highlightTopClass = isHighlightTop 
            ? 'border-[#0070f3] bg-[#0070f3]/10 shadow-[0_0_10px_rgba(0,112,243,0.2)]' 
            : 'border-border-thin bg-surface';
        const highlightBottomClass = isHighlightBottom 
            ? 'border-[#0070f3] bg-[#0070f3]/10 shadow-[0_0_10px_rgba(0,112,243,0.2)] border-2' 
            : 'border-border-thin bg-surface';

        const MockupComp = config.Mockup || DEFAULT_CONFIG.Mockup;
        if (MockupComp) {
            return <MockupComp highlightTopClass={highlightTopClass} highlightBottomClass={highlightBottomClass} />;
        }
        return null;
    };

    return (
        <div className="relative w-full max-w-[420px] aspect-[16/10] bg-surface-hover/50 border border-border-thin rounded-xl p-2.5 shadow-inner select-none transition-all duration-300">
            {/* Inner Mockup grid layout representing DIITRA */}
            <div className={`w-full h-full flex flex-col gap-1.5 rounded-lg overflow-hidden p-1.5 transition-all duration-300 ${
                highlight === 'all' 
                    ? 'border-2 border-[#0070f3] bg-[#0070f3]/[0.03]' 
                    : 'border border-border-thin bg-surface'
            }`}>
                
                {/* Simulated TopBar */}
                <div className={`h-8 border rounded-md px-2 flex items-center justify-between transition-all duration-300 ${
                    highlight === 'topbar' 
                        ? 'border-[#0070f3] bg-[#0070f3]/10 shadow-[0_0_10px_rgba(0,112,243,0.2)]' 
                        : 'border-border-thin bg-surface'
                }`}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-border-hover" />
                        <div className="w-12 h-2 rounded bg-text-dim/20" />
                    </div>
                    {/* Simulated Page Title Center */}
                    <div className="w-20 h-2 bg-text-main/20 rounded hidden xs:block" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-8 h-3 rounded bg-text-dim/15 border border-border-thin" />
                        <div className="w-4 h-4 rounded-full bg-text-dim/20" />
                    </div>
                </div>

                {/* Simulated Body Grid */}
                <div className="flex-1 flex gap-1.5 min-h-0">
                    
                    {/* Simulated Sidebar */}
                    <div className={`w-[22%] rounded-md border p-1 flex flex-col justify-between transition-all duration-300 ${
                        highlight === 'sidebar' 
                            ? 'border-[#0070f3] bg-[#0070f3]/10 shadow-[0_0_10px_rgba(0,112,243,0.2)]' 
                            : 'border-border-thin bg-surface'
                    }`}>
                        <div className="space-y-1.5">
                            {/* Logo */}
                            <div className="w-8 h-2.5 bg-text-main/20 rounded-sm mx-auto mb-2" />
                            {/* Items */}
                            <div className={`w-full h-2 rounded-sm ${highlight === 'sidebar' ? 'bg-[#0070f3]' : 'bg-text-main/15'}`} />
                            <div className="w-4/5 h-2 bg-text-dim/10 rounded-sm" />
                            <div className="w-full h-2 bg-text-dim/10 rounded-sm" />
                            <div className="w-3/5 h-2 bg-text-dim/10 rounded-sm" />
                        </div>
                        <div className="w-full h-2.5 bg-text-dim/20 rounded-sm" />
                    </div>

                    {/* Simulated Main Content Workspace */}
                    <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                        {renderContentMockup()}
                    </div>
                </div>
            </div>

            {/* Glowing Pointer Arrow & Tooltip Onboarding Indicator */}
            {pointerPos && (
                <div 
                    style={{ left: pointerPos.left, top: pointerPos.top }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-500 ease-out"
                >
                    {/* Ring Pointer pulse */}
                    <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-[#0070f3] opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#0070f3] border-2 border-white shadow-md"></span>
                    </div>

                    {/* Floating Info Tag under the pointer */}
                    <div className="mt-1 bg-[#000000] text-[8.5px] font-mono font-semibold tracking-wider text-white px-2 py-0.5 rounded shadow-lg border border-[#333333] whitespace-nowrap animate-fade-in">
                        {stepTitle}
                    </div>
                </div>
            )}
        </div>
    );
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, pathname }) => {
    const { isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName } = useAuth();
    const normalizedPathname = normalizePathname(pathname);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');

    // Identificar roles del usuario conectado
    const activeRoles = useMemo<DiitraRole[]>(() => {
        const list: DiitraRole[] = ['todos'];
        if (isAdmin) list.push('admin');
        if (isDocente) list.push('docente');
        if (isEstudiante) list.push('estudiante');
        if (isRevisor) list.push('revisor', 'externo');
        return list;
    }, [isAdmin, isDocente, isEstudiante, isRevisor]);

    // Adaptar la configuración de la guía al rol del usuario
    const config = useMemo<HelpConfig>(() => {
        const rawConfig = HELP_MAP[normalizedPathname] || DEFAULT_CONFIG;
        const primaryRole: DiitraRole = isAdmin ? 'admin' : isDocente ? 'docente' : isEstudiante ? 'estudiante' : isRevisor ? 'revisor' : 'todos';
        const override = rawConfig.roleOverrides?.[primaryRole];

        // Filtrar pasos que corresponden a este rol
        const filteredSteps = rawConfig.steps.filter(step => {
            if (!step.roles || step.roles.length === 0 || step.roles.includes('todos')) return true;
            return step.roles.some(r => activeRoles.includes(r));
        });

        // Filtrar tips que corresponden a este rol
        const filteredTips = (rawConfig.tips || []).filter(tip => {
            if (typeof tip === 'string') return true;
            if (!tip.roles || tip.roles.length === 0 || tip.roles.includes('todos')) return true;
            return tip.roles.some(r => activeRoles.includes(r));
        });

        return {
            ...rawConfig,
            title: override?.title || rawConfig.title,
            summary: override?.summary || rawConfig.summary,
            description: override?.description || rawConfig.description,
            compliance: override?.compliance || rawConfig.compliance,
            steps: filteredSteps.length > 0 ? filteredSteps : rawConfig.steps,
            tips: filteredTips.length > 0 ? filteredTips : rawConfig.tips
        };
    }, [normalizedPathname, isAdmin, isDocente, isEstudiante, isRevisor, activeRoles]);

    // Total steps = 1 (Summary) + config.steps.length + 1 (Compliance & Tips)
    const totalSteps = config.steps.length + 2;

    // Reset step index when active page changes or modal is closed/reopened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setDirection('next');
        }
    }, [normalizedPathname, isOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Keyboard navigation (Escape to close, ArrowLeft/Right to step)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentStep < totalSteps - 1) {
                    setDirection('next');
                    setCurrentStep(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentStep > 0) {
                    setDirection('prev');
                    setCurrentStep(prev => prev - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStep, totalSteps, onClose]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setDirection('next');
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection('prev');
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleDotClick = (index: number) => {
        setDirection(index > currentStep ? 'next' : 'prev');
        setCurrentStep(index);
    };

    // Calculate active highlight zone for the mockup
    const getActiveHighlight = () => {
        if (currentStep === 0) return 'all';
        if (currentStep === totalSteps - 1) return 'none';
        const stepIdx = currentStep - 1;
        return config.steps[stepIdx]?.highlight || 'none';
    };

    // Calculate active step title label for pointer
    const getActiveStepLabel = () => {
        if (currentStep === 0) return 'Visión General';
        if (currentStep === totalSteps - 1) return 'Normativa CACES';
        const stepIdx = currentStep - 1;
        return config.steps[stepIdx]?.title || 'Paso';
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Guía Interactiva: ${config.title}`}
        >
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/75 backdrop-blur-md cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-3xl bg-surface border border-border-thin rounded-xl shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[90vh]">
                
                {/* Header Vercel Geist */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-surface border border-border-thin flex items-center justify-center text-text-main">
                            {config.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-semibold text-text-main">
                                    DIITRA
                                </span>
                                <span className="text-text-dim">/</span>
                                <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 rounded-full border border-border-thin bg-surface-hover">
                                    Guía del Módulo
                                </span>
                                {roleDisplayName && (
                                    <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 rounded-full border border-border-thin bg-surface">
                                        {roleDisplayName}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xs font-semibold tracking-tight text-text-main font-sans">
                                {config.title}
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Cerrar Guía"
                        aria-label="Cerrar Guía"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Two-Column Body Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[380px] flex flex-col md:flex-row border-b border-border-thin bg-surface">
                    
                    {/* Left Column: Explanations & Text Wizard */}
                    <div className="w-full md:w-[45%] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-thin">
                        <div 
                            key={currentStep}
                            className={`flex-1 flex flex-col justify-center ${
                                direction === 'next' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
                            }`}
                        >
                            {currentStep === 0 && (
                                /* Step 0: Overview & Summary */
                                <div className="space-y-3.5 py-1">
                                    <div className="w-9 h-9 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-main shadow-sm">
                                        {config.icon}
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider block">
                                            Introducción
                                        </span>
                                        <h4 className="text-[14px] font-semibold text-text-main tracking-tight">
                                            {config.title}
                                        </h4>
                                    </div>
                                    <p className="text-[12px] font-medium text-text-main leading-snug">
                                        {config.summary}
                                    </p>
                                    <p className="text-[11.5px] text-text-dim leading-relaxed">
                                        {config.description}
                                    </p>
                                </div>
                            )}

                            {currentStep > 0 && currentStep <= config.steps.length && (() => {
                                const stepIdx = currentStep - 1;
                                const step = config.steps[stepIdx];
                                return (
                                    /* Step 1 to N: Sequential Instructions */
                                    <div className="space-y-3.5 py-1">
                                        <div className="w-7 h-7 rounded-full bg-surface border border-border-thin flex items-center justify-center text-xs font-mono font-semibold text-text-main">
                                            {currentStep}
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider block">
                                                Paso {currentStep} de {config.steps.length}
                                            </span>
                                            <h4 className="text-[13px] font-semibold text-text-main tracking-tight">
                                                {step.title}
                                            </h4>
                                        </div>
                                        <p className="text-[12px] text-text-dim leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })()}

                            {currentStep === totalSteps - 1 && (
                                /* Final Step: Compliance & Quick Tips */
                                <div className="space-y-4 py-1">
                                    {/* Compliance Banner */}
                                    <div className="p-3 rounded-lg bg-surface-hover border border-border-thin flex items-start gap-2.5">
                                        <div className="p-1 rounded bg-surface border border-border-thin text-text-main shrink-0 mt-0.5">
                                            <Award size={14} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[11px] font-semibold text-text-main">
                                                Cumplimiento CACES
                                            </h5>
                                            <p className="text-[11px] text-text-dim leading-relaxed">
                                                {config.compliance}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tips list */}
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-mono text-text-dim uppercase tracking-wider border-b border-border-thin pb-1">
                                            Accesibilidad y Consejos
                                        </h5>
                                        <ul className="space-y-1.5">
                                            {config.tips.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[11px] text-text-dim leading-relaxed">
                                                    <Zap size={11} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <span>{typeof tip === 'string' ? tip : tip.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive UI Mockup Simulator */}
                    <div className="w-full md:w-[55%] p-6 bg-surface-hover/30 flex flex-col justify-center items-center select-none">
                        <LayoutMockup 
                            highlight={getActiveHighlight()} 
                            stepTitle={getActiveStepLabel()}
                            config={config}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-3.5 border-t border-border-thin bg-surface flex items-center justify-between shrink-0">
                    {/* Previous Button */}
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`btn-vercel-secondary !text-[11px] !py-1.5 !px-3.5 !gap-1.5 ${
                            currentStep === 0 
                                ? 'opacity-30 pointer-events-none' 
                                : ''
                        }`}
                        title="Paso Anterior"
                    >
                        <ChevronLeft size={14} />
                        <span>Atrás</span>
                    </button>

                    {/* Navigation Dots Indicator */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleDotClick(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === currentStep 
                                        ? 'w-5 bg-text-main' 
                                        : 'w-1.5 bg-border-thin hover:bg-text-dim'
                                }`}
                                title={`Ir a la diapositiva ${idx + 1}`}
                                aria-label={`Paso ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Next or Finish Button */}
                    {currentStep === totalSteps - 1 ? (
                        <button
                            onClick={onClose}
                            className="btn-vercel-primary !text-[11px] !py-1.5 !px-4 !gap-1.5"
                            title="Finalizar Guía"
                        >
                            <span>Entendido</span>
                            <Check size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="btn-vercel-primary !text-[11px] !py-1.5 !px-4 !gap-1.5"
                            title="Siguiente Paso"
                        >
                            <span>Siguiente</span>
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
