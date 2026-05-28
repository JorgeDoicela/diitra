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

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await getPendingReviews();
            setReviews(data);
        } catch (err) {
            console.error('[DIITRA] Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const pendientes = reviews.filter(r => r.estado === 'Pendiente').length;
    const completadas = reviews.filter(r => r.estado === 'Completada').length;
    const vencidas = reviews.filter(r => new Date(r.fecha_limite) < new Date() && r.estado === 'Pendiente').length;

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <header className="mb-10 animate-fade-up">
                <div className="section-label mb-2">
                    <ShieldCheck size={12} className="text-text-main" />
                    <span>Evaluación por Pares · DIITRA</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none mb-3">
                            Mis Revisiones
                        </h2>
                        <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                            Ha sido asignado como árbitro para los siguientes proyectos de investigación.
                            Evalúe con rigor científico y ética académica conforme a la normativa CACES.
                        </p>
                    </div>
                    <button
                        onClick={fetchReviews}
                        className="btn-vercel-secondary flex items-center gap-2 shrink-0"
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up [animation-delay:50ms]">
                <div className="bento-card p-5 text-center">
                    <p className="stat-number stat-number--sm text-warning">{pendientes}</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Pendientes</p>
                </div>
                <div className="bento-card p-5 text-center">
                    <p className="stat-number stat-number--sm text-success">{completadas}</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Completadas</p>
                </div>
                <div className="bento-card p-5 text-center">
                    <p className="stat-number stat-number--sm text-error">{vencidas}</p>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mt-1">Vencidas</p>
                </div>
            </div>

            {/* Lista de revisiones */}
            <div className="space-y-3 animate-fade-up [animation-delay:100ms]">
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-text-dim">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando revisiones...</span>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="empty-state py-20">
                        <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <p className="text-text-dim font-bold uppercase tracking-widest">No tiene revisiones asignadas</p>
                        <p className="text-text-dim text-xs mt-2">El Director de Investigación le notificará cuando sea designado como árbitro.</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const statusCfg = ESTADO_REVISION_CONFIG[review.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
                        const diasRestantes = Math.ceil(
                            (new Date(review.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        const isVencida = diasRestantes < 0 && review.estado === 'Pendiente';

                        return (
                            <div
                                key={review.uuid}
                                className="bento-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 group cursor-pointer hover:shadow-md transition-all"
                                onClick={() => navigate(`/revisiones/${review.uuid}`)}
                            >
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className={`icon-circle shrink-0 group-hover:scale-110 transition-transform ${review.estado === 'Completada' ? 'icon-circle-brand' : 'icon-circle-neutral'}`}>
                                        <FileText size={22} strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span className="status-tag text-text-dim border-border-thin">
                                                #{review.id_proyecto}
                                            </span>
                                            <div className={`badge-vercel ${statusCfg.badge}`}>
                                                <span className={`dot ${statusCfg.dot}`} />
                                                {statusCfg.label}
                                            </div>
                                            {review.es_externo && (
                                                <span className="badge-vercel badge-vercel-info text-[9px]">PAR EXTERNO</span>
                                            )}
                                            {review.es_doble_ciego && (
                                                <span className="status-tag text-text-dim">Doble Ciego</span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold tracking-tight text-text-main group-hover:translate-x-0.5 transition-transform line-clamp-1">
                                            {review.proyecto_titulo}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest ${isVencida ? 'text-error' : 'text-text-dim'}`}>
                                                <Clock size={10} />
                                                {isVencida
                                                    ? `Vencida hace ${Math.abs(diasRestantes)}d`
                                                    : diasRestantes === 0
                                                        ? 'Vence hoy'
                                                        : `${diasRestantes}d restantes`
                                                }
                                            </span>
                                            {review.puntaje_total != null && (
                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${review.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                                                    <Award size={10} />
                                                    Puntaje: {review.puntaje_total.toFixed(1)}/100
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    {review.estado === 'Pendiente' ? (
                                        <button className="btn-vercel-primary flex items-center gap-2 text-xs" tabIndex={-1}>
                                            Evaluar Ahora
                                            <ChevronRight size={13} />
                                        </button>
                                    ) : (
                                        <button className="btn-vercel-secondary flex items-center gap-2 text-xs" tabIndex={-1}>
                                            Ver Detalle
                                            <ChevronRight size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default PeerReviewPage;