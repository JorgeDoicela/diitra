import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus,
    FileCheck, ListChecks
} from 'lucide-react';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import DocumentTray from '../../../components/DIITRA/DocumentTray';
import FinalReportLauncher from './components/FinalReportLauncher';
import { useAuth } from '../../../api/AuthContext';

const ResearchProjectsPage = () => {
    const navigate = useNavigate();
    const { isDocente, isAdmin } = useAuth();
    const [showWizard, setShowWizard] = useState(false);
    const [showReportLauncher, setShowReportLauncher] = useState(false);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 animate-fade-up gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-brand">
                        <ClipboardList size={10} />
                        <span>{isAdmin ? "Supervisión de Investigaciones" : "Mis Investigaciones"}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">
                        {isAdmin ? "Supervisión de Proyectos de I+D+i" : "Proyectos de I+D+i"}
                    </h2>
                    <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        {isAdmin 
                            ? "Administre y supervise todos los protocolos, informes de avance y productos de investigación." 
                            : "Gestione sus protocolos, informes de avance y productos de investigación."}
                    </p>
                </div>

                {!isDocente && (
                    <button
                        onClick={() => setShowWizard(true)}
                        className="btn-vercel-primary w-full md:w-auto px-6 py-3 md:py-2.5"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Postulación
                    </button>
                )}
            </header>

            {/* ── ACCIONES RÁPIDAS ── */}
            <section className="mb-12 animate-fade-up [animation-delay:100ms]">
                <div className="section-label text-brand mb-4">
                    <span>Centro de Control</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => navigate('/investigacion/mis-proyectos')}
                        className="bento-card p-6 cursor-pointer group"
                    >
                        <ListChecks className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h4 className="text-sm font-bold text-text-main uppercase tracking-tight mb-1">
                            {isAdmin ? "Todos los Proyectos" : "Mis Proyectos"}
                        </h4>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                            {isAdmin ? "Expediente General" : "Expediente Personal"}
                        </p>
                    </div>
                    <div
                        onClick={() => setShowReportLauncher(true)}
                        className="bento-card p-6 cursor-pointer group"
                    >
                        <FileCheck className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h4 className="text-sm font-bold text-text-main uppercase tracking-tight mb-1">Informe Final</h4>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Consolidación de Resultados</p>
                    </div>
                </div>
            </section>

            {/* ── HISTORIAL DE DOCUMENTOS ── */}
            <section className="space-y-6 animate-fade-up [animation-delay:200ms]">
                <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-3">
                        Documentos Generados
                    </h3>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1 ml-7">Auditoría LOPDP y Trazabilidad en tiempo real</p>
                </div>

                <DocumentTray
                    entityUuid="GLOBAL"
                    title="Historial Maestro del Núcleo"
                />
            </section>

            {showWizard && <CreateProjectModal onClose={() => setShowWizard(false)} />}
            {showReportLauncher && <FinalReportLauncher onClose={() => setShowReportLauncher(false)} />}
        </main>
    );
};

export default ResearchProjectsPage;
