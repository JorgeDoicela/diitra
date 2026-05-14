import React from 'react';
import { CheckCircle2, AlertCircle, History, ExternalLink, Shield, FileSearch } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';

export const RevisorDashboard: React.FC = () => {
    const { user } = useAuth();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Evaluador';

    return (
        <>
            <DashboardHeader 
                title={`Bienvenido, Dr. ${firstName}`} 
                subtitle="Revisa propuestas de investigación bajo el estándar de doble ciego institucional." 
                roleName="Evaluador Externo"
                actions={
                    <>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-4 md:px-5 py-2.5 md:py-2 rounded-md border border-border-thin text-[10px] font-bold uppercase tracking-widest transition-all">
                            <History size={14} />
                            <span>Historial</span>
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-4 md:px-6 py-2.5 md:py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all">
                            <Shield size={16} />
                            <span>Código Ética</span>
                        </button>
                    </>
                }
            />

            <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                <BentoCard 
                    title="Revisiones Pendientes" 
                    description="Asignaciones en espera de evaluación"
                    icon={<AlertCircle size={14} />}
                    className="md:col-span-2"
                >
                    <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-md border border-border-thin bg-surface flex justify-between items-center group cursor-pointer hover:border-text-main/30 transition-all">
                            <div>
                                <p className="text-[10px] font-bold text-text-main uppercase tracking-tighter">Propuesta #2024-0012</p>
                                <p className="text-[9px] text-text-dim mt-1">Límite: 24 May 2024</p>
                            </div>
                            <ExternalLink size={12} className="text-text-dim group-hover:text-text-main transition-colors" />
                        </div>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Estado del Pipeline" 
                    description="Tu progreso como evaluador"
                    icon={<FileSearch size={14} />}
                >
                    <div className="mt-4">
                        <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">01</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Revisión en curso</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Completadas" 
                    description="Revisiones entregadas"
                    icon={<CheckCircle2 size={14} />}
                >
                    <div className="mt-4">
                        <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">12</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Ciclo 2023-2024</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Garantía de Anonimato" 
                    description="Cumplimiento de estándares de revisión"
                    icon={<Shield size={14} />}
                    className="md:col-span-4"
                >
                    <div className="mt-4 flex items-center gap-6 p-4 rounded-lg bg-surface/50 border border-border-thin">
                        <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                             <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-text-main uppercase tracking-widest">Protocolo Doble Ciego Activo</p>
                            <p className="text-[10px] text-text-dim mt-1 max-w-xl">
                                Su identidad y la de los autores se mantiene encriptada. Todas las comunicaciones se realizan a través de la plataforma DIITRA.
                            </p>
                        </div>
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};
