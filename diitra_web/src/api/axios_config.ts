import axios from 'axios';

/**
 * IMPORTANTE: POLÍTICA DE NOMENCLATURA DE LA API (CASE CONVENTIONS)
 *
 * 1. El backend (.NET) tiene configurada la política global `JsonNamingPolicy.SnakeCaseLower`.
 *    - Las respuestas de la API envían propiedades en `snake_case` (ej. `nombre_completo`, `has_p12_certificate`).
 *    - Las peticiones POST/PUT/PATCH enviadas al backend deben ir en `snake_case` para que coincidan
 *      con los DTOs en C#, ya que el mapeador automático de ASP.NET Core no mapea camelCase a snake_case.
 *
 * 2. TOLERANCIA A DISCREPANCIAS (LOCAL FALLBACK PATTERN):
 *    - Algunas propiedades dinámicas (como metadatos, snapshots guardados en JSON o esquemas Scriban)
 *      pueden usar `camelCase` o `PascalCase` según la serialización del componente interno.
 *    - REGLA DE ORO: Al recuperar propiedades críticas de la API (como `data_snapshot_json`, `uuid`, etc.),
 *      usa siempre expresiones tolerantes (fallbacks) en el frontend:
 *      `const snapshot = res.data.data_snapshot_json || res.data.dataSnapshotJson || res.data.DataSnapshotJson;`
 *      Esto previene errores en producción si cambia la serialización o se usa una fuente de datos alternativa.
 */
const api = axios.create({
    // En desarrollo, el proxy de Vite reenvía /api → http://localhost:5175/api
    // En producción, VITE_API_BASE_URL apunta al dominio real del backend.
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor profesional para manejo de errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('diitra_logged_in');
        }
        return Promise.reject(error);
    }
);

export default api;
