import React from 'react';
import { getHeaderStylePair } from './RenderCover';

export const RenderLearningPlanHeaderSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const headerColorMode = c.learningPlanHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);
    const showObj = c.showObjetivoGeneral !== false;

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full overflow-hidden rounded-xs border border-slate-300">
                {/* Cabecera ISTPET */}
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    <span>1. IDENTIFICACIÓN DEL PROYECTO</span>
                    <span className="text-[9px] opacity-80 font-normal">Formato Oficial ISTPET</span>
                </div>

                <div className="grid grid-cols-2 bg-white divide-y divide-slate-200 text-[10px]">
                    <div className="col-span-2 p-2 bg-slate-50/40">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">NOMBRE DEL PROYECTO:</span>
                        <span className="italic font-mono text-slate-600">[TÍTULO DEL PROYECTO DE INVESTIGACIÓN]</span>
                    </div>

                    <div className="p-2 border-r border-slate-200">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">LÍNEA DE INVESTIGACIÓN:</span>
                        <span className="italic font-mono text-slate-600">[LÍNEA INSTITUCIONAL]</span>
                    </div>
                    <div className="p-2">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">SUBLÍNEA DE INVESTIGACIÓN:</span>
                        <span className="italic font-mono text-slate-600">[SUBLÍNEA]</span>
                    </div>

                    <div className="col-span-2 p-2">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">CARRERA:</span>
                        <span className="italic font-mono text-slate-600">[CARRERA ASOCIADA]</span>
                    </div>

                    <div className="p-2 border-r border-slate-200">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">DIRECTOR DEL PROYECTO:</span>
                        <span className="italic font-mono text-slate-600">[DIRECTOR DE PROYECTO]</span>
                    </div>
                    <div className="p-2">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">NÚMERO DE ESTUDIANTES QUE PARTICIPAN:</span>
                        <span className="italic font-mono text-slate-600">[1, 2, ...]</span>
                    </div>

                    <div className="p-2 border-r border-slate-200">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">FECHA DE APROBACIÓN / TERMINACIÓN:</span>
                        <span className="italic font-mono text-slate-600">[DD/MM/AAAA] - [DD/MM/AAAA]</span>
                    </div>
                    <div className="p-2">
                        <span className="font-bold uppercase text-slate-700 text-[9px] block">PERIODO ACADÉMICO:</span>
                        <span className="italic font-mono text-slate-600">[2026-1]</span>
                    </div>

                    <div className="col-span-2 p-2 bg-emerald-50/30">
                        <span className="font-bold uppercase text-emerald-800 text-[9px] block">NOMBRE DEL ESTUDIANTE:</span>
                        <span className="italic font-mono text-emerald-900 font-semibold">[APELLIDOS Y NOMBRES DEL ESTUDIANTE]</span>
                    </div>
                </div>

                {showObj && (
                    <div className="border-t border-slate-300">
                        <div
                            className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
                            style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                        >
                            OBJETIVO GENERAL DEL PROYECTO DE INVESTIGACIÓN
                        </div>
                        <div className="p-2.5 bg-white text-[10px] text-slate-700 italic font-mono">
                            [OBJETIVO GENERAL EXTRAÍDO AUTOMÁTICAMENTE DEL PROTOCOLO]
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const RenderLearningPlanEvalParametersSection: React.FC<{
    config: any;
}> = ({ config }) => {
    const c = config || {};
    const headerColorMode = c.learningPlanHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full overflow-hidden rounded-xs border border-slate-300">
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    <span>2. PARÁMETROS DE EVALUACIÓN</span>
                    <span className="text-[9px] opacity-80 font-normal">Escala Cualitativa ISTPET</span>
                </div>

                <div className="p-2 bg-slate-50 border-b border-slate-200 text-[9px] text-slate-600 leading-snug">
                    La evaluación de la participación del estudiante en el proyecto de investigación tiene un enfoque cualitativo y se centra en identificar los resultados de aprendizaje de las actividades que los estudiantes deben realizar en conjunto con las asignaturas asociadas.
                </div>

                <div className="divide-y divide-slate-200 bg-white text-[9.5px]">
                    <div className="p-2 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold font-mono text-center bg-emerald-100 text-emerald-800 py-0.5 rounded">4</span>
                        <span className="col-span-3 font-bold text-emerald-800 uppercase">MUY ADECUADO</span>
                        <span className="col-span-8 text-slate-600">El estudiante ha superado ampliamente las expectativas, mostrando un rendimiento excepcional en todas las actividades asignadas.</span>
                    </div>
                    <div className="p-2 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold font-mono text-center bg-blue-100 text-blue-800 py-0.5 rounded">3</span>
                        <span className="col-span-3 font-bold text-blue-800 uppercase">ADECUADO</span>
                        <span className="col-span-8 text-slate-600">El estudiante ha cumplido con las expectativas, mostrando un buen rendimiento en la mayoría de las actividades, con algunos aspectos a mejorar.</span>
                    </div>
                    <div className="p-2 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold font-mono text-center bg-amber-100 text-amber-800 py-0.5 rounded">2</span>
                        <span className="col-span-3 font-bold text-amber-800 uppercase">POCO ADECUADO</span>
                        <span className="col-span-8 text-slate-600">El estudiante ha cumplido parcialmente con las expectativas, mostrando un rendimiento inconsistente y necesitando mejoras significativas.</span>
                    </div>
                    <div className="p-2 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold font-mono text-center bg-red-100 text-red-800 py-0.5 rounded">1</span>
                        <span className="col-span-3 font-bold text-red-800 uppercase">NO ADECUADO</span>
                        <span className="col-span-8 text-slate-600">El estudiante no ha cumplido con las expectativas, mostrando un rendimiento insatisfactorio en la mayoría de las actividades.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RenderLearningPlanPrerequisitesSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const headerColorMode = c.learningPlanHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);
    const isEvaluacion = c.learningPlanMode === 'evaluacion';

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full overflow-hidden rounded-xs border border-slate-300">
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    <span>3. PRERREQUISITOS QUE DEBE CUMPLIR EL ESTUDIANTE PREVIO A LA VINCULACIÓN AL PROYECTO</span>
                    <span className="text-[9px] opacity-80 font-normal">
                        {isEvaluacion ? 'Modo: Evaluación Cualitativa' : 'Modo: Planificación APE'}
                    </span>
                </div>

                {isEvaluacion ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[9px] bg-white border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                                    <th className="p-2 border-r border-slate-300 text-left" style={{ width: '28%' }}>COGNITIVOS</th>
                                    <th className="p-1 border-r border-slate-300" colSpan={4} style={{ width: '22%' }}>NIVEL DE CUMPLIMIENTO</th>
                                    <th className="p-2 border-r border-slate-300 text-left" style={{ width: '28%' }}>PROCEDIMENTALES</th>
                                    <th className="p-1" colSpan={4} style={{ width: '22%' }}>NIVEL DE CUMPLIMIENTO</th>
                                </tr>
                                <tr className="bg-slate-50 text-[8px] text-slate-600 font-semibold border-b border-slate-300 text-center">
                                    <th className="border-r border-slate-300"></th>
                                    <th className="p-1 border-r border-slate-200">MUY (4)</th>
                                    <th className="p-1 border-r border-slate-200">ADEC (3)</th>
                                    <th className="p-1 border-r border-slate-200">POCO (2)</th>
                                    <th className="p-1 border-r border-slate-300">NO (1)</th>
                                    <th className="border-r border-slate-300"></th>
                                    <th className="p-1 border-r border-slate-200">MUY (4)</th>
                                    <th className="p-1 border-r border-slate-200">ADEC (3)</th>
                                    <th className="p-1 border-r border-slate-200">POCO (2)</th>
                                    <th className="p-1">NO (1)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                <tr>
                                    <td className="p-1.5 border-r border-slate-300 font-mono text-[8.5px]">1. Conocimientos fundamentales</td>
                                    <td className="p-1 border-r border-slate-200 text-center font-bold text-emerald-600">X</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 border-r border-slate-300 text-center text-slate-300">-</td>
                                    <td className="p-1.5 border-r border-slate-300 font-mono text-[8.5px]">1. Trabajo colaborativo interdisciplinar</td>
                                    <td className="p-1 border-r border-slate-200 text-center font-bold text-emerald-600">X</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 text-center text-slate-300">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white text-[10px]">
                        <div className="p-2 space-y-1.5">
                            <div className="font-bold text-[9px] text-slate-700 uppercase tracking-wider text-center bg-slate-100 py-1 rounded">
                                COGNITIVOS (Mín. 3)
                            </div>
                            <div className="p-1.5 border border-dashed border-slate-200 rounded text-slate-500 italic">
                                1. Conocimientos fundamentales en el área temática
                            </div>
                            <div className="p-1.5 border border-dashed border-slate-200 rounded text-slate-500 italic">
                                2. Capacidad de análisis y síntesis bibliográfica
                            </div>
                        </div>

                        <div className="p-2 space-y-1.5">
                            <div className="font-bold text-[9px] text-slate-700 uppercase tracking-wider text-center bg-slate-100 py-1 rounded">
                                PROCEDIMENTALES (Mín. 5)
                            </div>
                            <div className="p-1.5 border border-dashed border-slate-200 rounded text-slate-500 italic">
                                1. Trabajo colaborativo interdisciplinar
                            </div>
                            <div className="p-1.5 border border-dashed border-slate-200 rounded text-slate-500 italic">
                                2. Manejo de herramientas de recolección de datos
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const RenderLearningPlanActivitiesSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const headerColorMode = c.learningPlanHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);
    const isEvaluacion = c.learningPlanMode === 'evaluacion';

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full overflow-hidden rounded-xs border border-slate-300">
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    <span>4. PLAN DE APRENDIZAJE {isEvaluacion ? '(EVALUACIÓN DE ACTIVIDADES)' : '(ACTIVIDADES A EJECUTAR)'}</span>
                    <span className="text-[9px] opacity-80 font-normal">
                        {isEvaluacion ? 'Modo: Evaluación Cualitativa' : 'Modo: Planificación APE'}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {isEvaluacion ? (
                        <table className="w-full text-left text-[9px] bg-white border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                                    <th className="p-2 border-r border-slate-300 text-left" style={{ width: '20%' }}>OBJETIVOS DEL PROYECTO</th>
                                    <th className="p-2 border-r border-slate-300 text-left" style={{ width: '14%' }}>ASIGNATURA</th>
                                    <th className="p-2 border-r border-slate-300 text-left" style={{ width: '16%' }}>RdA ASOCIADO</th>
                                    <th className="p-1 border-r border-slate-300" colSpan={2} style={{ width: '22%' }}>ACTIVIDAD EJECUTADA</th>
                                    <th className="p-1 border-r border-slate-300" colSpan={4} style={{ width: '16%' }}>NIVEL DE CUMPLIMIENTO</th>
                                    <th className="p-2 text-left" style={{ width: '12%' }}>OBSERVACIONES</th>
                                </tr>
                                <tr className="bg-slate-50 text-[8px] text-slate-600 font-semibold border-b border-slate-300 text-center">
                                    <th className="border-r border-slate-300"></th>
                                    <th className="border-r border-slate-300"></th>
                                    <th className="border-r border-slate-300"></th>
                                    <th className="p-1 border-r border-slate-200">ACTIVIDAD</th>
                                    <th className="p-1 border-r border-slate-300">FECHA</th>
                                    <th className="p-1 border-r border-slate-200">MUY (4)</th>
                                    <th className="p-1 border-r border-slate-200">ADEC (3)</th>
                                    <th className="p-1 border-r border-slate-200">POCO (2)</th>
                                    <th className="p-1 border-r border-slate-300">NO (1)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-mono text-[8.5px]">
                                <tr>
                                    <td className="p-1.5 border-r border-slate-200 italic">[Obj. Específico 1]</td>
                                    <td className="p-1.5 border-r border-slate-200 font-sans font-medium">[Asignatura]</td>
                                    <td className="p-1.5 border-r border-slate-200 italic">[RdA Vinculado]</td>
                                    <td className="p-1.5 border-r border-slate-200 font-sans">[Tarea ejecutada]</td>
                                    <td className="p-1.5 border-r border-slate-200 text-center">[DD/MM/AA]</td>
                                    <td className="p-1 border-r border-slate-200 text-center font-bold text-emerald-600">X</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 border-r border-slate-200 text-center text-slate-300">-</td>
                                    <td className="p-1 border-r border-slate-300 text-center text-slate-300">-</td>
                                    <td className="p-1.5 italic font-sans">[Cumplió a cabalidad]</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-[9px] bg-white border-collapse">
                            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[9px]">
                                <tr>
                                    <th className="p-2 border-r border-slate-300">Objetivo del Proyecto</th>
                                    <th className="p-2 border-r border-slate-300">Línea</th>
                                    <th className="p-2 border-r border-slate-300">Asignatura</th>
                                    <th className="p-2 border-r border-slate-300">RdA Asociado</th>
                                    <th className="p-2 border-r border-slate-300">Actividad</th>
                                    <th className="p-2 border-r border-slate-300">Fecha</th>
                                    <th className="p-2 border-r border-slate-300">Horas</th>
                                    <th className="p-2">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-600 font-mono text-[8.5px]">
                                <tr>
                                    <td className="p-2 border-r border-slate-200 italic">[Obj. Específico 1]</td>
                                    <td className="p-2 border-r border-slate-200 italic">[Línea 1]</td>
                                    <td className="p-2 border-r border-slate-200 font-sans font-medium">[Asignatura]</td>
                                    <td className="p-2 border-r border-slate-200 italic">[RdA Vinculado]</td>
                                    <td className="p-2 border-r border-slate-200 font-sans">[Actividad APE]</td>
                                    <td className="p-2 border-r border-slate-200">[DD/MM/AAAA]</td>
                                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900">40h</td>
                                    <td className="p-2 italic">[Observaciones]</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export const RenderLearningPlanEvaluationTable: React.FC<{
    config: any;
}> = ({ config }) => {
    const c = config || {};
    const headerColorMode = c.learningPlanHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full overflow-hidden rounded-xs border border-slate-300">
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    <span>5. RESULTADOS GENERALES</span>
                    <span className="text-[9px] opacity-80 font-normal">Consolidado ISTPET</span>
                </div>

                <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left text-[9.5px] border-collapse">
                        <tbody className="divide-y divide-slate-200 font-medium">
                            <tr>
                                <td className="p-2 bg-slate-50 border-r border-slate-300 font-bold uppercase text-slate-800" style={{ width: '45%' }}>
                                    COGNITIVOS
                                </td>
                                <td className="p-2 font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                    3.80 — MUY ADECUADO (4)
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 bg-slate-50 border-r border-slate-300 font-bold uppercase text-slate-800">
                                    PROCEDIMENTALES
                                </td>
                                <td className="p-2 font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                    3.65 — MUY ADECUADO (4)
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 bg-slate-50 border-r border-slate-300 font-bold uppercase text-slate-800">
                                    ACTIVIDADES DE APRENDIZAJE
                                </td>
                                <td className="p-2 font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                    3.90 — MUY ADECUADO (4)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-700">Dictamen Final de Evaluación:</span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                        ✓ APROBADO (Promedio: 3.78 / 4.00)
                    </span>
                </div>
            </div>
        </div>
    );
};
