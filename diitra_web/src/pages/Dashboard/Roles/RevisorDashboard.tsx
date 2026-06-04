import React from 'react';
import { CheckCircle2, AlertCircle, ExternalLink, Shield, FileSearch } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';

export const RevisorDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Evaluador';

    return (
        <>
            <DashboardHeader 
                title={`Bienvenido, Dr. ${firstName}`} 
                subtitle="Revisa propuestas de investigación bajo el estándar de doble ciego institucional." 
                roleName="Evaluador Externo"
                actions={
                    <>
                        <button 
                            onClick={() => navigate('/revisiones')}
                            className="btn-vercel-primary flex-1 md:flex-none"
                        >
                            <Shield size={16} />
                            <span>Ver Asignaciones</span>
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
                    isStatic={true}
                >
                    <div className="mt-4 space-y-3">
                        <div 
                            onClick={() => navigate('/revisiones')}
                            className="p-3 rounded-md border border-border-thin bg-surface flex justify-between items-center group cursor-pointer hover:border-border-hover transition-all"
                        >
                            <div>
                                <p className="text-[10px] font-semibold text-text-main uppercase tracking-tighter">Propuesta #2024-0012</p>
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
                    isStatic={true}
                >
                    <div className="mt-4">
                        <p className="stat-number stat-number--sm">01</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Revisión en curso</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Completadas" 
                    description="Revisiones entregadas"
                    icon={<CheckCircle2 size={14} />}
                    isStatic={true}
                >
                    <div className="mt-4">
                        <p className="stat-number stat-number--sm">12</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Ciclo 2023-2024</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Garantía de Anonimato" 
                    description="Cumplimiento de estándares de revisión"
                    icon={<Shield size={14} />}
                    className="md:col-span-4"
                    isStatic={true}
                >
                    <div className="mt-4 flex items-center gap-6 p-4 rounded-lg bg-surface/50 border border-border-thin">
<div className="icon-circle icon-circle-success">
                             <Shield size={24} />
                         </div>
                        <div>
                            <p className="text-[11px] font-semibold text-text-main uppercase tracking-widest">Protocolo Doble Ciego Activo</p>
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
