import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../../../api/NotificationsContext';
import { scheduleService } from '../services/scheduleService';
import type {
  CronogramaResumen,
  ActualizarProgresoPayload,
  GuardarActividadPayload
} from '../types/schedule.types';

export const useProjectSchedule = (projectUuid: string | undefined) => {
  const { addToast } = useNotifications();
  const [cronograma, setCronograma] = useState<CronogramaResumen | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCronograma = useCallback(async () => {
    if (!projectUuid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getCronograma(projectUuid);
      setCronograma(data);
    } catch (err: any) {
      console.error('[useProjectSchedule] Error fetching schedule:', err);
      setError(err?.response?.data?.message || 'Error al cargar el cronograma del proyecto.');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    fetchCronograma();
  }, [fetchCronograma]);

  const handleActualizarProgreso = async (
    actividadId: number,
    payload: ActualizarProgresoPayload
  ): Promise<boolean> => {
    if (!projectUuid) return false;
    setActionLoading(true);
    try {
      await scheduleService.actualizarProgreso(projectUuid, actividadId, payload);
      addToast('Progreso Actualizado', `Se actualizó el avance de la actividad al ${payload.progreso}%.`, 'success');
      await fetchCronograma();
      return true;
    } catch (err: any) {
      console.error('[useProjectSchedule] Error updating progress:', err);
      addToast('Error', err?.response?.data?.message || 'No se pudo actualizar el progreso.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuardarActividad = async (
    payload: GuardarActividadPayload
  ): Promise<boolean> => {
    if (!projectUuid) return false;
    setActionLoading(true);
    try {
      await scheduleService.guardarActividad(projectUuid, payload);
      addToast('Actividad Guardada', 'La actividad fue registrada exitosamente en el cronograma.', 'success');
      await fetchCronograma();
      return true;
    } catch (err: any) {
      console.error('[useProjectSchedule] Error saving activity:', err);
      addToast('Error', err?.response?.data?.message || 'No se pudo guardar la actividad.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminarActividad = async (actividadId: number): Promise<boolean> => {
    if (!projectUuid) return false;
    setActionLoading(true);
    try {
      await scheduleService.eliminarActividad(projectUuid, actividadId);
      addToast('Actividad Eliminada', 'La actividad fue removida del cronograma.', 'info');
      await fetchCronograma();
      return true;
    } catch (err: any) {
      console.error('[useProjectSchedule] Error deleting activity:', err);
      addToast('Error', err?.response?.data?.message || 'No se pudo eliminar la actividad.', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    cronograma,
    loading,
    actionLoading,
    error,
    fetchCronograma,
    handleActualizarProgreso,
    handleGuardarActividad,
    handleEliminarActividad
  };
};
