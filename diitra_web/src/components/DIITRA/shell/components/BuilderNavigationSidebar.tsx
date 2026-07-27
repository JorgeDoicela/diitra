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
                            const progress = (() => {
                                if (!formData) return null;
                                if (section.id === 'identificacion') {
                                    const fields = [
                                        formData.Titulo, formData.IdCarrera, formData.IdConvocatoria,
                                        formData.Periodo, formData.TiempoEjecucion, formData.Programa,
                                        formData.Dominio, formData.LineaInvestigacion, formData.SublineaInvestigacion
                                    ];
                                    const filled = fields.filter(f => f !== undefined && f !== null && f !== '' && f !== 0).length;
                                    return Math.round((filled / fields.length) * 100);
                                }
                                if (section.id === 'equipo') {
                                    const hasTeam = Array.isArray(formData.Investigadores) && formData.Investigadores.length > 0;
                                    return hasTeam ? 100 : 0;
                                }
                                if (section.id === 'tecnico') {
                                    const fields = [];
                                    const checkKeys = ['Antecedentes', 'DescripcionProyecto', 'Justificacion', 'ObjetivoGeneral', 'ObjetivosEspecificos', 'MarcoTeorico', 'Metodologia', 'Evaluacion'];
                                    checkKeys.forEach(k => {
                                        if (formData[k] !== undefined) fields.push(formData[k]);
                                    });
                                    if (fields.length === 0) return null;
                                    const filled = fields.filter(f => f !== undefined && f !== null && f !== '' && f !== '<p></p>' && f !== '<p><br></p>').length;
                                    return Math.round((filled / fields.length) * 100);
                                }
                                if (section.id === 'recursos') {
                                    const hasRec = (Array.isArray(formData.RecursosDisponibles) && formData.RecursosDisponibles.length > 0) ||
                                                    (Array.isArray(formData.RecursosNecesarios) && formData.RecursosNecesarios.length > 0);
                                    return hasRec ? 100 : 0;
                                }
                                if (section.id === 'impactos') {
                                    const hasProdOrImp = (Array.isArray(formData.ProductosEsperados) && formData.ProductosEsperados.length > 0) ||
                                                         (formData.Impacto && Object.values(formData.Impacto).some(v => v !== ''));
                                    return hasProdOrImp ? 100 : 0;
                                }
                                if (section.id === 'cronograma') {
                                    const hasCron = Array.isArray(formData.Cronograma) && formData.Cronograma.length > 0;
                                    return hasCron ? 100 : 0;
                                }
                                if (section.id === 'bibliografia') {
                                    const fields = [formData.Bibliografia];
                                    const filled = fields.filter(f => f !== undefined && f !== null && f !== '' && f !== '<p></p>' && f !== '<p><br></p>').length;
                                    return Math.round((filled / fields.length) * 100);
                                }
                                return null;
                            })();

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
