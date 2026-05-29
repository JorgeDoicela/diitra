import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShieldCheck, FileText, Send,
    MessageSquare, AlertCircle, CheckCircle2, XCircle,
    Loader2, BookOpen, Target, ExternalLink,
    Lock
} from 'lucide-react';
import {
    getRubricaForRevision, submitEvaluation,
    getDictamenPreview, DICTAMEN_CONFIG
} from '../../../services/peerReviewService';
import type { RubricaDinamicaDto, CriterioRubricaDto } from '../../../services/peerReviewService';
import api from '../../../api/axios_config';

// ─────────────────────────────────────────────────────────────
//  Tipos internos del formulario
// ─────────────────────────────────────────────────────────────
interface EvaluacionDetalle {
    idCriterio: number;
    criterio: string;
    puntaje: number;
    observaciones: string;
    max: number;
}

// ─────────────────────────────────────────────────────────────
//  Hooks auxiliares de UX
// ─────────────────────────────────────────────────────────────

/** Hook de animación de conteo numérico con easing cuadrático */
const useAnimatedScore = (targetValue: number, duration: number = 500): number => {
    const [displayValue, setDisplayValue] = useState(targetValue);
    const targetRef = useRef(targetValue);
    const animRef = useRef<number | null>(null);
    const startValueRef = useRef(targetValue);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (targetValue === targetRef.current) return;

        targetRef.current = targetValue;
        startValueRef.current = displayValue;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = (timestamp - startTimeRef.current) / duration;

            if (progress >= 1) {
                setDisplayValue(targetValue);
                animRef.current = null;
            } else {
                // Easing cuadrático de salida (easeOutQuad)
                const ease = progress * (2 - progress);
                const current = startValueRef.current + (targetValue - startValueRef.current) * ease;
                setDisplayValue(current);
                animRef.current = requestAnimationFrame(animate);
            }
        };

        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [targetValue, duration, displayValue]);

    return displayValue;
};

// ─────────────────────────────────────────────────────────────
//  Componente Principal
// ─────────────────────────────────────────────────────────────
const EvaluacionPage: React.FC = () => {
    const { revisionUuid } = useParams<{ revisionUuid: string }>();
    const navigate = useNavigate();

    const [rubrica, setRubrica] = useState<RubricaDinamicaDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');
    const [observacionesGral, setObservacionesGral] = useState('');

    const [detalles, setDetalles] = useState<EvaluacionDetalle[]>([]);
    const [activeTab, setActiveTab] = useState<'document' | 'rubric'>('document');

    useEffect(() => {
        if (!revisionUuid) return;
        setLoading(true);
        getRubricaForRevision(revisionUuid)
            .then((data) => {
                setRubrica(data);

                const isCompletada = data.estado_revision === 'Completada';
                let initialObservaciones = data.observaciones_gral || '';
                let initialDetalles = data.criterios.map(c => ({
                    idCriterio: c.id_criterio,
                    criterio: c.nombre,
                    puntaje: isCompletada ? (c.puntaje_obtenido ?? 0) : 0,
                    observaciones: isCompletada ? (c.observaciones_criterio ?? '') : '',
                    max: c.puntaje_maximo
                }));

                // Cargar borrador local si la revisión no está completada
                if (!isCompletada) {
                    const draftStr = localStorage.getItem(`diitra_peer_review_draft_${revisionUuid}`);
                    if (draftStr) {
                        try {
                            const draft = JSON.parse(draftStr);
                            if (draft && draft.detalles) {
                                initialDetalles = initialDetalles.map(fetched => {
                                    const draftDet = draft.detalles.find((d: any) => d.idCriterio === fetched.idCriterio);
                                    if (draftDet) {
                                        return {
                                            ...fetched,
                                            puntaje: draftDet.puntaje,
                                            observaciones: draftDet.observaciones || ''
                                        };
                                    }
                                    return fetched;
                                });
                            }
                            if (draft && typeof draft.observacionesGral === 'string') {
                                initialObservaciones = draft.observacionesGral;
                            }
                        } catch (e) {
                            console.error('[DIITRA] Error al parsear borrador local:', e);
                        }
                    }
                }

                setObservacionesGral(initialObservaciones);
                setDetalles(initialDetalles);
            })
            .catch(() => setError('No se pudo cargar la rúbrica de evaluación.'))
            .finally(() => setLoading(false));
    }, [revisionUuid]);

    const puntajeTotal = detalles.reduce((acc, d) => acc + d.puntaje, 0);
    const minimo = rubrica?.puntaje_minimo_aprobacion ?? 70;
    const dictamenPreview = getDictamenPreview(puntajeTotal, minimo);
    const dictamenCfg = DICTAMEN_CONFIG[dictamenPreview];
    const isReadOnly = rubrica?.estado_revision === 'Completada';

    // Auto-save: guardar cambios localmente con un pequeño de-bounce
    useEffect(() => {
        if (isReadOnly || loading || !revisionUuid || detalles.length === 0) return;

        const timer = setTimeout(() => {
            const draftData = {
                detalles,
                observacionesGral,
                timestamp: Date.now()
            };
            localStorage.setItem(`diitra_peer_review_draft_${revisionUuid}`, JSON.stringify(draftData));
        }, 1000);

        return () => clearTimeout(timer);
    }, [detalles, observacionesGral, isReadOnly, loading, revisionUuid]);

    // Puntaje animado
    const animatedTotalScore = useAnimatedScore(puntajeTotal);

    const handlePuntajeChange = (idx: number, val: number) => {
        setDetalles(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], puntaje: val };
            return copy;
        });
    };

    const handleObsChange = (idx: number, val: string) => {
        setDetalles(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], observaciones: val };
            return copy;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revisionUuid) return;
        if (!observacionesGral.trim()) {
            setError('Por favor, escriba una conclusión general antes de enviar la evaluación.');
            return;
        }
        setEnviando(true);
        setError('');
        try {
            await submitEvaluation({
                revision_uuid: revisionUuid,
                detalles: detalles.map(d => ({
                    id_criterio: d.idCriterio > 0 ? d.idCriterio : undefined,
                    criterio: d.criterio,
                    puntaje: d.puntaje,
                    observaciones: d.observaciones || undefined,
                })),
                observaciones_gral: observacionesGral,
            });

            // Limpiar borrador al enviar con éxito
            localStorage.removeItem(`diitra_peer_review_draft_${revisionUuid}`);
            setEnviado(true);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al enviar la evaluación. Intente de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    const handleDescargarCiego = async () => {
        if (!rubrica) return;
        try {
            const response = await api.post(
                `/projects/generate-pdf?isDraft=false&isBlind=true`,
                { uuid: rubrica.proyecto_uuid },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `PROTOCOLO_CIEGO_${rubrica.proyecto_uuid.split('-')[0].toUpperCase()}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch {
            alert('No se pudo descargar el protocolo.');
        }
    };

    const handleDescargarRubrica = async () => {
        if (!rubrica) return;
        try {
            const pertinencia = detalles.find(d => d.criterio.includes('Pertinencia'))?.puntaje ?? 0;
            const metodologia = detalles.find(d => d.criterio.includes('Metodología') || d.criterio.includes('Metodologia'))?.puntaje ?? 0;
            const viabilidad = detalles.find(d => d.criterio.includes('Viabilidad') || d.criterio.includes('Presupuesto') || d.criterio.includes('Viabilidad y Presupuesto'))?.puntaje ?? 0;
            const impacto = detalles.find(d => d.criterio.includes('Impacto'))?.puntaje ?? 0;

            const payload = {
                titulo: rubrica.proyecto_titulo,
                entity_uuid: rubrica.proyecto_uuid,
                fecha_evaluacion: new Date().toLocaleDateString('es-EC'),
                Pertinencia: pertinencia,
                Metodologia: metodologia,
                Viabilidad: viabilidad,
                Impacto: impacto,
                ComentariosGenerales: observacionesGral,
                RecomendacionFinal: puntajeTotal >= (rubrica.puntaje_minimo_aprobacion ?? 70) ? "Aprobado sin modificaciones" : "Rechazado"
            };

            const response = await api.post(
                `/documents/render?templateCode=RUBRICA_EVALUACION&isDraft=false&isBlind=true`,
                payload,
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `RUBRICA_CALIFICADA_${rubrica.proyecto_uuid.split('-')[0].toUpperCase()}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('[DIITRA] Error al descargar la rúbrica calificada:', err);
            alert('No se pudo generar ni descargar la rúbrica de evaluación.');
        }
    };

    // ─── Estado de éxito ───────────────────────────────────────
    if (enviado) {
        const cfg = DICTAMEN_CONFIG[dictamenPreview];
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center p-8 lg:p-10">
                <div className="bento-card static p-8 text-center max-w-lg w-full shadow-2xl relative z-10 border-border-hover bg-surface animate-scale-up">
                    <div className="p-6 rounded-full mx-auto mb-6 w-20 h-20 flex items-center justify-center"
                        style={{ background: cfg.bg }}>
                        {dictamenPreview === 'Aprobado'
                            ? <CheckCircle2 size={36} style={{ color: cfg.color }} />
                            : <XCircle size={36} style={{ color: cfg.color }} />
                        }
                    </div>

                    <h2 className="text-3xl font-black tracking-tighter text-text-main uppercase mb-2">
                        Evaluación Registrada
                    </h2>
                    <p className="text-text-dim text-sm mb-4">
                        Su dictamen ha sido recibido exitosamente por el comité académico.
                    </p>

                    <div className="my-6 p-4 bg-bg-deep rounded-xl border border-border-thin space-y-3">
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span className="text-xs text-text-dim">Dictamen Emitido:</span>
                            <span className="text-sm font-bold uppercase tracking-wider font-mono" style={{ color: cfg.color }}>
                                {cfg.label}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span className="text-xs text-text-dim">Puntaje Final:</span>
                            <span className="text-sm font-bold text-text-main font-mono">
                                {puntajeTotal.toFixed(1)} / 100
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-text-dim">Fecha de Registro:</span>
                            <span className="text-xs text-text-main font-semibold">
                                {new Date().toLocaleString('es-EC')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2.5 mb-8">
                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider text-left">Resumen de Calificaciones</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                            {detalles.map(d => (
                                <div key={d.idCriterio} className="flex justify-between items-center p-2.5 bg-surface-hover/30 border border-border-thin rounded-lg text-left">
                                    <span className="text-[11px] text-text-dim truncate pr-2 max-w-[125px]">{d.criterio}</span>
                                    <span className="text-[11px] font-bold text-text-main font-mono">{d.puntaje} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/revisiones')}
                        className="btn-brand w-full py-3 text-xs flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                        Volver a Mis Revisiones
                        <ArrowLeft size={12} className="rotate-180" />
                    </button>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin text-brand" />
                    <span className="text-xs font-bold uppercase tracking-widest">Cargando rúbrica...</span>
                </div>
            </main>
        );
    }

    if (!rubrica || error) {
        return (
            <main className="flex-1 bg-bg-deep p-10">
                <button onClick={() => navigate('/revisiones')} className="btn-vercel-secondary flex items-center gap-2 mb-6">
                    <ArrowLeft size={14} /> Volver
                </button>
                <div className="empty-state py-20">
                    <AlertCircle size={32} className="text-error mb-4" />
                    <p className="text-error font-bold uppercase tracking-widest text-sm">
                        {error || 'Rúbrica no disponible'}
                    </p>
                </div>
            </main>
        );
    }

    const porcentajeCompletado = (puntajeTotal / 100) * 100;
    const criteriosEvaluadosCount = detalles.filter(d => d.puntaje > 0 || d.observaciones.trim() !== '').length;

    return (
        <main className="flex-1 bg-bg-deep overflow-hidden flex flex-col">
            {/* Mobile Tab Switcher */}
            <div className="flex shrink-0 border-b border-border-thin bg-surface/30 backdrop-blur-md lg:hidden">
                <button
                    type="button"
                    onClick={() => setActiveTab('document')}
                    className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'document'
                        ? 'border-brand text-brand bg-brand/5'
                        : 'border-transparent text-text-dim'
                        }`}
                >
                    1. Protocolo
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('rubric')}
                    className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'rubric'
                        ? 'border-brand text-brand bg-brand/5'
                        : 'border-transparent text-text-dim'
                        }`}
                >
                    2. Rúbrica ({criteriosEvaluadosCount}/{detalles.length})
                </button>
            </div>

            <div className="flex h-full flex-1 flex-col lg:flex-row overflow-hidden animate-fade-in relative">

                {/* Contenido Central: Documento */}
                <section className={`flex-1 border-r border-border-thin flex flex-col bg-bg-deep overflow-hidden ${activeTab === 'document' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="px-6 py-5 border-b border-border-thin bg-surface/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/revisiones')}
                                className="p-2 rounded-xl bg-text-main/5 border border-text-main/10 text-text-dim hover:text-text-main hover:bg-text-main/10 transition-all mr-1"
                                title="Volver a Mis Revisiones"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div>
                                <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest block">
                                    Mis Revisiones / #{rubrica.id_rubrica}
                                </span>
                                <span className="text-sm font-black text-text-main uppercase tracking-tighter">Protocolo de Investigación Original</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDescargarCiego}
                                className="btn-vercel-secondary text-xs flex items-center gap-1.5 !px-3 !py-1.5"
                            >
                                <ExternalLink size={12} />
                                PDF Ciego
                            </button>
                            {isReadOnly && (
                                <button
                                    onClick={handleDescargarRubrica}
                                    className="btn-vercel-primary text-xs flex items-center gap-1.5 !px-3 !py-1.5"
                                >
                                    <FileText size={12} />
                                    Descargar Rúbrica
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-6 bg-bg-deep overflow-y-auto flex justify-center">
                        <article className="w-full bg-surface border border-border-thin rounded-2xl shadow-sm p-8 md:p-10 space-y-8 min-h-[90vh] text-text-main overflow-y-auto">
                            <div className="border-b border-border-thin pb-5 text-center space-y-1">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-dim">
                                    Instituto Superior Tecnológico Traversari
                                </p>
                                <p className="text-[11px] font-semibold text-text-dim">
                                    Dirección de Investigación y Desarrollo Tecnológico (DIITRA)
                                </p>
                                <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
                                    <div className="badge-vercel badge-vercel-info text-[10px] font-extrabold uppercase tracking-wider">
                                        {rubrica.es_doble_ciego ? 'Arbitraje Doble Ciego' : 'Arbitraje Estándar'}
                                    </div>
                                    {rubrica.es_doble_ciego && (
                                        <p className="text-[10px] text-text-dim max-w-md leading-relaxed font-medium">
                                            Identidad del autor protegida. Evalúe de forma anónima y objetiva conforme a la normativa.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-dim">Referencia del Proyecto</span>
                                <h1 className="text-2xl font-extrabold tracking-tight text-text-main leading-tight">
                                    {rubrica.proyecto_titulo}
                                </h1>
                                {rubrica.linea_investigacion && (
                                    <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                                        <Target size={11} className="text-primary" /> {rubrica.linea_investigacion}
                                    </p>
                                )}
                            </div>

                            {rubrica.descripcion_proyecto && (
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        1. Resumen / Descripción General
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.descripcion_proyecto }}
                                    />
                                </div>
                            )}

                            {rubrica.antecedentes && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        2. Antecedentes
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.antecedentes }}
                                    />
                                </div>
                            )}

                            {(rubrica.objetivo_general || rubrica.objetivos_especificos) && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        3. Objetivos
                                    </h3>
                                    {rubrica.objetivo_general && (
                                        <div className="space-y-1 bg-bg-deep p-4 rounded-xl border border-border-thin">
                                            <p className="text-[9px] font-extrabold text-text-dim uppercase tracking-widest">Objetivo General</p>
                                            <div
                                                className="text-sm text-text-dim leading-relaxed font-normal"
                                                dangerouslySetInnerHTML={{ __html: rubrica.objetivo_general }}
                                            />
                                        </div>
                                    )}
                                    {rubrica.objetivos_especificos && (
                                        <div className="space-y-1 bg-bg-deep p-4 rounded-xl border border-border-thin">
                                            <p className="text-[9px] font-extrabold text-text-dim uppercase tracking-widest">Objetivos Específicos</p>
                                            <div
                                                className="text-sm text-text-dim leading-relaxed font-normal"
                                                dangerouslySetInnerHTML={{ __html: rubrica.objetivos_especificos }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {rubrica.justificacion && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        4. Justificación
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.justificacion }}
                                    />
                                </div>
                            )}

                            {rubrica.marco_teorico && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        5. Marco Teórico
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.marco_teorico }}
                                    />
                                </div>
                            )}

                            {rubrica.metodologia && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        6. Metodología de la Investigación
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.metodologia }}
                                    />
                                </div>
                            )}

                            {rubrica.evaluacion && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        7. Método de Evaluación y Validación
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.evaluacion }}
                                    />
                                </div>
                            )}

                            {rubrica.bibliografia && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        8. Bibliografía y Referencias Fuentes
                                    </h3>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                                        dangerouslySetInnerHTML={{ __html: rubrica.bibliografia }}
                                    />
                                </div>
                            )}
                        </article>
                    </div>
                </section>

                {/* Columna Derecha: Rúbrica */}
                <div className={`w-full lg:w-[460px] shrink-0 flex flex-col bg-surface/5 overflow-hidden ${activeTab === 'rubric' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="px-6 py-5 border-b border-border-thin bg-bg-deep sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider block">
                                    {rubrica.nombre_rubrica}
                                </span>
                                <h3 className="text-base font-extrabold tracking-tight text-text-main uppercase">
                                    Evaluación Técnica
                                </h3>
                            </div>

                            <div className="text-right flex items-center gap-3">
                                <div className={`badge-vercel ${dictamenPreview === 'Aprobado' ? 'badge-vercel-success' : 'badge-vercel-error'} !px-3 !py-1.5 text-[10px] font-bold uppercase tracking-wider`}>
                                    {dictamenPreview === 'Aprobado'
                                        ? <CheckCircle2 size={13} />
                                        : <XCircle size={13} />
                                    }
                                    {dictamenCfg.label}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-text-dim font-bold">
                                        <span className="text-text-main text-2xl font-mono font-black">{animatedTotalScore.toFixed(1)}</span>/100
                                    </p>
                                    <p className="text-[8px] text-text-dim">Mín: {minimo}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(porcentajeCompletado, 100)}%`,
                                    background: dictamenCfg.color
                                }}
                            />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-text-dim font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                                Criterios Evaluados: {criteriosEvaluadosCount} / {detalles.length}
                            </span>
                            <span>
                                {Math.round((criteriosEvaluadosCount / detalles.length) * 100)}% Completado
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                            {/* Banner de Modo Lectura */}
                            {isReadOnly && (
                                <div className="bg-info/5 border border-info/20 text-info rounded-lg p-3 text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 mb-6 animate-fade-in">
                                    <Lock size={14} className="shrink-0" />
                                    <span>EVALUACIÓN REGISTRADA — MODO SÓLO LECTURA</span>
                                </div>
                            )}

                            {detalles.map((det, idx) => {
                                const criterioInfo = rubrica.criterios.find(c => c.id_criterio === det.idCriterio);
                                const porcentajeCriterio = det.max > 0 ? (det.puntaje / det.max) * 100 : 0;

                                return (
                                    <CriterioCard
                                        key={det.idCriterio}
                                        numero={idx + 1}
                                        detalle={det}
                                        criterioInfo={criterioInfo}
                                        porcentaje={porcentajeCriterio}
                                        onPuntajeChange={(v) => handlePuntajeChange(idx, v)}
                                        onObsChange={(v) => handleObsChange(idx, v)}
                                        disabled={isReadOnly}
                                    />
                                );
                            })}

                            <div className="divider-vercel" />

                            <div className="space-y-2.5">
                                <label className="section-label text-text-dim text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                                    <MessageSquare size={11} /> Conclusión General del Árbitro *
                                </label>
                                <textarea
                                    className={`input-vercel h-28 resize-none text-xs ${isReadOnly ? 'bg-surface border-dashed border-border-thin text-text-dim opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Escriba su dictamen final como árbitro. Incluya fortalezas, debilidades y recomendaciones específicas al equipo investigador..."
                                    value={observacionesGral}
                                    onChange={(e) => setObservacionesGral(e.target.value)}
                                    required
                                    disabled={isReadOnly}
                                />
                                <p className="text-[9px] text-text-dim leading-relaxed">
                                    Este campo es obligatorio y formará parte del acta de evaluación oficial del DIITRA.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-xs">
                                    <AlertCircle size={14} className="shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-bg-deep border-t border-border-thin px-6 py-4 flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="text-[8px] text-text-dim uppercase tracking-widest font-bold block">Puntaje Total</span>
                                    <span className="text-xl font-mono font-black text-text-main">{animatedTotalScore.toFixed(1)}</span>
                                    <span className="text-text-dim text-xs">/100</span>
                                </div>
                                <div
                                    className="h-6 w-[1px]"
                                    style={{ background: 'var(--color-border-thin)' }}
                                />
                                <div>
                                    <span className="text-[8px] text-text-dim uppercase tracking-widest font-bold block">Dictamen</span>
                                    <span className="text-xs font-black" style={{ color: dictamenCfg.color }}>
                                        {dictamenCfg.label}
                                    </span>
                                </div>
                            </div>

                            {isReadOnly ? (
                                <div className="badge-vercel badge-vercel-success !text-[10px] !py-2 flex items-center gap-1 animate-fade-in font-bold">
                                    <ShieldCheck size={12} className="text-success" />
                                    <span>Registrada</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-success font-black text-[10px] uppercase tracking-wide bg-success/5 border border-success/15 px-2.5 py-1.5 rounded-lg select-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        Borrador Guardado
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="btn-brand flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 hover:shadow-lg transition-all"
                                    >
                                        {enviando
                                            ? <Loader2 size={12} className="animate-spin" />
                                            : <Send size={12} />
                                        }
                                        Enviar Evaluación
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Floating Action Button for responsive view switching */}
            <div className="fixed bottom-[80px] right-6 z-50 lg:hidden animate-scale-up">
                <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'document' ? 'rubric' : 'document')}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand text-white shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold uppercase tracking-wider text-xs border border-white/10"
                >
                    {activeTab === 'document' ? (
                        <>
                            <ShieldCheck size={16} />
                            Calificar ({criteriosEvaluadosCount}/{detalles.length})
                        </>
                    ) : (
                        <>
                            <BookOpen size={16} />
                            Ver Documento
                        </>
                    )}
                </button>
            </div>
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  Componente Tarjeta de Criterio
// ─────────────────────────────────────────────────────────────
interface CriterioCardProps {
    numero: number;
    detalle: EvaluacionDetalle;
    criterioInfo?: CriterioRubricaDto;
    porcentaje: number;
    onPuntajeChange: (v: number) => void;
    onObsChange: (v: string) => void;
    disabled?: boolean;
}

const CriterioCard: React.FC<CriterioCardProps> = ({
    numero, detalle, criterioInfo, porcentaje, onPuntajeChange, onObsChange, disabled
}) => {
    const color = porcentaje >= 90
        ? 'var(--color-success)'
        : porcentaje >= 70
            ? 'var(--color-info)'
            : porcentaje >= 50
                ? 'var(--color-warning)'
                : 'var(--color-error)';

    const getCacesRango = (pct: number) => {
        if (pct < 50) return { label: 'Insatisfactorio', badgeClass: 'text-error bg-error/10 border-error/20' };
        if (pct < 70) return { label: 'Poco Satisfactorio', badgeClass: 'text-warning bg-warning/10 border-warning/20' };
        if (pct < 90) return { label: 'Satisfactorio', badgeClass: 'text-info bg-info/10 border-info/20' };
        return { label: 'Excelente', badgeClass: 'text-success bg-success/10 border-success/20' };
    };

    const cacesInfo = getCacesRango(porcentaje);

    const presets = [
        { label: 'Deficiente (25%)', pct: 0.25 },
        { label: 'Regular (50%)', pct: 0.50 },
        { label: 'Bueno (75%)', pct: 0.75 },
        { label: 'Excelente (100%)', pct: 1.00 },
    ];

    return (
        <div className="bento-card static p-5 space-y-4 hover:border-border-hover transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-black text-text-dim shrink-0">
                        {numero}
                    </span>
                    <div>
                        <h4 className="text-sm font-bold text-text-main leading-tight">{detalle.criterio}</h4>
                        {criterioInfo?.descripcion && (
                            <p className="text-[10px] text-text-dim mt-1 leading-relaxed">{criterioInfo.descripcion}</p>
                        )}
                    </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min={0}
                            max={detalle.max}
                            step={0.5}
                            value={detalle.puntaje}
                            disabled={disabled}
                            onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val)) val = 0;
                                if (val < 0) val = 0;
                                if (val > detalle.max) val = detalle.max;
                                onPuntajeChange(val);
                            }}
                            className={`w-14 h-7 text-center font-bold bg-surface focus:bg-bg-deep border border-border-thin rounded text-sm text-text-main font-mono py-0 px-1 focus:border-text-main transition-colors select-all disabled:cursor-not-allowed ${disabled ? 'bg-surface border-dashed border-border-thin text-text-dim opacity-70' : 'hover:bg-surface-hover'}`}
                            style={{ color }}
                        />
                        <span className="text-text-dim text-xs font-semibold">/{detalle.max}</span>
                    </div>
                    {criterioInfo && (
                        <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
                            Peso: {criterioInfo.peso_porcentaje}%
                        </p>
                    )}
                </div>
            </div>

            <div className="w-full bg-surface rounded-full h-1">
                <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ width: `${porcentaje}%`, background: color }}
                />
            </div>

            <div className="py-1">
                <input
                    type="range"
                    min={0}
                    max={detalle.max}
                    step={0.5}
                    value={detalle.puntaje}
                    disabled={disabled}
                    onChange={(e) => onPuntajeChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-hover rounded-lg cursor-pointer focus:outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ accentColor: color }}
                />
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Nivel CACES:</span>
                    <span className={`badge-vercel text-[9px] font-bold px-1.5 py-0.5 rounded transition-all duration-300 ${cacesInfo.badgeClass}`}>
                        {cacesInfo.label}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {presets.map(p => {
                        const targetScore = detalle.max * p.pct;
                        const isSelected = Math.abs(detalle.puntaje - targetScore) < 0.01;
                        return (
                            <button
                                key={p.label}
                                type="button"
                                disabled={disabled}
                                onClick={() => onPuntajeChange(targetScore)}
                                className={`bg-surface border border-border-thin text-text-dim font-sans text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded transition-all cursor-pointer inline-flex items-center gap-1 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-text-main hover:enabled:bg-surface-hover hover:enabled:text-text-main ${isSelected ? 'bg-text-main text-bg-deep border-text-main' : ''}`}
                            >
                                {isSelected && <span className="mr-0.5 font-bold">✓</span>}
                                {p.label.split(' ')[0]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <textarea
                className={`input-vercel !text-xs h-16 resize-none mt-2 ${disabled ? 'bg-surface border-dashed border-border-thin text-text-dim opacity-70 cursor-not-allowed' : ''}`}
                placeholder={`Justificación y observaciones específicas sobre ${detalle.criterio.toLowerCase()}...`}
                value={detalle.observaciones}
                disabled={disabled}
                onChange={(e) => onObsChange(e.target.value)}
            />
        </div>
    );
};

export default EvaluacionPage;
