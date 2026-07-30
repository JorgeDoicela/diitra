import React, { useMemo } from 'react';
import { ArrowLeft, FileText, ExternalLink, Target, Layers } from 'lucide-react';
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
    // Sincronización con el motor de plantillas dinámicas
    const dataJson = rubrica.dataSnapshotJson || rubrica.data_snapshot_json;
    const snapshotJson = rubrica.templateConfigSnapshotJson || rubrica.template_config_snapshot_json;

    const docSnapshot = useMemo(() => {
        if (!dataJson) return {};
        try {
            return typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
        } catch {
            return {};
        }
    }, [dataJson]);

    const templateBlocks = useMemo(() => {
        if (!snapshotJson) return [];
        try {
            return typeof snapshotJson === 'string' ? JSON.parse(snapshotJson) : snapshotJson;
        } catch {
            return [];
        }
    }, [snapshotJson]);

    // Filtrar bloques dinámicos no estándar (custom creados desde el Admin)
    const customBlocks = useMemo(() => {
        if (!Array.isArray(templateBlocks)) return [];
        const standardTypes = [
            'cover', 'project_general_section', 'researchers_table',
            'project_technical_section', 'project_budget_section',
            'impacts', 'gantt', 'signatures', 'title'
        ];
        return templateBlocks.filter(b => !standardTypes.includes(b.type));
    }, [templateBlocks]);

    // Resuelve el contenido probando primero snapshot de Yjs y luego el DTO procesado en Backend
    const getSectionContent = (fieldKey: string, fallbackValue?: string) => {
        return docSnapshot[fieldKey] || fallbackValue || null;
    };

    const renderContent = (content: any) => {
        if (!content) return null;
        if (typeof content === 'string') {
            return (
                <div
                    className="text-sm text-text-dim leading-relaxed font-normal ProseMirror-rendered"
                    dangerouslySetInnerHTML={{ __html: sanitize(content) }}
                />
            );
        }
        if (Array.isArray(content)) {
            return (
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-text-main font-medium">
                    {content.map((item: any, idx: number) => {
                        const txt = typeof item === 'object' ? item.descripcion || item.texto || JSON.stringify(item) : String(item);
                        return (
                            <li key={idx} className="leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: sanitize(txt) }} />
                        );
                    })}
                </ul>
            );
        }
        return <div className="text-sm text-text-dim leading-relaxed font-normal">{String(content)}</div>;
    };

    const descripcion = getSectionContent('DescripcionProyecto', rubrica.descripcion_proyecto);
    const antecedentes = getSectionContent('Antecedentes', rubrica.antecedentes);
    const objetivoGeneral = getSectionContent('ObjetivoGeneral', rubrica.objetivo_general);
    const objetivosEspecificos = getSectionContent('ObjetivosEspecificos', rubrica.objetivos_especificos);
    const justificacion = getSectionContent('Justificacion', rubrica.justificacion);
    const marcoTeorico = getSectionContent('MarcoTeorico', rubrica.marco_teorico);
    const metodologia = getSectionContent('Metodologia', rubrica.metodologia);
    const evaluacion = getSectionContent('Evaluacion', rubrica.evaluacion);
    const bibliografia = getSectionContent('Bibliografia', rubrica.bibliografia);

    return (
        <section className={`flex-1 border-r border-border-thin flex flex-col bg-bg-deep overflow-hidden ${activeTab === 'document' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="px-6 py-5 border-b border-border-thin bg-surface/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/revisiones')}
                        className="p-2 rounded-xl bg-text-main/5 border border-text-main/10 text-text-dim hover:text-text-main hover:bg-text-main/10 transition-all mr-1 cursor-pointer"
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
                        className="btn-vercel-secondary text-xs flex items-center gap-1.5 !px-3 !py-1.5 cursor-pointer"
                    >
                        <ExternalLink size={12} />
                        PDF Ciego
                    </button>
                    {isReadOnly && (
                        <button
                            onClick={handleDescargarRubrica}
                            className="btn-vercel-primary text-xs flex items-center gap-1.5 !px-3 !py-1.5 cursor-pointer"
                        >
                            <FileText size={12} />
                            Descargar Rúbrica
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6 bg-bg-deep overflow-y-auto flex justify-center custom-scrollbar">
                <article className="w-full bg-surface border border-border-thin rounded-2xl shadow-sm p-8 md:p-10 space-y-8 min-h-[90vh] text-text-main">
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
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-dim font-mono">Referencia del Proyecto</span>
                        <h1 className="text-2xl font-semibold tracking-tight text-text-main leading-tight">
                            {rubrica.proyecto_titulo}
                        </h1>
                        {rubrica.linea_investigacion && (
                            <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                                <Target size={11} className="text-primary" /> {rubrica.linea_investigacion}
                            </p>
                        )}
                    </div>

                    {descripcion && (
                        <div className="space-y-2 pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                1. Resumen / Descripción General
                            </h3>
                            {renderContent(descripcion)}
                        </div>
                    )}

                    {antecedentes && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                2. Antecedentes
                            </h3>
                            {renderContent(antecedentes)}
                        </div>
                    )}

                    {(objetivoGeneral || objetivosEspecificos) && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                3. Objetivos
                            </h3>
                            {objetivoGeneral && (
                                <div className="space-y-1 bg-bg-deep p-4 rounded-xl border border-border-thin">
                                    <p className="text-[9px] font-extrabold text-text-dim uppercase tracking-widest font-mono">Objetivo General</p>
                                    {renderContent(objetivoGeneral)}
                                </div>
                            )}
                            {objetivosEspecificos && (
                                <div className="space-y-1 bg-bg-deep p-4 rounded-xl border border-border-thin">
                                    <p className="text-[9px] font-extrabold text-text-dim uppercase tracking-widest font-mono">Objetivos Específicos</p>
                                    {renderContent(objetivosEspecificos)}
                                </div>
                            )}
                        </div>
                    )}

                    {justificacion && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                4. Justificación
                            </h3>
                            {renderContent(justificacion)}
                        </div>
                    )}

                    {marcoTeorico && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                5. Marco Teórico
                            </h3>
                            {renderContent(marcoTeorico)}
                        </div>
                    )}

                    {metodologia && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                6. Metodología de la Investigación
                            </h3>
                            {renderContent(metodologia)}
                        </div>
                    )}

                    {evaluacion && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                7. Método de Evaluación y Validación
                            </h3>
                            {renderContent(evaluacion)}
                        </div>
                    )}

                    {bibliografia && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                8. Bibliografía y Referencias Fuentes
                            </h3>
                            {renderContent(bibliografia)}
                        </div>
                    )}

                    {/* BLOQUES DINÁMICOS ADICIONALES (DEFINIDOS EN EL ADMIN DE PLANTILLAS) */}
                    {customBlocks.length > 0 && (
                        <div className="space-y-6 pt-4 border-t border-border-thin">
                            <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-widest font-mono">
                                <Layers size={14} />
                                Secciones Adicionales del Proyecto
                            </div>
                            {customBlocks.map((block: any, bIdx: number) => {
                                const fieldKey = block.config?.fieldKey || block.id || `custom_block_${bIdx}`;
                                const blockTitle = block.title || `Sección Adicional ${bIdx + 1}`;
                                const blockContent = docSnapshot[fieldKey] || docSnapshot[block.id] || block.config?.html;

                                if (!blockContent) return null;

                                return (
                                    <div key={block.id || bIdx} className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim border-b border-border-thin pb-1 font-mono">
                                            {bIdx + 9}. {blockTitle}
                                        </h3>
                                        {renderContent(blockContent)}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
};
