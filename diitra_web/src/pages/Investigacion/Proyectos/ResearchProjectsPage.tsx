import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, Plus, Search, FileText, 
    MoreVertical, ExternalLink, MessageCircle,
    ArrowRight, Target, Users, DollarSign, Calendar, Filter
} from 'lucide-react';
import api from '../../../api/axios_config';
import ProjectWorkspace from './Wizard/ProjectWizard';
import DocumentTray from '../DocumentWorkspace/DocumentTray';

interface Proyecto {
    uuid: string;
    titulo: string;
    estado: string;
    codigo_institucional?: string;
    fecha_registro: string;
    puntaje_evaluacion?: number;
}

const ResearchProjectsPage = () => {
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [loading, setLoading] = useState(true);

    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        const fetchProyectos = async () => {
            try {
                // Endpoint ficticio por ahora, el usuario debe implementarlo o yo lo haré luego
                // const response = await api.get('/Projects/my-projects');
                // setProyectos(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching projects:', error);
                setLoading(false);
            }
        };
        fetchProyectos();
    }, []);

    return (
        <main className="flex-1 bg-bg-deep p-10 overflow-y-auto">
            {/* Header */}
            <header className="flex justify-between items-end mb-16 px-2 animate-fade-up">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <ClipboardList size={10} className="text-text-main" />
                        <span>Mis Investigaciones</span>
                    </div>
                    <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Proyectos de I+D+i</h2>
                    <p className="text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Gestione sus protocolos, informes de avance y productos de investigación.
                    </p>
                </div>

                <button 
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-2 bg-text-main text-bg-deep px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nueva Postulación
                </button>
            </header>

            {/* ── NÚCLEO DIITRA BUILDER: Centro de Control ── */}
            <div className="grid grid-cols-12 gap-8 mb-16 animate-fade-up [animation-delay:100ms]">
                {/* Lado Izquierdo: Acciones de Postulación */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <div 
                        onClick={() => setShowWizard(true)}
                        className="group relative overflow-hidden bg-text-main p-10 rounded-2xl cursor-pointer shadow-2xl transition-all hover:scale-[1.01] active:scale-95"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                            <Target size={180} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-bg-deep/60 mb-4">
                                <Plus size={20} strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-[0.3em]">Nueva Postulación Activa</span>
                            </div>
                            <h3 className="text-4xl font-bold text-bg-deep tracking-tighter uppercase mb-4 leading-none">Lanzar DIITRA Builder</h3>
                            <p className="text-bg-deep/70 text-sm max-w-md font-medium leading-relaxed mb-8">
                                Inicie el proceso de creación de su proyecto de investigación utilizando el núcleo de renderizado oficial.
                            </p>
                            <div className="inline-flex items-center gap-3 bg-bg-deep text-text-main px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                                Comenzar ahora <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-surface border border-border-thin p-8 rounded-2xl hover:border-text-main transition-colors cursor-pointer group">
                            <FileText className="text-text-main mb-6" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Mis Expedientes</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Gestión de Ciclo de Vida</p>
                        </div>
                        <div className="bg-surface border border-border-thin p-8 rounded-2xl hover:border-text-main transition-colors cursor-pointer group">
                            <Users className="text-text-main mb-6" size={28} />
                            <h4 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">Colaboración</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">DIITRA CoWork Activo</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Capacidades del Núcleo */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
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
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-3">
                            <Calendar size={18} /> Historial de Documentos Generados
                        </h3>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1 ml-7">Auditoría LOPDP y Trazabilidad en tiempo real</p>
                    </div>
                    <div className="flex gap-2">
                         <div className="flex h-10 items-center gap-3 px-4 bg-surface border border-border-thin rounded-xl text-text-dim text-[10px] font-black uppercase tracking-widest hover:border-text-main cursor-pointer transition-colors">
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
