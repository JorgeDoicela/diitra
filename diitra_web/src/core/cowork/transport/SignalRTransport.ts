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
        // Logger personalizado para silenciar ruidos de aborto esperados en React
        const customLogger = {
            log: (logLevel: signalR.LogLevel, message: string) => {
                if (message.includes('Failed to start the HttpConnection before stop() was called')) {
                    return; // Silencio total para este error de ciclo de vida
                }
                if (logLevel >= signalR.LogLevel.Warning) {
                    console.warn(`[SignalR] ${message}`);
                }
            }
        };

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl ?? COWORK_CONFIG.SIGNALR_HUB_URL, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                accessTokenFactory: () => {
                    return localStorage.getItem('diitra_token') ?? '';
                },
            })
            .withAutomaticReconnect(COWORK_CONFIG.RECONNECT_DELAYS)
            .configureLogging(customLogger)
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

    private startPromise: Promise<void> | null = null;

    async connect(documentId: string, user: CoWorkUser): Promise<void> {
        // Si ya estamos conectados, no hacer nada
        if (this.connection.state === signalR.HubConnectionState.Connected) {
            this._isConnected = true;
            return;
        }

        // Si ya hay un intento de conexión en curso, retornar la promesa existente
        if (this.startPromise) {
            return this.startPromise;
        }

        // Crear un nuevo proceso de conexión
        this.startPromise = (async () => {
            try {
                // Esperar a que cualquier desconexión previa termine
                while (this.connection.state === signalR.HubConnectionState.Disconnecting) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                if (this.connection.state === signalR.HubConnectionState.Connected) {
                    this._isConnected = true;
                    return;
                }

                if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
                    return;
                }

                await this.connection.start();
                this._isConnected = true;
                
                await this.connection.invoke('JoinDocument', documentId, user.name, user.id, user.role);
                console.info(`[DIITRA CoWork] Sesión establecida para ${user.name}`);
            } catch (err: any) {
                // El error ya es silenciado por el customLogger si es un aborto
                if (err?.name === 'AbortError' || err?.message?.includes('stop() was called')) {
                    return;
                }

                console.error('[DIITRA CoWork] Error crítico de conexión:', err);
                this._isConnected = false;
                throw err;
            } finally {
                this.startPromise = null;
            }
        })();

        return this.startPromise;
    }

    async disconnect(): Promise<void> {
        const state = this.connection.state;
        
        // Solo intentar detener si no estamos ya desconectados o desconectando
        if (state !== signalR.HubConnectionState.Disconnected && state !== signalR.HubConnectionState.Disconnecting) {
            try {
                await this.connection.stop();
            } catch (err) {
                // Ignorar errores al cerrar si el arranque fue abortado o ya estaba cerrándose
                console.debug('[DIITRA CoWork] Intento de cierre ignorado:', err);
            }
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

    onUpdateHistory(handler: (updatesBase64: string[]) => void): void {
        this.connection.on('ReceiveUpdateHistory', handler);
    }

    async submitFinalContent(documentId: string, html: string, json: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SubmitFinalContent', documentId, html, json);
        } catch (err) {
            console.warn('[DIITRA CoWork] Error enviando contenido final:', err);
        }
    }

    async submitFullSnapshot(documentId: string, snapshotBase64: string): Promise<void> {
        if (!this._isConnected) return;
        try {
            await this.connection.invoke('SubmitFullSnapshot', documentId, snapshotBase64);
        } catch (err) {
            console.warn('[DIITRA CoWork] Error enviando snapshot de compactación:', err);
        }
    }
}
