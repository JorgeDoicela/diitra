import React from 'react';
import { ChevronLeft, FileText, Lock } from 'lucide-react';
import type { BuilderSection } from '../hooks/useBuilderLayout';

export interface BuilderNavigationSidebarProps {
    sections: BuilderSection[];
    activeTab: string;
    formData: any;
    isLeftSidebarOpen: boolean;
    leftSidebarWidth: number;
    showMobileSections: boolean;
    leftSidebarRef: React.RefObject<HTMLDivElement>;
    setActiveTab: (tabId: string) => void;
    setIsLeftSidebarOpen: (open: boolean) => void;
    setShowMobileSections: (show: boolean) => void;
}

export const BuilderNavigationSidebar: React.FC<BuilderNavigationSidebarProps> = ({
    sections,
    activeTab,
    formData,
    isLeftSidebarOpen,
    leftSidebarWidth,
    showMobileSections,
    leftSidebarRef,
    setActiveTab,
    setIsLeftSidebarOpen,
    setShowMobileSections
}) => {
    const count = sections.length;

    // Escala de densidad dinámica adaptativa según la cantidad de secciones de la plantilla
    const density = count <= 6
        ? { itemPy: 'py-3.5', itemPx: 'px-4', textSize: 'text-xs', spaceY: 'space-y-2', iconClass: '[&>svg]:w-4.5 [&>svg]:h-4.5', rounded: 'rounded-xl', gap: 'gap-3' }
        : count <= 9
        ? { itemPy: 'py-3', itemPx: 'px-3.5', textSize: 'text-xs', spaceY: 'space-y-1.5', iconClass: '[&>svg]:w-4 [&>svg]:h-4', rounded: 'rounded-xl', gap: 'gap-3' }
        : { itemPy: 'py-2.5', itemPx: 'px-3', textSize: 'text-[11px]', spaceY: 'space-y-1', iconClass: '[&>svg]:w-3.5 [&>svg]:h-3.5', rounded: 'rounded-lg', gap: 'gap-2.5' };

    return (
        <div
            ref={leftSidebarRef}
            style={{
                width: (typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? undefined
                    : (isLeftSidebarOpen ? `${leftSidebarWidth}px` : '0px'),
                transform: (typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? (showMobileSections ? 'translateX(0)' : 'translateX(-100%)')
                    : undefined,
                transition: (typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? 'transform 300ms ease-in-out, visibility 300ms ease-in-out'
                    : 'width 300ms ease-in-out',
                visibility: (typeof window !== 'undefined' && window.innerWidth < 1024)
                    ? (showMobileSections ? 'visible' : 'hidden')
                    : 'visible'
            }}
            className={`
                overflow-hidden flex flex-col shrink-0 bg-bg-deep shadow-2xl lg:shadow-none
                ${typeof window !== 'undefined' && window.innerWidth < 1024
                    ? 'absolute inset-y-0 left-0 top-0 bottom-0 z-[70] h-full border-r border-border-thin !w-[85vw] sm:!w-[320px]'
                    : (isLeftSidebarOpen ? 'border-r border-border-thin lg:flex' : 'hidden lg:flex')
                }
            `}
        >
            <div style={{ width: showMobileSections ? '100%' : `${leftSidebarWidth}px` }} className="p-4 sm:p-5 flex flex-col justify-between h-full overflow-y-auto overflow-x-hidden shrink-0">
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-3 lg:ml-1">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Navegación del Documento</p>
                        <button
                            onClick={() => {
                                setShowMobileSections(false);
                                setIsLeftSidebarOpen(false);
                            }}
                            className="p-1.5 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            title="Contraer navegación"
                            aria-label="Contraer navegación"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>

                    <div className={density.spaceY}>
                        {sections.map(section => {
                            const isBlocked = !!formData?.BlockedSections?.[section.id];
                            const isActive = activeTab === section.id;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => { setActiveTab(section.id); setShowMobileSections(false); }}
                                    className={`w-full flex items-center justify-between ${density.itemPx} ${density.itemPy} ${density.rounded} ${density.textSize} font-bold uppercase tracking-wider transition-all text-left ${
                                        isActive 
                                            ? 'bg-text-main text-bg-deep shadow-xl' 
                                            : 'text-text-dim hover:bg-surface hover:text-text-main'
                                    }`}
                                >
                                    <span className={`flex items-center ${density.gap} text-left min-w-0`}>
                                        <span className={`shrink-0 flex items-center ${density.iconClass}`}>{section.icon}</span>
                                        <span className="text-left leading-snug break-words">{section.label}</span>
                                    </span>
                                    {isBlocked && (
                                        <div className="flex items-center shrink-0 ml-2">
                                            <Lock size={13} className={isActive ? 'text-bg-deep' : 'text-amber-500'} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-2 mt-2 shrink-0">
                    <button
                        onClick={() => { setActiveTab('output'); setShowMobileSections(false); }}
                        className={`w-full flex items-center justify-between ${density.itemPx} ${density.itemPy} ${density.rounded} ${density.textSize} font-black uppercase tracking-widest transition-all border text-left ${
                            activeTab === 'output' 
                                ? 'bg-text-main text-bg-deep border-text-main shadow-xl' 
                                : 'text-text-dim border-border-thin hover:bg-surface hover:text-text-main'
                        }`}
                    >
                        <span className={`flex items-center ${density.gap} text-left min-w-0`}>
                            <span className={`shrink-0 flex items-center ${density.iconClass}`}><FileText size={18} /></span>
                            <span className="text-left leading-snug">Finalizar y Firmar</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
