import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import Sidebar from './Sidebar';
import { CommandPalette } from '../Common/CommandPalette';
import { Menu, MoreHorizontal } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import { HelpModal } from './HelpModal';
import api from '../../api/axios_config';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const getPageTitle = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Panel de Control';
    if (pathname === '/settings') return 'Configuración';
    if (pathname === '/analiticas') return 'Analíticas';
    if (pathname === '/notificaciones') return 'Notificaciones';
    if (pathname === '/usuarios') return 'Gestión de Usuarios';
    if (pathname === '/auditoria') return 'Auditoría Forense';
    if (pathname === '/grupos') return 'Grupos de Investigación';
    if (pathname === '/configuracion') return 'Configuración del Sistema';
    if (pathname === '/investigacion') return 'Proyectos de I+D+i';
    if (pathname === '/investigacion/mis-proyectos') return 'Mis Proyectos';
    if (pathname.startsWith('/investigacion/monitoreo/')) return 'Monitoreo de Proyecto';
    if (pathname === '/convocatorias') return 'Convocatorias';
    if (pathname === '/revisiones') return 'Revisiones por Pares';
    if (pathname.startsWith('/revisiones/')) return 'Evaluación de Proyecto';
    if (pathname === '/arbitraje') return 'Arbitraje';
    if (pathname.startsWith('/arbitraje/proyecto/')) return 'Arbitraje de Proyecto';
    if (pathname === '/verify') return 'Verificación Documental';
    return '';
};

const DashboardLayout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
    useAuth();
    const location = useLocation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('sidebar_width');
        return saved ? parseInt(saved, 10) : 240;
    });
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        const initWebPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Este navegador no soporta notificaciones Web Push.');
                return;
            }

            try {
                // 1. Registrar Service Worker de forma explícita
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                // 2. Esperar a que el service worker esté completamente listo
                await navigator.serviceWorker.ready;

                // 3. Solicitar permiso para mostrar notificaciones si no está decidido
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        console.log('El usuario rechazó los permisos de notificación.');
                        return;
                    }
                } else if (Notification.permission === 'denied') {
                    console.log('Permiso de notificación denegado previamente.');
                    return;
                }

                // 4. Suscribirse al servidor de Push con la llave VAPID pública generada
                const VAPID_PUBLIC_KEY = 'BD70Tf6OvtNDv7woB_utltQMF-NeJnLXqKyQ9UuEOC5YlDVfZgEKrsE1Fgkut8dPzQrPWhRGZXZeWZeTHahIhRc';
                
                const urlBase64ToUint8Array = (base64String: string) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding)
                        .replace(/\-/g, '+')
                        .replace(/_/g, '/');

                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);

                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                    console.log('Nueva suscripción Web Push creada:', subscription);
                }

                // 5. Condensar la suscripción para que quepa de forma segura en el límite de 512 caracteres de la BD
                const subJson = subscription.toJSON();
                const tokenString = `${subJson.endpoint}|${subJson.keys?.p256dh || ''}|${subJson.keys?.auth || ''}`;

                await api.post('/Admin/notifications/subscribe', {
                    device_token: tokenString,
                    plataforma: 'web_push'
                });
                console.log('Suscripción Web Push sincronizada profesionalmente con el servidor.');
            } catch (error) {
                console.error('Error al inicializar las notificaciones Web Push nativas:', error);
            }
        };

        // Retardo estratégico de 2 segundos para no interferir con la carga crítica del dashboard
        const timer = setTimeout(() => {
            initWebPush();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleCollapseToggle = () => {
        setIsCollapsed(prev => {
            const newVal = !prev;
            localStorage.setItem('sidebar_collapsed', newVal.toString());
            return newVal;
        });
    };

    const handleWidthChange = (w: number) => {
        setSidebarWidth(w);
        localStorage.setItem('sidebar_width', w.toString());
    };

    return (
        <div className="flex h-screen w-full bg-bg-deep overflow-hidden font-sans selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <CommandPalette />

            <Sidebar
                currentTheme={theme}
                toggleTheme={toggleTheme}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                width={sidebarWidth}
                isCollapsed={isCollapsed}
                onWidthChange={handleWidthChange}
                onCollapseToggle={handleCollapseToggle}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop TopBar */}
                <header className="hidden lg:flex items-center justify-between h-14 bg-bg-deep border-b border-border-thin sticky top-0 z-[40]">
                    <div className="max-w-[1600px] mx-auto w-full px-4 md:px-10 flex items-center justify-between relative">
                        <div className="flex items-center gap-4">
                            {isCollapsed && (
                                <>
                                    <button
                                        onClick={handleCollapseToggle}
                                        className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors duration-150 cursor-pointer"
                                        title="Mostrar panel lateral"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-4 h-4"
                                        >
                                            <rect width="18" height="18" x="3" y="3" rx="2" />
                                            <path d="M9 3v18" />
                                        </svg>
                                    </button>
                                    <div className="h-4 w-[1px] bg-border-thin mx-1" />
                                </>
                            )}
                            <span className="section-label !text-text-main">Tecnológico Traversari</span>
                        </div>
                        
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-text-main pointer-events-none select-none">
                            {getPageTitle(location.pathname)}
                        </div>

                        <div className="flex items-center">
                            <button
                                onClick={() => setIsHelpOpen(true)}
                                className="p-1 text-text-main transition-colors duration-150 cursor-pointer flex items-center justify-center bg-transparent border-0 outline-none hover:scale-110"
                                title="Ayuda e Información"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-bg-deep border-b border-border-thin z-50">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-text-dim hover:text-text-main transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <img
                        src={theme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'}
                        alt="DIITRA"
                        className="h-7 w-auto object-contain"
                    />
                    <NotificationBell />
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                pathname={location.pathname}
            />
        </div>
    );
};

export default DashboardLayout;

