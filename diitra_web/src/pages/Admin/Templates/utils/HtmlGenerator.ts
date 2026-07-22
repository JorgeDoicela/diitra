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
    <div class="cover-career">{{default carrera "${c.carreraPorDefecto || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE'}"}}</div>
    <div class="cover-period">{{default periodo "${c.periodoPorDefecto || 'PERIODO ACADÉMICO 2026'}"}}</div>
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

            // ── FICHA DE IDENTIFICACIÓN ──────────────────────────────────────
            case 'project_general_section':
                html += `
  <!-- BLOQUE: FICHA DE IDENTIFICACIÓN -->
  <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">Ficha de Identificación del Proyecto (Metadatos Científicos)</p>
  <table class="info-table">
    <tbody>
      <tr>
        <td class="label-cell">Título del Proyecto</td>
        <td style="font-weight: bold;">{{default titulo "[TEMA / NOMBRE DEL PROYECTO]"}}</td>
      </tr>
      <tr>
        <td class="label-cell">Carrera / Unidad Académica</td>
        <td>{{default carrera "No especificada"}}</td>
      </tr>
      <tr>
        <td class="label-cell">Convocatoria</td>
        <td>{{default convocatoria "No especificada"}}</td>
      </tr>
      <tr>
        <td class="label-cell">Línea de Investigación</td>
        <td>
          <div><strong>Línea:</strong> {{default linea_investigacion "No especificada"}}</div>
          <div style="margin-top: 4px;"><strong>Sublínea:</strong> {{default sublinea_investigacion "No especificada"}}</div>
        </td>
      </tr>
      <tr>
        <td class="label-cell">Campo Detallado CACES</td>
        <td>{{default campo_detallado "No especificado"}}</td>
      </tr>
    </tbody>
  </table>`;
                break;

            case 'project_technical_section':
                html += `
  <!-- BLOQUE: PLAN TÉCNICO Y CIENTÍFICO (8 SECCIONES) -->
  <div style="margin-top: 20px;">
    <p style="font-weight: bold; font-size: 10pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 10px; border-bottom: 1.5px solid ${COLORS.blue}; padding-bottom: 4px;">3. Plan Técnico del Proyecto</p>
    
    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.1 Antecedentes Específicos de la Problemática</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default antecedentes "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.2 Descripción General de la Propuesta</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default descripcion_proyecto "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.3 Justificación e Importancia</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default justificacion "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.4 Objetivos de Investigación</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b; margin-bottom: 8px;">
        <strong>Objetivo General:</strong>
        <div style="margin-top: 4px;">{{default objetivo_general "No redactado."}}</div>
      </div>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">
        <strong>Objetivos Específicos:</strong>
        <div style="margin-top: 4px;">{{default objetivos_especificos "No redactado."}}</div>
      </div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.5 Alineación de Objetivos de Desarrollo Sostenible (ODS)</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default objetivos_desarrollo_sostenible "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.6 Marco Teórico Científico</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default marco_teorico "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.7 Enfoque Metodológico</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default metodologia "No redactado."}}</div>
    </div>

    <div style="margin-bottom: 15px;">
      <p style="font-weight: bold; font-size: 9pt; color: ${COLORS.gray}; margin-bottom: 4px;">3.8 Evaluación Técnica de Resultados</p>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default evaluacion "No redactado."}}</div>
    </div>
  </div>`;
                break;

            case 'project_progress_report':
                html += `
  <!-- BLOQUE: AVANCE DE EJECUCIÓN -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">Avance de Ejecución y Monitoreo del Proyecto</p>
    
    <div style="margin-bottom: 15px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 4px;">Bitácora Científica & Conclusiones Parciales:</strong>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default conclusiones_parciales "Sin registros de bitácora."}}</div>
    </div>

    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">Hitos & Entregables Completados</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Actividad / Hito</th>
          <th style="${headerBg('blue')} width: 80px; text-align: center;">% Avance</th>
          <th style="${headerBg('blue')} width: 90px; text-align: center;">Completado</th>
        </tr>
      </thead>
      <tbody>
        {{#each hitos_completados}}
        <tr>
          <td>{{this.actividad}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.avance}} %</td>
          <td style="text-align: center; font-weight: bold; color: #10b981;">{{#if this.hito_completado}}SÍ{{else}}NO{{/if}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">Presupuesto de Gasto Ejecutado</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Partida / Gasto</th>
          <th style="${headerBg('blue')} width: 120px; text-align: right;">Monto Gastado</th>
        </tr>
      </thead>
      <tbody>
        {{#each presupuesto_ejecutado}}
        <tr>
          <td>{{this.partida}}</td>
          <td style="text-align: right; font-weight: bold;">$ {{this.monto_gastado}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
                break;

            case 'project_ethics_report':
                html += `
  <!-- BLOQUE: EVALUACIÓN DE ÉTICA -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px; border-bottom: 1.5px solid ${COLORS.blue}; padding-bottom: 4px;">Dictamen de Pertinencia Ética y Bioética</p>
    
    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Justificación Ética de la Propuesta:</strong>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default justificacion_etica "No registrada."}}</div>
    </div>

    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Riesgos Identificados & Medidas de Mitigación:</strong>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default riesgos_identificados "No registrada."}}</div>
    </div>

    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Procedimiento de Consentimiento Informado:</strong>
      <div style="font-size: 9pt; leading-relaxed: 1.5; color: #1e293b;">{{default metodo_consentimiento "No registrada."}}</div>
    </div>

    <div style="margin-top: 15px; padding: 10px; bg-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <tbody>
          <tr>
            <td style="width: 50%;">
              <strong>Dictamen Final del Comité:</strong><br/>
              <span style="font-size: 10.5pt; font-weight: bold; color: ${COLORS.blue}; text-transform: uppercase;">{{default dictamen_comite "Pendiente"}}</span>
            </td>
            <td>
              <strong>Observaciones / Sugerencias de Enmienda:</strong><br/>
              <span style="color: #475569;">{{default observaciones_especificas "Ninguna."}}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
                break;

            // ── RECURSOS Y PRESUPUESTO ───────────────────────────────────────
            case 'project_budget_section':
                html += `
  <!-- BLOQUE: RECURSOS Y PRESUPUESTO -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">4. Recursos y Presupuesto Detallado</p>
    
    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 10px 0 4px;">4.1 Recursos Disponibles (Equipos, Licencias, Espacios)</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Descripción del Recurso</th>
          <th style="${headerBg('blue')} width: 60px; text-align: center;">Cantidad</th>
          <th style="${headerBg('blue')} width: 150px;">Fuente</th>
        </tr>
      </thead>
      <tbody>
        {{#each recursos_disponibles}}
        <tr>
          <td>{{this.descripcion}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
          <td>{{this.fuente}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">4.2 Recursos Necesarios (Presupuesto de Gasto)</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Partida / Rubro</th>
          <th style="${headerBg('blue')} width: 60px; text-align: center;">Cantidad</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">P. Unitario</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each recursos_necesarios}}
        <tr>
          <td>{{this.descripcion}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
          <td style="text-align: right;">$ {{this.costo_unitario}}</td>
          <td style="text-align: right; font-weight: bold;">$ {{this.costo_total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <tbody>
          <tr>
            <td style="width: 65%;">
              <div style="margin-bottom: 4px;">
                <strong>Financiamiento Solicitado al ISTPET:</strong> {{#if financiamiento_istpet}}SÍ{{else}}NO{{/if}}
              </div>
              <div>
                <strong>Financiamiento Otras Fuentes:</strong> {{#if financiamiento_otras_fuentes}}SÍ ({{default nombres_otras_fuentes "No especificadas"}}){{else}}NO{{/if}}
              </div>
            </td>
            <td style="text-align: right; vertical-align: bottom;">
              <span style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: bold; display: block;">Costo Total Estimado:</span>
              <span style="font-size: 13pt; font-weight: bold; color: ${COLORS.blue};">$ {{default costo_total "0.00"}}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
                break;

            // ── MATRIZ DE IMPACTOS ───────────────────────────────────────────
            case 'impacts':
                html += `
  <!-- BLOQUE: MATRIZ DE IMPACTOS Y PRODUCTOS -->
  <div style="margin-top: 20px;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">5. Productos Esperados</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Tipo de Producto</th>
          <th style="${headerBg('blue')} width: 100px; text-align: center;">Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {{#each productos_esperados}}
        <tr>
          <td>{{this.tipo}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 25px 0 6px;">6. Matriz de Impacto</p>
    <table class="info-table">
      <tbody>
        <tr>
          <td class="label-cell" style="width: 25%;">Impacto Social</td>
          <td>{{default impacto.social "Sin descripción."}}</td>
        </tr>
        <tr>
          <td class="label-cell">Impacto Científico</td>
          <td>{{default impacto.cientifico "Sin descripción."}}</td>
        </tr>
        <tr>
          <td class="label-cell">Impacto Económico</td>
          <td>{{default impacto.economico "Sin descripción."}}</td>
        </tr>
        <tr>
          <td class="label-cell">Impacto Político</td>
          <td>{{default impacto.politico "Sin descripción."}}</td>
        </tr>
        <tr>
          <td class="label-cell">Impacto Ambiental</td>
          <td>{{default impacto.ambiental "Sin descripción."}}</td>
        </tr>
        <tr>
          <td class="label-cell">Otro Impacto</td>
          <td>{{default impacto.otro "Sin descripción."}}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
                break;
        }
    }

    html += '\n</div>';
    return html.trim();
};
