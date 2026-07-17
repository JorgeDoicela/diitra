import api from '../api/axios_config';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface EventoCalendario {
    id_evento_calendario: string;
    uuid: string;
    titulo: string;
    descripcion: string;
    categoria_global: string;
    subcategoria: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    es_todo_el_dia: boolean;
    color_hex: string | null;
    url_accion: string | null;
    es_privado: boolean;
    prioridad: string;
    estado: string;
    creado_por: number | null;
    alerta_dias: number | null;
    recurrencia_anual: boolean;
    id_entidad_origen?: number | null;
    uuid_entidad_origen?: string | null;
    tipo_entidad_origen?: string | null;
    // Notas Rápidas — campos extendidos
    nota_detalle?: string | null;
    orden_bandeja?: number | null;
}

export interface EventoPayload {
    titulo: string;
    descripcion: string;
    tipo_evento: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    es_todo_el_dia: boolean;
    recurrencia_anual: boolean;
    recurrencia_hasta: null;
    roles_visibles: null;
    modulo_origen: string;
    url_accion: string | null;
    color_hex: string | null;
    alerta_dias: number | null;
    activo: boolean;
    es_privado: boolean;
    prioridad: string;
    estado: string;
    // Notas Rápidas — campos extendidos
    nota_detalle?: string | null;
    orden_bandeja?: number | null;
}

// ─────────────────────────────────────────────────────────────
//  API calls
// ─────────────────────────────────────────────────────────────

const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const getEventos = (date: Date): Promise<EventoCalendario[]> => {
    const desde = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const hasta = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    return api.get('/calendario/eventos', {
        params: { desde: formatLocalDate(desde), hasta: formatLocalDate(hasta) }
    }).then(r => r.data || []);
};

export const getStickyNotes = (): Promise<EventoCalendario[]> =>
    api.get('/calendario/usuario/notas').then(r => r.data || []);

export const createEvento = (payload: EventoPayload): Promise<EventoCalendario> =>
    api.post('/calendario/usuario/eventos', payload).then(r => r.data);

export const updateEvento = (uuid: string, payload: EventoPayload): Promise<EventoCalendario> =>
    api.put(`/calendario/usuario/eventos/${uuid}`, payload).then(r => r.data);

export const deleteEvento = (uuid: string): Promise<void> =>
    api.delete(`/calendario/usuario/eventos/${uuid}`).then(() => undefined);

export const devolverAInbox = (uuid: string): Promise<void> =>
    api.patch(`/calendario/usuario/eventos/${uuid}/inbox`).then(() => undefined);

export const reordenarBandeja = (items: { uuid: string; orden: number }[]): Promise<void> =>
    api.patch('/calendario/usuario/notas/reordenar', items).then(() => undefined);

export const getIcalToken = (): Promise<{ feed_url: string }> =>
    api.post('/calendario/ical/token').then(r => r.data);

// ─────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────

export const CATEGORIAS_CONFIG: Record<string, { label: string; color: string }> = {
    Normativo:   { label: 'CACES / Normativa',   color: '#1E3A8A' },
    Convocatoria:{ label: 'Convocatorias',        color: '#3B82F6' },
    Proyecto:    { label: 'Proyectos',            color: '#10B981' },
    Monitoreo:   { label: 'Monitoreo (Informes)', color: '#8B5CF6' },
    PeerReview:  { label: 'Evaluaciones',         color: '#EC4899' },
    Personal:    { label: 'Mis Tareas / Agenda',  color: '#F59E0B' },
};

export const PRIORIDAD_COLORS: Record<string, { bg: string; text: string }> = {
    Alta:  { bg: 'var(--error-subtle)',   text: 'var(--error)' },
    Media: { bg: 'var(--warning-subtle)', text: 'var(--warning)' },
    Baja:  { bg: 'var(--success-subtle)', text: 'var(--success)' },
};

export const ESTADO_LABELS: Record<string, string> = {
    Pendiente:  'Pendiente',
    EnProgreso: 'En Progreso',
    Completado: 'Completado',
    Cancelado:  'Cancelado',
};

export const COLORES_OPCIONES = [
    { value: '#F59E0B', label: 'Naranja (Personal)' },
    { value: '#3B82F6', label: 'Azul (Reuniones)' },
    { value: '#10B981', label: 'Verde (Hitos)' },
    { value: '#EC4899', label: 'Rosado (Revisiones)' },
    { value: '#8B5CF6', label: 'Morado (Monitoreo)' },
    { value: '#EF4444', label: 'Rojo (Urgente)' },
];

/** Construye el payload para crear/editar un evento personal */
export const buildPayload = (fields: {
    titulo: string;
    descripcion: string;
    tipo: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    esTodoElDia: boolean;
    colorHex: string;
    esPrivado: boolean;
    prioridad: string;
    estado: string;
    alertaDias: number | '';
    recurrenciaAnual: boolean;
    urlAccion?: string | null;
    notaDetalle?: string | null;
    ordenBandeja?: number | null;
}): EventoPayload => ({
    titulo: fields.titulo,
    descripcion: fields.descripcion,
    tipo_evento: fields.tipo,
    fecha_inicio: fields.fechaInicio,
    fecha_fin: fields.fechaFin || null,
    es_todo_el_dia: fields.esTodoElDia,
    recurrencia_anual: fields.recurrenciaAnual,
    recurrencia_hasta: null,
    roles_visibles: null,
    modulo_origen: 'PERSONAL',
    url_accion: fields.urlAccion ?? null,
    color_hex: fields.colorHex,
    alerta_dias: fields.alertaDias !== '' ? Number(fields.alertaDias) : null,
    activo: true,
    es_privado: fields.esPrivado,
    prioridad: fields.prioridad,
    estado: fields.estado,
    nota_detalle: fields.notaDetalle ?? null,
    orden_bandeja: fields.ordenBandeja ?? null,
});

export const EVENTO_CONTEXTO_HELP: Record<string, string> = {
    PROYECTO: 'Este hito está vinculado al módulo de Proyectos de Investigación. Representa una fecha oficial establecida en el cronograma aprobado para la ejecución del proyecto.',
    CONVOCATORIA: 'Este evento corresponde a un hito oficial del cronograma de Convocatorias. Es clave para el control de los plazos de postulación y revisión de propuestas.',
    INFORME_AVANCE: 'Este plazo representa una fecha límite de entrega para un Informe de Avance. Es obligatorio cargar la documentación firmada digitalmente junto con las evidencias correspondientes antes de esta fecha.',
    PEER_REVIEW: 'Fecha límite asignada para que los revisores pares registren su evaluación técnica (cuantitativa y cualitativa) sobre el proyecto de investigación.',
};

/** Retorna la explicación conceptual del origen de un hito */
export const getContextDescription = (ev: EventoCalendario): string | null => {
    if (ev.tipo_entidad_origen === 'CALENDARIO_NORMATIVO') {
        return ev.categoria_global === 'Normativo'
            ? 'Hito o plazo normativo de carácter institucional o externo (ej. CACES, autoevaluaciones, etc.). Su cumplimiento es auditado.'
            : 'Tarea o evento personal programado en la agenda del usuario.';
    }
    return EVENTO_CONTEXTO_HELP[ev.tipo_entidad_origen || ''] || null;
};

