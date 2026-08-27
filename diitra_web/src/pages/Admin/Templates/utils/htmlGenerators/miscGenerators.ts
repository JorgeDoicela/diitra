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
    const mode = c.signaturesMode || 'team_dynamic';

    if (mode === 'custom_manual') {
        const sigs = (c.signatories && Array.isArray(c.signatories) && c.signatories.length > 0)
            ? c.signatories
            : [
                { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
                { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
            ];

        const colWidthPct = Math.floor(100 / Math.max(sigs.length, 1));

        const sigCells = sigs.map((s: any) => `
      <td style="width: ${colWidthPct}%; vertical-align: top; text-align: center; padding: 0 15px; border: none;">
        <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
        <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">${s.label}</div>
        <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 30px;">${s.name}</div>
        <div style="color: #64748b; font-size: 8.5pt;">${s.role}</div>
      </td>`).join('');

        return `
  <!-- BLOQUE: FIRMAS MANUALES -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 50px; border: none; page-break-inside: avoid;">
    <tbody>
      <tr>
        ${sigCells}
      </tr>
    </tbody>
  </table>`;
    }

    // Modo Dinámico por Equipo / Institucional
    const includeDirector = c.includeDirector !== false;
    const includeDocentes = c.includeDocentes !== false;
    const includeEstudiantes = Boolean(c.includeEstudiantes);
    const includeCoordCarrera = c.includeCoordinadorCarrera !== false;
    const includeCoordDiitra = Boolean(c.includeCoordinadorDiitra) || mode === 'institutional_chain';
    const includeVicerrector = Boolean(c.includeVicerrectorado);

    const dynamicSnippets: Record<string, string> = {
        director: includeDirector ? `
        <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
          <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">DIRECTOR DEL PROYECTO</div>
          <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default director_proyecto DirectorProyecto }}</div>
          <div style="color: #64748b; font-size: 8.5pt;">Director de Proyecto</div>
        </td>` : '',
        docentes: includeDocentes ? `
        {{#each investigadores}}
          {{#if (and (not (eq this.rol "DIRECTOR")) (not (eq this.rol "ESTUDIANTE")) (not (eq this.rol "AUXILIAR")))}}
          <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
            <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">DOCENTE INVESTIGADOR</div>
            <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default this.nombre this.Nombre }}</div>
            <div style="color: #64748b; font-size: 8.5pt;">{{ default this.carrera this.Carrera "Docente Investigador" }}</div>
          </td>
          {{/if}}
        {{/each}}` : '',
        estudiantes: includeEstudiantes ? `
        {{#each investigadores}}
          {{#if (or (eq this.rol "ESTUDIANTE") (eq this.rol "AUXILIAR"))}}
          <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
            <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">ESTUDIANTE INVESTIGADOR</div>
            <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default this.nombre this.Nombre }}</div>
            <div style="color: #64748b; font-size: 8.5pt;">Auxiliar de Investigación</div>
          </td>
          {{/if}}
        {{/each}}` : '',
        coordinador_carrera: includeCoordCarrera ? `
        <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
          <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">COORDINACIÓN DE CARRERA</div>
          <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default coordinador_carrera CoordinadorCarrera "[Coordinador de Carrera]" }}</div>
          <div style="color: #64748b; font-size: 8.5pt;">Coordinador de Carrera</div>
        </td>` : '',
        coordinador_diitra: includeCoordDiitra ? `
        <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
          <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">COMISIÓN DE EVALUACIÓN</div>
          <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default coordinador_investigacion "Ing. Estefani Sánchez Mgtr." }}</div>
          <div style="color: #64748b; font-size: 8.5pt;">Coordinadora de Investigación DIITRA</div>
        </td>` : '',
        vicerrectorado: includeVicerrector ? `
        <td style="vertical-align: top; text-align: center; padding: 15px; border: none;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 6px auto;"></div>
          <div style="font-weight: bold; font-size: 8pt; color: #475569; text-transform: uppercase; margin-bottom: 4px;">RESOLUCIÓN INSTITUCIONAL</div>
          <div style="font-size: 9pt; font-weight: bold; color: #0f172a; margin-top: 25px;">{{ default vicerrector_academico "[Vicerrectorado Académico]" }}</div>
          <div style="color: #64748b; font-size: 8.5pt;">Vicerrectorado Académico</div>
        </td>` : '',
    };

    const defaultOrder = ['director', 'docentes', 'estudiantes', 'coordinador_carrera', 'coordinador_diitra', 'vicerrectorado'];
    const configuredOrder: string[] = c.signaturesOrder || defaultOrder;
    const fullOrder = Array.from(new Set([...configuredOrder, ...defaultOrder]));

    const cellsHtml = fullOrder
        .map(id => dynamicSnippets[id] || '')
        .filter(Boolean)
        .join('');

    return `
  <!-- BLOQUE: FIRMAS DE RESPONSABILIDAD Y TRAZABILIDAD DINÁMICAS -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 40px; border: none; page-break-inside: avoid;">
    <tbody>
      <tr>
        ${cellsHtml}
      </tr>
    </tbody>
  </table>`;

    return html;
};

export const generatePageBreakHtml = (): string => {
    return `\n  <!-- SALTO DE PÁGINA -->\n  <div class="page-break"></div>`;
};
