import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Clock, CheckCircle, 
    FileText, ChevronRight,
    MessageSquare, Send, X, ExternalLink
} from 'lucide-react';
import api from '../../../api/axios_config';

interface PeerReview {
    uuid: string;
    id_proyecto: number;
    proyecto_titulo: string;
    proyectoUuid?: string;
    proyecto_uuid?: string;
    fecha_asignacion: string;
    fecha_limite: string;
    estado: 'Pendiente' | 'Completada' | 'Rechazada' | 'Expirada';
    es_externo: boolean;
}

const REVIEW_STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    'Pendiente':   { label: 'Pendiente',   badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Completada':  { label: 'Completada',   badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazada':   { label: 'Rechazada',    badge: 'badge-vercel-error',   dot: 'dot-error' },
    'Expirada':    { label: 'Expirada',      badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
};

const PeerReviewPage = () => {
    const [reviews, setReviews] = useState<PeerReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);
    const [showModal, setShowModal] = useState(false);
    
    // Estados de cimiento para el detalle del protocolo a evaluar
    const [projectDetail, setProjectDetail] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    const [evaluation, setEvaluation] = useState({
        detalles: [
            { criterio: 'Pertinencia Científica', puntaje: 0, observaciones: '' },
            { criterio: 'Metodología y Rigor', puntaje: 0, observaciones: '' },
            { criterio: 'Impacto Social/Tecnológico', puntaje: 0, observaciones: '' },
            { criterio: 'Viabilidad Presupuestaria', puntaje: 0, observaciones: '' }
        ],
        observaciones_gral: ''
    });

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await api.get('/PeerReviews/pending');
            setReviews(response.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // Efecto satélite para cargar el protocolo del proyecto dinámicamente al seleccionar una revisión
    useEffect(() => {
        const fetchProjectDetail = async () => {
            if (!selectedReview) {
                setProjectDetail(null);
                return;
            }
            
            const pUuid = selectedReview.proyectoUuid || selectedReview.proyecto_uuid;
            if (!pUuid) {
                console.warn('[DIITRA] El peer review no contiene el UUID de referencia del proyecto.');
                return;
            }

            setLoadingDetail(true);
            try {
                const res = await api.get(`/projects/${pUuid}/detail`);
                setProjectDetail(res.data);
            } catch (err) {
                console.error('[DIITRA] Error al cargar detalles del proyecto para revisión:', err);
                setProjectDetail(null);
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchProjectDetail();
    }, [selectedReview]);

    const handleScoreChange = (index: number, score: number) => {
        const newDetalles = [...evaluation.detalles];
        newDetalles[index].puntaje = score;
        setEvaluation({ ...evaluation, detalles: newDetalles });
    };

    const handleObsChange = (index: number, obs: string) => {
        const newDetalles = [...evaluation.detalles];
        newDetalles[index].observaciones = obs;
        setEvaluation({ ...evaluation, detalles: newDetalles });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReview) return;

        try {
            await api.post('/PeerReviews/evaluate', {
                revision_uuid: selectedReview.uuid,
                detalles: evaluation.detalles,
                observaciones_gral: evaluation.observaciones_gral
            });
            setShowModal(false);
            fetchReviews();
            setSelectedReview(null);
        } catch (error) {
            console.error('Error submitting evaluation:', error);
        }
    };

    const calculateTotal = () => {
        const sum = evaluation.detalles.reduce((acc, curr) => acc + curr.puntaje, 0);
        return sum.toFixed(2);
    };

    const getStatusConfig = (estado: string) => {
        return REVIEW_STATUS_CONFIG[estado] || REVIEW_STATUS_CONFIG['Pendiente'];
    };

    return (
        <main className="flex-1 bg-bg-deep p-10 overflow-y-auto">
            <header className="mb-12 animate-fade-up">
                <div className="section-label mb-2">
                    <ShieldCheck size={12} className="text-text-main" />
                    <span>Evaluación por Pares</span>
                </div>
                <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none mb-4">Revisiones Pendientes</h2>
                <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                    Usted ha sido asignado como revisor ciego para los siguientes proyectos. 
                    Por favor, evalúe con rigor científico y ética académica.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 animate-fade-up [animation-delay:100ms]">
                {reviews.map((review) => {
                    const statusCfg = getStatusConfig(review.estado);
                    return (
                        <div 
                            key={review.uuid} 
                            className="bento-card p-6 flex flex-col md:flex-row justify-between items-center group cursor-pointer"
                            onClick={() => { setSelectedReview(review); setShowModal(true); }}
                        >
                            <div className="flex items-center gap-6 flex-1">
                                <div className="icon-circle-brand shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText size={24} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="status-tag text-text-dim border-border-thin">
                                            ID: {review.id_proyecto}
                                        </span>
                                        <div className={`badge-vercel ${statusCfg.badge}`}>
                                            <span className={`dot ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </div>
                                        <span className="flex items-center gap-1 text-[10px] text-text-dim font-medium uppercase tracking-widest">
                                            <Clock size={10} /> Límite: {new Date(review.fecha_limite).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold tracking-tight text-text-main group-hover:translate-x-1 transition-transform">
                                        {review.proyecto_titulo}
                                    </h4>
                                    {review.es_externo && <span className="badge-vercel badge-vercel-info text-[9px]">PAR EXTERNO</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4 md:mt-0">
                                <button className="btn-vercel-secondary flex items-center gap-2">
                                    Evaluar Proyecto
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {reviews.length === 0 && !loading && (
                    <div className="empty-state py-20">
                        <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <p className="text-text-dim font-bold uppercase tracking-widest">No tiene revisiones pendientes</p>
                    </div>
                )}
            </div>

            {showModal && selectedReview && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="modal-card modal-card--lg !max-w-4xl animate-fade-up max-h-[90vh]">
                        <div className="modal-header">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tighter text-text-main uppercase">
                                    Rúbrica de Evaluación
                                </h3>
                                <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Proyecto: {selectedReview.proyecto_titulo}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body !p-0 flex flex-1 overflow-hidden">
                            <div className="w-1/3 border-r border-border-thin p-6 bg-surface/10 space-y-6 overflow-y-auto flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="section-label pb-2">
                                        <FileText size={10} />
                                        <span>Resumen del Protocolo</span>
                                    </div>
                                    
                                    {loadingDetail ? (
                                        <div className="flex flex-col items-center py-10 gap-3">
                                            <div className="animate-spin h-6 w-6 border-t-2 border-brand rounded-full"></div>
                                            <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Cargando datos...</span>
                                        </div>
                                    ) : projectDetail ? (
                                        <div className="space-y-5 text-xs text-text-dim leading-relaxed">
                                            <div>
                                                <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Título del Proyecto</h4>
                                                <p className="font-semibold text-text-main">{projectDetail.titulo}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Director</h4>
                                                <p className="font-medium text-text-main">{projectDetail.directorProyecto || 'No especificado'}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Línea de Investigación</h4>
                                                <p className="font-medium text-text-main">{projectDetail.lineaInvestigacion || 'No especificada'}</p>
                                            </div>
                                            {projectDetail.justificacion && (
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Justificación</h4>
                                                    <div 
                                                        className="max-h-32 overflow-y-auto pr-1 scrollbar-thin bg-surface-hover/30 p-2 rounded border border-border-thin/40"
                                                        dangerouslySetInnerHTML={{ __html: projectDetail.justificacion }} 
                                                    />
                                                </div>
                                            )}
                                            {projectDetail.metodologia && (
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider mb-1">Metodología</h4>
                                                    <div 
                                                        className="max-h-32 overflow-y-auto pr-1 scrollbar-thin bg-surface-hover/30 p-2 rounded border border-border-thin/40"
                                                        dangerouslySetInnerHTML={{ __html: projectDetail.metodologia }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-text-dim leading-relaxed">
                                            No se pudo cargar la información estructurada del proyecto.
                                        </p>
                                    )}
                                </div>

                                {projectDetail && (
                                    <div className="pt-4 border-t border-border-thin/40">
                                        <button 
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const response = await api.post(`/projects/generate-pdf?isDraft=false&isBlind=true`, projectDetail, { responseType: 'blob' });
                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `PROTOCOLO_PEER_REVIEW_${projectDetail.uuid.split('-')[0].toUpperCase()}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                } catch (err) {
                                                    console.error("[DIITRA] Error al descargar PDF", err);
                                                    alert("No se pudo descargar el PDF del protocolo.");
                                                }
                                            }}
                                            className="btn-vercel-secondary w-full flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={14} /> Descargar PDF Ciego
                                        </button>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto space-y-6">
                                {evaluation.detalles.map((det, idx) => (
                                    <div key={idx} className="space-y-4 p-4 rounded bg-surface/20 border border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="section-label text-text-main">
                                                <span>{det.criterio}</span>
                                            </label>
                                            <span className="stat-number stat-number--sm !text-base">{det.puntaje}/25</span>
                                        </div>
                                        
                                        <input 
                                            type="range" min="0" max="25" step="0.5"
                                            className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-text-main"
                                            value={det.puntaje}
                                            onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value))}
                                        />

                                        <textarea 
                                            className="input-vercel !text-xs h-20 resize-none"
                                            placeholder={`Observaciones sobre ${det.criterio.toLowerCase()}...`}
                                            value={det.observaciones}
                                            onChange={(e) => handleObsChange(idx, e.target.value)}
                                        ></textarea>
                                    </div>
                                ))}

                                <div className="divider-vercel" />

                                <div className="space-y-3">
                                    <label className="section-label text-text-dim">
                                        <MessageSquare size={12} /> Conclusión General
                                    </label>
                                    <textarea 
                                        className="input-vercel h-32"
                                        placeholder="Dictamen final del revisor..."
                                        value={evaluation.observaciones_gral}
                                        onChange={(e) => setEvaluation({...evaluation, observaciones_gral: e.target.value})}
                                    ></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <p className="stat-number stat-number--sm text-text-main mr-2">
                                {calculateTotal()}<span className="text-text-dim text-sm font-normal">/100</span>
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    formNoValidate
                                    onClick={handleSubmit}
                                    className="btn-vercel-primary flex items-center gap-2"
                                >
                                    <Send size={14} /> Enviar Evaluación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default PeerReviewPage;