import React, { useRef, useEffect } from 'react';
import {
    useSortable,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Layers, Trash2, Eye, EyeOff, Copy
} from 'lucide-react';
import type { DocumentBlock, GanttObjective, TableSection } from '../types';

interface BlockCanvasProps {
    blocks: DocumentBlock[];
    activeBlockId: string | null;
    onSelectBlock: (id: string) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    templateName?: string;
    isDirty?: boolean;
    headerCollapsed?: boolean;
    onToggleHeader?: () => void;
    rightActions?: React.ReactNode;
}

const COLORS = {
    blue: '#1e2a4a',
    gold: '#b8912e',
    gray: '#475569',
    lightBlue: '#f0f3f9',
};


// ─────────────────────────────────────────────────────────────────────────────
// Sub-renderizadores estáticos de alta fidelidad para el lienzo A4
// ─────────────────────────────────────────────────────────────────────────────

const RenderCover: React.FC<{ config: any }> = ({ config }) => {
    const color = config.colorTema || COLORS.blue;
    return (
        <div className="relative rounded-md p-8 flex flex-col justify-between min-h-[480px] overflow-hidden bg-white select-none">
            <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
                    INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI
                </span>
                <h1 className="text-xl font-black mt-12 tracking-tight uppercase" style={{ color }}>
                    {config.tituloSuperior || 'TÍTULO DE LA PLANTILLA'}
                </h1>
            </div>

            <div className="space-y-4 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {config.carreraPorDefecto || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE'}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">
                    {config.periodoPorDefecto || 'PERIODO ACADÉMICO 2026-2026'}
                </div>
            </div>
        </div>
    );
};

const RenderTitle: React.FC<{ config: any }> = ({ config }) => {
    const text = config.text || 'Título de Sección';
    const level = config.level || 'h1';

    if (level === 'h1') {
        return (
            <h1 className="text-sm font-black uppercase mb-2 mt-4 tracking-wider flex items-center justify-between" style={{ color: COLORS.blue }}>
                <span>{text}</span>
            </h1>
        );
    }
    if (level === 'h2') {
        return (
            <h2 className="text-xs font-black text-white px-3 py-2 uppercase tracking-wide mb-2 mt-4" style={{ backgroundColor: COLORS.blue }}>
                {text}
            </h2>
        );
    }
    return (
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 mt-3" style={{ color: COLORS.gold }}>
            {text}
        </h3>
    );
};

const RenderRichText: React.FC<{ config: any }> = ({ config }) => {
    const html = config.html || '<p className="text-gray-400 italic">Escribe el contenido enriquecido aquí...</p>';
    return (
        <div className="space-y-2">
            <div
                className="prose max-w-none text-xs leading-relaxed text-[#1e2a4a]/90 tiptap-editor"
                dangerouslySetInnerHTML={{ __html: html }}
            />
            <p className="text-[8px] text-pink-500 font-black border-t border-dashed border-pink-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                Los investigadores completarán este apartado en la pestaña "Plan Técnico" del Workspace.
            </p>
        </div>
    );
};

const RenderAdvancedTable: React.FC<{ config: any }> = ({ config }) => {
    const headers = config.headers || ['Columna 1', 'Columna 2'];
    const rows = config.rows || [{ cells: ['Dato A', 'Dato B'] }];
    const headerStyle = config.headerStyle || 'blue';
    const colWidths = config.colWidths || [];

    return (
        <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        {headers.map((h: string, i: number) => (
                            <th
                                key={i}
                                className="border border-slate-300 p-2 font-bold text-left uppercase text-[9px]"
                                style={{
                                    backgroundColor: headerStyle === 'blue' ? COLORS.blue : headerStyle === 'gold' ? COLORS.gold : headerStyle === 'gray' ? COLORS.gray : '#f8fafc',
                                    color: headerStyle !== 'none' ? 'white' : '#1e2a4a',
                                    width: colWidths[i] || 'auto'
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any, rIdx: number) => {
                        const cells = Array.isArray(row) ? row : (row.cells || []);
                        return (
                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                {cells.map((cell: string, cIdx: number) => (
                                    <td key={cIdx} className="border border-slate-200 p-2 text-slate-700 leading-normal">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const RenderMultiSectionTable: React.FC<{ config: any }> = ({ config }) => {
    const sections: TableSection[] = config.sections || [];
    if (sections.length === 0) {
        return <div className="text-[10px] text-slate-400 italic p-2 border rounded border-dashed text-center">Sin sub-tablas agregadas</div>;
    }
    return (
        <div className="space-y-4 my-2">
            {sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1">
                    <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-wider">{sec.title || `Sub-tabla N° ${sIdx + 1}`}</h5>
                    <table className="w-full border-collapse text-[10px] border border-slate-200">
                        <thead>
                            <tr>
                                {sec.headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="border border-slate-300 p-1.5 font-bold text-left uppercase text-[8.5px]"
                                        style={{
                                            backgroundColor: sec.headerStyle === 'blue' ? COLORS.blue : sec.headerStyle === 'gold' ? COLORS.gold : sec.headerStyle === 'gray' ? COLORS.gray : '#f8fafc',
                                            color: sec.headerStyle !== 'none' ? 'white' : '#1e2a4a',
                                            width: sec.colWidths?.[i] || 'auto'
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sec.rows.map((row: any, rIdx) => {
                                const cells = Array.isArray(row) ? row : (row.cells || []);
                                return (
                                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                        {cells.map((cell: any, cIdx: number) => (
                                            <td key={cIdx} className="border border-slate-200 p-1.5 text-slate-700">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

const RenderTwoColumn: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="grid grid-cols-2 gap-3 my-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="flex flex-col border-r border-slate-200">
                <div className="p-2 font-bold text-[9px] uppercase text-white" style={{
                    backgroundColor: config.leftHeaderStyle === 'blue' ? COLORS.blue : config.leftHeaderStyle === 'gold' ? COLORS.gold : config.leftHeaderStyle === 'gray' ? COLORS.gray : '#f8fafc',
                    color: config.leftHeaderStyle !== 'none' ? 'white' : '#1e2a4a'
                }}>
                    {config.leftTitle || 'COLUMNA IZQUIERDA'}
                </div>
                <div
                    className="p-3 text-[10px] text-slate-700 rich-content tiptap-editor"
                    dangerouslySetInnerHTML={{ __html: config.leftContent || '' }}
                />
            </div>
            <div className="flex flex-col">
                <div className="p-2 font-bold text-[9px] uppercase text-white" style={{
                    backgroundColor: config.rightHeaderStyle === 'blue' ? COLORS.blue : config.rightHeaderStyle === 'gold' ? COLORS.gold : config.rightHeaderStyle === 'gray' ? COLORS.gray : '#f8fafc',
                    color: config.rightHeaderStyle !== 'none' ? 'white' : '#1e2a4a'
                }}>
                    {config.rightTitle || 'COLUMNA DERECHA'}
                </div>
                <div
                    className="p-3 text-[10px] text-slate-700 rich-content tiptap-editor"
                    dangerouslySetInnerHTML={{ __html: config.rightContent || '' }}
                />
            </div>
        </div>
    );
};

const RenderGantt: React.FC<{ config: any }> = ({ config }) => {
    const months = config.ganttMonths || [
        'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
        'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Febrero'
    ];
    const objectives: GanttObjective[] = config.ganttObjectives || [];

    const isInRange = (startMonth: number, startWeek: number, endMonth: number, endWeek: number, mIdx: number, wIdx: number): boolean => {
        const startGlobal = startMonth * 4 + startWeek;
        const endGlobal = endMonth * 4 + endWeek;
        const cellGlobal = mIdx * 4 + wIdx;
        return cellGlobal >= startGlobal && cellGlobal <= endGlobal;
    };

    return (
        <div className="overflow-x-auto my-2 border border-slate-200 rounded-lg">
            <table className="w-full border-collapse text-[9px] min-w-[700px]">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Objetivos</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>N°</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Actividades</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Recursos</th>
                        {months.map((m: string, i: number) => (
                            <th key={i} className="border border-slate-300 p-1 bg-[#1e2a4a] text-white text-center font-bold" colSpan={4}>
                                {m}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {months.map(() =>
                            [1, 2, 3, 4].map((w) => (
                                <th key={w} className="border border-slate-300 p-0.5 bg-[#1e2a4a] text-white text-[7px] text-center font-semibold">
                                    {w}
                                </th>
                            ))
                        )}
                    </tr>
                </thead>
                <tbody>
                    {objectives.map((obj, oIdx) => {
                        const acts = obj.activities.length > 0 ? obj.activities : [{ id: '', name: '(sin actividades)', resources: '', startMonth: 0, startWeek: 0, endMonth: 0, endWeek: 0, color: '#64748b' as const }];
                        return acts.map((act, aIdx) => (
                            <tr key={act.id || aIdx} className="hover:bg-slate-50/50">
                                {aIdx === 0 && (
                                    <td
                                        className="border border-slate-300 p-2 font-bold bg-slate-50/80 text-center align-middle text-[9px] w-8 uppercase text-slate-600"
                                        rowSpan={acts.length}
                                        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                                    >
                                        OBJ {oIdx + 1}
                                    </td>
                                )}
                                <td className="border border-slate-200 p-1 text-center font-bold text-slate-500">{aIdx + 1}</td>
                                <td className="border border-slate-200 p-1.5 font-semibold text-slate-700">{act.name}</td>
                                <td className="border border-slate-200 p-1 text-slate-400 text-[8px] leading-tight">{act.resources}</td>
                                {months.map((_, mIdx) =>
                                    [0, 1, 2, 3].map((wIdx) => {
                                        const filled = isInRange(act.startMonth, act.startWeek, act.endMonth, act.endWeek, mIdx, wIdx);
                                        return (
                                            <td
                                                key={`${mIdx}-${wIdx}`}
                                                className="border border-slate-200 p-0"
                                                style={{ backgroundColor: filled ? act.color : 'transparent' }}
                                            />
                                        );
                                    })
                                )}
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
            <p className="text-[8px] text-indigo-500 font-black border-t border-dashed border-indigo-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Los investigadores gestionarán el cronograma en la pestaña "Cronograma (Gantt)" del Workspace.
            </p>
        </div>
    );
};

const RenderSignatures: React.FC<{ config: any }> = ({ config }) => {
    const signatories = config.signatories || [
        { label: 'Elaborado por:', name: '[Director de Proyecto]', role: 'Docente Investigador' },
        { label: 'Aprobado por:', name: '[Rector/Director]', role: 'Comisión de Investigación' }
    ];
    return (
        <div className="mt-8 select-none">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center">
                {signatories.map((sig: any, idx: number) => (
                    <div key={idx} className="text-center pt-8 border-t border-slate-300 max-w-[180px] mx-auto flex flex-col gap-0.5">
                        <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">{sig.label}</span>
                        <span className="text-[9.5px] font-black text-slate-800 leading-snug">{sig.name}</span>
                        <span className="text-[8.5px] font-medium text-slate-500 leading-snug">{sig.role}</span>
                    </div>
                ))}
            </div>
            {config.textoPieFirma && (
                <p className="text-[8px] text-slate-400 border-t border-dashed mt-4 pt-1.5 text-center leading-normal">
                    {config.textoPieFirma}
                </p>
            )}
        </div>
    );
};

const RenderResearchersTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Tabla de Participantes (Investigadores del Proyecto)</span>
            </div>
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Nombre Completo</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Rol en Proyecto</th>
                        {config.mostrarCedula !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Cédula</th>}
                        {config.mostrarEmail !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Email</th>}
                        {config.mostrarTelefono !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Teléfono</th>}
                        {config.mostrarNivelAcademico !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Nivel Académico</th>}
                        {config.mostrarHoras !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Horas</th>}
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800 font-semibold">[Nombre del Director]</td>
                        <td className="border border-slate-200 p-2 text-slate-600">Director de Proyecto</td>
                        {config.mostrarCedula !== false && <td className="border border-slate-200 p-2 text-slate-500">17XXXXXX89</td>}
                        {config.mostrarEmail !== false && <td className="border border-slate-200 p-2 text-slate-500">director@istpet.edu.ec</td>}
                        {config.mostrarTelefono !== false && <td className="border border-slate-200 p-2 text-slate-500">0987654321</td>}
                        {config.mostrarNivelAcademico !== false && <td className="border border-slate-200 p-2 text-slate-500">Magíster / PhD</td>}
                        {config.mostrarHoras !== false && <td className="border border-slate-200 p-2 text-slate-600 font-bold">20 hs</td>}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800 font-semibold">[Nombre de Docente]</td>
                        <td className="border border-slate-200 p-2 text-slate-600">Docente Colaborador</td>
                        {config.mostrarCedula !== false && <td className="border border-slate-200 p-2 text-slate-500">17XXXXXX75</td>}
                        {config.mostrarEmail !== false && <td className="border border-slate-200 p-2 text-slate-500">docente@istpet.edu.ec</td>}
                        {config.mostrarTelefono !== false && <td className="border border-slate-200 p-2 text-slate-500">0981234567</td>}
                        {config.mostrarNivelAcademico !== false && <td className="border border-slate-200 p-2 text-slate-500">Magíster</td>}
                        {config.mostrarHoras !== false && <td className="border border-slate-200 p-2 text-slate-600 font-bold">10 hs</td>}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const RenderRubricTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Rúbrica de Evaluación del Documento</span>
            </div>
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: COLORS.blue }}>Criterio Evaluado</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-20" style={{ backgroundColor: COLORS.blue }}>Máximo</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-28" style={{ backgroundColor: COLORS.blue }}>Calificación</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800">
                            <strong className="block text-[10px] text-slate-800">Coherencia Metodológica</strong>
                            {config.mostrarDescripcionCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-400 leading-relaxed mt-0.5">
                                    Define la correspondencia lógica entre objetivos, metodología y resultados planteados en el proyecto.
                                </span>
                            )}
                            {config.mostrarObservacionesCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-500 font-semibold italic mt-1 text-amber-600">
                                    Obs: Se sugiere detallar el marco analítico.
                                </span>
                            )}
                        </td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 font-bold">40</td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 italic">[Pendiente]</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800">
                            <strong className="block text-[10px] text-slate-800">Viabilidad del Proyecto</strong>
                            {config.mostrarDescripcionCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-400 leading-relaxed mt-0.5">
                                    Análisis del presupuesto, cronograma y recursos humanos disponibles para su finalización.
                                </span>
                            )}
                        </td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 font-bold">60</td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 italic">[Pendiente]</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                        <td className="border border-slate-300 p-2 text-right text-slate-700 uppercase text-[9px]">Puntaje Total Consolidado:</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-800 font-black">100</td>
                        <td className="border border-slate-300 p-2 text-center bg-slate-100 text-brand font-black text-xs">[Por calificar]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const RenderProjectGeneralSection: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Ficha de Identificación del Proyecto (Metadatos Científicos)</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-700 leading-relaxed">
                <div className="col-span-2">
                    <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Título del Proyecto:</span>
                    <span className="font-bold text-slate-800">[TEMA / NOMBRE DEL PROYECTO EN MAYÚSCULAS]</span>
                </div>
                <div>
                    <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Carrera / Unidad Académica:</span>
                    <span className="font-semibold text-slate-600">[Carrera del Docente]</span>
                </div>
                <div>
                    <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Convocatoria:</span>
                    <span className="font-semibold text-slate-600">[Convocatoria Activa IST Traversari]</span>
                </div>
                <div>
                    <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Línea de Investigación:</span>
                    <span className="font-semibold text-slate-600">[Dominio, Línea y Sublínea Científica]</span>
                </div>
                <div>
                    <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Campo Detallado CACES:</span>
                    <span className="font-semibold text-slate-600">[Clasificación CACES de la Carrera]</span>
                </div>
            </div>
        </div>
    );
};

const RenderImpacts: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Matriz de Impactos y Productos Esperados</span>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Productos Esperados:</span>
                    <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                        <thead>
                            <tr>
                                <th className="border border-slate-300 p-1.5 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Tipo de Producto</th>
                                <th className="border border-slate-300 p-1.5 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-1.5 text-slate-800">[Tipo de Producto de Investigación]</td>
                                <td className="border border-slate-200 p-1.5 text-center font-bold text-slate-600">1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Áreas de Impacto Mapeadas:</span>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 leading-normal">
                        {['Social', 'Científico', 'Económico', 'Político', 'Ambiental', 'Otro'].map(tipo => (
                            <div key={tipo} className="p-2 border border-slate-150 rounded bg-white flex justify-between gap-4">
                                <strong className="text-[8px] uppercase text-slate-400 w-16 text-left">{tipo}</strong>
                                <span className="text-slate-600 italic font-medium flex-1 text-right">[Descripción de Impacto]</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RenderProjectBudgetSection: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Presupuesto y Financiamiento del Proyecto</span>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recursos Disponibles (Equipos, Licencias, Espacios):</span>
                    <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                        <thead>
                            <tr>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Descripción del Recurso</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-12">Cant.</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600 w-24">Fuente</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-1 text-slate-800">[Equipo/Laboratorio Computación]</td>
                                <td className="border border-slate-200 p-1 text-center font-bold text-slate-600">1</td>
                                <td className="border border-slate-200 p-1 text-slate-600">ISTPET</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recursos Necesarios (Gasto Detallado):</span>
                    <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                        <thead>
                            <tr>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Partida / Rubro</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-12">Cant.</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-20">P. Unit.</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-20">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-1 text-slate-800">[Viáticos para salida de campo / Reactivos]</td>
                                <td className="border border-slate-200 p-1 text-center font-bold text-slate-600">2</td>
                                <td className="border border-slate-200 p-1 text-right text-slate-600">$50.00</td>
                                <td className="border border-slate-200 p-1 text-right font-bold text-slate-800">$100.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-dashed border-slate-200">
                    <div className="text-[9px] text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 border border-slate-300 bg-slate-50 rounded" />
                            <span>Financiamiento Solicitado al ISTPET</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 border border-slate-300 bg-slate-50 rounded" />
                            <span>Financiamiento de Otras Fuentes</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Presupuesto Total Estimado:</span>
                        <span className="text-sm font-black text-slate-800">$100.00</span>
                    </div>
                </div>

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Los investigadores ingresarán los recursos y montos en la pestaña "Recursos & Financiamiento" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectTechnicalSection: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Plan Técnico y Científico (8 Sub-Secciones)</span>
            </div>

            <div className="space-y-2 text-[9px] text-slate-700">
                <div className="grid grid-cols-2 gap-2">
                    {[
                        '3.1 Antecedentes de la Problemática',
                        '3.2 Descripción General de la Propuesta',
                        '3.3 Justificación e Importancia',
                        '3.4 Objetivos de Investigación (Gen/Esp)',
                        '3.5 Alineación de Objetivos de Desarrollo Sostenible (ODS)',
                        '3.6 Marco Teórico Científico',
                        '3.7 Enfoque Metodológico',
                        '3.8 Evaluación Técnica de Resultados'
                    ].map(sub => (
                        <div key={sub} className="p-2 border border-slate-150 rounded bg-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            <span className="font-semibold text-slate-600 truncate">{sub}</span>
                        </div>
                    ))}
                </div>

                <p className="text-[8px] text-pink-600 font-black border-t border-dashed border-pink-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Los investigadores redactarán estas 8 secciones colaborativamente en la pestaña "Plan Técnico" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectProgressReport: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Avance de Ejecución y Monitoreo (Fase 3)</span>
            </div>

            <div className="space-y-4 text-[9px] text-slate-700">
                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bitácora Científica:</span>
                    <p className="text-slate-500 italic">[Campo colaborativo para registrar conclusiones parciales y bitácora del período]</p>
                </div>

                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hitos y Entregables Completados:</span>
                    <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                        <thead>
                            <tr>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Actividad / Hito</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Avance</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Completado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-1 text-slate-800">[Desarrollo de experimentos de campo]</td>
                                <td className="border border-slate-200 p-1 text-center text-slate-600">100%</td>
                                <td className="border border-slate-200 p-1 text-center font-bold text-emerald-600">SÍ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ejecución del Presupuesto de Gasto:</span>
                    <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                        <thead>
                            <tr>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Partida Ejecutada</th>
                                <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-24">Monto Gastado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-200 p-1 text-slate-800">[Adquisición de insumos de laboratorio]</td>
                                <td className="border border-slate-200 p-1 text-right font-bold text-slate-800">$100.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Los investigadores registrarán el avance, evidencias e hitos en la pestaña "Avance de Ejecución" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectEthicsReport: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Evaluación de Pertinencia Ética y Bioética</span>
            </div>

            <div className="space-y-3 text-[9px] text-slate-700">
                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Justificación Ética de la Propuesta:</strong>
                    <span className="text-slate-600 italic font-medium">[Descripción detallada del impacto ético e intervenciones]</span>
                </div>

                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Riesgos Identificados & Mitigación:</strong>
                    <span className="text-slate-600 italic font-medium">[Detalle de riesgos biológicos, sociales o digitales]</span>
                </div>

                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Mecanismo de Consentimiento Informado:</strong>
                    <span className="text-slate-600 italic font-medium">[Detalle del procedimiento de obtención del consentimiento]</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-dashed border-slate-200">
                    <div className="p-2 border border-slate-150 rounded bg-white">
                        <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Dictamen Final del Comité:</strong>
                        <span className="text-emerald-600 font-bold uppercase text-[9px]">Aprobado sin observaciones</span>
                    </div>
                    <div className="p-2 border border-slate-150 rounded bg-white">
                        <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Observaciones de Enmienda:</strong>
                        <span className="text-slate-500 italic font-medium">[Sin requerimientos obligatorios]</span>
                    </div>
                </div>

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    La comisión evaluará y dictaminará sobre el protocolo evaluado en el panel doble ciego.
                </p>
            </div>
        </div>
    );
};

const UNIQUE_BLOCK_TYPES = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'project_ethics_report',
    'researchers_table',
    'gantt',
    'signatures',
    'impacts',
    'rubric_table'
];

// ─── Item arrastrable individual A4 ─────────────────────────────────────────────
interface SortableBlockItemProps {
    block: DocumentBlock;
    index: number;
    isActive: boolean;
    onSelectBlock: (id: string) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
    block, index, isActive, onSelectBlock, onToggleActive, onDeleteBlock, onDuplicateBlock,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 999 : undefined,
    };

    const badge = (() => {
        const baseStyle = 'bg-slate-50 text-slate-500 border-slate-200/60';
        switch (block.type) {
            case 'cover':
            case 'title':
            case 'page_break':
            case 'advanced_table':
            case 'multi_section_table':
            case 'two_column':
            case 'signatures':
                return { text: 'Estático', dotColor: 'bg-slate-400', color: baseStyle, activeCls: 'ring-1 ring-slate-400 border-slate-400 shadow-sm' };
            case 'rich_text':
                return { text: 'Colaborativo', dotColor: 'bg-pink-500 animate-pulse', color: baseStyle, activeCls: 'ring-1 ring-pink-500 border-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.08)]' };
            case 'gantt':
                return { text: 'Cronograma', dotColor: 'bg-indigo-500', color: baseStyle, activeCls: 'ring-1 ring-indigo-500 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.08)]' };
            case 'project_general_section':
            case 'project_technical_section':
            case 'project_budget_section':
            case 'project_progress_report':
            case 'project_ethics_report':
            case 'researchers_table':
            case 'rubric_table':
            case 'impacts':
                return { text: 'Dinámico', dotColor: 'bg-emerald-500', color: baseStyle, activeCls: 'ring-1 ring-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.08)]' };
            default:
                return null;
        }
    })();

    const isCover = block.type === 'cover';

    const renderContent = () => {
        if (!block.isActive) {
            return (
                <div className="py-3 px-4 border border-dashed border-slate-200 bg-slate-50/50 rounded text-center text-slate-400 italic text-[10px]">
                    Bloque "{block.title}" oculto en la generación del PDF
                </div>
            );
        }

        switch (block.type) {
            case 'cover': return <RenderCover config={block.config} />;
            case 'title': return <RenderTitle config={block.config} />;
            case 'rich_text': return <RenderRichText config={block.config} />;
            case 'advanced_table': return <RenderAdvancedTable config={block.config} />;
            case 'multi_section_table': return <RenderMultiSectionTable config={block.config} />;
            case 'two_column': return <RenderTwoColumn config={block.config} />;
            case 'gantt': return <RenderGantt config={block.config} />;
            case 'researchers_table': return <RenderResearchersTable config={block.config} />;
            case 'rubric_table': return <RenderRubricTable config={block.config} />;
            case 'signatures': return <RenderSignatures config={block.config} />;
            case 'project_general_section': return <RenderProjectGeneralSection config={block.config} />;
            case 'project_technical_section': return <RenderProjectTechnicalSection config={block.config} />;
            case 'project_budget_section': return <RenderProjectBudgetSection config={block.config} />;
            case 'project_progress_report': return <RenderProjectProgressReport config={block.config} />;
            case 'project_ethics_report': return <RenderProjectEthicsReport config={block.config} />;
            case 'impacts': return <RenderImpacts config={block.config} />;
            case 'page_break': return null;
            default:
                return <div className="p-4 border bg-red-50 text-red-500 text-xs">Bloque no renderizado: {block.type}</div>;
        }
    };

    if (block.type === 'page_break') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => onSelectBlock(block.id)}
                className={`group relative py-1.5 px-4 my-2 border-t-2 border-b-2 border-dashed border-slate-300 bg-slate-50/30 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 cursor-grab active:cursor-grabbing hover:border-slate-400 hover:bg-slate-50/50
                    ${isActive ? 'ring-1 ring-zinc-950 border-zinc-950' : ''}
                    ${isDragging ? 'opacity-60 scale-[0.97] transition-none border-t-indigo-400 border-b-indigo-400 shadow-sm' : 'transition-all'}
                `}
            >
                <div className="flex items-center gap-2">
                    <span>Salto de Página en PDF</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={e => { e.stopPropagation(); onDeleteBlock(block.id); }}
                        className="p-1 rounded hover:bg-error/10 text-slate-400 hover:text-error transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    const themeCls = (() => {
        if (isCover) return '';
        switch (block.type) {
            case 'rich_text':
                return 'bg-white hover:bg-pink-50/30 hover:border-pink-300';
            case 'gantt':
                return 'bg-white hover:bg-indigo-50/30 hover:border-indigo-300';
            case 'project_general_section':
            case 'project_technical_section':
            case 'project_budget_section':
            case 'project_progress_report':
            case 'project_ethics_report':
            case 'researchers_table':
            case 'rubric_table':
            case 'impacts':
                return 'bg-white hover:bg-emerald-50/30 hover:border-emerald-300';
            default:
                return 'bg-white hover:bg-slate-50/30 hover:border-slate-300';
        }
    })();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onSelectBlock(block.id)}
            className={`group relative border rounded-md cursor-grab active:cursor-grabbing ${isCover ? 'p-0' : 'p-4'} ${themeCls}
                ${isDragging
                    ? 'shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-slate-300 opacity-80 scale-[0.97] rotate-[-0.5deg] transition-none z-[999]'
                    : isActive
                        ? (badge?.activeCls || 'ring-1 ring-zinc-950 border-zinc-950 shadow-sm')
                        : isCover
                            ? 'border-transparent'
                            : 'border-slate-200'
                }
            `}
        >
            {/* Insignia de Comportamiento del Plugin */}
            {badge && !isCover && (
                <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[8px] font-mono font-medium uppercase tracking-widest border select-none flex items-center gap-1.5 ${badge.color}`}>
                    <span className={`w-1 h-1 rounded-full ${badge.dotColor}`} />
                    {badge.text}
                </div>
            )}

            {/* Controles Flotantes Notion-style */}
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm no-drag">
                <button
                    onClick={e => { e.stopPropagation(); onToggleActive(index); }}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${block.isActive ? 'text-slate-400 hover:text-slate-600' : 'text-error'}`}
                    title={block.isActive ? 'Ocultar en PDF' : 'Mostrar en PDF'}
                >
                    {block.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {!UNIQUE_BLOCK_TYPES.includes(block.type) && (
                    <button
                        onClick={e => { e.stopPropagation(); onDuplicateBlock(block.id); }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Duplicar bloque"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDeleteBlock(block.id); }}
                    className="p-1 rounded hover:bg-error/10 text-slate-400 hover:text-error transition-colors"
                    title="Eliminar bloque"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Renderizado de contenido real */}
            <div className="relative pt-6">
                {renderContent()}
            </div>
        </div>
    );
};

// Separador visual de hoja A4
const PageBreakIndicator: React.FC<{ pageNum: number }> = ({ pageNum }) => (
    <div className="flex items-center gap-3 my-4 pointer-events-none">
        <div className="flex-1 border-t border-dashed border-slate-300" />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest shrink-0 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Página {pageNum}
        </span>
        <div className="flex-1 border-t border-dashed border-slate-300" />
    </div>
);

// ─── Canvas principal en formato de Hoja A4 ─────────────────────────────────────
export const BlockCanvas: React.FC<BlockCanvasProps> = ({
    blocks,
    activeBlockId,
    onSelectBlock,
    onToggleActive,
    onDeleteBlock,
    onDuplicateBlock,
    templateName,
    isDirty,
    headerCollapsed,
    onToggleHeader,
    rightActions,
}) => {
    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeBlockId]);

    const activeCount = blocks.filter(b => b.isActive).length;
    let pageNum = 1;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-bg-deep border border-border-thin rounded-md overflow-hidden">
            {/* Header del panel */}
            <div className="p-3 border-b border-border-thin bg-surface flex items-center justify-between shrink-0 shadow-none">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-text-main" />
                    {templateName || 'Lienzo de Maquetación (Edición Directa A4)'}
                </span>
                <span className="text-[10px] font-medium text-text-dim transform -translate-x-10">
                    {activeCount} / {blocks.length} visibles
                </span>
                <div className="flex items-center gap-3.5 shrink-0">
                    {rightActions}
                    {rightActions && <div className="w-px h-3.5 bg-border-thin" />}
                    {onToggleHeader && (
                        <button
                            onClick={onToggleHeader}
                            className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                            title={headerCollapsed ? "Mostrar cabecera de la página" : "Ocultar cabecera (Modo Enfoque)"}
                        >
                            {headerCollapsed ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m18 15-6-6-6 6" /></svg>
                                    <span className="text-[9px] uppercase tracking-wider font-bold">Mostrar Cabecera</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m6 9 6 6 6-6" /></svg>
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-text-dim/60">Ocultar Cabecera</span>
                                </>
                            )}
                        </button>
                    )}

                    {onToggleHeader && <div className="w-px h-3.5 bg-border-thin" />}

                    {isDirty !== undefined && (
                        isDirty ? (
                            <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Cambios sin guardar
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Todo guardado
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Scroll del lienzo */}
            <div className="flex-1 overflow-y-auto p-8 pb-32 bg-bg-deep" style={{ scrollbarWidth: 'thin' }}>

                {/* Contenedor simulando hoja A4 */}
                <div className="force-light-theme max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col gap-2 transition-all">

                    {blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 border-2 border-dashed border-border-thin rounded-md text-center p-12 my-auto">
                            <Layers className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">El documento está vacío</h3>
                            <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                                Usa el menú superior "+ Agregar Bloque" para inyectar componentes en esta hoja A4.
                            </p>
                        </div>
                    ) : (
                        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            {blocks.map((block, idx) => {
                                const isActiveBlock = activeBlockId === block.id;
                                const prevBlock = idx > 0 ? blocks[idx - 1] : null;
                                const showPageIndicator = prevBlock?.type === 'page_break';
                                if (showPageIndicator) pageNum++;

                                return (
                                    <React.Fragment key={block.id}>
                                        {showPageIndicator && <PageBreakIndicator pageNum={pageNum} />}
                                        <div ref={isActiveBlock ? activeRef : undefined}>
                                            <SortableBlockItem
                                                block={block}
                                                index={idx}
                                                isActive={isActiveBlock}
                                                onSelectBlock={onSelectBlock}
                                                onToggleActive={onToggleActive}
                                                onDeleteBlock={onDeleteBlock}
                                                onDuplicateBlock={onDuplicateBlock}
                                            />
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </SortableContext>
                    )}
                </div>
            </div>
        </div>
    );
};
