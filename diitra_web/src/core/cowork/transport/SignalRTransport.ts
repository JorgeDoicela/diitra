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
    private _operationQueue: Promise<any> = Promise.resolve();
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

        // No-ops to avoid SignalR noise
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

    onStatusChange(handler: (isConnected: boolean) => void): () => void {
        this._statusListeners.push(handler);
        return () => {
            this._statusListeners = this._statusListeners.filter(h => h !== handler);
        };
    }

    get isConnected(): boolean { return this._isConnected; }

    /**
     * Asegura que las operaciones de conexión/desconexión ocurran en secuencia.
     */
    private async enqueueOperation<T>(op: () => Promise<T>): Promise<T> {
        const nextOp = this._operationQueue.then(op).catch(op); // Reintentar o continuar ante error
        this._operationQueue = nextOp;
        return nextOp;
    }

    async connect(documentId: string, user: CoWorkUser): Promise<import('../types').HandshakeResponse> {
        return this.enqueueOperation(async () => {
            const normalizedId = documentId.toLowerCase().trim();
            console.log(`[SignalR] Iniciando ciclo de conexión para: ${normalizedId}`);

            try {
                // 1. Esperar a que el estado sea estable (no transicional)
                let attempts = 0;
                while ((this.connection.state === signalR.HubConnectionState.Connecting || 
                        this.connection.state === signalR.HubConnectionState.Disconnecting) && attempts < 25) {
                    await new Promise(r => setTimeout(r, 200));
                    attempts++;
                }

                // 2. Si ya está conectado a una sala, no hacemos nada (o podríamos desconectar, pero connect es agnóstico a sala a nivel físico)
                if (this.connection.state === signalR.HubConnectionState.Disconnected) {
                    console.log("[SignalR] Ejecutando physical start()...");
                    await this.connection.start();
                }

                // 3. Unirse al documento (Handshake)
                if (this.connection.state === signalR.HubConnectionState.Connected) {
                    console.log(`[SignalR] Invocando JoinDocument para: ${normalizedId}`);
                    const response = await this.connection.invoke<import('../types').HandshakeResponse>(
                        'JoinDocument', 
                        normalizedId, 
                        user.name, 
                        user.id, 
                        user.role
                    );
                    
                    this._isConnected = true;
                    this.notifyStatusChange(true);
                    return response;
                }

                return null as any;
            } catch (err: any) {
                if (err?.message?.includes('stop()')) {
                    console.warn("[SignalR] Abortado por stop() concurrente (esperado).");
                } else {
                    console.error('[SignalR] Error en connect():', err);
                }
                this._isConnected = false;
                this.notifyStatusChange(false);
                return null as any;
            }
        });
    }

    async disconnect(): Promise<void> {
        // Marcamos inmediatamente como no conectado para que los componentes dejen de enviar datos
        this._isConnected = false;
        
        return this.enqueueOperation(async () => {
            try {
                if (this.connection.state !== signalR.HubConnectionState.Disconnected && 
                    this.connection.state !== signalR.HubConnectionState.Disconnecting) {
                    console.log("[SignalR] Ejecutando physical stop()...");
                    await this.connection.stop();
                    console.log("[SignalR] Physical stop() completado.");
                }
            } catch (err) {
                console.warn("[SignalR] Error en disconnect():", err);
            }
        });
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
