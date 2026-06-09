import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ExternalLink, Shield, FileSearch, Loader2 } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyReviews } from '../../../services/peerReviewService';
import type { PeerReviewDto } from '../../../services/peerReviewService';

export const RevisorDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<PeerReviewDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Evaluador';

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const data = await getMyReviews();
                setReviews(data);
            } catch (err) {
                console.error('[DIITRA] Error al cargar revisiones:', err);
                setError('No se pudieron cargar las asignaciones de evaluación.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const pendingReviews = reviews.filter(r => r.estado === 'Pendiente');
    const completedReviews = reviews.filter(r => r.estado === 'Completada');

    return (
        <>
            <DashboardHeader 
                title={`Bienvenido, Dr. ${firstName}`} 
                subtitle="Revisa propuestas de investigación sin conocer la identidad de los autores." 
                roleName="Evaluador Externo"
                actions={
                    <>
                        <button 
                            onClick={() => navigate('/revisiones')}
                            className="btn-vercel-primary flex-1 md:flex-none"
                        >
                            <Shield size={16} />
                            <span>Ver Asignaciones</span>
                        </button>
                    </>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : error ? (
                <div className="badge-vercel-error !rounded-xl !p-4 mt-6 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            ) : (
                <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                    <BentoCard 
                        title="Revisiones Pendientes" 
                        description="Asignaciones en espera de evaluación"
                        icon={<AlertCircle size={14} />}
                        className="md:col-span-2"
                        isStatic={true}
                    >
                        <div className="mt-4 space-y-3">
                            {pendingReviews.length === 0 ? (
                                <div className="p-4 rounded-md border border-dashed border-border-thin bg-surface/50 text-center">
                                    <p className="text-[10px] text-text-dim uppercase font-semibold">No tienes revisiones pendientes</p>
                                    <p className="text-[11px] text-text-dim mt-2 leading-relaxed">
                                        Se te notificará cuando se te asigne un nuevo proyecto para arbitraje.
                                    </p>
                                </div>
                            ) : (
                                pendingReviews.slice(0, 3).map((r) => {
                                    const title = r.es_doble_ciego
                                        ? `Propuesta #${String(r.id_proyecto).padStart(4, '0')}`
                                        : r.proyecto_titulo;
                                    const limitDate = new Date(r.fecha_limite).toLocaleDateString('es-EC', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    });
                                    return (
                                        <div 
                                            key={r.uuid}
                                            onClick={() => navigate('/revisiones')}
                                            className="p-3 rounded-md border border-border-thin bg-surface flex justify-between items-center group cursor-pointer hover:border-border-hover transition-all"
                                        >
                                            <div className="min-w-0 flex-1 pr-2">
                                                <p className="text-[10px] font-semibold text-text-main uppercase tracking-tighter truncate">{title}</p>
                                                <p className="text-[9px] text-text-dim mt-1">Límite: {limitDate}</p>
                                            </div>
                                            <ExternalLink size={12} className="text-text-dim group-hover:text-text-main transition-colors shrink-0" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </BentoCard>

                    <BentoCard 
                        title="Revisiones en curso" 
                        description="Evaluaciones que aún debes completar"
                        icon={<FileSearch size={14} />}
                        isStatic={true}
                    >
                        <div className="mt-4">
                            <p className="stat-number stat-number--sm">
                                {String(pendingReviews.length).padStart(2, '0')}
                            </p>
                            <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">
                                {pendingReviews.length === 1 ? 'Revisión en curso' : 'Revisiones en curso'}
                            </p>
                        </div>
                    </BentoCard>

                    <BentoCard 
                        title="Completadas" 
                        description="Revisiones entregadas"
                        icon={<CheckCircle2 size={14} />}
                        isStatic={true}
                    >
                        <div className="mt-4">
                            <p className="stat-number stat-number--sm">
                                {String(completedReviews.length).padStart(2, '0')}
                            </p>
                            <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">
                                Total entregadas
                            </p>
                        </div>
                    </BentoCard>

                    <BentoCard 
                        title="Garantía de Anonimato" 
                        description="Cumplimiento de estándares de revisión"
                        icon={<Shield size={14} />}
                        className="md:col-span-4"
                        isStatic={true}
                    >
                        <div className="mt-4 flex items-center gap-6 p-4 rounded-lg bg-surface/50 border border-border-thin">
                            <div className="icon-circle icon-circle-success">
                                 <Shield size={24} />
                             </div>
                            <div>
                                <p className="text-[11px] font-semibold text-text-main uppercase tracking-widest">Evaluación anónima activa</p>
                                <p className="text-[10px] text-text-dim mt-1 max-w-xl">
                                    Su identidad y la de los autores permanecen ocultas. Todas las comunicaciones se realizan a través de la plataforma.
                                </p>
                            </div>
                        </div>
                    </BentoCard>
                </BentoGrid>
            )}
        </>
    );
};
