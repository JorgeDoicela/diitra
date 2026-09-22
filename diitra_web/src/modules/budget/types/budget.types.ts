export type SemaforoCacesType = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface PresupuestoItem {
  id_item?: number;
  idItem?: number;
  id_proyecto?: number;
  idProyecto?: number;
  categoria: string;
  id_partida?: string | null;
  idPartida?: string | null;
  detalle: string;
  cantidad: number;
  valor_unitario: number;
  valorUnitario?: number;
  valor_total: number;
  valorTotal?: number;
  es_gasto_capital: boolean;
  esGastoCapital?: boolean;
  total_ejecutado?: number;
  totalEjecutado?: number;
  saldo_disponible?: number;
  saldoDisponible?: number;
  porcentaje_ejecucion?: number;
  porcentajeEjecucion?: number;
  cantidad_facturas?: number;
  cantidadFacturas?: number;
}

export interface GastoDetalle {
  id_gasto?: number;
  idGasto?: number;
  uuid: string;
  id_proyecto?: number;
  idProyecto?: number;
  id_item: number;
  idItem?: number;
  categoria_item?: string;
  categoriaItem?: string;
  partida_item?: string | null;
  partidaItem?: string | null;
  detalle_item?: string;
  detalleItem?: string;
  monto: number;
  fecha_gasto: string;
  fechaGasto?: string;
  numero_factura?: string | null;
  numeroFactura?: string | null;
  ruc_proveedor?: string | null;
  rucProveedor?: string | null;
  responsable_nombre?: string | null;
  responsableNombre?: string | null;
  descripcion?: string | null;
  id_evidencia?: number | null;
  idEvidencia?: number | null;
}

export interface FinanciamientoItem {
  id_financiamiento?: number;
  idFinanciamiento?: number;
  id_proyecto?: number;
  idProyecto?: number;
  es_istpet?: boolean | null;
  esIstpet?: boolean | null;
  nombre_empresa?: string | null;
  nombreEmpresa?: string | null;
  otras_fuentes?: boolean | null;
  otrasFuentes?: boolean | null;
  monto?: number | null;
}

export interface PresupuestoResumen {
  presupuesto_total_planificado: number;
  presupuestoTotalPlanificado?: number;
  presupuesto_total_ejecutado: number;
  presupuestoTotalEjecutado?: number;
  saldo_disponible: number;
  saldoDisponible?: number;
  porcentaje_ejecucion: number;
  porcentajeEjecucion?: number;
  semaforo_caces: SemaforoCacesType;
  semaforoCaces?: SemaforoCacesType;
  total_items: number;
  totalItems?: number;
  total_gastos: number;
  totalGastos?: number;
  total_gasto_capital: number;
  totalGastoCapital?: number;
  total_gasto_corriente: number;
  totalGastoCorriente?: number;
  puede_editar_planificacion: boolean;
  puedeEditarPlanificacion?: boolean;
  puede_registrar_gastos: boolean;
  puedeRegistrarGastos?: boolean;
  estado_proyecto: string;
  estadoProyecto?: string;
  items: PresupuestoItem[];
  gastos: GastoDetalle[];
  financiamientos: FinanciamientoItem[];
}
export interface GuardarItemPayload {
  id_item?: number;
  categoria: string;
  id_partida?: string | null;
  detalle: string;
  cantidad: number;
  valor_unitario: number;
  es_gasto_capital: boolean;
}

export interface RegistrarGastoPayload {
  id_item: number;
  monto: number;
  fecha_gasto: string;
  numero_factura?: string;
  ruc_proveedor?: string;
  responsable_nombre?: string;
  descripcion: string;
  id_evidencia?: number | null;
}

export interface GuardarFinanciamientoPayload {
  id_financiamiento?: number;
  es_istpet?: boolean;
  nombre_empresa?: string | null;
  otras_fuentes?: boolean;
  monto: number;
}
