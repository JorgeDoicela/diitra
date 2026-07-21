import type { DocumentBlock, TableSection, GanttObjective } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de estilo institucional
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
    blue: '#1e2a4a',
    gold: '#b8912e',
    gray: '#475569',
    lightBlue: '#f0f3f9',
    lightGold: '#fdf8ef',
    lightGray: '#f8fafc',
};

const headerBg = (style?: string) => {
    switch (style) {
        case 'blue': return `background: ${COLORS.blue}; color: white;`;
        case 'gold': return `background: ${COLORS.gold}; color: white;`;
        case 'gray': return `background: ${COLORS.gray}; color: white;`;
        default: return `background: ${COLORS.lightGray}; color: ${COLORS.gray};`;
    }
};

const BASE_STYLES = `
<style>
  * { box-sizing: border-box; }
  .doc-container { font-family: 'Inter', Arial, sans-serif; color: ${COLORS.blue}; padding: 30px; line-height: 1.6; }
  /* Portada */
  .cover-logo   { text-align: right; margin-bottom: 50px; }
  .cover-title  { font-size: 22pt; font-weight: 900; text-transform: uppercase; text-align: center; margin-top: 60px; }
  .cover-line   { width: 80px; height: 4px; background: ${COLORS.gold}; margin: 30px auto; }
  .cover-subtitle { font-size: 14pt; font-weight: 800; color: ${COLORS.gold}; text-align: center; text-transform: uppercase; margin: 40px 0; }
  .cover-career { font-size: 11pt; font-weight: bold; color: #475569; text-align: center; margin-top: 80px; }
  .cover-period { font-size: 10pt; color: #64748b; text-align: center; margin-top: 10px; }
  /* Títulos de sección */
  .title-h1 { font-size: 16pt; font-weight: bold; color: ${COLORS.blue}; margin-top: 35px; text-transform: uppercase; }
  .title-h2 { font-size: 11pt; font-weight: bold; background: ${COLORS.blue}; color: white; padding: 8px 15px; margin-top: 30px; text-transform: uppercase; }
  .title-h3 { font-size: 10pt; font-weight: bold; color: ${COLORS.gold}; margin-top: 20px; text-transform: uppercase; }
  /* Tablas generales */
  .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9.5pt; }
  .info-table td, .info-table th { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; vertical-align: top; }
  .info-table th { font-weight: bold; text-transform: uppercase; font-size: 8.5pt; }
  .label-cell   { font-weight: bold; background: ${COLORS.lightGray}; width: 28%; text-transform: uppercase; font-size: 8.5pt; color: #475569; }
  /* Texto enriquecido */
  .rich-content { font-size: 9.5pt; text-align: justify; color: #334155; margin-top: 10px; line-height: 1.6; }
  .rich-content p { margin: 6px 0; }
  .rich-content ul, .rich-content ol { padding-left: 20px; margin: 6px 0; }
  .rich-content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .rich-content table td, .rich-content table th { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9pt; }
  .rich-content table th { background: ${COLORS.lightGray}; font-weight: bold; }
  /* Dos columnas */
  .two-col-wrapper { display: table; width: 100%; border-collapse: collapse; margin-top: 15px; }
  .two-col-cell    { display: table-cell; width: 50%; border: 1px solid #cbd5e1; vertical-align: top; }
  .col-header      { padding: 8px 12px; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
  .col-body        { padding: 10px 12px; font-size: 9pt; line-height: 1.6; }
  /* Salto de página */
  .page-break { page-break-after: always; height: 0; }
  /* Firmas */
  .signatures-row { display: flex; justify-content: space-around; margin-top: 80px; flex-wrap: wrap; gap: 20px; }
  .sig-box        { text-align: center; min-width: 180px; padding-top: 12px; border-top: 1px solid ${COLORS.blue}; font-size: 9pt; line-height: 1.5; }
  .sig-label      { font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 6px; }
  .sig-footer     { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
</style>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Generador de sub-tabla institucional
// ─────────────────────────────────────────────────────────────────────────────
const renderSection = (section: TableSection): string => {
    const thStyle = headerBg(section.headerStyle);
    const headers = section.headers?.map((h, i) =>
        `<th style="${thStyle}${section.colWidths?.[i] ? ` width: ${section.colWidths[i]};` : ''}">${h}</th>`
    ).join('') ?? '';

    const rows = (section.rows ?? []).map(row =>
        `<tr>${row.cells.map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('');

    return `
  <p style="font-weight: bold; font-size: 9pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 14px 0 4px;">${section.title}</p>
  <table class="info-table">
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────────────────────────────────────
export const generateHtmlFromBlocks = (blockList: DocumentBlock[]): string => {
    let html = `${BASE_STYLES}\n<div class="doc-container">`;

    for (const block of blockList) {
        if (!block.isActive) continue;
        const c = block.config;

        switch (block.type) {
            // ── PORTADA ─────────────────────────────────────────────────────
            case 'cover':
                html += `
  <!-- BLOQUE: PORTADA -->
  <div style="text-align: center; margin-bottom: 100px; page-break-after: always;">
    <div class="cover-logo">
      <img src="{{logo_base64}}" style="max-height: 70px;" alt="Logo Traversari" />
    </div>
    <h1 class="cover-title" style="color: ${c.colorTema || COLORS.blue};">${c.tituloSuperior || 'PROYECTO DE INVESTIGACIÓN'}</h1>
    <div class="cover-line"></div>
    <div class="cover-subtitle">{{titulo}}</div>
    <div class="cover-career">${c.carreraPorDefecto || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE'}</div>
    <div class="cover-period">${c.periodoPorDefecto || 'PERIODO ACADÉMICO 2026'}</div>
  </div>`;
                break;

            // ── TÍTULO ──────────────────────────────────────────────────────
            case 'title': {
                const cls = c.fontSize === 'H1' ? 'title-h1' : c.fontSize === 'H3' ? 'title-h3' : 'title-h2';
                html += `
  <!-- BLOQUE: TÍTULO -->
  <div class="${cls}" style="text-align: ${c.alignment || 'left'}; ${c.color ? `color: ${c.color};` : ''}">${c.text || 'TÍTULO'}</div>`;
                break;
            }

            // ── TEXTO ENRIQUECIDO ────────────────────────────────────────────
            case 'rich_text':
                html += `
  <!-- BLOQUE: TEXTO ENRIQUECIDO -->
  <div class="rich-content">${c.html || ''}</div>`;
                break;

            // ── TABLA AVANZADA ───────────────────────────────────────────────
            case 'advanced_table': {
                const thStyle = headerBg(c.headerStyle);
                const heads = (c.headers ?? []).map((h, i) =>
                    `<th style="${thStyle}${c.colWidths?.[i] ? ` width: ${c.colWidths[i]};` : ''}">${h}</th>`
                ).join('');
                const rows = (c.rows ?? []).map(row =>
                    `<tr>${row.cells.map((cell, idx) => {
                        const isLabel = idx === 0 && !c.headers?.length;
                        return `<td class="${isLabel ? 'label-cell' : ''}">${cell}</td>`;
                    }).join('')}</tr>`
                ).join('');
                html += `
  <!-- BLOQUE: TABLA AVANZADA -->
  <table class="info-table">
    ${heads ? `<thead><tr>${heads}</tr></thead>` : ''}
    <tbody>${rows}</tbody>
  </table>`;
                break;
            }

            // ── TABLA MULTI-SECCIÓN ──────────────────────────────────────────
            case 'multi_section_table':
                html += `\n  <!-- BLOQUE: TABLA MULTI-SECCIÓN -->`;
                for (const section of (c.sections ?? [])) {
                    html += renderSection(section);
                }
                break;

            // ── DOS COLUMNAS ─────────────────────────────────────────────────
            case 'two_column': {
                const lStyle = headerBg(c.leftHeaderStyle);
                const rStyle = headerBg(c.rightHeaderStyle);
                html += `
  <!-- BLOQUE: DOS COLUMNAS -->
  <div class="two-col-wrapper">
    <div class="two-col-cell">
      <div class="col-header" style="${lStyle}">${c.leftTitle || 'COLUMNA IZQUIERDA'}</div>
      <div class="col-body rich-content">${c.leftContent || ''}</div>
    </div>
    <div class="two-col-cell">
      <div class="col-header" style="${rStyle}">${c.rightTitle || 'COLUMNA DERECHA'}</div>
      <div class="col-body rich-content">${c.rightContent || ''}</div>
    </div>
  </div>`;
                break;
            }

            // ── SALTO DE PÁGINA ──────────────────────────────────────────────
            case 'page_break':
                html += `\n  <!-- SALTO DE PÁGINA -->\n  <div class="page-break"></div>`;
                break;

            // ── CRONOGRAMA DE GANTT ───────────────────────────────────────────
            case 'gantt': {
                const months = c.ganttMonths ?? [
                    'Marzo','Abril','Mayo','Junio','Julio','Agosto',
                    'Sept','Octubre','Nov','Dic','Enero','Febrero'
                ];
                const objectives: GanttObjective[] = c.ganttObjectives ?? [];

                // Calcular total de columnas: Objetivos + N° + Actividades + Recursos + (meses * 4 semanas)
                const totalWeekCols = months.length * 4;

                // Estilos inline para la tabla Gantt
                const ganttTh = `border: 1px solid #cbd5e1; padding: 4px 2px; font-size: 7pt; text-align: center; font-weight: bold; background: ${COLORS.blue}; color: white; white-space: nowrap;`;
                const ganttTd = `border: 1px solid #e2e8f0; padding: 3px 4px; font-size: 7.5pt; vertical-align: middle;`;
                const ganttTdCenter = `${ganttTd} text-align: center;`;
                const objCell = `border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 7.5pt; font-weight: bold; background: #f8fafc; text-align: center; vertical-align: middle;`;

                // Helper: ¿la semana global [weekIdx] está dentro del rango de la actividad?
                const isInRange = (startMonth: number, startWeek: number, endMonth: number, endWeek: number, mIdx: number, wIdx: number): boolean => {
                    const startGlobal = startMonth * 4 + startWeek;
                    const endGlobal   = endMonth   * 4 + endWeek;
                    const cellGlobal  = mIdx * 4 + wIdx;
                    return cellGlobal >= startGlobal && cellGlobal <= endGlobal;
                };

                // Calcular cuantas filas tiene cada objetivo para el rowspan
                const objRowspans = objectives.map(o => Math.max(o.activities.length, 1));

                // Construir cabecera de meses
                const monthHeaders = months.map(m =>
                    `<th colspan="4" style="${ganttTh}">${m}</th>`
                ).join('');

                // Construir cabecera de semanas
                const weekHeaders = months.map(() =>
                    [1,2,3,4].map(w => `<th style="${ganttTh} font-size: 6pt; padding: 2px;">${w}</th>`).join('')
                ).join('');

                // Construir filas
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
                        // Celda del objetivo solo en la primera fila de ese objetivo
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

                html += `
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
                break;
            }

            // ── TABLA DE INVESTIGADORES (dinámica desde BD) ──────────────────
            case 'researchers_table':
                html += `
  <!-- BLOQUE: INVESTIGADORES -->
  <table class="info-table">
    <thead><tr>
      <th style="${headerBg('blue')}">Nombre Completo</th>
      <th style="${headerBg('blue')}">Rol en Proyecto</th>
      ${c.mostrarCedula ? `<th style="${headerBg('blue')}">Cédula</th>` : ''}
      ${c.mostrarEmail ? `<th style="${headerBg('blue')}">Email</th>` : ''}
      ${c.mostrarTelefono ? `<th style="${headerBg('blue')}">Teléfono</th>` : ''}
      ${c.mostrarNivelAcademico ? `<th style="${headerBg('blue')}">Nivel Académico</th>` : ''}
      ${c.mostrarHoras ? `<th style="${headerBg('blue')}">Horas</th>` : ''}
    </tr></thead>
    <tbody>
      {{#each participantes}}
      <tr>
        <td>{{this.nombre}}</td>
        <td>{{this.rol}}</td>
        ${c.mostrarCedula ? '<td>{{this.cedula}}</td>' : ''}
        ${c.mostrarEmail ? '<td>{{this.email}}</td>' : ''}
        ${c.mostrarTelefono ? '<td>{{this.telefono}}</td>' : ''}
        ${c.mostrarNivelAcademico ? '<td>{{this.nivelAcademico}}</td>' : ''}
        ${c.mostrarHoras ? '<td>{{this.horas}} hs</td>' : ''}
      </tr>
      {{/each}}
    </tbody>
  </table>`;
                break;

            // ── TABLA DE RÚBRICA (dinámica desde BD) ─────────────────────────
            case 'rubric_table':
                html += `
  <!-- BLOQUE: RÚBRICA -->
  <table class="info-table">
    <thead><tr>
      <th style="${headerBg('blue')}">Criterio Evaluado</th>
      <th style="${headerBg('blue')} width: 100px; text-align: center;">Máximo</th>
      <th style="${headerBg('blue')} width: 100px; text-align: center;">Calificación</th>
    </tr></thead>
    <tbody>
      {{#each criterios_evaluados}}
      <tr>
        <td>
          <strong>{{this.nombre}}</strong>
          ${c.mostrarDescripcionCriterio ? '<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">{{this.descripcion}}</div>' : ''}
          ${c.mostrarObservacionesCriterio ? '{{#if this.observaciones}}<div style="font-size: 8.5pt; color: #b8912e; margin-top: 4px; font-style: italic;">Obs: {{this.observaciones}}</div>{{/if}}' : ''}
        </td>
        <td style="text-align: center;">{{this.peso}}</td>
        <td style="text-align: center; font-weight: bold;">{{default this.puntaje "0"}}</td>
      </tr>
      {{/each}}
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td style="text-align: right;">PUNTAJE TOTAL CONSOLIDADO:</td>
        <td style="text-align: center;">100</td>
        <td style="text-align: center; background: #e2e8f0; font-size: 11pt;">{{default puntaje_total "0"}}</td>
      </tr>
    </tbody>
  </table>`;
                break;

            // ── FIRMAS ───────────────────────────────────────────────────────
            case 'signatures': {
                const sigs = c.signatories ?? [
                    { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
                    { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
                ];
                const sigBoxes = sigs.map(s => `
    <div class="sig-box">
      <div class="sig-label">${s.label}</div>
      <div>&nbsp;</div>
      <div style="margin-top: 40px;">${s.name}</div>
      <div style="color: #64748b; font-size: 8.5pt;">${s.role}</div>
    </div>`).join('');
                html += `
  <!-- BLOQUE: FIRMAS -->
  <div class="signatures-row">${sigBoxes}</div>
  <div class="sig-footer">${c.textoPieFirma || 'IST Traversari'}</div>`;
                break;
            }
        }
    }

    html += '\n</div>';
    return html.trim();
};
