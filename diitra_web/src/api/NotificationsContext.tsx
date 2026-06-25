import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import api from './axios_config';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Info, XCircle, Bell, X } from 'lucide-react';

interface Notification {
    uuid: string;
    titulo: string;
    mensaje: string;
    categoria: string;
    fecha_envio: string;
    leido: boolean;
    url_accion?: string;
}

export interface Toast {
    id: string;
    title: string;
    body: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'default';
    url?: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (uuid: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoading: boolean;
    isConnected: boolean;
    addToast: (title: string, body: string, type?: 'success' | 'error' | 'warning' | 'info' | 'default', url?: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const navigate = useNavigate();
    const [toasts, setToasts] = useState<Toast[]>([]);

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

    const addToast = useCallback((title: string, body: string, type: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default', url?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        // Limpiar etiquetas HTML para que el toast en app se vea limpio y profesional
        const cleanBody = body.replace(/<\/?[^>]+(>|$)/g, "");
        
        setToasts(prev => [...prev, { id, title, body: cleanBody, type, url }]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);

        // Evitar duplicar la notificación nativa si Web Push está activo y sincronizado en este navegador
        const isWebPushActive = localStorage.getItem('web_push_active') === 'true';

        // Solo lanzamos la notificación nativa si Web Push no está activo y tenemos permisos
        if (!isWebPushActive && 'Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new window.Notification(title, {
                    body: cleanBody,
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

        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const apiRoot = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiRoot}/hubs/notifications`, {
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
                if (import.meta.env.DEV) console.log('Global Notification Connection established');
                setIsConnected(true);
                newConnection.on('ReceiveNotification', (payload?: any) => {
                    fetchNotifications();
                    if (payload && payload.title && payload.body) {
                        // Mapear categoría si viene en el payload o usar 'default'
                        let type: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default';
                        if (payload.categoria === 'SUCCESS') type = 'success';
                        else if (payload.categoria === 'ERROR') type = 'error';
                        else if (payload.categoria === 'WARNING') type = 'warning';
                        else if (payload.categoria === 'INFO') type = 'info';

                        addToast(payload.title, payload.body, type, payload.url || undefined);
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
            isConnected,
            addToast
        }}>
            {children}

            {/* Real-time Vercel-style Toasts */}
            <div className="toast-container-vercel">
                {toasts.map(t => {
                    const toastType = t.type || 'default';
                    let IconComponent = Bell;
                    let typeClass = 'toast-vercel-default';

                    if (toastType === 'success') {
                        IconComponent = CheckCircle2;
                        typeClass = 'toast-vercel-success';
                    } else if (toastType === 'error') {
                        IconComponent = XCircle;
                        typeClass = 'toast-vercel-error';
                    } else if (toastType === 'warning') {
                        IconComponent = AlertCircle;
                        typeClass = 'toast-vercel-warning';
                    } else if (toastType === 'info') {
                        IconComponent = Info;
                        typeClass = 'toast-vercel-info';
                    }

                    return (
                        <div 
                            key={t.id} 
                            className={`toast-vercel ${typeClass} group cursor-pointer`}
                            onClick={() => {
                                if (t.url) {
                                    navigate(t.url);
                                }
                                setToasts(prev => prev.filter(x => x.id !== t.id));
                            }}
                        >
                            <div className={`toast-icon-wrapper toast-icon-${toastType}`}>
                                <IconComponent size={14} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                                <h4 className="text-xs font-semibold text-text-main leading-tight">{t.title}</h4>
                                <p className="text-[10px] text-text-dim leading-relaxed">{t.body}</p>
                                {t.url && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-brand font-bold uppercase mt-1">
                                        Ver detalle
                                    </span>
                                )}
                            </div>
                            <button 
                                className="text-text-dim hover:text-text-main ml-2 shrink-0 p-1 rounded hover:bg-surface-hover transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setToasts(prev => prev.filter(x => x.id !== t.id));
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
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
