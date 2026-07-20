import React from 'react';
import { ArrowLeft, FileText, ExternalLink, Target } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { RubricaDinamicaDto } from '../../../../services/peerReviewService';

const sanitize = (html: string): string =>
    DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

interface ProtocoloDocumentProps {
    rubrica: RubricaDinamicaDto;
    isReadOnly: boolean;
    activeTab: 'document' | 'rubric';
    handleDescargarCiego: () => Promise<void>;
    handleDescargarRubrica: () => Promise<void>;
    navigate: any;
}

export const ProtocoloDocument: React.FC<ProtocoloDocumentProps> = ({
    rubrica,
    isReadOnly,
    activeTab,
    handleDescargarCiego,
    handleDescargarRubrica,
    navigate
}) => {
    return (
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
                        <span className="text-sm font-semibold text-text-main uppercase tracking-tighter">Protocolo de Investigación Original</span>
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
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">
                            Instituto Superior Tecnológico Traversari
                        </p>
                        <p className="text-[11px] font-semibold text-text-dim">
                            Dirección de Investigación y Desarrollo Tecnológico (DIITRA)
                        </p>
                        <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
                            <div className="badge-vercel badge-vercel-info text-[10px] font-semibold uppercase tracking-wider">
                                {rubrica.es_doble_ciego ? 'Evaluación anónima' : 'Evaluación abierta'}
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
                        <h1 className="text-2xl font-semibold tracking-tight text-text-main leading-tight">
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.descripcion_proyecto) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.antecedentes) }}
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
                                        dangerouslySetInnerHTML={{ __html: sanitize(rubrica.objetivo_general) }}
                                    />
                                </div>
                            )}
                            {rubrica.objetivos_especificos && (
                                <div className="space-y-1 bg-bg-deep p-4 rounded-xl border border-border-thin">
                                    <p className="text-[9px] font-extrabold text-text-dim uppercase tracking-widest">Objetivos Específicos</p>
                                    <div
                                        className="text-sm text-text-dim leading-relaxed font-normal"
                                        dangerouslySetInnerHTML={{ __html: sanitize(rubrica.objetivos_especificos) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.justificacion) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.marco_teorico) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.metodologia) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.evaluacion) }}
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
                                dangerouslySetInnerHTML={{ __html: sanitize(rubrica.bibliografia) }}
                            />
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
};
