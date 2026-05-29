import React, { useState, useEffect } from 'react';
import {
    Users, Activity, BarChart3,
    ClipboardList, Loader2, Megaphone, TrendingUp
} from 'lucide-react';
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects/stats');
            setStats(res.data);
        } catch (e) {
            console.error('[DIITRA] Error al cargar datos:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
                            onClick={() => navigate('/usuarios')}
                            className="btn-vercel-secondary flex-1 md:flex-none"
                        >
                            <Users size={14} />
                            <span>Gestionar Usuarios</span>
                        </button>
                        <button
                            onClick={() => navigate('/convocatorias')}
                            className="btn-vercel-primary flex-1 md:flex-none"
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
                /* Two-column Vercel Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:200ms] pb-10">
                    
                    {/* Main Content: Left Column */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Embudo de proyectos */}
                        <div className="bento-card p-6 bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <ClipboardList size={14} className="text-text-dim" />
                                <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Proyectos Institucionales</span>
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-text-main mb-2">
                                Estado del Pipeline de Investigación
                            </h3>
                            <p className="text-xs text-text-dim max-w-xl font-medium leading-relaxed mb-6">
                                Resumen del flujo de proyectos en el ciclo de vida institucional para garantizar el cumplimiento normativo.
                            </p>
                            
                            <div className="space-y-3">
                                {stats?.proyectos_por_estado.map((est) => (
                                    <div key={est.estado} className="flex items-center gap-3">
                                        <span className="text-[10px] text-text-dim uppercase tracking-wide w-24 shrink-0 font-bold">
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
                                        <span className="text-xs font-mono font-bold text-text-main w-6 text-right">
                                            {est.cantidad}
                                        </span>
                                    </div>
                                ))}
                                <div className="divider-vercel my-4" />
                                <div className="flex justify-between text-[11px] font-mono font-bold">
                                    <span className="text-text-dim">Total Proyectos</span>
                                    <span className="text-text-main">{stats?.total_proyectos ?? 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Ejecución presupuestaria global */}
                        <div className="bento-card p-6 bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={14} className="text-text-dim" />
                                <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Ejecución Presupuestaria</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-3xl font-black text-text-main leading-none">
                                        {ejecucionPorc.toFixed(1)}%
                                    </p>
                                    <p className="text-[11px] text-text-dim mt-1.5 font-medium">
                                        De los fondos totales asignados a investigación para este periodo fiscal
                                    </p>
                                </div>
                                <div className="text-left sm:text-right text-xs font-mono text-text-dim shrink-0 bg-bg-deep px-3 py-2 rounded-lg border border-border-thin/40">
                                    <p className="font-bold text-text-main">Ejecutado: ${(stats?.presupuesto_total_ejecutado ?? 0).toLocaleString('es-EC')}</p>
                                    <p className="text-text-dim opacity-70 mt-0.5">Asignado: ${(stats?.presupuesto_total_asignado ?? 0).toLocaleString('es-EC')}</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-border-thin rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-success transition-all duration-700"
                                    style={{ width: `${ejecucionPorc}%` }}
                                />
                            </div>
                        </div>

                        {/* Actividad reciente */}
                        <div className="bento-card p-6 bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-text-dim" />
                                <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Actividad Institucional Reciente</span>
                            </div>
                            
                            <div className="space-y-2.5">
                                {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                    <div className="empty-state py-8">
                                        <p className="text-xs text-text-dim italic">
                                            No hay actividad reciente registrada en el sistema.
                                        </p>
                                    </div>
                                ) : (
                                    stats.actividad_reciente.slice(0, 6).map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep border border-border-thin/40 hover:border-border-hover/60 transition-colors">
                                            <div className={`dot ${
                                                item.tipo === 'informe' ? 'dot-brand' : 'dot-info'
                                            } w-2 h-2 shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-text-main truncate">{item.descripcion}</p>
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
                            title="Resumen Institucional"
                            buttonLabel="Actualizar"
                            onButtonClick={fetchData}
                            items={[
                                {
                                    label: 'Convocatorias Activas',
                                    value: stats?.total_convocatorias_abiertas ?? 0,
                                    displayValue: `${stats?.total_convocatorias_abiertas ?? 0} vigentes`,
                                    max: 5,
                                    color: 'var(--success)'
                                },
                                {
                                    label: 'Investigadores Activos',
                                    value: stats?.total_investigadores_activos ?? 0,
                                    displayValue: `${stats?.total_investigadores_activos ?? 0} miembros`,
                                    max: 50,
                                    color: 'var(--brand)'
                                },
                                {
                                    label: 'Productos Científicos',
                                    value: stats?.total_productos_periodo ?? 0,
                                    displayValue: `${stats?.total_productos_periodo ?? 0} validados`,
                                    max: 30,
                                    color: 'var(--info)'
                                },
                                {
                                    label: 'Ejecución Presupuestaria',
                                    value: Math.round(ejecucionPorc),
                                    displayValue: `${Math.round(ejecucionPorc)}%`,
                                    max: 100,
                                    color: 'var(--success)'
                                }
                            ]}
                        />

                        {/* Producción Científica breakdown card */}
                        {stats && (
                            <div className="bento-card p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                                <div className="flex items-center gap-2 pb-1 border-b border-border-thin/50">
                                    <BarChart3 size={14} className="text-text-dim" />
                                    <span className="text-[13px] font-semibold text-text-main">Producción Científica</span>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Artículos Indexados</span>
                                        <span className="font-bold text-text-main font-mono">{stats.articulos_indexados ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Prototipos e Innovación</span>
                                        <span className="font-bold text-text-main font-mono">{stats.prototipos ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Ponencias y Difusión</span>
                                        <span className="font-bold text-text-main font-mono">{stats.ponencias ?? 0}</span>
                                    </div>
                                </div>
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
