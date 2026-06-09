import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Clock, CheckCircle, FileText,
    ChevronRight, RefreshCw, Loader2, Award
} from 'lucide-react';
import {
    getPendingReviews,
    ESTADO_REVISION_CONFIG
} from '../../../services/peerReviewService';
import type { PeerReviewDto } from '../../../services/peerReviewService';

const PeerReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<PeerReviewDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState<Record<string, boolean>>({});

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await getPendingReviews();
            setReviews(data);
            
            // Check for local drafts
            const foundDrafts: Record<string, boolean> = {};
            data.forEach(r => {
                if (r.estado === 'Pendiente') {
                    const draft = localStorage.getItem(`diitra_peer_review_draft_${r.uuid}`);
                    if (draft) {
                        foundDrafts[r.uuid] = true;
                    }
                }
            });
            setDrafts(foundDrafts);
        } catch (err) {
            console.error('[DIITRA] Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const reviewsPendientes = reviews.filter(r => r.estado === 'Pendiente');
    const reviewsCompletadas = reviews.filter(r => r.estado === 'Completada');

    const pendientesCount = reviewsPendientes.length;
    const completadasCount = reviewsCompletadas.length;
    const vencidasCount = reviewsPendientes.filter(r => {
        const dias = Math.ceil((new Date(r.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return dias < 0;
    }).length;

    // Helper to calculate progress percentage for completed reviews
    const totalCount = reviews.length;
    const completionRate = totalCount > 0 ? Math.round((completadasCount / totalCount) * 100) : 0;

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <header className="mb-10 animate-fade-up relative z-10">
                <div className="section-label mb-2">
                    <ShieldCheck size={12} className="text-brand" />
                    <span>Evaluación por Pares · DIITRA</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none mb-3">
                            Mis Revisiones
                        </h2>
                        <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                            Ha sido asignado como árbitro para los siguientes proyectos de investigación.
                            Evalúe con rigor científico y ética académica conforme a la normativa CACES.
                        </p>
                    </div>
                    <button
                        onClick={fetchReviews}
                        className="btn-vercel-secondary flex items-center gap-2 shrink-0 shadow-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </header>

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:100ms] relative z-10">
                
                {/* Main Content: Left Column */}
                <div className="lg:col-span-3 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim bento-card static">
                        <Loader2 size={24} className="animate-spin text-brand" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando evaluaciones...</span>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="empty-state py-20 bg-surface">
                        <div className="icon-circle icon-circle-brand !p-4 mb-4">
                            <ShieldCheck size={36} strokeWidth={1.5} />
                        </div>
                        <p className="text-text-main font-bold uppercase tracking-widest text-sm">No tiene revisiones asignadas</p>
                        <p className="text-text-dim text-xs mt-2 max-w-sm">
                            El Director de Investigación le notificará formalmente por correo cuando sea designado como árbitro de un proyecto.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* PENDIENTES */}
                        {reviewsPendientes.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 my-6">
                                    <span className="section-label text-warning font-bold shrink-0">
                                        ⚠ Pendientes de Evaluación ({reviewsPendientes.length})
                                    </span>
                                    <div className="flex-1 h-[1px] bg-border-thin" />
                                </div>
                                <div className="grid gap-4">
                                    {reviewsPendientes.map((review) => {
                                        const statusCfg = ESTADO_REVISION_CONFIG[review.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
                                        const diasRestantes = Math.ceil(
                                            (new Date(review.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        );
                                        const isVencida = diasRestantes < 0;
                                        
                                        // Determine semaforic color for days remaining
                                        let daysBadgeClass = 'badge-vercel-neutral';
                                        if (isVencida || diasRestantes <= 2) {
                                            daysBadgeClass = 'badge-vercel-error';
                                        } else if (diasRestantes <= 7) {
                                            daysBadgeClass = 'badge-vercel-warning';
                                        } else {
                                            daysBadgeClass = 'badge-vercel-success';
                                        }

                                        const hasDraft = drafts[review.uuid];

                                        return (
                                            <div
                                                key={review.uuid}
                                                className="bento-card p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group cursor-pointer"
                                                onClick={() => navigate(`/revisiones/${review.uuid}`)}
                                            >
                                                <div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
                                                    <div className="icon-circle shrink-0 group-hover:scale-110 transition-transform bg-warning-subtle text-warning">
                                                        <FileText size={22} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="status-tag text-text-dim border-border-thin bg-surface">
                                                                #{review.id_proyecto}
                                                            </span>
                                                            <div className={`badge-vercel ${statusCfg.badge}`}>
                                                                <span className={`dot ${statusCfg.dot}`} />
                                                                {statusCfg.label}
                                                            </div>
                                                            {hasDraft && (
                                                                <span className="badge-vercel badge-vercel-info text-[9px]">BORRADOR GUARDADO</span>
                                                            )}
                                                            {review.es_externo && (
                                                                <span className="badge-vercel badge-vercel-violet text-[9px]">PAR EXTERNO</span>
                                                            )}
                                                            {review.es_doble_ciego && (
                                                                <span className="status-tag text-text-dim bg-surface">Anónimo</span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-lg font-bold tracking-tight text-text-main group-hover:text-brand transition-colors line-clamp-2 md:line-clamp-1">
                                                            {review.proyecto_titulo}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            <span className={`badge-vercel ${daysBadgeClass} text-[10px] font-semibold py-0.5 px-2`}>
                                                                <Clock size={10} className="inline mr-1" />
                                                                {isVencida
                                                                    ? `Vencida hace ${Math.abs(diasRestantes)}d`
                                                                    : diasRestantes === 0
                                                                        ? 'Vence hoy'
                                                                        : `${diasRestantes} días restantes`
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-text-dim">
                                                                Asignado: {new Date(review.fecha_asignacion).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-end">
                                                    <button className="btn-brand flex items-center gap-2 text-xs w-full lg:w-auto group-hover:shadow-lg transition-all" tabIndex={-1}>
                                                        {hasDraft ? 'Continuar Evaluación' : 'Evaluar Ahora'}
                                                        <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // Celebration State when no pending
                            <div className="bento-card static p-8 text-center flex flex-col items-center justify-center border-success/20 bg-success-subtle/10 animate-scale-up py-12">
                                <CheckCircle size={44} className="text-success mb-3" />
                                <h4 className="text-lg font-bold text-text-main uppercase tracking-wider">¡Todo al día!</h4>
                                <p className="text-sm text-text-dim mt-1 max-w-md">
                                    Has completado todas tus evaluaciones asignadas. Tu rigor y rapidez académica apoyan al desarrollo del instituto.
                                </p>
                            </div>
                        )}

                        {/* COMPLETADAS */}
                        {reviewsCompletadas.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 my-6">
                                    <span className="section-label text-success font-bold shrink-0">
                                        ✓ Evaluaciones Completadas ({reviewsCompletadas.length})
                                    </span>
                                    <div className="flex-1 h-[1px] bg-border-thin" />
                                </div>
                                <div className="grid gap-4">
                                    {reviewsCompletadas.map((review) => {
                                        const statusCfg = ESTADO_REVISION_CONFIG[review.estado] ?? ESTADO_REVISION_CONFIG['Completada'];
                                        return (
                                            <div
                                                key={review.uuid}
                                                className="bento-card p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                                                onClick={() => navigate(`/revisiones/${review.uuid}`)}
                                            >
                                                <div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
                                                    <div className="icon-circle shrink-0 group-hover:scale-105 transition-transform bg-success-subtle text-success">
                                                        <FileText size={22} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="status-tag text-text-dim border-border-thin bg-surface">
                                                                #{review.id_proyecto}
                                                            </span>
                                                            <div className={`badge-vercel ${statusCfg.badge}`}>
                                                                <span className={`dot ${statusCfg.dot}`} />
                                                                {statusCfg.label}
                                                            </div>
                                                            {review.es_externo && (
                                                                <span className="badge-vercel badge-vercel-violet text-[9px]">PAR EXTERNO</span>
                                                            )}
                                                            {review.es_doble_ciego && (
                                                                <span className="status-tag text-text-dim bg-surface">Anónimo</span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-lg font-bold tracking-tight text-text-main line-clamp-2 md:line-clamp-1">
                                                            {review.proyecto_titulo}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            {review.puntaje_total != null && (
                                                                <span className={`badge-vercel ${review.puntaje_total >= 70 ? 'badge-vercel-success' : 'badge-vercel-error'} text-[10px] font-bold py-0.5 px-2`}>
                                                                    <Award size={10} className="inline mr-1" />
                                                                    Calificación: {review.puntaje_total.toFixed(1)}/100
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-text-dim">
                                                                Entregada: {new Date(review.fecha_limite).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-end">
                                                    <button className="btn-vercel-secondary flex items-center gap-2 text-xs w-full lg:w-auto" tabIndex={-1}>
                                                        Ver Detalle
                                                        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sidebar: Right Column */}
            <div className="space-y-6">
                <VercelUsageCard 
                    title="Resumen de Evaluaciones"
                    buttonLabel="Actualizar"
                    onButtonClick={fetchReviews}
                    items={[
                        {
                            label: 'Pendientes',
                            value: pendientesCount,
                            displayValue: `${pendientesCount} activas`,
                            max: totalCount || 1,
                            color: 'var(--warning)'
                        },
                        {
                            label: 'Completadas',
                            value: completadasCount,
                            displayValue: `${completadasCount} enviadas`,
                            max: totalCount || 1,
                            color: 'var(--success)'
                        },
                        {
                            label: 'Vencidas',
                            value: vencidasCount,
                            displayValue: `${vencidasCount} urgente`,
                            max: totalCount || 1,
                            color: 'var(--error)'
                        }
                    ]}
                />

                {/* Completion rate card (Visual progress) */}
                {totalCount > 0 && (
                    <div className="bento-card static p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="section-label">
                                <ShieldCheck size={12} className="text-success" />
                                <span className="text-[13px] font-semibold text-text-main">Avance Global</span>
                            </div>
                            <span className="font-mono text-[13px] font-bold text-success">
                                {completionRate}%
                            </span>
                        </div>
                        <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-success transition-all duration-700"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
        </main>
    );
};

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: any) => (
    <div className="bento-card static p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
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

export default PeerReviewPage;