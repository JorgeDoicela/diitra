import React, { useState, useEffect } from 'react';
import {
    Users, Activity, BarChart3,
    Megaphone,
    Fingerprint, FileText, Layers, ExternalLink,
    RotateCw, HelpCircle, Folder
} from 'lucide-react';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios_config';
import { ProximosEventosWidget } from '../../../components/Common/ProximosEventosWidget';
import { DashboardSkeleton } from '../Components/DashboardSkeleton';
import { AnimatedNumber } from '../Components/AnimatedNumber';
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
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Admin';
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animate, setAnimate] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async (silent = false) => {
        const startTime = Date.now();
        if (!silent) {
            setIsRefreshing(true);
            setError(null);
        }
        try {
            const res = await api.get('/projects/stats');
            setStats(res.data);
        } catch (e) {
            console.error('[DIITRA] Error al cargar datos:', e);
            if (!silent) {
                setError('No se pudieron obtener las estadísticas de investigación de la base de datos. Por favor, comprueba que el servidor esté activo o intenta de nuevo.');
            }
        } finally {
            if (!silent) {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 600 - elapsed);
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, remaining));
                }
            }
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData(false);

        const interval = setInterval(() => {
            fetchData(true);
        }, 60000);

        const handleFocus = () => {
            fetchData(true);
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setAnimate(true), 100);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
        }
    }, [loading]);

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
                            onClick={() => fetchData(false)}
                            disabled={isRefreshing}
                            className="btn-vercel-secondary !p-2 flex items-center justify-center shrink-0"
                            title="Actualizar datos"
                        >
                            <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => navigate('/investigacion')}
                            className="btn-vercel-secondary flex-1 md:flex-none"
                        >
                            <Folder size={14} />
                            <span>Investigación</span>
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
                <DashboardSkeleton />
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto bg-surface border border-border-thin shadow-md rounded-xl animate-fade-up mt-6">
                    <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mb-4 text-error animate-pulse">
                        <Activity size={22} />
                    </div>
                    <h3 className="text-base font-semibold text-text-main mb-2">Error de Sincronización</h3>
                    <p className="text-xs text-text-dim leading-relaxed max-w-sm mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => fetchData()}
                        className="btn-vercel-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 hover:shadow-md transition-all active:scale-98"
                    >
                        <span>Reintentar Carga</span>
                    </button>
                </div>
            ) : (
                /* Two-column Vercel Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-fade-up [animation-delay:200ms] pb-10">

                    {/* Main Content: Left Column */}
                    <div className="lg:col-span-3 flex flex-col gap-6">

                        {/* Status Grid: proyectos por estado y presupuesto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Proyectos por estado */}
                            <div className="bento-card static flex flex-col justify-between bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-sm font-medium text-text-dim">Proyectos por estado</span>
                                    </div>

                                    <div className="space-y-4">
                                        {stats?.proyectos_por_estado.map((est) => (
                                            <div key={est.estado} className="flex items-center gap-3">
                                                <span className="text-[11px] text-text-dim w-24 shrink-0 font-medium capitalize">
                                                    {est.estado.toLowerCase()}
                                                </span>
                                                <div className="flex-1 h-1 bg-border-thin rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full progress-bar-fill"
                                                        style={{
                                                            width: (animate && stats?.total_proyectos)
                                                                ? `${(est.cantidad / stats.total_proyectos) * 100}%`
                                                                : '0%',
                                                            backgroundColor: est.color
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono font-medium text-text-main w-6 text-right">
                                                    <AnimatedNumber value={est.cantidad} />
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t border-border-thin bg-bg-deep/40 px-6 py-3 flex justify-between items-center text-xs font-medium">
                                    <span className="text-text-dim">Total proyectos</span>
                                    <span className="font-mono font-medium text-text-main">
                                        <AnimatedNumber value={stats?.total_proyectos ?? 0} />
                                    </span>
                                </div>
                            </div>

                            {/* Ejecución presupuestaria global */}
                            <div className="bento-card static flex flex-col justify-between bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-sm font-medium text-text-dim">Ejecución presupuestaria</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-4xl font-semibold tracking-tight text-text-main font-sans">
                                                <AnimatedNumber value={ejecucionPorc} formatter={(v) => `${v.toFixed(1)}%`} />
                                            </span>
                                            <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">ejecutado</span>
                                        </div>

                                        <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-success progress-bar-fill"
                                                style={{ width: animate ? `${ejecucionPorc}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border-thin bg-bg-deep/40 px-6 py-3 grid grid-cols-2 divide-x divide-border-thin/60">
                                    <div className="pr-4">
                                        <span className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Ejecutado</span>
                                        <p className="font-mono text-xs font-medium text-text-main mt-0.5">
                                            <AnimatedNumber value={stats?.presupuesto_total_ejecutado ?? 0} formatter={(v) => `$${Math.round(v).toLocaleString('es-EC')}`} />
                                        </p>
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Asignado</span>
                                        <p className="font-mono text-xs font-medium text-text-main mt-0.5">
                                            <AnimatedNumber value={stats?.presupuesto_total_asignado ?? 0} formatter={(v) => `$${Math.round(v).toLocaleString('es-EC')}`} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Actividad reciente */}
                        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden animate-fade-up">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-border-thin">
                                <Activity size={14} className="text-text-dim" />
                                <span className="text-sm font-medium text-text-dim">Actividad reciente</span>
                            </div>

                            <div className="divide-y divide-border-thin bg-bg-deep/10">
                                {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                    <div className="empty-state m-6 py-8">
                                        <p className="text-xs text-text-dim italic">
                                            No hay actividad reciente registrada en el sistema.
                                        </p>
                                    </div>
                                ) : (
                                    stats.actividad_reciente.slice(0, 8).map((item, i) => {
                                        // 1. Status styling
                                        let statusColor = 'bg-info';
                                        let statusText = item.estado || 'Procesando';
                                        if (item.estado?.toUpperCase() === 'APROBADO') {
                                            statusColor = 'bg-success';
                                            statusText = 'Aprobado';
                                        } else if (item.estado?.toUpperCase() === 'BORRADOR') {
                                            statusColor = 'bg-neutral';
                                            statusText = 'Borrador';
                                        } else if (item.estado?.toUpperCase() === 'EN_REVISION' || item.estado?.toUpperCase() === 'EN REVISIÓN') {
                                            statusColor = 'bg-warning';
                                            statusText = 'En Revisión';
                                        } else if (item.estado?.toUpperCase() === 'RECHAZADO') {
                                            statusColor = 'bg-error';
                                            statusText = 'Rechazado';
                                        } else if (item.estado?.toUpperCase() === 'ENVIADO') {
                                            statusColor = 'bg-brand';
                                            statusText = 'Enviado';
                                        }

                                        // 2. Real UUID from system (shortened)
                                        const shortUuid = item.uuid ? item.uuid.substring(0, 8).toUpperCase() : 'N/A';
                                        const isInforme = item.tipo?.toLowerCase() === 'informe';
                                        const itemUrl = item.uuid && item.tipo?.toLowerCase() === 'proyecto'
                                            ? `/proyectos/${item.uuid}`
                                            : '/investigacion';

                                        return (
                                            <Link
                                                key={i}
                                                to={itemUrl}
                                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-3.5 hover:bg-surface-hover/30 transition-all duration-150 group cursor-pointer"
                                            >
                                                {/* Col 1: Title & Description */}
                                                <div className="flex-1 min-w-0 md:max-w-xs lg:max-w-md xl:max-w-2xl">
                                                    <h4 className="text-xs font-medium text-text-main truncate group-hover:text-brand transition-colors" title={item.descripcion}>
                                                        {item.descripcion}
                                                    </h4>
                                                </div>

                                                {/* Columns Group (for neat alignment on desktop) */}
                                                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-x-8 gap-y-2 text-[11px] text-text-dim font-medium w-full md:w-auto">

                                                    {/* Col 2: Status with Dot */}
                                                    <div className="flex items-center gap-1.5 min-w-[90px]">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                                                        <span className="capitalize text-text-main/80">{statusText}</span>
                                                    </div>

                                                    {/* Col 3: Type Pill */}
                                                    <div className="shrink-0 min-w-[100px]">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${isInforme
                                                            ? 'bg-info/10 text-info border border-info/20'
                                                            : 'bg-brand/10 text-brand border border-brand/20'
                                                            }`}>
                                                            {isInforme ? <FileText size={10} /> : <Layers size={10} />}
                                                            {item.tipo}
                                                        </span>
                                                    </div>

                                                    {/* Col 4: Identificador Único (Real Database UUID) */}
                                                    <div className="hidden sm:flex items-center gap-1.5 min-w-[110px]">
                                                        <Fingerprint size={11} className="opacity-50" />
                                                        <span className="font-mono text-[10px] text-text-main/70 uppercase tracking-tight" title={`UUID: ${item.uuid}`}>{shortUuid}</span>
                                                    </div>

                                                    {/* Col 5: Fecha */}
                                                    <div className="min-w-[75px] text-right ml-auto md:ml-0 flex items-center justify-end gap-1.5">
                                                        <span className="text-[10px] text-text-dim/80 font-mono">
                                                            {item.fecha && !isNaN(new Date(item.fecha).getTime()) ? new Date(item.fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' }) : 'Reciente'}
                                                        </span>
                                                        <ExternalLink size={10} className="text-text-dim opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all duration-150 shrink-0" />
                                                    </div>

                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar: Right Column */}
                    <div className="flex flex-col gap-6">
                        <ProximosEventosWidget style={{ maxHeight: '392px' }} />

                        <VercelUsageCard
                            title="Resumen Institucional"
                            animate={animate}
                            items={[
                                {
                                    label: 'Convocatorias Activas',
                                    value: stats?.total_convocatorias_abiertas ?? 0,
                                    suffix: 'vigentes',
                                    max: 5,
                                    color: 'var(--success)'
                                },
                                {
                                    label: 'Investigadores Activos',
                                    value: stats?.total_investigadores_activos ?? 0,
                                    suffix: 'miembros',
                                    max: 50,
                                    color: 'var(--brand)'
                                },
                                {
                                    label: 'Productos Científicos',
                                    value: stats?.total_productos_periodo ?? 0,
                                    suffix: 'validados',
                                    max: 30,
                                    color: 'var(--info)'
                                },
                                {
                                    label: 'Ejecución Presupuestaria',
                                    value: Math.round(ejecucionPorc),
                                    suffix: '%',
                                    max: 100,
                                    color: 'var(--success)'
                                }
                            ]}
                        />

                        {/* Producción Científica breakdown card */}
                        {stats && (
                            <div className="bento-card static p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                                <div className="flex items-center gap-2 pb-1 border-b border-border-thin/50">
                                    <BarChart3 size={14} className="text-text-dim" />
                                    <span className="text-[13px] font-semibold text-text-main">Producción Científica</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Artículos Indexados</span>
                                        <span className="font-semibold text-text-main font-mono">
                                            <AnimatedNumber value={stats.articulos_indexados ?? 0} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Prototipos e Innovación</span>
                                        <span className="font-semibold text-text-main font-mono">
                                            <AnimatedNumber value={stats.prototipos ?? 0} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-medium">
                                        <span className="text-text-dim">Ponencias y Difusión</span>
                                        <span className="font-semibold text-text-main font-mono">
                                            <AnimatedNumber value={stats.ponencias ?? 0} />
                                        </span>
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

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items, animate, isRefreshing }: any) => (
    <div className="bento-card static p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-5">
            <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
            {buttonLabel && (
                <button
                    onClick={onButtonClick}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-2.5 py-1 border border-border-thin hover:border-text-dim/30 hover:bg-surface-hover text-text-dim hover:text-text-main rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
                >
                    <RotateCw size={10} className={isRefreshing ? "animate-spin" : ""} />
                    <span>{isRefreshing ? "Cargando..." : buttonLabel}</span>
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
                        className="flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:bg-surface-hover/50 group border border-transparent hover:border-border-thin/50"
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
                                        className="fill-none progress-circle-fill"
                                        stroke={item.color || 'var(--brand)'}
                                        strokeWidth="1.8"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={animate ? (item.max ? strokeDashoffset : 0) : circumference}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-medium text-text-main truncate">
                                    {item.label}
                                </span>
                                <HelpCircle
                                    size={12}
                                    className="text-text-dim/40 group-hover:text-text-main transition-colors shrink-0 cursor-help"
                                />
                            </div>
                        </div>
                        <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                            <AnimatedNumber
                                value={item.value}
                                formatter={(v) => item.suffix ? `${Math.round(v)}${item.suffix === '%' ? '%' : ' ' + item.suffix}` : Math.round(v).toString()}
                            />
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);
