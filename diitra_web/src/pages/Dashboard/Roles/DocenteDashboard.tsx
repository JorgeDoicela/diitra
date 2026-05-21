import React, { useState, useEffect } from 'react';
import {
    Plus, TrendingUp, Clock, BarChart3, Briefcase,
    Loader2, AlertCircle, ClipboardList, ArrowRight
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios_config';

interface DashboardStats {
    mis_proyectos_activos: number;
    mis_proyectos_borrador: number;
    mis_productos_registrados: number;
    mis_informes_pendientes: number;
    mis_horas_investigacion: number;
    actividad_reciente: Array<{
        tipo: string;
        descripcion: string;
        fecha: string;
        uuid?: string;
        estado?: string;
    }>;
}

const ESTADO_DOT: Record<string, string> = {
    'Borrador': 'bg-gray-500',
    'Enviado': 'bg-blue-500',
    'En Revisión': 'bg-amber-500 animate-pulse',
    'Aprobado': 'bg-emerald-500',
    'En Ejecución': 'bg-violet-500 animate-pulse',
    'Finalizado': 'bg-teal-500',
    'Pendiente': 'bg-amber-500',
};

export const DocenteDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Investigador';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/projects/stats');
                setStats(res.data);
            } catch (e) {
                console.error('[DIITRA] Error al cargar stats:', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);



    return (
        <>
            <DashboardHeader
                title={`Bienvenido, ${firstName}`}
                subtitle="Gestiona tus proyectos, carga horaria y productos científicos en un solo lugar."
                roleName="Docente Investigador"
                actions={
                    <>
                        <button
                            onClick={() => navigate('/investigacion/mis-proyectos')}
                            className="btn-vercel-secondary flex-1 md:flex-none"
                        >
                            <ClipboardList size={14} />
                            <span>Mis Proyectos</span>
                        </button>
                        <button
                            onClick={() => navigate('/investigacion')}
                            className="btn-vercel-primary flex-1 md:flex-none"
                        >
                            <Plus size={16} />
                            <span>Nuevo Proyecto</span>
                        </button>
                    </>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : (
                <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">

                    {/* Mis proyectos activos */}
                    <BentoCard
                        title="Proyectos Activos"
                        description="Investigaciones en ejecución o aprobadas"
                        icon={<Briefcase size={14} />}
                        className="md:col-span-2"
                    >
                        <div className="mt-6 flex items-end gap-6">
                            <div>
                                <p className="stat-number stat-number--lg text-text-main">
                                    {stats?.mis_proyectos_activos ?? 0}
                                </p>
                                <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">
                                    proyectos activos
                                </p>
                            </div>
                            {stats?.mis_proyectos_borrador != null && stats.mis_proyectos_borrador > 0 && (
                                <div className="pb-1">
                                    <p className="stat-number stat-number--sm text-text-dim">
                                        +{stats.mis_proyectos_borrador}
                                    </p>
                                    <p className="text-[10px] text-text-dim uppercase tracking-widest">
                                        en borrador
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/investigacion/mis-proyectos')}
                            className="mt-6 btn-vercel-secondary"
                        >
                            Ver todos mis proyectos
                            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </BentoCard>

                    {/* Informes pendientes */}
                    <BentoCard
                        title="Informes Pendientes"
                        description="Reportes de avance por entregar"
                        icon={<Clock size={14} />}
                    >
                        <div className="mt-4">
                            <p className={`stat-number ${(stats?.mis_informes_pendientes ?? 0) > 0 ? 'text-amber-400' : 'text-text-main'}`}>
                                {stats?.mis_informes_pendientes ?? 0}
                            </p>
                            {(stats?.mis_informes_pendientes ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-amber-400 font-bold uppercase">
                                    <AlertCircle size={10} />
                                    Acción requerida
                                </div>
                            )}
                            {(stats?.mis_informes_pendientes ?? 0) === 0 && (
                                <p className="text-[10px] text-text-dim mt-3 uppercase tracking-wide">
                                    Al día ✓
                                </p>
                            )}
                        </div>
                    </BentoCard>

                    {/* Productos registrados */}
                    <BentoCard
                        title="Mis Productos"
                        description="Artículos, prototipos y ponencias"
                        icon={<BarChart3 size={14} />}
                    >
                        <div className="mt-2 flex items-center justify-between">
                            <p className="stat-number stat-number--sm">
                                {String(stats?.mis_productos_registrados ?? 0).padStart(2, '0')}
                            </p>
                        </div>
                        <p className="text-[10px] text-text-dim mt-4 uppercase font-bold tracking-tighter">
                            productos validados
                        </p>
                    </BentoCard>

                    {/* Actividad reciente */}
                    <BentoCard
                        title="Actividad Reciente"
                        description="Últimos movimientos en el sistema"
                        icon={<TrendingUp size={14} />}
                        className="md:col-span-4"
                    >
                        <div className="mt-4 space-y-2">
                            {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                <div className="empty-state py-4">
                                    <p className="text-[11px] text-text-dim">
                                        Aún no hay actividad registrada.
                                    </p>
                                </div>
                            ) : (
                                stats.actividad_reciente.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep border border-border-thin hover:border-border-hover transition-colors cursor-pointer group">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ESTADO_DOT[item.estado ?? ''] ?? 'bg-text-dim'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-text-main truncate">{item.descripcion}</p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">
                                                {item.tipo} · {new Date(item.fecha).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        {item.estado && (
                                            <span className="status-tag text-text-dim border-border-thin">
                                                {item.estado}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>

                </BentoGrid>
            )}
        </>
    );
};
