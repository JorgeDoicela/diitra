import type { DocumentBlock } from '../../types';

export const generateCoverHtml = (block: DocumentBlock, themeConfig?: any): string => {
    const c: any = block.config;
    const gCover = themeConfig?.brand?.coverConfig || {};
    const isFreeForm = (c.coverLayoutMode !== undefined ? c.coverLayoutMode : gCover.coverLayoutMode) !== 'zones';

    const showInst    = c.showInstitution !== undefined ? c.showInstitution : (gCover.showInstitution !== undefined ? gCover.showInstitution : true);
    const showTitle   = c.showTitle !== undefined ? c.showTitle : (gCover.showTitle !== undefined ? gCover.showTitle : true);
    const showCarrera = c.showCarrera !== undefined ? c.showCarrera : (gCover.showCarrera !== undefined ? gCover.showCarrera : true);
    const showPeriodo = c.showPeriodo !== undefined ? c.showPeriodo : (gCover.showPeriodo !== undefined ? gCover.showPeriodo : true);

    const alignInst    = c.alignInstitution || gCover.alignInstitution || 'center';
    const alignTitle   = c.alignTitle || gCover.alignTitle || 'center';
    const alignCarrera = c.alignCarrera || gCover.alignCarrera || 'center';
    const alignPeriodo = c.alignPeriodo || gCover.alignPeriodo || 'center';

    const textInst = c.textoInstitucion || gCover.textoInstitucion || 'INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI';
    const textTitle = c.tituloSuperior || gCover.tituloSuperior || 'PORTADA DE PRUEBA DE IDENTIDAD VISUAL';

    const cleanCarrera = (c.carreraPorDefecto || gCover.carreraPorDefecto || '').replace(/"/g, '\\"');
    const cleanPeriodo = (c.periodoPorDefecto || gCover.periodoPorDefecto || '').replace(/"/g, '\\"');

    if (isFreeForm) {
        const xInst  = c.xInstitution ?? gCover.xInstitution ?? 10; 
        const yInst  = c.yInstitution ?? gCover.yInstitution ?? 4;
        const xTitle = c.xTitle       ?? gCover.xTitle       ?? 10; 
        const yTitle = c.yTitle       ?? gCover.yTitle       ?? 35;
        const xCar   = c.xCarrera     ?? gCover.xCarrera     ?? 10; 
        const yCar   = c.yCarrera     ?? gCover.yCarrera     ?? 70;
        const xPer   = c.xPeriodo     ?? gCover.xPeriodo     ?? 10; 
        const yPer   = c.yPeriodo     ?? gCover.yPeriodo     ?? 80;

        const toMmX = (pct: number) => `${(pct * 2.1).toFixed(1)}mm`;
        const toMmY = (pct: number) => `${(Math.min(pct, 75) * 2.70).toFixed(1)}mm`;
        const getWidthMm = (pctX: number) => `${Math.max(50, 210 - pctX * 2.1 - 15).toFixed(1)}mm`;
        const alignStyle = (align: string) => `text-align:${align};`;

        const instEl = showInst ? `
        <div style="position:absolute; left:${toMmX(xInst)}; top:${toMmY(yInst)}; width:${getWidthMm(xInst)}; ${alignStyle(alignInst)}">
          <span style="font-family: {{ theme.typography.font_family }}; font-size:9pt; font-weight:bold; text-transform:uppercase; color:#ffffff; background-color: {{ theme.colors.primary }}; padding:3px 10px; border-radius:9999px; display:inline-block;">
            ${textInst}
          </span>
        </div>` : '';

        const titleEl = showTitle ? `
        <div style="position:absolute; left:${toMmX(xTitle)}; top:${toMmY(yTitle)}; width:${getWidthMm(xTitle)}; ${alignStyle(alignTitle)}">
          <div style="font-family: {{ theme.typography.font_family }}; font-size:22pt; font-weight:bold; color: {{ theme.colors.primary }}; text-transform:uppercase; line-height:1.2;">
            ${textTitle}
          </div>
          <div style="font-family: {{ theme.typography.font_family }}; font-size:13pt; font-weight:bold; color: {{ theme.colors.primary }}; text-transform:uppercase; margin-top:8px; line-height:1.3; word-wrap:break-word;">
            {{default titulo 'ESCRIBIR EL TEMA EN MAYÚSCULAS'}}
          </div>
        </div>` : '';

        const carreraEl = showCarrera ? `
        <div style="position:absolute; left:${toMmX(xCar)}; top:${toMmY(yCar)}; width:${getWidthMm(xCar)}; ${alignStyle(alignCarrera)}">
          <div style="font-family: {{ theme.typography.font_family }}; font-size:10pt; font-weight:bold; color: {{ theme.colors.primary }}; text-transform:uppercase;">TECNOLOGÍA SUPERIOR EN</div>
          <div style="font-family: {{ theme.typography.font_family }}; font-size:10pt; font-weight:normal; color: {{ theme.colors.primary }}; text-transform:uppercase; margin-top:3px;">
            {{default carrera "${cleanCarrera || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE'}"}}
          </div>
        </div>` : '';

        const periodoEl = showPeriodo ? `
        <div style="position:absolute; left:${toMmX(xPer)}; top:${toMmY(yPer)}; width:${getWidthMm(xPer)}; ${alignStyle(alignPeriodo)}">
          <div style="font-family: {{ theme.typography.font_family }}; font-size:9pt; font-weight:bold; color: {{ theme.colors.primary }}; text-transform:uppercase;">PERIODO ACADÉMICO</div>
          <div style="font-family: {{ theme.typography.font_family }}; font-size:9pt; font-weight:normal; color: {{ theme.colors.primary }}; text-transform:uppercase; margin-top:2px;">
            {{default periodo "${cleanPeriodo || 'PERIODO ACADÉMICO 2026-2026'}"}}
          </div>
        </div>` : '';

        return `
  <!-- BLOQUE: PORTADA FREE-FORM -->
  <div class="cover-page">
    ${instEl}
    ${titleEl}
    ${carreraEl}
    ${periodoEl}
  </div>`;
    }

    const posInst    = c.posInstitution || gCover.posInstitution || 'top';
    const posTitle   = c.posTitle || gCover.posTitle || 'middle';
    const posCarrera = c.posCarrera || gCover.posCarrera || 'bottom';
    const posPeriodo = c.posPeriodo || gCover.posPeriodo || 'bottom';

    const instHtml = showInst ? `
        <div style="text-align: ${alignInst}; width: 100%;">
          <span style="font-family: {{ theme.typography.font_family }}; font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #ffffff; background-color: {{ theme.colors.primary }}; padding: 4px 12px; border-radius: 9999px; display: inline-block;">
            ${textInst}
          </span>
        </div>` : '';

    const titleHtml = showTitle ? `
        <div style="text-align: ${alignTitle}; width: 100%;">
          <h1 style="font-family: {{ theme.typography.font_family }}; font-size: 24pt; font-weight: bold; color: {{ theme.colors.primary }}; text-transform: uppercase; margin: 0; line-height: 1.2;">
            ${textTitle}
          </h1>
          <div style="font-family: {{ theme.typography.font_family }}; font-size: 15pt; font-weight: bold; color: {{ theme.colors.primary }}; text-transform: uppercase; margin-top: 10px; line-height: 1.2; word-wrap: break-word;">
            {{default titulo 'ESCRIBIR EL TEMA EN MAYÚSCULAS'}}
          </div>
        </div>` : '';

    const carreraHtml = showCarrera ? `
        <div style="text-align: ${alignCarrera}; width: 100%;">
          <div style="font-family: {{ theme.typography.font_family }}; font-size: 11pt; font-weight: bold; color: {{ theme.colors.primary }}; text-transform: uppercase;">
            TECNOLOGÍA SUPERIOR EN
          </div>
          <div style="font-family: {{ theme.typography.font_family }}; font-size: 11pt; font-weight: normal; color: {{ theme.colors.primary }}; text-transform: uppercase; margin-top: 4px;">
            {{default carrera "${cleanCarrera || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE'}"}}
          </div>
        </div>` : '';

    const periodoHtml = showPeriodo ? `
        <div style="text-align: ${alignPeriodo}; width: 100%;">
          <div style="font-family: {{ theme.typography.font_family }}; font-size: 10pt; font-weight: bold; color: {{ theme.colors.primary }}; text-transform: uppercase;">
            PERIODO ACADÉMICO
          </div>
          <div style="font-family: {{ theme.typography.font_family }}; font-size: 10pt; font-weight: normal; color: {{ theme.colors.primary }}; text-transform: uppercase; margin-top: 2px;">
            {{default periodo "${cleanPeriodo || 'PERIODO ACADÉMICO 2026-2026'}"}}
          </div>
        </div>` : '';

    const topElements = [
        posInst === 'top' ? instHtml : '',
        posTitle === 'top' ? titleHtml : '',
        posCarrera === 'top' ? carreraHtml : '',
        posPeriodo === 'top' ? periodoHtml : '',
    ].filter(Boolean).join('\n');

    const middleElements = [
        posInst === 'middle' ? instHtml : '',
        posTitle === 'middle' ? titleHtml : '',
        posCarrera === 'middle' ? carreraHtml : '',
        posPeriodo === 'middle' ? periodoHtml : '',
    ].filter(Boolean).join('\n');

    const bottomElements = [
        posInst === 'bottom' ? instHtml : '',
        posTitle === 'bottom' ? titleHtml : '',
        posCarrera === 'bottom' ? carreraHtml : '',
        posPeriodo === 'bottom' ? periodoHtml : '',
    ].filter(Boolean).join('\n');

    return `
  <!-- BLOQUE: PORTADA ZONAS -->
  <div class="cover-page">
    <div class="cover-overlay">
      ${topElements}
      ${middleElements}
      ${bottomElements}
    </div>
  </div>`;
};
