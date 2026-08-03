import React from 'react';
import type { TableSection } from '../../types';
import { DYN_COLORS } from './RenderCover';

export const RenderAdvancedTable: React.FC<{ config: any }> = ({ config }) => {
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
                                    backgroundColor: headerStyle === 'blue' ? DYN_COLORS.tableHeaderBg : headerStyle === 'gold' ? DYN_COLORS.gold : headerStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                                    color: headerStyle !== 'none' ? DYN_COLORS.tableHeaderColor : '#1e2a4a',
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
                                {sec.headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="border border-slate-300 p-1.5 font-bold text-left uppercase text-[8.5px]"
                                        style={{
                                            backgroundColor: sec.headerStyle === 'blue' ? DYN_COLORS.tableHeaderBg : sec.headerStyle === 'gold' ? DYN_COLORS.gold : sec.headerStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                                            color: sec.headerStyle !== 'none' ? DYN_COLORS.tableHeaderColor : '#1e2a4a',
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

export const RenderResearchersTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr className="bg-[#1e2a4a] text-white">
                        <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Nombre Completo</th>
                        <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Rol en Proyecto</th>
                        {config.mostrarCedula !== false && <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Cédula</th>}
                        {config.mostrarEmail !== false && <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Email</th>}
                        {config.mostrarTelefono !== false && <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Teléfono</th>}
                        {config.mostrarNivelAcademico !== false && <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Nivel Académico</th>}
                        {config.mostrarHoras !== false && <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Horas</th>}
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-slate-50/40">
                        <td className="border border-slate-200 p-1.5 text-slate-700 font-semibold">[Nombre del Investigador]</td>
                        <td className="border border-slate-200 p-1.5 text-slate-600">Director / Co-investigador</td>
                        {config.mostrarCedula !== false && <td className="border border-slate-200 p-1.5 text-slate-500 font-mono">17XXXXXX-X</td>}
                        {config.mostrarEmail !== false && <td className="border border-slate-200 p-1.5 text-slate-500">investigador@istt.edu.ec</td>}
                        {config.mostrarTelefono !== false && <td className="border border-slate-200 p-1.5 text-slate-500">099XXXXXXX</td>}
                        {config.mostrarNivelAcademico !== false && <td className="border border-slate-200 p-1.5 text-slate-500">Tercer / Cuarto Nivel</td>}
                        {config.mostrarHoras !== false && <td className="border border-slate-200 p-1.5 text-slate-500 font-mono">10 hs/sem</td>}
                    </tr>
                </tbody>
            </table>
            <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Los investigadores se cargarán dinámicamente desde la base de datos al seleccionar el proyecto.
            </p>
        </div>
    );
};

export const RenderRubricTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr className="bg-[#1e2a4a] text-white">
                        <th className="border border-slate-300 p-1.5 text-left font-bold text-[9px] uppercase">Criterio Evaluado</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold text-[9px] uppercase w-20">Máximo</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold text-[9px] uppercase w-24">Calificación</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-slate-50/40">
                        <td className="border border-slate-200 p-1.5 text-slate-700">
                            <strong className="block text-slate-800 font-bold">1. Pertinencia del Problema de Investigación</strong>
                            {config.mostrarDescripcionCriterio !== false && (
                                <span className="text-[8.5px] text-slate-500 leading-tight block mt-0.5">Evalúa la coherencia institucional, impacto social y justificación técnica.</span>
                            )}
                            {config.mostrarObservacionesCriterio !== false && (
                                <span className="text-[8px] text-amber-600 italic block mt-1">Obs: Comentario cualitativo del evaluador par...</span>
                            )}
                        </td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-slate-600">25 pts</td>
                        <td className="border border-slate-200 p-1.5 text-center font-mono font-bold text-emerald-600 bg-emerald-50/30">25 / 25</td>
                    </tr>
                </tbody>
            </table>
            <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Los criterios de la rúbrica se vincularán automáticamente desde el módulo de configuración de evaluación par.
            </p>
        </div>
    );
};
