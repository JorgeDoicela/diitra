import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gavel, RefreshCw, Loader2,
    AlertTriangle, UserPlus, Building,
    ShieldCheck, X, FileDown, Check,
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
            alerts.push({ id: `ext-${p.proyecto_uuid}`, tipo: 'advertencia', titulo: 'Sin árbitro externo', descripcion: `"${p.proyecto_titulo}" requiere al menos un revisor externo (CACES I5).`, proyectoUuid: p.proyecto_uuid });
        }
        if (p.estado_arbitraje === 'Desempate') {
            alerts.push({ id: `des-${p.proyecto_uuid}`, tipo: 'critico', titulo: 'Desempate pendiente', descripcion: `"${p.proyecto_titulo}" tiene dictámenes divididos. Se requiere un tercer árbitro.`, proyectoUuid: p.proyecto_uuid });
        }
        if (p.total_arbitros < 2 && p.estado_arbitraje !== 'Completado') {
            alerts.push({ id: `min-${p.proyecto_uuid}`, tipo: 'advertencia', titulo: 'Panel incompleto', descripcion: `"${p.proyecto_titulo}" tiene menos de 2 árbitros asignados (mínimo CACES).`, proyectoUuid: p.proyecto_uuid });
        }
    });
    return alerts;
}

// ─────────────────────────────────────────────────────────────
//  Modal — Registrar Revisor Externo
// ─────────────────────────────────────────────────────────────
interface ModalRevisorExternoProps { onClose: () => void; onSuccess: () => void; }

const ModalRevisorExterno: React.FC<ModalRevisorExternoProps> = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState<RegistrarRevisorExternoPayload>({
        cedula: '', nombres: '', apellidos: '', email: '', institucion: '',
        grado_academico: '', orcid_id: '', especialidad: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ nombre: string; cedula: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await registerRevisorExterno(form);
            setDone({ nombre: `${form.nombres} ${form.apellidos}`.toUpperCase().trim(), cedula: form.cedula || form.email });
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al registrar el revisor externo.');
        } finally { setLoading(false); }
    };

    const inp = "w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-dim/50 focus:outline-none focus:border-text-main transition-colors";

    if (done) return (
        <div className="modal-overlay">
            <div className="modal-card animate-scale-up max-w-sm w-full">
                <div className="modal-header gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-success" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-main">Evaluador registrado</h3>
                </div>
                <div className="modal-body">
                    <p className="text-xs text-text-dim leading-relaxed">
                        <span className="text-text-main font-medium">{done.nombre}</span> ha sido registrado. Credenciales por defecto:
                    </p>
                    <div className="mt-3 p-3 rounded-lg bg-surface border border-border-thin font-mono text-xs space-y-1 text-text-dim">
                        <div><span className="text-text-main">Usuario:</span> {done.cedula}</div>
                        <div><span className="text-text-main">Contraseña:</span> Diitra2026*</div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onSuccess} className="btn-vercel-primary">Entendido</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-card animate-scale-up w-full max-w-lg">
                <div className="modal-header">
                    <div>
                        <p className="section-label mb-1"><UserPlus size={10} /><span>Árbitro Externo · CACES I5</span></p>
                        <h3 className="text-base font-semibold text-text-main">Registrar Revisor Externo</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors"><X size={15} /></button>
                </div>
                <div className="modal-body space-y-3">
                    {error && (
                        <div className="p-3 rounded-lg bg-error/5 border border-error/20 text-error text-xs flex items-center gap-2">
                            <AlertTriangle size={12} />{error}
                        </div>
                    )}
                    <form id="form-externo" onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Cédula / Pasaporte *</label>
                            <input required className={inp} placeholder="Ej: 1712345678" value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Nombres *</label>
                                <input required className={`${inp} uppercase`} placeholder="JUAN CARLOS" value={form.nombres} onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Apellidos *</label>
                                <input required className={`${inp} uppercase`} placeholder="PÉREZ MORA" value={form.apellidos} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Email *</label>
                            <input required type="email" className={inp} placeholder="revisor@universidad.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Institución *</label>
                            <input required className={inp} placeholder="Universidad Central del Ecuador" value={form.institucion} onChange={e => setForm(f => ({ ...f, institucion: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Grado Académico</label>
                                <select className={inp} value={form.grado_academico} onChange={e => setForm(f => ({ ...f, grado_academico: e.target.value }))}>
                                    <option value="">Seleccionar...</option>
                                    <option value="PHD">Doctorado / PhD</option>
                                    <option value="MAESTRIA">Maestría</option>
                                    <option value="ESPECIALIDAD">Especialidad Médica</option>
                                    <option value="TERCER_NIVEL">Tercer Nivel</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">ORCID iD</label>
                                <input className={inp} placeholder="0000-0000-0000-0000" value={form.orcid_id} onChange={e => setForm(f => ({ ...f, orcid_id: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1.5">Área de Especialidad</label>
                            <input className={inp} placeholder="Ej: Inteligencia Artificial, Biotecnología..." value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} />
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
                    <button type="submit" form="form-externo" className="btn-vercel-primary flex items-center gap-2" disabled={loading}>
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    { key: 'SinArbitros', label: 'Sin árbitros' },
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

            {/* ── PAGE HEADER ──────────────────────────────────── */}
            <header className="mb-10 animate-fade-up relative z-10">
                <div className="section-label mb-2">
                    <Gavel size={12} className="text-brand" />
                    <span>Módulo de Arbitraje · DIITRA</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none mb-3">
                            Gestión de Arbitraje
                        </h2>
                        <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                            Panel de control del proceso de evaluación por pares bajo la normativa CACES.
                            Asigne árbitros, supervise el avance y emita dictámenes formales.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setShowExterno(true)} className="btn-vercel-secondary flex items-center gap-2 shrink-0">
                            <UserPlus size={14} />
                            Árbitro Externo
                        </button>
                        <button onClick={loadData} className="btn-vercel-secondary flex items-center gap-2 shrink-0" disabled={loading}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                </div>
            </header>

            {/* ── ALERTAS CACES ────────────────────────────────── */}
            {alertasVisibles.length > 0 && (
                <div className="mb-6 space-y-1.5 animate-fade-up [animation-delay:60ms]">
                    {alertasVisibles.map(a => (
                        <div
                            key={a.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-xs ${
                                a.tipo === 'critico' ? 'bg-error/5 border-error/20' : 'bg-warning/5 border-warning/20'
                            }`}
                        >
                            <AlertCircle size={13} className={`mt-0.5 shrink-0 ${a.tipo === 'critico' ? 'text-error' : 'text-warning'}`} />
                            <div className="flex-1 min-w-0">
                                <span className="font-semibold text-text-main">{a.titulo}:</span>
                                {' '}<span className="text-text-dim">{a.descripcion}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                {a.proyectoUuid && (
                                    <button onClick={() => navigate(`/arbitraje/proyecto/${a.proyectoUuid}`)} className="text-brand hover:underline font-medium">
                                        Ver →
                                    </button>
                                )}
                                <button onClick={() => setDismissed(s => new Set([...s, a.id]))} className="text-text-dim hover:text-text-main transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TWO-COLUMN LAYOUT — igual que PeerReviewPage ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:100ms] relative z-10">

                {/* ── Columna principal: tabla ─────────────────── */}
                <div className="lg:col-span-3 space-y-0">

                    {/* Tabs filtro */}
                    <div className="tabs-vercel">
                        {FILTROS.map(f => (
                            <button
                                key={f.key}
                                className={`tab-vercel-item flex items-center gap-1.5 ${filtro === f.key ? 'active' : ''}`}
                                onClick={() => setFiltro(f.key)}
                            >
                                {f.label}
                                {f.key === 'Desempate' && stats && stats.casos_desempate > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
                                )}
                                {f.key === 'todos' && !loading && (
                                    <span className="text-[10px] font-mono bg-surface border border-border-thin rounded-full px-1.5 py-px text-text-dim ml-0.5">
                                        {proyectos.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tabla */}
                    <div className="bento-card static overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim">
                                <Loader2 size={24} className="animate-spin text-brand" />
                                <span className="text-xs font-bold uppercase tracking-widest">Cargando proyectos...</span>
                            </div>
                        ) : filtrados.length === 0 ? (
                            <div className="empty-state py-20">
                                <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                                    <Gavel size={28} strokeWidth={1.5} />
                                </div>
                                <p className="text-text-main font-bold uppercase tracking-widest text-sm">Sin proyectos en esta categoría</p>
                                <p className="text-text-dim text-xs mt-2 max-w-sm">Cambia el filtro o asigna árbitros a los proyectos.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-hidden">
                                <table className="w-full sm:table-fixed">
                                    <thead>
                                        <tr className="border-b border-border-thin">
                                            <th className="text-left px-5 py-3.5 sm:w-[35%]"><span className="section-label !tracking-[0.12em]">Proyecto</span></th>
                                            <th className="text-left px-4 py-3.5 hidden md:table-cell md:w-[15%]"><span className="section-label !tracking-[0.12em]">Convocatoria</span></th>
                                            <th className="text-center px-4 py-3.5 hidden sm:table-cell sm:w-[12%]"><span className="section-label justify-center !tracking-[0.12em]">Progreso</span></th>
                                            <th className="text-center px-4 py-3.5 hidden lg:table-cell lg:w-[8%]"><span className="section-label justify-center !tracking-[0.12em]">Puntaje</span></th>
                                            <th className="text-left px-4 py-3.5 hidden sm:table-cell sm:w-[12%]"><span className="section-label !tracking-[0.12em]">Estado</span></th>
                                            <th className="px-4 py-3.5 sm:w-[18%] w-[90px]" />
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
                                                    onClick={() => navigate(`/arbitraje/proyecto/${p.proyecto_uuid}`)}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg border border-border-thin bg-surface flex items-center justify-center shrink-0 mt-0.5">
                                                                 <Gavel size={13} className="text-text-dim" strokeWidth={1.5} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-text-main leading-snug truncate max-w-[160px] sm:max-w-[240px] group-hover:text-brand transition-colors">
                                                                    {p.proyecto_titulo}
                                                                </p>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                                                    {p.codigo_institucional && (
                                                                        <span className="text-[10px] font-mono text-text-dim">{p.codigo_institucional}</span>
                                                                    )}
                                                                    {!tieneExterno && p.total_arbitros > 0 && (
                                                                        <span className="text-[10px] text-warning font-medium flex items-center gap-0.5">
                                                                            <AlertTriangle size={9} />sin externo
                                                                        </span>
                                                                    )}
                                                                    {tieneExterno && (
                                                                        <span className="text-[10px] text-success font-medium flex items-center gap-0.5">
                                                                            <Building size={9} />ext. ✓
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Detalle apilado para móviles */}
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:hidden text-[9px] font-medium">
                                                                    {p.convocatoria && (
                                                                        <span className="text-text-dim bg-surface border border-border-thin rounded px-1.5 py-0.5">
                                                                            {p.convocatoria}
                                                                        </span>
                                                                    )}
                                                                    {p.total_arbitros > 0 && (
                                                                        <span className="bg-surface border border-border-thin rounded px-1.5 py-0.5 text-text-dim font-mono">
                                                                            Progreso: {p.arbitros_completados}/{p.total_arbitros}
                                                                        </span>
                                                                    )}
                                                                    {p.puntaje_promedio != null && (
                                                                        <span className={`rounded px-1.5 py-0.5 font-mono ${p.puntaje_promedio >= 70 ? 'bg-success/5 border border-success/20 text-success' : 'bg-error/5 border border-error/20 text-error'}`}>
                                                                            {p.puntaje_promedio.toFixed(1)} pts
                                                                        </span>
                                                                    )}
                                                                    <div className={`scale-90 origin-left badge-vercel ${cfg.badge} !py-0 !px-1.5 !h-auto !text-[8px]`}>
                                                                        <span className={`dot ${cfg.dot} !w-1 !h-1`} />
                                                                        {cfg.label}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 hidden md:table-cell">
                                                        <span className="text-xs text-text-dim truncate block max-w-[140px]">{p.convocatoria ?? '—'}</span>
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
                                                        <div className={`badge-vercel ${cfg.badge}`}>
                                                            <span className={`dot ${cfg.dot}`} />
                                                            {cfg.label}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                            {p.arbitraje_cerrado && (
                                                                <button
                                                                    onClick={e => handlePdf(e, p.proyecto_uuid)}
                                                                    className="btn-vercel-secondary !py-1.5 !px-2 flex items-center gap-1.5"
                                                                    disabled={descargando === p.proyecto_uuid}
                                                                    title="Descargar Acta PDF"
                                                                >
                                                                    {descargando === p.proyecto_uuid ? <Loader2 size={11} className="animate-spin" /> : <FileDown size={11} />}
                                                                    <span className="hidden xl:inline text-[10px]">Acta</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setAsignarA(p); }}
                                                                className="btn-vercel-secondary !py-1.5 !px-2 flex items-center gap-1.5"
                                                                title="Asignar árbitro"
                                                            >
                                                                <PlusCircle size={11} />
                                                                <span className="hidden xl:inline text-[10px]">Árbitro</span>
                                                            </button>
                                                            <ChevronRight size={14} className="text-text-dim/40 group-hover:text-text-dim transition-colors" />
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
                <div className="space-y-6 lg:pt-[69px]">
                    {stats && (
                        <VercelUsageCard
                            title="Métricas de Arbitraje"
                            buttonLabel="Actualizar"
                            onButtonClick={loadData}
                            items={[
                                { label: 'En Revisión',     value: stats.proyectos_en_revision,    displayValue: `${stats.proyectos_en_revision}`,                                     max: Math.max(10, stats.proyectos_en_revision),    color: 'var(--fg)',  tooltip: 'Proyectos actualmente en proceso de evaluación por pares.' },
                                { label: 'Total Árbitros',  value: stats.total_arbitros_asignados, displayValue: `${stats.total_arbitros_asignados}`,                                   max: Math.max(15, stats.total_arbitros_asignados), color: '#3b82f6',    tooltip: 'Total de revisores asignados (internos y externos).' },
                                { label: 'Completadas',     value: stats.evaluaciones_completadas, displayValue: `${stats.evaluaciones_completadas} / ${stats.total_arbitros_asignados}`, max: Math.max(1, stats.total_arbitros_asignados),  color: '#22c55e',    tooltip: 'Evaluaciones firmadas y entregadas por los árbitros.' },
                                { label: 'Pendientes',      value: stats.evaluaciones_pendientes,  displayValue: `${stats.evaluaciones_pendientes}`,                                    max: Math.max(1, stats.total_arbitros_asignados),  color: '#f0a500',    tooltip: 'Evaluaciones asignadas aún sin entregar.' },
                                { label: 'Desempates',      value: stats.casos_desempate,          displayValue: `${stats.casos_desempate}`,                                            max: Math.max(1, stats.proyectos_en_revision),     color: '#ef4444',    tooltip: 'Casos donde hay empate en dictámenes.' },
                                { label: 'Tasa Aprobación', value: tasaAprobacion,                 displayValue: `${tasaAprobacion}%`,                                                  max: 100,                                          color: '#10b981',    tooltip: 'Porcentaje de proyectos con dictamen favorable.' },
                                { label: 'Tiempo Promedio', value: completadas.length > 0 ? parseFloat(tiempoPromText) : 0, displayValue: tiempoPromText,                              max: 30,                                           color: '#0070f3',    tooltip: 'Días promedio que tarda un revisor en completar su evaluación.' },
                            ]}
                        />
                    )}

                    {/* Avance global */}
                    {stats && stats.total_arbitros_asignados > 0 && (
                        <div className="bento-card static p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="section-label">
                                    <ShieldCheck size={12} className="text-success" />
                                    <span className="text-[13px] font-semibold text-text-main">Avance Global</span>
                                </div>
                                <span className="font-mono text-[13px] font-bold text-success">{stats.porcentaje_avance}%</span>
                            </div>
                            <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${stats.porcentaje_avance}%` }} />
                            </div>
                            <p className="text-[10px] text-text-dim mt-2 font-mono">
                                Tiempo prom.: <span className="text-text-main">{tiempoPromText}</span>
                            </p>
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
                                {item.tooltip && (
                                    <svg className="w-3 h-3 text-text-dim/40 hover:text-text-main transition-colors shrink-0 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <title>{item.tooltip}</title>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                )}
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
