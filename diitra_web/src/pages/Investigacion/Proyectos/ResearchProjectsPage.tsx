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

            {/* Quick Actions / Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up [animation-delay:100ms]">
                <div className="bento-card p-8 bg-surface/30 border-text-main/20 flex flex-col justify-between group cursor-pointer hover:border-text-main transition-all">
                    <Target className="text-text-main mb-6" size={32} />
                    <div>
                        <h3 className="text-xl font-bold text-text-main tracking-tight uppercase mb-2">Postulación Digital</h3>
                        <p className="text-xs text-text-dim leading-relaxed mb-6">Inicie el registro de un nuevo protocolo de investigación según el formato institucional.</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                            Comenzar ahora <ArrowRight size={14} />
                        </div>
                    </div>
                </div>

                <div className="bento-card p-8 bg-surface/30 flex flex-col justify-between group cursor-pointer hover:border-text-main transition-all">
                    <FileText className="text-text-dim mb-6" size={32} />
                    <div>
                        <h3 className="text-xl font-bold text-text-main tracking-tight uppercase mb-2">Informes de Avance</h3>
                        <p className="text-xs text-text-dim leading-relaxed mb-6">Suba evidencias mensuales y reportes de progreso para sus proyectos en ejecución.</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
                            Ir a monitoreo <ArrowRight size={14} />
                        </div>
                    </div>
                </div>

                <div className="bento-card p-8 bg-surface/30 flex flex-col justify-between group cursor-pointer hover:border-text-main transition-all">
                    <Users className="text-text-dim mb-6" size={32} />
                    <div>
                        <h3 className="text-xl font-bold text-text-main tracking-tight uppercase mb-2">Propiedad Intelectual</h3>
                        <p className="text-xs text-text-dim leading-relaxed mb-6">Registre patentes, software y derechos de autor generados en sus proyectos.</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
                            Gestionar productos <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Proyectos / Bandeja de Documentos */}
            <div className="grid grid-cols-1 gap-10 animate-fade-up [animation-delay:200ms]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Gestión de Expedientes Activos
                        </h3>
                    </div>
                    
                    {/* Ejemplo de Integración de la Bandeja Universal */}
                    <DocumentTray 
                        entityUuid="proyecto-actual-001" 
                        title="Expediente: Energía Eólica en el Azuay"
                    />
                </div>
            </div>

            {/* Project List Placeholder */}
            <div className="space-y-4 animate-fade-up [animation-delay:200ms]">
                <div className="flex items-center justify-between px-2 mb-4">
                    <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em]">Mis Proyectos Recientes</h4>
                    <div className="flex gap-2">
                         <div className="flex h-8 items-center gap-2 px-3 bg-surface border border-border-thin rounded text-text-dim text-[10px] font-bold uppercase tracking-widest">
                            <Filter size={12} /> Filtrar
                         </div>
                    </div>
                </div>

                <div className="py-20 text-center bento-card border-dashed">
                    <div className="inline-flex p-4 rounded-full bg-surface border border-border-thin text-text-dim mb-4">
                        <ClipboardList size={32} />
                    </div>
                    <p className="text-text-dim font-bold uppercase tracking-widest text-sm">Aún no tienes proyectos registrados</p>
                    <p className="text-[10px] text-text-dim/60 uppercase tracking-tight mt-1">Las postulaciones enviadas aparecerán aquí.</p>
                </div>
            </div>

            {showWizard && <ProjectWorkspace onClose={() => setShowWizard(false)} />}
        </main>
    );
};

export default ResearchProjectsPage;
