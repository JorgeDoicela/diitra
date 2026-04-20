import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useCollaboration = (projectId: string) => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [lastDelta, setLastDelta] = useState<string | null>(null);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`https://localhost:5001/hubs/collaboration`) // Update with your actual API URL
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to Collaboration Hub');
                    connection.invoke('JoinProject', projectId);

                    connection.on('ReceiveDelta', (delta: string) => {
                        setLastDelta(delta);
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
        }
    }, [connection, projectId]);

    const sendDelta = (delta: string) => {
        if (connection) {
            connection.invoke('SendDelta', projectId, delta);
        }
    };

    return { lastDelta, sendDelta };
};
