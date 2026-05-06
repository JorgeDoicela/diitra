// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Core Type Definitions
// Motor de Colaboración en Tiempo Real
// ═══════════════════════════════════════════════════════════════════

/**
 * Representa un usuario activo dentro de una sesión CoWork.
 * Los datos provienen del token JWT de DIITRA, NO son aleatorios.
 */
export interface CoWorkUser {
    id: string;        // UUID del usuario (del JWT: user_uuid)
    name: string;      // Nombre completo del investigador
    role: string;      // Rol en DIITRA (Investigador, Director, Revisor, etc.)
    color: string;     // Color persistente del cursor (generado desde el ID)
    initials: string;  // Iniciales para el avatar (ej: "JS" para Jorge Sánchez)
}

/**
 * Estado completo de la sesión colaborativa activa.
 * Devuelto por useCoWork para que el componente pueda renderizar el estado.
 */
export interface CoWorkSession {
    documentId: string;
    isConnected: boolean;
    connectedUsers: CoWorkUser[];
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
}

/**
 * Configuración para inicializar una sesión CoWork.
 * Se pasa una sola vez al hook useCoWork.
 */
export interface CoWorkConfig {
    documentId: string;
    user: CoWorkUser;
    transportUrl?: string;       // URL del hub SignalR (opcional, usa la default)
    readonly?: boolean;          // Modo solo lectura (para revisores en doble ciego)
    enabled?: boolean;           // ¿Debe conectarse automáticamente? (Default: true)
    onSynced?: () => void;       // Callback: documento sincronizado con el servidor
    onError?: (msg: string) => void;  // Callback: error de conexión
}

/**
 * Handle completo retornado por el hook useCoWork.
 * Provee acceso al Yjs Doc, Awareness y estado de sesión.
 */
export interface CoWorkHandle {
    session: CoWorkSession;
    ydoc: import('yjs').Doc;
    awareness: import('y-protocols/awareness').Awareness;
    disconnect: () => void;
}
