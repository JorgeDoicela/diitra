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

const calculateSectionProgress = (config: any, formData: any): number | null => {
    if (!formData) return null;
    const completionFields = config?.completionFields || config?.completion_fields;
    if (!completionFields || !Array.isArray(completionFields) || completionFields.length === 0) {
        return null;
    }
    
    let completedCount = 0;
    completionFields.forEach((field: string) => {
        const value = formData[field];
        if (value === undefined || value === null) return;

        // Si es un arreglo (ej: Investigadores, RecursosNecesarios, Cronograma)
        if (Array.isArray(value)) {
            if (value.length > 0) completedCount++;
            return;
        }

        // Si es un objeto (ej: Impacto)
        if (typeof value === 'object') {
            const values = Object.values(value);
            const filled = values.filter(v => v !== undefined && v !== null && v !== '').length;
            if (filled > 0) completedCount++;
            return;
        }

        // Si es string o rich-text
        const str = String(value).trim();
        if (str !== '' && str !== '<p></p>' && str !== '<p><br></p>' && str !== '<p><br/></p>') {
            completedCount++;
        }
    });

    return Math.round((completedCount / completionFields.length) * 100);
};

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
            <div style={{ width: showMobileSections ? '100%' : `${leftSidebarWidth}px` }} className="p-4 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-5 h-full overflow-y-auto overflow-x-hidden shrink-0">
                <div>
                    <div className="flex justify-between items-center mb-2.5 lg:ml-1">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Navegación del Documento</p>
                        <button
                            onClick={() => {
                                setShowMobileSections(false);
                                setIsLeftSidebarOpen(false);
                            }}
                            className="p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            title="Contraer navegación"
                            aria-label="Contraer navegación"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {sections.map(section => {
                            const progress = calculateSectionProgress(section.config, formData);

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => { setActiveTab(section.id); setShowMobileSections(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left ${activeTab === section.id ? 'bg-text-main text-bg-deep shadow-xl lg:translate-x-2' : 'text-text-dim hover:bg-bg-deep hover:text-text-main'}`}
                                >
                                    <span className="flex items-center gap-3 text-left min-w-0">
                                        <span className="shrink-0 flex items-center">{section.icon}</span>
                                        <span className="text-left leading-snug break-words">{section.label}</span>
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {progress !== null && (
                                            <span className={`text-[9px] font-black tracking-normal px-1.5 py-0.5 rounded-full border ${activeTab === section.id ? 'text-bg-deep border-bg-deep/20 bg-bg-deep/5' : 'text-text-dim border-border-thin bg-surface/30'}`}>
                                                {progress}%
                                            </span>
                                        )}
                                        {formData?.BlockedSections?.[section.id] && (
                                            <Lock size={12} className={activeTab === section.id ? 'text-bg-deep' : 'text-amber-500'} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                        <button
                            onClick={() => { setActiveTab('output'); setShowMobileSections(false); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-4 border text-left ${activeTab === 'output' ? 'bg-text-main text-bg-deep border-text-main shadow-xl' : 'text-text-dim border-border-thin hover:bg-bg-deep hover:text-text-main'}`}
                        >
                            <span className="flex items-center gap-3 text-left min-w-0">
                                <span className="shrink-0 flex items-center"><FileText size={18} /></span>
                                <span className="text-left leading-snug">Finalizar y Firmar</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
