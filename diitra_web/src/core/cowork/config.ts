// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Configuration
// Constantes y utilidades de configuración del núcleo
// ═══════════════════════════════════════════════════════════════════

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5175';

export const COWORK_CONFIG = {
    /** URL del Hub de SignalR para la colaboración */
    SIGNALR_HUB_URL: `${BASE_URL}/hubs/collaboration`,

    /** Tiempos de espera entre reintentos de reconexión (ms) */
    RECONNECT_DELAYS: [1000, 2000, 5000, 10000, 30000],

    /** Tamaño máximo de un update de Yjs antes de fragmentarlo */
    MAX_UPDATE_SIZE_BYTES: 50_000,

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
 * Genera un color de cursor consistente para un usuario dado su UUID.
 * El mismo ID siempre produce el mismo color en todas las sesiones y dispositivos.
 * Nunca usa Math.random().
 */
export function getUserColor(userId: string): string {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
