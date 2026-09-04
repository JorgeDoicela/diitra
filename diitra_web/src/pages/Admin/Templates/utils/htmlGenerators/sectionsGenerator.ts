import type { DocumentBlock, ImpactCategory } from '../../types';
import { DEFAULT_IMPACT_CATEGORIES, DEFAULT_TECHNICAL_SUBSECTIONS } from '../../types';
import { COLORS, headerBg } from './generatorStyles';

import { resolveHeaderColor, getContrastFg } from '../../components/properties/SharedColorPicker';

export const generateProjectGeneralHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const title = c.title || block.title || '1.  IDENTIFICACIÓN DEL PROYECTO';
    const defaultHeaderBg = resolveHeaderColor(c.headerColor || '#1e2a4a');
    const borderStyle = c.borderStyle || 'solid';
    const isNoBorder = borderStyle === 'none';

    const tableBorderStyle = isNoBorder ? 'border: none;' : 'border: 1px solid #000000;';
    const cellBorder = isNoBorder ? 'border-bottom: 1px solid #000000;' : 'border: 1px solid #000000;';

    const resolveBg = (variant?: string, defaultColor = defaultHeaderBg) => {
        if (variant === 'banner_gold') return '#c4a857';
        if (variant === 'banner_emerald') return '#065f46';
        if (variant === 'banner_navy') return '#1e2a4a';
        if (variant && (variant.startsWith('#') || variant.startsWith('rgb') || variant.startsWith('hsl'))) return variant;
        return defaultColor;
    };

    const customFields: any[] = Array.isArray(c.customFields) ? c.customFields : [];

    interface HtmlItem {
        id: string;
        html: string;
    }

    const items: HtmlItem[] = [];

    // 1. NOMBRE DEL PROYECTO
    if (c.showTitulo !== false) {
        const bg = resolveBg(c.variant_showTitulo);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showTitulo ? `${c.customLabel_showTitulo.trim()}:` : 'NOMBRE DEL PROYECTO:';
        const sc = c.customScriban_showTitulo || 'titulo';
        items.push({
            id: 'showTitulo',
            html: `
      <!-- 1. NOMBRE DEL PROYECTO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} ""}}</td>
      </tr>`
        });
    }

    // 2. PROGRAMA
    if (c.showPrograma !== false) {
        const bg = resolveBg(c.variant_showPrograma);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showPrograma ? `${c.customLabel_showPrograma.trim()}:` : 'PROGRAMA:';
        const sc = c.customScriban_showPrograma || 'programa';
        items.push({
            id: 'showPrograma',
            html: `
      <!-- 2. PROGRAMA -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} ""}}</td>
      </tr>`
        });
    }

    // 3. GRUPO DE INVESTIGACIÓN
    if (c.showGrupo !== false) {
        const bg = resolveBg(c.variant_showGrupo);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showGrupo ? `${c.customLabel_showGrupo.trim()}:` : 'GRUPO DE INVESTIGACIÓN:';
        const sc = c.customScriban_showGrupo || 'grupo_investigacion';
        items.push({
            id: 'showGrupo',
            html: `
      <!-- 3. GRUPO DE INVESTIGACIÓN -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td style="font-weight: bold; font-size: 8pt; text-align: center; ${cellBorder} padding: 5px 4px; vertical-align: middle;">NO</td>
        <td style="text-align: center; ${cellBorder} padding: 5px 4px; font-size: 8.5pt; vertical-align: middle;">{{#unless ${sc}}}X{{/unless}}</td>
        <td style="font-weight: bold; font-size: 8pt; text-align: center; ${cellBorder} padding: 5px 4px; vertical-align: middle;">SI</td>
        <td colspan="3" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{#if ${sc}}}{{${sc}}}{{/if}}</td>
      </tr>`
        });
    }

    // 4. DOMINIO Y LÍNEA DE INVESTIGACIÓN
    if (c.showLinea !== false) {
        const bg = resolveBg(c.variant_showLinea);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showLinea ? `${c.customLabel_showLinea.trim()}:` : 'LÍNEA DE INVESTIGACIÓN:';
        const sc = c.customScriban_showLinea || 'linea_investigacion';
        items.push({
            id: 'showLinea',
            html: `
      <!-- 4. DOMINIO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">DOMINIO:</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default dominio ""}}</td>
      </tr>
      <!-- 5. LÍNEA DE INVESTIGACIÓN -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} ""}}</td>
      </tr>
      <!-- 6. SUBLÍNEA DE INVESTIGACIÓN -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">SUBLÍNEA DE INVESTIGACIÓN:</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default sublinea_investigacion ""}}</td>
      </tr>`
        });
    }

    // 5. TIPO DE INVESTIGACIÓN
    if (c.showTipo !== false) {
        const bg = resolveBg(c.variant_showTipo);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showTipo ? `${c.customLabel_showTipo.trim()}:` : 'TIPO DE INVESTIGACIÓN (X):';
        const sc = c.customScriban_showTipo || 'tipo_investigacion';
        items.push({
            id: 'showTipo',
            html: `
      <!-- 7. TIPO DE INVESTIGACIÓN (X) -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td style="font-weight: bold; font-size: 7.5pt; text-align: center; ${cellBorder} padding: 5px 4px; vertical-align: middle;">BÁSICA</td>
        <td style="text-align: center; font-size: 8.5pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{#if (eq ${sc} "BASICA")}}X{{/if}}</td>
        <td style="font-weight: bold; font-size: 7.5pt; text-align: center; ${cellBorder} padding: 5px 4px; vertical-align: middle;">APLICADA</td>
        <td style="text-align: center; font-size: 8.5pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{#if (eq ${sc} "APLICADA")}}X{{/if}}</td>
        <td style="font-weight: bold; font-size: 7pt; text-align: center; ${cellBorder} padding: 5px 2px; vertical-align: middle;">DESARROLLO EXPERIMENTAL</td>
        <td style="text-align: center; font-size: 8.5pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{#if (eq ${sc} "DESARROLLO EXPERIMENTAL")}}X{{/if}}</td>
      </tr>`
        });
    }

    // 6. CLASIFICACIÓN CACES / UNESCO
    if (c.showCaces !== false) {
        const bg = resolveBg(c.variant_showCaces);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showCaces ? `${c.customLabel_showCaces.trim()}:` : 'CAMPO DETALLADO:';
        const sc = c.customScriban_showCaces || 'campo_detallado';
        items.push({
            id: 'showCaces',
            html: `
      <!-- 8. CAMPO AMPLIO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">CAMPO AMPLIO:</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default campo_amplio ""}}</td>
      </tr>
      <!-- 9. CAMPO ESPECÍFICO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">CAMPO ESPECÍFICO:</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default campo_especifico ""}}</td>
      </tr>
      <!-- 10. CAMPO DETALLADO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} ""}}</td>
      </tr>`
        });
    }

    // 7. CARRERA
    if (c.showCarrera !== false) {
        const bg = resolveBg(c.variant_showCarrera);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showCarrera ? `${c.customLabel_showCarrera.trim()}:` : 'CARRERA:';
        const sc = c.customScriban_showCarrera || 'carrera';
        items.push({
            id: 'showCarrera',
            html: `
      <!-- 11. CARRERA -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">Tecnología Superior en {{default ${sc} ""}}</td>
      </tr>`
        });
    }

    // 8. CONVOCATORIA Y TIEMPO DE EJECUCIÓN
    if (c.showConvocatoria !== false) {
        const bg = resolveBg(c.variant_showConvocatoria);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showConvocatoria ? `${c.customLabel_showConvocatoria.trim()}:` : 'PERIODO ACADÉMICO DE CONVOCATORIA:';
        const sc = c.customScriban_showConvocatoria || 'periodo';
        items.push({
            id: 'showConvocatoria',
            html: `
      <!-- 12. PERIODO ACADÉMICO DE CONVOCATORIA -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} ""}}</td>
      </tr>
      <!-- 13. TIEMPO DE EJECUCIÓN -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">TIEMPO DE EJECUCIÓN:</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default tiempo_ejecucion meses_ejecucion ""}}</td>
      </tr>`
        });
    }

    // 9. DIRECTOR DEL PROYECTO
    if (c.showDirector !== false) {
        const bg = resolveBg(c.variant_showDirector);
        const fg = getContrastFg(bg);
        const label = c.customLabel_showDirector ? `${c.customLabel_showDirector.trim()}:` : 'DIRECTOR DEL PROYECTO:';
        const sc = c.customScriban_showDirector || 'director_proyecto';
        items.push({
            id: 'showDirector',
            html: `
      <!-- 14. DIRECTOR DEL PROYECTO -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${label}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${sc} "[Título abreviado, Apellidos y Nombres Completos]"}}</td>
      </tr>`
        });
    }

    // 10. FECHAS (BANNER DORADO O PERSONALIZADO)
    if (c.showFechas !== false) {
        const bg = resolveBg(c.variant_showFechas, '#c4a857');
        const fg = getContrastFg(bg);
        items.push({
            id: 'showFechas',
            html: `
      <!-- 15. BANNER DORADO DE FECHAS -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${bg} !important; color: ${fg} !important; font-weight: bold; font-size: 7.5pt; text-align: center; ${cellBorder} padding: 6px 4px; vertical-align: middle;">FECHA DE PRESENTACIÓN DEL PROYECTO</td>
        <td colspan="3" style="background-color: ${bg} !important; color: ${fg} !important; font-weight: bold; font-size: 7.5pt; text-align: center; ${cellBorder} padding: 6px 4px; vertical-align: middle;">FECHA PREVISTA DE INICIO DEL PROYECTO</td>
        <td colspan="3" style="background-color: ${bg} !important; color: ${fg} !important; font-weight: bold; font-size: 7.5pt; text-align: center; ${cellBorder} padding: 6px 4px; vertical-align: middle;">FECHA PREVISTA DE FINALIZACIÓN DEL PROYECTO</td>
      </tr>
      <tr style="page-break-inside: avoid;">
        <td style="text-align: center; font-size: 8pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{default fecha_presentacion "[día/mes/año]"}}</td>
        <td colspan="3" style="text-align: center; font-size: 8pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{default fecha_inicio "[día/mes/año]"}}</td>
        <td colspan="3" style="text-align: center; font-size: 8pt; ${cellBorder} padding: 5px 4px; vertical-align: middle;">{{default fecha_fin "[día/mes/año]"}}</td>
      </tr>`
        });
    }

    // 11. CAMPOS Y BANNERS EXTRA PERSONALIZADOS
    customFields.forEach((field, fIdx) => {
        const fieldKey = field.fieldKey || `custom_${fIdx}`;
        const isBanner = field.isGroupHeader || field.variant?.startsWith('banner');
        const fieldBg = resolveBg(field.variant, defaultHeaderBg);
        const fieldFg = getContrastFg(fieldBg);
        const scVar = field.scriptVariable || field.fieldKey || `custom_${fIdx}`;

        if (isBanner) {
            items.push({
                id: fieldKey,
                html: `
      <!-- BANNER PERSONALIZADO: ${field.label || 'SECCIÓN'} -->
      <tr style="page-break-inside: avoid;">
        <td colspan="7" style="background-color: ${fieldBg} !important; color: ${fieldFg} !important; padding: 6px 4px; font-weight: bold; font-size: 8pt; text-align: center; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${field.label || 'NUEVA SECCIÓN TEMÁTICA'}</td>
      </tr>`
            });
        } else {
            items.push({
                id: fieldKey,
                html: `
      <!-- CAMPO PERSONALIZADO: ${field.label || fieldKey} -->
      <tr style="page-break-inside: avoid;">
        <td style="background-color: ${fieldBg} !important; color: ${fieldFg} !important; padding: 5px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; ${cellBorder} vertical-align: middle;">${field.label ? `${field.label.trim().toUpperCase()}:` : 'CAMPO:'}</td>
        <td colspan="6" style="padding: 5px 8px; font-size: 8.5pt; color: #000000; ${cellBorder} vertical-align: middle;">{{default ${scVar} ""}}</td>
      </tr>`
            });
        }
    });

    // Ordenamiento si el usuario reordenó campos
    const fieldsOrder: string[] = Array.isArray(c.fieldsOrder) ? c.fieldsOrder : [];
    if (fieldsOrder.length > 0) {
        items.sort((a, b) => {
            const idxA = fieldsOrder.indexOf(a.id);
            const idxB = fieldsOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    return `
  <!-- BLOQUE: 1. IDENTIFICACIÓN DEL PROYECTO -->
  <p style="font-weight: bold; font-size: 10pt; text-transform: uppercase; color: ${defaultHeaderBg}; margin-top: 14px; margin-bottom: 6px; font-family: {{ theme.typography.font_family }};">${title}</p>
  <table style="width: 100%; border-collapse: collapse; ${tableBorderStyle} font-family: {{ theme.typography.font_family }}; table-layout: fixed;">
    <colgroup>
      <col style="width: 34%;" />
      <col style="width: 13%;" />
      <col style="width: 7%;" />
      <col style="width: 14%;" />
      <col style="width: 7%;" />
      <col style="width: 18%;" />
      <col style="width: 7%;" />
    </colgroup>
    <tbody>
      ${items.map(i => i.html).join('')}
    </tbody>
  </table>`;
};

export const generateProjectTechnicalHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const headerColorKey = c.technicalHeaderColor || 'navy';
    const borderStyleKey = c.technicalBorderStyle || 'solid';

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
    const goldColor = '#b8912e';
    const tableBorder = borderStyleKey === 'none' ? 'border: 0;' : 'border: 1px solid #cbd5e1;';
    const cellBorder = borderStyleKey === 'none' ? 'border-bottom: 1px solid #f1f5f9;' : 'border: 1px solid #cbd5e1;';

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

    const resolveVariantColor = (v?: string) => {
        if (v === 'banner_gold') return goldColor;
        if (v === 'banner_navy') return '#1e2a4a';
        if (v === 'banner_emerald') return '#065f46';
        return headerBgCol;
    };

    const rawSections = (c.technicalSections && Array.isArray(c.technicalSections) && c.technicalSections.length > 0)
        ? c.technicalSections
        : DEFAULT_TECHNICAL_SUBSECTIONS;

    const activeSections: any[] = rawSections.filter((s: any) => s.enabled !== false);

    if (activeSections.length === 0) return '';

    // Matriz Reticular Interactiva Institucional (table_2col)
    const renderedRows: string[] = [];
    let i = 0;

    while (i < activeSections.length) {
        const sec = activeSections[i];
        const displayTitle = formatDisplayTitle(sec.numberPrefix, sec.title);
        const varName = sanitizeScribanVar(sec.scribanVariable, sec.fieldKey || sec.key);
        const pascalVar = (sec.fieldKey || sec.key || '').trim();
        const colSpan = sec.colSpan || 2;
        const variant = sec.variant || 'standard';
        const isGroup = sec.isGroupHeader || sec.hasContent === false;
        const breakBefore = sec.pageBreakBefore ? 'page-break-before: always;' : '';
        const avoidInside = sec.avoidBreakInside !== false ? 'page-break-inside: avoid;' : '';
        const color = resolveVariantColor(variant);

        if (isGroup || variant === 'banner_gold') {
            renderedRows.push(`
      <tr style="${avoidInside} ${breakBefore}">
        <td colspan="2" style="background-color: ${color} !important; color: #ffffff !important; font-weight: bold; text-align: center; padding: 6px 10px; font-size: 9pt; ${cellBorder} text-transform: uppercase; font-family: {{ theme.typography.font_family }};">${displayTitle}</td>
      </tr>`);
            i++;
        } else if (colSpan === 1 || variant === 'banner_navy') {
            const nextSec = activeSections[i + 1];
            if (nextSec && (nextSec.colSpan === 1 || nextSec.variant === 'banner_navy') && !nextSec.isGroupHeader) {
                const nextTitle = formatDisplayTitle(nextSec.numberPrefix, nextSec.title);
                const nextVarName = sanitizeScribanVar(nextSec.scribanVariable, nextSec.fieldKey || nextSec.key);
                const nextPascalVar = (nextSec.fieldKey || nextSec.key || '').trim();
                const color2 = resolveVariantColor(nextSec.variant);

                const tag1 = `{{{default ${varName} ${varName.toUpperCase()} ${pascalVar} "Sin contenido redactado."}}}`;
                const tag2 = `{{{default ${nextVarName} ${nextVarName.toUpperCase()} ${nextPascalVar} "Sin contenido redactado."}}}`;

                renderedRows.push(`
      <tr style="${avoidInside} ${breakBefore}">
        <td style="background-color: ${color} !important; color: #ffffff !important; text-align: center; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 50%; padding: 6px 10px; ${cellBorder} font-family: {{ theme.typography.font_family }};">${displayTitle}</td>
        <td style="background-color: ${color2} !important; color: #ffffff !important; text-align: center; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 50%; padding: 6px 10px; ${cellBorder} font-family: {{ theme.typography.font_family }};">${nextTitle}</td>
      </tr>
      <tr style="${avoidInside}">
        <td style="padding: 8px 10px; font-size: 8.5pt; color: #000000; vertical-align: top; ${cellBorder} font-family: {{ theme.typography.font_family }}; line-height: 1.4; width: 50%;">${tag1}</td>
        <td style="padding: 8px 10px; font-size: 8.5pt; color: #000000; vertical-align: top; ${cellBorder} font-family: {{ theme.typography.font_family }}; line-height: 1.4; width: 50%;">${tag2}</td>
      </tr>`);
                i += 2;
            } else {
                const tag1 = `{{{default ${varName} ${varName.toUpperCase()} ${pascalVar} "Sin contenido redactado."}}}`;
                renderedRows.push(`
      <tr style="${avoidInside} ${breakBefore}">
        <td style="background-color: ${color} !important; color: #ffffff !important; text-align: center; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 50%; padding: 6px 10px; ${cellBorder} font-family: {{ theme.typography.font_family }};">${displayTitle}</td>
        <td style="background-color: #fafafa; width: 50%; ${cellBorder}">&nbsp;</td>
      </tr>
      <tr style="${avoidInside}">
        <td style="padding: 8px 10px; font-size: 8.5pt; color: #000000; vertical-align: top; ${cellBorder} font-family: {{ theme.typography.font_family }}; line-height: 1.4; width: 50%;">${tag1}</td>
        <td style="background-color: #fafafa; width: 50%; ${cellBorder}">&nbsp;</td>
      </tr>`);
                i++;
            }
        } else {
            const tag1 = `{{{default ${varName} ${varName.toUpperCase()} ${pascalVar} "Sin contenido redactado."}}}`;
            renderedRows.push(`
      <tr style="${avoidInside} ${breakBefore}">
        <td style="background-color: ${color} !important; color: #ffffff !important; padding: 6px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; width: 28%; vertical-align: top; ${cellBorder} font-family: {{ theme.typography.font_family }};">${displayTitle}</td>
        <td style="padding: 8px 10px; font-size: 8.5pt; color: #000000; vertical-align: top; ${cellBorder} font-family: {{ theme.typography.font_family }}; line-height: 1.4;">${tag1}</td>
      </tr>`);
            i++;
        }
    }

    const bodyHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px; ${tableBorder}">
      <tbody>
        ${renderedRows.join('\n')}
      </tbody>
    </table>`;

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
