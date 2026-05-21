import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ClipboardList, Plus, 
    ArrowRight, Target, Users, Calendar, Filter,
    FileCheck, ShieldCheck, ListChecks
} from 'lucide-react';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import DocumentTray from '../../../components/DIITRA/DocumentTray';
import FinalReportLauncher from './components/FinalReportLauncher';

const ResearchProjectsPage = () => {
    const navigate = useNavigate();
    const [showWizard, setShowWizard] = useState(false);
    const [showReportLauncher, setShowReportLauncher] = useState(false);

    return (
        <main className="flex-1 bg-bg-deep vercel-grid-fade p-4 md:p-10 overflow-y-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 px-2 animate-fade-up gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-brand">
                        <ClipboardList size={10} />
                        <span>Mis Investigaciones</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Proyectos de I+D+i</h2>
                    <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Gestione sus protocolos, informes de avance y productos de investigación.
                    </p>
                </div>

                <button 
                    onClick={() => setShowWizard(true)}
                    className="btn-vercel-primary w-full md:w-auto px-6 py-3 md:py-2.5"
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
                        className="bento-card group relative overflow-hidden p-6 md:p-10 cursor-pointer bg-glow"
                    >
                        <div className="absolute top-0 right-0 p-12 text-text-main opacity-5 group-hover:scale-110 transition-transform">
                            <Target size={180} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-brand mb-4">
                                <div className="p-1 bg-brand-subtle rounded-sm">
                                    <Plus size={16} strokeWidth={3} className="text-brand" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Nueva Postulación Activa</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase mb-4 leading-none">Lanzar DIITRA Builder</h3>
                            <p className="text-text-dim text-sm max-w-md font-medium leading-relaxed mb-8">
                                Inicie el proceso de creación de su proyecto de investigación utilizando el núcleo de renderizado oficial de la institución.
                            </p>
                            <div className="btn-vercel-primary gap-3 px-8 py-3 group-hover:translate-x-1 transition-transform">
                                Comenzar ahora <ArrowRight size={14} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div 
                            onClick={() => navigate('/investigacion/mis-proyectos')}
                            className="bento-card p-8 cursor-pointer group"
                        >
                            <ListChecks className="text-brand mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Mis Proyectos</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Expediente Personal</p>
                        </div>
                        <div 
                            onClick={() => setShowReportLauncher(true)}
                            className="bento-card p-8 cursor-pointer group bg-glow"
                        >
                            <FileCheck className="text-brand mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Informe Final</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Consolidación de Resultados</p>
                        </div>
                        <div 
                            onClick={() => navigate('/investigacion/mis-proyectos')}
                            className="bento-card p-8 cursor-pointer group bg-glow"
                        >
                            <Users className="text-text-main mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Colaboración</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">DIITRA CoWork Activo</p>
                        </div>
                        <div 
                            onClick={() => window.open('/verify', '_blank')}
                            className="bento-card p-8 cursor-pointer group bg-glow"
                        >
                            <ShieldCheck className="text-success mb-6 group-hover:scale-110 transition-transform" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Verificar Firma</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Trazabilidad & CACES</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Capacidades del Núcleo */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
                    <div className="bento-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-brand-subtle rounded-lg text-brand">
                                <ClipboardList size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-text-main uppercase tracking-widest">Capacidades del Núcleo</h4>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-tighter">DIITRA Builder Engine v4.0</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Renderizado PDF/A", status: "Óptimo", theme: "success" },
                                { label: "Inyección QR & LOPDP", status: "Activo", theme: "success" },
                                { label: "Doble Ciego (Anonimizado)", status: "Listo", theme: "success" },
                                { label: "Firma Electrónica PAdES", status: "Habilitado", theme: "info" },
                                { label: "Sincronización CoWork", status: "En Línea", theme: "success" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-[11px] font-bold text-text-dim uppercase tracking-tight">{item.label}</span>
                                    <span className={`badge-vercel badge-vercel-${item.theme} text-[8px] font-black`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 divider-vercel !mx-0">
                            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-4">Plantillas Disponibles</p>
                            <div className="flex flex-wrap gap-2">
                                {['PROTOCOLO', 'ACTA', 'INFORME', 'CERTIFICADO'].map(t => (
                                    <span key={t} className="badge-vercel text-[8px] font-black tracking-wider">{t}</span>
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
<button 
                             className="btn-vercel-secondary flex-1 md:flex-none px-4 h-10 cursor-pointer"
                          >
                            <Filter size={14} /> Filtrar Expedientes
                         </button>
                    </div>
                </div>
                
                <DocumentTray 
                    entityUuid="GLOBAL" 
                    title="Historial Maestro del Núcleo"
                />
            </div>

            {showWizard && <CreateProjectModal onClose={() => setShowWizard(false)} />}
            {showReportLauncher && <FinalReportLauncher onClose={() => setShowReportLauncher(false)} />}
        </main>
    );
};

export default ResearchProjectsPage;
