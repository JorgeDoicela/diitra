import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import api from './axios_config';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
    const [toasts, setToasts] = useState<{ id: string; title: string; body: string; url?: string }[]>([]);

    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (err) {
                console.warn('Error requesting notification permission:', err);
            }
        }
    }, []);

    const addToast = useCallback((title: string, body: string, url?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, body, url }]);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);

        // Native OS Desktop Notification (spawns even if browser tab is in background)
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new window.Notification(title, {
                    body: body,
                    icon: '/favicon.ico'
                });
                
                n.onclick = () => {
                    window.focus();
                    if (url) {
                        navigate(url);
                    }
                    n.close();
                };
            } catch (err) {
                console.warn('Error spawning native desktop notification:', err);
            }
        }
    }, [navigate]);

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

        requestNotificationPermission();
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
                newConnection.on('ReceiveNotification', (payload?: any) => {
                    fetchNotifications();
                    if (payload && payload.title && payload.body) {
                        addToast(payload.title, payload.body, payload.url || undefined);
                    }
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

            {/* Real-time Vercel-style Toasts */}
            <div className="toast-container-vercel">
                {toasts.map(t => (
                    <div 
                        key={t.id} 
                        className="toast-vercel group cursor-pointer hover:border-text-main"
                        onClick={() => {
                            if (t.url) {
                                navigate(t.url);
                            }
                            setToasts(prev => prev.filter(x => x.id !== t.id));
                        }}
                    >
                        <span className="dot dot-brand mt-1.5 dot-pulse" />
                        <div className="flex-1 space-y-1">
                            <h4 className="text-xs font-bold text-text-main leading-tight">{t.title}</h4>
                            <p className="text-[10px] text-text-dim leading-relaxed">{t.body}</p>
                            {t.url && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-brand font-bold uppercase mt-1">
                                    Ver detalle
                                </span>
                            )}
                        </div>
                        <button 
                            className="text-[10px] text-text-dim hover:text-text-main ml-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                setToasts(prev => prev.filter(x => x.id !== t.id));
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
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
