// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — SignalR Transport (v3.5 - Telemetría Activa)
// ═══════════════════════════════════════════════════════════════════

import * as signalR from '@microsoft/signalr';
import type { ICoWorkTransport } from './ICoWorkTransport';
import type { CoWorkUser } from '../types';
import { COWORK_CONFIG } from '../config';

export class SignalRTransport implements ICoWorkTransport {
    private connection: signalR.HubConnection;
    private _isConnected = false;
    private _startPromise: Promise<import('../types').HandshakeResponse> | null = null;
    private _statusListeners: ((isConnected: boolean) => void)[] = [];

    constructor(...args: any[]) {
        const hubUrl = typeof args[0] === 'string' && args[0].startsWith('http') ? args[0] : COWORK_CONFIG.SIGNALR_HUB_URL;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                accessTokenFactory: () => localStorage.getItem('diitra_token') ?? '',
            })
            .withAutomaticReconnect(COWORK_CONFIG.RECONNECT_DELAYS)
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // No-ops para evitar ruidos de SignalR
        this.connection.on('ReceiveYjsUpdate', () => {});
        this.connection.on('ReceiveAwarenessUpdate', () => {});
        this.connection.on('ReceiveUpdateHistory', () => {});
        this.connection.on('UserJoined', () => {});

        this.connection.onreconnecting(() => { 
            console.warn("[SignalR] Reconectando...");
            this._isConnected = false; 
            this.notifyStatusChange(false);
        });
        this.connection.onreconnected(() => { 
            console.info("[SignalR] Conexión recuperada.");
            this._isConnected = true; 
            this.notifyStatusChange(true);
        });
        this.connection.onclose((error) => { 
            if (error) {
                console.error("[SignalR] Conexión cerrada por error:", error);
            } else {
                console.info("[SignalR] Conexión cerrada de forma limpia.");
            }
            this._isConnected = false; 
            this.notifyStatusChange(false);
        });
    }

    private notifyStatusChange(isConnected: boolean) {
        this._statusListeners.forEach(h => h(isConnected));
    }

    onStatusChange(handler: (isConnected: boolean) => void): void {
        this._statusListeners.push(handler);
    }

    get isConnected(): boolean { return this._isConnected; }

    async connect(documentId: string, user: CoWorkUser): Promise<import('../types').HandshakeResponse> {
        if (this._startPromise) {
            console.log("[SignalR] Ya hay una conexión en curso, esperando...");
            return this._startPromise;
        }

        const normalizedId = documentId.toLowerCase().trim();

        this._startPromise = (async () => {
            try {
                // Esperar si se está desconectando
                while (this.connection.state === signalR.HubConnectionState.Disconnecting) {
                    console.log("[SignalR] Esperando a que termine la desconexión previa...");
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (this.connection.state === signalR.HubConnectionState.Disconnected) {
                    console.log("[SignalR] Iniciando conexión física...");
                    try {
                        await this.connection.start();
                        console.info("[SignalR] Conexión física establecida.");
                    } catch (startErr: any) {
                        if (startErr.message?.includes('stop()')) {
                            console.warn("[SignalR] Intento de inicio cancelado por stop() concurrente.");
                            return { isBlindMode: false, readOnly: false, serverTimestamp: '', deltaCount: 0 };
                        }
                        throw startErr;
                    }
                }

                console.log(`[SignalR] Invocando JoinDocument para sala: ${normalizedId}`);
                const response = await this.connection.invoke<import('../types').HandshakeResponse>(
                    'JoinDocument', 
                    normalizedId, 
                    user.name, 
                    user.id, 
                    user.role
                );
                
                console.log("[SignalR] Respuesta Handshake:", response);

                this._isConnected = true;
                this.notifyStatusChange(true);
                console.info(`[SignalR] Handshake completado para: ${normalizedId}`);
                return response;
            } catch (err: any) {
                if (err?.name === 'AbortError' || err?.message?.includes('stop()')) {
                     // Retornar dummy si se abortó
                     return { isBlindMode: false, readOnly: false, serverTimestamp: '', deltaCount: 0 };
                }
                console.error('[SignalR] Error en connect():', err);
                this._isConnected = false;
                this.notifyStatusChange(false);
                throw err;
            } finally {
                this._startPromise = null;
            }
        })();

        return this._startPromise;
    }

    async disconnect(): Promise<void> {
        if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
            try {
                console.log("[SignalR] Solicitando desconexión...");
                await this.connection.stop();
                console.log("[SignalR] Desconectado.");
            } catch (err) {}
        }
        this._isConnected = false;
        this._startPromise = null;
    }

    async sendYjsUpdate(documentId: string, updateBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SendYjsUpdate', documentId.toLowerCase().trim(), updateBase64);
        } catch (error) {
            console.error('[SignalR] Error en SendYjsUpdate:', error);
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

    onUserJoined(handler: (userName: string, userRole: string) => void): void {
        this.connection.off('UserJoined');
        this.connection.on('UserJoined', handler);
    }
}
