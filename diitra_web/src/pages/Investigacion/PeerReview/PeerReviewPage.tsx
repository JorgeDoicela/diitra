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
    fecha_asignacion: string;
    fecha_limite: string;
    estado: 'Pendiente' | 'Completada' | 'Rechazada' | 'Expirada';
    es_externo: boolean;
}

const PeerReviewPage = () => {
    const [reviews, setReviews] = useState<PeerReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);
    const [showModal, setShowModal] = useState(false);
    
    // Evaluation Form State
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

    return (
        <main className="flex-1 bg-bg-deep p-10 overflow-y-auto">
            {/* Header */}
            <header className="mb-12 animate-fade-up">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-[0.3em] mb-2">
                    <ShieldCheck size={12} className="text-text-main" />
                    <span>Evaluación por Pares</span>
                </div>
                <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none mb-4">Revisiones Pendientes</h2>
                <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                    Usted ha sido asignado como revisor ciego para los siguientes proyectos. 
                    Por favor, evalúe con rigor científico y ética académica.
                </p>
            </header>

            {/* Content */}
            <div className="grid grid-cols-1 gap-4 animate-fade-up [animation-delay:100ms]">
                {reviews.map((review) => (
                    <div 
                        key={review.uuid} 
                        className="bento-card p-6 flex flex-col md:flex-row justify-between items-center group hover:border-text-main transition-all cursor-pointer"
                        onClick={() => { setSelectedReview(review); setShowModal(true); }}
                    >
                        <div className="flex items-center gap-6 flex-1">
                            <div className="p-3 rounded-lg bg-surface border border-border-thin group-hover:border-text-main transition-colors text-text-dim group-hover:text-text-main">
                                <FileText size={24} strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-border-thin text-text-dim">
                                        ID: {review.id_proyecto}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-text-dim font-medium uppercase tracking-widest">
                                        <Clock size={10} /> Limite: {new Date(review.fecha_limite).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold tracking-tight text-text-main group-hover:translate-x-1 transition-transform">
                                    {review.proyecto_titulo}
                                </h4>
                                <div className="flex items-center gap-4 text-[10px] text-text-dim font-medium uppercase tracking-tight">
                                    <span className="flex items-center gap-1"><CheckCircle size={12} /> {review.estado}</span>
                                    {review.es_externo && <span className="text-blue-500 font-bold tracking-widest">[PAR EXTERNO]</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <button className="flex items-center gap-2 bg-surface border border-border-thin text-text-main px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest hover:border-text-main transition-all">
                                Evaluar Proyecto
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && !loading && (
                    <div className="py-20 text-center bento-card border-dashed space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-surface border border-border-thin text-text-dim">
                            <CheckCircle size={32} />
                        </div>
                        <p className="text-text-dim font-bold uppercase tracking-widest">No tiene revisiones pendientes</p>
                    </div>
                )}
            </div>

            {/* Evaluation Modal */}
            {showModal && selectedReview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-deep/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-bg-deep border border-border-thin w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <header className="p-6 border-b border-border-thin flex justify-between items-center bg-surface/30">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tighter text-text-main uppercase">
                                    Rúbrica de Evaluación
                                </h3>
                                <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Proyecto: {selectedReview.proyecto_titulo}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: Project Details Placeholder */}
                            <div className="w-1/3 border-r border-border-thin p-6 bg-surface/10 overflow-y-auto space-y-6">
                                <h5 className="text-[10px] font-bold text-text-main uppercase tracking-widest border-b border-border-thin pb-2">Resumen del Protocolo</h5>
                                <div className="space-y-4">
                                    <p className="text-xs text-text-dim leading-relaxed">
                                        [En una implementación real, aquí se cargaría el PDF del proyecto o los campos principales: Justificación, Metodología, etc.]
                                    </p>
                                    <button className="w-full flex items-center justify-center gap-2 bg-surface border border-border-thin text-text-main py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:border-text-main">
                                        <ExternalLink size={14} /> Ver PDF Completo
                                    </button>
                                </div>
                            </div>

                            {/* Right: Evaluation Form */}
                            <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto space-y-8">
                                {evaluation.detalles.map((det, idx) => (
                                    <div key={idx} className="space-y-4 p-4 rounded bg-surface/20 border border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-text-main uppercase tracking-tight">{det.criterio}</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-text-main">{det.puntaje}/25</span>
                                            </div>
                                        </div>
                                        
                                        <input 
                                            type="range" min="0" max="25" step="0.5"
                                            className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-text-main"
                                            value={det.puntaje}
                                            onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value))}
                                        />

                                        <textarea 
                                            className="w-full bg-surface border border-border-thin rounded p-3 text-xs text-text-main outline-none focus:border-text-main transition-all h-20 resize-none"
                                            placeholder={`Observaciones sobre ${det.criterio.toLowerCase()}...`}
                                            value={det.observaciones}
                                            onChange={(e) => handleObsChange(idx, e.target.value)}
                                        ></textarea>
                                    </div>
                                ))}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <MessageSquare size={12} /> Conclusión General
                                    </label>
                                    <textarea 
                                        className="w-full bg-surface border border-border-thin rounded p-4 text-sm text-text-main outline-none focus:border-text-main transition-all h-32"
                                        placeholder="Dictamen final del revisor..."
                                        value={evaluation.observaciones_gral}
                                        onChange={(e) => setEvaluation({...evaluation, observaciones_gral: e.target.value})}
                                    ></textarea>
                                </div>

                                <div className="pt-6 flex justify-between items-center border-t border-border-thin">
                                    <div className="text-right">
                                        <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Puntaje Total</p>
                                        <p className="text-3xl font-bold tracking-tighter text-text-main">{calculateTotal()}/100</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="bg-text-main text-bg-deep px-10 py-3 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                                        >
                                            <Send size={14} /> Enviar Evaluación
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default PeerReviewPage;
