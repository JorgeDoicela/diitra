import React from 'react';
import type { GanttObjective } from '../../types';
import { DYN_COLORS } from './RenderCover';

export const RenderTitle: React.FC<{ config: any; themeConfig?: any }> = ({ config, themeConfig }) => {
    const text = config.text || 'TÍTULO DE SECCIÓN';
    const fontSize = (config.fontSize || config.level || 'H2').toUpperCase();
    const align = config.alignment || 'left';

    const pTheme = themeConfig?.colors?.primary;
    const sTheme = themeConfig?.colors?.secondary;
    const tableHeaderBg = themeConfig?.colors?.tableHeaderBg || pTheme || DYN_COLORS.blue;
    const tableHeaderColor = themeConfig?.colors?.tableHeaderColor || '#ffffff';
    const primaryColor = pTheme || DYN_COLORS.blue;
    const secondaryColor = sTheme || DYN_COLORS.gold;

    const alignStyle: React.CSSProperties = {
        textAlign: align as any,
    };

    if (fontSize === 'H1') {
        return (
            <h1 className="text-sm font-black uppercase tracking-tight mb-2 mt-4 pb-1 border-b-2" style={{ ...alignStyle, color: primaryColor, borderColor: secondaryColor }}>
                {text}
            </h1>
        );
    }
    if (fontSize === 'H2') {
        return (
            <h2 className="text-xs font-black px-3 py-2 uppercase tracking-wide mb-2 mt-4 shadow-xs rounded-xs" style={{ ...alignStyle, backgroundColor: tableHeaderBg, color: tableHeaderColor }}>
                {text}
            </h2>
        );
    }
    return (
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 mt-3" style={{ ...alignStyle, color: secondaryColor }}>
            {text}
        </h3>
    );
};

export const RenderRichText: React.FC<{ config: any }> = ({ config }) => {
    const html = config.html || '<p class="text-gray-400 italic">Escribe el contenido enriquecido aquí...</p>';
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

export const RenderTwoColumn: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="grid grid-cols-2 gap-3 my-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="flex flex-col border-r border-slate-200">
                <div className="p-2 font-bold text-[9px] uppercase text-white" style={{
                    backgroundColor: config.leftHeaderStyle === 'blue' ? DYN_COLORS.blue : config.leftHeaderStyle === 'gold' ? DYN_COLORS.gold : config.leftHeaderStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
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
                    backgroundColor: config.rightHeaderStyle === 'blue' ? DYN_COLORS.blue : config.rightHeaderStyle === 'gold' ? DYN_COLORS.gold : config.rightHeaderStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
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

export const RenderGantt: React.FC<{ config: any }> = ({ config }) => {
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
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Objetivos</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>N°</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Actividades</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Recursos</th>
                        {months.map((m: string, i: number) => (
                            <th key={i} className="border border-slate-300 p-1 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} colSpan={4}>
                                {m}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {months.map(() =>
                            [1, 2, 3, 4].map((w) => (
                                <th key={w} className="border border-slate-300 p-0.5 text-[7px] text-center font-semibold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }}>
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

export const RenderSignatures: React.FC<{ config: any }> = ({ config }) => {
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
            <div className="text-center text-[8px] font-mono text-slate-400 mt-4 border-t border-dashed border-slate-200 pt-2">
                {config.textoPieFirma || 'Comisión de Acreditación e Investigación IST Traversari'}
            </div>
        </div>
    );
};
