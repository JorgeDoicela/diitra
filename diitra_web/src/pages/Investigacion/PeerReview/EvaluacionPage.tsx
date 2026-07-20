import React from 'react';
import {
    ShieldCheck, Send, MessageSquare, AlertCircle,
    CheckCircle2, XCircle, Loader2, BookOpen, Lock, ArrowLeft
} from 'lucide-react';
import { useEvaluacionPage } from './hooks/useEvaluacionPage';
import { ProtocoloDocument } from './components/ProtocoloDocument';
import { CriterioCard } from './components/CriterioCard';
import { EvaluacionExito } from './components/EvaluacionExito';
import type { CriterioRubricaDto } from '../../../services/peerReviewService';

const EvaluacionPage: React.FC = () => {
    const {
        rubrica,
        loading,
        enviando,
        enviado,
        error,
        observacionesGral,
        setObservacionesGral,
        detalles,
        activeTab,
        setActiveTab,
        cacesRanges,
        puntajeTotal,
        minimo,
        dictamenPreview,
        dictamenCfg,
        isReadOnly,
        animatedTotalScore,
        porcentajeCompletado,
        criteriosEvaluadosCount,
        handlePuntajeChange,
        handleObsChange,
        handleSubmit,
        handleDescargarCiego,
        handleDescargarRubrica,
        navigate
    } = useEvaluacionPage();

    if (enviado) {
        return (
            <EvaluacionExito
                dictamenPreview={dictamenPreview}
                dictamenCfg={dictamenCfg}
                puntajeTotal={puntajeTotal}
                detalles={detalles}
                navigate={navigate}
            />
        );
    }

    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin text-brand" />
                    <span className="text-xs font-semibold uppercase tracking-widest">Cargando rúbrica...</span>
                </div>
            </main>
        );
    }

    if (!rubrica) {
        return (
            <main className="flex-1 bg-bg-deep p-10">
                <button onClick={() => navigate('/revisiones')} className="btn-vercel-secondary flex items-center gap-2 mb-6">
                    <ArrowLeft size={14} /> Volver
                </button>
                <div className="empty-state py-20">
                    <AlertCircle size={32} className="text-error mb-4" />
                    <p className="text-error font-semibold uppercase tracking-widest text-sm">
                        {error || 'Rúbrica no disponible'}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 bg-bg-deep overflow-hidden flex flex-col">
            {/* Mobile Tab Switcher */}
            <div className="flex shrink-0 border-b border-border-thin bg-surface/30 backdrop-blur-md lg:hidden">
                <button
                    type="button"
                    onClick={() => setActiveTab('document')}
                    className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'document'
                        ? 'border-brand text-brand bg-brand/5'
                        : 'border-transparent text-text-dim'
                        }`}
                >
                    1. Protocolo
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('rubric')}
                    className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'rubric'
                        ? 'border-brand text-brand bg-brand/5'
                        : 'border-transparent text-text-dim'
                        }`}
                >
                    2. Rúbrica ({criteriosEvaluadosCount}/{detalles.length})
                </button>
            </div>

            <div className="flex h-full flex-1 flex-col lg:flex-row overflow-hidden animate-fade-in relative">

                {/* Contenido Central: Documento */}
                <ProtocoloDocument
                    rubrica={rubrica}
                    isReadOnly={isReadOnly}
                    activeTab={activeTab}
                    handleDescargarCiego={handleDescargarCiego}
                    handleDescargarRubrica={handleDescargarRubrica}
                    navigate={navigate}
                />

                {/* Columna Derecha: Rúbrica */}
                <div className={`w-full lg:w-[460px] shrink-0 flex flex-col bg-surface/5 overflow-hidden ${activeTab === 'rubric' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="px-6 py-5 border-b border-border-thin bg-bg-deep sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider block">
                                    {rubrica.nombre_rubrica}
                                </span>
                                <h3 className="text-base font-semibold tracking-tight text-text-main uppercase">
                                    Evaluación Técnica
                                </h3>
                            </div>

                            <div className="text-right flex items-center gap-3">
                                <div className={`badge-vercel ${dictamenPreview === 'Aprobado' ? 'badge-vercel-success' : 'badge-vercel-error'} !px-3 !py-1.5 text-[10px] font-semibold uppercase tracking-wider`}>
                                    {dictamenPreview === 'Aprobado'
                                        ? <CheckCircle2 size={13} />
                                        : <XCircle size={13} />
                                    }
                                    {dictamenCfg.label}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-text-dim font-semibold">
                                        <span className="text-text-main text-2xl font-mono font-semibold">{animatedTotalScore.toFixed(1)}</span>/100
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
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-text-dim font-semibold uppercase tracking-wider">
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
                                <div className="bg-info/5 border border-info/20 text-info rounded-lg p-3 text-[10px] font-semibold tracking-wider uppercase flex items-center gap-2 mb-6 animate-fade-in">
                                    <Lock size={14} className="shrink-0" />
                                    <span>EVALUACIÓN REGISTRADA — MODO SÓLO LECTURA</span>
                                </div>
                            )}

                            {detalles.map((det, idx) => {
                                const criterioInfo = rubrica.criterios.find((c: CriterioRubricaDto) => c.id_criterio === det.idCriterio);
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
                                        cacesRanges={cacesRanges}
                                    />
                                );
                            })}

                            <div className="divider-vercel" />

                            <div className="space-y-2.5">
                                <label className="section-label text-text-dim text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1.5">
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
                                    <span className="text-[8px] text-text-dim uppercase tracking-widest font-semibold block">Puntaje Total</span>
                                    <span className="text-xl font-mono font-semibold text-text-main">{animatedTotalScore.toFixed(1)}</span>
                                    <span className="text-text-dim text-xs">/100</span>
                                </div>
                                <div
                                    className="h-6 w-[1px]"
                                    style={{ background: 'var(--color-border-thin)' }}
                                />
                                <div>
                                    <span className="text-[8px] text-text-dim uppercase tracking-widest font-semibold block">Dictamen</span>
                                    <span className="text-xs font-semibold" style={{ color: dictamenCfg.color }}>
                                        {dictamenCfg.label}
                                    </span>
                                </div>
                            </div>

                            {isReadOnly ? (
                                <div className="badge-vercel badge-vercel-success !text-[10px] !py-2 flex items-center gap-1 animate-fade-in font-semibold">
                                    <ShieldCheck size={12} className="text-success" />
                                    <span>Registrada</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-success font-semibold text-[10px] uppercase tracking-wide bg-success/5 border border-success/15 px-2.5 py-1.5 rounded-lg select-none">
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
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand text-white shadow-2xl hover:scale-105 active:scale-95 transition-all font-semibold uppercase tracking-wider text-xs border border-white/10"
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

export default EvaluacionPage;
