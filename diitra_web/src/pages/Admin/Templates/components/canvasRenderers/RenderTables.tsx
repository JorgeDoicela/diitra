import React from 'react';
import type { TableSection } from '../../types';
import { getHeaderStylePair, DYN_COLORS } from './RenderCover';
import { resolveHeaderColor } from '../properties/SharedColorPicker';

export const RenderAdvancedTable: React.FC<{ config: any }> = ({ config }) => {
    const headers = config.headers || ['Columna 1', 'Columna 2'];
    const rows = config.rows || [{ cells: ['Dato A', 'Dato B'] }];
    const headerStyle = config.headerStyle || 'blue';
    const colWidths = config.colWidths || [];
    const headerPair = getHeaderStylePair(headerStyle);

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
                                    backgroundColor: headerPair.bg,
                                    color: headerPair.fg,
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

export const RenderMultiSectionTable: React.FC<{ config: any }> = ({ config }) => {
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
                                {sec.headers.map((h, i) => {
                                    const secPair = getHeaderStylePair(sec.headerStyle || 'blue');
                                    return (
                                        <th
                                            key={i}
                                            className="border border-slate-300 p-1.5 font-bold text-left uppercase text-[8.5px]"
                                            style={{
                                                backgroundColor: secPair.bg,
                                                color: secPair.fg,
                                                width: sec.colWidths?.[i] || 'auto'
                                            }}
                                        >
                                            {h}
                                        </th>
                                    );
                                })}
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

export const RenderResearchersTable: React.FC<{
    config?: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || title || '2.  INVESTIGADORES';
    const headerBg = resolveHeaderColor(c.headerColor || '#222c57');

    const showCedula = c.mostrarCedula !== false;
    const showEmail = c.mostrarEmail !== false;
    const showTelefono = c.mostrarTelefono !== false;
    const showNivelAcademico = c.mostrarNivelAcademico !== false;
    const showHoras = Boolean(c.mostrarHoras);

    return (
        <div className="overflow-x-auto my-2 select-none font-sans">
            <div className="mb-2">
                {onUpdateConfig && blockId ? (
                    <input
                        type="text"
                        value={displayTitle}
                        onChange={e => onUpdateConfig(blockId, 'title', e.target.value)}
                        className="font-bold text-[10pt] uppercase text-[#222c57] tracking-wide font-sans bg-transparent border-b border-transparent hover:border-slate-300/60 focus:border-indigo-600 focus:outline-none py-0.5 w-full max-w-md transition-colors"
                    />
                ) : (
                    <p className="font-bold text-[10pt] uppercase text-[#222c57] tracking-wide font-sans">
                        {displayTitle}
                    </p>
                )}
            </div>
            <table className="w-full border-collapse text-[10px] border border-black">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>NOMBRE</th>
                        {showCedula && <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>NÚMERO DE CÉDULA</th>}
                        {showEmail && <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>EMAIL</th>}
                        {showTelefono && <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>TELEFONO</th>}
                        {showNivelAcademico && <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>NIVEL ACADÉMICO</th>}
                        {showHoras && <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>HORAS</th>}
                        <th className="p-1.5 text-white font-bold text-center uppercase text-[8.5px]" style={{ backgroundColor: headerBg }}>ROL</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Fila Director */}
                    <tr className="border-b border-black hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5 align-top">
                            <div className="font-bold text-slate-900 text-[9px]">Director de Proyecto</div>
                            <div className="text-[7.5px] text-slate-500 italic mt-0.5">[Nombre del Director]</div>
                        </td>
                        {showCedula && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Cédula]</td>}
                        {showEmail && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Email institucional]</td>}
                        {showTelefono && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Teléfono]</td>}
                        {showNivelAcademico && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Nivel Académico]</td>}
                        {showHoras && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-700 font-bold text-center align-middle">20 hs</td>}
                        <td className="p-1.5 text-[7.5px] text-slate-500 italic align-middle">Director de Proyecto</td>
                    </tr>
                    {/* Fila Integrante de Muestra Dinámica */}
                    <tr className="hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5 align-top">
                            <div className="font-bold text-slate-900 text-[9px]">Co-Investigador / Semillero</div>
                            <div className="text-[7.5px] text-slate-500 italic mt-0.5">[Nombre del Integrante]</div>
                        </td>
                        {showCedula && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Cédula]</td>}
                        {showEmail && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Email institucional]</td>}
                        {showTelefono && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Teléfono]</td>}
                        {showNivelAcademico && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Nivel Académico]</td>}
                        {showHoras && <td className="border-r border-black p-1.5 text-[7.5px] text-slate-700 font-bold text-center align-middle">5 hs</td>}
                        <td className="p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Rol en el proyecto]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export const RenderRubricTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2 select-none">
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Criterio Evaluado</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-20" style={{ backgroundColor: DYN_COLORS.blue }}>Máximo</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-28" style={{ backgroundColor: DYN_COLORS.blue }}>Calificación</th>
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

