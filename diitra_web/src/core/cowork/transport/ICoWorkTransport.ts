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
     * Establece la conexión con el servidor y se une a la sala del documento.
     * @param documentId - UUID del documento/proyecto
     * @param user - Datos del usuario autenticado (del JWT de DIITRA)
     */
    connect(documentId: string, user: CoWorkUser): Promise<void>;

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
}
