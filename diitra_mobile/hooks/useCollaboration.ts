import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useCollaboration = (documentId: string, userName: string = 'Móvil') => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [lastDelta, setLastDelta] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // En móviles, localhost no suele funcionar para el backend. 
        // Se debería usar la IP de la máquina o una variable de entorno.
        const hubUrl = 'http://192.168.1.10:5175/hubs/collaboration'; // Ajustar según IP local

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
                .catch(err => console.log('>>> [SignalR Mobile] Error: ', err));
        }
    }, [connection, documentId, userName]);

    const sendDelta = (delta: any) => {
        if (connection && isConnected) {
            connection.invoke('SendDelta', documentId, delta);
        }
    };

    return { lastDelta, sendDelta, isConnected };
};
