import type { CronogramaResumen, ActividadCronogramaItem } from '../types/schedule.types';

export const formatScheduleClipboardHtml = (
  resumen: CronogramaResumen,
  projectTitle: string = 'Proyecto de Investigación'
): string => {
  const actividades = resumen.actividades || [];
  const pctGlobal = resumen.porcentaje_avance_global ?? resumen.porcentajeAvanceGlobal ?? 0;

  const rowsHtml = actividades.map((act) => {
    const num = act.numero_actividad ?? act.numeroActividad ?? 1;
    const desc = act.descripcion || '';
    const obj = act.objetivo_descripcion ?? act.objetivoDescripcion ?? 'General';
    const resp = act.responsable || 'Equipo del Proyecto';
    const entregable = act.entregable || 'Informe Técnico';
    const fInicio = act.fecha_inicio_prevista ?? act.fechaInicioPrevista ?? 'S/F';
    const fFin = act.fecha_fin_prevista ?? act.fechaFinPrevista ?? 'S/F';
    const progreso = act.progreso ?? 0;
    const esCaces = act.es_entregable_caces ?? act.esEntregableCaces ?? false;
    const estado = act.estado || (progreso >= 100 ? 'COMPLETADA' : 'EN_CURSO');

    return `
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">${num}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">
          <strong>${desc}</strong>
          <br/><span style="font-size: 11px; color: #6b7280;">${obj}</span>
        </td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${resp}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${fInicio} - ${fFin}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">${progreso}%</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${entregable}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; color: ${estado === 'COMPLETADA' ? '#059669' : estado === 'ATRASADA' ? '#dc2626' : '#2563eb'};">
            ${estado} ${esCaces ? '(CACES)' : ''}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 900px;">
      <h3 style="margin-bottom: 4px; color: #1f2937;">SEGUIMIENTO DEL CRONOGRAMA DE ACTIVIDADES</h3>
      <p style="margin-top: 0; font-size: 13px; color: #4b5563;"><strong>Proyecto:</strong> ${projectTitle}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px; font-size: 12px;">
        <thead>
          <tr style="background-color: #1f3864; color: #ffffff;">
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: center; width: 40px;">N°</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: left;">Actividad / Objetivo</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: left;">Responsable</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: left;">Plazo Previsto</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: center; width: 60px;">Avance</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: left;">Entregable</th>
            <th style="border: 1px solid #1f3864; padding: 8px; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">AVANCE GLOBAL PONDERADO:</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #059669;">${pctGlobal.toFixed(1)}%</td>
            <td colspan="2" style="border: 1px solid #d1d5db; padding: 8px; font-size: 11px; color: #4b5563;">
              Actividades: ${actividades.length} | Completadas: ${resumen.actividades_completadas ?? resumen.actividadesCompletadas ?? 0}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};

export const generateActividadesEjecutadasList = (resumen: CronogramaResumen): any[] => {
  const actividades = resumen.actividades || [];
  return actividades.map((act, index) => {
    const num = act.numero_actividad ?? act.numeroActividad ?? index + 1;
    const desc = act.descripcion || '';
    const progreso = act.progreso ?? 0;
    const resp = act.responsable || 'Director + Co-investigadores';
    const fInicio = act.fecha_inicio_prevista ?? act.fechaInicioPrevista ?? '';
    const fFin = act.fecha_fin_prevista ?? act.fechaFinPrevista ?? '';
    const entregable = act.entregable || '';
    const estado = act.estado || (progreso >= 100 ? 'COMPLETADA' : 'EN_CURSO');

    return {
      NumeroActividad: `Actividad ${num}`,
      ActividadesEjecutadas: desc,
      ResultadosObtenidos: entregable || (progreso >= 100 ? 'Actividad finalizada satisfactoriamente' : 'En proceso de desarrollo'),
      PorcentajeAvance: progreso,
      Participantes: resp,
      FechaInicio: fInicio,
      FechaFin: fFin,
      Observaciones: estado === 'ATRASADA' ? 'Actividad con retraso frente al cronograma previsto' : ''
    };
  });
};
