import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TimelineSection } from '../../../../components/DIITRA/sections/TimelineSection';

const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

const renderHtml = (html: string | null | undefined, placeholder: string = 'No registrado') => {
    if (!html || stripHtml(html).length === 0) {
        return <p className="text-xs text-text-dim/60 italic mt-2 select-text">{placeholder}</p>;
    }
    return (
        <div 
            className="text-xs font-mono font-medium leading-relaxed text-text-main mt-2 select-text"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

interface ProjectDetail {
    uuid: string;
    title: string;
    status: string;
    presupuesto: number;
    convocatoriaMontoMaximo: number | null;
    convocatoria: string;
    linea: string;
    carrera: string;
    dominio: string;
    descripcion: string;
    directorProyecto: string;
}

interface InteractiveSectionsProps {
    activeSection: string;
    project: ProjectDetail;
    investigadores: any[];
    docSnapshot: any;
    templateBlocks?: any[];
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: (open: boolean) => void;
    isHoursOk: boolean;
    teachersWithExceedingHours: any[];
    getFieldCardClasses: (fieldKey: string, extraClasses?: string) => string;
    renderFieldStatusBadge: (fieldKey: string) => React.ReactNode;
    renderCommentButton: (fieldKey: string, fieldName: string) => React.ReactNode;
    setActiveCommentField: (field: string) => void;
    setIsRightSidebarOpen: (open: boolean) => void;
    getSafeArray: (value: any) => any[];
}

export const InteractiveSections: React.FC<InteractiveSectionsProps> = ({
    activeSection,
    project,
    investigadores,
    docSnapshot,
    templateBlocks,
    isHoursOk,
    teachersWithExceedingHours,
    getFieldCardClasses,
    renderFieldStatusBadge,
    renderCommentButton,
    setActiveCommentField,
    setIsRightSidebarOpen,
    getSafeArray
}) => {
    return (
        <div className="flex-1 h-full p-8 overflow-y-auto space-y-6 relative custom-scrollbar bg-bg-deep/20">


            {/* 1. IDENTIFICACIÓN */}
            {activeSection === 'identificacion' && (
                <div className="space-y-5 animate-fade-in">
                    <div className="border-b border-border-thin/60 pb-3 font-sans">
                        <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">1. Identificación del Proyecto</h3>
                        <p className="text-[9px] text-text-dim uppercase mt-0.5 font-mono">Información general y metadatos del protocolo</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 font-sans select-none">
                        {/* TÍTULO */}
                        <div 
                            id="field-card-titulo"
                            onClick={() => { setActiveCommentField('titulo'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('titulo')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Tema / Nombre del Proyecto</span>
                                    {renderFieldStatusBadge('titulo')}
                                </div>
                                {renderCommentButton('titulo', 'Tema / Nombre')}
                            </div>
                            <p className="text-xs font-bold text-text-main leading-relaxed mt-1 select-text">{stripHtml(project.title)}</p>
                        </div>

                        {/* PROGRAMA */}
                        <div 
                            id="field-card-programa"
                            onClick={() => { setActiveCommentField('programa'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('programa')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Programa del Proyecto</span>
                                    {renderFieldStatusBadge('programa')}
                                </div>
                                {renderCommentButton('programa', 'Programa del Proyecto')}
                            </div>
                            <p className="text-xs font-semibold text-text-main mt-1 select-text">{stripHtml(docSnapshot.ProgramaProyecto) || 'No definido o no requerido'}</p>
                        </div>

                        {/* GRUPO */}
                        <div 
                            id="field-card-grupo"
                            onClick={() => { setActiveCommentField('grupo'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('grupo')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Grupo de Investigación</span>
                                    {renderFieldStatusBadge('grupo')}
                                </div>
                                {renderCommentButton('grupo', 'Grupo de Investigación')}
                            </div>
                            <p className="text-xs font-semibold text-text-main mt-1 select-text">{stripHtml(docSnapshot.GrupoInvestigacion) || 'No definido o sin grupo asociado'}</p>
                        </div>

                        {/* DOMINIO Y LÍNEAS */}
                        <div 
                            id="field-card-dominio_linea"
                            onClick={() => { setActiveCommentField('dominio_linea'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('dominio_linea', 'space-y-2.5')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">DOMINIO Y LÍNEAS DE INVESTIGACIÓN</span>
                                    {renderFieldStatusBadge('dominio_linea')}
                                </div>
                                {renderCommentButton('dominio_linea', 'Dominio y Líneas')}
                            </div>
                            <div className="grid grid-cols-3 gap-3 select-text">
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Dominio Académico</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(project.dominio) || 'Tecnologías de la Información'}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Línea de Investigación</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(project.linea)}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Sublínea</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(docSnapshot.SublineaInvestigacion) || stripHtml(docSnapshot.Sublinea) || 'No registrada'}</p>
                                </div>
                            </div>
                        </div>

                        {/* CAMPOS CACES */}
                        <div 
                            id="field-card-campos"
                            onClick={() => { setActiveCommentField('campos'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('campos', 'space-y-2.5')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">CAMPOS METADATOS CACES</span>
                                    {renderFieldStatusBadge('campos')}
                                </div>
                                {renderCommentButton('campos', 'Campos CACES')}
                            </div>
                            <div className="grid grid-cols-4 gap-3 select-text">
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Tipo</span>
                                    <p className="text-xs font-bold text-text-main mt-0.5">{stripHtml(docSnapshot.TipoInvestigacion) || 'APLICADA'}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Amplio</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(docSnapshot.CampoAmplio) || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Específico</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(docSnapshot.CampoEspecifico) || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Detallado</span>
                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(docSnapshot.CampoDetallado) || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* CARRERA */}
                        <div 
                            id="field-card-carrera"
                            onClick={() => { setActiveCommentField('carrera'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('carrera', 'space-y-2.5')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">CARRERA Y CONVOCATORIA ACTIVA</span>
                                    {renderFieldStatusBadge('carrera')}
                                </div>
                                {renderCommentButton('carrera', 'Carrera')}
                            </div>
                            <div className="grid grid-cols-2 gap-4 select-text">
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Carrera / Unidad</span>
                                    <p className="text-xs font-semibold text-text-main mt-0.5">{project.carrera || 'DESARROLLO DE SOFTWARE'}</p>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Convocatoria</span>
                                    <p className="text-xs font-semibold text-text-main mt-0.5 truncate">{project.convocatoria}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. EQUIPO HUMANO */}
            {activeSection === 'equipo' && (
                <div className="space-y-5 animate-fade-in" id="field-card-equipo">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">2. Equipo Humano del Proyecto</h3>
                            {renderFieldStatusBadge('equipo')}
                        </div>
                        {renderCommentButton('equipo', 'Equipo Humano')}
                    </div>

                    <div className="space-y-3 font-sans select-none">
                        {investigadores.map((inv, idx) => (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-xl border border-border-thin bg-surface relative flex items-center justify-between ${
                                    (inv.horasAsignadas + inv.horasSemanales) > inv.horasDisponibles ? 'border-error/20 bg-error/[0.003]' : ''
                                }`}
                            >
                                <div className="space-y-1 select-text">
                                    <p className="text-xs font-bold text-text-main uppercase">{inv.nombres_completos || inv.nombre}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10">{inv.rol}</span>
                                        <span className="text-[8px] font-mono text-text-dim">C.I. {inv.id_sigafi || inv.identificacion}</span>
                                    </div>
                                </div>
                                <div className="text-right select-text">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Carga Horaria Semanal</span>
                                    <p className="text-xs font-mono font-bold text-text-main mt-0.5">{inv.horasSemanales || 0} horas</p>
                                    <span className="text-[8px] text-text-dim block mt-0.5">
                                        Disponibles: {inv.horasDisponibles || 0}h | Asignadas: {inv.horasAsignadas || 0}h
                                    </span>
                                    {(inv.horasAsignadas + inv.horasSemanales) > inv.horasDisponibles && (
                                        <span className="text-[8px] font-bold text-error flex items-center gap-1 mt-1 animate-pulse">
                                            <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-red-500" />
                                            <span>Exceso en Período Activo (+{(inv.horasAsignadas + inv.horasSemanales) - inv.horasDisponibles}h)</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* CACES COMPLIANCE ALERT */}
                        {!isHoursOk && (
                            <div className="p-4 rounded-xl border border-error/15 bg-error/[0.015] flex gap-3 animate-pulse">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-error uppercase tracking-wider">Control de consistencia de carga horaria (CACES)</p>
                                    <p className="text-[9px] text-text-main font-mono leading-relaxed mt-1">
                                        Se detectó sobre-compromiso de horas de investigación en los docentes: {teachersWithExceedingHours.map(t => t.nombres_completos || t.nombre).join(', ')}.
                                        Ajuste el distributivo académico de distributivos activos o corrija la dedicación.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. PLAN TÉCNICO */}
            {activeSection === 'plan_tecnico' && (
                <div className="space-y-6 animate-fade-in font-sans">
                    <div className="border-b border-border-thin/60 pb-3">
                        <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">3. Plan Técnico del Proyecto</h3>
                        <p className="text-[9px] text-text-dim uppercase mt-0.5 font-mono">Justificación académica, metodológica y objetivos</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 select-none">
                        {/* ANTECEDENTES */}
                        <div 
                            id="field-card-antecedentes"
                            onClick={() => { setActiveCommentField('antecedentes'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('antecedentes')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Antecedentes de la Propuesta</span>
                                    {renderFieldStatusBadge('antecedentes')}
                                </div>
                                {renderCommentButton('antecedentes', 'Antecedentes')}
                            </div>
                             {renderHtml(docSnapshot.Antecedentes, 'No descritos en la propuesta')}
                        </div>

                        {/* JUSTIFICACIÓN */}
                        <div 
                            id="field-card-justificacion"
                            onClick={() => { setActiveCommentField('justificacion'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('justificacion')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Justificación del Proyecto</span>
                                    {renderFieldStatusBadge('justificacion')}
                                </div>
                                {renderCommentButton('justificacion', 'Justificación')}
                            </div>
                            {renderHtml(docSnapshot.Justificacion, 'No especificada en el protocolo')}
                        </div>

                        {/* OBJETIVOS GENERAL Y ESPECÍFICOS */}
                        <div 
                            id="field-card-objetivos"
                            onClick={() => { setActiveCommentField('objetivos'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('objetivos', 'space-y-4')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">OBJETIVOS DE LA INVESTIGACIÓN (GENERAL Y ESPECÍFICOS)</span>
                                    {renderFieldStatusBadge('objetivos')}
                                </div>
                                {renderCommentButton('objetivos', 'Objetivos')}
                            </div>

                            <div className="space-y-3 select-text">
                                <div>
                                    <span className="text-[8px] font-bold text-brand uppercase tracking-widest font-mono">Objetivo General</span>
                                    {renderHtml(docSnapshot.ObjetivoGeneral, 'No registrado')}
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-brand uppercase tracking-widest block font-mono mb-1">Objetivos Específicos</span>
                                    {typeof docSnapshot.ObjetivosEspecificos === 'string' && docSnapshot.ObjetivosEspecificos.trim() ? (
                                        renderHtml(docSnapshot.ObjetivosEspecificos, 'No registrados')
                                    ) : (
                                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-text-main font-medium">
                                            {getSafeArray(docSnapshot.ObjetivosEspecificos).map((obj: any, idx: number) => (
                                                <li key={idx} className="leading-relaxed">{stripHtml(obj.descripcion || obj)}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* METODOLOGÍA */}
                        <div 
                            id="field-card-metodologia"
                            onClick={() => { setActiveCommentField('metodologia'); setIsRightSidebarOpen(true); }}
                            className={getFieldCardClasses('metodologia')}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Metodología y Diseño Técnico</span>
                                    {renderFieldStatusBadge('metodologia')}
                                </div>
                                {renderCommentButton('metodologia', 'Metodología')}
                            </div>
                            {renderHtml(docSnapshot.Metodologia, 'No registrada')}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. RECURSOS Y FINANCIAMIENTO */}
            {activeSection === 'recursos' && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-presupuesto">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">4. Recursos y Presupuesto Detallado</h3>
                            {renderFieldStatusBadge('presupuesto')}
                        </div>
                        {renderCommentButton('presupuesto', 'Presupuesto')}
                    </div>

                    {/* CONTROL PRESUPUESTAL */}
                    <div className="grid grid-cols-3 gap-4 select-none">
                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Presupuesto Propuesto</span>
                            <span className="text-lg font-mono font-bold text-text-main mt-2 select-text">${project.presupuesto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Límite Convocatoria</span>
                            <span className="text-lg font-mono font-bold text-brand mt-2 select-text">
                                {project.convocatoriaMontoMaximo 
                                    ? `$${project.convocatoriaMontoMaximo.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                    : 'Sin Límite'}
                            </span>
                        </div>
                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Diferencia / Margen</span>
                            <span className={`text-lg font-mono font-bold mt-2 select-text ${
                                project.convocatoriaMontoMaximo && project.presupuesto > project.convocatoriaMontoMaximo 
                                    ? 'text-error animate-pulse' 
                                    : 'text-emerald-500'
                            }`}>
                                {project.convocatoriaMontoMaximo 
                                    ? `$${(project.convocatoriaMontoMaximo - project.presupuesto).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                    : 'N/D'}
                            </span>
                        </div>
                    </div>

                    {/* ITEMS PRESUPUESTARIOS */}
                    <div className="border border-border-thin rounded-xl overflow-hidden bg-surface select-none">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-hover/30 border-b border-border-thin text-[8px] font-bold text-text-dim uppercase tracking-widest">
                                    <th className="p-3">Partida</th>
                                    <th className="p-3">Detalle del Recurso</th>
                                    <th className="p-3 text-center">Cant.</th>
                                    <th className="p-3 text-right">Unit.</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                        </table>
                        <div className="p-8 text-center text-text-dim text-xs font-mono select-text">
                            Visualice el desglose de recursos detallados directamente en la pestaña del Visor PDF (Lado Izquierdo).
                        </div>
                    </div>
                </div>
            )}

            {/* 5. IMPACTO Y PRODUCTOS ESPERADOS */}
            {activeSection === 'impacto' && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-impacto">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">5. Impacto y Entregables del Proyecto</h3>
                            {renderFieldStatusBadge('impacto')}
                        </div>
                        {renderCommentButton('impacto', 'Impacto & Entregables')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 select-none">
                        {/* El Impacto se guarda como objeto {social, cientifico, economico, politico, ambiental, otro} */}
                        <div className="p-4 rounded-xl border border-border-thin bg-surface space-y-3">
                            <span className="text-[8px] font-bold text-brand uppercase tracking-widest font-mono">Impacto Esperado</span>
                            {(() => {
                                const imp = docSnapshot.Impacto || docSnapshot.ImpactoEsperado;
                                if (!imp) return <p className="text-xs text-text-dim/60 italic mt-2">No descrito</p>;
                                if (typeof imp === 'string') return renderHtml(imp, 'No descrito');
                                // Es un objeto con claves por categoría
                                const impEntries = Object.entries(imp).filter(([, v]) => v && String(v).trim());
                                if (impEntries.length === 0) return <p className="text-xs text-text-dim/60 italic mt-2">No descrito</p>;
                                return (
                                    <div className="space-y-2 mt-2 select-text">
                                        {impEntries.map(([tipo, valor]) => (
                                            <div key={tipo}>
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                                                <div className="text-xs font-mono font-medium text-text-main mt-0.5" dangerouslySetInnerHTML={{ __html: String(valor) }} />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="p-4 rounded-xl border border-border-thin bg-surface space-y-3">
                            <span className="text-[8px] font-bold text-brand uppercase tracking-widest font-mono">Productos / Entregables Planificados</span>
                            <ul className="list-disc pl-4 space-y-1.5 text-xs text-text-main font-medium select-text">
                                {/* El workspace lo guarda como ProductosEsperados, con fallback a Entregables */}
                                {getSafeArray(docSnapshot.ProductosEsperados || docSnapshot.Entregables).map((e: any, idx: number) => (
                                    <li key={idx} className="leading-relaxed">{stripHtml(e.tipo || e.descripcion || e)}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. CRONOGRAMA */}
            {activeSection === 'cronograma' && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-cronograma">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">6. Cronograma de Hitos y Tareas</h3>
                            {renderFieldStatusBadge('cronograma')}
                        </div>
                        {renderCommentButton('cronograma', 'Cronograma')}
                    </div>

                    <div className="border border-border-thin rounded-xl overflow-hidden bg-surface">
                        <TimelineSection
                            cronograma={getSafeArray(docSnapshot.Cronograma)}
                            formData={docSnapshot}
                            readOnly={true}
                            cowork={{ ydoc: null, session: { lastSyncedAt: null, users: [] } } as any}
                            onAdd={() => {}}
                            onRemove={() => {}}
                            onUpdate={() => {}}
                        />
                    </div>
                </div>
            )}

            {/* 7. BIBLIOGRAFÍA Y FIRMAS */}
            {activeSection === 'bibliografia' && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-bibliografia">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">7. Bibliografía y Responsabilidad</h3>
                            {renderFieldStatusBadge('bibliografia')}
                        </div>
                        {renderCommentButton('bibliografia', 'Bibliografía & Firmas')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 select-none">
                        {/* BIBLIOGRAFÍA */}
                        <div className="p-4 rounded-xl border border-border-thin bg-surface">
                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Bibliografía Utilizada</span>
                            {renderHtml(docSnapshot.Bibliografia, 'No registrada')}
                        </div>

                        {/* FIRMAS DE RESPONSABILIDAD */}
                        <div className="grid grid-cols-2 gap-4 select-text">
                            <div className="p-4 rounded-xl border border-border-thin bg-surface">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Director de Proyecto (Docente)</span>
                                <p className="text-xs font-bold text-text-main mt-1 uppercase">{stripHtml(project.directorProyecto)}</p>
                                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1 mt-2">
                                    Firmado Digitalmente
                                </span>
                            </div>
                            <div className="p-4 rounded-xl border border-border-thin bg-surface">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Coordinador de Carrera</span>
                                <p className="text-xs font-bold text-text-main mt-1">Coordinación DIITRA ISTPET</p>
                                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1 mt-2">
                                    Firmado Digitalmente
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BLOQUES DINÁMICOS PERSONALIZADOS CREADOS DESDE EL ADMIN */}
            {templateBlocks && templateBlocks.length > 0 && templateBlocks.map((block, bIdx) => {
                const isStandardBlock = [
                    'cover', 'project_general_section', 'researchers_table',
                    'project_technical_section', 'project_budget_section',
                    'impacts', 'gantt', 'signatures', 'title'
                ].includes(block.type);

                if (isStandardBlock) return null;

                const fieldKey = block.config?.fieldKey || block.id || `custom_block_${bIdx}`;
                const blockTitle = block.title || `Bloque Adicional ${bIdx + 1}`;
                const blockContent = docSnapshot[fieldKey] || docSnapshot[block.id] || block.config?.html;

                if (activeSection !== 'all' && activeSection !== fieldKey) {
                    return null;
                }

                return (
                    <div 
                        key={block.id || bIdx}
                        id={`field-card-${fieldKey}`}
                        onClick={() => { setActiveCommentField(fieldKey); setIsRightSidebarOpen(true); }}
                        className={getFieldCardClasses(fieldKey, 'space-y-3 font-sans animate-fade-in')}
                    >
                        <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">{blockTitle}</span>
                                {renderFieldStatusBadge(fieldKey)}
                            </div>
                            {renderCommentButton(fieldKey, blockTitle)}
                        </div>
                        {renderHtml(blockContent, 'Sin contenido registrado en esta sección personalizada')}
                    </div>
                );
            })}
        </div>
    );
};
