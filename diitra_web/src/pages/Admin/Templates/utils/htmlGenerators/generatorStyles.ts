import type { TableSection } from '../types';

export const COLORS = {
    blue: '{{ theme.colors.primary }}',
    gold: '{{ theme.colors.secondary }}',
    gray: '{{ theme.colors.text }}',
    lightBlue: '#f0f3f9',
    lightGold: '#fdf8ef',
    lightGray: '#f8fafc',
};

export const headerBg = (style?: string) => {
    switch (style) {
        case 'blue': 
            return `background: {{default theme.colors.table_header_bg "#222c57"}}; color: {{default theme.colors.table_header_color "#ffffff"}} !important;`;
        case 'gold': 
            return `background: {{default theme.colors.secondary "#c4a857"}}; color: #ffffff !important;`;
        case 'gray': 
            return `background: #f1f5f9; color: {{default theme.colors.text "#1a1a1a"}};`;
        default: 
            return `background: #ffffff; color: #000000;`;
    }
};

export const BASE_STYLES = `
<style>
  * { box-sizing: border-box; }
  
  @page {
      margin-top: {{ theme.layout.margin_top }};
      margin-bottom: {{ theme.layout.margin_bottom }};
      margin-left: {{ theme.layout.margin_left }};
      margin-right: {{ theme.layout.margin_right }};
  }
  @page:first {
      margin: 0 !important;
  }

  /* Reset y Core del Documento con Tematización Dinámica */
  .doc-container { 
      font-family: {{ theme.typography.font_family }}; 
      font-size: {{default theme.typography.base_size "10pt"}};
      color: {{ theme.colors.text }}; 
      line-height: {{ theme.typography.line_height }};
      padding: 0; 
      background: transparent; 
  }
  
  /* Marca de Agua / Imagen de Fondo de Hojas Paginadas (PDF Paged Media) */
  .doc-watermark {
      position: fixed;
      top: 0;
      left: 0;
      width: 210mm;
      height: 0;
      line-height: 0;
      font-size: 0;
      z-index: -1;
      pointer-events: none;
      {{#if theme.brand.background_image}}
      background-image: url('{{ theme.brand.background_image }}');
      background-size: {{default theme.brand.background_fit "contain"}};
      background-position: center center;
      background-repeat: no-repeat;
      opacity: {{default theme.brand.background_opacity "0.12"}};
      {{/if}}
  }
  
  /* Portada (Cover Page) Full Bleed con Imagen de Fondo y Z-Index */
  .cover-page {
      font-family: {{ theme.typography.font_family }};
      position: relative;
      width: 210mm;
      height: 296.5mm;
      min-height: 296.5mm;
      max-height: 296.5mm;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      {{#if portada_base64}}
      background-image: url('data:image/jpeg;base64,{{portada_base64}}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      {{/if}}
      color: {{ theme.colors.primary }};
      z-index: 1000;
      overflow: hidden;
      page-break-inside: avoid;
      page-break-after: always;
  }

  .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 3cm 2cm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      justify-content: space-around;
  }

  .main-label {
      font-family: {{ theme.typography.font_family }};
      font-size: 24pt;
      font-weight: bold;
      color: {{ theme.colors.secondary }};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
      width: 100%;
  }

  .project-theme {
      font-family: {{ theme.typography.font_family }};
      font-size: 16pt;
      font-weight: bold;
      color: {{ theme.colors.primary }};
      text-transform: uppercase;
      margin: 1.5cm 0;
      line-height: 1.3;
      width: 100%;
      word-wrap: break-word;
  }

  .career-container {
      margin: 1cm 0;
      text-align: center;
      width: 100%;
  }

  .career-label {
      font-family: {{ theme.typography.font_family }};
      font-size: 12pt;
      font-weight: bold;
      color: {{ theme.colors.primary }};
      text-transform: uppercase;
  }

  .career-value {
      font-family: {{ theme.typography.font_family }};
      font-size: 12pt;
      font-weight: normal;
      color: {{ theme.colors.primary }};
      text-transform: uppercase;
      margin-top: 4px;
  }

  .period-container {
      width: 100%;
      margin-top: 1cm;
      text-align: center;
  }

  .period-label {
      font-family: {{ theme.typography.font_family }};
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      color: {{ theme.colors.primary }};
  }

  .period-value {
      font-family: {{ theme.typography.font_family }};
      font-size: 11pt;
      font-weight: normal;
      text-transform: uppercase;
      color: {{ theme.colors.primary }};
      margin-top: 2px;
  }

  /* Títulos de sección */
  .title-h1 { 
      font-size: 16pt; 
      font-weight: bold; 
      color: {{default theme.colors.primary "#222c57"}}; 
      margin-top: 35px; 
      text-transform: uppercase; 
  }
  .title-h2 { 
      font-size: 10pt; 
      font-weight: 800; 
      background: {{default theme.colors.table_header_bg "#222c57"}}; 
      color: {{default theme.colors.table_header_color "#ffffff"}} !important; 
      padding: 6px 12px; 
      margin-top: 25px; 
      text-transform: uppercase; 
  }
  .title-h3 { 
      font-size: 9.5pt; 
      font-weight: bold; 
      color: {{default theme.colors.secondary "#c4a857"}}; 
      margin-top: 15px; 
      text-transform: uppercase; 
  }
  
  /* Tablas generales compactas con bordes negros (formato premium original) */
  .info-table, .data-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 12px; 
      font-size: 9pt; 
      background: #ffffff; 
  }
  .info-table td, .info-table th, .data-table td, .data-table th { 
      border: 1px solid #000000; 
      padding: 0 8px; 
      height: 0.6cm;
      vertical-align: middle; 
      color: #000000;
  }
  .info-table th, .data-table th { 
      font-weight: bold; 
      text-transform: uppercase; 
      font-size: 8.5pt; 
      background: {{ theme.colors.table_header_bg }};
      color: {{ theme.colors.table_header_color }};
      text-align: center;
  }
  .label-cell { 
      font-weight: bold; 
      background: {{ theme.colors.table_header_bg }}; 
      color: {{ theme.colors.table_header_color }};
      width: 35%; 
      text-transform: uppercase; 
      font-size: 8.5pt; 
  }
  
  /* Texto enriquecido */
  .rich-content { 
      font-size: 9.5pt; 
      text-align: justify; 
      color: #000000; 
      margin-top: 10px; 
      line-height: 1.4; 
  }
  .rich-content p { margin: 6px 0; }
  .rich-content ul, .rich-content ol { padding-left: 20px; margin: 6px 0; }
  .rich-content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .rich-content table td, .rich-content table th { border: 1px solid #000000; padding: 6px 8px; font-size: 9pt; }
  .rich-content table th { background: {{ theme.colors.table_header_bg }}; color: {{ theme.colors.table_header_color }}; font-weight: bold; }
  
  /* Dos columnas */
  .two-col-wrapper { display: table; width: 100%; border-collapse: collapse; margin-top: 15px; }
  .two-col-cell    { display: table-cell; width: 50%; border: 1px solid #000000; vertical-align: top; }
  .col-header      { padding: 8px 12px; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
  .col-body        { padding: 10px 12px; font-size: 9pt; line-height: 1.4; }
  
  /* Salto de página */
  .page-break { page-break-after: always; height: 0; }
  
  /* Firmas y Trazabilidad */
  .signatures-row { display: flex; justify-content: space-around; margin-top: 80px; flex-wrap: wrap; gap: 20px; page-break-inside: avoid; }
  .sig-box        { text-align: center; min-width: 180px; padding-top: 12px; border-top: 1px solid #000000; font-size: 9pt; line-height: 1.5; }
  .sig-label      { font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 6px; }
  .sig-footer     { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
</style>
`;

export const renderSection = (section: TableSection): string => {
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
