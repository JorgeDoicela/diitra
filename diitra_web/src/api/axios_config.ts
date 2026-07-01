import axios from 'axios';

/**
 * Convierte cualquier string (snake_case, PascalCase, kebab-case) a camelCase.
 * Ejemplos:
 * - id_periodo -> idPeriodo
 * - IdPeriodo -> idPeriodo
 * - UUID -> uuid
 */
function toCamelCase(str: string): string {
    if (!str) return str;
    let camel = str.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
    if (camel[0] === camel[0].toUpperCase()) {
        if (camel === camel.toUpperCase()) {
            return camel.toLowerCase();
        }
        camel = camel[0].toLowerCase() + camel.slice(1);
    }
    return camel;
}

/**
 * Duplica claves snake_case y PascalCase a camelCase recursivamente en las respuestas.
 */
function addCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Blob || obj instanceof ArrayBuffer) return obj;
    if (Array.isArray(obj)) return obj.map(addCamelCaseKeys);

    const newObj: any = {};
    for (const key of Object.keys(obj)) {
        const val = addCamelCaseKeys(obj[key]);
        newObj[key] = val;

        const camelKey = toCamelCase(key);
        const shouldDuplicate = key && (key[0] !== key[0].toUpperCase() || key.includes('_') || key.includes('-'));
        if (shouldDuplicate && camelKey !== key && !(camelKey in newObj)) {
            newObj[camelKey] = val;
        }
    }
    return newObj;
}

/**
 * IMPORTANTE: POLÍTICA DE NOMENCLATURA DE LA API (CASE CONVENTIONS)
 *
 * 1. El backend (.NET) tiene configurada la política global `JsonNamingPolicy.SnakeCaseLower`.
 *    - Las respuestas de la API envían propiedades en `snake_case`.
 *    - Las peticiones POST/PUT/PATCH enviadas al backend deben ir en `snake_case` para que coincidan
 *      con los DTOs en C#, ya que el mapeador automático de ASP.NET Core no mapea camelCase a snake_case.
 *      Existen DTOs con anotaciones [JsonPropertyName] para forzar camelCase y campos dinámicos de templates (CACES)
 *      que no deben alterarse.
 *
 * 2. TOLERANCIA A DISCREPANCIAS (LOCAL FALLBACK PATTERN):
 *    - El interceptor de Axios duplica automáticamente todas las claves en `snake_case` y `PascalCase` 
 *      a `camelCase` en tiempo de ejecución. Esto garantiza compatibilidad universal en todo el sistema al leer datos.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de respuestas (Response) para deserializar a camelCase (manteniendo duplicados)
api.interceptors.response.use(
    (response) => {
        const url = response.config.url;
        const isDocumentRoute = url && (url.includes('/documents/') || url.includes('/documents'));
        if (response.data && !isDocumentRoute) {
            response.data = addCamelCaseKeys(response.data);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('diitra_logged_in');
        }
        return Promise.reject(error);
    }
);

export default api;
