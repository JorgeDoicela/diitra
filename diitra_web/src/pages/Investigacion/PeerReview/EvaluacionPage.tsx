import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShieldCheck, FileText, Send,
    MessageSquare, AlertCircle, CheckCircle2, XCircle,
    Loader2, BookOpen, Microscope, Target, ExternalLink
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

    useEffect(() => {
        if (!revisionUuid) return;
        setLoading(true);
        getRubricaForRevision(revisionUuid)
            .then((data) => {
                setRubrica(data);
                setDetalles(data.criterios.map(c => ({
                    idCriterio: c.id_criterio,
                    criterio: c.nombre,
                    puntaje: 0,
                    observaciones: '',
                    max: c.puntaje_maximo
                })));
            })
            .catch(() => setError('No se pudo cargar la rúbrica de evaluación.'))
            .finally(() => setLoading(false));
    }, [revisionUuid]);

    const puntajeTotal = detalles.reduce((acc, d) => acc + d.puntaje, 0);
    const minimo = rubrica?.puntaje_minimo_aprobacion ?? 70;
    const dictamenPreview = getDictamenPreview(puntajeTotal, minimo);
    const dictamenCfg = DICTAMEN_CONFIG[dictamenPreview];

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

    // ─── Estado de éxito ───────────────────────────────────────
    if (enviado) {
        const cfg = DICTAMEN_CONFIG[dictamenPreview];
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center p-10">
                <div className="text-center max-w-md">
                    <div className="p-6 rounded-full mx-auto mb-6 w-24 h-24 flex items-center justify-center"
                        style={{ background: cfg.bg }}>
                        {dictamenPreview === 'Aprobado'
                            ? <CheckCircle2 size={40} style={{ color: cfg.color }} />
                            : <XCircle size={40} style={{ color: cfg.color }} />
                        }
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-text-main uppercase mb-2">
                        Evaluación Enviada
                    </h2>
                    <p className="text-text-dim text-sm mb-2">
                        Su dictamen preliminar es:
                    </p>
                    <p className="text-2xl font-black mb-1" style={{ color: cfg.color }}>
                        {cfg.label}
                    </p>
                    <p className="text-text-dim text-xs mb-8">
                        Puntaje total: <span className="font-bold text-text-main">{puntajeTotal.toFixed(1)}/100</span>
                    </p>
                    <p className="text-xs text-text-dim mb-8 leading-relaxed">
                        Gracias por su contribución al proceso de evaluación por pares de DIITRA —
                        Instituto Tecnológico Traversari. Su evaluación ha sido registrada correctamente.
                    </p>
                    <button
                        onClick={() => navigate('/revisiones')}
                        className="btn-vercel-primary"
                    >
                        Volver a Mis Revisiones
                    </button>
                </div>
            </main>
        );
    }

    // ─── Loading / Error ───────────────────────────────────────
    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin" />
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

    return (
        <main className="flex-1 bg-bg-deep overflow-hidden">
            <div className="flex h-full flex-col lg:flex-row">

                {/* ─── Panel Izquierdo: Protocolo Anonimizado ─── */}
                <aside className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-border-thin flex flex-col bg-surface/5 overflow-y-auto">
                    {/* Back button */}
                    <div className="p-5 border-b border-border-thin">
                        <button
                            onClick={() => navigate('/revisiones')}
                            className="flex items-center gap-1.5 text-text-dim hover:text-text-main text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft size={12} /> Mis Revisiones
                        </button>
                    </div>

                    <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                        {/* Rúbrica info */}
                        <div>
                            <div className="section-label mb-2">
                                <ShieldCheck size={10} />
                                <span>Protocolo a Evaluar</span>
                            </div>
                            {rubrica.es_doble_ciego && (
                                <div className="flex items-center gap-1.5 mb-3">
                                    <span className="badge-vercel badge-vercel-info text-[9px]">DOBLE CIEGO</span>
                                    <span className="text-[10px] text-text-dim">Identidad del autor oculta</span>
                                </div>
                            )}
                        </div>

                        {/* Título */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Referencia</p>
                            <p className="text-base font-bold text-text-main leading-tight">{rubrica.proyecto_titulo}</p>
                        </div>

                        {/* Línea de investigación */}
                        {rubrica.linea_investigacion && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1">
                                    <Target size={9} /> Línea de Investigación
                                </p>
                                <p className="text-xs text-text-main font-medium">{rubrica.linea_investigacion}</p>
                            </div>
                        )}

                        {/* Justificación */}
                        {rubrica.justificacion && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1">
                                    <BookOpen size={9} /> Justificación
                                </p>
                                <div
                                    className="text-xs text-text-dim leading-relaxed max-h-36 overflow-y-auto p-3 rounded-lg bg-surface/30 border border-border-thin/40"
                                    dangerouslySetInnerHTML={{ __html: rubrica.justificacion }}
                                />
                            </div>
                        )}

                        {/* Metodología */}
                        {rubrica.metodologia && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1">
                                    <Microscope size={9} /> Metodología
                                </p>
                                <div
                                    className="text-xs text-text-dim leading-relaxed max-h-36 overflow-y-auto p-3 rounded-lg bg-surface/30 border border-border-thin/40"
                                    dangerouslySetInnerHTML={{ __html: rubrica.metodologia }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Descarga PDF */}
                    <div className="p-5 border-t border-border-thin">
                        <button
                            onClick={handleDescargarCiego}
                            className="btn-vercel-secondary w-full flex items-center justify-center gap-2 text-xs"
                        >
                            <ExternalLink size={12} />
                            Descargar PDF Ciego
                        </button>
                        <p className="text-[9px] text-text-dim text-center mt-2">
                            Protocolo completo sin datos identificadores
                        </p>
                    </div>
                </aside>

                {/* ─── Panel Derecho: Rúbrica Dinámica ─── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Sticky header de la rúbrica */}
                    <div className="px-8 py-5 border-b border-border-thin bg-bg-deep sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="section-label mb-1">
                                    <FileText size={10} />
                                    <span>{rubrica.nombre_rubrica}</span>
                                </div>
                                <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                    Rúbrica de Evaluación
                                </h3>
                            </div>

                            {/* Dictamen en tiempo real */}
                            <div className="text-right">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm tracking-tighter transition-all duration-300"
                                    style={{ background: dictamenCfg.bg, color: dictamenCfg.color }}
                                >
                                    {dictamenPreview === 'Aprobado'
                                        ? <CheckCircle2 size={16} />
                                        : <XCircle size={16} />
                                    }
                                    {dictamenCfg.label}
                                </div>
                                <p className="text-[10px] text-text-dim mt-1 font-bold">
                                    <span className="text-text-main text-lg font-black">{puntajeTotal.toFixed(1)}</span>/100
                                    {' '}· Mín: {minimo}
                                </p>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mt-4 w-full bg-surface rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(porcentajeCompletado, 100)}%`,
                                    background: dictamenCfg.color
                                }}
                            />
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <div className="p-8 space-y-5">
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
                                    />
                                );
                            })}

                            <div className="divider-vercel" />

                            {/* Conclusión General */}
                            <div className="space-y-3">
                                <label className="section-label text-text-dim">
                                    <MessageSquare size={12} /> Conclusión General del Árbitro *
                                </label>
                                <textarea
                                    className="input-vercel h-36 resize-none"
                                    placeholder="Escriba su dictamen final como árbitro. Incluya fortalezas, debilidades y recomendaciones específicas al equipo investigador..."
                                    value={observacionesGral}
                                    onChange={(e) => setObservacionesGral(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-text-dim">
                                    Este campo es obligatorio y formará parte del acta de evaluación oficial del DIITRA.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer sticky */}
                        <div className="sticky bottom-0 bg-bg-deep border-t border-border-thin px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold block">Puntaje Total</span>
                                    <span className="text-2xl font-black text-text-main">{puntajeTotal.toFixed(1)}</span>
                                    <span className="text-text-dim text-sm">/100</span>
                                </div>
                                <div
                                    className="h-8 w-[1px]"
                                    style={{ background: 'var(--color-border-thin)' }}
                                />
                                <div>
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold block">Dictamen</span>
                                    <span className="text-sm font-black" style={{ color: dictamenCfg.color }}>
                                        {dictamenCfg.label}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={enviando}
                                className="btn-vercel-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {enviando
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Send size={14} />
                                }
                                Enviar Evaluación
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  Sub-componente: Criterio con slider y barra de progreso
// ─────────────────────────────────────────────────────────────
interface CriterioCardProps {
    numero: number;
    detalle: EvaluacionDetalle;
    criterioInfo?: CriterioRubricaDto;
    porcentaje: number;
    onPuntajeChange: (v: number) => void;
    onObsChange: (v: string) => void;
}

const CriterioCard: React.FC<CriterioCardProps> = ({
    numero, detalle, criterioInfo, porcentaje, onPuntajeChange, onObsChange
}) => {
    const color = porcentaje >= 70 ? '#22c55e' : porcentaje >= 40 ? '#f0a500' : '#6b7280';

    return (
        <div className="bento-card p-5 space-y-4">
            {/* Header del criterio */}
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
                <div className="text-right shrink-0">
                    <span className="text-xl font-black leading-none" style={{ color }}>
                        {detalle.puntaje.toFixed(1)}
                    </span>
                    <span className="text-text-dim text-xs">/{detalle.max}</span>
                    {criterioInfo && (
                        <p className="text-[9px] text-text-dim mt-1">Peso: {criterioInfo.peso_porcentaje}%</p>
                    )}
                </div>
            </div>

            {/* Barra de progreso visual */}
            <div className="w-full bg-surface rounded-full h-1.5">
                <div
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${porcentaje}%`, background: color }}
                />
            </div>

            {/* Slider */}
            <input
                type="range"
                min={0}
                max={detalle.max}
                step={0.5}
                value={detalle.puntaje}
                onChange={(e) => onPuntajeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: color }}
            />

            {/* Observaciones del criterio */}
            <textarea
                className="input-vercel !text-xs h-16 resize-none"
                placeholder={`Observaciones sobre ${detalle.criterio.toLowerCase()}...`}
                value={detalle.observaciones}
                onChange={(e) => onObsChange(e.target.value)}
            />
        </div>
    );
};

export default EvaluacionPage;
