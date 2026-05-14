import React from 'react';
import { Plus, FileText, TrendingUp, Clock, BarChart3, Briefcase } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';

export const DocenteDashboard: React.FC = () => {
    const { user } = useAuth();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Investigador';

    return (
        <>
            <DashboardHeader 
                title={`Panel de Investigación: ${firstName}`} 
                subtitle="Gestiona tus proyectos, carga horaria y productos científicos en un solo lugar." 
                roleName="Docente Investigador"
                actions={
                    <>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-4 md:px-5 py-2.5 md:py-2 rounded-md border border-border-thin text-[10px] font-bold uppercase tracking-widest transition-all">
                            <FileText size={14} />
                            <span>Reportes</span>
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-4 md:px-6 py-2.5 md:py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all">
                            <Plus size={16} />
                            <span>Nuevo Proyecto</span>
                        </button>
                    </>
                }
            />

            <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                <BentoCard 
                    title="Mis Proyectos" 
                    description="Estado actual de tus investigaciones"
                    icon={<Briefcase size={14} />}
                    className="md:col-span-2"
                >
                    <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-md border border-border-thin bg-surface">
                            <p className="text-[10px] font-bold text-text-main">SISTEMA_IA_AGRO</p>
                            <div className="w-full h-1 bg-border-thin mt-2 rounded-full overflow-hidden">
                                <div className="h-full bg-text-main w-[65%]" />
                            </div>
                        </div>
                        <div className="p-3 rounded-md border border-border-thin bg-surface">
                            <p className="text-[10px] font-bold text-text-main">DOMÓTICA_ISTPET</p>
                            <div className="w-full h-1 bg-border-thin mt-2 rounded-full overflow-hidden">
                                <div className="h-full bg-text-main w-[20%]" />
                            </div>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Carga Investigativa" 
                    description="Horas asignadas vs ejecutadas"
                    icon={<Clock size={14} />}
                >
                    <div className="mt-4">
                        <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">32.5h</p>
                        <div className="flex justify-between mt-6 text-[10px] font-mono text-text-dim uppercase">
                            <span>Meta Semanal</span>
                            <span>40h</span>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Productos" 
                    description="Activos validados"
                    icon={<BarChart3 size={14} />}
                >
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">04</p>
                    </div>
                    <p className="text-[10px] text-text-dim mt-4 uppercase font-bold tracking-tighter">3 Artículos / 1 Prototipo</p>
                </BentoCard>

                <BentoCard 
                    title="Crecimiento de Producción" 
                    description="Impacto de tus publicaciones"
                    icon={<TrendingUp size={14} />}
                    className="md:col-span-4"
                >
                    <div className="mt-8 flex justify-between items-end">
                        <div>
                            <p className="text-5xl font-bold text-text-main font-mono tracking-tighter">84.22%</p>
                            <p className="text-[10px] text-text-dim uppercase mt-1">Nivel de cumplimiento global</p>
                        </div>
                        <div className="text-right">
                             <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-bold">+12.4% este mes</span>
                        </div>
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};
