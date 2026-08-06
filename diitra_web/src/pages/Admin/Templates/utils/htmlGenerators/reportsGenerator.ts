import type { DocumentBlock } from '../../types';
import { COLORS, headerBg } from './generatorStyles';

/**
 * Genera el HTML de Recursos y Presupuesto Detallado (Bloque: project_budget_section / resources)
 */
export const generateResourcesHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const parts: string[] = [];

    if (c.showRecursosDisponibles !== false) {
        parts.push(`
    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 10px 0 4px;">4.1 Recursos Disponibles (Equipos, Licencias, Espacios)</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Descripción del Recurso</th>
          <th style="${headerBg('blue')} width: 60px; text-align: center;">Cantidad</th>
          <th style="${headerBg('blue')} width: 150px;">Fuente</th>
        </tr>
      </thead>
      <tbody>
        {{#each recursos_disponibles}}
        <tr>
          <td>{{this.descripcion}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
          <td>{{this.fuente}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>`);
    }

    if (c.showRecursosNecesarios !== false) {
        parts.push(`
    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">4.2 Recursos Necesarios (Presupuesto de Gasto)</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Partida / Rubro</th>
          <th style="${headerBg('blue')} width: 60px; text-align: center;">Cantidad</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">P. Unitario</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each recursos_necesarios}}
        <tr>
          <td>{{this.descripcion}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.cantidad}}</td>
          <td style="text-align: right;">$ {{this.costo_unitario}}</td>
          <td style="text-align: right; font-weight: bold;">$ {{this.costo_total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>`);
    }

    if (c.showFinanciamiento !== false) {
        parts.push(`
    <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <tbody>
          <tr>
            <td style="width: 65%;">
              <div style="margin-bottom: 4px;">
                <strong>Financiamiento Solicitado al ISTPET:</strong> {{#if financiamiento_istpet}}SÍ{{else}}NO{{/if}}
              </div>
              <div>
                <strong>Financiamiento Otras Fuentes:</strong> {{#if financiamiento_otras_fuentes}}SÍ ({{default nombres_otras_fuentes "No especificadas"}}){{else}}NO{{/if}}
              </div>
            </td>
            <td style="text-align: right; vertical-align: bottom;">
              <span style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: bold; display: block;">Costo Total Estimado:</span>
              <span style="font-size: 13pt; font-weight: bold; color: ${COLORS.blue};">$ {{default costo_total "0.00"}}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`);
    }

    if (parts.length === 0) return '';

    return `
  <!-- BLOQUE: RECURSOS Y PRESUPUESTO -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">4. Recursos y Presupuesto Detallado</p>
    ${parts.join('')}
  </div>`;
};

/**
 * Genera el HTML del Informe de Avances (Bloque: project_progress_report)
 */
export const generateProjectProgressHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const parts: string[] = [];

    if (c.showEvidencias !== false) {
        parts.push(`
    <div style="margin-bottom: 15px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 4px;">Bitácora Científica & Conclusiones Parciales:</strong>
      <div style="font-size: 9pt; line-height: 1.5; color: #1e293b;">{{default conclusiones_parciales "Sin registros de bitácora."}}</div>
    </div>`);
    }

    if (c.showHitosCompletados !== false) {
        parts.push(`
    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">Hitos & Entregables Completados</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Actividad / Hito</th>
          <th style="${headerBg('blue')} width: 80px; text-align: center;">% Avance</th>
          <th style="${headerBg('blue')} width: 90px; text-align: center;">Completado</th>
        </tr>
      </thead>
      <tbody>
        {{#each hitos_completados}}
        <tr>
          <td>{{this.actividad}}</td>
          <td style="text-align: center; font-weight: bold;">{{this.avance}} %</td>
          <td style="text-align: center; font-weight: bold; color: #10b981;">{{#if this.hito_completado}}SÍ{{else}}NO{{/if}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>`);
    }

    if (c.showPresupuestoEjecutado !== false) {
        parts.push(`
    <p style="font-weight: bold; font-size: 8.5pt; color: ${COLORS.gray}; margin: 15px 0 4px;">Presupuesto de Gasto Ejecutado</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')}">Partida</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">Presupuestado</th>
          <th style="${headerBg('blue')} width: 90px; text-align: right;">Ejecutado</th>
        </tr>
      </thead>
      <tbody>
        {{#each presupuesto_ejecutado}}
        <tr>
          <td>{{this.partida}}</td>
          <td style="text-align: right;">$ {{this.presupuestado}}</td>
          <td style="text-align: right; font-weight: bold;">$ {{this.ejecutado}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>`);
    }

    if (parts.length === 0) return '';

    return `
  <!-- BLOQUE: INFORME DE AVANCES -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">Informe Parcial de Avances & Resultados</p>
    ${parts.join('')}
  </div>`;
};

/**
 * Genera el HTML de Pertinencia Ética y Bioética (Bloque: project_ethics_report)
 */
export const generateProjectEthicsHtml = (block: DocumentBlock): string => {
    return `
  <!-- BLOQUE: EVALUACIÓN DE ÉTICA -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">Dictamen de Pertinencia Ética y Bioética</p>
    
    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Justificación Ética de la Propuesta:</strong>
      <div style="font-size: 9pt; line-height: 1.5; color: #1e293b;">{{default justificacion_etica "No registrada."}}</div>
    </div>

    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Riesgos Identificados & Medidas de Mitigación:</strong>
      <div style="font-size: 9pt; line-height: 1.5; color: #1e293b;">{{default riesgos_identificados "No registrada."}}</div>
    </div>

    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 2px;">Procedimiento de Consentimiento Informado:</strong>
      <div style="font-size: 9pt; line-height: 1.5; color: #1e293b;">{{default metodo_consentimiento "No registrada."}}</div>
    </div>

    <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <tbody>
          <tr>
            <td style="width: 50%;">
              <strong>Dictamen Final del Comité:</strong><br/>
              <span style="font-size: 10.5pt; font-weight: bold; color: ${COLORS.blue}; text-transform: uppercase;">{{default dictamen_comite "Pendiente"}}</span>
            </td>
            <td>
              <strong>Observaciones / Sugerencias de Enmienda:</strong><br/>
              <span style="color: #475569;">{{default observaciones_especificas "Ninguna."}}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
};

/**
 * Genera el HTML del Oficio de Aprobación de Proyecto (Bloque: project_approval_notice)
 */
export const generateProjectApprovalNoticeHtml = (block: DocumentBlock): string => {
    return `
  <!-- CABECERA: Logo + Número y Fecha del Oficio -->
  <div class="oficio-header" style="display: table; width: 100%; margin-bottom: 24px;">
    <div class="oficio-header-logo" style="display: table-cell; vertical-align: top; width: 50%; padding-top: 4px;">
      {{#if mostrar_logo_header}}
        {{#if logo_base64}}
          <img src="data:image/png;base64,{{logo_base64}}" alt="ISTPET Logo" style="width: 180px; max-width: 100%;" />
        {{/if}}
      {{/if}}
    </div>
    <div class="oficio-header-meta" style="display: table-cell; vertical-align: top; text-align: right; width: 50%; padding-top: 8px;">
      <div class="oficio-numero" style="font-size: 11pt; font-weight: bold; color: #000000; margin-bottom: 6px;">Oficio Nro. {{default oficio_numero "01-ISTPET-INV-2026"}}</div>
      <br/>
      <div class="oficio-fecha" style="font-size: 11pt; font-weight: bold; color: #000000;">{{default ciudad_emision ciudad "Quito"}} D.M., {{default oficio_fecha fecha_emision}}</div>
    </div>
  </div>

  <!-- BLOQUE DESTINATARIO -->
  <div class="destinatario-block" style="margin-top: 28px; margin-bottom: 20px; line-height: 1.55;">
    <div class="destinatario-titulo" style="font-size: 11pt;">{{default director_titulo "Tecnólogo/a"}}</div>
    <div class="destinatario-nombre" style="font-size: 11pt; font-weight: normal;">{{default director_nombre "[Nombre del Director del Proyecto]"}}</div>
    <div class="destinatario-cargo" style="font-size: 11pt; text-transform: uppercase;">DOCENTE DE LA CARRERA DE {{default director_carrera "[CARRERA]"}}</div>
    <div class="destinatario-inst" style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">{{default firmante_institucion "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI"}}</div>
    <div class="destinatario-presente" style="font-size: 11pt;">Presente. -</div>
  </div>

  <!-- SALUDO -->
  <div class="saludo" style="margin-bottom: 14px; font-size: 11pt;">De mis consideraciones</div>

  <!-- PÁRRAFO 1: Aprobación -->
  <div class="oficio-parrafo" style="font-size: 11pt; text-align: justify; margin-bottom: 14px; line-height: 1.5;">
    {{#if parrafo_aprobacion}}
      {{{parrafo_aprobacion}}}
    {{else}}
      Reciba un cordial saludo y por medio del presente, es un placer informarle que, tras la evaluación correspondiente, su proyecto de investigación titulado <strong><em>"{{default proyecto_titulo "[Título del Proyecto de Investigación]"}}"</em></strong> ha sido aprobado por la Coordinación de la Unidad de Investigación.
    {{/if}}
  </div>

  <!-- PÁRRAFO 2: Base de la aprobación -->
  <div class="oficio-parrafo" style="font-size: 11pt; text-align: justify; margin-bottom: 14px; line-height: 1.5;">
    {{default parrafo_fundamento "La aprobación se basa en la relevancia y viabilidad del proyecto, así como en su alineación con los objetivos académicos de nuestra institución, quedando establecidos la siguiente información:"}}
  </div>

  <!-- TABLA DE DATOS DEL PROYECTO -->
  <table class="proyecto-table" style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5pt;">
    <tbody>
      <tr>
        <td class="cell-label" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase; width: 38%;">NOMBRE DEL PROYECTO:</td>
        <td style="border: 1px solid #000000; padding: 6px 10px;">{{default proyecto_titulo "[Nombre del Proyecto]"}}</td>
      </tr>
      <tr>
        <td class="cell-label" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase;">LÍNEA DE INVESTIGACIÓN:</td>
        <td style="border: 1px solid #000000; padding: 6px 10px;">{{default linea_investigacion "[Línea de Investigación Vinculada]"}}</td>
      </tr>
      <tr>
        <td class="cell-label" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase;">MESES DE EJECUCIÓN:</td>
        <td style="border: 1px solid #000000; padding: 6px 10px;">{{default duracion_meses "12"}} meses</td>
      </tr>
      {{#if (eq mostrar_tabla_fechas false)}}
      {{else}}
      <tr>
        <td class="cell-dates-header" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase; text-align: center;">FECHA DE PRESENTACIÓN DEL PROYECTO</td>
        <td class="cell-dates-header" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase; text-align: center;">FECHA DE INICIO DE PROYECTO</td>
        <td class="cell-dates-header" style="border: 1px solid #000000; padding: 6px 10px; font-weight: bold; text-transform: uppercase; text-align: center;">FECHA DE FINALIZACIÓN O FECHA PREVISTA DEL PROYECTO</td>
      </tr>
      <tr>
        <td class="cell-dates-value" style="border: 1px solid #000000; padding: 6px 10px; text-align: center;">{{default fecha_presentacion "[Fecha de Presentación]"}}</td>
        <td class="cell-dates-value" style="border: 1px solid #000000; padding: 6px 10px; text-align: center;">{{default fecha_inicio "[Fecha de Inicio]"}}</td>
        <td class="cell-dates-value" style="border: 1px solid #000000; padding: 6px 10px; text-align: center;">{{default fecha_fin "[Fecha de Finalización]"}}</td>
      </tr>
      {{/if}}
    </tbody>
  </table>

  <!-- PÁRRAFO 3: Compromisos CACES -->
  {{#if (eq mostrar_compromisos_caces false)}}
  {{else}}
  <div class="oficio-parrafo" style="font-size: 11pt; text-align: justify; margin-bottom: 14px; line-height: 1.5;">
    {{default texto_caces "Las actividades complementarias al desarrollo del proyecto son los Informes de Seguimiento mensuales, con sus respectivos anexos que respalden las actividades ejecutadas, además de, el Plan de Aprendizaje y Evaluación del Plan de Aprendizaje por cada estudiante que forme parte del grupo de investigación y culminando con la Difusión de Resultados obtenidos del proyecto ejecutado."}}
  </div>
  {{/if}}

  <!-- PÁRRAFO 4: Invitación a proceder -->
  <div class="oficio-parrafo" style="font-size: 11pt; text-align: justify; margin-bottom: 14px; line-height: 1.5;">
    {{default parrafo_invitacion "Le animamos a proceder con la ejecución del proyecto, manteniendo los estándares de calidad y ética que nos caracterizan. Asimismo, quedamos a su disposición para brindarle el apoyo necesario durante el desarrollo de su investigación."}}
  </div>

  <!-- CIERRE -->
  <div class="oficio-cierre" style="font-size: 11pt; margin-top: 10px; margin-bottom: 6px;">{{default frase_cierre "Con sentimientos de distinguida consideración."}}</div>
  <div class="oficio-atentamente" style="font-size: 11pt; margin-bottom: 60px;">{{default frase_despedida "Atentamente,"}}</div>

  <!-- BLOQUE DE FIRMA -->
  <div class="firma-block" style="font-size: 10.5pt; line-height: 1.6;">
    <div class="firma-nombre" style="font-size: 11pt;">{{default coordinador_nombre "Ing. Estefani Sánchez Mgtr."}}</div>
    <div class="firma-cargo" style="font-weight: bold; font-size: 10.5pt;">{{default coordinador_cargo "Coordinadora de la Unidad de Investigación e Innovación"}}</div>
    <div class="firma-inst" style="font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">{{default firmante_institucion "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI"}}</div>
  </div>`;
};

/**
 * Genera el HTML Handlebars para la Matriz de Actividades de Avance (Bloque: progress_activity_section)
 */
export const generateProgressActivityHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const variant = c.activityVariant || 'ejecutadas';
    const customTitle = c.activityTableTitle;

    if (variant === 'no_previstas') {
        const title = customTitle || 'MATRIZ DE ACTIVIDADES NO PREVISTAS (NP)';
        return `
  <!-- BLOQUE: MATRIZ DE ACTIVIDADES NO PREVISTAS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')} width: 12%;">N° Actividad</th>
          <th style="${headerBg('blue')} width: 25%;">Objetivo Específico</th>
          <th style="${headerBg('blue')} width: 35%;">Actividades No Previstas Ejecutadas</th>
          <th style="${headerBg('blue')} width: 28%;">Resultados Obtenidos</th>
        </tr>
      </thead>
      <tbody>
        {{#each ActividadesNoPrevistas}}
        <tr>
          <td style="font-weight: bold; text-align: center;">{{default this.NumeroActividad this.numero_actividad}}</td>
          <td>{{default this.ObjetivoAsociado this.objetivo_asociado}}</td>
          <td>{{default this.ActividadesEjecutadas this.actividades_ejecutadas}}</td>
          <td>{{default this.ResultadosObtenidos this.resultados_obtenidos}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
    }

    if (variant === 'obstaculos') {
        const title = customTitle || 'MATRIZ DE OBSTÁCULOS Y ACCIONES CORRECTIVAS (OBS)';
        return `
  <!-- BLOQUE: MATRIZ DE OBSTÁCULOS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')} width: 10%;">N° Actividad</th>
          <th style="${headerBg('blue')} width: 20%;">Objetivo Específico</th>
          <th style="${headerBg('blue')} width: 25%;">Limitación / Obstáculo</th>
          <th style="${headerBg('blue')} width: 25%;">Actividades Correctivas</th>
          <th style="${headerBg('blue')} width: 20%;">Resultados Obtenidos</th>
        </tr>
      </thead>
      <tbody>
        {{#each Obstaculos}}
        <tr>
          <td style="font-weight: bold; text-align: center;">{{default this.NumeroActividad this.numero_actividad}}</td>
          <td>{{default this.ObjetivoAsociado this.objetivo_asociado}}</td>
          <td>{{default this.Limitacion this.limitacion}}</td>
          <td>{{default this.ActividadesEjecutadas this.actividades_ejecutadas}}</td>
          <td>{{default this.ResultadosObtenidos this.resultados_obtenidos}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
    }

    // Default: ejecutadas
    const title = customTitle || 'MATRIZ DE ACTIVIDADES EJECUTADAS';
    return `
  <!-- BLOQUE: MATRIZ DE ACTIVIDADES EJECUTADAS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    <table class="info-table">
      <thead>
        <tr>
          <th style="${headerBg('blue')} width: 10%;">N° Actividad</th>
          <th style="${headerBg('blue')} width: 35%;">Actividades Ejecutadas</th>
          <th style="${headerBg('blue')} width: 25%;">Resultados Obtenidos</th>
          <th style="${headerBg('blue')} width: 10%; text-align: center;">% Avance</th>
          <th style="${headerBg('blue')} width: 20%;">Participantes</th>
        </tr>
      </thead>
      <tbody>
        {{#each ActividadesEjecutadas}}
        <tr>
          <td style="font-weight: bold; text-align: center;">{{default this.NumeroActividad this.numero_actividad}}</td>
          <td>{{default this.ActividadesEjecutadas this.actividades_ejecutadas}}</td>
          <td>{{default this.ResultadosObtenidos this.resultados_obtenidos}}</td>
          <td style="text-align: center; font-weight: bold; color: #10b981;">{{default this.PorcentajeAvance this.porcentaje_avance}}%</td>
          <td>{{default this.Participantes this.participantes}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>`;
};

/**
 * Genera el HTML Handlebars para el Estado de Ejecución del Proyecto (Bloque: progress_status_section)
 */
export const generateProgressStatusHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const title = c.statusTableTitle || 'ESTADO DE EJECUCIÓN Y DICTAMEN DE FASE';
    return `
  <!-- BLOQUE: ESTADO DE EJECUCIÓN -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    <div style="margin-bottom: 10px; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
      <strong>Estado Actual del Proyecto:</strong> 
      <span style="font-weight: bold; color: ${COLORS.blue}; font-size: 10pt; text-transform: uppercase;">{{default EstadoEjecucion estado_ejecucion "EN AVANCE"}}</span>
    </div>
    <div style="margin-bottom: 12px;">
      <strong style="font-size: 8.5pt; color: ${COLORS.gray}; display: block; margin-bottom: 4px;">Descripción Breve de la Fase Actual:</strong>
      <div style="font-size: 9pt; line-height: 1.5; color: #1e293b;">{{{default DescripcionFaseActual descripcion_fase_actual}}}</div>
    </div>
  </div>`;
};

