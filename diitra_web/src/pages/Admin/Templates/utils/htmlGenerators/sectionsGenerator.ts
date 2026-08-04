import type { DocumentBlock, IdentificationField, ImpactCategory } from '../../types';
import { DEFAULT_IMPACT_CATEGORIES } from '../../types';
import { COLORS, headerBg } from './generatorStyles';

export const generateProjectGeneralHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const headerColorMode = c.headerColor || 'blue';
    const borderStyleMode = c.borderStyle || 'solid';

    const resolveHeaderPair = (mode: string) => {
        switch (mode) {
            case 'gold': return { bg: '#b8912e', fg: '#ffffff' };
            case 'gray': return { bg: '#475569', fg: '#ffffff' };
            case 'none': return { bg: 'transparent', fg: '#1e293b' };
            case 'blue':
            default: return { bg: '#1e2a4a', fg: '#ffffff' };
        }
    };

    const headerPair = resolveHeaderPair(headerColorMode);
    const tableBorder = borderStyleMode === 'none' ? 'border: 0;' : 'border: 1px solid #cbd5e1;';
    const cellBorder = borderStyleMode === 'none' ? 'border-bottom: 1px solid #f1f5f9;' : 'border: 1px solid #cbd5e1;';

    interface ItemRow {
        key: string;
        label: string;
        content: string;
        colSpan: 1 | 2;
    }

    const items: ItemRow[] = [];

    if (c.showTitulo !== false) {
        const lbl = c.customLabel_showTitulo || 'Título del Proyecto';
        const scr = c.customScriban_showTitulo || 'titulo';
        items.push({ key: 'showTitulo', label: lbl, content: `<span style="font-weight: bold;">{{default ${scr} "[TEMA / NOMBRE DEL PROYECTO]"}}</span>`, colSpan: (c.colSpan_showTitulo as 1 | 2) || 2 });
    }
    if (c.showDirector !== false) {
        const lbl = c.customLabel_showDirector || 'Director del Proyecto';
        const scr = c.customScriban_showDirector || 'director_proyecto';
        items.push({ key: 'showDirector', label: lbl, content: `{{default ${scr} "No especificado"}}`, colSpan: (c.colSpan_showDirector as 1 | 2) || 1 });
    }
    if (c.showCarrera !== false) {
        const lbl = c.customLabel_showCarrera || 'Carrera / Unidad Académica';
        const scr = c.customScriban_showCarrera || 'carrera';
        items.push({ key: 'showCarrera', label: lbl, content: `{{default ${scr} "No especificada"}}`, colSpan: (c.colSpan_showCarrera as 1 | 2) || 1 });
    }
    if (c.showConvocatoria !== false) {
        const lbl = c.customLabel_showConvocatoria || 'Convocatoria';
        const scr = c.customScriban_showConvocatoria || 'convocatoria';
        items.push({ key: 'showConvocatoria', label: lbl, content: `{{default ${scr} "No especificada"}}`, colSpan: (c.colSpan_showConvocatoria as 1 | 2) || 1 });
    }
    if (c.showPrograma !== false) {
        const lbl = c.customLabel_showPrograma || 'Programa';
        const scr = c.customScriban_showPrograma || 'programa';
        items.push({ key: 'showPrograma', label: lbl, content: `{{default ${scr} "No especificado"}}`, colSpan: (c.colSpan_showPrograma as 1 | 2) || 1 });
    }
    if (c.showGrupo !== false) {
        const lbl = c.customLabel_showGrupo || 'Grupo de Investigación';
        const scr = c.customScriban_showGrupo || 'grupo_investigacion';
        items.push({ key: 'showGrupo', label: lbl, content: `{{default ${scr} "No especificado"}}`, colSpan: (c.colSpan_showGrupo as 1 | 2) || 1 });
    }
    if (c.showLinea !== false) {
        const lbl = c.customLabel_showLinea || 'Línea de Investigación';
        const scr = c.customScriban_showLinea || 'linea_investigacion';
        items.push({ key: 'showLinea', label: lbl, content: `<div><strong>Línea:</strong> {{default ${scr} "No especificada"}}</div><div style="margin-top: 4px;"><strong>Sublínea:</strong> {{default sublinea_investigacion "No especificada"}}</div>`, colSpan: (c.colSpan_showLinea as 1 | 2) || 1 });
    }
    if (c.showTipo !== false) {
        const lbl = c.customLabel_showTipo || 'Tipo de Investigación';
        const scr = c.customScriban_showTipo || 'tipo_investigacion';
        items.push({ key: 'showTipo', label: lbl, content: `{{default ${scr} "No especificado"}}`, colSpan: (c.colSpan_showTipo as 1 | 2) || 1 });
    }
    if (c.showCaces !== false) {
        const lbl = c.customLabel_showCaces || 'Campo Detallado CACES';
        const scr = c.customScriban_showCaces || 'campo_detallado';
        items.push({ key: 'showCaces', label: lbl, content: `{{default ${scr} "No especificado"}}`, colSpan: (c.colSpan_showCaces as 1 | 2) || 1 });
    }
    if (c.showFechas !== false) {
        const lbl = c.customLabel_showFechas || 'Fechas y Plazos';
        const scr = c.customScriban_showFechas || 'fecha_inicio';
        items.push({ key: 'showFechas', label: lbl, content: `<div><strong>Inicio:</strong> {{default ${scr} "No especificada"}}</div><div style="margin-top: 4px;"><strong>Fin:</strong> {{default fecha_fin "No especificada"}}</div>`, colSpan: (c.colSpan_showFechas as 1 | 2) || 1 });
    }

    const customFields: IdentificationField[] = c.customFields || [];
    customFields.forEach((f: IdentificationField) => {
        const scriban = f.scriptVariable || f.fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        const cellContent = f.scriptMode === 'static'
            ? (f.options?.[0] || f.label)
            : `{{default ${scriban} "No especificado"}}`;
        items.push({ key: f.fieldKey, label: f.label, content: cellContent, colSpan: (f.colSpan as 1 | 2) || 1 });
    });

    const fieldsOrder: string[] = c.fieldsOrder || [];
    if (fieldsOrder.length > 0) {
        items.sort((a, b) => {
            const idxA = fieldsOrder.indexOf(a.key);
            const idxB = fieldsOrder.indexOf(b.key);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    if (items.length === 0) return '';

    type RowGroup = { type: 'full'; item: ItemRow } | { type: 'pair'; item1: ItemRow; item2?: ItemRow };
    const rows: RowGroup[] = [];

    let idx = 0;
    while (idx < items.length) {
        const current = items[idx];
        if (current.colSpan === 2) {
            rows.push({ type: 'full', item: current });
            idx++;
        } else {
            const next = items[idx + 1];
            if (next && next.colSpan === 1) {
                rows.push({ type: 'pair', item1: current, item2: next });
                idx += 2;
            } else {
                rows.push({ type: 'pair', item1: current });
                idx++;
            }
        }
    }

    const tableRowsHtml = rows.map(r => {
        if (r.type === 'full') {
            return `
    <tr>
      <td style="background-color: ${headerPair.bg} !important; color: ${headerPair.fg} !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 25%; vertical-align: top; ${cellBorder}">${r.item.label}</td>
      <td colspan="3" style="padding: 6px 10px; font-size: 9.5pt; color: #0f172a; vertical-align: top; ${cellBorder}">${r.item.content}</td>
    </tr>`;
        } else {
            const { item1, item2 } = r;
            if (item2) {
                return `
    <tr>
      <td style="background-color: ${headerPair.bg} !important; color: ${headerPair.fg} !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 20%; vertical-align: top; ${cellBorder}">${item1.label}</td>
      <td style="padding: 6px 10px; font-size: 9.5pt; color: #0f172a; width: 30%; vertical-align: top; ${cellBorder}">${item1.content}</td>
      <td style="background-color: ${headerPair.bg} !important; color: ${headerPair.fg} !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 20%; vertical-align: top; ${cellBorder}">${item2.label}</td>
      <td style="padding: 6px 10px; font-size: 9.5pt; color: #0f172a; width: 30%; vertical-align: top; ${cellBorder}">${item2.content}</td>
    </tr>`;
            } else {
                return `
    <tr>
      <td style="background-color: ${headerPair.bg} !important; color: ${headerPair.fg} !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 20%; vertical-align: top; ${cellBorder}">${item1.label}</td>
      <td colspan="3" style="padding: 6px 10px; font-size: 9.5pt; color: #0f172a; vertical-align: top; ${cellBorder}">${item1.content}</td>
    </tr>`;
            }
        }
    }).join('\n');

    let renderedContent = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px; ${tableBorder}">
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>`;

    return `
  <!-- BLOQUE: FICHA DE IDENTIFICACIÓN -->
  <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: {{ theme.colors.primary }}; margin-bottom: 6px;">Ficha de Identificación</p>
  ${renderedContent}`;
};

export const generateProjectTechnicalHtml = (block: DocumentBlock): string => {
    const c: any = block.config;
    const layoutMode = c.technicalLayoutMode || 'table_2col';
    const headerColorKey = c.technicalHeaderColor || 'navy';
    const resolveHeaderBg = (col: string) => {
        switch (col) {
            case 'gold': return '#b8912e';
            case 'slate': return '#334155';
            case 'emerald': return '#065f46';
            case 'navy':
            default: return '#1e2a4a';
        }
    };
    const headerBgCol = resolveHeaderBg(headerColorKey);

    const sanitizeScribanVar = (rawVar?: string, fallbackKey?: string) => {
        let raw = (rawVar || fallbackKey || 'contenido').trim();
        let clean = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        clean = clean.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
        clean = clean.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
        if (!clean || /^[0-9]/.test(clean)) {
            clean = `sec_${clean}`;
        }
        return clean;
    };

    const formatDisplayTitle = (prefix?: string, title?: string) => {
        const p = (prefix || '').trim();
        let t = (title || '').trim();
        if (p && t.toLowerCase().startsWith(p.toLowerCase())) {
            t = t.substring(p.length).trim();
        }
        return p ? `${p} ${t}`.trim().toUpperCase() : t.toUpperCase();
    };

    const activeSections: any[] = (c.technicalSections && Array.isArray(c.technicalSections) && c.technicalSections.length > 0)
        ? c.technicalSections.filter((s: any) => s.enabled !== false)
        : [];

    if (activeSections.length === 0) return '';

    let bodyHtml = '';

    if (layoutMode === 'bento_cards') {
        const cardHtmlList = activeSections.map((sec: any) => {
            const displayTitle = formatDisplayTitle(sec.numberPrefix, sec.title);
            const varName = sanitizeScribanVar(sec.scribanVariable, sec.key);
            const fieldScribanTag = `{{{default ${varName} ${varName.toUpperCase()} "Sin contenido redactado."}}}`;

            return `
      <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; page-break-inside: avoid; background-color: #ffffff;">
        <div style="background-color: ${headerBgCol}; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; font-family: {{ theme.typography.font_family }};">
          ${displayTitle}
        </div>
        <div style="padding: 10px; font-size: 8.5pt; line-height: 1.4; color: #000000; font-family: {{ theme.typography.font_family }};">
          ${fieldScribanTag}
        </div>
      </div>`;
        });

        bodyHtml = `
    <div style="margin-top: 10px;">
      ${cardHtmlList.join('')}
    </div>`;
    } else if (layoutMode === 'headings_text') {
        const secHtmlList = activeSections.map((sec: any) => {
            const displayTitle = formatDisplayTitle(sec.numberPrefix, sec.title);
            const varName = sanitizeScribanVar(sec.scribanVariable, sec.key);
            const fieldScribanTag = `{{{default ${varName} ${varName.toUpperCase()} "Sin contenido redactado."}}}`;

            return `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="padding: 4px 8px; background-color: #f1f5f9; border-left: 3px solid ${headerBgCol}; margin-bottom: 6px;">
          <p style="margin: 0; font-weight: bold; font-size: 9pt; color: ${headerBgCol}; text-transform: uppercase; font-family: {{ theme.typography.font_family }};">${displayTitle}</p>
        </div>
        <div style="padding-left: 4px; font-size: 8.5pt; line-height: 1.4; color: #000000; font-family: {{ theme.typography.font_family }};">
          ${fieldScribanTag}
        </div>
      </div>`;
        });

        bodyHtml = `
    <div style="margin-top: 10px;">
      ${secHtmlList.join('')}
    </div>`;
    } else {
        const rowsHtml = activeSections.map((sec: any) => {
            const displayTitle = formatDisplayTitle(sec.numberPrefix, sec.title);
            const varName = sanitizeScribanVar(sec.scribanVariable, sec.key);
            const fieldScribanTag = `{{{default ${varName} ${varName.toUpperCase()} "Sin contenido redactado."}}}`;

            return `
      <tr>
        <td style="background-color: ${headerBgCol} !important; color: #ffffff !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 28%; vertical-align: top; border: 1px solid #cbd5e1; font-family: {{ theme.typography.font_family }};">${displayTitle}</td>
        <td style="padding: 8px 10px; font-size: 8.5pt; color: #000000; vertical-align: top; border: 1px solid #cbd5e1; font-family: {{ theme.typography.font_family }}; line-height: 1.4;">${fieldScribanTag}</td>
      </tr>`;
        }).join('\n');

        bodyHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #cbd5e1;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>`;
    }

    return `
  <!-- BLOQUE: PROPUESTA TÉCNICA -->
  <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: {{ theme.colors.primary }}; margin-top: 18px; margin-bottom: 6px;">Propuesta Técnica</p>
  ${bodyHtml}`;
};

export const generateExpectedProductsHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const productosTitle = c.productosTitle || '5. Productos y Entregables Esperados';
    const layoutMode = c.productsLayoutMode || c.layoutMode || 'table_detailed';

    const cols = c.productColumns || {
        showCategory: true,
        showSubtype: true,
        showProductName: true,
        showIndicator: true,
        showVerificationMeans: true,
        showQuantity: true,
        showDeadline: false,
    };

    if (layoutMode === 'table_simple') {
        return `
  <!-- BLOQUE: PRODUCTOS ESPERADOS (SIMPLE) -->
  <div style="margin-top: 20px;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">${productosTitle}</p>
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
          <td>{{this.tipo_producto_nombre}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
    }

    // Encabezados de tabla dinámicos
    const tableHeaders: string[] = [];
    if (cols.showCategory !== false) tableHeaders.push(`<th style="${headerBg('blue')}">Categoría</th>`);
    if (cols.showSubtype !== false) tableHeaders.push(`<th style="${headerBg('blue')}">Subtipo / Entregable</th>`);
    if (cols.showProductName !== false) tableHeaders.push(`<th style="${headerBg('blue')}">Nombre del Producto</th>`);
    if (cols.showIndicator !== false) tableHeaders.push(`<th style="${headerBg('blue')}">Indicador Verificable</th>`);
    if (cols.showVerificationMeans !== false) tableHeaders.push(`<th style="${headerBg('blue')}">Medio de Verificación</th>`);
    if (cols.showQuantity !== false) tableHeaders.push(`<th style="${headerBg('blue')} width: 60px; text-align: center;">Cant.</th>`);
    if (cols.showDeadline !== false) tableHeaders.push(`<th style="${headerBg('blue')} width: 80px; text-align: center;">Plazo</th>`);

    // Celdas Handlebars correspondientes
    const tableCells: string[] = [];
    if (cols.showCategory !== false) tableCells.push(`<td>{{#if this.categoria}}{{this.categoria}}{{else}}{{#if this.Category}}{{this.Category}}{{else}}{{#if this.Categoria}}{{this.Categoria}}{{else}}General{{/if}}{{/if}}{{/if}}</td>`);
    if (cols.showSubtype !== false) tableCells.push(`<td>{{#if this.tipo_producto_nombre}}{{this.tipo_producto_nombre}}{{else}}{{this.tipo}}{{/if}}</td>`);
    if (cols.showProductName !== false) tableCells.push(`<td>{{#if this.titulo}}{{this.titulo}}{{else}}{{this.nombre}}{{/if}}</td>`);
    if (cols.showIndicator !== false) tableCells.push(`<td>{{#if this.indicador}}{{this.indicador}}{{else}}1 Entregable completado{{/if}}</td>`);
    if (cols.showVerificationMeans !== false) tableCells.push(`<td>{{#if this.medio_verificacion}}{{this.medio_verificacion}}{{else}}{{#if this.url_producto}}{{this.url_producto}}{{else}}Certificado / Informe{{/if}}{{/if}}</td>`);
    if (cols.showQuantity !== false) tableCells.push(`<td style="text-align: center; font-weight: bold;">{{#if this.cantidad}}{{this.cantidad}}{{else}}1{{/if}}</td>`);
    if (cols.showDeadline !== false) tableCells.push(`<td style="text-align: center;">{{#if this.plazo}}{{this.plazo}}{{else}}Final del Proyecto{{/if}}</td>`);

    if (layoutMode === 'grouped_sections') {
        return `
  <!-- BLOQUE: PRODUCTOS ESPERADOS (POR SECCIONES) -->
  <div style="margin-top: 20px;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">${productosTitle}</p>
    <table class="info-table">
      <thead>
        <tr>
          ${tableHeaders.join('\n          ')}
        </tr>
      </thead>
      <tbody>
        {{#each productos_esperados}}
        <tr>
          ${tableCells.join('\n          ')}
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
    }

    return `
  <!-- BLOQUE: PRODUCTOS ESPERADOS (DETALLADO CACES) -->
  <div style="margin-top: 20px;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">${productosTitle}</p>
    <table class="info-table">
      <thead>
        <tr>
          ${tableHeaders.join('\n          ')}
        </tr>
      </thead>
      <tbody>
        {{#each productos_esperados}}
        <tr>
          ${tableCells.join('\n          ')}
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
};

export const generateImpactsHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const layoutMode = c.impactLayoutMode || c.impactsLayoutMode || 'table';
    const parts: string[] = [];

    const getImpactCategories = (): ImpactCategory[] => {
        if (c.impactCategories && Array.isArray(c.impactCategories) && c.impactCategories.length > 0) {
            return c.impactCategories;
        }
        return DEFAULT_IMPACT_CATEGORIES.map(def => {
            const legacyVal = def.legacyKey ? c[def.legacyKey] : undefined;
            return {
                ...def,
                enabled: legacyVal !== undefined ? Boolean(legacyVal) : def.enabled,
            };
        });
    };

    const activeCats = getImpactCategories().filter(cat => cat.enabled !== false);

    if (activeCats.length > 0) {
        if (layoutMode === 'cards') {
            const cardHtmlList = activeCats.map(cat => {
                const scr = cat.scribanVariable || `impacto.${cat.key}`;
                return `
      <div style="margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; page-break-inside: avoid; background-color: #ffffff;">
        <div style="background-color: ${COLORS.blue}; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; font-family: {{ theme.typography.font_family }};">
          ${cat.title}
        </div>
        <div style="padding: 8px 10px; font-size: 8.5pt; line-height: 1.4; color: #000000; font-family: {{ theme.typography.font_family }}; bg-color: #ffffff;">
          {{default ${scr} "Sin descripción."}}
        </div>
      </div>`;
            });

            parts.push(`
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 20px 0 8px;">6. Matriz de Impacto</p>
    <div style="margin-bottom: 15px;">
      ${cardHtmlList.join('')}
    </div>`);
        } else if (layoutMode === 'sections') {
            const secHtmlList = activeCats.map(cat => {
                const scr = cat.scribanVariable || `impacto.${cat.key}`;
                return `
      <div style="margin-bottom: 12px; page-break-inside: avoid;">
        <div style="padding: 4px 8px; background-color: #f1f5f9; border-left: 3px solid ${COLORS.blue}; margin-bottom: 4px;">
          <p style="margin: 0; font-weight: bold; font-size: 8.5pt; color: ${COLORS.blue}; text-transform: uppercase; font-family: {{ theme.typography.font_family }};">${cat.title}</p>
        </div>
        <div style="padding-left: 4px; font-size: 8.5pt; line-height: 1.4; color: #000000; font-family: {{ theme.typography.font_family }};">
          {{default ${scr} "Sin descripción."}}
        </div>
      </div>`;
            });

            parts.push(`
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 20px 0 8px;">6. Matriz de Impacto</p>
    <div style="margin-bottom: 15px;">
      ${secHtmlList.join('')}
    </div>`);
        } else {
            const impactRows = activeCats.map((cat, idx) => {
                const scr = cat.scribanVariable || `impacto.${cat.key}`;
                const wStyle = idx === 0 ? ' style="width: 28%;"' : '';
                return `<tr><td class="label-cell"${wStyle}>${cat.title}</td><td>{{default ${scr} "Sin descripción."}}</td></tr>`;
            });

            parts.push(`
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin: 20px 0 6px;">6. Matriz de Impacto</p>
    <table class="info-table">
      <tbody>
        ${impactRows.join('\n        ')}
      </tbody>
    </table>`);
        }
    }

    if (parts.length === 0) return '';

    return `
  <!-- BLOQUE: MATRIZ DE IMPACTOS -->
  <div style="margin-top: 20px;">
    ${parts.join('')}
  </div>`;
};
