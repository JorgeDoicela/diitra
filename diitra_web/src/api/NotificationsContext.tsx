import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import api from './axios_config';
import { useAuth } from './AuthContext';

interface Notification {
    uuid: string;
    titulo: string;
    mensaje: string;
    categoria: string;
    fecha_envio: string;
    leido: boolean;
    url_accion?: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (uuid: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoading: boolean;
    isConnected: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            const response = await api.get('/Admin/notifications/my');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const markAsRead = async (uuid: string) => {
        try {
            await api.patch(`/Admin/notifications/${uuid}/read`);
            setNotifications(prev => prev.map(n => n.uuid === uuid ? { ...n, leido: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/Admin/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Manejo de la conexión SignalR (Singleton)
    useEffect(() => {
        if (!isAuthenticated) {
            if (connection) {
                connection.stop();
                setConnection(null);
            }
            setNotifications([]);
            setIsConnected(false);
            return;
        }

        fetchNotifications();

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5175'}/hubs/notifications`, {
                withCredentials: true
            })
            .withAutomaticReconnect()
            .build();

        let isSubscribed = true;

        newConnection.start()
            .then(() => {
                if (!isSubscribed) {
                    newConnection.stop();
                    return;
                }
                console.log('Global Notification Connection established');
                setIsConnected(true);
                newConnection.on('ReceiveNotification', () => {
                    fetchNotifications();
                });
            })
            .catch(err => {
                setIsConnected(false);
                if (isSubscribed) {
                    console.error('SignalR Connection Error: ', err);
                }
            });

        newConnection.onclose(() => {
            setIsConnected(false);
        });

        newConnection.onreconnecting(() => {
            setIsConnected(false);
        });

        newConnection.onreconnected(() => {
            setIsConnected(true);
        });

        setConnection(newConnection);

        return () => {
            isSubscribed = false;
            newConnection.stop();
            setIsConnected(false);
        };
    }, [isAuthenticated]);

    const unreadCount = notifications.filter(n => !n.leido).length;

    return (
        <NotificationsContext.Provider value={{ 
            notifications, 
            unreadCount, 
            fetchNotifications, 
            markAsRead,
            markAllAsRead,
            isLoading,
            isConnected
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};
