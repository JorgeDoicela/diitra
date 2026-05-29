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
    'Borrador': 'dot-neutral',
    'Enviado': 'dot-info',
    'En Revisión': 'dot-warning dot-pulse',
    'Aprobado': 'dot-success',
    'En Ejecución': 'dot-brand dot-pulse',
    'Finalizado': 'dot-success',
    'Pendiente': 'dot-warning',
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
                /* Two-column Vercel Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:200ms] pb-10">
                    
                    {/* Main Content: Left Column */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Gestión de Proyectos */}
                        <div className="bento-card p-6 flex flex-col justify-between bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase size={14} className="text-text-dim" />
                                    <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Mis Proyectos de Investigación</span>
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-text-main mb-2">
                                    Resumen de Propuestas Académicas
                                </h3>
                                <p className="text-xs text-text-dim max-w-xl font-medium leading-relaxed mb-6">
                                    Administra tus propuestas, realiza el seguimiento del ciclo de vida (Borrador, En Revisión, En Ejecución, Finalizado) y justifica egresos financieros bajo normativas vigentes.
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-bg-deep border border-border-thin/40 rounded-lg text-center">
                                        <p className="text-2xl font-black text-text-main font-mono">{stats?.mis_proyectos_activos ?? 0}</p>
                                        <p className="text-[10px] text-text-dim uppercase font-bold tracking-wider mt-1">Activos</p>
                                    </div>
                                    <div className="p-4 bg-bg-deep border border-border-thin/40 rounded-lg text-center">
                                        <p className="text-2xl font-black text-text-dim font-mono">{stats?.mis_proyectos_borrador ?? 0}</p>
                                        <p className="text-[10px] text-text-dim uppercase font-bold tracking-wider mt-1">Borradores</p>
                                    </div>
                                    <div className="p-4 bg-bg-deep border border-border-thin/40 rounded-lg text-center">
                                        <p className="text-2xl font-black text-text-main font-mono">
                                            {(stats?.mis_proyectos_activos ?? 0) + (stats?.mis_proyectos_borrador ?? 0)}
                                        </p>
                                        <p className="text-[10px] text-text-dim uppercase font-bold tracking-wider mt-1">Total</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/investigacion/mis-proyectos')}
                                    className="btn-vercel-secondary text-xs px-4 py-2"
                                >
                                    Ver mis proyectos
                                </button>
                                <button
                                    onClick={() => navigate('/investigacion')}
                                    className="btn-vercel-primary text-xs px-4 py-2"
                                >
                                    Iniciar Nuevo Proyecto
                                </button>
                            </div>
                        </div>

                        {/* Actividad reciente */}
                        <div className="bento-card p-6 bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-text-dim" />
                                <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Actividad Reciente</span>
                            </div>
                            
                            <div className="space-y-2.5">
                                {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                    <div className="empty-state py-8">
                                        <p className="text-xs text-text-dim italic">
                                            Aún no hay actividad registrada en este periodo.
                                        </p>
                                    </div>
                                ) : (
                                    stats.actividad_reciente.slice(0, 5).map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep border border-border-thin/40 hover:border-border-hover/60 transition-colors cursor-pointer group" onClick={() => navigate('/investigacion/mis-proyectos')}>
                                            <div className={`dot ${ESTADO_DOT[item.estado ?? ''] ?? 'dot-neutral'} w-2 h-2 shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-text-main truncate group-hover:text-brand transition-colors">{item.descripcion}</p>
                                                <p className="text-[9px] text-text-dim uppercase tracking-wide mt-0.5">
                                                    {item.tipo} · {new Date(item.fecha).toLocaleDateString('es-EC')}
                                                </p>
                                            </div>
                                            {item.estado && (
                                                <span className="status-tag text-[9px] text-text-dim border-border-thin bg-surface">
                                                    {item.estado}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar: Right Column */}
                    <div className="space-y-6">
                        <VercelUsageCard 
                            title="Resumen Académico"
                            buttonLabel="Actualizar"
                            onButtonClick={fetch}
                            items={[
                                {
                                    label: 'Proyectos Activos',
                                    value: stats?.mis_proyectos_activos ?? 0,
                                    displayValue: `${stats?.mis_proyectos_activos ?? 0} vigentes`,
                                    max: 10,
                                    color: 'var(--brand)'
                                },
                                {
                                    label: 'En Borrador',
                                    value: stats?.mis_proyectos_borrador ?? 0,
                                    displayValue: `${stats?.mis_proyectos_borrador ?? 0} borrador`,
                                    max: 5,
                                    color: 'var(--text-dim)'
                                },
                                {
                                    label: 'Mis Productos',
                                    value: stats?.mis_productos_registrados ?? 0,
                                    displayValue: `${stats?.mis_productos_registrados ?? 0} validados`,
                                    max: 15,
                                    color: 'var(--success)'
                                },
                                {
                                    label: 'Informes Pendientes',
                                    value: stats?.mis_informes_pendientes ?? 0,
                                    displayValue: `${stats?.mis_informes_pendientes ?? 0} por entregar`,
                                    max: 5,
                                    color: (stats?.mis_informes_pendientes ?? 0) > 0 ? 'var(--warning)' : 'var(--success)'
                                }
                            ]}
                        />

                        {/* Carga Horaria progress card */}
                        {stats?.mis_horas_investigacion !== undefined && (
                            <div className="bento-card p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="section-label">
                                        <ClipboardList size={12} className="text-info" />
                                        <span className="text-[13px] font-semibold text-text-main">Carga Horaria Semanal</span>
                                    </div>
                                    <span className="font-mono text-[13px] font-bold text-info">
                                        {stats.mis_horas_investigacion} hrs
                                    </span>
                                </div>
                                <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-info transition-all duration-700"
                                        style={{ width: `${Math.min(100, (stats.mis_horas_investigacion / 40) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-text-dim mt-2 block font-medium">
                                    Dedicación asignada de un máximo de 40 hrs semanales.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: any) => (
    <div className="bento-card p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-5">
            <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
            {buttonLabel && (
                <button 
                    onClick={onButtonClick} 
                    className="px-3 py-1 bg-black text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-[#eaeaea] rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                >
                    {buttonLabel}
                </button>
            )}
        </div>
        <div className="space-y-1">
            {items.map((item: any, idx: number) => {
                const percentage = item.max ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
                const radius = 6.5;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                return (
                    <div 
                        key={idx} 
                        className="flex items-center justify-between py-2 px-3 rounded-md transition-all group"
                        style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 18 18">
                                    <circle
                                        cx="9"
                                        cy="9"
                                        r={radius}
                                        className="fill-none"
                                        strokeWidth="1.8"
                                        style={{ stroke: 'var(--accents-2)' }}
                                    />
                                    <circle
                                        cx="9"
                                        cy="9"
                                        r={radius}
                                        className="fill-none transition-all duration-500"
                                        stroke={item.color || 'var(--brand)'}
                                        strokeWidth="1.8"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={item.max ? strokeDashoffset : 0}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-medium text-text-main truncate">
                                    {item.label}
                                </span>
                                <svg 
                                    className="w-3 h-3 text-text-dim/40 hover:text-text-main transition-colors shrink-0 cursor-help" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                            {item.displayValue || item.value}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

export default DocenteDashboard;
