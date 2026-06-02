export interface EmailTemplate {
    idEmailTemplate: number;
    uuid: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    asunto: string;
    cuerpoHtml: string;
    activo: boolean;
    fechaCreado?: string;
    fechaActualizado?: string;
}

export interface EmailHistorial {
    idEmailHistorial: number;
    uuid: string;
    destinatario: string;
    idUsuarioDestinatario?: number;
    nombreDestinatario?: string;
    asunto: string;
    cuerpo: string;
    estado: string;
    errorMensaje?: string;
    fechaEnvio: string;
    adjuntosJson?: string;
    metadataJson?: string;
}

export interface Carrera {
    idCarrera: number;
    carrera1: string;
    aliasCarrera?: string;
}

export interface Proyecto {
    id_proyecto: number;
    uuid: string;
    titulo: string;
    codigo_institucional?: string;
    linea_investigacion?: string;
    descripcion?: string;
    estado?: string;
}

export interface Convocatoria {
    uuid: string;
    titulo: string;
    codigoConvocatoria: string;
    anio: number;
    presupuestoTotal?: number;
    montoMaximoProyecto?: number;
    fechaApertura?: string;
    fechaCierre?: string;
    urlBases?: string;
    estado: string;
}

export interface PeerReview {
    uuid: string;
    proyectoTitulo: string;
    revisorNombre: string;
    revisorEmail?: string;
    estado: string;
    dictamenRevisor: string;
    fechaLimite?: string;
    puntajeTotal?: number;
    observacionesGral?: string;
    esExterno?: boolean;
    esDobleCiego?: boolean;
}

export interface AttachmentFile {
    name: string;
    size: number;
    type: string;
    base64: string;
}
