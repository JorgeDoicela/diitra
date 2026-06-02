import api from '../api/axios_config';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface EvidenciaDto {
    id_evidencia: number;
    uuid: string;
    descripcion?: string;
    ruta_archivo: string;
    tipo_evidencia?: string;
    fecha_registro: string;
}

export interface InformeAvanceDto {
    id_informe: number;
    uuid: string;
    id_proyecto: number;
    proyecto_titulo?: string;
    codigo_institucional?: string;
    numero_informe: number;
    fecha_reporte: string;
    resumen_actividades: string;
    es_firmado_digital: boolean;
    hash_firma?: string;
    fecha_firma?: string;
    validado_por?: number;
    validado_por_nombre?: string;
    /** 'Pendiente' | 'Aprobado' | 'Observado' */
    estado: string;
    evidencias: EvidenciaDto[];
}

export interface CreateInformeAvanceDto {
    id_proyecto: number;
    project_uuid?: string;   // el backend resuelve el id numérico si id_proyecto es 0
    fecha_reporte: string;   // 'YYYY-MM-DD'
    resumen_actividades: string;
}

export interface ObservarInformeDto {
    observacion: string;
}

// ─────────────────────────────────────────────────────────────
//  API calls
// ─────────────────────────────────────────────────────────────

export const getInformeById = (id: number): Promise<InformeAvanceDto> =>
    api.get(`/informes-avance/${id}`).then(r => r.data);

export const getInformesByProyecto = (projectUuid: string): Promise<InformeAvanceDto[]> =>
    api.get(`/informes-avance/proyecto/uuid/${projectUuid}`).then(r => r.data);

export const createInforme = (dto: CreateInformeAvanceDto): Promise<InformeAvanceDto> =>
    api.post('/informes-avance', dto).then(r => r.data);

export const aprobarInforme = (id: number): Promise<InformeAvanceDto> =>
    api.post(`/informes-avance/${id}/aprobar`).then(r => r.data);

export const observarInforme = (id: number, observacion: string): Promise<InformeAvanceDto> =>
    api.post(`/informes-avance/${id}/observar`, { observacion }).then(r => r.data);

export const firmarInforme = (
    id: number,
    certificadoBase64: string,
    passwordCertificado: string
): Promise<{ success: boolean; message: string }> =>
    api.post(`/informes-avance/${id}/firmar`, { certificadoBase64, passwordCertificado }).then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────

export const ESTADO_INFORME_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    Pendiente: { label: 'Pendiente',  badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    Aprobado:  { label: 'Aprobado',   badge: 'badge-vercel-success', dot: 'dot-success' },
    Observado: { label: 'Observado',  badge: 'badge-vercel-error',   dot: 'dot-error' },
};
