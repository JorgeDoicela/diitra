import { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/budgetService';
import type {
  PresupuestoResumen,
  GuardarItemPayload,
  RegistrarGastoPayload,
  GuardarFinanciamientoPayload
} from '../types/budget.types';

export function useProjectBudget(projectUuid: string | undefined) {
  const [resumen, setResumen] = useState<PresupuestoResumen | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuesto = useCallback(async () => {
    if (!projectUuid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getPresupuesto(projectUuid);
      setResumen(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar el presupuesto del proyecto.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    fetchPresupuesto();
  }, [fetchPresupuesto]);

  const guardarItem = async (payload: GuardarItemPayload): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.guardarItem(projectUuid, payload);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar la partida presupuestaria.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const eliminarItem = async (itemId: number): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.eliminarItem(projectUuid, itemId);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al eliminar la partida presupuestaria.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const registrarGasto = async (payload: RegistrarGastoPayload): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.registrarGasto(projectUuid, payload);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrar el egreso o comprobante.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const eliminarGasto = async (gastoUuid: string): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.eliminarGasto(projectUuid, gastoUuid);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al anular el gasto.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const guardarFinanciamiento = async (payload: GuardarFinanciamientoPayload): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.guardarFinanciamiento(projectUuid, payload);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrar la fuente de financiamiento.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const eliminarFinanciamiento = async (financiamientoId: number): Promise<boolean> => {
    if (!projectUuid) return false;
    try {
      setActionLoading(true);
      setError(null);
      await budgetService.eliminarFinanciamiento(projectUuid, financiamientoId);
      await fetchPresupuesto();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al eliminar la fuente de financiamiento.';
      setError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    resumen,
    loading,
    actionLoading,
    error,
    clearError: () => setError(null),
    fetchPresupuesto,
    guardarItem,
    eliminarItem,
    registrarGasto,
    eliminarGasto,
    guardarFinanciamiento,
    eliminarFinanciamiento
  };
}
