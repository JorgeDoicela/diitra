import api from '../api/axios_config';

export interface SupportConfig {
    whats_app_number?: string;
    whatsAppNumber?: string;
    max_image_size_bytes?: number;
    maxImageSizeBytes?: number;
    max_video_size_bytes?: number;
    maxVideoSizeBytes?: number;
}

export interface FeedbackAdjunto {
    nombre_original?: string;
    nombreOriginal?: string;
    url: string;
    tipo_mime?: string;
    tipoMime?: string;
    tamano_bytes?: number;
    tamanoBytes?: number;
}

export interface FeedbackMensaje {
    id?: string;
    id_usuario?: number;
    idUsuario?: number;
    es_admin?: boolean;
    esAdmin?: boolean;
    nombre_autor?: string;
    nombreAutor?: string;
    rol_autor?: string;
    rolAutor?: string;
    mensaje: string;
    fecha?: string;
}

export interface FeedbackReporte {
    id_feedback?: number;
    idFeedback?: number;
    uuid: string;
    id_usuario?: number;
    idUsuario?: number;
    cedula?: string;
    nombre_usuario?: string;
    nombreUsuario?: string;
    rol_usuario?: string;
    rolUsuario?: string;
    tipo: 'SUGERENCIA' | 'ERROR' | 'DUDA' | string;
    titulo: string;
    descripcion: string;
    ruta_origen?: string;
    rutaOrigen?: string;
    metadata_navegador?: string;
    metadataNavegador?: string;
    archivos?: FeedbackAdjunto[];
    conversacion?: FeedbackMensaje[];
    estado: 'PENDIENTE' | 'EN_REVISION' | 'ATENDIDO' | 'DESCARTADO' | string;
    observacion_admin?: string;
    observacionAdmin?: string;
    fecha_creacion?: string;
    fechaCreacion?: string;
    fecha_actualizacion?: string;
    fechaActualizacion?: string;
}

export const getSupportConfig = async (): Promise<SupportConfig> => {
    try {
        const response = await api.get('/feedback/config');
        return response.data;
    } catch {
        return {
            whatsAppNumber: '593969677280',
            maxImageSizeBytes: 5 * 1024 * 1024,
            maxVideoSizeBytes: 15 * 1024 * 1024
        };
    }
};

export const sendFeedback = async (formData: FormData): Promise<FeedbackReporte> => {
    const response = await api.post('/feedback', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getAllFeedback = async (tipo?: string, estado?: string): Promise<FeedbackReporte[]> => {
    const params: Record<string, string> = {};
    if (tipo && tipo !== 'TODOS') params.tipo = tipo;
    if (estado && estado !== 'TODOS') params.estado = estado;

    const response = await api.get('/feedback', { params });
    return response.data;
};

export const getMyFeedback = async (): Promise<FeedbackReporte[]> => {
    const response = await api.get('/feedback/my');
    return response.data;
};

export const updateFeedbackStatus = async (
    idFeedback: number,
    estado: string,
    observacionAdmin?: string
): Promise<FeedbackReporte> => {
    const response = await api.patch(`/feedback/${idFeedback}/status`, {
        estado,
        observacion_admin: observacionAdmin
    });
    return response.data;
};

export const updateUserFeedback = async (
    idFeedback: number,
    data: { tipo?: string; titulo: string; descripcion: string }
): Promise<FeedbackReporte> => {
    const response = await api.put(`/feedback/${idFeedback}`, data);
    return response.data;
};

export const deleteFeedback = async (idFeedback: number): Promise<{ message: string }> => {
    const response = await api.delete(`/feedback/${idFeedback}`);
    return response.data;
};

export const sendFeedbackMessage = async (
    idFeedback: number,
    mensaje: string
): Promise<FeedbackReporte> => {
    const response = await api.post(`/feedback/${idFeedback}/messages`, {
        mensaje
    });
    return response.data;
};

/**
 * Resuelve la URL correcta para previsualizar capturas o videos adjuntos en el navegador.
 */
export const getFeedbackMediaUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    if (url.startsWith('/uploads/feedback/')) {
        return url.replace('/uploads/feedback/', '/api/feedback/attachments/');
    }
    return url;
};
