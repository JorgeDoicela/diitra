import api from '../../../api/axios_config';
import type {
  CronogramaResumen,
  ActividadCronogramaItem,
  ActualizarProgresoPayload,
  GuardarActividadPayload
} from '../types/schedule.types';

export const scheduleService = {
  async getCronograma(projectUuid: string): Promise<CronogramaResumen> {
    const response = await api.get(`/projects/${projectUuid}/cronograma`);
    return response.data;
  },

  async actualizarProgreso(
    projectUuid: string,
    actividadId: number,
    payload: ActualizarProgresoPayload
  ): Promise<ActividadCronogramaItem> {
    const response = await api.put(
      `/projects/${projectUuid}/cronograma/actividades/${actividadId}/progreso`,
      payload
    );
    return response.data;
  },

  async guardarActividad(
    projectUuid: string,
    payload: GuardarActividadPayload
  ): Promise<ActividadCronogramaItem> {
    const response = await api.post(
      `/projects/${projectUuid}/cronograma/actividades`,
      {
        idActividad: payload.id_actividad,
        idObjetivo: payload.id_objetivo,
        numeroActividad: payload.numero_actividad,
        descripcion: payload.descripcion,
        recursosNecesarios: payload.recursos_necesarios,
        responsable: payload.responsable,
        entregable: payload.entregable,
        fechaInicioPrevista: payload.fecha_inicio_prevista,
        fechaFinPrevista: payload.fecha_fin_prevista,
        progreso: payload.progreso,
        ponderacion: payload.ponderacion,
        esEntregableCaces: payload.es_entregable_caces,
        colorHex: payload.color_hex
      }
    );
    return response.data;
  },

  async eliminarActividad(projectUuid: string, actividadId: number): Promise<boolean> {
    const response = await api.delete(
      `/projects/${projectUuid}/cronograma/actividades/${actividadId}`
    );
    return response.data?.success ?? true;
  }
};
