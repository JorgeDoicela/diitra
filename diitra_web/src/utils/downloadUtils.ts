import api from '../api/axios_config';

/**
 * Descarga un Blob o DataURL en el navegador de forma segura,
 * sanitizando el nombre de archivo y limpiando la memoria del DOM.
 */
export const downloadBlob = (blob: Blob | string, filename: string): void => {
    // Sanitizar nombre de archivo para evitar caracteres inválidos del sistema de archivos
    const sanitizedName = filename.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'documento.pdf';
    const isBlob = typeof blob !== 'string';
    const objectUrl = isBlob ? window.URL.createObjectURL(blob) : blob;

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = sanitizedName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Limpieza segura en cola de microtareas
    setTimeout(() => {
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        if (isBlob) {
            window.URL.revokeObjectURL(objectUrl);
        }
    }, 150);
};

/**
 * Descarga un archivo directamente desde un endpoint de la API,
 * parseando errores estructurados del backend que Axios empaqueta como Blob.
 */
export const downloadFromApi = async (url: string, defaultFilename: string): Promise<void> => {
    try {
        const response = await api.get(url, { responseType: 'blob' });
        const contentType = response.headers['content-type'] || 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        downloadBlob(blob, defaultFilename);
    } catch (error: any) {
        // Si el backend envió un JSON de error pero Axios lo encapsuló en un Blob
        if (error.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.message || json.error || 'Error al procesar el archivo');
            } catch {
                throw error;
            }
        }
        throw error;
    }
};
