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
    const c: any = block.config;
    const sigs = c.signatories ?? [
        { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
        { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
    ];
    const sigBoxes = sigs.map((s: any) => `
    <div class="sig-box">
      <div class="sig-label">${s.label}</div>
      <div>&nbsp;</div>
      <div style="margin-top: 40px;">${s.name}</div>
      <div style="color: #64748b; font-size: 8.5pt;">${s.role}</div>
    </div>`).join('');

    return `
  <!-- BLOQUE: FIRMAS -->
  <div class="signatures-row">${sigBoxes}</div>
  <div class="sig-footer">${c.textoPieFirma || 'IST Traversari'}</div>`;
};

export const generatePageBreakHtml = (): string => {
    return `\n  <!-- SALTO DE PÁGINA -->\n  <div class="page-break"></div>`;
};
