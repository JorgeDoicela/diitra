import React, { useState, useEffect } from 'react';
import {
    Users, Activity, BarChart3,
    ClipboardList, Loader2, Megaphone, TrendingUp
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios_config';

interface GlobalStats {
    total_proyectos: number;
    proyectos_borrador: number;
    proyectos_en_revision: number;
    proyectos_aprobados: number;
    proyectos_en_ejecucion: number;
    proyectos_finalizados: number;
    total_convocatorias_abiertas: number;
    total_investigadores_activos: number;
    total_productos_periodo: number;
    articulos_indexados: number;
    prototipos: number;
    ponencias: number;
    presupuesto_total_asignado: number;
    presupuesto_total_ejecutado: number;
    proyectos_por_estado: Array<{ estado: string; cantidad: number; color: string }>;
    actividad_reciente: Array<{
        tipo: string;
        descripcion: string;
        fecha: string;
        uuid?: string;
        estado?: string;
    }>;
}

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Admin';
    const [stats, setStats] = useState<GlobalStats | null>(null);
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

    const ejecucionPorc = stats?.presupuesto_total_asignado
        ? Math.min(100, ((stats.presupuesto_total_ejecutado ?? 0) / stats.presupuesto_total_asignado) * 100)
        : 0;

    return (
        <>
            <DashboardHeader
                title={`Panel de Control, ${firstName}`}
                subtitle="Supervisión global del DIITRA · Investigación, Innovación y Cumplimiento CACES."
                roleName="Director / Administrador"
                actions={
                    <>
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-4 md:px-5 py-2.5 md:py-2 rounded-md border border-border-thin text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            <Users size={14} />
                            <span>Gestionar Usuarios</span>
                        </button>
                        <button
                            onClick={() => navigate('/convocatorias')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-4 md:px-6 py-2.5 md:py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            <Megaphone size={16} />
                            <span>Convocatorias</span>
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

                    {/* Embudo de proyectos */}
                    <BentoCard
                        title="Proyectos Institucionales"
                        description="Estado del pipeline de investigación"
                        icon={<ClipboardList size={14} />}
                        className="md:col-span-2"
                    >
                        <div className="mt-6 space-y-2">
                            {stats?.proyectos_por_estado.map((est) => (
                                <div key={est.estado} className="flex items-center gap-3">
                                    <span className="text-[10px] text-text-dim uppercase tracking-wide w-24 shrink-0">
                                        {est.estado}
                                    </span>
                                    <div className="flex-1 h-2 bg-border-thin rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: stats.total_proyectos
                                                    ? `${(est.cantidad / stats.total_proyectos) * 100}%`
                                                    : '0%',
                                                backgroundColor: est.color
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-text-main font-mono w-6 text-right">
                                        {est.cantidad}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-border-thin flex justify-between text-[10px] font-mono">
                                <span className="text-text-dim">Total proyectos</span>
                                <span className="font-bold text-text-main">{stats?.total_proyectos ?? 0}</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Convocatorias abiertas */}
                    <BentoCard
                        title="Convocatorias Activas"
                        description="Abiertas para postulación"
                        icon={<Megaphone size={14} />}
                    >
                        <div className="mt-4">
                            <p className={`text-5xl font-bold font-mono tracking-tighter ${
                                (stats?.total_convocatorias_abiertas ?? 0) > 0 ? 'text-emerald-400' : 'text-text-dim'
                            }`}>
                                {stats?.total_convocatorias_abiertas ?? 0}
                            </p>
                            <p className="text-[10px] text-text-dim mt-2 uppercase tracking-wide">
                                {(stats?.total_convocatorias_abiertas ?? 0) === 1 ? 'convocatoria abierta' : 'convocatorias abiertas'}
                            </p>
                        </div>
                    </BentoCard>

                    {/* Producción científica */}
                    <BentoCard
                        title="Producción Científica"
                        description="Artículos, prototipos y ponencias"
                        icon={<BarChart3 size={14} />}
                    >
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Artículos indexados</span>
                                <span className="font-bold text-text-main font-mono">{stats?.articulos_indexados ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Prototipos</span>
                                <span className="font-bold text-text-main font-mono">{stats?.prototipos ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Ponencias</span>
                                <span className="font-bold text-text-main font-mono">{stats?.ponencias ?? 0}</span>
                            </div>
                            <div className="pt-2 border-t border-border-thin flex justify-between text-[10px] font-mono">
                                <span className="text-text-dim">Total productos</span>
                                <span className="font-bold text-text-main">{stats?.total_productos_periodo ?? 0}</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Ejecución presupuestaria global */}
                    <BentoCard
                        title="Ejecución Presupuestaria"
                        description="Fondos asignados vs ejecutados (global)"
                        icon={<TrendingUp size={14} />}
                        className="md:col-span-2"
                    >
                        <div className="mt-6">
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-4xl font-bold text-text-main font-mono tracking-tighter">
                                        {ejecucionPorc.toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-text-dim mt-1 uppercase tracking-wide">
                                        ejecutado del total asignado
                                    </p>
                                </div>
                                <div className="text-right text-[10px] font-mono text-text-dim">
                                    <p>${(stats?.presupuesto_total_ejecutado ?? 0).toLocaleString('es-EC')}</p>
                                    <p className="text-text-dim opacity-60">de ${(stats?.presupuesto_total_asignado ?? 0).toLocaleString('es-EC')}</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-border-thin rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                    style={{ width: `${ejecucionPorc}%` }}
                                />
                            </div>
                        </div>
                    </BentoCard>

                    {/* Actividad reciente */}
                    <BentoCard
                        title="Actividad Institucional Reciente"
                        description="Últimos eventos en el sistema DIITRA"
                        icon={<Activity size={14} />}
                        className="md:col-span-4"
                    >
                        <div className="mt-4 space-y-2">
                            {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                <p className="text-[11px] text-text-dim py-4 text-center">
                                    No hay actividad reciente registrada.
                                </p>
                            ) : (
                                stats.actividad_reciente.slice(0, 6).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep border border-border-thin">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            item.tipo === 'informe' ? 'bg-violet-500' : 'bg-blue-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-text-main truncate">{item.descripcion}</p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">
                                                {item.tipo} · {new Date(item.fecha).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        {item.estado && (
                                            <span className="text-[9px] font-bold text-text-dim uppercase tracking-wide shrink-0 border border-border-thin px-2 py-0.5 rounded">
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
