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
export const generateProjectEthicsHtml = (_block: DocumentBlock): string => {
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
export const generateProjectApprovalNoticeHtml = (_block: DocumentBlock): string => {
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
        const title = customTitle || 'ACTIVIDADES NO PREVISTAS INICIALMENTE QUE HAN SIDO REALIZADAS DURANTE LA EJECUCIÓN DEL PROYECTO';
        return `
  <!-- BLOQUE: MATRIZ DE ACTIVIDADES NO PREVISTAS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    {{#each ActividadesNoPrevistas}}
    <table class="info-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
      <tbody>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; width: 35%; padding: 5px 8px; border: 1px solid #334155;">NÚMERO DE ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">{{default this.NumeroActividad this.numero_actividad ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">OBJETIVO DEL PROYECTO DE INVESTIGACIÓN</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ObjetivoAsociado this.objetivo_asociado ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">ACTIVIDAD EJECUTADA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ActividadesEjecutadas this.actividades_ejecutadas ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">RESULTADOS OBTENIDOS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ResultadosObtenidos this.resultados_obtenidos ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PORCENTAJE DE AVANCE (%)</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">{{default this.PorcentajeAvance this.porcentaje_avance "100"}}%</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PARTICIPANTES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.Participantes this.participantes "Director del Proyecto, Investigadores"}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA DE INICIO DE LA ACTIVIDAD NO PREVISTA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaInicio this.fecha_inicio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA FIN DE LA ACTIVIDAD NO PREVISTA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaFin this.fecha_fin ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; vertical-align: top;">OBSERVACIONES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; min-height: 40px; vertical-align: top;">{{default this.Observaciones this.observaciones ""}}</td>
        </tr>
      </tbody>
    </table>
    {{/each}}
  </div>`;
    }

    if (variant === 'obstaculos') {
        const title = customTitle || 'OBSTÁCULOS QUE SE HAN PRESENTADO PARA LA EJECUCIÓN DEL PROYECTO';
        return `
  <!-- BLOQUE: MATRIZ DE OBSTÁCULOS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    {{#each Obstaculos}}
    <table class="info-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
      <tbody>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; width: 35%; padding: 5px 8px; border: 1px solid #334155;">NÚMERO DE ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">{{default this.NumeroActividad this.numero_actividad ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">OBJETIVO DEL PROYECTO DE INVESTIGACIÓN</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ObjetivoAsociado this.objetivo_asociado ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">LIMITACIÓN</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.Limitacion this.limitacion ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">ACTIVIDAD CORRECTIVA DESARROLLADA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ActividadesEjecutadas this.actividades_ejecutadas ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">RESULTADOS OBTENIDOS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ResultadosObtenidos this.resultados_obtenidos ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PORCENTAJE DE AVANCE (%)</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">{{default this.PorcentajeAvance this.porcentaje_avance "100"}}%</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PARTICIPANTES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.Participantes this.participantes "Director del Proyecto, Investigadores"}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA DE INICIO DE LA ACTIVIDAD CORRECTIVA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaInicio this.fecha_inicio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA FIN DE LA ACTIVIDAD CORRECTIVA</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaFin this.fecha_fin ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; vertical-align: top;">OBSERVACIONES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; min-height: 40px; vertical-align: top;">{{default this.Observaciones this.observaciones ""}}</td>
        </tr>
      </tbody>
    </table>
    {{/each}}
  </div>`;
    }

    // Default: ejecutadas
    const title = customTitle || '2. MATRIZ DE ACTIVIDADES EJECUTADAS';
    return `
  <!-- BLOQUE: MATRIZ DE ACTIVIDADES EJECUTADAS -->
  <div style="margin-top: 20px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 8px;">${title}</p>
    {{#each ActividadesEjecutadas}}
    <table class="info-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
      <tbody>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; width: 32%; padding: 5px 8px; border: 1px solid #334155;">NÚMERO DE ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">{{default this.NumeroActividad this.numero_actividad ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">ACTIVIDADES EJECUTADAS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ActividadesEjecutadas this.actividades_ejecutadas ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">RESULTADOS OBTENIDOS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.ResultadosObtenidos this.resultados_obtenidos ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PORCENTAJE DE AVANCE (%)</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">{{default this.PorcentajeAvance this.porcentaje_avance "100"}}%</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PARTICIPANTES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.Participantes this.participantes "Director del Proyecto e Investigadores"}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA DE INICIO DE LA ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaInicio this.fecha_inicio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA FIN DE LA ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default this.FechaFin this.fecha_fin ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; vertical-align: top;">OBSERVACIONES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; min-height: 40px; vertical-align: top;">{{default this.Observaciones this.observaciones ""}}</td>
        </tr>
      </tbody>
    </table>
    {{/each}}
  </div>`;
};

/**
 * Genera el HTML Handlebars para el Estado de Ejecución del Proyecto (Bloque: progress_status_section)
 */
export const generateProgressStatusHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const title = c.statusTableTitle || 'ESTADO DE EJECUCIÓN DEL PROYECTO';
    return `
  <!-- BLOQUE: ESTADO DE EJECUCIÓN -->
  <div style="margin-top: 25px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 10pt; text-transform: uppercase; text-align: center; color: #000000; margin-bottom: 12px;">${title}</p>
    <p style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; color: #000000;">MARQUE CON UNA (X) EL ESTADO ACTUAL DEL PROYECTO DE INVESTIGACIÓN:</p>
    
    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 8.5pt; margin-bottom: 0px;">
      <thead>
        <tr style="background-color: #1e2a4a; color: white; font-weight: bold;">
          <th style="width: 20%; padding: 6px 4px; border: 1px solid #000000; text-transform: uppercase;">INICIADO</th>
          <th style="width: 20%; padding: 6px 4px; border: 1px solid #000000; text-transform: uppercase;">EN AVANCE</th>
          <th style="width: 20%; padding: 6px 4px; border: 1px solid #000000; text-transform: uppercase;">SUSPENDIDO</th>
          <th style="width: 20%; padding: 6px 4px; border: 1px solid #000000; text-transform: uppercase;">POR FINALIZAR</th>
          <th style="width: 20%; padding: 6px 4px; border: 1px solid #000000; text-transform: uppercase;">FINALIZADO</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px 4px; border: 1px solid #000000; font-weight: bold; font-size: 10pt;">{{#if_eq EstadoEjecucion "INICIADO"}}(X){{else}}{{#if_eq estado_ejecucion "INICIADO"}}(X){{/if_eq}}{{/if_eq}}</td>
          <td style="padding: 8px 4px; border: 1px solid #000000; font-weight: bold; font-size: 10pt;">{{#if_eq EstadoEjecucion "EN AVANCE"}}(X){{else}}{{#if_eq estado_ejecucion "EN AVANCE"}}(X){{else}}{{#unless EstadoEjecucion}}{{#unless estado_ejecucion}}(X){{/unless}}{{/unless}}{{/if_eq}}{{/if_eq}}</td>
          <td style="padding: 8px 4px; border: 1px solid #000000; font-weight: bold; font-size: 10pt;">{{#if_eq EstadoEjecucion "SUSPENDIDO"}}(X){{else}}{{#if_eq estado_ejecucion "SUSPENDIDO"}}(X){{/if_eq}}{{/if_eq}}</td>
          <td style="padding: 8px 4px; border: 1px solid #000000; font-weight: bold; font-size: 10pt;">{{#if_eq EstadoEjecucion "POR FINALIZAR"}}(X){{else}}{{#if_eq estado_ejecucion "POR FINALIZAR"}}(X){{/if_eq}}{{/if_eq}}</td>
          <td style="padding: 8px 4px; border: 1px solid #000000; font-weight: bold; font-size: 10pt;">{{#if_eq EstadoEjecucion "FINALIZADO"}}(X){{else}}{{#if_eq estado_ejecucion "FINALIZADO"}}(X){{/if_eq}}{{/if_eq}}</td>
        </tr>
        <tr style="background-color: #1e2a4a; color: white; font-weight: bold; text-align: left;">
          <td colspan="5" style="padding: 6px 8px; border: 1px solid #000000; font-size: 8.5pt; text-transform: uppercase;">
            EXPLIQUE BREVEMENTE LA FASE DE EJECUCIÓN EN QUE SE ENCUENTRA SU PROYECTO:
          </td>
        </tr>
        <tr style="text-align: left;">
          <td colspan="5" style="padding: 8px; border: 1px solid #000000; font-size: 8.5pt; min-height: 50px; vertical-align: top; color: #000000;">
            {{{default DescripcionFaseActual descripcion_fase_actual ""}}}
          </td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 18px;">
      <p style="font-weight: bold; font-size: 8.5pt; text-transform: uppercase; margin-bottom: 6px; color: #000000;">OBSERVACIONES GENERALES DEL DIRECTOR DEL PROYECTO:</p>
      <div style="padding: 8px; border: 1px solid #000000; font-size: 8.5pt; min-height: 50px; color: #000000;">
        {{{default ObservacionesDirector observaciones_director ""}}}
      </div>
    </div>

    <div style="margin-top: 18px;">
      <p style="font-weight: bold; font-size: 8.5pt; text-transform: uppercase; margin-bottom: 6px; color: #000000;">OBSERVACIONES GENERALES DEL COORDINADOR DE LA UNIDAD DE INVESTIGACIÓN:</p>
      <div style="padding: 8px; border: 1px solid #000000; font-size: 8.5pt; min-height: 45px; color: #000000;">
        {{{default ObservacionesCoordinador observaciones_coordinador ""}}}
      </div>
    </div>
  </div>`;
};

/**
 * Genera el HTML Handlebars para los Datos Generales del Proyecto (Bloque: progress_header_section)
 */
export const generateProgressHeaderHtml = (block: DocumentBlock): string => {
    const c: any = block.config || {};
    const title = c.headerTitle || '1. DATOS GENERALES DEL PROYECTO';
    return `
  <!-- BLOQUE: DATOS GENERALES DEL PROYECTO (ENCABEZADO INFORME AVANCE) -->
  <div style="margin-top: 15px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: ${COLORS.blue}; margin-bottom: 6px;">${title}</p>
    <table class="info-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
      <tbody>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; width: 32%; padding: 5px 8px; border: 1px solid #334155;">NOMBRE DEL PROYECTO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;" colspan="3">{{default NombreProyecto Titulo title ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PROGRAMA:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default Programa ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">GRUPO DE INVESTIGACIÓN:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default GrupoInvestigacion GrupoInvestigacionNombre ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">DOMINIO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default Dominio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">LÍNEA DE INVESTIGACIÓN:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default LineaInvestigacion ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">SUBLÍNEA DE INVESTIGACIÓN:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default SublineaInvestigacion ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">CAMPO AMPLIO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default CampoAmplio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">CAMPO ESPECÍFICO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default CampoEspecifico ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">CAMPO DETALLADO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default CampoDetallado ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">CARRERA:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default Carrera ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">TIPO DE INVESTIGACIÓN:</td>
          <td style="padding: 0; border: 1px solid #cbd5e1;" colspan="3">
            <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 8pt;">
              <tr>
                <td style="width: 25%; padding: 4px; font-weight: bold;">BÁSICA</td>
                <td style="width: 8%; border-right: 1px solid #cbd5e1;">[ &nbsp; ]</td>
                <td style="width: 25%; padding: 4px; font-weight: bold;">APLICADA</td>
                <td style="width: 8%; border-right: 1px solid #cbd5e1;">[ X ]</td>
                <td style="width: 26%; padding: 4px; font-weight: bold;">DESARROLLO EXPERIMENTAL</td>
                <td style="width: 8%;">[ &nbsp; ]</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PERIODO ACADÉMICO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default Periodo PeriodoConvocatoria ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">DIRECTOR DEL PROYECTO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;" colspan="3">{{default DirectorProyecto NombreDirectorFirma ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">INVESTIGADORES:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;" colspan="3">{{default InvestigadoresTexto ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; width: 32%;">FECHA INICIO DEL PROYECTO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 18%;">{{default FechaInicio ""}}</td>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; width: 32%;">FECHA FIN PREVISTA DEL PROYECTO:</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 18%;">{{default FechaFin ""}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- BLOQUE: 2. MATRIZ DE ACTIVIDADES EJECUTADAS -->
  {{#if ActividadesEjecutadas}}
  <div style="margin-top: 25px; page-break-inside: avoid;">
    <p style="font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: {{ theme.colors.primary }}; margin-bottom: 6px;">2. MATRIZ DE ACTIVIDADES EJECUTADAS</p>
    {{#each ActividadesEjecutadas}}
    <table class="info-table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
      <tbody>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; width: 32%; padding: 5px 8px; border: 1px solid #334155;">NÚMERO DE ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">{{default NumeroActividad ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">ACTIVIDADES EJECUTADAS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default ActividadesEjecutadas ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">RESULTADOS OBTENIDOS</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default ResultadosObtenidos ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PORCENTAJE DE AVANCE (%)</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">{{default PorcentajeAvance "100"}}%</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">PARTICIPANTES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default Participantes "Director del Proyecto e Investigadores"}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA DE INICIO DE LA ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default FechaInicio ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #1e293b; color: white; font-weight: bold; padding: 5px 8px; border: 1px solid #334155;">FECHA FIN DE LA ACTIVIDAD</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">{{default FechaFin ""}}</td>
        </tr>
        <tr>
          <td style="background-color: #b8860b; color: black; font-weight: bold; padding: 5px 8px; border: 1px solid #996515; vertical-align: top;">OBSERVACIONES</td>
          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; min-height: 40px; vertical-align: top;">{{default Observaciones ""}}</td>
        </tr>
      </tbody>
    </table>
    {{/each}}
  </div>
  {{/if}}
</div>`;
};

