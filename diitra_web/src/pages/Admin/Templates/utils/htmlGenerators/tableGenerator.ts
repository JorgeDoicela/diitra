import type { DocumentBlock, TableSection } from '../../types';
import { headerBg, COLORS } from './generatorStyles';

export const generateAdvancedTableHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const blockId = block.id ? block.id.replace('block-', '') : 'default';
    let varName = blockId;
    if (/^\d+$/.test(varName)) {
        varName = 'field_' + varName;
    }

    const thStyle = headerBg(c.headerStyle);
    const headersList = c.headers && c.headers.length > 0 ? c.headers : ['Columna 1', 'Columna 2'];
    const heads = headersList.map((h: string, i: number) =>
        `<th style="${thStyle}${c.colWidths?.[i] ? ` width: ${c.colWidths[i]};` : ''}">${h}</th>`
    ).join('');

    const dynamicCells = headersList.map((_: string, colIdx: number) =>
        `<td>{{default (lookup this "${colIdx}") (default (lookup this "col_${colIdx}") (default (lookup this.cells ${colIdx}) ""))}}</td>`
    ).join('');

    const defaultRowsHtml = (c.rows ?? []).map((row: any) =>
        `<tr>${(row.cells || []).map((cell: string, idx: number) => {
            const isLabel = idx === 0 && !c.headers?.length;
            return `<td class="${isLabel ? 'label-cell' : ''}">${cell}</td>`;
        }).join('')}</tr>`
    ).join('');

    return `
  <!-- BLOQUE: TABLA AVANZADA -->
  <table class="info-table">
    ${heads ? `<thead><tr>${heads}</tr></thead>` : ''}
    <tbody>
      {{#if ${varName}}}
        {{#each ${varName}}}
          <tr>${dynamicCells}</tr>
        {{/each}}
      {{else}}
        ${defaultRowsHtml}
      {{/if}}
    </tbody>
  </table>`;
};

export const generateMultiSectionTableHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const blockId = block.id || 'default';
    let html = `\n  <!-- BLOQUE: TABLA MULTI-SECCIÓN -->`;
    const sectionsList = c.sections ?? [];
    
    sectionsList.forEach((section: TableSection, secIdx: number) => {
        const listKey = `MultiSec_${blockId}_${secIdx}`;
        const snakeKey = `multi_sec_${blockId.replace(/-/g, '_')}_${secIdx}`;
        const lowerKey = `multisec_${blockId.replace(/-/g, '')}_${secIdx}`;
        const titleSlug = (section.title || '').replace(/\s+/g, '').replace(/_/g, '');
        const aliasKey = titleSlug ? `MultiSec_${titleSlug}` : null;
        const aliasSnake = titleSlug ? `multi_sec_${titleSlug.toLowerCase()}` : null;

        const thStyle = headerBg(section.headerStyle);
        const headers = section.headers && section.headers.length > 0 ? section.headers : ['Columna 1', 'Columna 2'];
        const headersHtml = headers.map((h, i) =>
            `<th style="${thStyle}${section.colWidths?.[i] ? ` width: ${section.colWidths[i]};` : ''}">${h}</th>`
        ).join('');

        const dynamicCellsHtml = headers.map((_, colIdx) =>
            `<td>{{default (lookup this "col_${colIdx}") (default (lookup this "col${colIdx}") (default (lookup this "${colIdx}") (default (lookup this.cells ${colIdx}) "")))}}</td>`
        ).join('');

        const defaultRowsHtml = (section.rows ?? []).map(row =>
            `<tr>${(row.cells || []).map(c => `<td>${c}</td>`).join('')}</tr>`
        ).join('');

        html += `
  <p style="font-weight: bold; font-size: 9pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 14px 0 4px;">${section.title}</p>
  <table class="info-table">
    <thead><tr>${headersHtml}</tr></thead>
    <tbody>
      {{#if ${listKey}}}
        {{#each ${listKey}}}
          <tr>${dynamicCellsHtml}</tr>
        {{/each}}
      {{else}}{{#if ${snakeKey}}}
        {{#each ${snakeKey}}}
          <tr>${dynamicCellsHtml}</tr>
        {{/each}}
      {{else}}{{#if ${lowerKey}}}
        {{#each ${lowerKey}}}
          <tr>${dynamicCellsHtml}</tr>
        {{/each}}
      {{else}}{{#if ${aliasKey}}}
        {{#each ${aliasKey}}}
          <tr>${dynamicCellsHtml}</tr>
        {{/each}}
      {{else}}{{#if ${aliasSnake}}}
        {{#each ${aliasSnake}}}
          <tr>${dynamicCellsHtml}</tr>
        {{/each}}
      {{else}}
        ${defaultRowsHtml}
      {{/if}}{{/if}}{{/if}}{{/if}}{{/if}}
    </tbody>
  </table>
`;
    });

    return html;
};

export const generateResearchersTableHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const title = c.title || block.title || '2.  INVESTIGADORES';
    const headerBg = c.headerColor || '#1e2a4a';

    const showCedula = c.mostrarCedula !== false;
    const showEmail = c.mostrarEmail !== false;
    const showTelefono = c.mostrarTelefono !== false;
    const showNivelAcademico = c.mostrarNivelAcademico !== false;
    const showHoras = Boolean(c.mostrarHoras);

    return `
  <!-- BLOQUE: 2. INVESTIGADORES -->
  <p style="font-weight: bold; font-size: 10pt; text-transform: uppercase; color: #1e2a4a; margin-top: 18px; margin-bottom: 6px; font-family: {{ theme.typography.font_family }};">${title}</p>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-family: {{ theme.typography.font_family }};">
    <thead>
      <tr style="page-break-inside: avoid;">
        <th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">NOMBRE</th>
        ${showCedula ? `<th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">NÚMERO DE CÉDULA</th>` : ''}
        ${showEmail ? `<th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">EMAIL</th>` : ''}
        ${showTelefono ? `<th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">TELEFONO</th>` : ''}
        ${showNivelAcademico ? `<th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">NIVEL ACADÉMICO</th>` : ''}
        ${showHoras ? `<th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">HORAS</th>` : ''}
        <th style="background-color: ${headerBg} !important; color: #ffffff !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; border: 1px solid #000000;">ROL</th>
      </tr>
    </thead>
    <tbody>
      <!-- Fila Director -->
      <tr style="page-break-inside: avoid;">
        <td style="padding: 5px 6px; font-size: 8pt; border: 1px solid #000000; vertical-align: top;">
          <div style="font-weight: bold; color: #000000;">Director</div>
          <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">{{#if director_proyecto}}{{director_proyecto}}{{else}}[Indicar Título abreviado, nombres y apellidos completos]{{/if}}</div>
        </td>
        ${showCedula ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">{{default director_cedula "[Especificar el número de cédula]"}}</td>` : ''}
        ${showEmail ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">{{default director_email "[ejemplo@istpet.edu]"}}</td>` : ''}
        ${showTelefono ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">{{default director_telefono "[Indicar su número de contacto]"}}</td>` : ''}
        ${showNivelAcademico ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">{{default director_nivel_academico "[Especificar el título más alto que está debidamente registrado en la Senescyt]"}}</td>` : ''}
        ${showHoras ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; text-align: center; font-weight: bold; vertical-align: middle;">{{default director_horas "20 hs"}}</td>` : ''}
        <td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">{{default director_rol_institucional "[Indicar rol dentro del ISTPET]"}}</td>
      </tr>
      <!-- Fila Docentes -->
      <tr style="page-break-inside: avoid;">
        <td style="padding: 5px 6px; font-size: 8pt; border: 1px solid #000000; vertical-align: top;">
          <div style="font-weight: bold; color: #000000;">Docentes</div>
          <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">[Indicar Título abreviado, nombres y apellidos completos]</div>
        </td>
        ${showCedula ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showEmail ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showTelefono ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showNivelAcademico ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showHoras ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; text-align: center; font-weight: bold; vertical-align: middle;">10 hs</td>` : ''}
        <td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>
      </tr>
      <!-- Fila Estudiantes -->
      <tr style="page-break-inside: avoid;">
        <td style="padding: 5px 6px; font-size: 8pt; border: 1px solid #000000; vertical-align: top;">
          <div style="font-weight: bold; color: #000000;">Estudiantes</div>
          <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">[Indicar nombres y apellidos completos]</div>
        </td>
        ${showCedula ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showEmail ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showTelefono ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showNivelAcademico ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>` : ''}
        ${showHoras ? `<td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; text-align: center; font-weight: bold; vertical-align: middle;">N/A</td>` : ''}
        <td style="padding: 5px 6px; font-size: 7.5pt; color: #334155; border: 1px solid #000000; vertical-align: middle;">&nbsp;</td>
      </tr>
      <!-- Fila libre 1 -->
      <tr style="page-break-inside: avoid; height: 22px;">
        <td style="border: 1px solid #000000;">&nbsp;</td>
        ${showCedula ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showEmail ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showTelefono ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showNivelAcademico ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showHoras ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        <td style="border: 1px solid #000000;">&nbsp;</td>
      </tr>
      <!-- Fila libre 2 -->
      <tr style="page-break-inside: avoid; height: 22px;">
        <td style="border: 1px solid #000000;">&nbsp;</td>
        ${showCedula ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showEmail ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showTelefono ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showNivelAcademico ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        ${showHoras ? `<td style="border: 1px solid #000000;">&nbsp;</td>` : ''}
        <td style="border: 1px solid #000000;">&nbsp;</td>
      </tr>
    </tbody>
  </table>`;
};

export const generateRubricTableHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    return `
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
          ${c.mostrarObservacionesCriterio ? '{{#if this.observaciones}}<div style="font-size: 8.5pt; color: {{ theme.colors.secondary }}; margin-top: 4px; font-style: italic;">Obs: {{this.observaciones}}</div>{{/if}}' : ''}
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
};
