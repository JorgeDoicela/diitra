/**
 * peerReviewService.ts
 * Capa de servicio centralizada para el módulo de Arbitraje y Evaluación por Pares.
 * Separa la lógica de API de los componentes React.
 */
import api from '../api/axios_config';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface PeerReviewDto {
    uuid: string;
    id_proyecto: number;
    proyecto_uuid: string;
    proyecto_titulo: string;
    id_revisor: number;
    revisor_nombre: string;
    revisor_especialidad?: string;
    revisor_grado?: string;
    fecha_asignacion: string;
    fecha_limite: string;
    estado: 'Pendiente' | 'Completada' | 'Rechazada' | 'Expirada';
    es_externo: boolean;
    es_doble_ciego: boolean;
    puntaje_total?: number;
    observaciones_gral?: string;
    dictamen_revisor?: 'Pendiente' | 'Aprueba' | 'Rechaza';
}

export interface ArbitrajeProyectoDto {
    proyecto_uuid: string;
    id_proyecto: number;
    proyecto_titulo: string;
    codigo_institucional?: string;
    estado_proyecto: string;
    convocatoria?: string;
    total_arbitros: number;
    arbitros_completados: number;
    puntaje_promedio?: number;
    estado_arbitraje: 'Pendiente' | 'EnProceso' | 'Completado' | 'Desempate' | 'SinArbitros';
    revisiones: PeerReviewDto[];
}

export interface ArbitrajeStatsDto {
    proyectos_en_revision: number;
    total_arbitros_asignados: number;
    evaluaciones_completadas: number;
    evaluaciones_pendientes: number;
    casos_desempate: number;
    porcentaje_avance: number;
}

export interface CriterioRubricaDto {
    id_criterio: number;
    nombre: string;
    descripcion?: string;
    peso_porcentaje: number;
    orden: number;
    puntaje_maximo: number;
    
    // Propiedades adicionales para revisiones completadas
    puntajeObtenido?: number;
    puntaje_obtenido?: number;
    observacionesCriterio?: string;
    observaciones_criterio?: string;
}

export interface RubricaDinamicaDto {
    id_rubrica: number;
    nombre_rubrica: string;
    proyecto_titulo: string;
    linea_investigacion?: string;
    justificacion?: string;
    metodologia?: string;
    antecedentes?: string;
    descripcionProyecto?: string;
    descripcion_proyecto?: string;
    objetivoGeneral?: string;
    objetivo_general?: string;
    objetivosEspecificos?: string;
    objetivos_especificos?: string;
    marcoTeorico?: string;
    marco_teorico?: string;
    evaluacion?: string;
    bibliografia?: string;
    proyecto_uuid: string;
    es_doble_ciego: boolean;
    puntaje_minimo_aprobacion: number;
    criterios: CriterioRubricaDto[];
    
    // Propiedades adicionales para revisiones completadas
    observacionesGral?: string;
    observaciones_gral?: string;
    estadoRevision?: string;
    estado_revision?: string;
    puntajeTotal?: number;
    puntaje_total?: number;
}

export interface RevisorDisponibleDto {
    id_usuario: number;
    nombre_completo: string;
    email?: string;
    especialidad?: string;
    grado_academico_maximo?: string;
    orcid_id?: string;
    institucion?: string;
    es_externo: boolean;
    revisiones_activas: number;
}

export interface AsignarArbitroPayload {
    project_uuid: string;
    id_revisor: number;
    fecha_limite: string; // ISO string
    es_externo: boolean;
    es_doble_ciego: boolean;
    observaciones?: string;
}

export interface EvaluationDetailPayload {
    id_criterio?: number;
    criterio: string;
    puntaje: number;
    observaciones?: string;
}

export interface EvaluationPayload {
    revision_uuid: string;
    detalles: EvaluationDetailPayload[];
    observaciones_gral?: string;
}

export interface DictamenDto {
    proyecto_uuid: string;
    proyecto_titulo: string;
    codigo_institucional?: string;
    puntaje_promedio: number;
    puntaje_minimo_aprobacion: number;
    resultado: 'Aprobado' | 'Rechazado' | 'Desempate';
    estado_anterior: string;
    estado_nuevo: string;
    evaluaciones: PeerReviewDto[];
    fecha_cierre: string;
    mensaje_desempate?: string;
}

// ─────────────────────────────────────────────────────────────
//  API Calls — Vista del Revisor
// ─────────────────────────────────────────────────────────────

export const getPendingReviews = (): Promise<PeerReviewDto[]> =>
    api.get('/PeerReviews/pending').then(r => r.data);

export const getRubricaForRevision = (revisionUuid: string): Promise<RubricaDinamicaDto> =>
    api.get(`/PeerReviews/${revisionUuid}/rubrica`).then(r => r.data);

export const submitEvaluation = (payload: EvaluationPayload): Promise<{ message: string }> =>
    api.post('/PeerReviews/evaluate', payload).then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  API Calls — Vista del Director / Arbitraje
// ─────────────────────────────────────────────────────────────

export const getArbitrajesActivos = (): Promise<ArbitrajeProyectoDto[]> =>
    api.get('/PeerReviews/arbitraje').then(r => r.data);

export const getArbitrajeStats = (): Promise<ArbitrajeStatsDto> =>
    api.get('/PeerReviews/arbitraje/stats').then(r => r.data);

export const getArbitrajeByProject = (projectUuid: string): Promise<ArbitrajeProyectoDto> =>
    api.get(`/PeerReviews/project/${projectUuid}`).then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  API Calls — Gestión de Árbitros
// ─────────────────────────────────────────────────────────────

export const searchRevisores = (
    query: string,
    soloExternos = false,
    projectUuid?: string
): Promise<RevisorDisponibleDto[]> =>
    api.get('/PeerReviews/revisores/search', {
        params: { q: query, soloExternos, projectUuid }
    }).then(r => r.data);

export const asignarArbitro = (payload: AsignarArbitroPayload): Promise<{ uuid: string; message: string }> =>
    api.post('/PeerReviews/assign', payload).then(r => r.data);

export const revocarAsignacion = (revisionUuid: string): Promise<{ message: string }> =>
    api.delete(`/PeerReviews/${revisionUuid}/revocar`).then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  API Calls — Cierre de Arbitraje
// ─────────────────────────────────────────────────────────────

export const cerrarArbitraje = (projectUuid: string): Promise<DictamenDto> =>
    api.post(`/PeerReviews/project/${projectUuid}/cerrar`).then(r => r.data);

/** Descarga el Acta de Dictamen de Arbitraje como blob PDF. */
export const downloadDictamenPdf = async (projectUuid: string): Promise<Blob> => {
    const response = await api.get(`/PeerReviews/project/${projectUuid}/dictamen-pdf`, {
        responseType: 'blob',
    });
    return response.data as Blob;
};

// ─────────────────────────────────────────────────────────────
//  API Calls — Revisores Externos
// ─────────────────────────────────────────────────────────────

export interface RegistrarRevisorExternoPayload {
    cedula?: string;
    nombres: string;
    apellidos: string;
    email: string;
    institucion: string;
    grado_academico?: string;
    orcid_id?: string;
    especialidad?: string;
}

export const registerRevisorExterno = (
    payload: RegistrarRevisorExternoPayload
): Promise<{ uuid: string; message: string }> =>
    api.post('/PeerReviews/revisores/externos', payload).then(r => r.data);

export const getRevisoresExternos = (): Promise<RevisorDisponibleDto[]> =>
    api.get('/PeerReviews/revisores/externos').then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────

export const ESTADO_REVISION_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    'Pendiente':  { label: 'Pendiente',  badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Completada': { label: 'Completada', badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazada':  { label: 'Rechazada',  badge: 'badge-vercel-error',   dot: 'dot-error' },
    'Expirada':   { label: 'Expirada',   badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
};

export const ESTADO_ARBITRAJE_CONFIG: Record<string, { label: string; badge: string; dot: string; color: string }> = {
    'SinArbitros': { label: 'Sin Árbitros', badge: 'badge-vercel-neutral', dot: 'dot-neutral', color: '#888' },
    'Pendiente':   { label: 'Pendiente',    badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse', color: '#f0a500' },
    'EnProceso':   { label: 'En Proceso',   badge: 'badge-vercel-info',    dot: 'dot-info dot-pulse', color: '#3b82f6' },
    'Completado':  { label: 'Completado',   badge: 'badge-vercel-success', dot: 'dot-success', color: '#22c55e' },
    'Desempate':   { label: 'Desempate',    badge: 'badge-vercel-error',   dot: 'dot-error dot-pulse', color: '#ef4444' },
};

export const DICTAMEN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'Aprobado':  { label: '✓ APROBADO',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    'Rechazado': { label: '✗ RECHAZADO', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    'Desempate': { label: '⚖ DESEMPATE', color: '#f0a500', bg: 'rgba(240,165,0,0.1)' },
};

/** Config de dictamen individual del árbitro */
export const DICTAMEN_REVISOR_CONFIG: Record<string, { label: string; badge: string }> = {
    'Aprueba':   { label: '✓ Aprueba',   badge: 'badge-vercel-success' },
    'Rechaza':   { label: '✗ Rechaza',   badge: 'badge-vercel-error' },
    'Pendiente': { label: '– Pendiente', badge: 'badge-vercel-warning' },
};

export const getDictamenPreview = (puntaje: number, minimo: number): 'Aprobado' | 'Rechazado' =>
    puntaje >= minimo ? 'Aprobado' : 'Rechazado';
