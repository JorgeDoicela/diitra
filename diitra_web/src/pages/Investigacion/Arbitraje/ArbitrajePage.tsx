import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gavel, Users, CheckCircle2, Scale, ChevronRight, RefreshCw,
    PlusCircle, Clock, TrendingUp, FileSearch, Loader2,
    AlertTriangle, UserPlus, Building, ExternalLink,
    ShieldCheck, X, FileDown
} from 'lucide-react';
import {
    getArbitrajesActivos, getArbitrajeStats,
    ESTADO_ARBITRAJE_CONFIG, DICTAMEN_REVISOR_CONFIG,
    downloadDictamenPdf, registerRevisorExterno,
    type RegistrarRevisorExternoPayload
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, ArbitrajeStatsDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal.tsx';

// ─────────────────────────────────────────────────────────────
//  CACES Alert type
// ─────────────────────────────────────────────────────────────
interface CacesAlert {
    id: string;
    tipo: 'critico' | 'advertencia' | 'info';
    titulo: string;
    descripcion: string;
    proyectoUuid?: string;
    proyectoTitulo?: string;
}

function generarAlertas(proyectos: ArbitrajeProyectoDto[]): CacesAlert[] {
    const alerts: CacesAlert[] = [];

    proyectos.forEach(p => {
        // Alerta: Sin árbitros externos (CACES requiere al menos 1)
        const tieneExterno = p.revisiones.some(r => r.es_externo);
        if (p.total_arbitros > 0 && !tieneExterno) {
            alerts.push({
                id: `ext-${p.proyecto_uuid}`,
                tipo: 'advertencia',
                titulo: 'Sin árbitro externo',
                descripcion: `«${p.proyecto_titulo.slice(0, 50)}...» no tiene árbitros externos. CACES exige al menos un revisor externo a la institución (Indicador I5).`,
                proyectoUuid: p.proyecto_uuid,
                proyectoTitulo: p.proyecto_titulo,
            });
        }

        // Alerta: Desempate requiere acción
        if (p.estado_arbitraje === 'Desempate') {
            alerts.push({
                id: `des-${p.proyecto_uuid}`,
                tipo: 'critico',
                titulo: 'Desempate — Acción requerida',
                descripcion: `«${p.proyecto_titulo.slice(0, 50)}...» está en desempate. Se requiere un tercer árbitro dirimente.`,
                proyectoUuid: p.proyecto_uuid,
                proyectoTitulo: p.proyecto_titulo,
            });
        }

        // Alerta: Menos de 2 árbitros (mínimo CACES)
        if (p.total_arbitros < 2 && p.estado_arbitraje !== 'Completado') {
            alerts.push({
                id: `min-${p.proyecto_uuid}`,
                tipo: 'advertencia',
                titulo: 'Panel incompleto',
                descripcion: `«${p.proyecto_titulo.slice(0, 50)}...» tiene sólo ${p.total_arbitros} árbitro(s). CACES requiere un mínimo de 2.`,
                proyectoUuid: p.proyecto_uuid,
                proyectoTitulo: p.proyecto_titulo,
            });
        }
    });

    return alerts;
}

// ─────────────────────────────────────────────────────────────
//  Modal — Registrar Revisor Externo
// ─────────────────────────────────────────────────────────────
interface ModalRevisorExternoProps {
    onClose: () => void;
    onSuccess: () => void;
}

const ModalRevisorExterno: React.FC<ModalRevisorExternoProps> = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState<RegistrarRevisorExternoPayload>({
        cedula: '', nombres: '', apellidos: '', email: '', institucion: '',
        grado_academico: '', orcid_id: '', especialidad: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await registerRevisorExterno(form);
            onSuccess();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message ?? 'Error al registrar el revisor externo.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-text-dim transition-colors";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bento-card w-full max-w-lg p-6 animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <div className="section-label mb-1">
                            <UserPlus size={11} />
                            <span>Árbitro Externo</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main tracking-tight">
                            Registrar Revisor Externo
                        </h3>
                        <p className="text-xs text-text-dim mt-0.5">
                            Árbitro sin cuenta institucional — Normativa CACES Indicador I5
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-surface text-text-dim hover:text-text-main transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                        <AlertTriangle size={13} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Cédula / Pasaporte *</label>
                        <input required className={inputClass} placeholder="Ej: 1712345678 o PAS12345" value={form.cedula}
                            onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Nombres *</label>
                            <input required className={inputClass} placeholder="Ej: Juan Carlos" value={form.nombres}
                                onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Apellidos *</label>
                            <input required className={inputClass} placeholder="Ej: Pérez Mora" value={form.apellidos}
                                onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Email *</label>
                        <input required type="email" className={inputClass} placeholder="revisor@universidad.edu" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Institución de Origen *</label>
                        <input required className={inputClass} placeholder="Ej: Universidad Central del Ecuador" value={form.institucion}
                            onChange={e => setForm(f => ({ ...f, institucion: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Grado Académico</label>
                            <select className={inputClass} value={form.grado_academico}
                                onChange={e => setForm(f => ({ ...f, grado_academico: e.target.value }))}>
                                <option value="">Seleccionar...</option>
                                <option value="PhD">PhD / Doctorado</option>
                                <option value="MSc">Maestría / MSc</option>
                                <option value="MBA">MBA</option>
                                <option value="Especialista">Especialista</option>
                                <option value="Licenciatura">Licenciatura / Ingeniería</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">ORCID iD</label>
                            <input className={inputClass} placeholder="0000-0000-0000-0000" value={form.orcid_id}
                                onChange={e => setForm(f => ({ ...f, orcid_id: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Área de Especialidad</label>
                        <input className={inputClass} placeholder="Ej: Inteligencia Artificial, Biotecnología..." value={form.especialidad}
                            onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
                        <button type="submit" className="btn-vercel flex items-center gap-2" disabled={loading}>
                            {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                            {loading ? 'Registrando...' : 'Registrar Árbitro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  Helpers de formato visual y usabilidad
// ─────────────────────────────────────────────────────────────
export const formatNombre = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => {
            const preps = ['de', 'la', 'del', 'los', 'las', 'y'];
            if (preps.includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ')
        .replace(/^\w/, c => c.toUpperCase());
};

export const getAvatarStyle = (name: string) => {
    const colors = [
        { bg: 'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20' },
        { bg: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20' },
        { bg: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20' },
        { bg: 'from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/20' },
        { bg: 'from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20' }
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

// ─────────────────────────────────────────────────────────────
//  Componente principal: ArbitrajePage
// ─────────────────────────────────────────────────────────────
const ArbitrajePage: React.FC = () => {
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState<ArbitrajeProyectoDto[]>([]);
    const [stats, setStats] = useState<ArbitrajeStatsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [proyectoParaAsignar, setProyectoParaAsignar] = useState<ArbitrajeProyectoDto | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [showModalExterno, setShowModalExterno] = useState(false);
    const [descargandoPdf, setDescargandoPdf] = useState<string | null>(null);
    const [alertas, setAlertas] = useState<CacesAlert[]>([]);
    const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set());
    // Tab Internos/Externos para una fila expandida
    const [proyectoExpandido, setProyectoExpandido] = useState<string | null>(null);
    const [tabRevisores, setTabRevisores] = useState<Record<string, 'internos' | 'externos'>>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [proy, st] = await Promise.all([getArbitrajesActivos(), getArbitrajeStats()]);
            setProyectos(proy);
            setStats(st);
            setAlertas(generarAlertas(proy));
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

    const alertasVisibles = alertas.filter(a => !alertasDismissed.has(a.id));

    const handleDescargarPdf = async (e: React.MouseEvent, proyectoUuid: string) => {
        e.stopPropagation();
        setDescargandoPdf(proyectoUuid);
        try {
            const blob = await downloadDictamenPdf(proyectoUuid);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DIITRA_DICTAMEN_${proyectoUuid.slice(0, 8).toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[DIITRA] Error descargando dictamen PDF:', err);
        } finally {
            setDescargandoPdf(null);
        }
    };

    const toggleExpandir = (uuid: string) => {
        setProyectoExpandido(prev => prev === uuid ? null : uuid);
        setTabRevisores(prev => ({ ...prev, [uuid]: prev[uuid] ?? 'internos' }));
    };

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* ── Header ─────────────────────────────────── */}
            <header className="mb-8 animate-fade-up">
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
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowModalExterno(true)}
                            className="btn-vercel-secondary flex items-center gap-2"
                            title="Registrar árbitro externo (CACES)"
                        >
                            <UserPlus size={14} />
                            Árbitro Externo
                        </button>
                        <button
                            onClick={loadData}
                            className="btn-vercel-secondary flex items-center gap-2"
                            disabled={loading}
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Alertas CACES (Adición 2) ──────────────── */}
            {alertasVisibles.length > 0 && (
                <div className="space-y-2 mb-8 animate-fade-up [animation-delay:30ms]">
                    <div className="section-label mb-2">
                        <ShieldCheck size={11} />
                        <span>Alertas de Cumplimiento CACES</span>
                    </div>
                    {alertasVisibles.map(a => (
                        <div
                            key={a.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-all ${a.tipo === 'critico'
                                ? 'bg-error/8 border-error/30 text-error'
                                : a.tipo === 'advertencia'
                                    ? 'bg-warning/8 border-warning/30 text-warning'
                                    : 'bg-info/8 border-info/30 text-info'
                                }`}
                            style={{ '--color-warning': '#f0a500', '--color-info': '#3b82f6' } as React.CSSProperties}
                        >
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <span className="font-bold mr-1">{a.titulo}:</span>
                                {a.descripcion}
                                {a.proyectoUuid && (
                                    <button
                                        className="ml-2 underline opacity-70 hover:opacity-100"
                                        onClick={() => navigate(`/arbitraje/proyecto/${a.proyectoUuid}`)}
                                    >
                                        Ver proyecto →
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setAlertasDismissed(s => new Set([...s, a.id]))}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                                title="Descartar alerta"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── KPI Cards (Adición 4 — KPIs mejorados) ── */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-fade-up [animation-delay:50ms]">
                    <KpiCard icon={<FileSearch size={18} />} label="En Revisión"
                        value={stats.proyectos_en_revision} color="var(--color-text-main)" />
                    <KpiCard icon={<Users size={18} />} label="Árbitros Asignados"
                        value={stats.total_arbitros_asignados} color="#3b82f6" />
                    <KpiCard icon={<CheckCircle2 size={18} />} label="Completadas"
                        value={stats.evaluaciones_completadas} color="#22c55e" />
                    <KpiCard icon={<Clock size={18} />} label="Pendientes"
                        value={stats.evaluaciones_pendientes} color="#f0a500" />
                    <KpiCard icon={<Scale size={18} />} label="Desempates"
                        value={stats.casos_desempate} color="#ef4444"
                        alert={stats.casos_desempate > 0} />
                </div>
            )}

            {/* ── Barra de progreso global ──────────────── */}
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
                    {alertasVisibles.length > 0 && (
                        <p className="text-[10px] text-error mt-2 font-bold flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {alertasVisibles.length} alerta(s) de cumplimiento CACES activa(s)
                        </p>
                    )}
                </div>
            )}

            {/* ── Filtros ───────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-6 animate-fade-up [animation-delay:150ms]">
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

            {/* ── Tabla de Proyectos + Tabs Internos/Externos ── */}
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
                                    const isExpandido = proyectoExpandido === p.proyecto_uuid;
                                    const tabActual = tabRevisores[p.proyecto_uuid] ?? 'internos';
                                    const internos = p.revisiones.filter(r => !r.es_externo);
                                    const externos = p.revisiones.filter(r => r.es_externo);
                                    const tieneExterno = externos.length > 0;

                                    return (
                                        <React.Fragment key={p.proyecto_uuid}>
                                            <tr
                                                className="border-b border-border-thin/50 hover:bg-surface/30 transition-colors group cursor-pointer"
                                                onClick={() => toggleExpandir(p.proyecto_uuid)}
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
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {p.codigo_institucional && (
                                                                    <span className="status-tag text-text-dim">
                                                                        {p.codigo_institucional}
                                                                    </span>
                                                                )}
                                                                {!tieneExterno && p.total_arbitros > 0 && (
                                                                    <span className="status-tag text-warning border-warning/30" style={{ color: '#f0a500' }}>
                                                                        <AlertTriangle size={9} className="inline mr-0.5" />
                                                                        Sin externo
                                                                    </span>
                                                                )}
                                                                {tieneExterno && (
                                                                    <span className="status-tag text-success border-success/30">
                                                                        <Building size={9} className="inline mr-0.5" />
                                                                        Ext. ✓
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                        {/* Botón PDF si está completado */}
                                                        {p.estado_arbitraje === 'Completado' && (
                                                            <button
                                                                onClick={(e) => handleDescargarPdf(e, p.proyecto_uuid)}
                                                                className="btn-vercel-secondary !py-1 !px-2.5 !text-[10px] flex items-center gap-1"
                                                                title="Descargar Acta de Dictamen PDF (CACES)"
                                                                disabled={descargandoPdf === p.proyecto_uuid}
                                                            >
                                                                {descargandoPdf === p.proyecto_uuid
                                                                    ? <Loader2 size={11} className="animate-spin" />
                                                                    : <FileDown size={11} />
                                                                }
                                                                Acta PDF
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setProyectoParaAsignar(p);
                                                            }}
                                                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1.5 font-medium transition-all"
                                                        >
                                                            <PlusCircle size={13} />
                                                            <span>Árbitro</span>
                                                        </button>
                                                        <div className={`p-1 rounded-md text-text-dim group-hover:text-text-main transition-colors ${isExpandido ? 'rotate-90' : ''}`}>
                                                            <ChevronRight size={14} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* ── Fila expandida con Panel Dividido ("2 Cuadros") ── */}
                                            {isExpandido && (
                                                <tr className="border-b border-border-thin/50">
                                                    <td colSpan={6} className="px-5 pb-4 pt-0">
                                                        <div className="bg-surface/40 rounded-xl p-4 border border-border-thin/50 space-y-4 animate-fade-in">
                                                            {/* Cabecera de Fila Expandida */}
                                                            <div className="flex items-center justify-between pb-2 border-b border-border-thin/50">
                                                                <span className="text-[11px] font-bold text-text-main tracking-wide">
                                                                    Resumen de evaluadores asignados
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/arbitraje/proyecto/${p.proyecto_uuid}`);
                                                                    }}
                                                                    className="ml-auto btn-vercel-secondary !py-1.5 !px-3.5 !text-xs flex items-center gap-1.5 font-medium transition-all"
                                                                >
                                                                    <FileSearch size={13} />
                                                                    Ver detalle completo
                                                                </button>
                                                            </div>

                                                            {/* Panel Dividido de 2 Columnas */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Columna 1: Árbitros Internos */}
                                                                <div className="p-3 bg-surface/50 rounded-lg border border-border-thin space-y-3">
                                                                    <div className="flex items-center justify-between pb-1.5 border-b border-border-thin/50">
                                                                        <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                                                            <Users size={12} className="text-text-dim" /> Árbitros Internos
                                                                        </span>
                                                                        <span className="text-[9px] font-mono bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim">
                                                                            {internos.length}
                                                                        </span>
                                                                    </div>
                                                                    {internos.length === 0 ? (
                                                                        <p className="text-[10px] text-text-dim py-5 text-center italic">Ninguno asignado</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {internos.map(r => {
                                                                                const dictCfg = DICTAMEN_REVISOR_CONFIG[r.dictamen_revisor || 'Pendiente'];
                                                                                const estadoCfgR = r.estado === 'Completada'
                                                                                    ? { badge: 'badge-vercel-success', dot: 'dot-success' }
                                                                                    : { badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' };
                                                                                const avStyle = getAvatarStyle(r.revisor_nombre);
                                                                                return (
                                                                                    <div
                                                                                        key={r.uuid}
                                                                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-deep border border-border-thin/40 justify-between hover:border-text-dim/30 hover:bg-surface/50 hover:-translate-y-0.5 transition-all duration-200"
                                                                                    >
                                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avStyle.bg} border text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                                                                                {r.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                            </div>
                                                                                            <div className="truncate">
                                                                                                <p className="text-xs font-semibold text-text-main truncate leading-tight">
                                                                                                    {formatNombre(r.revisor_nombre)}
                                                                                                </p>
                                                                                                <p className="text-[9px] text-text-dim truncate mt-0.5 font-medium">
                                                                                                    {r.revisor_grado || 'S/G'} {r.revisor_especialidad ? `· ${r.revisor_especialidad}` : ''}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            {r.puntaje_total != null && (
                                                                                                <span className={`text-[11px] font-bold font-mono ${r.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                                                                                                    {r.puntaje_total.toFixed(1)}/100
                                                                                                </span>
                                                                                            )}
                                                                                            <div className={`badge-vercel ${estadoCfgR.badge} text-[9px] py-0.5 px-1.5`}>
                                                                                                <span className={`dot ${estadoCfgR.dot}`} />
                                                                                                {r.estado}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Columna 2: Árbitros Externos */}
                                                                <div className="p-3 bg-surface/50 rounded-lg border border-border-thin space-y-3">
                                                                    <div className="flex items-center justify-between pb-1.5 border-b border-border-thin/50">
                                                                        <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                                                            <Building size={12} className="text-text-dim" /> Árbitros Externos
                                                                        </span>
                                                                        <span className="text-[9px] font-mono bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim">
                                                                            {externos.length}
                                                                        </span>
                                                                    </div>
                                                                    {externos.length === 0 ? (
                                                                        <div className="text-center py-4 space-y-1 bg-surface/20 border border-dashed border-border-thin rounded-lg">
                                                                            <p className="text-[10px] text-text-dim italic">Ninguno asignado</p>
                                                                            {p.total_arbitros > 0 && (
                                                                                <p className="text-[9px] text-error font-semibold flex items-center justify-center gap-1">
                                                                                    CACES exige al menos 1 árbitro externo
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {externos.map(r => {
                                                                                const dictCfg = DICTAMEN_REVISOR_CONFIG[r.dictamen_revisor || 'Pendiente'];
                                                                                const estadoCfgR = r.estado === 'Completada'
                                                                                    ? { badge: 'badge-vercel-success', dot: 'dot-success' }
                                                                                    : { badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' };
                                                                                const avStyle = getAvatarStyle(r.revisor_nombre);
                                                                                return (
                                                                                    <div
                                                                                        key={r.uuid}
                                                                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-deep border border-border-thin/40 justify-between hover:border-text-dim/30 hover:bg-surface/50 hover:-translate-y-0.5 transition-all duration-200"
                                                                                    >
                                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avStyle.bg} border text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                                                                                {r.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                                            </div>
                                                                                            <div className="truncate">
                                                                                                <p className="text-xs font-semibold text-text-main truncate leading-tight">
                                                                                                    {formatNombre(r.revisor_nombre)}
                                                                                                </p>
                                                                                                <p className="text-[9px] text-text-dim truncate mt-0.5 font-medium">
                                                                                                    {r.revisor_grado || 'S/G'} {r.revisor_especialidad ? `· ${r.revisor_especialidad}` : ''}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            {r.puntaje_total != null && (
                                                                                                <span className={`text-[11px] font-bold font-mono ${r.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                                                                                                    {r.puntaje_total.toFixed(1)}/100
                                                                                                </span>
                                                                                            )}
                                                                                            <div className={`badge-vercel ${estadoCfgR.badge} text-[9px] py-0.5 px-1.5`}>
                                                                                                <span className={`dot ${estadoCfgR.dot}`} />
                                                                                                {r.estado}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal Asignar Árbitro ─────────────────── */}
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

            {/* ── Modal Registrar Revisor Externo ─────── */}
            {showModalExterno && (
                <ModalRevisorExterno
                    onClose={() => setShowModalExterno(false)}
                    onSuccess={() => {
                        setShowModalExterno(false);
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
// Trigger refresh of TS server diagnostics

