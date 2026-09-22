import React, { useState } from 'react';
import { Plus, Trash2, Receipt, AlertCircle, Check, UserCheck, Calendar, FileText } from 'lucide-react';
import type { PresupuestoItem, GastoDetalle, RegistrarGastoPayload } from '../types/budget.types';

interface BudgetExpensesTabProps {
  items: PresupuestoItem[];
  gastos: GastoDetalle[];
  canManageExpenses: boolean;
  modalidadEquipo?: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO' | string;
  directorNombre?: string;
  onRegisterGasto: (payload: RegistrarGastoPayload) => Promise<boolean>;
  onDeleteGasto: (gastoUuid: string) => Promise<boolean>;
  actionLoading?: boolean;
}

export const BudgetExpensesTab: React.FC<BudgetExpensesTabProps> = ({
  items,
  gastos,
  canManageExpenses,
  modalidadEquipo = 'INDIVIDUAL',
  directorNombre = '',
  onRegisterGasto,
  onDeleteGasto,
  actionLoading = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<number>(
    items.length > 0 ? (items[0].id_item ?? items[0].idItem ?? 0) : 0
  );
  const [monto, setMonto] = useState<number>(0);
  const [fechaGasto, setFechaGasto] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numeroFactura, setNumeroFactura] = useState<string>('');
  const [responsableNombre, setResponsableNombre] = useState<string>(directorNombre);
  const [descripcion, setDescripcion] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedItem = items.find(i => (i.id_item ?? i.idItem) === selectedItemId);
  const saldoDisponibleItem = selectedItem ? (selectedItem.saldo_disponible ?? selectedItem.saldoDisponible ?? 0) : 0;

  const openCreateModal = () => {
    const firstAvailableItem = items.find(i => (i.saldo_disponible ?? i.saldoDisponible ?? 0) > 0) || items[0];
    const firstId = firstAvailableItem ? (firstAvailableItem.id_item ?? firstAvailableItem.idItem ?? 0) : 0;
    setSelectedItemId(firstId);
    setMonto(0);
    setFechaGasto(new Date().toISOString().split('T')[0]);
    setNumeroFactura('');
    setResponsableNombre(directorNombre);
    setDescripcion('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleMontoChange = (val: number) => {
    setMonto(val);
    if (selectedItem && val > saldoDisponibleItem) {
      setFormError(`Atención: El monto ($${val.toFixed(2)}) supera el saldo disponible de la partida ($${saldoDisponibleItem.toFixed(2)}).`);
    } else {
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemId <= 0) {
      setFormError('Debe seleccionar una partida planificada.');
      return;
    }
    if (monto <= 0) {
      setFormError('El monto del egreso debe ser mayor a cero.');
      return;
    }
    if (!descripcion.trim()) {
      setFormError('La justificación o detalle del egreso es requerida.');
      return;
    }

    const payload: RegistrarGastoPayload = {
      id_item: selectedItemId,
      monto,
      fecha_gasto: fechaGasto,
      numero_factura: numeroFactura.trim() || undefined,
      responsable_nombre: responsableNombre.trim() || directorNombre,
      descripcion: descripcion.trim(),
      id_evidencia: null
    };

    const ok = await onRegisterGasto(payload);
    if (ok) {
      setIsModalOpen(false);
    }
  };

  const totalGastosMonto = gastos.reduce((acc, curr) => acc + (curr.monto || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Cabecera de la sección de egresos */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-main uppercase tracking-wider font-mono">
              Libro Diario de Egresos y Comprobantes
            </span>
            <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.2 !px-1.5 font-medium">
              {gastos.length} {gastos.length === 1 ? 'comprobante' : 'comprobantes'}
            </span>
          </div>
          <p className="text-[11px] text-text-dim">
            Registro de egresos devengados contra los recursos necesarios planificados (§4).
          </p>
        </div>

        {canManageExpenses && (
          <button
            type="button"
            onClick={openCreateModal}
            disabled={actionLoading || items.length === 0}
            className="btn-vercel-primary !h-8 !px-3 !text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            <span>Registrar Egreso</span>
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-text-dim flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <span>
            Para registrar egresos, primero debe planificar al menos un recurso necesario en la pestaña <strong>Recursos y Financiamiento</strong>.
          </span>
        </div>
      )}

      {/* Tabla de comprobantes y gastos */}
      <div className="border border-border-thin rounded-xl overflow-hidden bg-surface">
        {gastos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-hover/50 border-b border-border-thin text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Comprobante / N° Factura</th>
                  <th className="p-3">Recurso Asociado</th>
                  <th className="p-3">Responsable</th>
                  <th className="p-3 text-right">Monto Devengado</th>
                  {canManageExpenses && <th className="p-3 text-right w-16">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-thin/40 text-[11px]">
                {gastos.map((gasto) => {
                  const gastoUuid = gasto.uuid;
                  const fecha = gasto.fecha_gasto || gasto.fechaGasto || '-';
                  const factura = gasto.numero_factura || gasto.numeroFactura || 'S/N';
                  const partida = gasto.detalle_item || gasto.detalleItem || gasto.categoria_item || gasto.categoriaItem || 'Partida vinculada';
                  const resp = gasto.responsable_nombre || gasto.responsableNombre || '-';
                  const montoVal = gasto.monto || 0;

                  return (
                    <tr key={gastoUuid} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="p-3 font-mono text-text-dim whitespace-nowrap">
                        {fecha}
                      </td>
                      <td className="p-3 font-mono font-medium text-text-main">
                        <span className="bg-surface-hover/60 border border-border-thin rounded px-1.5 py-0.5 text-[10px]">
                          {factura}
                        </span>
                      </td>
                      <td className="p-3 text-text-main">
                        <div className="font-medium line-clamp-1">{partida}</div>
                        {gasto.descripcion && (
                          <div className="text-[10px] text-text-dim line-clamp-1">{gasto.descripcion}</div>
                        )}
                      </td>
                      <td className="p-3 text-text-dim">
                        <span className="text-[10px] font-medium">{resp}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-text-main whitespace-nowrap">
                        ${montoVal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {canManageExpenses && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteGasto(gastoUuid)}
                            className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors cursor-pointer"
                            title="Eliminar registro de gasto"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                <tr className="bg-surface-hover/40 border-t border-border-thin font-mono font-bold text-xs">
                  <td colSpan={canManageExpenses ? 4 : 4} className="p-3 text-right uppercase tracking-wider text-text-main">
                    Total Devengado / Ejecutado:
                  </td>
                  <td className="p-3 text-right text-text-main select-text text-sm">
                    ${totalGastosMonto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {canManageExpenses && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-text-dim text-xs">
            No se han registrado comprobantes de egreso en este proyecto.
          </div>
        )}
      </div>

      {/* ── MODAL: REGISTRAR EGRESO ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-thin pb-3">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-brand" />
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wide font-mono">
                  Registrar Comprobante de Egreso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-dim hover:text-text-main text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Recurso Necesario Planificado a Imputar
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(parseInt(e.target.value))}
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                >
                  {items.map((i) => {
                    const id = i.id_item ?? i.idItem ?? 0;
                    const saldo = i.saldo_disponible ?? i.saldoDisponible ?? 0;
                    return (
                      <option key={id} value={id}>
                        {i.detalle} (Saldo disp: ${saldo.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
                {selectedItem && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-text-dim font-mono">
                    <span>Partida: {selectedItem.categoria}</span>
                    <span>Saldo disponible: ${saldoDisponibleItem.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Monto del Gasto (USD)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(e) => handleMontoChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Fecha del Egreso
                  </label>
                  <input
                    type="date"
                    value={fechaGasto}
                    onChange={(e) => setFechaGasto(e.target.value)}
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    N° Factura / Comprobante
                  </label>
                  <input
                    type="text"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    placeholder="Ej: 001-002-000012345"
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                    Responsable del Gasto
                  </label>
                  <input
                    type="text"
                    value={responsableNombre}
                    onChange={(e) => setResponsableNombre(e.target.value)}
                    placeholder="Docente o Investigador"
                    className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">
                  Justificación / Detalle de la Compra
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalle los insumos adquiridos y su vinculación con los objetivos del proyecto..."
                  className="w-full bg-surface-hover border border-border-thin rounded-lg px-3 py-2 text-text-main text-xs focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-thin">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>Registrar Egreso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
