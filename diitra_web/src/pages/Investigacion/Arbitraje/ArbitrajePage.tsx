import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gavel, Users, CheckCircle2,
    Scale, ChevronRight, RefreshCw, PlusCircle, Clock,
    TrendingUp, FileSearch, Loader2
} from 'lucide-react';
import {
    getArbitrajesActivos, getArbitrajeStats,
    ESTADO_ARBITRAJE_CONFIG
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, ArbitrajeStatsDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal';

const ArbitrajePage: React.FC = () => {
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState<ArbitrajeProyectoDto[]>([]);
    const [stats, setStats] = useState<ArbitrajeStatsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [proyectoParaAsignar, setProyectoParaAsignar] = useState<ArbitrajeProyectoDto | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [proy, st] = await Promise.all([getArbitrajesActivos(), getArbitrajeStats()]);
            setProyectos(proy);
            setStats(st);
        } catch (err) {
            console.error('[DIITRA] Error cargando datos de arbitraje:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const proyectosFiltrados = proyectos.filter(p =>
        filtroEstado === 'todos' || p.estado_arbitraje === filtroEstado
    );

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <header className="mb-10 animate-fade-up">
                <div className="section-label mb-2">
                    <Gavel size={12} className="text-text-main" />
                    <span>Módulo de Arbitraje · DIITRA</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none mb-3">
                            Gestión de Arbitraje
                        </h2>
                        <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                            Panel de control del proceso de evaluación por pares bajo la normativa CACES.
                            Asigne árbitros, supervise el avance y emita dictámenes formales.
                        </p>
                    </div>
                    <button
                        onClick={loadData}
                        className="btn-vercel-secondary flex items-center gap-2 shrink-0"
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10 animate-fade-up [animation-delay:50ms]">
                    <KpiCard
                        icon={<FileSearch size={18} />}
                        label="En Revisión"
                        value={stats.proyectos_en_revision}
                        color="var(--color-text-main)"
                    />
                    <KpiCard
                        icon={<Users size={18} />}
                        label="Árbitros Asignados"
                        value={stats.total_arbitros_asignados}
                        color="#3b82f6"
                    />
                    <KpiCard
                        icon={<CheckCircle2 size={18} />}
                        label="Evaluaciones Completadas"
                        value={stats.evaluaciones_completadas}
                        color="#22c55e"
                    />
                    <KpiCard
                        icon={<Clock size={18} />}
                        label="Pendientes"
                        value={stats.evaluaciones_pendientes}
                        color="#f0a500"
                    />
                    <KpiCard
                        icon={<Scale size={18} />}
                        label="Desempates"
                        value={stats.casos_desempate}
                        color="#ef4444"
                        alert={stats.casos_desempate > 0}
                    />
                </div>
            )}

            {/* Barra de progreso global */}
            {stats && stats.total_arbitros_asignados > 0 && (
                <div className="bento-card p-5 mb-8 animate-fade-up [animation-delay:100ms]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="section-label">
                            <TrendingUp size={12} />
                            <span>Avance Global del Arbitraje</span>
                        </div>
                        <span className="stat-number stat-number--sm text-text-main">
                            {stats.porcentaje_avance}%
                        </span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5">
                        <div
                            className="h-1.5 rounded-full bg-text-main transition-all duration-700"
                            style={{ width: `${stats.porcentaje_avance}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex gap-2 mb-6 animate-fade-up [animation-delay:150ms]">
                {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'SinArbitros', label: 'Sin Árbitros' },
                    { key: 'Pendiente', label: 'Pendiente' },
                    { key: 'EnProceso', label: 'En Proceso' },
                    { key: 'Completado', label: 'Completado' },
                    { key: 'Desempate', label: 'Desempate' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFiltroEstado(f.key)}
                        className={`status-tag transition-all ${filtroEstado === f.key
                            ? 'bg-surface text-text-main border-border-thin'
                            : 'text-text-dim border-transparent hover:border-border-thin hover:text-text-main'
                        }`}
                    >
                        {f.key === 'Desempate' && stats && stats.casos_desempate > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-error inline-block mr-1.5" />
                        )}
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Tabla de Proyectos */}
            <div className="bento-card overflow-hidden animate-fade-up [animation-delay:200ms]">
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-text-dim">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando arbitrajes...</span>
                    </div>
                ) : proyectosFiltrados.length === 0 ? (
                    <div className="empty-state py-16">
                        <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                            <Gavel size={28} />
                        </div>
                        <p className="text-text-dim font-bold uppercase tracking-widest text-sm">
                            No hay proyectos en esta categoría
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border-thin">
                                    <th className="text-left px-5 py-3.5 text-text-dim font-bold uppercase tracking-widest">Proyecto</th>
                                    <th className="text-center px-4 py-3.5 text-text-dim font-bold uppercase tracking-widest hidden md:table-cell">Convocatoria</th>
                                    <th className="text-center px-4 py-3.5 text-text-dim font-bold uppercase tracking-widest">Árbitros</th>
                                    <th className="text-center px-4 py-3.5 text-text-dim font-bold uppercase tracking-widest hidden lg:table-cell">Puntaje</th>
                                    <th className="text-center px-4 py-3.5 text-text-dim font-bold uppercase tracking-widest">Estado</th>
                                    <th className="px-4 py-3.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {proyectosFiltrados.map((p) => {
                                    const estadoCfg = ESTADO_ARBITRAJE_CONFIG[p.estado_arbitraje] ?? ESTADO_ARBITRAJE_CONFIG['Pendiente'];
                                    const progreso = p.total_arbitros > 0
                                        ? Math.round(p.arbitros_completados / p.total_arbitros * 100)
                                        : 0;

                                    return (
                                        <tr
                                            key={p.proyecto_uuid}
                                            className="border-b border-border-thin/50 hover:bg-surface/30 transition-colors group cursor-pointer"
                                            onClick={() => navigate(`/arbitraje/proyecto/${p.proyecto_uuid}`)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="icon-circle-brand !p-2 shrink-0">
                                                        <Gavel size={14} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-text-main leading-tight group-hover:underline line-clamp-1">
                                                            {p.proyecto_titulo}
                                                        </p>
                                                        {p.codigo_institucional && (
                                                            <span className="status-tag text-text-dim mt-1">
                                                                {p.codigo_institucional}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center hidden md:table-cell">
                                                <span className="text-text-dim">{p.convocatoria ?? '—'}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="font-bold text-text-main">
                                                        {p.arbitros_completados}/{p.total_arbitros}
                                                    </span>
                                                    {p.total_arbitros > 0 && (
                                                        <div className="w-16 bg-surface rounded-full h-1">
                                                            <div
                                                                className="h-1 rounded-full bg-text-main"
                                                                style={{ width: `${progreso}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center hidden lg:table-cell">
                                                {p.puntaje_promedio != null ? (
                                                    <span className={`font-bold text-base ${p.puntaje_promedio >= 70 ? 'text-success' : 'text-error'}`}>
                                                        {p.puntaje_promedio.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-dim">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className={`badge-vercel ${estadoCfg.badge} inline-flex`}>
                                                    <span className={`dot ${estadoCfg.dot}`} />
                                                    {estadoCfg.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProyectoParaAsignar(p);
                                                        }}
                                                        className="btn-vercel-secondary !py-1 !px-2.5 !text-[10px] flex items-center gap-1"
                                                        title="Asignar árbitro"
                                                    >
                                                        <PlusCircle size={11} />
                                                        Árbitro
                                                    </button>
                                                    <ChevronRight size={14} className="text-text-dim group-hover:text-text-main transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Asignación */}
            {proyectoParaAsignar && (
                <AsignarArbitroModal
                    proyecto={proyectoParaAsignar}
                    onClose={() => setProyectoParaAsignar(null)}
                    onSuccess={() => {
                        setProyectoParaAsignar(null);
                        loadData();
                    }}
                />
            )}
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  Sub-componente: KPI Card
// ─────────────────────────────────────────────────────────────
interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    alert?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, color, alert }) => (
    <div className={`bento-card p-5 relative overflow-hidden ${alert ? 'border-error/40' : ''}`}>
        <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-md bg-surface" style={{ color }}>
                {icon}
            </div>
            {alert && <span className="w-2 h-2 rounded-full bg-error animate-pulse" />}
        </div>
        <p className="stat-number stat-number--sm text-text-main" style={{ color }}>{value}</p>
        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1 leading-tight">{label}</p>
    </div>
);

export default ArbitrajePage;
