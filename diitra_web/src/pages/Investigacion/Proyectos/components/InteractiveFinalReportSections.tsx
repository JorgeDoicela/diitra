import React from 'react';
import { FileText, Award, Users } from 'lucide-react';

interface InteractiveFinalReportSectionsProps {
    activeSection?: string;
    project: any;
    investigadores: any[];
    docSnapshot: any;
    templateBlocks?: any[];
    isLeftSidebarOpen?: boolean;
    setIsLeftSidebarOpen?: (val: boolean) => void;
    getFieldCardClasses: (key: string, extra?: string) => string;
    renderFieldStatusBadge: (key: string) => React.ReactNode;
    renderCommentButton: (key: string, label: string) => React.ReactNode;
    getSafeArray?: (val: any) => any[];
}

export const InteractiveFinalReportSections: React.FC<InteractiveFinalReportSectionsProps> = ({
    project,
    investigadores,
    docSnapshot,
    getFieldCardClasses,
    renderFieldStatusBadge,
    renderCommentButton
}) => {
    const rawWriting = docSnapshot?.redaccion_informe_final || docSnapshot?.redaccionInformeFinal || {};
    const writingSections = typeof rawWriting === 'string' ? (() => { try { return JSON.parse(rawWriting); } catch { return {}; } })() : rawWriting;

    const getField = (keys: string[]): string => {
        for (const k of keys) {
            if (docSnapshot && docSnapshot[k] != null && docSnapshot[k] !== '') {
                const val = docSnapshot[k];
                if (typeof val === 'string') return cleanHtml(val);
                if (typeof val === 'object') return JSON.stringify(val, null, 2);
                return String(val);
            }
            if (writingSections && writingSections[k] != null && writingSections[k] !== '') {
                const val = writingSections[k];
                if (typeof val === 'string') return cleanHtml(val);
                if (typeof val === 'object') return JSON.stringify(val, null, 2);
                return String(val);
            }
        }
        return '';
    };

    function cleanHtml(content: string): string {
        if (!content) return '';
        return content
            .replace(/<p>/gi, '')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/&nbsp;/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .trim();
    }

    const resumenVal = getField(['Resumen', 'resumen', 'ResumenEjecutivo', 'resumen_ejecutivo', 'resumen_resultados']) || project?.descripcion || '';
    const introduccionVal = getField(['Introduccion', 'introduccion', 'Antecedentes', 'antecedentes']);
    const objetivosVal = getField(['Objetivos', 'objetivos', 'ObjetivoGeneral', 'objetivo_general', 'cumplimiento_objetivos']);
    const fundamentosVal = getField(['Fundamentos', 'fundamentos', 'MarcoTeorico', 'marco_teorico']);
    const metodosVal = getField(['Metodos', 'metodos', 'Metodologia', 'metodologia']);
    const resultadosVal = getField(['Resultados', 'resultados', 'ResultadosDiscusion', 'resultados_discusion', 'resultados_obtenidos', 'resultados_principales']);
    const productosVal = getField(['Productos', 'productos', 'ProductosEsperados', 'productos_esperados']);
    const impactosVal = getField(['Impactos', 'impactos', 'impacto_final']);
    const transferenciaVal = getField(['Transferencia', 'transferencia', 'transferencia_resultados', 'transferencia_conocimiento']);
    const financieroVal = getField(['InformeFinanciero', 'informe_financiero', 'PresupuestoEjecutado', 'presupuesto_ejecutado']);
    const conclusionesVal = getField(['Conclusiones', 'conclusiones']);
    const recomendacionesVal = getField(['Recomendaciones', 'recomendaciones']);
    const bibliografiaVal = getField(['Bibliografia', 'bibliografia', 'bibliografia_final']);
    const anexosVal = getField(['Anexos', 'anexos']);

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-bg-deep custom-scrollbar">
            {/* Header Informativo */}
            <div className="bg-surface border border-border-thin rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="badge-vercel badge-vercel-primary !text-[10px] font-mono">
                            Cierre Institucional CACES
                        </span>
                        {(project?.codigoInstitucional || project?.codigo_institucional) && (
                            <span className="badge-vercel !text-[10px] font-mono">
                                {project.codigoInstitucional || project.codigo_institucional}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-mono text-text-dim">
                        Estado: <strong className="text-text-main">{project?.status || project?.estado || 'En Revisión'}</strong>
                    </span>
                </div>
                <h1 className="text-base font-bold text-text-main leading-snug">
                    {project?.title || project?.titulo || 'Informe Final de Investigación'}
                </h1>
                <p className="text-xs text-text-dim leading-relaxed">
                    Auditoría y dictamen de cierre sobre los resultados consolidados, producción científica, balance presupuestario y cumplimiento de objetivos del proyecto.
                </p>
            </div>

            {/* 1. Datos Generales y Resumen */}
            <section id="section-datos_generales" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            1. Identificación y Resumen Ejecutivo
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div id="field-card-titulo" className={getFieldCardClasses('titulo')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Título Oficial</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('titulo')}
                                {renderCommentButton('titulo', 'Título Oficial')}
                            </div>
                        </div>
                        <p className="text-xs text-text-main font-semibold mt-1">{project?.title || project?.titulo || 'No registrado'}</p>
                    </div>

                    <div id="field-card-linea_investigacion" className={getFieldCardClasses('linea_investigacion')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Línea de Investigación</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('linea_investigacion')}
                                {renderCommentButton('linea_investigacion', 'Línea de Investigación')}
                            </div>
                        </div>
                        <p className="text-xs text-text-main font-semibold mt-1">{project?.lineaInvestigacion || project?.linea || 'No especificada'}</p>
                    </div>
                </div>

                <div id="field-card-resumen_ejecutivo" className={getFieldCardClasses('resumen_ejecutivo')}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Resumen Ejecutivo</span>
                        <div className="flex items-center gap-1.5">
                            {renderFieldStatusBadge('resumen_ejecutivo')}
                            {renderCommentButton('resumen_ejecutivo', 'Resumen Ejecutivo')}
                        </div>
                    </div>
                    <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                        {resumenVal || 'No registrado en la redacción del informe final.'}
                    </div>
                </div>
            </section>

            {/* 2. Cuerpo Científico y Metodología */}
            <section id="section-cuerpo_cientifico" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            2. Fundamentos, Objetivos y Métodos
                        </h2>
                    </div>
                </div>

                <div className="space-y-4">
                    {introduccionVal && (
                        <div id="field-card-introduccion" className={getFieldCardClasses('introduccion')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Introducción y Antecedentes</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('introduccion')}
                                    {renderCommentButton('introduccion', 'Introducción')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {introduccionVal}
                            </div>
                        </div>
                    )}

                    {objetivosVal && (
                        <div id="field-card-objetivos" className={getFieldCardClasses('objetivos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Cumplimiento de Objetivos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('objetivos')}
                                    {renderCommentButton('objetivos', 'Objetivos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {objetivosVal}
                            </div>
                        </div>
                    )}

                    {fundamentosVal && (
                        <div id="field-card-fundamentos" className={getFieldCardClasses('fundamentos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Fundamentos Teóricos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('fundamentos')}
                                    {renderCommentButton('fundamentos', 'Fundamentos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {fundamentosVal}
                            </div>
                        </div>
                    )}

                    {metodosVal && (
                        <div id="field-card-metodos" className={getFieldCardClasses('metodos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Métodos y Procedimientos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('metodos')}
                                    {renderCommentButton('metodos', 'Métodos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {metodosVal}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. Redacción Técnica, Resultados y Discusión */}
            <section id="section-redaccion_tecnica" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <Award size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            3. Resultados, Productos e Impacto
                        </h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <div id="field-card-resultados_obtenidos" className={getFieldCardClasses('resultados_obtenidos')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Resultados y Hallazgos Principales</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('resultados_obtenidos')}
                                {renderCommentButton('resultados_obtenidos', 'Resultados Obtenidos')}
                            </div>
                        </div>
                        <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                            {resultadosVal || 'No registrado en la redacción final.'}
                        </div>
                    </div>

                    {productosVal && (
                        <div id="field-card-productos" className={getFieldCardClasses('productos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Productos Científicos / Tecnológicos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('productos')}
                                    {renderCommentButton('productos', 'Productos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {productosVal}
                            </div>
                        </div>
                    )}

                    {impactosVal && (
                        <div id="field-card-impactos" className={getFieldCardClasses('impactos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Impactos Generados</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('impactos')}
                                    {renderCommentButton('impactos', 'Impactos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {impactosVal}
                            </div>
                        </div>
                    )}

                    {transferenciaVal && (
                        <div id="field-card-transferencia" className={getFieldCardClasses('transferencia')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Transferencia de Resultados</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('transferencia')}
                                    {renderCommentButton('transferencia', 'Transferencia')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {transferenciaVal}
                            </div>
                        </div>
                    )}

                    {financieroVal && (
                        <div id="field-card-informe_financiero" className={getFieldCardClasses('informe_financiero')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Informe Financiero y Ejecución de Gastos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('informe_financiero')}
                                    {renderCommentButton('informe_financiero', 'Informe Financiero')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {financieroVal}
                            </div>
                        </div>
                    )}

                    <div id="field-card-conclusiones" className={getFieldCardClasses('conclusiones')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Conclusiones</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('conclusiones')}
                                {renderCommentButton('conclusiones', 'Conclusiones')}
                            </div>
                        </div>
                        <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                            {conclusionesVal || 'No registrado en la redacción final.'}
                        </div>
                    </div>

                    {recomendacionesVal && (
                        <div id="field-card-recomendaciones" className={getFieldCardClasses('recomendaciones')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Recomendaciones</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('recomendaciones')}
                                    {renderCommentButton('recomendaciones', 'Recomendaciones')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {recomendacionesVal}
                            </div>
                        </div>
                    )}

                    {bibliografiaVal && (
                        <div id="field-card-bibliografia" className={getFieldCardClasses('bibliografia')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Bibliografía Final</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('bibliografia')}
                                    {renderCommentButton('bibliografia', 'Bibliografía')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {bibliografiaVal}
                            </div>
                        </div>
                    )}

                    {anexosVal && (
                        <div id="field-card-anexos" className={getFieldCardClasses('anexos')}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Anexos</span>
                                <div className="flex items-center gap-1.5">
                                    {renderFieldStatusBadge('anexos')}
                                    {renderCommentButton('anexos', 'Anexos')}
                                </div>
                            </div>
                            <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                                {anexosVal}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Equipo y Carga Horaria */}
            <section id="section-equipo" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            4. Equipo de Investigación Participante
                        </h2>
                    </div>
                </div>

                <div className="bg-surface border border-border-thin rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-surface-hover border-b border-border-thin text-[10px] font-mono text-text-dim uppercase tracking-wider">
                                <th className="p-3">Investigador</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3">Filiación / Cédula</th>
                                <th className="p-3 text-right">Horas Dedicadas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {investigadores.length > 0 ? (
                                investigadores.map((inv, i) => (
                                    <tr key={i} className="hover:bg-surface-hover/50 transition-colors">
                                        <td className="p-3 font-semibold text-text-main">{inv.nombre || inv.nombreCompleto || inv.nombres || 'Investigador'}</td>
                                        <td className="p-3 text-text-dim">{inv.rol || inv.tipoParticipante || 'Docente'}</td>
                                        <td className="p-3 font-mono text-[11px] text-text-dim">{inv.idSigafi || inv.cedula || 'N/D'}</td>
                                        <td className="p-3 text-right font-mono font-bold text-text-main">{inv.horasSemanales || inv.horas_semanales || 0} h/sem</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-text-dim text-xs">
                                        No se encontraron investigadores registrados en el equipo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
