// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — SignalR Transport (v3.2 - Normalización Total)
// ═══════════════════════════════════════════════════════════════════

import * as signalR from '@microsoft/signalr';
import type { ICoWorkTransport } from './ICoWorkTransport';
import type { CoWorkUser } from '../types';
import { COWORK_CONFIG } from '../config';

export class SignalRTransport implements ICoWorkTransport {
    private connection: signalR.HubConnection;
    private _isConnected = false;

    constructor(hubUrl?: string) {
        const customLogger = {
            log: (logLevel: signalR.LogLevel, message: string) => {
                if (message.includes('Failed to start the HttpConnection before stop() was called')) return;
                if (logLevel >= signalR.LogLevel.Warning) console.warn(`[SignalR] ${message}`);
            }
        };

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl ?? COWORK_CONFIG.SIGNALR_HUB_URL, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                accessTokenFactory: () => localStorage.getItem('diitra_token') ?? '',
            })
            .withAutomaticReconnect(COWORK_CONFIG.RECONNECT_DELAYS)
            .configureLogging(customLogger)
            .build();

        // Evitar ruidos de métodos no registrados
        this.connection.on('ReceiveYjsUpdate', () => {});
        this.connection.on('ReceiveAwarenessUpdate', () => {});
        this.connection.on('ReceiveUpdateHistory', () => {});
        this.connection.on('UserJoined', () => {});

        this.connection.onreconnecting(() => { this._isConnected = false; });
        this.connection.onreconnected(() => { this._isConnected = true; });
        this.connection.onclose(() => { this._isConnected = false; });
    }

    get isConnected(): boolean { return this._isConnected; }

    private startPromise: Promise<void> | null = null;

    async connect(documentId: string, user: CoWorkUser): Promise<void> {
        if (this.startPromise) return this.startPromise;

        const normalizedId = documentId.toLowerCase().trim();

        this.startPromise = (async () => {
            try {
                while (this.connection.state === signalR.HubConnectionState.Disconnecting) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                if (this.connection.state === signalR.HubConnectionState.Disconnected) {
                    await this.connection.start();
                }

                // NORMALIZACIÓN CRÍTICA: Sala en minúsculas para coincidir con el Hub
                await this.connection.invoke('JoinDocument', normalizedId, user.name, user.id, user.role);
                
                this._isConnected = true;
                console.info(`[DIITRA CoWork] Conectado con éxito a: ${normalizedId}`);
            } catch (err: any) {
                if (err?.name === 'AbortError' || err?.message?.includes('stop() was called')) return;
                console.error('[DIITRA CoWork] Fallo al unirse a la sala:', err);
                this._isConnected = false;
                throw err;
            } finally {
                this.startPromise = null;
            }
        })();

        return this.startPromise;
    }

    async disconnect(): Promise<void> {
        if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
            try {
                await this.connection.stop();
            } catch (err) {}
        }
        this._isConnected = false;
    }

    async sendYjsUpdate(documentId: string, updateBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SendYjsUpdate', documentId.toLowerCase().trim(), updateBase64);
        } catch (error) {
            console.error('[DIITRA CoWork] Error en relay Yjs:', error);
        }
    }

    async sendAwarenessUpdate(documentId: string, updateBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SendAwarenessUpdate', documentId.toLowerCase().trim(), updateBase64);
        } catch (err) {}
    }

    onYjsUpdate(handler: (updateBase64: string) => void): void {
        this.connection.off('ReceiveYjsUpdate');
        this.connection.on('ReceiveYjsUpdate', handler);
    }

    onAwarenessUpdate(handler: (updateBase64: string) => void): void {
        this.connection.off('ReceiveAwarenessUpdate');
        this.connection.on('ReceiveAwarenessUpdate', handler);
    }

    onUpdateHistory(handler: (updatesBase64: string[]) => void): void {
        this.connection.off('ReceiveUpdateHistory');
        this.connection.on('ReceiveUpdateHistory', handler);
    }

    async submitFinalContent(documentId: string, html: string, json: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SubmitFinalContent', documentId.toLowerCase().trim(), html, json);
        } catch (err) {}
    }

    async submitFullSnapshot(documentId: string, snapshotBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SubmitFullSnapshot', documentId.toLowerCase().trim(), snapshotBase64);
        } catch (err) {}
    }
}
