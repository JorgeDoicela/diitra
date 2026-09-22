import type { PresupuestoResumen } from '../types/budget.types';

/**
 * Utilidades para formatear y exportar el balance financiero y ejecución de gastos
 * para el Informe Final de Investigación (Sección 12: Informe Financiero) y
 * los Informes de Avance de Proyecto (PresupuestoEjecutado).
 */

const formatMoney = (val: number): string => {
  return `$ ${Number(val || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Genera una tabla HTML institucional limpia y profesional, compatible tanto
 * con el editor colaborativo (CoWorkEditor), los reportes PDF (Handlebars) y
 * el portapapeles para pegar en Microsoft Word / LibreOffice.
 */
export const generateFinancialReportHtml = (
  resumen: PresupuestoResumen,
  proyectoTitulo: string = ''
): string => {
  const planificado = resumen.presupuesto_total_planificado ?? resumen.presupuestoTotalPlanificado ?? 0;
  const ejecutado = resumen.presupuesto_total_ejecutado ?? resumen.presupuestoTotalEjecutado ?? 0;
  const saldo = resumen.saldo_disponible ?? resumen.saldoDisponible ?? 0;
  const porcentaje = resumen.porcentaje_ejecucion ?? resumen.porcentajeEjecucion ?? 0;
  const items = resumen.items || [];
  const gastos = resumen.gastos || [];
  const financiamientos = resumen.financiamientos || [];

  const tableStyle = 'width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; font-family: sans-serif;';
  const thStyle = 'border: 1px solid #cbd5e1; background-color: #f1f5f9; padding: 8px 10px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; text-align: left;';
  const thNumStyle = 'border: 1px solid #cbd5e1; background-color: #f1f5f9; padding: 8px 10px; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; text-align: right;';
  const tdStyle = 'border: 1px solid #e2e8f0; padding: 7px 10px; vertical-align: top;';
  const tdNumStyle = 'border: 1px solid #e2e8f0; padding: 7px 10px; text-align: right; font-family: monospace; font-size: 9pt;';
  const trTotalStyle = 'border-top: 2px solid #94a3b8; font-weight: bold; background-color: #f8fafc;';

  // 1. Resumen Ejecutivo de Ejecución Presupuestaria
  let html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5;">
    <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">
      Informe Financiero y Balance de Ejecución de Recursos
    </h3>
    ${proyectoTitulo ? `<p style="font-size: 9.5pt; color: #64748b; margin-top: -8px; margin-bottom: 16px;"><strong>Proyecto:</strong> ${proyectoTitulo}</p>` : ''}
    
    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}">Concepto Consolidado</th>
          <th style="${thNumStyle} width: 140px;">Monto (USD)</th>
          <th style="${thStyle} width: 140px;">Indicador</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="${tdStyle}">Presupuesto Planificado Aprobado (§4)</td>
          <td style="${tdNumStyle}"><strong>${formatMoney(planificado)}</strong></td>
          <td style="${tdStyle}">100.0 % Base</td>
        </tr>
        <tr>
          <td style="${tdStyle}">Presupuesto Total Devengado / Ejecutado</td>
          <td style="${tdNumStyle}"><strong>${formatMoney(ejecutado)}</strong></td>
          <td style="${tdStyle}"><strong>${porcentaje.toFixed(1)} % Ejecutado</strong></td>
        </tr>
        <tr style="${trTotalStyle}">
          <td style="${tdStyle}">Saldo Remanente Institucional</td>
          <td style="${tdNumStyle}; color: ${saldo < 0 ? '#dc2626' : '#16a34a'};"><strong>${formatMoney(saldo)}</strong></td>
          <td style="${tdStyle}; color: ${saldo < 0 ? '#dc2626' : '#16a34a'};"><strong>${saldo < 0 ? 'Sobregiro' : 'Disponible'}</strong></td>
        </tr>
      </tbody>
    </table>
  `;

  // 2. Desglose de Recursos Necesarios Planificados vs Ejecutados
  html += `
    <h4 style="font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 10px; color: #1e293b;">
      1. Detalle por Partidas y Recursos Necesarios
    </h4>
    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}">Categoría / Partida</th>
          <th style="${thStyle}">Detalle del Recurso</th>
          <th style="${thNumStyle} width: 60px;">Cant.</th>
          <th style="${thNumStyle} width: 95px;">Planificado</th>
          <th style="${thNumStyle} width: 95px;">Devengado</th>
          <th style="${thNumStyle} width: 95px;">Saldo</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (items.length === 0) {
    html += `<tr><td colspan="6" style="${tdStyle}; text-align: center; color: #94a3b8; font-style: italic;">No se registraron partidas presupuestarias planificadas.</td></tr>`;
  } else {
    items.forEach(item => {
      const itemPlan = item.valor_total ?? item.valorTotal ?? (item.cantidad * (item.valor_unitario ?? item.valorUnitario ?? 0));
      const itemEjec = item.total_ejecutado ?? item.totalEjecutado ?? 0;
      const itemSaldo = item.saldo_disponible ?? item.saldoDisponible ?? (itemPlan - itemEjec);

      html += `
        <tr>
          <td style="${tdStyle}"><strong>${item.categoria}</strong>${item.id_partida ? `<br/><span style="font-size: 8pt; color: #64748b;">Partida: ${item.id_partida}</span>` : ''}</td>
          <td style="${tdStyle}">${item.detalle}</td>
          <td style="${tdNumStyle}">${item.cantidad}</td>
          <td style="${tdNumStyle}">${formatMoney(itemPlan)}</td>
          <td style="${tdNumStyle}">${formatMoney(itemEjec)}</td>
          <td style="${tdNumStyle}; color: ${itemSaldo < 0 ? '#dc2626' : '#16a34a'};">${formatMoney(itemSaldo)}</td>
        </tr>
      `;
    });

    html += `
      <tr style="${trTotalStyle}">
        <td colspan="3" style="${tdStyle}; text-align: right; text-transform: uppercase;">Total General:</td>
        <td style="${tdNumStyle}">${formatMoney(planificado)}</td>
        <td style="${tdNumStyle}">${formatMoney(ejecutado)}</td>
        <td style="${tdNumStyle}; color: ${saldo < 0 ? '#dc2626' : '#16a34a'};">${formatMoney(saldo)}</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  // 3. Libro Diario de Egresos y Comprobantes
  html += `
    <h4 style="font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 10px; color: #1e293b;">
      2. Relación de Facturas y Comprobantes de Egreso Devengados
    </h4>
    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle} width: 85px;">Fecha</th>
          <th style="${thStyle} width: 120px;">Comprobante / N° Factura</th>
          <th style="${thStyle}">Recurso Afectado / Justificación</th>
          <th style="${thStyle} width: 140px;">Responsable</th>
          <th style="${thNumStyle} width: 95px;">Monto (USD)</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (gastos.length === 0) {
    html += `<tr><td colspan="5" style="${tdStyle}; text-align: center; color: #94a3b8; font-style: italic;">No se han registrado facturas ni comprobantes de egreso en el período.</td></tr>`;
  } else {
    gastos.forEach(g => {
      const fecha = g.fecha_gasto || g.fechaGasto || '-';
      const factura = g.numero_factura || g.numeroFactura || 'S/N';
      const partida = g.detalle_item || g.detalleItem || g.categoria_item || g.categoriaItem || 'Partida vinculada';
      const resp = g.responsable_nombre || g.responsableNombre || '-';
      const monto = g.monto || 0;
      const desc = g.descripcion ? `<br/><span style="font-size: 8.5pt; color: #64748b;">${g.descripcion}</span>` : '';

      html += `
        <tr>
          <td style="${tdStyle}; font-family: monospace; font-size: 8.5pt;">${fecha}</td>
          <td style="${tdStyle}; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${factura}</td>
          <td style="${tdStyle}"><strong>${partida}</strong>${desc}</td>
          <td style="${tdStyle}">${resp}</td>
          <td style="${tdNumStyle}"><strong>${formatMoney(monto)}</strong></td>
        </tr>
      `;
    });

    html += `
      <tr style="${trTotalStyle}">
        <td colspan="4" style="${tdStyle}; text-align: right; text-transform: uppercase;">Total Egresos Registrados:</td>
        <td style="${tdNumStyle}">${formatMoney(ejecutado)}</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  // 4. Fuentes de Financiamiento
  if (financiamientos.length > 0) {
    const totalFin = financiamientos.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    html += `
      <h4 style="font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 24px; margin-bottom: 10px; color: #1e293b;">
        3. Fuentes de Financiamiento del Proyecto
      </h4>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}">Entidad / Fuente de Fondos</th>
            <th style="${thStyle}">Tipo de Financiamiento</th>
            <th style="${thNumStyle} width: 120px;">Monto (USD)</th>
          </tr>
        </thead>
        <tbody>
    `;

    financiamientos.forEach(f => {
      const esIstpet = f.es_istpet ?? f.esIstpet;
      const esEmpresa = !!(f.nombre_empresa || f.nombreEmpresa);
      const nombre = esIstpet ? 'Instituto Superior Tecnológico Pichincha (ISTPET)' : (f.nombre_empresa || f.nombreEmpresa || 'Otras Fuentes Externas');
      const tipo = esIstpet ? 'Fondos Institucionales' : (esEmpresa ? 'Contraparte Aliada' : 'Autogestión');
      const m = f.monto || 0;

      html += `
        <tr>
          <td style="${tdStyle}"><strong>${nombre}</strong></td>
          <td style="${tdStyle}">${tipo}</td>
          <td style="${tdNumStyle}">${formatMoney(m)}</td>
        </tr>
      `;
    });

    html += `
        <tr style="${trTotalStyle}">
          <td colspan="2" style="${tdStyle}; text-align: right; text-transform: uppercase;">Total Financiado:</td>
          <td style="${tdNumStyle}">${formatMoney(totalFin)}</td>
        </tr>
      </tbody>
    </table>
    `;
  }

  html += `</div>`;
  return html;
};

/**
 * Genera la lista de Presupuesto Ejecutado para la sección correspondiente
 * en el Informe de Avance (INFORME_AVANCE).
 */
export const generatePresupuestoEjecutadoList = (
  resumen: PresupuestoResumen
): Array<{ partida: string; presupuestado: number; ejecutado: number; saldo: number }> => {
  const items = resumen.items || [];
  return items.map(i => {
    const presupuestado = i.valor_total ?? i.valorTotal ?? (i.cantidad * (i.valor_unitario ?? i.valorUnitario ?? 0));
    const ejecutado = i.total_ejecutado ?? i.totalEjecutado ?? 0;
    const saldo = i.saldo_disponible ?? i.saldoDisponible ?? (presupuestado - ejecutado);

    return {
      partida: i.detalle || i.categoria,
      presupuestado,
      ejecutado,
      saldo
    };
  });
};
