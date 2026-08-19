import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/Common/PageHeader';
import {
    Loader2, Users,
    AlertTriangle, UserPlus, Building,
    X, FileDown, Check,
    PlusCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import {
    getArbitrajesActivos, getArbitrajeStats,
    ESTADO_ARBITRAJE_CONFIG,
    downloadDictamenPdf, registerRevisorExterno,
    type RegistrarRevisorExternoPayload
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, ArbitrajeStatsDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal.tsx';
import { useNotifications } from '../../../api/NotificationsContext';

// ─────────────────────────────────────────────────────────────
//  CACES Alert
// ─────────────────────────────────────────────────────────────
interface CacesAlert {
    id: string;
    tipo: 'critico' | 'advertencia';
    titulo: string;
    descripcion: string;
    proyectoUuid?: string;
}

function generarAlertas(proyectos: ArbitrajeProyectoDto[]): CacesAlert[] {
    const alerts: CacesAlert[] = [];
    proyectos.forEach(p => {
        const tieneExterno = p.revisiones.some(r => r.es_externo);
        if (p.total_arbitros > 0 && !tieneExterno) {
            alerts.push({ id: `ext-${p.proyecto_uuid}`, tipo: 'advertencia', titulo: 'Sin evaluador externo', descripcion: `"${p.proyecto_titulo}" requiere al menos un revisor externo (CACES I5).`, proyectoUuid: p.proyecto_uuid });
        }
        if (p.estado_arbitraje === 'Desempate') {
            alerts.push({ id: `des-${p.proyecto_uuid}`, tipo: 'critico', titulo: 'Desempate pendiente', descripcion: `"${p.proyecto_titulo}" tiene dictámenes divididos. Se requiere un tercer evaluador.`, proyectoUuid: p.proyecto_uuid });
        }
        if (p.total_arbitros < 2 && p.estado_arbitraje !== 'Completado') {
            alerts.push({ id: `min-${p.proyecto_uuid}`, tipo: 'advertencia', titulo: 'Panel incompleto', descripcion: `"${p.proyecto_titulo}" tiene menos de 2 evaluadores asignados (mínimo CACES).`, proyectoUuid: p.proyecto_uuid });
        }
    });
    return alerts;
}

import ModalRevisorExterno from './ModalRevisorExterno';

// ─────────────────────────────────────────────────────────────
//  Barra de progreso inline (mini)
// ─────────────────────────────────────────────────────────────
const MiniProgress: React.FC<{ completados: number; total: number }> = ({ completados, total }) => {
    if (total === 0) return <span className="text-text-dim/50">—</span>;
    const pct = Math.round((completados / total) * 100);
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1 bg-border-thin rounded-full overflow-hidden">
                <div className="h-full bg-text-main/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-text-dim shrink-0">{completados}/{total}</span>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  FILTROS (tabs Vercel)
// ─────────────────────────────────────────────────────────────
const FILTROS = [
    { key: 'todos',       label: 'Todos' },
    { key: 'SinArbitros', label: 'Sin evaluadores' },
    { key: 'Pendiente',   label: 'Pendiente' },
    { key: 'EnProceso',   label: 'En proceso' },
    { key: 'Completado',  label: 'Completado' },
    { key: 'Desempate',   label: 'Desempate' },
];

// ─────────────────────────────────────────────────────────────
//  ArbitrajePage
// ─────────────────────────────────────────────────────────────
const ArbitrajePage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useNotifications();

    const [proyectos, setProyectos] = useState<ArbitrajeProyectoDto[]>([]);
    const [stats, setStats]         = useState<ArbitrajeStatsDto | null>(null);
    const [loading, setLoading]     = useState(true);
    const [filtro, setFiltro]       = useState('todos');
    const [showExterno, setShowExterno]  = useState(false);
    const [asignarA, setAsignarA]        = useState<ArbitrajeProyectoDto | null>(null);
    const [descargando, setDescargando]  = useState<string | null>(null);
    const [alertas, setAlertas]          = useState<CacesAlert[]>([]);
    const [dismissed, setDismissed]      = useState<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [proy, st] = await Promise.all([getArbitrajesActivos(), getArbitrajeStats()]);
            setProyectos(proy);
            setStats(st);
            setAlertas(generarAlertas(proy));
        } catch (e) {
            console.error('[DIITRA] Error cargando datos de arbitraje:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filtrados = proyectos.filter(p => filtro === 'todos' || p.estado_arbitraje === filtro);
    const alertasVisibles = alertas.filter(a => !dismissed.has(a.id));

    const handlePdf = async (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        setDescargando(uuid);
        try {
            const blob = await downloadDictamenPdf(uuid);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DIITRA_DICTAMEN_${uuid.slice(0, 8).toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            addToast('Error de Descarga', err?.response?.data?.message ?? 'No se pudo descargar el Acta.', 'error');
        } finally {
            setDescargando(null);
        }
    };

    // KPIs
    const evaluados = proyectos.filter(p => ['Aprobado', 'En Ejecución', 'Rechazado'].includes(p.estado_proyecto));
    const tasaAprobacion = evaluados.length > 0
        ? Math.round(evaluados.filter(p => ['Aprobado', 'En Ejecución'].includes(p.estado_proyecto)).length / evaluados.length * 100)
        : 0;

    const completadas = proyectos.flatMap(p => p.revisiones).filter(r => r.estado === 'Completada' && r.fecha_completado);
    let tiempoPromText = '—';
    if (completadas.length > 0) {
        const ms = completadas.reduce((s, r) => s + Math.max(0, new Date(r.fecha_completado!).getTime() - new Date(r.fecha_asignacion).getTime()), 0);
        tiempoPromText = `${(ms / completadas.length / 86400000).toFixed(1)} d`;
    }

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">

            <PageHeader
                title="Evaluación por Pares"
                description="Supervisión y control del arbitraje a doble ciego de proyectos de investigación (CACES)."
            >
                <button
                    onClick={() => setShowExterno(true)}
                    className="btn-vercel-secondary flex items-center gap-2 shrink-0"
                >
                    <UserPlus size={14} />
                    <span>Nuevo Evaluador Externo</span>
                </button>
            </PageHeader>

            {/* ── TWO-COLUMN LAYOUT ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:100ms] relative z-10">

                {/* ── Columna principal: tabla ─────────────────── */}
                <div className="lg:col-span-3 space-y-0">

                    {/* Tabs filtro con conteos precisos */}
                    <div className="tabs-vercel">
                        {FILTROS.map(f => {
                            const count = f.key === 'todos'
                                ? proyectos.length
                                : proyectos.filter(p => p.estado_arbitraje === f.key).length;
                            return (
                                <button
                                    key={f.key}
                                    className={`tab-vercel-item flex items-center gap-1.5 ${filtro === f.key ? 'active' : ''}`}
                                    onClick={() => setFiltro(f.key)}
                                >
                                    {f.label}
                                    {count > 0 && !loading && (
                                        <span className="text-[10px] font-mono bg-surface border border-border-thin rounded-full px-1.5 py-px text-text-dim ml-0.5">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabla de Proyectos */}
                    <div className="bento-card static overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim">
                                <Loader2 size={24} className="animate-spin text-brand" />
                                <span className="text-xs font-bold uppercase tracking-widest">Cargando proyectos...</span>
                            </div>
                        ) : filtrados.length === 0 ? (
                            <div className="empty-state py-20">
                                <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                                    <Users size={24} strokeWidth={1.5} />
                                </div>
                                <p className="text-text-main font-bold uppercase tracking-widest text-sm">Sin proyectos en esta categoría</p>
                                <p className="text-text-dim text-xs mt-2 max-w-sm">Cambia el filtro o asigna evaluadores a los proyectos.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-hidden">
                                <table className="w-full sm:table-fixed">
                                    <thead>
                                        <tr className="border-b border-border-thin">
                                            <th className="text-left px-5 py-3.5 sm:w-[38%]"><span className="section-label !tracking-[0.12em]">Proyecto</span></th>
                                            <th className="text-left px-4 py-3.5 hidden md:table-cell md:w-[20%]"><span className="section-label !tracking-[0.12em]">Convocatoria</span></th>
                                            <th className="text-center px-4 py-3.5 hidden sm:table-cell sm:w-[12%]"><span className="section-label justify-center !tracking-[0.12em]">Progreso</span></th>
                                            <th className="text-center px-4 py-3.5 hidden lg:table-cell lg:w-[8%]"><span className="section-label justify-center !tracking-[0.12em]">Puntaje</span></th>
                                            <th className="text-left px-4 py-3.5 hidden sm:table-cell sm:w-[12%]"><span className="section-label !tracking-[0.12em]">Estado</span></th>
                                            <th className="px-4 py-3.5 sm:w-[10%] w-[80px]" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.map(p => {
                                            const cfg = ESTADO_ARBITRAJE_CONFIG[p.estado_arbitraje] ?? ESTADO_ARBITRAJE_CONFIG['Pendiente'];
                                            const tieneExterno = p.revisiones.some(r => r.es_externo);
                                            return (
                                                <tr
                                                    key={p.proyecto_uuid}
                                                    className="group border-b border-border-thin/50 last:border-0 hover:bg-surface/40 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/evaluacion-pares/proyecto/${p.proyecto_uuid}`)}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="min-w-0 pr-2">
                                                            <p className="text-sm font-semibold text-text-main leading-snug group-hover:text-brand transition-colors line-clamp-2">
                                                                {p.proyecto_titulo}
                                                            </p>
                                                            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                                                                {p.codigo_institucional && (
                                                                    <span className="text-[10px] font-mono text-text-dim bg-surface border border-border-thin rounded px-1.5 py-0.5">
                                                                        {p.codigo_institucional}
                                                                    </span>
                                                                )}
                                                                {!tieneExterno && p.total_arbitros > 0 && (
                                                                    <span className="badge-vercel badge-vercel-warning text-[10px] !py-0.5 !px-1.5 font-medium">
                                                                        <AlertTriangle size={9} className="mr-0.5" />
                                                                        Requiere Externo
                                                                    </span>
                                                                )}
                                                                {tieneExterno && (
                                                                    <span className="badge-vercel badge-vercel-violet text-[10px] !py-0.5 !px-1.5 font-medium">
                                                                        <Building size={9} className="mr-0.5" />
                                                                        Par Externo
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Detalle apilado para móviles */}
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:hidden text-[9px] font-medium">
                                                                {p.convocatoria && (
                                                                    <span className="text-text-dim">
                                                                        {p.convocatoria}
                                                                    </span>
                                                                )}
                                                                {p.total_arbitros > 0 && (
                                                                    <span className="text-text-dim font-mono">
                                                                        Progreso: {p.arbitros_completados}/{p.total_arbitros}
                                                                    </span>
                                                                )}
                                                                {p.puntaje_promedio != null && (
                                                                    <span className={`font-mono ${p.puntaje_promedio >= 70 ? 'text-success' : 'text-error'}`}>
                                                                        {p.puntaje_promedio.toFixed(1)} pts
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-main">
                                                                    <span className={`dot ${cfg.dot} !w-1 !h-1`} />
                                                                    <span>{cfg.label}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 hidden md:table-cell">
                                                        <span className="text-xs text-text-dim truncate block max-w-[200px]" title={p.convocatoria ?? ''}>
                                                            {p.convocatoria ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 hidden sm:table-cell">
                                                        <MiniProgress completados={p.arbitros_completados} total={p.total_arbitros} />
                                                    </td>
                                                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                                                        {p.puntaje_promedio != null ? (
                                                            <span className={`text-sm font-semibold font-mono ${p.puntaje_promedio >= 70 ? 'text-success' : 'text-error'}`}>
                                                                {p.puntaje_promedio.toFixed(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-dim/50 text-sm">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 hidden sm:table-cell">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-text-main">
                                                            <span className={`dot ${cfg.dot}`} />
                                                            <span>{cfg.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-[11px] text-text-dim group-hover:text-text-main font-medium transition-colors hidden sm:inline">
                                                                Ver Tribunal
                                                            </span>
                                                            <ChevronRight size={14} className="text-text-dim/40 group-hover:text-text-main group-hover:translate-x-0.5 transition-all" />
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
                </div>

                {/* ── Sidebar: VercelUsageCard ─────────────────── */}
                <div className="space-y-6 lg:pt-[54px]">
                    {stats && (
                        <VercelUsageCard
                            title="Métricas del Periodo"
                            items={[
                                { label: 'En Revisión Activa', value: stats.proyectos_en_revision, displayValue: `${stats.proyectos_en_revision}`, max: Math.max(5, stats.proyectos_en_revision), color: 'var(--fg)', tooltip: 'Proyectos actualmente en proceso de evaluación por pares.' },
                                { label: 'Pares Asignados', value: stats.total_arbitros_asignados, displayValue: `${stats.total_arbitros_asignados}`, max: Math.max(10, stats.total_arbitros_asignados), color: '#3b82f6', tooltip: 'Total de revisores asignados (internos y externos).' },
                                { label: 'Completadas', value: stats.evaluaciones_completadas, displayValue: `${stats.evaluaciones_completadas} / ${stats.total_arbitros_asignados || 1}`, max: Math.max(1, stats.total_arbitros_asignados), color: '#22c55e', tooltip: 'Evaluaciones concluidas con dictamen formal.' },
                                { label: 'Pendientes', value: stats.evaluaciones_pendientes, displayValue: `${stats.evaluaciones_pendientes}`, max: Math.max(1, stats.total_arbitros_asignados), color: '#f0a500', tooltip: 'Evaluaciones asignadas pendientes de dictamen.' },
                                ...(stats.casos_desempate > 0 ? [{ label: 'Casos de Desempate', value: stats.casos_desempate, displayValue: `${stats.casos_desempate}`, max: Math.max(1, stats.proyectos_en_revision), color: '#ef4444', tooltip: 'Casos donde hay empate en dictámenes.' }] : []),
                            ]}
                        />
                    )}

                    {/* Alertas CACES */}
                    {alertasVisibles.length > 0 && (
                        <div className="bento-card static p-4 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[14px] font-semibold text-text-main tracking-tight">Alertas CACES</span>
                                <span className="font-mono text-xs font-semibold text-text-dim">
                                    ({alertasVisibles.length})
                                </span>
                            </div>
                            <div className="divide-y divide-border-thin/50 max-h-[320px] overflow-y-auto pr-1">
                                {alertasVisibles.map(a => (
                                    <div key={a.id} className="relative flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 gap-4 group">
                                        {a.tipo === 'critico' ? (
                                            <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
                                        ) : (
                                            <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <p className="text-xs font-semibold text-text-main leading-tight">
                                                {a.titulo}
                                            </p>
                                            <p className="text-[11px] text-text-dim mt-1 leading-snug break-words">
                                                {a.descripcion}
                                            </p>
                                            {a.proyectoUuid && (
                                                <button
                                                    onClick={() => navigate(`/evaluacion-pares/proyecto/${a.proyectoUuid}`)}
                                                    className="text-[10px] font-medium text-brand hover:text-brand-light hover:underline transition-colors mt-2 flex items-center gap-0.5 cursor-pointer"
                                                >
                                                    <span>Gestionar</span>
                                                    <ChevronRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setDismissed(s => new Set([...s, a.id]))}
                                            className="absolute right-0 top-3 text-text-dim hover:text-text-main transition-colors p-1 rounded-md hover:bg-surface-hover cursor-pointer"
                                            title="Ignorar aviso"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>

            </div>

            {/* Modales */}
            {asignarA && (
                <AsignarArbitroModal
                    proyecto={asignarA}
                    onClose={() => setAsignarA(null)}
                    onSuccess={() => { setAsignarA(null); loadData(); }}
                />
            )}
            {showExterno && (
                <ModalRevisorExterno
                    onClose={() => setShowExterno(false)}
                    onSuccess={() => { setShowExterno(false); loadData(); }}
                />
            )}
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  VercelUsageCard — exact same pattern as PeerReviewPage
// ─────────────────────────────────────────────────────────────
const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: {
    title: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    items: { label: string; value: number; displayValue?: string; max?: number; color?: string; tooltip?: string }[];
}) => (
    <div className="bento-card static p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-5">
            <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
            {buttonLabel && (
                <button
                    onClick={onButtonClick}
                    className="px-3 py-1 bg-black text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-[#eaeaea] rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    {buttonLabel}
                </button>
            )}
        </div>
        <div className="space-y-1">
            {items.map((item, idx) => {
                const pct = item.max ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
                const r = 6.5;
                const circ = 2 * Math.PI * r;
                const offset = circ - (pct / 100) * circ;
                return (
                    <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-md transition-all group"
                        style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 18 18">
                                    <circle cx="9" cy="9" r={r} fill="none" strokeWidth="1.8" style={{ stroke: 'var(--accents-2)' }} />
                                    <circle
                                        cx="9" cy="9" r={r} fill="none"
                                        stroke={item.color ?? 'var(--brand)'}
                                        strokeWidth="1.8"
                                        strokeDasharray={circ}
                                        strokeDashoffset={item.max ? offset : 0}
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                    />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-medium text-text-main truncate">{item.label}</span>
                            </div>
                        </div>
                        <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                            {item.displayValue ?? item.value}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

export default ArbitrajePage;
