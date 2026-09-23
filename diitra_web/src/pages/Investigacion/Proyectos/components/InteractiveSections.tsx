import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TimelineSection } from '../../../../components/DIITRA/sections/TimelineSection';
import { BlockClipboardWrapper } from '../../../../core/clipboard';
import { DocumentDataContext } from '../../../../core/documents/context/DocumentDataContext';
import type { CoWorkHandle } from '../../../../core/cowork/types';

const stripHtml = (html: unknown): string => {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').trim();
};

const renderHtml = (html: unknown, placeholder: string = 'No registrado') => {
    const raw = typeof html === 'string' ? html : (html ? String(html) : '');
    if (!raw || stripHtml(raw).length === 0) {
        return <p className="text-xs text-text-dim/60 italic mt-2 select-text">{placeholder}</p>;
    }
    return (
        <div 
            className="text-xs font-mono font-medium leading-relaxed text-text-main mt-2 select-text"
            dangerouslySetInnerHTML={{ __html: raw }}
        />
    );
};

const serializePresupuesto = (_data: unknown): string => {
    const list = _data as Record<string, unknown>[];
    if (!Array.isArray(list) || list.length === 0) return '(Sin ítems presupuestarios)';
    return list.map((item, idx) => {
        const partida = String(item.partida || item.tipo || item.rubro || `Ítem ${idx + 1}`);
        const detalle = String(item.detalle || item.descripcion || item.nombre || '-');
        const cantidad = Number(item.cantidad || 1);
        const unitario = Number(item.costoUnitario || item.valorUnitario || item.unitario || 0);
        const total = Number(item.subtotal || item.total || item.valor || (cantidad * unitario));
        return `${idx + 1}. [${partida}] ${detalle} | Cant: ${cantidad} x $${unitario.toFixed(2)} = $${total.toFixed(2)}`;
    }).join('\n');
};

const serializeProductos = (_data: unknown): string => {
    const list = _data as Record<string, unknown>[];
    if (!Array.isArray(list) || list.length === 0) return '(Sin entregables registrados)';
    return list.map((e, idx) => {
        const nombre = String(e.tipo || e.titulo || e.nombre || e.descripcion || `Producto ${idx + 1}`);
        const cat = e.categoria ? ` [Categoría: ${String(e.categoria)}]` : '';
        return `${idx + 1}. ${nombre}${cat}`;
    }).join('\n');
};

const serializeImpactos = (_data: unknown): string => {
    if (!_data || typeof _data !== 'object') return '(Sin impactos registrados)';
    return Object.entries(_data as Record<string, unknown>)
        .filter(([, v]) => v && String(v).trim())
        .map(([tipo, val]) => `• Impacto ${tipo}: ${stripHtml(String(val))}`)
        .join('\n');
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

interface InvestigadorItem {
    nombres_completos?: string;
    nombre?: string;
    rol?: string;
    id_sigafi?: string | number;
    identificacion?: string | number;
    horasSemanales?: number;
    horasDisponibles?: number;
    horasAsignadas?: number;
    [key: string]: unknown;
}

interface TemplateBlockItem {
    id?: string;
    type?: string;
    title?: string;
    config?: {
        fieldKey?: string;
        html?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface InteractiveSectionsProps {
    activeSection: string;
    project: ProjectDetail;
    investigadores: InvestigadorItem[];
    docSnapshot: Record<string, unknown>;
    templateBlocks?: TemplateBlockItem[];
    isLeftSidebarOpen: boolean;
    setIsLeftSidebarOpen: (open: boolean) => void;
    isHoursOk: boolean;
    teachersWithExceedingHours: InvestigadorItem[];
    getFieldCardClasses: (fieldKey: string, extraClasses?: string) => string;
    renderFieldStatusBadge: (fieldKey: string) => React.ReactNode;
    renderCommentButton: (fieldKey: string, fieldName: string) => React.ReactNode;
    setActiveCommentField: (field: string) => void;
    setIsRightSidebarOpen: (open: boolean) => void;
    getSafeArray: (value: unknown) => unknown[];
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
        <DocumentDataContext.Provider value={docSnapshot}>
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
                            <BlockClipboardWrapper
                                role="reviewer"
                                title="Tema / Nombre del Proyecto"
                                fieldKey="titulo"
                                instructions="Verificar claridad, delimitación espacial y temporal, y correspondencia con las líneas de investigación."
                                currentContent={project.title}
                            >
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
                            </BlockClipboardWrapper>

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
                                <p className="text-xs font-semibold text-text-main mt-1 select-text">{stripHtml(docSnapshot.ProgramaProyecto) || stripHtml(docSnapshot.Programa) || 'No definido o no requerido'}</p>
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
                                <p className="text-xs font-semibold text-text-main mt-1 select-text">{stripHtml(docSnapshot.GrupoInvestigacion) || stripHtml(docSnapshot.GrupoInvestigacionNombre) || 'No definido o sin grupo asociado'}</p>
                            </div>

                            {/* DOMINIO Y LÍNEAS */}
                            <BlockClipboardWrapper
                                role="reviewer"
                                title="Dominio y Líneas de Investigación"
                                fieldKey="dominio_linea"
                                instructions="Verificar correspondencia del objeto de estudio con las líneas prioritarias institucionales."
                                currentContent={`Dominio: ${project.dominio || docSnapshot.Dominio || 'N/D'} | Línea: ${project.linea || docSnapshot.LineaInvestigacion || 'N/D'} | Sublínea: ${docSnapshot.SublineaInvestigacion || 'N/D'}`}
                            >
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
                                            <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(project.dominio) || stripHtml(docSnapshot.Dominio) || 'No especificado'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Línea de Investigación</span>
                                            <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(project.linea) || stripHtml(docSnapshot.LineaInvestigacion) || 'No definida'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Sublínea</span>
                                            <p className="text-xs font-medium text-text-main mt-0.5 truncate">{stripHtml(docSnapshot.SublineaInvestigacion) || stripHtml(docSnapshot.Sublinea) || 'No registrada'}</p>
                                        </div>
                                    </div>
                                </div>
                            </BlockClipboardWrapper>

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
                            <BlockClipboardWrapper
                                role="reviewer"
                                title="Carrera y Convocatoria"
                                fieldKey="carrera"
                                instructions="Comprobar que la unidad académica y convocatoria concuerden con las bases del concurso."
                                currentContent={`Carrera: ${project.carrera || docSnapshot.Carrera || 'Institucional'} | Convocatoria: ${project.convocatoria || 'Convocatoria Regular'}`}
                            >
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
                                            <p className="text-xs font-semibold text-text-main mt-0.5">{String(project.carrera || docSnapshot.Carrera || 'Institucional')}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Convocatoria</span>
                                            <p className="text-xs font-semibold text-text-main mt-0.5 truncate">{project.convocatoria || 'Convocatoria Regular'}</p>
                                        </div>
                                    </div>
                                </div>
                            </BlockClipboardWrapper>
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
                        <BlockClipboardWrapper
                            role="reviewer"
                            title="Antecedentes de la Propuesta"
                            fieldKey="antecedentes"
                            instructions="Verificar diagnóstico de la problemática, estado del arte previo y citas bajo norma APA 7ma edición con fuentes indexadas recientes."
                            requirementText="Mínimo 300 palabras con citas académicas válidas."
                            currentContent={docSnapshot.Antecedentes}
                        >
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
                        </BlockClipboardWrapper>

                        {/* JUSTIFICACIÓN */}
                        <BlockClipboardWrapper
                            role="reviewer"
                            title="Justificación del Proyecto"
                            fieldKey="justificacion"
                            instructions="Evaluar relevancia social, pertinencia académica, viabilidad institucional y valor innovador."
                            currentContent={docSnapshot.Justificacion || docSnapshot.JustificacionInnovacion}
                        >
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
                                {renderHtml(docSnapshot.Justificacion || docSnapshot.JustificacionInnovacion, 'No especificada en el protocolo')}
                            </div>
                        </BlockClipboardWrapper>

                        {/* OBJETIVOS GENERAL Y ESPECÍFICOS */}
                        <BlockClipboardWrapper
                            role="reviewer"
                            title="Objetivos de la Investigación (General y Específicos)"
                            fieldKey="objetivos"
                            instructions="Verificar que el objetivo general plantee una meta evaluable e inicie con verbo en infinitivo. Los objetivos específicos deben ser secuenciales y abarcar la metodología."
                            currentContent={
                                `OBJETIVO GENERAL:\n${stripHtml(docSnapshot.ObjetivoGeneral) || '(No registrado)'}\n\nOBJETIVOS ESPECÍFICOS:\n` +
                                (typeof docSnapshot.ObjetivosEspecificos === 'string' && docSnapshot.ObjetivosEspecificos.trim()
                                    ? stripHtml(docSnapshot.ObjetivosEspecificos)
                                    : getSafeArray(docSnapshot.ObjetivosEspecificos).map((obj: unknown, idx: number) => {
                                        const desc = typeof obj === 'object' && obj !== null && 'descripcion' in obj
                                            ? String((obj as Record<string, unknown>).descripcion)
                                            : String(obj ?? '');
                                        return `${idx + 1}. ${stripHtml(desc)}`;
                                    }).join('\n') || '(No registrados)')
                            }
                        >
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
                                                {getSafeArray(docSnapshot.ObjetivosEspecificos).map((obj: unknown, idx: number) => {
                                                    const desc = typeof obj === 'object' && obj !== null && 'descripcion' in obj
                                                        ? String((obj as Record<string, unknown>).descripcion)
                                                        : String(obj ?? '');
                                                    return <li key={idx} className="leading-relaxed">{stripHtml(desc)}</li>;
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </BlockClipboardWrapper>

                        {/* METODOLOGÍA */}
                        <BlockClipboardWrapper
                            role="reviewer"
                            title="Metodología y Diseño Técnico"
                            fieldKey="metodologia"
                            instructions="Evaluar rigor metodológico: diseño de investigación, población/muestra, técnicas de recolección y procedimientos de análisis de resultados."
                            currentContent={docSnapshot.Metodologia || docSnapshot.MarcoTeorico}
                        >
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
                                {renderHtml(docSnapshot.Metodologia || docSnapshot.MarcoTeorico, 'No registrada')}
                            </div>
                        </BlockClipboardWrapper>

                        {/* OBJETIVOS DE DESARROLLO SOSTENIBLE (ODS) */}
                        {docSnapshot.ObjetivosDesarrolloSostenible && (
                            <div className="p-4 rounded-xl border border-border-thin bg-surface space-y-2">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Alineación con ODS</span>
                                {renderHtml(docSnapshot.ObjetivosDesarrolloSostenible, 'No registrados')}
                            </div>
                        )}
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
                    {(() => {
                        const totalPresupuesto = Number(project.presupuesto || docSnapshot.CostoTotal || 0);
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
                                <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Presupuesto Propuesto</span>
                                    <span className="text-lg font-mono font-bold text-text-main mt-2 select-text">${totalPresupuesto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                        project.convocatoriaMontoMaximo && totalPresupuesto > project.convocatoriaMontoMaximo 
                                            ? 'text-error animate-pulse' 
                                            : 'text-emerald-500'
                                    }`}>
                                        {project.convocatoriaMontoMaximo 
                                            ? `$${(project.convocatoriaMontoMaximo - totalPresupuesto).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                            : 'N/D'}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ITEMS PRESUPUESTARIOS */}
                    {(() => {
                        const items = [
                            ...getSafeArray(docSnapshot.RecursosNecesarios),
                            ...getSafeArray(docSnapshot.RecursosDisponibles),
                            ...getSafeArray(docSnapshot.Presupuesto),
                            ...getSafeArray(docSnapshot.ItemsPresupuesto)
                        ];

                        return (
                            <BlockClipboardWrapper
                                role="reviewer"
                                title="Recursos y Presupuesto Detallado"
                                fieldKey="presupuesto"
                                instructions="Auditar pertinencia de las partidas frente a las actividades y objetivos. Verificar que los rubros estén justificados y respeten el techo presupuestario de la convocatoria."
                                requirementText={`Límite Convocatoria: ${project.convocatoriaMontoMaximo ? `$${project.convocatoriaMontoMaximo.toLocaleString('es-EC', { minimumFractionDigits: 2 })}` : 'Sin Límite'}`}
                                currentContent={items}
                                contentSerializer={serializePresupuesto}
                            >
                                <div className="border border-border-thin rounded-xl overflow-hidden bg-surface select-none">
                                    <div className="px-4 py-2.5 bg-surface-hover/30 border-b border-border-thin flex justify-between items-center">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim font-mono">
                                            Desglose de Partidas y Rubros Planificados ({items.length} ítems)
                                        </span>
                                        {docSnapshot.FinanciamientoIstpet !== undefined && (
                                            <span className="text-[8px] font-mono font-semibold text-brand">
                                                Financiamiento ISTPET: {docSnapshot.FinanciamientoIstpet ? 'SÍ' : 'NO'}
                                            </span>
                                        )}
                                    </div>
                                    {items.length > 0 ? (
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-surface-hover/20 border-b border-border-thin text-[8px] font-bold text-text-dim uppercase tracking-widest">
                                                        <th className="p-3">Partida / Tipo</th>
                                                        <th className="p-3">Detalle del Recurso</th>
                                                        <th className="p-3 text-center">Cant.</th>
                                                        <th className="p-3 text-right">V. Unitario</th>
                                                        <th className="p-3 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-thin/40 font-mono text-[11px]">
                                                    {(items as Record<string, unknown>[]).map((item, idx: number) => {
                                                        const partida = String(item.partida || item.tipo || item.rubro || `Item ${idx + 1}`);
                                                        const detalle = String(item.detalle || item.descripcion || item.nombre || '-');
                                                        const cantidad = Number(item.cantidad || 1);
                                                        const totalVal = item.total ? Number(item.total) : 0;
                                                        const unitario = Number(item.costoUnitario || item.valorUnitario || item.unitario || (totalVal ? totalVal / cantidad : 0));
                                                        const total = Number(item.subtotal || item.total || item.valor || (cantidad * unitario));

                                                        return (
                                                            <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                                                                <td className="p-3 font-semibold text-text-main uppercase font-sans text-xs">{partida}</td>
                                                                <td className="p-3 text-text-dim font-sans">{detalle}</td>
                                                                <td className="p-3 text-center font-bold text-text-main">{cantidad}</td>
                                                                <td className="p-3 text-right text-text-dim">${Number(unitario).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                                                                <td className="p-3 text-right font-bold text-text-main">${Number(total).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-text-dim text-xs font-mono select-text">
                                            Total consolidado: ${Number(project.presupuesto || docSnapshot.CostoTotal || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD. Puede verificar el desglose completo en el Visor PDF.
                                        </div>
                                    )}
                                </div>
                            </BlockClipboardWrapper>
                        );
                    })()}
                </div>
            )}

            {/* 5. PRODUCTOS ESPERADOS */}
            {(activeSection === 'productos_esperados' || activeSection === 'productos') && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-productos_esperados">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">5. Productos Esperados</h3>
                            {renderFieldStatusBadge('productos_esperados')}
                        </div>
                        {renderCommentButton('productos_esperados', 'Productos Esperados')}
                    </div>

                    <BlockClipboardWrapper
                        role="reviewer"
                        title="Productos Esperados (Entregables CACES)"
                        fieldKey="productos_esperados"
                        instructions="Verificar correspondencia con la tipología oficial de entregables CACES (artículos indexados, ponencias, software o prototipos funcionales)."
                        currentContent={getSafeArray(docSnapshot.ProductosEsperados || docSnapshot.Entregables)}
                        contentSerializer={serializeProductos}
                    >
                        <div className="p-4 rounded-xl border border-border-thin bg-surface space-y-3 select-none">
                            <span className="text-[8px] font-bold text-brand uppercase tracking-widest font-mono">Entregables Planificados del Proyecto</span>
                            <ul className="list-disc pl-4 space-y-1.5 text-xs text-text-main font-medium select-text">
                                {getSafeArray(docSnapshot.ProductosEsperados || docSnapshot.Entregables).map((e: unknown, idx: number) => {
                                    const label = typeof e === 'object' && e !== null
                                        ? String((e as Record<string, unknown>).tipo || (e as Record<string, unknown>).descripcion || (e as Record<string, unknown>).nombre || '')
                                        : String(e ?? '');
                                    return (
                                        <li key={idx} className="leading-relaxed">{stripHtml(label)}</li>
                                    );
                                })}
                            </ul>
                        </div>
                    </BlockClipboardWrapper>
                </div>
            )}

            {/* 6. MATRIZ DE IMPACTO */}
            {(activeSection === 'impacto' || activeSection === 'impactos') && (
                <div className="space-y-6 animate-fade-in font-sans" id="field-card-impacto">
                    <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">6. Matriz de Impacto</h3>
                            {renderFieldStatusBadge('impacto')}
                        </div>
                        {renderCommentButton('impacto', 'Matriz de Impacto')}
                    </div>

                    <BlockClipboardWrapper
                        role="reviewer"
                        title="Matriz de Impacto"
                        fieldKey="impacto"
                        instructions="Analizar viabilidad, pertinencia de beneficiarios y aplicabilidad de los resultados en dimensiones científica, social y económica."
                        currentContent={docSnapshot.Impacto || docSnapshot.ImpactoEsperado}
                        contentSerializer={serializeImpactos}
                    >
                        <div className="p-4 rounded-xl border border-border-thin bg-surface space-y-3 select-none">
                            <span className="text-[8px] font-bold text-brand uppercase tracking-widest font-mono">Impactos Esperados del Proyecto</span>
                            {(() => {
                                const imp = docSnapshot.Impacto || docSnapshot.ImpactoEsperado;
                                if (!imp) return <p className="text-xs text-text-dim/60 italic mt-2">No descrito</p>;
                                if (typeof imp === 'string') return renderHtml(imp, 'No descrito');
                                const impEntries = Object.entries(imp).filter(([, v]) => v && String(v).trim());
                                if (impEntries.length === 0) return <p className="text-xs text-text-dim/60 italic mt-2">No descrito</p>;

                                const impactBlock = (templateBlocks || []).find((b: Record<string, unknown>) => b.type === 'impacts');
                                const customCatMap: Record<string, string> = {};
                                const config = impactBlock?.config as Record<string, unknown> | undefined;
                                if (config?.impactCategories && Array.isArray(config.impactCategories)) {
                                    (config.impactCategories as Record<string, unknown>[]).forEach((c) => {
                                        if (c.key && c.title) customCatMap[String(c.key).toLowerCase()] = String(c.title);
                                    });
                                }

                                return (
                                    <div className="space-y-3 mt-2 select-text">
                                        {impEntries.map(([tipo, valor]) => {
                                            const displayLabel = customCatMap[tipo.toLowerCase()] || `Impacto ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
                                            return (
                                                <div key={tipo} className="border-l-2 border-brand/40 pl-2.5 py-0.5">
                                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider block">{displayLabel}</span>
                                                    <div className="text-xs font-mono font-medium text-text-main mt-0.5" dangerouslySetInnerHTML={{ __html: String(valor) }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </BlockClipboardWrapper>
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

                    <BlockClipboardWrapper
                        role="reviewer"
                        title="Cronograma de Hitos y Tareas"
                        fieldKey="cronograma"
                        instructions="Verificar factibilidad temporal, coherencia de los plazos de ejecución y alineación con la fecha límite de la convocatoria."
                        currentContent={docSnapshot.Cronograma}
                    >
                        <div className="border border-border-thin rounded-xl overflow-hidden bg-surface">
                            <TimelineSection
                                cronograma={getSafeArray(docSnapshot.Cronograma)}
                                formData={docSnapshot}
                                readOnly={true}
                                cowork={{ ydoc: null, session: { lastSyncedAt: null, users: [] } } as unknown as CoWorkHandle}
                                onAdd={() => {}}
                                onRemove={() => {}}
                                onUpdate={() => {}}
                            />
                        </div>
                    </BlockClipboardWrapper>
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
                        <BlockClipboardWrapper
                            role="reviewer"
                            title="Referencias Bibliográficas"
                            fieldKey="bibliografia"
                            instructions="Verificar rigurosidad en formato APA 7ma edición, pertinencia temática y predominio de fuentes indexadas recientes (máximo 5 años)."
                            currentContent={docSnapshot.Bibliografia}
                        >
                            <div className="p-4 rounded-xl border border-border-thin bg-surface">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Bibliografía Utilizada</span>
                                {renderHtml(docSnapshot.Bibliografia, 'No registrada')}
                            </div>
                        </BlockClipboardWrapper>

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
                const isStandardBlock = block.type ? [
                    'cover', 'project_general_section', 'researchers_table',
                    'project_technical_section', 'project_budget_section',
                    'impacts', 'gantt', 'signatures', 'title'
                ].includes(block.type) : false;

                if (isStandardBlock) return null;

                const fieldKey = String(block.config?.fieldKey || block.id || `custom_block_${bIdx}`);
                const blockTitle = String(block.title || `Bloque Adicional ${bIdx + 1}`);
                const blockIdKey = block.id ? String(block.id) : '';
                const blockContent = docSnapshot[fieldKey] || (blockIdKey ? docSnapshot[blockIdKey] : undefined) || block.config?.html;

                if (activeSection !== 'all' && activeSection !== fieldKey) {
                    return null;
                }

                return (
                    <BlockClipboardWrapper
                        key={String(block.id || bIdx)}
                        role="reviewer"
                        title={blockTitle}
                        fieldKey={fieldKey}
                        instructions="Evaluar consistencia técnica y pertinencia de esta sección personalizada dentro de la propuesta de investigación."
                        currentContent={blockContent}
                    >
                        <div 
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
                    </BlockClipboardWrapper>
                );
            })}
            </div>
        </DocumentDataContext.Provider>
    );
};
