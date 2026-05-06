// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — SignalR Transport
// Implementación del transporte usando Microsoft SignalR (WebSockets)
//
// Este es el transporte por defecto para DIITRA CoWork.
// Si el instituto necesita una red local sin internet, se puede crear
// un WebRTCTransport que implemente la misma ICoWorkTransport.
// ═══════════════════════════════════════════════════════════════════

import * as signalR from '@microsoft/signalr';
import type { ICoWorkTransport } from './ICoWorkTransport';
import type { CoWorkUser } from '../types';
import { COWORK_CONFIG } from '../config';

export class SignalRTransport implements ICoWorkTransport {
    private connection: signalR.HubConnection;
    private _isConnected = false;

    constructor(hubUrl?: string) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl ?? COWORK_CONFIG.SIGNALR_HUB_URL, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                /**
                 * Inyecta el JWT del usuario autenticado en DIITRA.
                 * El backend (CollaborationHub) podrá verificar la identidad
                 * del usuario sin necesidad de pasar parámetros adicionales.
                 * Busca el token en el lugar donde DIITRA lo almacena.
                 */
                accessTokenFactory: () => {
                    return localStorage.getItem('diitra_token') ?? '';
                },
            })
            .withAutomaticReconnect(COWORK_CONFIG.RECONNECT_DELAYS)
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // Manejar eventos del ciclo de vida de la conexión
        this.connection.onreconnecting(() => {
            this._isConnected = false;
            console.info('[DIITRA CoWork] Conexión perdida. Reconectando...');
        });

        this.connection.onreconnected(() => {
            this._isConnected = true;
            console.info('[DIITRA CoWork] Reconexión exitosa.');
        });

        this.connection.onclose(() => {
            this._isConnected = false;
            console.warn('[DIITRA CoWork] Conexión cerrada.');
        });
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    async connect(documentId: string, user: CoWorkUser): Promise<void> {
        await this.connection.start();
        this._isConnected = true;
        // Notificar al servidor que este usuario se unió a la sala del documento
        await this.connection.invoke('JoinDocument', documentId, user.name);
        console.info(`[DIITRA CoWork] ${user.name} conectado al documento ${documentId}`);
    }

    async disconnect(): Promise<void> {
        if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
            await this.connection.stop();
        }
        this._isConnected = false;
    }

    async sendYjsUpdate(documentId: string, updateBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SendYjsUpdate', documentId, updateBase64);
        } catch (err) {
            console.warn('[DIITRA CoWork] Error enviando update Yjs:', err);
        }
    }

    async sendAwarenessUpdate(documentId: string, updateBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SendAwarenessUpdate', documentId, updateBase64);
        } catch (err) {
            console.warn('[DIITRA CoWork] Error enviando awareness update:', err);
        }
    }

    onYjsUpdate(handler: (updateBase64: string) => void): void {
        this.connection.on('ReceiveYjsUpdate', handler);
    }

    onAwarenessUpdate(handler: (updateBase64: string) => void): void {
        this.connection.on('ReceiveAwarenessUpdate', handler);
    }

    onFullState(handler: (stateBase64: string) => void): void {
        this.connection.on('ReceiveFullState', handler);
    }
}
