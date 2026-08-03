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
    const c: any = block.config;
    return `
  <!-- BLOQUE: INVESTIGADORES -->
  <table class="info-table">
    <thead><tr>
      <th style="${headerBg('blue')}">Nombre Completo</th>
      <th style="${headerBg('blue')}">Rol en Proyecto</th>
      ${c.mostrarCedula !== false ? `<th style="${headerBg('blue')}">Cédula</th>` : ''}
      ${c.mostrarEmail !== false ? `<th style="${headerBg('blue')}">Email</th>` : ''}
      ${c.mostrarTelefono !== false ? `<th style="${headerBg('blue')}">Teléfono</th>` : ''}
      ${c.mostrarNivelAcademico !== false ? `<th style="${headerBg('blue')}">Nivel Académico</th>` : ''}
      ${c.mostrarHoras !== false ? `<th style="${headerBg('blue')}">Horas</th>` : ''}
    </tr></thead>
    <tbody>
      {{#each participantes}}
      <tr>
        <td>{{this.nombre}}</td>
        <td>{{this.rol}}</td>
        ${c.mostrarCedula !== false ? '<td>{{this.cedula}}</td>' : ''}
        ${c.mostrarEmail !== false ? '<td>{{this.email}}</td>' : ''}
        ${c.mostrarTelefono !== false ? '<td>{{this.telefono}}</td>' : ''}
        ${c.mostrarNivelAcademico !== false ? '<td>{{this.nivelAcademico}}</td>' : ''}
        ${c.mostrarHoras !== false ? '<td>{{this.horas}} hs</td>' : ''}
      </tr>
      {{/each}}
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
