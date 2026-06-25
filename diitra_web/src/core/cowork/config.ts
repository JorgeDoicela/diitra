// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Configuration
// Constantes y utilidades de configuración del núcleo
// ═══════════════════════════════════════════════════════════════════

const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const BASE_URL = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;

export const COWORK_CONFIG = {
    /** URL del Hub de SignalR para la colaboración */
    SIGNALR_HUB_URL: `${BASE_URL}/hubs/collaboration`,

    /** Tiempos de espera entre reintentos de reconexión (ms) */
    RECONNECT_DELAYS: [1000, 2000, 5000, 10000, 30000],

    /** Tamaño máximo de un update de Yjs antes de fragmentarlo */
    MAX_UPDATE_SIZE_BYTES: 50_000,

    /** Umbral de deltas para compactación reactiva */
    COMPACTION_DELTA_THRESHOLD: 150,

    /** Gracia antes de cerrar transporte compartido (StrictMode) */
    TRANSPORT_RELEASE_GRACE_MS: 1500,

    /**
     * Paleta de colores de cursores para colaboradores.
     * El mismo usuario SIEMPRE obtendrá el mismo color en todas las sesiones
     * porque el color se deriva del UUID del usuario, no de un random().
     */
    USER_COLORS: [
        '#4f46e9', // Indigo   — Director
        '#0ea5e9', // Sky      — Investigador
        '#10b981', // Esmeralda — Estudiante
        '#f59e0b', // Ámbar    — Revisor externo
        '#8b5cf6', // Violeta
        '#ec4899', // Rosa
        '#14b8a6', // Teal
        '#f97316', // Naranja
    ],
} as const;

/**
 * Genera un color de cursor consistente para un usuario.
 * Se puede pasar un secondarySeed (como tabId) para diferenciar sesiones del mismo usuario.
 */
export function getUserColor(userId: string, secondarySeed?: string): string {
    const input = userId + (secondarySeed || '');
    const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COWORK_CONFIG.USER_COLORS[Math.abs(hash) % COWORK_CONFIG.USER_COLORS.length];
}

/**
 * Genera las iniciales del nombre para mostrar en el avatar del cursor.
 * Ej: "Jorge Sánchez Doicela" → "JS"
 */
export function getUserInitials(fullName: string): string {
    return fullName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0].toUpperCase())
        .slice(0, 2)
        .join('');
}
