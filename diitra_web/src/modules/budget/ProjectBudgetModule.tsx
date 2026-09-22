import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  Coins,
  Layers,
  Users,
  User,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { useProjectBudget } from './hooks/useProjectBudget';
import { BudgetResourcesTab } from './components/BudgetResourcesTab';
import { BudgetExpensesTab } from './components/BudgetExpensesTab';
import { BudgetReportModal } from './components/BudgetReportModal';

export interface ProjectBudgetModuleProps {
  projectUuid: string;
  modalidad?: 'INVESTIGACION' | 'INNOVACION' | string;
  modalidadEquipo?: 'INDIVIDUAL' | 'EQUIPO' | 'GRUPO' | string;
  grupoInvestigacion?: string | null;
  directorNombre?: string;
  defaultTab?: 'recursos' | 'egresos';
  className?: string;
}

export const ProjectBudgetModule: React.FC<ProjectBudgetModuleProps> = ({
  projectUuid,
  modalidad = 'INVESTIGACION',
  modalidadEquipo = 'INDIVIDUAL',
  grupoInvestigacion = null,
  directorNombre = '',
  defaultTab = 'recursos',
  className = ''
}) => {
  const {
    resumen,
    loading,
    actionLoading,
    error,
    clearError,
    fetchPresupuesto,
    guardarItem,
    eliminarItem,
    registrarGasto,
    eliminarGasto,
    guardarFinanciamiento,
    eliminarFinanciamiento
  } = useProjectBudget(projectUuid);

  const [activeTab, setActiveTab] = useState<'recursos' | 'egresos'>(defaultTab);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isInnovacion = modalidad === 'INNOVACION';

  if (loading && !resumen) {
    return (
      <div className={`bento-card static p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <RefreshCw size={18} className="animate-spin text-brand mb-2" />
        <span className="text-xs text-text-dim font-mono">Cargando presupuesto y recursos...</span>
      </div>
    );
  }

  const items = resumen?.items || [];
  const gastos = resumen?.gastos || [];
  const financiamientos = resumen?.financiamientos || [];
  const canEditPlan = resumen?.puede_editar_planificacion ?? resumen?.puedeEditarPlanificacion ?? true;
  const canManageGastos = resumen?.puede_registrar_gastos ?? resumen?.puedeRegistrarGastos ?? true;
  const planificado = resumen?.presupuesto_total_planificado ?? resumen?.presupuestoTotalPlanificado ?? 0;
  const ejecutado = resumen?.presupuesto_total_ejecutado ?? resumen?.presupuestoTotalEjecutado ?? 0;
  const saldo = resumen?.saldo_disponible ?? resumen?.saldoDisponible ?? 0;
  const porcentaje = resumen?.porcentaje_ejecucion ?? resumen?.porcentajeEjecucion ?? 0;

  return (
    <div className={`bento-card static p-6 flex flex-col justify-between group ${className}`}>
      {/* ── Cabecera Oficial DIITRA ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2.5">
            <DollarSign size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
            <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
              Recursos, Costo y Ejecución Presupuestaria
            </h3>
            <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.5 !px-2 font-medium">
              Sección 4 Oficial
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-vercel badge-vercel-brand !text-[9px] !py-0.5 !px-2 font-medium">
              {isInnovacion ? 'Proyecto de Innovación' : 'Proyecto de Investigación'}
            </span>
            <span className="badge-vercel badge-vercel-neutral !text-[9px] !py-0.5 !px-2 font-medium flex items-center gap-1">
              {modalidadEquipo === 'INDIVIDUAL' && <User size={10} />}
              {modalidadEquipo === 'EQUIPO' && <Users size={10} />}
              {modalidadEquipo === 'GRUPO' && <Layers size={10} />}
              <span>{modalidadEquipo}</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-text-dim font-normal leading-relaxed">
          {isInnovacion
            ? 'Planificación de recursos y monitoreo de adquisiciones para el proyecto de innovación y transferencia tecnológica.'
            : 'Planificación de recursos necesarios, fuentes de financiamiento y monitoreo de compras institucionales.'}
        </p>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ── Resumen Institucional de Alta Densidad (Cumpliendo styles-diitra 1.1) ── */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border-thin bg-surface-hover/30">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block font-mono">
            Planificado (§4)
          </span>
          <span className="text-sm font-mono font-bold text-text-main select-text">
            ${planificado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block font-mono">
            Devengado
          </span>
          <span className="text-sm font-mono font-bold text-text-main select-text">
            ${ejecutado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block font-mono">
            Saldo Disponible
          </span>
          <span className={`text-sm font-mono font-bold select-text ${saldo < 0 ? 'text-error' : 'text-emerald-500'}`}>
            ${saldo.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block font-mono">
            Ejecución
          </span>
          <span className="text-sm font-mono font-bold text-text-main select-text">
            {porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* ── Selector de Pestañas Sobrio y Acciones ── */}
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex bg-surface-hover/80 p-1 rounded-lg border border-border-thin gap-1 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTab('recursos')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-md text-[11px] font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'recursos'
                  ? 'bg-bg-deep text-text-main shadow-xs border border-border-thin font-bold'
                  : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Coins size={13} className={activeTab === 'recursos' ? 'text-brand' : 'opacity-70'} />
              <span>Recursos y Financiamiento (§4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('egresos')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-md text-[11px] font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'egresos'
                  ? 'bg-bg-deep text-text-main shadow-xs border border-border-thin font-bold'
                  : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <Receipt size={13} className={activeTab === 'egresos' ? 'text-brand' : 'opacity-70'} />
              <span>Monitoreo de Egresos ({gastos.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="btn-vercel-secondary !h-8 !px-3 !text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Previsualizar y copiar balance financiero formateado para el Informe Final o Informe de Avance"
          >
            <Coins size={13} className="text-brand" />
            <span>Balance para Informes</span>
          </button>
        </div>

        {/* ── Contenido de la Pestaña Activa ── */}
        <div>
          {activeTab === 'recursos' ? (
            <BudgetResourcesTab
              items={items}
              financiamientos={financiamientos}
              presupuestoTotalPlanificado={planificado}
              canEdit={canEditPlan}
              modalidad={modalidad}
              onSaveItem={guardarItem}
              onDeleteItem={eliminarItem}
              onSaveFinanciamiento={guardarFinanciamiento}
              onDeleteFinanciamiento={eliminarFinanciamiento}
              actionLoading={actionLoading}
            />
          ) : (
            <BudgetExpensesTab
              items={items}
              gastos={gastos}
              canManageExpenses={canManageGastos}
              modalidadEquipo={modalidadEquipo}
              directorNombre={directorNombre}
              onRegisterGasto={registrarGasto}
              onDeleteGasto={eliminarGasto}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </div>

      {/* ── Modal de Balance para Informes ── */}
      {isReportModalOpen && resumen && (
        <BudgetReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          resumen={resumen}
          projectTitle={directorNombre ? `Director/a: ${directorNombre}` : ''}
        />
      )}
    </div>
  );
};
export default ProjectBudgetModule;
