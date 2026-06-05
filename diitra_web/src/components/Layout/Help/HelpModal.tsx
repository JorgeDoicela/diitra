import React, { useState, useEffect } from 'react';
import { 
    X, Award, Zap, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import type { HelpConfig } from './types';
import { HELP_MAP, DEFAULT_CONFIG, normalizePathname } from './configs';

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
        const highlightTopClass = isHighlightTop ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' : 'border-border-thin bg-surface';
        const highlightBottomClass = isHighlightBottom ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)] border-2' : 'border-border-thin bg-surface';

        const MockupComp = config.Mockup || DEFAULT_CONFIG.Mockup;
        if (MockupComp) {
            return <MockupComp highlightTopClass={highlightTopClass} highlightBottomClass={highlightBottomClass} />;
        }
        return null;
    };

    return (
        <div className="relative w-full max-w-[420px] aspect-[16/10] bg-bg-deep/40 border border-border-thin rounded-2xl p-2.5 shadow-inner select-none transition-all duration-300">
            {/* Inner Mockup grid layout representing DIITRA */}
            <div className={`w-full h-full flex flex-col gap-1.5 rounded-xl overflow-hidden p-1.5 transition-all duration-300 ${
                highlight === 'all' 
                    ? 'border-2 border-brand shadow-[0_0_15px_rgba(0,112,243,0.35)] bg-brand/5' 
                    : 'border border-border-thin'
            }`}>
                
                {/* Simulated TopBar */}
                <div className={`h-8 border rounded-lg px-2 flex items-center justify-between transition-all duration-300 ${
                    highlight === 'topbar' 
                        ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' 
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
                    <div className={`w-[22%] rounded-lg border p-1 flex flex-col justify-between transition-all duration-300 ${
                        highlight === 'sidebar' 
                            ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' 
                            : 'border-border-thin bg-surface'
                    }`}>
                        <div className="space-y-1.5">
                            {/* Logo */}
                            <div className="w-8 h-2.5 bg-brand/35 rounded-sm mx-auto mb-2" />
                            {/* Items */}
                            <div className="w-full h-2 bg-text-main/15 rounded-sm" />
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
                        <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-brand opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand border border-white shadow-md"></span>
                    </div>

                    {/* Floating Info Tag under the pointer */}
                    <div className="mt-1 bg-brand text-[8px] font-semibold tracking-wider text-white px-1.5 py-0.5 rounded shadow-lg border border-brand-light whitespace-nowrap animate-fade-in">
                        {stepTitle}
                    </div>

                    {/* SVG Connector Arrow pointing to highlight */}
                    <svg className="w-4 h-4 text-brand -mt-1.5 fill-current animate-bounce" viewBox="0 0 20 20">
                        <path d="M10 5l-5 6h10l-5-6z" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, pathname }) => {
    const normalizedPathname = normalizePathname(pathname);
    const config = HELP_MAP[normalizedPathname] || DEFAULT_CONFIG;
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');

    // Total steps = 1 (Summary) + config.steps.length + 1 (Compliance & Tips)
    const totalSteps = config.steps.length + 2;

    // Reset step index when active page changes or modal is closed/reopened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setDirection('next');
        }
    }, [normalizedPathname, isOpen]);

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

    // Get active step label for mockup tooltip
    const getActiveStepLabel = () => {
        if (currentStep === 0) return 'Módulo General';
        if (currentStep === totalSteps - 1) return 'Cumplimiento';
        return `Paso ${currentStep}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/75 backdrop-blur-md cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-3xl bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border-thin flex items-center justify-center">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold tracking-widest text-text-main">
                                Guía Interactiva
                            </h3>
                            <p className="text-[9px] text-text-dim tracking-wider font-semibold">
                                {config.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Cerrar Guía"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Two-Column Body Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[380px] flex flex-col md:flex-row border-b border-border-thin">
                    
                    {/* Left Column: Explanations & Text Wizard */}
                    <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-thin">
                        <div 
                            key={currentStep}
                            className={`flex-1 flex flex-col justify-center ${
                                direction === 'next' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
                            }`}
                        >
                            {currentStep === 0 && (
                                /* Step 0: Overview & Summary */
                                <div className="space-y-4 py-2">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center text-brand shadow-inner animate-pulse">
                                        {config.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-semibold tracking-widest text-brand">
                                            Introducción
                                        </span>
                                        <h4 className="text-sm font-semibold tracking-wider text-text-main">
                                            {config.title}
                                        </h4>
                                    </div>
                                    <p className="text-[11.5px] font-semibold text-text-main leading-snug">
                                        {config.summary}
                                    </p>
                                    <p className="text-[11px] text-text-dim leading-relaxed font-medium">
                                        {config.description}
                                    </p>
                                </div>
                            )}

                            {currentStep > 0 && currentStep <= config.steps.length && (() => {
                                const stepIdx = currentStep - 1;
                                const step = config.steps[stepIdx];
                                return (
                                    /* Step 1 to N: Sequential Instructions */
                                    <div className="space-y-4 py-2">
                                        <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-mono font-semibold text-brand">
                                            {currentStep}
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-semibold tracking-widest text-brand">
                                                Paso {currentStep} de {config.steps.length}
                                            </span>
                                            <h4 className="text-xs font-semibold tracking-wider text-text-main">
                                                {step.title}
                                            </h4>
                                        </div>
                                        <p className="text-[11.5px] text-text-dim leading-relaxed font-medium">
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })()}

                            {currentStep === totalSteps - 1 && (
                                /* Final Step: Compliance & Quick Tips */
                                <div className="space-y-5 py-2">
                                    {/* Compliance Banner */}
                                    <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/10 flex items-start gap-3">
                                        <div className="p-1.5 bg-brand/10 rounded-lg text-brand shrink-0">
                                            <Award size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[9px] font-semibold tracking-widest text-text-main">
                                                Cumplimiento CACES
                                            </h5>
                                            <p className="text-[10px] text-text-dim leading-relaxed font-medium">
                                                {config.compliance}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tips list */}
                                    <div className="space-y-2">
                                        <h5 className="text-[8px] font-semibold tracking-widest text-text-dim border-b border-border-thin pb-1">
                                            Accesibilidad y Consejos
                                        </h5>
                                        <ul className="space-y-2">
                                            {config.tips.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[10px] text-text-dim leading-relaxed font-medium">
                                                    <Zap size={10} className="text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive UI Mockup Simulator */}
                    <div className="w-full md:w-[55%] p-6 md:p-8 bg-bg-deep/10 flex flex-col justify-center items-center select-none">
                        <LayoutMockup 
                            highlight={getActiveHighlight()} 
                            stepTitle={getActiveStepLabel()}
                            config={config}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-border-thin bg-surface/50 flex items-center justify-between shrink-0">
                    {/* Previous Button */}
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-1 text-[10px] font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                            currentStep === 0 
                                ? 'opacity-30 pointer-events-none text-text-dim' 
                                : 'text-text-dim hover:text-text-main hover:translate-x-[-2px]'
                        }`}
                        title="Anterior"
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
                                        ? 'w-4 bg-brand' 
                                        : 'w-1.5 bg-border-hover hover:bg-text-dim'
                                }}`}
                                title={`Ir a la diapositiva ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Next or Finish Button */}
                    {currentStep === totalSteps - 1 ? (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-[10px] font-semibold tracking-wider hover:bg-brand-dark transition-all duration-200 cursor-pointer hover:scale-[1.03] shadow-md shadow-brand/10"
                            title="Finalizar"
                        >
                            <span>Entendido</span>
                            <Check size={12} />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-brand hover:text-brand-light transition-all duration-200 cursor-pointer hover:translate-x-[2px]"
                            title="Siguiente"
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
