import React, { useState, useEffect, useRef } from 'react';
import {
    TrendingUp, Briefcase, ClipboardList,
    Fingerprint, FileText, Layers, ExternalLink,
    Activity, FileEdit, RotateCw, Inbox, HelpCircle, ArrowRight, AlertTriangle
} from 'lucide-react';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios_config';
import { ProximosEventosWidget } from '../../../components/Common/ProximosEventosWidget';
import { DashboardSkeleton } from '../Components/DashboardSkeleton';
import { AnimatedNumber } from '../Components/AnimatedNumber';
interface DashboardStats {
    mis_proyectos_activos: number;
    mis_proyectos_borrador: number;
    mis_proyectos_en_revision: number;
    mis_productos_registrados: number;
    mis_informes_pendientes: number;
    mis_horas_investigacion: number;
    horas_disponibles_distributivo?: number;
    actividad_reciente: Array<{
        tipo: string;
        descripcion: string;
        fecha: string;
        uuid?: string;
        estado?: string;
    }>;
}



export const DocenteDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Investigador';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [animate, setAnimate] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const lastFetchRef = useRef<number>(0);

    const fetchStats = async (silent = false) => {
        const startTime = Date.now();
        if (!silent) {
            setIsRefreshing(true);
        }
        try {
            const res = await api.get('/projects/stats');
            setStats(res.data);
            lastFetchRef.current = Date.now();
        } catch (e) {
            console.error('[DIITRA] Error al cargar stats:', e);
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
        fetchStats(false);

        const interval = setInterval(() => {
            if (Date.now() - lastFetchRef.current > 30000) {
                fetchStats(true);
            }
        }, 60000);

        const handleFocus = () => {
            if (Date.now() - lastFetchRef.current > 30000) {
                fetchStats(true);
            }
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



    return (
        <>
            <DashboardHeader
                title={`Bienvenido, ${firstName}`}
                subtitle="Gestiona tus proyectos, carga horaria y productos científicos en un solo lugar."
                roleName="Docente Investigador"
                actions={
                    <>
                        <button
                            onClick={() => fetchStats(false)}
                            disabled={isRefreshing}
                            className="btn-vercel-secondary !p-2 flex items-center justify-center shrink-0"
                            title="Actualizar datos"
                        >
                            <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => navigate('/investigacion/mis-proyectos')}
                            className="btn-vercel-secondary flex-1 md:flex-none"
                        >
                            <ClipboardList size={14} />
                            <span>Mis Proyectos</span>
                        </button>
                    </>
                }
            />

            {loading ? (
                <DashboardSkeleton />
            ) : (
                /* Two-column Vercel Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-fade-up [animation-delay:200ms] pb-10">

                    {/* Main Content: Left Column */}
                    <div className="lg:col-span-3 flex flex-col gap-6">

                        {/* Gestión de Proyectos */}
                        <div className="bento-card static p-6 flex flex-col justify-between bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase size={14} className="text-text-dim" />
                                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Mis Proyectos de Investigación</span>
                                </div>
                                <h3 className="text-xl font-semibold tracking-tight text-text-main mb-2">
                                    Resumen de Propuestas Académicas
                                </h3>
                                <p className="text-xs text-text-dim font-medium leading-relaxed mb-6">
                                    Administra tus propuestas, realiza el seguimiento del ciclo de vida (Borrador, En Revisión, En Ejecución, Finalizado) y justifica egresos financieros bajo normativas vigentes.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Card Activos */}
                                    <div className="flex flex-col justify-between p-5 bg-surface border border-border-thin rounded-lg">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[13px] text-text-dim font-medium">Activos</span>
                                            <Activity size={16} className="text-text-dim/50" />
                                        </div>
                                        <p className="text-3xl font-semibold text-text-main tracking-tight mt-3">
                                            <AnimatedNumber value={stats?.mis_proyectos_activos ?? 0} />
                                        </p>
                                    </div>

                                    {/* Card Borradores */}
                                    <div className="flex flex-col justify-between p-5 bg-surface border border-border-thin rounded-lg">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[13px] text-text-dim font-medium">Borradores</span>
                                            <FileEdit size={16} className="text-text-dim/50" />
                                        </div>
                                        <p className="text-3xl font-semibold text-text-main tracking-tight mt-3">
                                            <AnimatedNumber value={stats?.mis_proyectos_borrador ?? 0} />
                                        </p>
                                    </div>

                                    {/* Card Total */}
                                    <div className="flex flex-col justify-between p-5 bg-surface border border-border-thin rounded-lg">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[13px] text-text-dim font-medium">Total</span>
                                            <Briefcase size={16} className="text-text-dim/50" />
                                        </div>
                                        <p className="text-3xl font-semibold text-text-main tracking-tight mt-3">
                                            <AnimatedNumber value={(stats?.mis_proyectos_activos ?? 0) + (stats?.mis_proyectos_borrador ?? 0) + (stats?.mis_proyectos_en_revision ?? 0)} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-border-thin/50 pt-4 mt-2">
                                <button
                                    onClick={() => navigate('/investigacion/mis-proyectos')}
                                    className="text-xs font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1.5 transition-all group"
                                >
                                    <span>Ver todos los proyectos</span>
                                    <ArrowRight size={14} className="transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Actividad reciente */}
                        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden animate-fade-up">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-border-thin">
                                <TrendingUp size={14} className="text-text-dim" />
                                <span className="text-sm font-medium text-text-dim">Actividad reciente</span>
                            </div>

                            <div className="divide-y divide-border-thin bg-bg-deep/10">
                                {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                        <div className="w-12 h-12 rounded-full bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim/50 mb-3 shadow-inner">
                                            <Inbox size={20} />
                                        </div>
                                        <h4 className="text-xs font-semibold text-text-main mb-1">Sin actividad reciente</h4>
                                        <p className="text-[11px] text-text-dim max-w-[280px] leading-relaxed">
                                            Aquí aparecerán las actualizaciones y notificaciones sobre el avance de tus proyectos de investigación.
                                        </p>
                                    </div>
                                ) : (
                                    stats.actividad_reciente.slice(0, 5).map((item, i) => {
                                        // 1. Status styling
                                        let statusColor = 'bg-info';
                                        let statusText = item.estado || 'Procesando';
                                        const upperEstado = item.estado?.toUpperCase();
                                        if (upperEstado === 'APROBADO' || upperEstado === 'FINALIZADO') {
                                            statusColor = 'bg-success';
                                            statusText = item.estado || 'Aprobado';
                                        } else if (upperEstado === 'BORRADOR') {
                                            statusColor = 'bg-neutral';
                                            statusText = 'Borrador';
                                        } else if (upperEstado === 'EN_REVISION' || upperEstado === 'EN REVISIÓN' || upperEstado === 'PENDIENTE') {
                                            statusColor = 'bg-warning';
                                            statusText = item.estado || 'En Revisión';
                                        } else if (upperEstado === 'RECHAZADO' || upperEstado === 'ANULADO') {
                                            statusColor = 'bg-error';
                                            statusText = item.estado || 'Rechazado';
                                        } else if (upperEstado === 'ENVIADO' || upperEstado === 'EN EJECUCIÓN' || upperEstado === 'EN_EJECUCION') {
                                            statusColor = 'bg-brand';
                                            statusText = item.estado || 'Enviado';
                                        }

                                        // 2. Real UUID from system (shortened)
                                        const shortUuid = item.uuid ? item.uuid.substring(0, 8).toUpperCase() : 'SELLO PEND.';
                                        const isInforme = item.tipo?.toLowerCase().includes('informe');
                                        const itemUrl = item.uuid && item.tipo?.toLowerCase().includes('proyecto')
                                            ? `/proyectos/${item.uuid}`
                                            : '/investigacion/mis-proyectos';

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

                                                {/* Columns Group */}
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

                                                    {/* Col 4: Identificador Único */}
                                                    <div className="hidden sm:flex items-center gap-1.5 min-w-[110px]">
                                                        <Fingerprint size={11} className="opacity-50" />
                                                        <span className="font-mono text-[10px] text-text-main/70 uppercase tracking-tight" title={item.uuid ? `UUID: ${item.uuid}` : 'Sello Pendiente'}>{shortUuid}</span>
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
                        <ProximosEventosWidget />

                        <VercelUsageCard
                            title="Resumen del Periodo"
                            animate={animate}
                            items={[
                                {
                                    label: 'Mis Proyectos Activos',
                                    value: stats?.mis_proyectos_activos ?? 0,
                                    suffix: 'proyectos',
                                    max: 5,
                                    color: 'var(--success)'
                                },
                                {
                                    label: 'Productos Registrados',
                                    value: stats?.mis_productos_registrados ?? 0,
                                    suffix: 'validados',
                                    max: 10,
                                    color: 'var(--brand)'
                                },
                                {
                                    label: 'Horas de Investigación',
                                    value: stats?.mis_horas_investigacion ?? 0,
                                    suffix: 'hrs / sem',
                                    max: stats?.horas_disponibles_distributivo || 20,
                                    color: 'var(--info)'
                                },
                                {
                                    label: 'Informes Pendientes',
                                    value: stats?.mis_informes_pendientes ?? 0,
                                    suffix: 'por entregar',
                                    max: 5,
                                    color: (stats?.mis_informes_pendientes ?? 0) > 0 ? 'var(--warning)' : 'var(--success)'
                                }
                            ]}
                        />

                        {/* Carga Horaria progress card */}
                        {stats?.mis_horas_investigacion !== undefined && (() => {
                            const maxHours = stats.horas_disponibles_distributivo ?? 0;
                            const hasDistributivo = maxHours > 0;
                            const percentage = hasDistributivo ? Math.min(100, (stats.mis_horas_investigacion / maxHours) * 100) : 0;
                            return (
                                <div className="bento-card static p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <ClipboardList size={14} className="text-info" />
                                            <span className="text-[13px] font-semibold text-text-main">Carga Horaria Semanal</span>
                                        </div>
                                        <span className="font-mono text-[13px] font-semibold text-info">
                                            <AnimatedNumber value={stats.mis_horas_investigacion} /> / {maxHours} hrs
                                        </span>
                                    </div>
                                    {hasDistributivo ? (
                                        <>
                                            <div className="w-full bg-bg-deep border border-border-thin/30 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full progress-bar-fill transition-all duration-1000 ease-out"
                                                    style={{
                                                        width: animate ? `${percentage}%` : '0%',
                                                        background: 'linear-gradient(90deg, var(--info) 0%, var(--brand) 100%)'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-text-dim mt-2 block font-medium leading-relaxed">
                                                Dedicación de investigación ({stats.mis_horas_investigacion}h) asignada de un máximo de {maxHours}h semanales según tu distributivo.
                                            </span>
                                        </>
                                    ) : (
                                        <div className="mt-2 text-[10px] text-error bg-error-subtle/10 border border-error/20 rounded-lg p-2.5 font-medium leading-relaxed flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                            <span>No tienes registradas horas de investigación en tu distributivo académico para el período actual.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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

export default DocenteDashboard;
