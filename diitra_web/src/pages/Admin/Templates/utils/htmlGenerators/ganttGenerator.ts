import type { DocumentBlock, GanttObjective } from '../../types';
import { COLORS } from './generatorStyles';

export const generateGanttHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const months = c.ganttMonths ?? [
        'Marzo','Abril','Mayo','Junio','Julio','Agosto',
        'Sept','Octubre','Nov','Dic','Enero','Febrero'
    ];
    const objectives: GanttObjective[] = c.ganttObjectives ?? [];

    const ganttTh = `border: 1px solid #000000; padding: 4px 2px; font-size: 7pt; text-align: center; font-weight: bold; background: {{ theme.colors.table_header_bg }}; color: {{ theme.colors.table_header_color }}; white-space: nowrap;`;
    const ganttTd = `border: 1px solid #000000; padding: 3px 4px; font-size: 7.5pt; vertical-align: middle;`;
    const ganttTdCenter = `${ganttTd} text-align: center;`;
    const objCell = `border: 1px solid #000000; padding: 4px 6px; font-size: 7.5pt; font-weight: bold; background: #ffffff; text-align: center; vertical-align: middle;`;

    const isInRange = (startMonth: number, startWeek: number, endMonth: number, endWeek: number, mIdx: number, wIdx: number): boolean => {
        const startGlobal = startMonth * 4 + startWeek;
        const endGlobal   = endMonth   * 4 + endWeek;
        const cellGlobal  = mIdx * 4 + wIdx;
        return cellGlobal >= startGlobal && cellGlobal <= endGlobal;
    };

    const monthHeaders = months.map(m =>
        `<th colspan="4" style="${ganttTh}">${m}</th>`
    ).join('');

    const weekHeaders = months.map(() =>
        [1,2,3,4].map(w => `<th style="${ganttTh} font-size: 6pt; padding: 2px;">${w}</th>`).join('')
    ).join('');

    let rows = '';
    objectives.forEach((obj, oIdx) => {
        const acts = obj.activities.length > 0 ? obj.activities : [{ id: '', name: '(sin actividades)', resources: '', startMonth: 0, startWeek: 0, endMonth: 0, endWeek: 0, color: '#64748b' as const }];
        acts.forEach((act, aIdx) => {
            const weekCells = months.map((_, mIdx) =>
                [0,1,2,3].map(wIdx => {
                    const filled = isInRange(act.startMonth, act.startWeek, act.endMonth, act.endWeek, mIdx, wIdx);
                    return `<td style="${ganttTdCenter} ${filled ? `background: ${act.color};` : ''}" ></td>`;
                }).join('')
            ).join('');

            rows += `<tr>`;
            if (aIdx === 0) {
                rows += `<td rowspan="${acts.length}" style="${objCell} writing-mode: vertical-lr; transform: rotate(180deg); max-width: 30px;">OBJETIVO N° ${oIdx + 1}</td>`;
            }
            rows += `<td style="${ganttTdCenter}">${aIdx + 1}</td>`;
            rows += `<td style="${ganttTd}">${act.name}</td>`;
            rows += `<td style="${ganttTd} font-size: 7pt; color: #64748b;">${act.resources}</td>`;
            rows += weekCells;
            rows += `</tr>`;
        });
    });

    return `
  <!-- BLOQUE: GANTT -->
  <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px; text-align: center;">Cronograma (Diagrama de Gantt)</div>
  <div style="overflow-x: auto;">
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <thead>
      <tr>
        <th style="${ganttTh}" rowspan="2">Objetivos</th>
        <th style="${ganttTh}" rowspan="2">N°</th>
        <th style="${ganttTh}" rowspan="2">Actividades</th>
        <th style="${ganttTh}" rowspan="2">Recursos Necesarios</th>
        ${monthHeaders}
      </tr>
      <tr>${weekHeaders}</tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  </div>`;
};
