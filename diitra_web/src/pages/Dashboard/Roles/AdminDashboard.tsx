import React from 'react';
import { ShieldCheck, Users, Activity, Settings, BarChart3, Database } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Admin';

    return (
        <>
            <DashboardHeader 
                title={`Bienvenido de vuelta, ${firstName}`} 
                subtitle="Supervisión global de seguridad, usuarios y salud del sistema institucional." 
                roleName="Administrador"
                actions={
                    <>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-4 md:px-5 py-2.5 md:py-2 rounded-md border border-border-thin text-[10px] font-bold uppercase tracking-widest transition-all">
                            <Settings size={14} />
                            <span>Configuración</span>
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-4 md:px-6 py-2.5 md:py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all">
                            <Users size={16} />
                            <span>Gestionar Usuarios</span>
                        </button>
                    </>
                }
            />

            <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                <BentoCard 
                    title="Estado del Sistema" 
                    description="Monitoreo de servicios core y base de datos"
                    icon={<Activity size={14} />}
                    className="md:col-span-2"
                >
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-md border border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <Database size={14} className="text-green-500" />
                                <span className="text-xs font-mono">MySQL_Central</span>
                            </div>
                            <span className="text-[10px] text-green-500 font-bold">ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-md border border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={14} className="text-green-500" />
                                <span className="text-xs font-mono">Auth_Provider_JIT</span>
                            </div>
                            <span className="text-[10px] text-green-500 font-bold">STABLE</span>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Usuarios Activos" 
                    description="Sesiones concurrentes hoy"
                    icon={<Users size={14} />}
                >
                    <div className="mt-4">
                        <p className="text-5xl font-bold font-mono text-text-main tracking-tighter">24</p>
                        <p className="text-[10px] text-text-dim mt-2">+12% vs ayer</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Auditoría" 
                    description="Últimos cambios críticos"
                    icon={<ShieldCheck size={14} />}
                >
                    <div className="mt-4 space-y-2">
                        <p className="text-[9px] font-mono text-text-dim truncate">0xAD: Role_Assigned -&gt; User_421</p>
                        <p className="text-[9px] font-mono text-text-dim truncate">0xAD: Settings_Updated -&gt; SMTP</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Analíticas Globales" 
                    description="Consolidado institucional CACES 2026"
                    icon={<BarChart3 size={14} />}
                    className="md:col-span-4"
                >
                    <div className="mt-4 h-32 flex items-end gap-2">
                        {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-text-main/20 hover:bg-text-main transition-colors rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};
