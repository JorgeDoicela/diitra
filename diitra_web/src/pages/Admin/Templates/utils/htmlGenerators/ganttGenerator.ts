import type { DocumentBlock, GanttObjective } from '../../types';
import { COLORS } from './generatorStyles';

export const generateGanttHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const months: string[] = c.ganttMonths ?? [
        'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
        'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Feb'
    ];
    const objectives: GanttObjective[] = c.ganttObjectives ?? [];

    const ganttTh = `border: 1px solid #000000; padding: 4px 2px; font-size: 6.5pt; text-align: center; font-weight: bold; background: {{ theme.colors.table_header_bg }}; color: {{ theme.colors.table_header_color }}; text-transform: uppercase;`;
    const ganttThWeek = `border: 1px solid #000000; padding: 2px 1px; font-size: 5.5pt; text-align: center; font-weight: bold; background: {{ theme.colors.table_header_bg }}; color: {{ theme.colors.table_header_color }}; line-height: 1.1;`;
    const ganttTd = `border: 1px solid #000000; padding: 3px 4px; font-size: 7pt; vertical-align: middle;`;
    const ganttTdCenter = `${ganttTd} text-align: center;`;
    const objCell = `border: 1px solid #000000; padding: 4px 4px; font-size: 7pt; font-weight: bold; background: #ffffff; text-align: center; vertical-align: middle;`;

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
        [1, 2, 3, 4].map(w => `<th style="${ganttThWeek}">S<br/>${w}</th>`).join('')
    ).join('');

    let rows = '';
    objectives.forEach((obj, oIdx) => {
        const acts = obj.activities.length > 0 ? obj.activities : [{ id: '', name: '(sin actividades)', resources: '', startMonth: 0, startWeek: 0, endMonth: 0, endWeek: 0, color: '#64748b' as const }];
        acts.forEach((act, aIdx) => {
            const weekCells = months.map((_, mIdx) =>
                [0, 1, 2, 3].map(wIdx => {
                    const filled = isInRange(act.startMonth, act.startWeek, act.endMonth, act.endWeek, mIdx, wIdx);
                    return `<td style="${ganttTdCenter} ${filled ? `background: ${act.color};` : ''}"></td>`;
                }).join('')
            ).join('');

            rows += `<tr>`;
            if (aIdx === 0) {
                rows += `<td rowspan="${acts.length}" style="${objCell} width: 72px;">
                    <div style="font-weight: bold; font-size: 7pt; text-transform: uppercase; line-height: 1.25;">
                        OBJETIVO<br/>N° ${oIdx + 1}
                    </div>
                </td>`;
            }
            rows += `<td style="${ganttTdCenter} width: 20px; font-weight: bold;">${aIdx + 1}</td>`;
            rows += `<td style="${ganttTd}">${act.name}</td>`;
            rows += `<td style="${ganttTd} font-size: 6.5pt; color: #475569;">${act.resources}</td>`;
            rows += weekCells;
            rows += `</tr>`;
        });
    });

    return `
  <!-- START_LANDSCAPE_SECTION -->
  <div class="landscape-section" data-page-orientation="landscape" style="page-break-before: always; page-break-after: always; width: 100%;">
    <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: ${COLORS.blue}; margin-top: 15px; margin-bottom: 4px; margin-left: 35px; font-family: {{ theme.typography.font_family }};">
      ${block.title || '7.  CRONOGRAMA DE ACTIVIDADES'}
    </div>
    <div style="text-align: center; font-style: italic; font-weight: bold; font-size: 8.5pt; margin-bottom: 8px; color: #1e293b; font-family: {{ theme.typography.font_family }};">
      Cronograma (Diagrama de Gantt)
    </div>
    <div style="overflow-x: auto; width: 100%;">
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr>
            <th style="${ganttTh} width: 72px;" rowspan="2">Objetivos</th>
            <th style="${ganttTh} width: 20px;" rowspan="2">N°</th>
            <th style="${ganttTh} width: 22%;" rowspan="2">Actividades</th>
            <th style="${ganttTh} width: 18%;" rowspan="2">Recursos Necesarios</th>
            ${monthHeaders}
          </tr>
          <tr>${weekHeaders}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <!-- END_LANDSCAPE_SECTION -->`;
};
