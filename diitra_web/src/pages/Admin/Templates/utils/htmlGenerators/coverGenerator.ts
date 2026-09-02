import type { DocumentBlock } from '../../types';

export const generateCoverHtml = (block: DocumentBlock, themeConfig?: any): string => {
    const c: any = block.config;
    const gCover = themeConfig?.brand?.coverConfig || {};
    const showInst    = c.showInstitution !== undefined ? c.showInstitution : (gCover.showInstitution !== undefined ? gCover.showInstitution : true);
    const showTitle   = c.showTitle !== undefined ? c.showTitle : (gCover.showTitle !== undefined ? gCover.showTitle : true);
    const showTema    = c.showTemaProyecto !== undefined ? c.showTemaProyecto : (gCover.showTemaProyecto !== undefined ? gCover.showTemaProyecto : true);
    const showCarrera = c.showCarrera !== undefined ? c.showCarrera : (gCover.showCarrera !== undefined ? gCover.showCarrera : true);
    const showPeriodo = c.showPeriodo !== undefined ? c.showPeriodo : (gCover.showPeriodo !== undefined ? gCover.showPeriodo : true);

    const textInst = c.textoInstitucion !== undefined
        ? c.textoInstitucion
        : (gCover.textoInstitucion !== undefined ? gCover.textoInstitucion : 'INSTITUTO TECNOLÓGICO SUPERIOR MAYOR PEDRO TRAVERSARI');
    const textTitle = c.tituloSuperior || gCover.tituloSuperior || 'INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN';
    const placeholderTema = (c.placeholderTema || gCover.placeholderTema || 'ESCRIBIR EL TEMA EN MAYÚSCULAS').replace(/'/g, "\\'");

    const colorTitleKey = c.colorTituloSuperior || gCover.colorTituloSuperior || 'navy';
    const titleColor = colorTitleKey === 'gold' ? '#b8912e' : colorTitleKey === 'white' ? '#ffffff' : colorTitleKey === 'slate' ? '#475569' : colorTitleKey === 'navy' ? '{{ theme.colors.primary }}' : colorTitleKey;
    const tituloFontSize = Number(c.tituloFontSize || gCover.tituloFontSize || 20);
    const tituloItalica = Boolean(c.tituloItalica ?? gCover.tituloItalica);

    const temaFontSize = Number(c.temaFontSize || gCover.temaFontSize || 13);
    const temaItalica = Boolean(c.temaItalica ?? gCover.temaItalica);

    const activeCoverImage = c.coverImage || gCover.coverImage || themeConfig?.brand?.coverImage;

    const rawColorInst = c.colorInstitution || gCover.colorInstitution;
    const rawColorTema = c.colorTemaProyecto || gCover.colorTemaProyecto;
    const rawColorCar = c.colorCarrera || gCover.colorCarrera;
    const rawColorPer = c.colorPeriodo || gCover.colorPeriodo;

    const colorInst = rawColorInst || (activeCoverImage ? '#ffffff' : '{{ theme.colors.primary }}');
    const colorTema = rawColorTema || (activeCoverImage ? '#ffffff' : '{{ theme.colors.primary }}');
    const colorCar = rawColorCar || (activeCoverImage ? '#ffffff' : '{{ theme.colors.primary }}');
    const colorPer = rawColorPer || (activeCoverImage ? '#ffffff' : '#475569');
    const prefijoCarrera = c.prefijoCarrera !== undefined ? c.prefijoCarrera : 'TECNOLOGÍA SUPERIOR EN';
    const prefijoPeriodo = c.prefijoPeriodo !== undefined ? c.prefijoPeriodo : 'PERIODO ACADÉMICO';

    const instMode = c.institutionMode || gCover.institutionMode || 'text';
    const instImage = c.institutionImage || gCover.institutionImage || '';
    const instLogoHeight = Number(c.institutionLogoHeight || gCover.institutionLogoHeight || 48);
    const instLogoRadius = c.institutionLogoRadius || gCover.institutionLogoRadius || 'none';
    const instLogoInvert = c.institutionLogoInvert ?? gCover.institutionLogoInvert ?? false;
    const institutionFontSize = Number(c.institutionFontSize || gCover.institutionFontSize || 10);
    const institutionItalica = Boolean(c.institutionItalica ?? gCover.institutionItalica);
    const instFontStyleCss = institutionItalica ? 'font-style:italic;' : '';

    const radiusCss = instLogoRadius === 'full' ? 'border-radius:9999px;' : instLogoRadius === 'md' ? 'border-radius:8px;' : instLogoRadius === 'sm' ? 'border-radius:4px;' : '';
    const invertCss = instLogoInvert ? 'filter:brightness(0) invert(1);' : '';

    const xLogo  = c.xLogo        ?? gCover.xLogo        ?? (instMode === 'image' ? (c.xInstitution ?? gCover.xInstitution ?? 10) : 10);
    const yLogo  = c.yLogo        ?? gCover.yLogo        ?? (instMode === 'image' ? (c.yInstitution ?? gCover.yInstitution ?? 3) : 3);
    const xInst  = c.xInstitution ?? gCover.xInstitution ?? 10; 
    const yInst  = c.yInstitution ?? gCover.yInstitution ?? 13;
    const xTitle = c.xTitle       ?? gCover.xTitle       ?? 10; 
    const yTitle = c.yTitle       ?? gCover.yTitle       ?? 32;
    const xTema  = c.xTema        ?? gCover.xTema        ?? (c.xTitle ?? 10);
    const yTema  = c.yTema        ?? gCover.yTema        ?? (c.yTitle !== undefined ? Math.min(95, c.yTitle + 14) : 46);
    const xCar   = c.xCarrera     ?? gCover.xCarrera     ?? 70;
    const yCar   = c.yCarrera     ?? gCover.yCarrera     ?? 70;
    const xPer   = c.xPeriodo     ?? gCover.xPeriodo     ?? 10; 
    const yPer   = c.yPeriodo     ?? gCover.yPeriodo     ?? 80;

    const toMmX = (pct: number) => `${(pct * 2.1).toFixed(1)}mm`;
    const toMmY = (pct: number) => `${(Math.min(pct, 75) * 2.70).toFixed(1)}mm`;
    const getWidthMm = (pctX: number) => `${Math.max(50, 210 - pctX * 2.1 - 15).toFixed(1)}mm`;

    const showLogo = showInst && (instMode === 'image' || instMode === 'hybrid') && Boolean(instImage);
    const showText = showInst && (instMode === 'text' || instMode === 'hybrid') && Boolean(textInst);

    const logoEl = showLogo ? `
    <div style="position:absolute; left:${toMmX(xLogo)}; top:${toMmY(yLogo)}; width:${getWidthMm(xLogo)}; text-align:center;">
      <img src="${instImage}" alt="${textInst || 'Logo'}" style="height:${instLogoHeight}px; max-width:280px; object-fit:contain; ${radiusCss} ${invertCss} display:inline-block;" />
    </div>` : '';

    const instEl = showText ? `
    <div style="position:absolute; left:${toMmX(xInst)}; top:${toMmY(yInst)}; width:${getWidthMm(xInst)}; text-align:center;">
      <span style="font-family: {{ theme.typography.font_family }}; font-size:${institutionFontSize}pt; ${instFontStyleCss} font-weight:bold; text-transform:uppercase; color:${colorInst === '#ffffff' && !activeCoverImage ? '{{ theme.colors.primary }}' : colorInst}; display:inline-block;">${textInst}</span>
    </div>` : '';

    const titleEl = showTitle ? `
    <div style="position:absolute; left:${toMmX(xTitle)}; top:${toMmY(yTitle)}; width:${getWidthMm(xTitle)}; text-align:center;">
      <div style="font-family: {{ theme.typography.font_family }}; font-size:${tituloFontSize}pt; font-weight:bold; ${tituloItalica ? 'font-style:italic;' : ''} color: ${titleColor}; text-transform:uppercase; line-height:1.2;">
        ${textTitle}
      </div>
    </div>` : '';

    const temaEl = showTema ? `
    <div style="position:absolute; left:${toMmX(xTema)}; top:${toMmY(yTema)}; width:${getWidthMm(xTema)}; text-align:center;">
      <div style="font-family: {{ theme.typography.font_family }}; font-size:${temaFontSize}pt; font-weight:bold; ${temaItalica ? 'font-style:italic;' : ''} color: ${colorTema}; text-transform:uppercase; line-height:1.3; word-wrap:break-word;">
        {{default titulo '${placeholderTema}'}}
      </div>
    </div>` : '';

    const carreraFontSize = Number(c.carreraFontSize || gCover.carreraFontSize || 10);
    const carreraItalica = Boolean(c.carreraItalica ?? gCover.carreraItalica);

    const carreraEl = showCarrera ? `
    <div style="position:absolute; left:${toMmX(xCar)}; top:${toMmY(yCar)}; width:${getWidthMm(xCar)}; text-align:center;">
      ${prefijoCarrera ? `<div style="font-family: {{ theme.typography.font_family }}; font-size:${Math.max(8, Math.round(carreraFontSize * 0.85))}pt; font-weight:bold; color: ${colorCar}; text-transform:uppercase;">${prefijoCarrera}</div>` : ''}
      <div style="font-family: {{ theme.typography.font_family }}; font-size:${carreraFontSize}pt; font-weight:bold; ${carreraItalica ? 'font-style:italic;' : ''} color: ${colorCar}; text-transform:uppercase; margin-top:2px;">
        {{default carrera "[NOMBRE DE LA CARRERA]"}}
      </div>
    </div>` : '';

    const periodoFontSize = Number(c.periodoFontSize || gCover.periodoFontSize || 9);
    const periodoItalica = Boolean(c.periodoItalica ?? gCover.periodoItalica);

    const periodoEl = showPeriodo ? `
    <div style="position:absolute; left:${toMmX(xPer)}; top:${toMmY(yPer)}; width:${getWidthMm(xPer)}; text-align:center;">
      ${prefijoPeriodo ? `<div style="font-family: {{ theme.typography.font_family }}; font-size:${Math.max(8, Math.round(periodoFontSize * 0.85))}pt; font-weight:bold; color: ${colorPer}; text-transform:uppercase;">${prefijoPeriodo}</div>` : ''}
      <div style="font-family: {{ theme.typography.font_family }}; font-size:${periodoFontSize}pt; font-weight:normal; ${periodoItalica ? 'font-style:italic;' : ''} color: ${colorPer}; text-transform:uppercase; margin-top:2px;">
        {{default periodo "[PERIODO ACADÉMICO ACTIVO]"}}
      </div>
    </div>` : '';

    return `
  <!-- BLOQUE: PORTADA CANVAS LIBRE -->
  <div class="cover-page">
    ${logoEl}
    ${instEl}
    ${titleEl}
    ${temaEl}
    ${carreraEl}
    ${periodoEl}
  </div>`;
};
