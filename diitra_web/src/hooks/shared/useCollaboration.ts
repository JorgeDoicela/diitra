import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export const useCollaboration = (documentId: string, userName: string = 'Invitado') => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [lastDelta, setLastDelta] = useState<any>(null);
    const [lastCursor, setLastCursor] = useState<any>(null);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const hubUrl = import.meta.env.VITE_API_URL 
            ? `${import.meta.env.VITE_API_URL}/hubs/collaboration`
            : `http://localhost:5175/hubs/collaboration`;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [documentId]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    setIsConnected(true);
                    connection.invoke('JoinDocument', documentId, userName);

                    connection.on('ReceiveDelta', (deltaJson: string) => {
                        try {
                            const delta = JSON.parse(deltaJson);
                            setLastDelta(delta);
                        } catch (e) {
                            // Error silencioso en producción
                        }
                    });

                    connection.on('ReceiveCursor', (cursorData: any) => {
                        setLastCursor(cursorData);
                    });

                    connection.on('UserJoined', (data: any) => {
                        setConnectedUsers(prev => {
                            if (prev.includes(data.name)) return prev;
                            return [...prev, data.name];
                        });
                    });

                    connection.on('UserLeft', (connectionId: string) => {
                        // Limpieza opcional de presencia
                    });
                })
                .catch(err => console.error('>>> [Collaboration] Connection error:', err));
        }
    }, [connection, documentId, userName]);

    const sendDelta = (delta: any) => {
        if (connection && isConnected) {
            const deltaJson = JSON.stringify(delta);
            connection.invoke('SendDelta', documentId, deltaJson)
                .catch(err => console.error('>>> [Collaboration] Send error:', err));
        }
    };

    const updateCursor = (cursorInfo: any) => {
        if (connection && isConnected) {
            connection.invoke('UpdateCursor', documentId, cursorInfo)
                .catch(err => console.error('>>> [Collaboration] Cursor error:', err));
        }
    };

    return { 
        lastDelta, 
        sendDelta, 
        updateCursor, 
        lastCursor,
        isConnected, 
        connectedUsers 
    };
};
