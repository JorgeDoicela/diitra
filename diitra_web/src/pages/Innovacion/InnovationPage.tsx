import React, { useState } from 'react';
import { PageHeader } from '../../components/Common/PageHeader';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { CreateProjectModal } from '../../components/DIITRA/CreateProjectModal';
import { InnovationProjectsTab } from './components/InnovationProjectsTab';

const InnovationPage: React.FC = () => {
    const { isEstudiante } = useAuth();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-8 animate-fade-up">
            {/* Header del Módulo */}
            <PageHeader
                kicker="Módulo Institucional ISTPET"
                icon={Sparkles}
                title="Innovación y Transferencia Tecnológica"
                description="Gestión oficial de propuestas y proyectos de innovación e i+TT bajo el documento normativo institucional (PROTOCOLO_INNOVACION)."
            >
                {!isEstudiante && (
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="btn-vercel-primary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Nueva Propuesta</span>
                        </button>
                    </div>
                )}
            </PageHeader>

            {/* Listado y Gestión de Proyectos de Innovación */}
            <InnovationProjectsTab />

            {/* Modal de Creación de Proyecto (preseleccionado en Innovación) */}
            {isCreateOpen && (
                <CreateProjectModal
                    initialModalidad="INNOVACION"
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                    }}
                />
            )}
        </main>
    );
};

export default InnovationPage;
