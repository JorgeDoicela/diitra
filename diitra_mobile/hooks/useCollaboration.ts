import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useCollaboration = (documentId: string, userName: string = 'Móvil') => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [lastDelta, setLastDelta] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5175/api';
        const rootUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
        const hubUrl = `${rootUrl}/hubs/collaboration`;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, [documentId]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    setIsConnected(true);
                    connection.invoke('JoinDocument', documentId, userName);

                    connection.on('ReceiveDelta', (delta: any) => {
                        setLastDelta(delta);
                    });
                })
                .catch((err: any) => console.log('>>> [SignalR Mobile] Error: ', err));
        }
    }, [connection, documentId, userName]);

    const sendDelta = (delta: any) => {
        if (connection && isConnected) {
            connection.invoke('SendDelta', documentId, delta);
        }
    };

    return { lastDelta, sendDelta, isConnected };
};
