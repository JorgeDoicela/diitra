import type { DocumentBlock } from '../../types';
import { headerBg } from './generatorStyles';

export const generateTitleHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const cls = c.fontSize === 'H1' ? 'title-h1' : c.fontSize === 'H3' ? 'title-h3' : 'title-h2';
    return `
  <!-- BLOQUE: TÍTULO -->
  <div class="${cls}" style="text-align: ${c.alignment || 'left'};">${c.text || 'TÍTULO'}</div>`;
};

export const generateRichTextHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const blockId = block.id ? block.id.replace('block-', '') : 'default';
    let varName = blockId;
    if (/^\d+$/.test(varName)) {
        varName = 'field_' + varName;
    }
    const upperVar = (varName.startsWith('field_') ? 'FIELD_' + varName.substring(6) : varName.toUpperCase());
    const snakeVar = varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

    const titleHtml = c.title ? `\n  <div class="title-h2">${c.title}</div>` : '';

    return `
  <!-- BLOQUE: TEXTO ENRIQUECIDO -->${titleHtml}
  <div class="rich-content">{{{default ${varName} ${upperVar} ${snakeVar}}}}</div>`;
};

export const generateTwoColumnHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const blockId = block.id ? block.id.replace('block-', '') : 'default';
    let varName = blockId;
    if (/^\d+$/.test(varName)) {
        varName = 'field_' + varName;
    }
    const leftVar = varName + 'Izquierda';
    const rightVar = varName + 'Derecha';
    const leftUpper = (varName.startsWith('field_') ? 'FIELD_' + varName.substring(6) : varName) + 'Izquierda';
    const rightUpper = (varName.startsWith('field_') ? 'FIELD_' + varName.substring(6) : varName) + 'Derecha';
    const leftSnake = leftVar.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    const rightSnake = rightVar.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

    const lStyle = headerBg(c.leftHeaderStyle);
    const rStyle = headerBg(c.rightHeaderStyle);

    return `
  <!-- BLOQUE: DOS COLUMNAS -->
  <div class="two-col-wrapper">
    <div class="two-col-cell">
      <div class="col-header" style="${lStyle}">${c.leftTitle || 'COLUMNA IZQUIERDA'}</div>
      <div class="col-body rich-content">{{{default ${leftVar} ${leftUpper} ${leftSnake}}}}</div>
    </div>
    <div class="two-col-cell">
      <div class="col-header" style="${rStyle}">${c.rightTitle || 'COLUMNA DERECHA'}</div>
      <div class="col-body rich-content">{{{default ${rightVar} ${rightUpper} ${rightSnake}}}}</div>
    </div>
  </div>`;
};

export const generateSignaturesHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const sigs = (c.signatories && Array.isArray(c.signatories) && c.signatories.length > 0)
        ? c.signatories
        : [
            { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
            { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
        ];

    const colWidthPct = Math.floor(100 / sigs.length);

    const sigCells = sigs.map((s: any) => `
      <td style="width: ${colWidthPct}%; vertical-align: top; text-align: center; padding: 0 15px; border: none;">
        <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
        <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">${s.label}</div>
        <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 30px;">${s.name}</div>
        <div style="color: #64748b; font-size: 8.5pt;">${s.role}</div>
      </td>`).join('');

    return `
  <!-- BLOQUE: FIRMAS -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 50px; border: none; page-break-inside: avoid;">
    <tbody>
      <tr>
        ${sigCells}
      </tr>
    </tbody>
  </table>
  <div style="text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
    ${c.textoPieFirma || 'Comisión de Acreditación e Investigación IST Traversari'}
  </div>`;
};

export const generatePageBreakHtml = (): string => {
    return `\n  <!-- SALTO DE PÁGINA -->\n  <div class="page-break"></div>`;
};
