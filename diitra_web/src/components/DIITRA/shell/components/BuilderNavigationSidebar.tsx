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
                    ? 'fixed inset-y-0 left-0 top-[60px] z-[70] h-[calc(100vh-60px)] border-r border-border-thin !w-[85vw] sm:!w-[320px]'
                    : (isLeftSidebarOpen ? 'border-r border-border-thin lg:flex' : 'hidden lg:flex')
                }
            `}
        >
            <div style={{ width: showMobileSections ? '100%' : `${leftSidebarWidth}px` }} className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 h-full overflow-y-auto overflow-x-hidden shrink-0">
                <div className="flex lg:hidden justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Navegación</p>
                    <button
                        onClick={() => setShowMobileSections(false)}
                        className="p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4 lg:ml-2">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Navegación del Documento</p>
                        <button
                            onClick={() => setIsLeftSidebarOpen(false)}
                            className="hidden lg:flex p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                            title="Contraer navegación"
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
                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === section.id ? 'bg-text-main text-bg-deep shadow-xl lg:translate-x-2' : 'text-text-dim hover:bg-bg-deep hover:text-text-main'}`}
                                >
                                    <span className="flex items-center gap-4">
                                        {section.icon} {section.label}
                                    </span>
                                    <div className="flex items-center gap-2">
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
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-8 border ${activeTab === 'output' ? 'bg-text-main text-bg-deep border-text-main shadow-xl' : 'text-text-dim border-border-thin hover:bg-bg-deep hover:text-text-main'}`}
                        >
                            <span className="flex items-center gap-4">
                                <FileText size={18} /> Finalizar y Firmar
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
