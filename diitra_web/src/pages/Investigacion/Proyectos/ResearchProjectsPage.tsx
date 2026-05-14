import { useState, useEffect } from 'react';
import { 
    ClipboardList, Plus, FileText, 
    ArrowRight, Target, Users, Calendar, Filter,
    FileCheck
} from 'lucide-react';
import ProjectWorkspace from './Wizard/ProjectWizard';
import DocumentTray from '../DocumentWorkspace/DocumentTray';
import FinalReportLauncher from './components/FinalReportLauncher';

const ResearchProjectsPage = () => {
    const [showWizard, setShowWizard] = useState(false);
    const [showReportLauncher, setShowReportLauncher] = useState(false);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto selection:bg-primary/20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 px-2 animate-fade-up gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <ClipboardList size={10} className="text-primary" />
                        <span>Mis Investigaciones</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Proyectos de I+D+i</h2>
                    <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Gestione sus protocolos, informes de avance y productos de investigación.
                    </p>
                </div>

                <button 
                    onClick={() => setShowWizard(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nueva Postulación
                </button>
            </header>

            {/* ── NÚCLEO DIITRA BUILDER: Centro de Control ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 animate-fade-up [animation-delay:100ms]">
                {/* Lado Izquierdo: Acciones de Postulación */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
                    <div 
                        onClick={() => setShowWizard(true)}
                        className="group relative overflow-hidden bg-surface border border-border-thin p-6 md:p-10 rounded-2xl cursor-pointer shadow-sm transition-all hover:shadow-xl hover:scale-[1.01] active:scale-95 bg-glow"
                    >
                        <div className="absolute top-0 right-0 p-12 text-text-main opacity-5 group-hover:scale-110 transition-transform">
                            <Target size={180} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-text-main/60 mb-4">
                                <div className="p-1 bg-text-main/10 rounded-sm">
                                    <Plus size={16} strokeWidth={3} className="text-text-main" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Nueva Postulación Activa</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase mb-4 leading-none">Lanzar DIITRA Builder</h3>
                            <p className="text-text-dim text-sm max-w-md font-medium leading-relaxed mb-8">
                                Inicie el proceso de creación de su proyecto de investigación utilizando el núcleo de renderizado oficial de la institución.
                            </p>
                            <div className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-text-main text-bg-deep px-8 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] shadow-lg group-hover:translate-x-1 transition-transform">
                                Comenzar ahora <ArrowRight size={14} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                            onClick={() => setShowReportLauncher(true)}
                            className="bg-surface border border-border-thin p-8 rounded-2xl hover:border-primary transition-colors cursor-pointer group shadow-sm hover:shadow-lg bg-glow"
                        >
                            <FileCheck className="text-primary mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Informe Final</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Consolidación de Resultados</p>
                        </div>
                        <div className="bg-surface border border-border-thin p-8 rounded-2xl hover:border-text-main transition-colors cursor-pointer group shadow-sm">
                            <Users className="text-text-main mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Colaboración</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">DIITRA CoWork Activo</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Capacidades del Núcleo */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-bg-deep border border-border-thin p-8 rounded-2xl shadow-inner">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                                <ClipboardList size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-text-main uppercase tracking-widest">Capacidades del Núcleo</h4>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-tighter">DIITRA Builder Engine v4.0</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Renderizado PDF/A", status: "Óptimo", icon: <CheckCircle size={14} className="text-green-500" /> },
                                { label: "Inyección QR & LOPDP", status: "Activo", icon: <CheckCircle size={14} className="text-green-500" /> },
                                { label: "Doble Ciego (Anonimizado)", status: "Listo", icon: <CheckCircle size={14} className="text-green-500" /> },
                                { label: "Firma Electrónica PAdES", status: "Habilitado", icon: <CheckCircle size={14} className="text-blue-500" /> },
                                { label: "Sincronización CoWork", status: "En Línea", icon: <CheckCircle size={14} className="text-green-500" /> }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-[11px] font-bold text-text-dim uppercase tracking-tight">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-text-main uppercase">{item.status}</span>
                                        {item.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-border-thin">
                            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-4">Plantillas Disponibles</p>
                            <div className="flex flex-wrap gap-2">
                                {['PROTOCOLO', 'ACTA', 'INFORME', 'CERTIFICADO'].map(t => (
                                    <span key={t} className="px-2 py-1 bg-surface border border-border-thin rounded text-[8px] font-black text-text-main uppercase tracking-tighter">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── GESTIÓN DE EXPEDIENTES Y DOCUMENTOS ── */}
            <div className="space-y-6 animate-fade-up [animation-delay:200ms]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 gap-4">
                    <div>
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-3">
                            <Calendar size={18} /> Historial de Documentos Generados
                        </h3>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1 ml-7">Auditoría LOPDP y Trazabilidad en tiempo real</p>
                    </div>
                    <div className="w-full md:w-auto flex gap-2">
                         <div className="flex-1 md:flex-none flex h-10 items-center justify-center gap-3 px-4 bg-surface border border-border-thin rounded-xl text-text-dim text-[10px] font-black uppercase tracking-widest hover:border-text-main cursor-pointer transition-colors">
                            <Filter size={14} /> Filtrar Expedientes
                         </div>
                    </div>
                </div>
                
                <DocumentTray 
                    entityUuid="GLOBAL" 
                    title="Historial Maestro del Núcleo"
                />
            </div>

            {showWizard && <ProjectWorkspace onClose={() => setShowWizard(false)} />}
            {showReportLauncher && <FinalReportLauncher onClose={() => setShowReportLauncher(false)} />}
        </main>
    );
};

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default ResearchProjectsPage;
