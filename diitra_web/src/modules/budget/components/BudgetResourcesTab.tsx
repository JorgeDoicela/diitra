import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Coins, Building2, Check, AlertCircle, Info, Landmark } from 'lucide-react';
import type { PresupuestoItem, FinanciamientoItem, GuardarItemPayload, GuardarFinanciamientoPayload } from '../types/budget.types';

interface BudgetResourcesTabProps {
  items: PresupuestoItem[];
  financiamientos: FinanciamientoItem[];
  presupuestoTotalPlanificado: number;
  canEdit: boolean;
  modalidad?: 'INVESTIGACION' | 'INNOVACION' | string;
  onSaveItem: (payload: GuardarItemPayload) => Promise<boolean>;
  onDeleteItem: (itemId: number) => Promise<boolean>;
  onSaveFinanciamiento: (payload: GuardarFinanciamientoPayload) => Promise<boolean>;
  onDeleteFinanciamiento: (id: number) => Promise<boolean>;
  actionLoading?: boolean;
}

const CATEGORIAS_INVESTIGACION = [
  'Equipos de Laboratorio',
  'Materiales Fungibles y Reactivos',
  'Publicación Científica (APC)',
  'Viáticos y Trabajo de Campo',
  'Servicios Técnicos Especializados',
  'Material Bibliográfico y Licencias',
  'Estipendios / Ayudantía Estudiantil',
  'Otros Gastos Operativos'
];

const CATEGORIAS_INNOVACION = [
  'Insumos de Prototipado Rápido',
  'Componentes Electrónicos e IoT',
  'Servicios de Maquila y Fabricación',
  'Tasas SENADI (Propiedad Intelectual)',
  'Infraestructura Cloud / Servidores',
  'Pruebas Piloto y Validación en Campo',
  'Estipendios / Ayudantía Estudiantil',
  'Otros Gastos de Desarrollo'
];

export const BudgetResourcesTab: React.FC<BudgetResourcesTabProps> = ({
  items,
  financiamientos,
  presupuestoTotalPlanificado,
  canEdit,
  modalidad = 'INVESTIGACION',
  onSaveItem,
  onDeleteItem,
  onSaveFinanciamiento,
  onDeleteFinanciamiento,
  actionLoading = false
}) => {
  const isInnovacion = modalidad === 'INNOVACION';
  const categorias = isInnovacion ? CATEGORIAS_INNOVACION : CATEGORIAS_INVESTIGACION;

  // Modales
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PresupuestoItem | null>(null);

  const [isFinModalOpen, setIsFinModalOpen] = useState(false);
  const [editingFin, setEditingFin] = useState<FinanciamientoItem | null>(null);

  // Formulario Recurso Necesario
  const [categoria, setCategoria] = useState(categorias[0]);
  const [idPartida, setIdPartida] = useState('');
  const [detalle, setDetalle] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [esGastoCapital, setEsGastoCapital] = useState(false);
  const [formErrorItem, setFormErrorItem] = useState<string | null>(null);

  // Formulario Financiamiento
  const [tipoFuente, setTipoFuente] = useState<'ISTPET' | 'EMPRESA' | 'OTRAS'>('ISTPET');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [montoFin, setMontoFin] = useState(0);
  const [formErrorFin, setFormErrorFin] = useState<string | null>(null);

  const totalFinanciado = financiamientos.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const brechaFinanciera = Math.max(0, presupuestoTotalPlanificado - totalFinanciado);

  const openCreateItemModal = () => {
    setEditingItem(null);
    setCategoria(categorias[0]);
    setIdPartida('');
    setDetalle('');
    setCantidad(1);
    setValorUnitario(0);
    setEsGastoCapital(false);
    setFormErrorItem(null);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: PresupuestoItem) => {
    setEditingItem(item);
    setCategoria(item.categoria);
    setIdPartida(item.id_partida || item.idPartida || '');
    setDetalle(item.detalle);
    setCantidad(item.cantidad);
    setValorUnitario(item.valor_unitario ?? item.valorUnitario ?? 0);
    setEsGastoCapital(item.es_gasto_capital ?? item.esGastoCapital ?? false);
    setFormErrorItem(null);
    setIsItemModalOpen(true);
  };

  const handleSaveItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalle.trim()) {
      setFormErrorItem('El detalle del recurso o partida es obligatorio.');
      return;
    }
    if (cantidad <= 0 || valorUnitario <= 0) {
      setFormErrorItem('La cantidad y el costo unitario deben ser mayores a cero.');
      return;
    }

    const payload: GuardarItemPayload = {
      id_item: editingItem?.id_item || editingItem?.idItem,
      categoria,
      id_partida: idPartida.trim() || null,
      detalle: detalle.trim(),
      cantidad,
      valor_unitario: valorUnitario,
      es_gasto_capital: esGastoCapital
    };

    const ok = await onSaveItem(payload);
    if (ok) {
      setIsItemModalOpen(false);
    }
  };

  const openCreateFinModal = () => {
    setEditingFin(null);
    setTipoFuente('ISTPET');
    setNombreEmpresa('');
    setMontoFin(brechaFinanciera > 0 ? brechaFinanciera : 0);
    setFormErrorFin(null);
    setIsFinModalOpen(true);
  };

  const handleSaveFinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoFin <= 0) {
      setFormErrorFin('El monto de financiamiento debe ser mayor a cero.');
      return;
    }
    if (tipoFuente === 'EMPRESA' && !nombreEmpresa.trim()) {
      setFormErrorFin('Especifique el nombre de la empresa o contraparte.');
      return;
    }

    const payload: GuardarFinanciamientoPayload = {
      id_financiamiento: editingFin?.id_financiamiento || editingFin?.idFinanciamiento,
      es_istpet: tipoFuente === 'ISTPET',
      nombre_empresa: tipoFuente === 'EMPRESA' ? nombreEmpresa.trim() : null,
      otras_fuentes: tipoFuente === 'OTRAS',
      monto: montoFin
    };

    const ok = await onSaveFinanciamiento(payload);
    if (ok) {
      setIsFinModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* ── 1. RECURSOS NECESARIOS (PARTIDAS A ADQUIRIR) ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-main uppercase tracking-wider font-mono">
                1. Recursos Necesarios a Adquirir
              </span>
              <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.2 !px-1.5 font-medium">
                {items.length} {items.length === 1 ? 'partida' : 'partidas'}
              </span>
            </div>
            <p className="text-[11px] text-text-dim">
              Insumos, equipos y servicios que el proyecto requiere financiar para su desarrollo.
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openCreateItemModal}
              disabled={actionLoading}
              className="btn-vercel-primary !h-8 !px-3 !text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>Agregar Recurso</span>
            </button>
          )}
        </div>

        <div className="border border-border-thin rounded-xl overflow-hidden bg-surface">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-hover/50 border-b border-border-thin text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">
                    <th className="p-3">Categoría / Partida</th>
                    <th className="p-3">Detalle del Recurso</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Costo Unit.</th>
                    <th className="p-3 text-right">Costo Total</th>
                    {canEdit && <th className="p-3 text-right w-16">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-thin/40 text-[11px]">
                  {items.map((item) => {
                    const itemId = item.id_item || item.idItem || 0;
                    const unitario = item.valor_unitario ?? item.valorUnitario ?? 0;
                    const total = item.valor_total ?? item.valorTotal ?? (item.cantidad * unitario);
                    const partida = item.id_partida || item.idPartida;

                    return (
                      <tr key={itemId} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="p-3 font-semibold text-text-main">
                          <div>{item.categoria}</div>
                          {partida && (
                            <span className="text-[9px] font-mono text-text-dim">Partida: {partida}</span>
                          )}
                        </td>
                        <td className="p-3 text-text-dim select-text">
                          <span className="text-text-main font-medium">{item.detalle}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-text-main font-mono">
                          {item.cantidad}
                        </td>
                        <td className="p-3 text-right text-text-dim font-mono">
                          ${unitario.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-bold text-text-main font-mono">
                          ${total.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditItemModal(item)}
                                className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                                title="Editar partida"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteItem(itemId)}
                                className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors cursor-pointer"
                                title="Eliminar partida"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {/* Fila de Costo Total Oficial */}
                  <tr className="bg-surface-hover/40 border-t border-border-thin font-mono font-bold text-xs">
                    <td colSpan={canEdit ? 4 : 4} className="p-3 text-right uppercase tracking-wider text-text-main">
                      Costo Total del Proyecto:
                    </td>
                    <td className="p-3 text-right text-text-main select-text text-sm">
                      ${presupuestoTotalPlanificado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {canEdit && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-text-dim text-xs">
              No se han registrado recursos necesarios. Use el botón superior para agregar partidas planificadas.
            </div>
          )}
        </div>
      </div>

      {/* ── 2. FINANCIAMIENTO INSTITUCIONAL Y EXTERNO ── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-main uppercase tracking-wider font-mono">
                2. Fuentes de Financiamiento
              </span>
              <span className={`badge-vercel !text-[9px] !py-0.2 !px-1.5 font-medium ${
                brechaFinanciera === 0 ? 'badge-vercel-brand' : 'badge-vercel-warning'
              }`}>
                {brechaFinanciera === 0 ? '100% Cubierto' : `Falta financiar $${brechaFinanciera.toFixed(2)}`}
              </span>
            </div>
            <p className="text-[11px] text-text-dim">
              Distribución de aportes económicos (ISTPET y/o contrapartes externas).
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openCreateFinModal}
              disabled={actionLoading}
              className="btn-vercel-secondary !h-8 !px-3 !text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>Agregar Fuente</span>
            </button>
          )}
        </div>

        <div className="border border-border-thin rounded-xl overflow-hidden bg-surface">
          {financiamientos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-hover/50 border-b border-border-thin text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">
                    <th className="p-3">Entidad / Fuente</th>
                    <th className="p-3">Tipo de Financiamiento</th>
                    <th className="p-3 text-right">Monto Aportado</th>
                    {canEdit && <th className="p-3 text-right w-16">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-thin/40 text-[11px]">
                  {financiamientos.map((fin) => {
                    const finId = fin.id_financiamiento || fin.idFinanciamiento || 0;
                    const esIstpet = fin.es_istpet ?? fin.esIstpet;
                    const esEmpresa = !!(fin.nombre_empresa || fin.nombreEmpresa);
                    const label = esIstpet ? 'Instituto Superior Tecnológico Pichincha (ISTPET)' : (fin.nombre_empresa || fin.nombreEmpresa || 'Otras Fuentes Externas');
                    const monto = fin.monto || 0;

                    return (
                      <tr key={finId} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="p-3 font-semibold text-text-main flex items-center gap-2">
                          {esIstpet ? <Landmark size={14} className="text-brand shrink-0" /> : <Building2 size={14} className="text-text-dim shrink-0" />}
                          <span>{label}</span>
                        </td>
                        <td className="p-3 text-text-dim">
                          <span className="badge-vercel badge-vercel-neutral !text-[9px]">
                            {esIstpet ? 'Fondos Institucionales' : (esEmpresa ? 'Contraparte Aliada' : 'Fuentes Autogestionadas')}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-text-main font-mono">
                          ${monto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteFinanciamiento(finId)}
                              className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors cursor-pointer"
                              title="Eliminar financiamiento"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-surface-hover/40 border-t border-border-thin font-mono font-bold text-xs">
                    <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-text-main">
                      Total Financiado:
                    </td>
                    <td className="p-3 text-right text-text-main select-text text-sm">
                      ${totalFinanciado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {canEdit && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-text-dim text-xs">
              No se han registrado fuentes de financiamiento. Use el botón superior para vincular aportes.
            </div>
          )}
        </div>
      </div>

      {/* ── 3. RECURSOS DISPONIBLES (INFRAESTRUCTURA Y EQUIPOS PREEXISTENTES) ── */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-main uppercase tracking-wider font-mono">
            3. Recursos Disponibles Institucionales
          </span>
          <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.2 !px-1.5 font-medium">
            Preexistentes
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border-thin bg-surface text-xs text-text-dim space-y-1">
          <p>
            Infraestructura institucional asignada (laboratorios, talleres, aulas de desarrollo y software de campus) sin costo directo de adquisición para el proyecto.
          </p>
        </div>
      </div>

      {/* ── MODAL: AGREGAR / EDITAR RECURSO NECESARIO ── */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-thin pb-3">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wide font-mono">
                {editingItem ? 'Editar Recurso Necesario' : 'Nuevo Recurso Necesario (§4)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-text-dim hover:text-text-main text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formErrorItem && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formErrorItem}</span>
              </div>
            )}

            <form onSubmit={handleSaveItemSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Detalle / Descripción del Recurso
                </label>
                <input
                  type="text"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Ej: Licencias de software especializado, insumos electrónicos..."
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 1)}
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Costo Unitario (USD)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={valorUnitario}
                    onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-hover/50 border border-border-thin flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Costo Subtotal:</span>
                <span className="text-sm font-mono font-bold text-text-main">
                  ${(cantidad * valorUnitario).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-thin">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="btn-vercel-secondary !h-9 !px-4 !text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-vercel-primary !h-9 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={13} />
                  <span>{editingItem ? 'Guardar Cambios' : 'Crear Recurso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AGREGAR FINANCIAMIENTO ── */}
      {isFinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-thin pb-3">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wide font-mono">
                Registrar Fuente de Financiamiento
              </h3>
              <button
                type="button"
                onClick={() => setIsFinModalOpen(false)}
                className="text-text-dim hover:text-text-main text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formErrorFin && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formErrorFin}</span>
              </div>
            )}

            <form onSubmit={handleSaveFinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Tipo de Fuente
                </label>
                <select
                  value={tipoFuente}
                  onChange={(e) => setTipoFuente(e.target.value as any)}
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                >
                  <option value="ISTPET">Fondos Institucionales (ISTPET)</option>
                  <option value="EMPRESA">Empresa Aliada / Auspiciante</option>
                  <option value="OTRAS">Otras Fuentes Autogestionadas</option>
                </select>
              </div>

              {tipoFuente === 'EMPRESA' && (
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Razón Social de la Empresa / Entidad
                  </label>
                  <input
                    type="text"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    placeholder="Ej: Cámara de Comercio, Empresa Privada S.A."
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Monto Financiado (USD)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={montoFin}
                  onChange={(e) => setMontoFin(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-thin">
                <button
                  type="button"
                  onClick={() => setIsFinModalOpen(false)}
                  className="btn-vercel-secondary !h-9 !px-4 !text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-vercel-primary !h-9 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={13} />
                  <span>Vincular Financiamiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
