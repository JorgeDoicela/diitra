import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import * as awarenessProtocol from 'y-protocols/awareness';

export const useCollaboration = (documentId: string, userName: string, quillInstance: Quill | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    
    const ydocRef = useRef<Y.Doc>(new Y.Doc());
    const awarenessRef = useRef<awarenessProtocol.Awareness>(new awarenessProtocol.Awareness(ydocRef.current));
    
    useEffect(() => {
        let isStopped = false;
        const ydoc = ydocRef.current;
        const awareness = awarenessRef.current;

        const hubUrl = import.meta.env.VITE_API_URL 
            ? `${import.meta.env.VITE_API_URL}/hubs/collaboration`
            : `http://localhost:5175/hubs/collaboration`;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        // Relay Updates
        connection.on('ReceiveYjsUpdate', (updateBase64: string) => {
            try {
                const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
                Y.applyUpdate(ydoc, update, 'remote');
            } catch (e) {}
        });

        connection.on('ReceiveAwarenessUpdate', (updateBase64: string) => {
            try {
                const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
                awarenessProtocol.applyAwarenessUpdate(awareness, update, 'remote');
            } catch (e) {}
        });

        const onYdocUpdate = (update: Uint8Array, origin: any) => {
            if (origin !== 'remote' && connection.state === signalR.HubConnectionState.Connected) {
                connection.invoke('SendYjsUpdate', documentId, btoa(String.fromCharCode(...update)));
            }
        };

        const onAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
            if (origin !== 'remote' && connection.state === signalR.HubConnectionState.Connected) {
                const changedIds = added.concat(updated).concat(removed);
                const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedIds);
                connection.invoke('SendAwarenessUpdate', documentId, btoa(String.fromCharCode(...update)));
            }

            const users: string[] = [];
            awareness.getStates().forEach((state: any) => {
                if (state.user) users.push(state.user.name);
            });
            setConnectedUsers([...new Set(users)]);
        };

        ydoc.on('update', onYdocUpdate);
        awareness.on('update', onAwarenessUpdate);

        connection.start()
            .then(() => {
                if (isStopped) return;
                setIsConnected(true);
                connection.invoke('JoinDocument', documentId, userName);
                
                // Color persistente basado en el nombre para coherencia visual
                const colors = ['#4f46e9', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                const userColor = colors[Math.abs(userName.split('').reduce((a,b) => a + b.charCodeAt(0), 0)) % colors.length];

                awareness.setLocalStateField('user', { 
                    name: userName, 
                    color: userColor
                });
            })
            .catch(err => {
                if (!isStopped) console.error('SignalR Connection Error:', err);
            });

        return () => {
            isStopped = true;
            connection.stop();
            ydoc.off('update', onYdocUpdate);
            awareness.off('update', onAwarenessUpdate);
        };
    }, [documentId, userName]);

    useEffect(() => {
        if (quillInstance && isConnected) {
            const binding = new QuillBinding(ydocRef.current.getText('quill'), quillInstance, awarenessRef.current);
            return () => binding.destroy();
        }
    }, [quillInstance, isConnected]);

    return { isConnected, connectedUsers };
};
