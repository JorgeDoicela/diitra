import React from 'react';
import type { TableSection } from '../../types';
import { getHeaderStylePair, DYN_COLORS } from './RenderCover';

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

export const RenderResearchersTable: React.FC<{ config?: any; title?: string }> = ({ config, title }) => {
    const displayTitle = config?.title || title || '2.  INVESTIGADORES';
    return (
        <div className="overflow-x-auto my-2 select-none font-sans">
            <p className="font-bold text-[10pt] uppercase text-[#1e2a4a] mb-2 tracking-wide font-sans">
                {displayTitle}
            </p>
            <table className="w-full border-collapse text-[10px] border border-black">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[22%] bg-[#1e2a4a]">NOMBRE</th>
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[16%] bg-[#1e2a4a]">NÚMERO DE CÉDULA</th>
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[18%] bg-[#1e2a4a]">EMAIL</th>
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[14%] bg-[#1e2a4a]">TELEFONO</th>
                        <th className="border-r border-black p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[16%] bg-[#1e2a4a]">NIVEL ACADÉMICO</th>
                        <th className="p-1.5 text-white font-bold text-center uppercase text-[8.5px] w-[14%] bg-[#1e2a4a]">ROL</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Fila Director */}
                    <tr className="border-b border-black hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5 align-top">
                            <div className="font-bold text-slate-900 text-[9px]">Director</div>
                            <div className="text-[7.5px] text-slate-500 italic mt-0.5">[Indicar Título abreviado, nombres y apellidos completos]</div>
                        </td>
                        <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Especificar el número de cédula]</td>
                        <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[ejemplo@istpet.edu]</td>
                        <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Indicar su número de contacto]</td>
                        <td className="border-r border-black p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Especificar el título más alto que está debidamente registrado en la Senescyt]</td>
                        <td className="p-1.5 text-[7.5px] text-slate-500 italic align-middle">[Indicar rol dentro del ISTPET]</td>
                    </tr>
                    {/* Fila Docentes */}
                    <tr className="border-b border-black hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5 align-top">
                            <div className="font-bold text-slate-900 text-[9px]">Docentes</div>
                            <div className="text-[7.5px] text-slate-500 italic mt-0.5">[Indicar Título abreviado, nombres y apellidos completos]</div>
                        </td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="p-1.5 align-middle">&nbsp;</td>
                    </tr>
                    {/* Fila Estudiantes */}
                    <tr className="border-b border-black hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5 align-top">
                            <div className="font-bold text-slate-900 text-[9px]">Estudiantes</div>
                            <div className="text-[7.5px] text-slate-500 italic mt-0.5">[Indicar nombres y apellidos completos]</div>
                        </td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="border-r border-black p-1.5 align-middle">&nbsp;</td>
                        <td className="p-1.5 align-middle">&nbsp;</td>
                    </tr>
                    {/* Fila libre 1 */}
                    <tr className="border-b border-black h-6 hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                    </tr>
                    {/* Fila libre 2 */}
                    <tr className="h-6 hover:bg-slate-50/50">
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="border-r border-black p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
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
