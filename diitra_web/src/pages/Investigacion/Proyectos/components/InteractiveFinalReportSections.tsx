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
    const writingSections = typeof rawWriting === 'string' ? JSON.parse(rawWriting || '{}') : rawWriting;

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-bg-deep custom-scrollbar">
            {/* Header Informativo */}
            <div className="bg-surface border border-border-thin rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="badge-vercel badge-vercel-primary !text-[10px] font-mono">
                            Cierre Institucional CACES
                        </span>
                        {project?.codigoInstitucional && (
                            <span className="badge-vercel !text-[10px] font-mono">
                                {project.codigoInstitucional}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-mono text-text-dim">
                        Estado: <strong className="text-text-main">{project?.status || 'En Revisión'}</strong>
                    </span>
                </div>
                <h1 className="text-base font-bold text-text-main leading-snug">
                    {project?.title || 'Informe Final de Investigación'}
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
                            1. Datos Generales y Resumen Ejecutivo
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
                        <p className="text-xs text-text-main font-semibold mt-1">{project?.title || 'No registrado'}</p>
                    </div>

                    <div id="field-card-linea_investigacion" className={getFieldCardClasses('linea_investigacion')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Línea de Investigación</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('linea_investigacion')}
                                {renderCommentButton('linea_investigacion', 'Línea de Investigación')}
                            </div>
                        </div>
                        <p className="text-xs text-text-main font-semibold mt-1">{project?.lineaInvestigacion || 'No especificada'}</p>
                    </div>
                </div>

                <div id="field-card-resumen_ejecutivo" className={getFieldCardClasses('resumen_ejecutivo')}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Resumen Ejecutivo de Resultados</span>
                        <div className="flex items-center gap-1.5">
                            {renderFieldStatusBadge('resumen_ejecutivo')}
                            {renderCommentButton('resumen_ejecutivo', 'Resumen Ejecutivo')}
                        </div>
                    </div>
                    <p className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap">
                        {writingSections?.resumen || writingSections?.resumen_ejecutivo || project?.descripcion || 'No registrado en la redacción final.'}
                    </p>
                </div>
            </section>

            {/* 2. Redacción Técnica y Resultados */}
            <section id="section-redaccion_tecnica" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <Award size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            2. Redacción Técnica y Cumplimiento
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
                            {writingSections?.resultados || writingSections?.resultados_principales || 'Resultados consolidados en el informe final.'}
                        </div>
                    </div>

                    <div id="field-card-discusion" className={getFieldCardClasses('discusion')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Discusión y Comparativa</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('discusion')}
                                {renderCommentButton('discusion', 'Discusión')}
                            </div>
                        </div>
                        <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                            {writingSections?.discusion || 'Discusión técnica de los hallazgos respecto al estado del arte.'}
                        </div>
                    </div>

                    <div id="field-card-conclusiones" className={getFieldCardClasses('conclusiones')}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-dim uppercase font-mono">Conclusiones y Recomendaciones</span>
                            <div className="flex items-center gap-1.5">
                                {renderFieldStatusBadge('conclusiones')}
                                {renderCommentButton('conclusiones', 'Conclusiones y Recomendaciones')}
                            </div>
                        </div>
                        <div className="text-xs text-text-main/90 leading-relaxed mt-2 whitespace-pre-wrap bg-bg-deep/50 p-3 rounded-xl border border-border-thin">
                            {writingSections?.conclusiones || 'Conclusiones finales del proyecto de investigación.'}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Equipo y Carga Horaria */}
            <section id="section-equipo" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin/60 pb-2">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-brand" />
                        <h2 className="text-xs font-bold text-text-main uppercase tracking-wider font-mono">
                            3. Equipo de Investigación Participante
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
                                        <td className="p-3 font-semibold text-text-main">{inv.nombre || inv.nombreCompleto || 'Investigador'}</td>
                                        <td className="p-3 text-text-dim">{inv.rol || inv.tipoParticipante || 'Docente'}</td>
                                        <td className="p-3 font-mono text-[11px] text-text-dim">{inv.idSigafi || inv.cedula || 'N/D'}</td>
                                        <td className="p-3 text-right font-mono font-bold text-text-main">{inv.horasSemanales || 0} h/sem</td>
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
