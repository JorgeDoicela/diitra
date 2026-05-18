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
    tabId?: string;    // ID único de la sesión/pestaña (para diferenciar sesiones)
}

/**
 * Respuesta del servidor tras unirse exitosamente a un documento.
 * Contiene configuraciones críticas inyectadas por el backend.
 */
export interface HandshakeResponse {
    isBlindMode: boolean;        // ¿Debe anonimizarse a los usuarios? (CACES Double Blind)
    readOnly: boolean;           // ¿El documento ya está firmado o es lectura?
    serverTimestamp: string;     // Para sincronización horaria
    deltaCount: number;          // Cantidad de deltas cargados (para telemetría)
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
    readOnly?: boolean;
    isBlindMode?: boolean;
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
    ydoc: import('yjs').Doc | null;
    awareness: import('y-protocols/awareness').Awareness | null;
    disconnect: () => void;
    compact: () => Promise<void>;
    submitFinalContent: (html: string, json: string) => void;

    // Coordination (Team Pulse)
    notifySectionActivity: (instanceUuid: string, sectionName: string, action: string) => Promise<void>;
    updateSectionStatus: (instanceUuid: string, sectionName: string, status: string) => Promise<void>;
    postComment: (instanceUuid: string, content: string, parentId?: number) => Promise<void>;

    // Real-Time Subscriptions
    onSectionActivity: (handler: (data: any) => void) => void;
    onSectionStatusUpdated: (handler: (data: any) => void) => void;
    onNewCommentReceived: (handler: (data: any) => void) => void;
}
