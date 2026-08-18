import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    actionLabel?: string;
    onUndo?: () => void | Promise<void>;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (uuid: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (uuid: string) => Promise<void>;
    clearReadNotifications: () => Promise<void>;
    isLoading: boolean;
    isConnected: boolean;
    addToast: (title: string, body: string, type?: 'success' | 'error' | 'warning' | 'info' | 'default', url?: string, onUndo?: () => void | Promise<void>, actionLabel?: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

class ToastErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.warn('Toast rendering failed due to external DOM interference (handled locally):', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

interface VercelToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
    navigate: (url: string) => void;
}

const VercelToastItem: React.FC<VercelToastItemProps> = ({ toast, onDismiss, navigate }) => {
    const [isUndoing, setIsUndoing] = useState(false);
    const toastType = toast.type || 'default';
    const totalDuration = toast.onUndo ? 8000 : 5000;
    const remainingTimeRef = useRef<number>(totalDuration);
    const startTimeRef = useRef<number>(Date.now());
    const timerIdRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback(() => {
        if (timerIdRef.current) clearTimeout(timerIdRef.current);
        startTimeRef.current = Date.now();
        timerIdRef.current = setTimeout(() => {
            onDismiss(toast.id);
        }, Math.max(remainingTimeRef.current, 1500));
    }, [toast.id, onDismiss]);

    const pauseTimer = useCallback(() => {
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
            const elapsed = Date.now() - startTimeRef.current;
            remainingTimeRef.current = Math.max(remainingTimeRef.current - elapsed, 1500);
        }
    }, []);

    useEffect(() => {
        if (!isUndoing) {
            startTimer();
        } else {
            pauseTimer();
        }
        return () => {
            if (timerIdRef.current) clearTimeout(timerIdRef.current);
        };
    }, [isUndoing, startTimer, pauseTimer]);

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
            className={`toast-vercel ${typeClass} group cursor-pointer items-center`}
            translate="no"
            onMouseEnter={pauseTimer}
            onMouseLeave={startTimer}
            onTouchStart={pauseTimer}
            onTouchEnd={startTimer}
            onTouchCancel={startTimer}
            onClick={() => {
                if (toast.url && !isUndoing) {
                    navigate(toast.url);
                }
                onDismiss(toast.id);
            }}
        >
            <div className={`toast-icon-wrapper toast-icon-${toastType} self-start mt-0.5`}>
                <IconComponent size={14} />
            </div>
            <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-semibold text-text-main leading-snug">{toast.title}</h4>
                <p className="text-[10px] text-text-dim leading-normal mt-0.5">{toast.body}</p>
            </div>
            {/* Divisoria visual centrada de altura media */}
            {(toast.url || toast.onUndo) && (
                <div className="w-px h-5 bg-border-thin shrink-0 ml-1.5 self-center" />
            )}

            {/* Botón de acción con área de clic extendida (toda la altura del toast de forma invisible) */}
            {toast.url && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(toast.url!);
                        onDismiss(toast.id);
                    }}
                    className="group/btn self-stretch -my-3 flex items-center justify-center px-3.5 bg-transparent border-0 cursor-pointer select-none"
                >
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand group-hover/btn:underline">
                        {toast.actionLabel || 'Ver'}
                    </span>
                </button>
            )}

            {toast.onUndo && (
                <button
                    type="button"
                    disabled={isUndoing}
                    onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsUndoing(true);
                        try {
                            await toast.onUndo?.();
                        } catch (err) {
                            console.error("[Toast Undo] Error al revertir la acción:", err);
                        } finally {
                            setIsUndoing(false);
                            onDismiss(toast.id);
                        }
                    }}
                    className="group/btn self-stretch -my-3 flex items-center justify-center px-3.5 bg-transparent border-0 cursor-pointer select-none disabled:opacity-50"
                >
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 group-hover/btn:underline">
                        {isUndoing ? "..." : "Deshacer"}
                    </span>
                </button>
            )}

            {/* Botón cerrar */}
            <button 
                type="button"
                className="text-text-dim hover:text-text-main p-2 -mr-1 rounded hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center self-center shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                }}
                title="Cerrar notificación"
            >
                <X size={14} />
            </button>
        </div>
    );
};

const playNotificationSound = (type: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default') => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();

        // Función para reproducir un tono premium con armónicos y filtro de calidez
        const playPremiumTone = (freqs: number[], duration: number, toneType: 'success' | 'error' | 'info') => {
            if (audioCtx.state === 'suspended') return;

            const now = audioCtx.currentTime;

            // Filtro paso bajo para cortar agudos ásperos y dar un timbre cálido (estilo macOS)
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(toneType === 'error' ? 700 : 1600, now);
            filter.connect(audioCtx.destination);

            // Control de volumen principal con curva de decaimiento suave (Fade In de 8ms para evitar clicks)
            const mainGain = audioCtx.createGain();
            mainGain.gain.setValueAtTime(0, now);
            mainGain.gain.linearRampToValueAtTime(0.08, now + 0.008);
            mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            mainGain.connect(filter);

            // Generar osciladores para fundamental y armónicos secundarios
            freqs.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                const oscGain = audioCtx.createGain();
                // Fundamental fuerte, armónicos atenuados
                const vol = idx === 0 ? 0.8 : 0.35;
                oscGain.gain.setValueAtTime(vol, now);

                osc.connect(oscGain);
                oscGain.connect(mainGain);

                osc.start(now);
                osc.stop(now + duration);
            });
        };

        const playSynthesizedFallback = () => {
            if (type === 'success') {
                // Cascacada de campanillas brillantes en acorde mayor (Do, Mi, Sol)
                playPremiumTone([523.25, 1046.50], 0.25, 'success');
                setTimeout(() => {
                    playPremiumTone([659.25, 1318.51], 0.28, 'success');
                }, 75);
                setTimeout(() => {
                    playPremiumTone([783.99, 1567.98], 0.35, 'success');
                }, 150);
            } else if (type === 'error' || type === 'warning') {
                // Vibración grave, disonante pero suave (200Hz + 204Hz) que alerta sin asustar
                playPremiumTone([200, 204], 0.35, 'error');
            } else {
                // Repique clásico doble ("ping-pong")
                playPremiumTone([880, 1760], 0.2, 'info');
                setTimeout(() => {
                    playPremiumTone([1046.50, 2093.00], 0.3, 'info');
                }, 90);
            }
        };

        // Si es una notificación estándar (default o info), intentar reproducir el mp3 personalizado
        if (type === 'default' || type === 'info') {
            const audio = new Audio(`${import.meta.env.BASE_URL}notification.mp3`);
            audio.volume = 0.5; // volumen moderado agradable
            audio.play().catch((err) => {
                console.warn('Fallo al reproducir audio personalizado, usando fallback sintetizado:', err);
                playSynthesizedFallback();
            });
        } else {
            // Para feedback de interacción (success, error, warning), usar el sintetizador directamente
            playSynthesizedFallback();
        }
    } catch (e) {
        console.warn('Web Audio API notification sound failed to play:', e);
    }
};

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

    const addToast = useCallback((title: string, body: string, type: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default', url?: string, onUndo?: () => void | Promise<void>, actionLabel?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        // Limpiar etiquetas HTML para que el toast en app se vea limpio y profesional
        const cleanBody = body.replace(/<\/?[^>]+(>|$)/g, "");
        
        setToasts(prev => [...prev, { id, title, body: cleanBody, type, url, actionLabel, onUndo }]);
        
        // ==========================================
        // CONTROL DE REPRODUCCIÓN SONORA (EVITAR DOBLE SONIDO)
        // ==========================================
        // 1. Si es feedback de interacción ('success', 'error', 'warning'), siempre se reproduce el sonido sintetizado.
        // 2. Si es una notificación en tiempo real ('default', 'info'), SOLO reproducimos el sonido en la pestaña web
        //    si el usuario la tiene enfocada. Si está en segundo plano, el sonido lo emitirá el Sistema Operativo
        //    al lanzar el popup nativo de escritorio (evitando que se superpongan o suenen duplicados).
        if (type === 'success' || type === 'error' || type === 'warning' || document.hasFocus()) {
            playNotificationSound(type);
        }

        // El tiempo de vida y descarte automático es gestionado individualmente por VercelToastItem para soportar pausa en hover / touch

        // Evitar duplicar la notificación nativa si Web Push está activo y sincronizado en este navegador
        const isWebPushActive = localStorage.getItem('web_push_active') === 'true';

        // ==========================================
        // CONTROL DE POPUPS DE ESCRITORIO (EVITAR SPAM Y SUPERPOSICIÓN DE UI)
        // ==========================================
        // IMPORTANTE:
        // - Solo lanzamos la notificación nativa si la pestaña NO está enfocada (!document.hasFocus()). Si está enfocado,
        //   el usuario ya ve el Toast React en pantalla y el popup nativo del SO encima sería redundante e invasivo.
        // - Limitamos los popups de escritorio a notificaciones reales del servidor ('default', 'info'), nunca para
        //   acciones simples como "Cambios guardados con éxito" o errores de formulario de la UI local.
        const shouldShowNative = !isWebPushActive && 
                                 (type === 'default' || type === 'info') && 
                                 !document.hasFocus() && 
                                 'Notification' in window && 
                                 Notification.permission === 'granted';

        if (shouldShowNative) {
            try {
                const n = new window.Notification(title, {
                    body: cleanBody,
                    icon: `${import.meta.env.BASE_URL}logo_fondo_negro.png`
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

    const deleteNotification = async (uuid: string) => {
        try {
            await api.delete(`/Admin/notifications/${uuid}`);
            setNotifications(prev => prev.filter(n => n.uuid !== uuid));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearReadNotifications = async () => {
        try {
            await api.delete('/Admin/notifications/clear-read');
            setNotifications(prev => prev.filter(n => !n.leido));
        } catch (error) {
            console.error('Error clearing read notifications:', error);
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
                    
                    // Dispatch custom event to notify components that projects state might have changed
                    window.dispatchEvent(new CustomEvent('diitra-projects-changed'));

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

    // Sincronizar contador de no leídos en el título de la pestaña (Tab Title Badge)
    useEffect(() => {
        const updateTitle = () => {
            let currentTitle = document.title;
            // Limpiar cualquier badge previo ej. (3) o (99+)
            currentTitle = currentTitle.replace(/^\(\d+\+?\)\s*/, '');
            if (unreadCount > 0) {
                document.title = `(${unreadCount}) ${currentTitle}`;
            } else {
                document.title = currentTitle;
            }
        };

        updateTitle();

        // MutationObserver para capturar cambios en el título por navegación u otras páginas
        const titleElement = document.querySelector('title');
        if (!titleElement) return;

        const observer = new MutationObserver(() => {
            observer.disconnect();
            updateTitle();
            observer.observe(titleElement, { childList: true });
        });

        observer.observe(titleElement, { childList: true });

        return () => {
            observer.disconnect();
        };
    }, [unreadCount]);

    return (
        <NotificationsContext.Provider value={{ 
            notifications, 
            unreadCount, 
            fetchNotifications, 
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearReadNotifications,
            isLoading,
            isConnected,
            addToast
        }}>
            {children}

            {/* Real-time Vercel-style Toasts */}
            <ToastErrorBoundary key={toasts.length}>
                <div className="toast-container-vercel">
                    {toasts.map(t => (
                        <VercelToastItem
                            key={t.id}
                            toast={t}
                            onDismiss={(id) => setToasts(prev => prev.filter(x => x.id !== id))}
                            navigate={navigate}
                        />
                    ))}
                </div>
            </ToastErrorBoundary>
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
