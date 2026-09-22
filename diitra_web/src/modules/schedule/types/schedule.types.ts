export type SemaforoPlazoType = 'VERDE' | 'AMARILLO' | 'ROJO';
export type EstadoActividadType = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'ATRASADA';

export interface ActividadCronogramaItem {
  id_actividad?: number;
  idActividad?: number;
  uuid: string;
  id_proyecto?: number;
  idProyecto?: number;
  id_objetivo?: number;
  idObjetivo?: number;
  objetivo_descripcion?: string | null;
  objetivoDescripcion?: string | null;
  numero_actividad: number;
  numeroActividad?: number;
  descripcion: string;
  recursos_necesarios?: string | null;
  recursosNecesarios?: string | null;
  responsable?: string | null;
  entregable?: string | null;
  fecha_inicio_prevista?: string | null;
  fechaInicioPrevista?: string | null;
  fecha_fin_prevista?: string | null;
  fechaFinPrevista?: string | null;
  progreso: number; // 0 - 100
  ponderacion: number;
  es_entregable_caces: boolean;
  esEntregableCaces?: boolean;
  color_hex?: string;
  colorHex?: string;
  estado: EstadoActividadType;
  semanas?: boolean[];
}

export interface CronogramaResumen {
  total_actividades: number;
  totalActividades?: number;
  actividades_completadas: number;
  actividadesCompletadas?: number;
  actividades_en_curso: number;
  actividadesEnCurso?: number;
  actividades_atrasadas: number;
  actividadesAtrasadas?: number;
  porcentaje_avance_global: number;
  porcentajeAvanceGlobal?: number;
  semaforo_plazos: SemaforoPlazoType;
  semaforoPlazos?: SemaforoPlazoType;
  hitos_caces_totales: number;
  hitosCacesTotales?: number;
  hitos_caces_cumplidos: number;
  hitosCacesCumplidos?: number;
  puede_editar: boolean;
  puedeEditar?: boolean;
  estado_proyecto: string;
  estadoProyecto?: string;
  actividades: ActividadCronogramaItem[];
}

export interface ActualizarProgresoPayload {
  progreso: number;
  entregable?: string;
  observaciones?: string;
}

export interface GuardarActividadPayload {
  id_actividad?: number;
  id_objetivo?: number;
  numero_actividad?: number;
  descripcion: string;
  recursos_necesarios?: string;
  responsable?: string;
  entregable?: string;
  fecha_inicio_prevista?: string;
  fecha_fin_prevista?: string;
  progreso?: number;
  ponderacion?: number;
  es_entregable_caces: boolean;
  color_hex?: string;
}
