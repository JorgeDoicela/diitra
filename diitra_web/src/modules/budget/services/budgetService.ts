import api from '../../../api/axios_config';
import type {
  PresupuestoResumen,
  PresupuestoItem,
  GastoDetalle,
  FinanciamientoItem,
  GuardarItemPayload,
  RegistrarGastoPayload,
  GuardarFinanciamientoPayload
} from '../types/budget.types';

export const budgetService = {
  async getPresupuesto(projectUuid: string): Promise<PresupuestoResumen> {
    const response = await api.get(`/projects/${projectUuid}/presupuesto`);
    return response.data;
  },

  async guardarItem(projectUuid: string, payload: GuardarItemPayload): Promise<PresupuestoItem> {
    const response = await api.post(`/projects/${projectUuid}/presupuesto/items`, {
      idItem: payload.id_item,
      categoria: payload.categoria,
      idPartida: payload.id_partida,
      detalle: payload.detalle,
      cantidad: payload.cantidad,
      valorUnitario: payload.valor_unitario,
      esGastoCapital: payload.es_gasto_capital
    });
    return response.data;
  },

  async eliminarItem(projectUuid: string, itemId: number): Promise<void> {
    await api.delete(`/projects/${projectUuid}/presupuesto/items/${itemId}`);
  },

  async registrarGasto(projectUuid: string, payload: RegistrarGastoPayload): Promise<GastoDetalle> {
    const response = await api.post(`/projects/${projectUuid}/gastos/registro`, {
      idItem: payload.id_item,
      monto: payload.monto,
      fechaGasto: payload.fecha_gasto,
      numeroFactura: payload.numero_factura,
      rucProveedor: payload.ruc_proveedor,
      responsableNombre: payload.responsable_nombre,
      descripcion: payload.descripcion,
      idEvidencia: payload.id_evidencia
    });
    return response.data;
  },

  async eliminarGasto(projectUuid: string, gastoUuid: string): Promise<void> {
    await api.delete(`/projects/${projectUuid}/gastos/${gastoUuid}`);
  },

  async guardarFinanciamiento(projectUuid: string, payload: GuardarFinanciamientoPayload): Promise<FinanciamientoItem> {
    const response = await api.post(`/projects/${projectUuid}/presupuesto/financiamientos`, {
      idFinanciamiento: payload.id_financiamiento,
      esIstpet: payload.es_istpet,
      nombreEmpresa: payload.nombre_empresa,
      otrasFuentes: payload.otras_fuentes,
      monto: payload.monto
    });
    return response.data;
  },

  async eliminarFinanciamiento(projectUuid: string, financiamientoId: number): Promise<void> {
    await api.delete(`/projects/${projectUuid}/presupuesto/financiamientos/${financiamientoId}`);
  }
};
