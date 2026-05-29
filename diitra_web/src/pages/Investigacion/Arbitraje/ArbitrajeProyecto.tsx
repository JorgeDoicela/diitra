import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Gavel, UserCheck, UserX, AlertTriangle,
    CheckCircle2, Clock, PlusCircle, Trash2, Award,
    Scale, Loader2, Users, Building
} from 'lucide-react';
import {
    getArbitrajeByProject, cerrarArbitraje, revocarAsignacion,
    ESTADO_REVISION_CONFIG, ESTADO_ARBITRAJE_CONFIG
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, PeerReviewDto, DictamenDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal';
import DictamenModal from './DictamenModal';
import { formatNombre, getAvatarStyle } from './ArbitrajePage';

const ArbitrajeProyecto: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();

    const [arbitraje, setArbitraje] = useState<ArbitrajeProyectoDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [cerrando, setCerrando] = useState(false);
    const [showAsignar, setShowAsignar] = useState(false);
    const [dictamen, setDictamen] = useState<DictamenDto | null>(null);

    const internos = arbitraje ? arbitraje.revisiones.filter(r => !r.es_externo) : [];
    const externos = arbitraje ? arbitraje.revisiones.filter(r => r.es_externo) : [];

    const loadData = useCallback(async () => {
        if (!projectUuid) return;
        setLoading(true);
        try {
            const data = await getArbitrajeByProject(projectUuid);
            setArbitraje(data);
        } catch (err) {
            console.error('[DIITRA] Error cargando arbitraje:', err);
        } finally {
            setLoading(false);
        }
    }, [projectUuid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCerrar = async () => {
        if (!projectUuid || !arbitraje) return;
        if (!window.confirm('¿Cerrar el arbitraje y emitir el dictamen final? Esta acción cambiará el estado del proyecto.')) return;

        setCerrando(true);
        try {
            const result = await cerrarArbitraje(projectUuid);
            setDictamen(result);
            loadData();
        } catch (err: any) {
            alert(err?.response?.data?.message ?? 'Error al cerrar el arbitraje.');
        } finally {
            setCerrando(false);
        }
    };

    const handleRevocar = async (rev: PeerReviewDto) => {
        if (!window.confirm(`¿Revocar la asignación de ${rev.revisor_nombre}? Esta acción no se puede deshacer.`)) return;
        try {
            await revocarAsignacion(rev.uuid);
            loadData();
        } catch {
            alert('No se pudo revocar la asignación.');
        }
    };

    const puedesCerrar = arbitraje && arbitraje.revisiones.length > 0
        && arbitraje.revisiones.every(r => r.estado === 'Completada');

    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Cargando arbitraje...</span>
                </div>
            </main>
        );
    }

    if (!arbitraje) {
        return (
            <main className="flex-1 bg-bg-deep p-10">
                <button onClick={() => navigate('/arbitraje')} className="btn-vercel-secondary flex items-center gap-2 mb-6">
                    <ArrowLeft size={14} /> Volver
                </button>
                <div className="empty-state py-20">
                    <p className="text-text-dim font-bold">Proyecto no encontrado.</p>
                </div>
            </main>
        );
    }

    const estadoCfg = ESTADO_ARBITRAJE_CONFIG[arbitraje.estado_arbitraje] ?? ESTADO_ARBITRAJE_CONFIG['Pendiente'];

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-up">
                <button
                    onClick={() => navigate('/arbitraje')}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main text-xs font-bold uppercase tracking-widest transition-colors mb-6"
                >
                    <ArrowLeft size={14} /> Volver al Panel de Arbitraje
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div>
                        <div className="section-label mb-2">
                            <Gavel size={12} />
                            <span>Arbitraje · {arbitraje.convocatoria ?? 'Sin convocatoria'}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-text-main tracking-tighter leading-tight mb-2 max-w-2xl">
                            {arbitraje.proyecto_titulo}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            {arbitraje.codigo_institucional && (
                                <span className="status-tag text-text-dim">{arbitraje.codigo_institucional}</span>
                            )}
                            <div className={`badge-vercel ${estadoCfg.badge}`}>
                                <span className={`dot ${estadoCfg.dot}`} />
                                {estadoCfg.label}
                            </div>
                            <span className="status-tag text-text-dim">Estado: {arbitraje.estado_proyecto}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={() => setShowAsignar(true)}
                            className="btn-vercel-secondary flex items-center gap-2"
                        >
                            <PlusCircle size={14} />
                            Agregar Árbitro
                        </button>
                        <button
                            onClick={handleCerrar}
                            disabled={!puedesCerrar || cerrando}
                            className="btn-vercel-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {cerrando ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                            Emitir Dictamen
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:50ms]">
                
                {/* Main Content: Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Aviso si hay desempate */}
                    {arbitraje.estado_arbitraje === 'Desempate' && (
                        <div className="bento-card p-4 border-error/40 flex items-start gap-4 animate-fade-up">
                            <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-text-main">Caso de Desempate Detectado</p>
                                <p className="text-xs text-text-dim mt-1">
                                    Los árbitros presentan dictámenes contradictorios. Puede asignar un árbitro dirimente adicional
                                    o emitir una resolución fundada del Director de Investigación.
                                </p>
                            </div>
                        </div>
                    )}

            {/* Lista de Árbitros */}
            <div className="animate-fade-up [animation-delay:100ms] space-y-4">
                <div className="section-label mb-2">
                    <UserCheck size={12} />
                    <span>Árbitros Asignados</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna 1: Árbitros Internos */}
                    <div className="p-5 bg-surface/40 rounded-xl border border-border-thin/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin/50">
                            <span className="text-xs font-bold text-text-main flex items-center gap-2">
                                <Users size={14} className="text-text-dim" /> Árbitros Internos
                            </span>
                            <span className="text-[10px] font-mono bg-bg-deep px-2 py-0.5 rounded-md border border-border-thin text-text-dim">
                                {internos.length}
                            </span>
                        </div>

                        {internos.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-border-thin rounded-xl bg-surface/20">
                                <p className="text-xs text-text-dim italic">Ningún árbitro interno asignado</p>
                                <button
                                    onClick={() => setShowAsignar(true)}
                                    className="mt-3 btn-vercel-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 font-medium transition-all"
                                >
                                    <PlusCircle size={13} /> Asignar Interno
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {internos.map((rev) => (
                                    <ArbitroCard
                                        key={rev.uuid}
                                        review={rev}
                                        onRevocar={() => handleRevocar(rev)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna 2: Árbitros Externos */}
                    <div className="p-5 bg-surface/40 rounded-xl border border-border-thin/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin/50">
                            <span className="text-xs font-bold text-text-main flex items-center gap-2">
                                <Building size={14} className="text-text-dim" /> Árbitros Externos (CACES)
                            </span>
                            <span className="text-[10px] font-mono bg-bg-deep px-2 py-0.5 rounded-md border border-border-thin text-text-dim">
                                {externos.length}
                            </span>
                        </div>

                        {externos.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-border-thin rounded-xl bg-surface/20 space-y-2">
                                <p className="text-xs text-text-dim italic">Ningún árbitro externo asignado</p>
                                {arbitraje.total_arbitros > 0 && (
                                    <p className="text-[10px] text-error font-semibold flex items-center justify-center gap-1">
                                        CACES exige al menos 1 árbitro externo
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowAsignar(true)}
                                    className="mt-2 btn-vercel-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 font-medium transition-all"
                                >
                                    <PlusCircle size={13} /> Asignar Externo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {externos.map((rev) => (
                                    <ArbitroCard
                                        key={rev.uuid}
                                        review={rev}
                                        onRevocar={() => handleRevocar(rev)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Avisos de Cumplimiento CACES */}
                {(arbitraje.total_arbitros < 2 || externos.length === 0) && (
                    <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3 animate-fade-in">
                        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-text-main">Cumplimiento Normativo CACES (Indicador I5)</p>
                            <p className="text-[11px] text-text-dim">
                                {arbitraje.total_arbitros < 2 && "• Se recomienda un mínimo de 2 árbitros evaluadores por propuesta académica para un panel completo. "}
                                {externos.length === 0 && "• Es obligatorio contar con al menos 1 árbitro externo a la institución para la evaluación de proyectos."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* Sidebar: Right Column */}
            <div className="space-y-6">
                <VercelUsageCard 
                    title="Resumen del Tribunal"
                    buttonLabel="Actualizar"
                    onButtonClick={loadData}
                    items={[
                        {
                            label: 'Total Árbitros',
                            value: arbitraje.total_arbitros,
                            displayValue: `${arbitraje.total_arbitros} asignados`,
                            max: 5,
                            color: 'var(--brand)'
                        },
                        {
                            label: 'Completados',
                            value: arbitraje.arbitros_completados,
                            displayValue: `${arbitraje.arbitros_completados} dictámenes`,
                            max: arbitraje.total_arbitros || 1,
                            color: '#22c55e'
                        },
                        {
                            label: 'Pendientes',
                            value: arbitraje.total_arbitros - arbitraje.arbitros_completados,
                            displayValue: `${arbitraje.total_arbitros - arbitraje.arbitros_completados} en espera`,
                            max: arbitraje.total_arbitros || 1,
                            color: '#f0a500'
                        },
                        {
                            label: 'Promedio /100',
                            value: arbitraje.puntaje_promedio || 0,
                            displayValue: arbitraje.puntaje_promedio != null ? `${arbitraje.puntaje_promedio.toFixed(1)}/100` : '—',
                            max: 100,
                            color: arbitraje.puntaje_promedio && arbitraje.puntaje_promedio >= 70 ? '#22c55e' : '#ef4444'
                        }
                    ]}
                />

                {/* Progress bar */}
                {arbitraje.total_arbitros > 0 && (
                    <div className="bento-card p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="section-label">
                                <CheckCircle2 size={12} className="text-brand" />
                                <span className="text-[13px] font-semibold text-text-main">Progreso Evaluaciones</span>
                            </div>
                            <span className="font-mono text-[13px] font-bold text-brand">
                                {Math.round((arbitraje.arbitros_completados / arbitraje.total_arbitros) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-brand transition-all duration-700"
                                style={{ width: `${(arbitraje.arbitros_completados / arbitraje.total_arbitros) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* Modals */}
            {showAsignar && (
                <AsignarArbitroModal
                    proyecto={arbitraje}
                    onClose={() => setShowAsignar(false)}
                    onSuccess={() => { setShowAsignar(false); loadData(); }}
                />
            )}
            {dictamen && (
                <DictamenModal
                    dictamen={dictamen}
                    onClose={() => setDictamen(null)}
                />
            )}
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  Sub-componente: Tarjeta de un árbitro asignado
// ─────────────────────────────────────────────────────────────
const ArbitroCard: React.FC<{ review: PeerReviewDto; onRevocar: () => void }> = ({ review, onRevocar }) => {
    const cfg = ESTADO_REVISION_CONFIG[review.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
    const diasRestantes = Math.ceil(
        (new Date(review.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const avStyle = getAvatarStyle(review.revisor_nombre);

    return (
        <div className="bento-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-text-dim/30 hover:bg-surface/50 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avStyle.bg} border text-xs font-bold flex items-center justify-center shrink-0`}>
                    {review.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-text-main">{formatNombre(review.revisor_nombre)}</span>
                        {review.es_externo && (
                            <span className="badge-vercel badge-vercel-info text-[9px]">PAR EXTERNO</span>
                        )}
                        {review.es_doble_ciego && (
                            <span className="status-tag text-text-dim">Doble Ciego</span>
                        )}
                        <div className={`badge-vercel ${cfg.badge}`}>
                            <span className={`dot ${cfg.dot}`} />
                            {cfg.label}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-dim font-medium">
                        {review.revisor_especialidad && (
                            <span className="flex items-center gap-1">
                                <Award size={10} /> {review.revisor_especialidad}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Fecha límite vencida'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {review.puntaje_total != null && (
                    <div className="text-center">
                        <p className={`text-xl font-bold leading-none ${review.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                            {review.puntaje_total.toFixed(1)}
                        </p>
                        <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">/100</p>
                    </div>
                )}
                {review.estado === 'Pendiente' && (
                    <button
                        onClick={onRevocar}
                        className="p-2 text-text-dim hover:text-error transition-colors rounded-md hover:bg-error/10"
                        title="Revocar asignación"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
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

export default ArbitrajeProyecto;
