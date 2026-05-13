// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Transport Interface
// Abstracción del canal de comunicación
//
// ¿Por qué existe esta interfaz?
// ─────────────────────────────
// Hoy usamos SignalR (WebSockets sobre .NET).
// Mañana podríamos usar:
//   - WebRTC peer-to-peer (para redes LAN del IST sin internet)
//   - Server-Sent Events (SSE, para clientes detrás de proxies restrictivos)
//   - WebSocket nativo (si el backend cambia de .NET a Node/Go)
//
// Al tener esta interfaz, el resto del núcleo NO cambia.
// Solo se crea una nueva implementación de ICoWorkTransport.
// ═══════════════════════════════════════════════════════════════════

import type { CoWorkUser } from '../types';

export interface ICoWorkTransport {
    /** Estado actual de la conexión */
    readonly isConnected: boolean;

    /** 
     * Registra un handler para cambios en el estado de la conexión.
     * @returns Función para des-registrar el handler (cleanup).
     */
    onStatusChange(handler: (isConnected: boolean) => void): () => void;

    /**
     * Establece la conexión con el servidor y se une a la sala del documento.
     * @param documentId - UUID del documento/proyecto
     * @param user - Datos del usuario autenticado (del JWT de DIITRA)
     * @returns Promesa con los metadatos de configuración del servidor (Handshake)
     */
    connect(documentId: string, user: CoWorkUser): Promise<import('../types').HandshakeResponse>;

    /**
     * Cierra la conexión de forma limpia, liberando los recursos del servidor.
     * Se llama automáticamente cuando el componente se desmonta.
     */
    disconnect(): Promise<void>;

    /**
     * Envía una actualización de estado del documento Yjs al servidor.
     * El servidor la retransmitirá a todos los demás participantes del documento.
     * @param documentId - Identificador de la sala (documento)
     * @param updateBase64 - Bytes del Yjs update, codificados en base64
     */
    sendYjsUpdate(documentId: string, updateBase64: string): Promise<void>;

    /**
     * Envía el estado de presencia del usuario (posición del cursor, nombre, color).
     * Esto es lo que permite ver los cursores de otros en tiempo real.
     * @param documentId - Identificador de la sala
     * @param updateBase64 - Bytes del Yjs Awareness update, codificados en base64
     */
    sendAwarenessUpdate(documentId: string, updateBase64: string): Promise<void>;

    /**
     * Registra el handler que se ejecuta al recibir un update de Yjs del servidor.
     * Solo debe llamarse una vez durante la inicialización.
     */
    onYjsUpdate(handler: (updateBase64: string) => void): void;

    /**
     * Registra el handler que se ejecuta al recibir un update de presencia del servidor.
     * Solo debe llamarse una vez durante la inicialización.
     */
    onAwarenessUpdate(handler: (updateBase64: string) => void): void;

    /**
     * Recibe el HISTORIAL de actualizaciones del documento al unirse.
     * El servidor envía un array de updates (un snapshot + deltas posteriores).
     * Esto garantiza que el cliente se sincronice exactamente con el estado actual.
     */
    onUpdateHistory(handler: (updatesBase64: string[]) => void): void;

    /**
     * Envía una versión renderizada (HTML y JSON) del documento para persistencia estática.
     * Esto es fundamental para que el DIITRA Builder pueda generar el PDF sin un parser Yjs.
     */
    submitFinalContent(documentId: string, html: string, json: string): Promise<void>;

    /**
     * Envía el estado COMPLETO y FUSIONADO del documento Yjs (Snapshot).
     * El servidor reemplazará el estado base y limpiará el historial de deltas (Compactación).
     */
    submitFullSnapshot(documentId: string, snapshotBase64: string): Promise<void>;

    /**
     * Se dispara cuando un nuevo colaborador se une a la sala.
     * Permite a los usuarios actuales re-anunciar su presencia para sincronizar al recién llegado.
     */
    onUserJoined?(handler: (userName: string, userRole: string) => void): void;
}
