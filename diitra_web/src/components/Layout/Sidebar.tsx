import { Home, ClipboardList, PenTool, BarChart3, Settings, ShieldCheck, Search, Sun, Moon, Users, LogOut, Award, X, Activity, ListChecks, Bell, Gavel, ExternalLink, Mail, Info, AlertTriangle, TrendingUp, GraduationCap, Globe, Calendar, Tag, BookOpen, Scale } from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../api/NotificationsContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { stripHtmlToText } from '../../utils/notificationText';

const NOTIF_PANEL_WIDTH = 380;

export const SIDEBAR_WIDTH = 248;
const COLLAPSE_VISIBLE_RATIO = 0.72;
const COLLAPSE_INSTANT_RATIO = 0.9;
const DRAG_CLICK_THRESHOLD = 4;
const SIDEBAR_TRANSITION_MS = 280;
const SIDEBAR_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface SidebarProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed: boolean;
    onCollapse: () => void;
    onExpand: () => void;
}

// Custom simple SVG icons to ensure consistency and speed

const ChevronRightIcon = ({ className = "w-3 h-3", size = 12 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const MoreHorizontalIcon = ({ className = "w-4 h-4", size = 16 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

const Sidebar = ({
    currentTheme,
    toggleTheme,
    isOpen,
    onClose,
    isCollapsed,
    onCollapse,
    onExpand
}: SidebarProps) => {
    const { logout, hasPermission, roles, isAdmin, isDocente, isEstudiante, isRevisor, user, roleDisplayName } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const searchShortcut = isMac ? '⌥K' : 'Alt+K';

    const [isDragging, setIsDragging] = useState(false);
    const [peekWidth, setPeekWidth] = useState<number | null>(null);
    const peekWidthRef = useRef<number | null>(null);

    const setPeek = (w: number | null) => {
        peekWidthRef.current = w;
        setPeekWidth(w);
    };

    const desktopWidth = peekWidth ?? (isCollapsed ? 0 : SIDEBAR_WIDTH);
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const sidebarReveal = isDesktop
        ? Math.min(1, Math.max(0, desktopWidth / SIDEBAR_WIDTH))
        : 1;
    const isSidebarClosing = isDesktop && sidebarReveal < 1;
    const bellRef = useRef<HTMLButtonElement>(null);
    const [notifPanelPos, setNotifPanelPos] = useState({ bottom: 0, left: 0, width: NOTIF_PANEL_WIDTH });
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const updateNotifPanelPos = useCallback(() => {
        if (!bellRef.current) return;
        const rect = bellRef.current.getBoundingClientRect();
        const panelWidth = Math.min(NOTIF_PANEL_WIDTH, window.innerWidth - 24);
        const bellCenterX = rect.left + rect.width / 2;
        const left = Math.min(
            Math.max(bellCenterX - panelWidth / 2, 16),
            window.innerWidth - panelWidth - 16
        );
        setNotifPanelPos({
            bottom: window.innerHeight - rect.top + 10,
            left,
            width: panelWidth
        });
    }, []);

    useEffect(() => {
        if (!isNotificationsOpen) return;
        updateNotifPanelPos();
        window.addEventListener('resize', updateNotifPanelPos);
        window.addEventListener('scroll', updateNotifPanelPos, true);
        return () => {
            window.removeEventListener('resize', updateNotifPanelPos);
            window.removeEventListener('scroll', updateNotifPanelPos, true);
        };
    }, [isNotificationsOpen, updateNotifPanelPos]);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(
        location.pathname.startsWith('/analiticas')
    );
    const [isUsersOpen, setIsUsersOpen] = useState(
        location.pathname.startsWith('/usuarios')
    );
    const [isParametrosOpen, setIsParametrosOpen] = useState(
        location.pathname.startsWith('/parametros-normativos')
    );

    useEffect(() => {
        if (location.pathname.startsWith('/analiticas')) {
            setIsAnalyticsOpen(true);
        }
        if (location.pathname.startsWith('/usuarios')) {
            setIsUsersOpen(true);
        }
        if (location.pathname.startsWith('/parametros-normativos')) {
            setIsParametrosOpen(true);
        }
    }, [location.pathname]);

    let notifications: any[] = [];
    let unreadCount = 0;
    let markAsRead = async (_uuid: string) => { };
    let markAllAsRead = async () => { };

    try {
        const notificationsData = useNotifications();
        notifications = notificationsData.notifications;
        unreadCount = notificationsData.unreadCount;
        markAsRead = notificationsData.markAsRead;
        markAllAsRead = notificationsData.markAllAsRead;
    } catch (e) {
        // Fallback if context is not loaded
    }

    const getNotificationIcon = (category: string) => {
        switch (category) {
            case 'INVESTIGACION': return <ExternalLink size={12} className="text-info" />;
            case 'SISTEMA': return <Info size={12} className="text-text-dim" />;
            case 'URGENTE': return <AlertTriangle size={12} className="text-error" />;
            default: return <Mail size={12} className="text-text-dim" />;
        }
    };

    const handleNotificationClick = async (n: any) => {
        if (!n.leido) {
            await markAsRead(n.uuid);
        }

        if (n.url_accion) {
            navigate(n.url_accion);
            setIsNotificationsOpen(false);
        }
    };

    interface MenuItem {
        name: string;
        icon: any;
        path: string;
        roles?: string[];
        permission?: string;
        group: number;
        hasChevron?: boolean;
        indent?: boolean;
    }

    const allMenuItems: MenuItem[] = [
        // Grupo 1: Principal
        { name: 'Tablero', icon: Home, path: '/dashboard', roles: ['ANY'], group: 1 },
        { name: 'Investigación', icon: ClipboardList, path: '/investigacion', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'], group: 1 },
        { name: 'Mis Proyectos', icon: ListChecks, path: '/investigacion/mis-proyectos', roles: ['DIITRA_DOCENTE', 'DOCENTE_INV', 'DIITRA_ESTUDIANTE'], group: 1 },
        { name: 'Adopción Proyectos', icon: Award, path: '/investigacion/adopcion', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'], group: 1 },

        // Grupo 2: Procesos y Analíticas
        { name: 'Convocatorias', icon: PenTool, path: '/convocatorias', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'], group: 2 },
        { name: 'Mis Revisiones', icon: ShieldCheck, path: '/revisiones', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_REVISOR_EXTERNO'], group: 2 },
        { name: 'Arbitraje', icon: Gavel, path: '/arbitraje', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 2 },
        { name: 'Verificación', icon: ShieldCheck, path: '/verificacion', roles: ['ANY'], group: 2 },
        { name: 'Analíticas', icon: BarChart3, path: '/analiticas', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 2, hasChevron: true },

        // Grupo 3: Sistema y Admin
        { name: 'Notificaciones', icon: Bell, path: '/notificaciones', roles: ['ANY'], group: 3 },
        { name: 'Derechos ARCO', icon: ShieldCheck, path: '/derechos-arco', roles: ['ANY'], group: 3 },
        { name: 'Usuarios', icon: Users, path: '/usuarios', permission: 'USUARIOS:VER', group: 3, hasChevron: true },
        { name: 'Auditoría', icon: Activity, path: '/auditoria', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 3 },
        { name: 'Panel LOPDP', icon: ShieldCheck, path: '/admin/lopdp', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 3 },
        { name: 'Grupos', icon: Award, path: '/grupos', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'], group: 3 },
        { name: 'Correos', icon: Mail, path: '/admin/emails', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 3 },
        { name: 'Parámetros', icon: Scale, path: '/parametros-normativos', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'], group: 3, hasChevron: true },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (item.path === '/derechos-arco' && isAdmin) return false;

        if (isAdmin) return true;
        if (item.permission) {
            const [module, op] = item.permission.split(':');
            return hasPermission(module, op);
        }
        if (item.roles) {
            if (item.roles.includes('ANY')) return true;
            const checkRoles = item.roles.map(r => r.toUpperCase());
            if (checkRoles.includes('DIITRA_DOCENTE') || checkRoles.includes('DOCENTE_INV')) {
                if (isDocente) return true;
            }
            if (checkRoles.includes('DIITRA_ESTUDIANTE')) {
                if (isEstudiante) return true;
            }
            if (checkRoles.includes('DIITRA_REVISOR_EXTERNO')) {
                if (isRevisor) return true;
            }
            return item.roles.some(r => roles.includes(r.toUpperCase()));
        }
        return true;
    });



    const activeItem = menuItems.reduce<typeof menuItems[0] | null>((best, item) => {
        const isMatch = location.pathname === item.path
            || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        if (isMatch && (!best || item.path.length > best.path.length)) {
            return item;
        }
        return best;
    }, null);

    const group1 = menuItems.filter(item => item.group === 1);
    const group2 = menuItems.filter(item => item.group === 2);
    const group3 = menuItems.filter(item => item.group === 3);

    const animatePeekWidth = (target: number, onDone?: () => void) => {
        const from = peekWidthRef.current ?? (isCollapsed ? 0 : SIDEBAR_WIDTH);
        setPeek(from);

        if (target === 0) {
            onDone?.();
        }

        requestAnimationFrame(() => {
            setPeek(target);
            window.setTimeout(() => {
                if (target !== 0) {
                    onDone?.();
                }
                setPeek(null);
            }, SIDEBAR_TRANSITION_MS);
        });
    };

    const collapseWithAnimation = () => {
        if (isCollapsed) return;
        animatePeekWidth(0, onCollapse);
    };

    const cleanupDragListeners = (
        doDrag: (e: MouseEvent) => void,
        stopDrag: () => void
    ) => {
        document.body.style.removeProperty('user-select');
        document.body.style.removeProperty('cursor');
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
    };

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsDragging(true);
        setPeek(peekWidthRef.current ?? SIDEBAR_WIDTH);
        const startX = mouseDownEvent.clientX;
        let maxPull = 0;

        const stopDrag = () => {
            setIsDragging(false);
            cleanupDragListeners(doDrag, stopDrag);

            const currentWidth = peekWidthRef.current ?? SIDEBAR_WIDTH;
            const clicked = maxPull <= DRAG_CLICK_THRESHOLD;
            const shouldCollapse = clicked || currentWidth <= SIDEBAR_WIDTH * COLLAPSE_VISIBLE_RATIO;

            if (shouldCollapse) {
                collapseWithAnimation();
            } else {
                animatePeekWidth(SIDEBAR_WIDTH);
            }
        };

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const pull = Math.max(0, startX - mouseMoveEvent.clientX);
            maxPull = Math.max(maxPull, pull);

            if (pull >= SIDEBAR_WIDTH * COLLAPSE_INSTANT_RATIO) {
                setIsDragging(false);
                cleanupDragListeners(doDrag, stopDrag);
                onCollapse();
                setPeek(null);
                return;
            }

            setPeek(Math.max(0, SIDEBAR_WIDTH - pull));
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const startExpandDrag = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsDragging(true);
        setPeek(0);
        const startX = mouseDownEvent.clientX;
        let lastReveal = 0;

        const stopDrag = () => {
            setIsDragging(false);
            cleanupDragListeners(doDrag, stopDrag);

            const currentWidth = peekWidthRef.current ?? 0;
            const clicked = lastReveal <= DRAG_CLICK_THRESHOLD;
            const shouldExpand = clicked || currentWidth >= SIDEBAR_WIDTH * COLLAPSE_VISIBLE_RATIO;

            if (shouldExpand) {
                animatePeekWidth(SIDEBAR_WIDTH, onExpand);
            } else {
                animatePeekWidth(0);
            }
        };

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const reveal = Math.max(0, mouseMoveEvent.clientX - startX);
            lastReveal = reveal;

            if (reveal >= SIDEBAR_WIDTH * COLLAPSE_INSTANT_RATIO) {
                setIsDragging(false);
                document.body.style.removeProperty('user-select');
                document.body.style.removeProperty('cursor');
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
                onExpand();
                setPeek(null);
                return;
            }

            setPeek(Math.min(SIDEBAR_WIDTH, reveal));
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const triggerCommandPalette = () => {
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            altKey: true,
            bubbles: true
        });
        window.dispatchEvent(event);
    };

    const renderMenuItem = (item: typeof allMenuItems[0]) => {
        const isActive = item === activeItem;

        if (item.name === 'Analíticas') {
            const isMenuOpen = isAnalyticsOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${
                            isActive
                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                        }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsAnalyticsOpen(true);
                                if (!location.pathname.startsWith('/analiticas')) {
                                    navigate('/analiticas');
                                }
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                isActive
                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                            }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[13px] tracking-tight truncate ${
                                isActive ? 'font-semibold text-text-main' : 'font-medium'
                            }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsAnalyticsOpen(!isAnalyticsOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title={isMenuOpen ? "Colapsar" : "Expandir"}
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${
                                isMenuOpen ? 'rotate-90' : ''
                            } ${
                                isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                            }`} />
                        </button>
                    </div>
                    
                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Métricas de I+D', path: '/analiticas?tab=general', icon: TrendingUp },
                                { name: 'Cumplimiento CACES', path: '/analiticas?tab=caces', icon: ShieldCheck },
                                { name: 'Proyectos y Producción', path: '/analiticas?tab=productos', icon: ClipboardList }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/analiticas' && (
                                    (subItem.path.includes('tab=general') && (!location.search || location.search.includes('tab=general'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );
                                
                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${
                                            isSubActive
                                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                                isSubActive
                                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                            }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[12px] tracking-tight truncate ${
                                                isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                            }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (item.name === 'Usuarios') {
            const isMenuOpen = isUsersOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${
                            isActive
                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                        }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsUsersOpen(true);
                                if (!location.pathname.startsWith('/usuarios')) {
                                    navigate('/usuarios');
                                }
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                isActive
                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                            }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[13px] tracking-tight truncate ${
                                isActive ? 'font-semibold text-text-main' : 'font-medium'
                            }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsUsersOpen(!isUsersOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title={isMenuOpen ? "Colapsar" : "Expandir"}
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${
                                isMenuOpen ? 'rotate-90' : ''
                            } ${
                                isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                            }`} />
                        </button>
                    </div>
                    
                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Docentes', path: '/usuarios?type=DOCENTE', icon: GraduationCap },
                                { name: 'Alumnos', path: '/usuarios?type=ESTUDIANTE', icon: Users },
                                { name: 'Externos', path: '/usuarios?type=EXTERNO', icon: Globe }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/usuarios' && (
                                    (subItem.path.includes('type=DOCENTE') && (!location.search || location.search.includes('type=DOCENTE'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );
                                
                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${
                                            isSubActive
                                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                                isSubActive
                                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                            }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[12px] tracking-tight truncate ${
                                                isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                            }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (item.path === '/parametros-normativos') {
            const isMenuOpen = isParametrosOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${
                            isActive
                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                        }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsParametrosOpen(true);
                                if (!location.pathname.startsWith('/parametros-normativos')) {
                                    navigate('/parametros-normativos');
                                }
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                isActive
                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                            }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[13px] tracking-tight truncate ${
                                isActive ? 'font-semibold text-text-main' : 'font-medium'
                            }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsParametrosOpen(!isParametrosOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title={isMenuOpen ? "Colapsar" : "Expandir"}
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${
                                isMenuOpen ? 'rotate-90' : ''
                            } ${
                                isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                            }`} />
                        </button>
                    </div>
                    
                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Líneas de Investigación', path: '/parametros-normativos?tab=lineas', icon: BookOpen },
                                { name: 'Períodos Académicos', path: '/parametros-normativos?tab=periodos', icon: Calendar },
                                { name: 'Tipos de Producto', path: '/parametros-normativos?tab=productos', icon: Tag },
                                { name: 'Dominios Académicos', path: '/parametros-normativos?tab=dominios', icon: Globe },
                                { name: 'Indicadores CACES', path: '/parametros-normativos?tab=indicadores', icon: Activity }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/parametros-normativos' && (
                                    (subItem.path.includes('tab=lineas') && (!location.search || location.search.includes('tab=lineas'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );
                                
                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${
                                            isSubActive
                                                ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                                                isSubActive
                                                    ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                    : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                            }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[12px] tracking-tight truncate ${
                                                isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                            }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                    if (onClose) onClose();
                }}
                className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ${
                    item.indent ? 'ml-2 pl-2.5' : ''
                } ${
                    isActive
                        ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                }`}
            >
                <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${
                        isActive
                            ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                            : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                    }`}>
                        <item.icon size={item.indent ? 13 : 15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    </div>
                    <span className={`text-[13px] tracking-tight truncate ${
                        item.indent ? 'text-[12px]' : ''
                    } ${
                        isActive ? 'font-semibold text-text-main' : 'font-medium'
                    }`}>
                        {item.name}
                    </span>
                </div>
                {item.hasChevron && (
                    <ChevronRightIcon className={`shrink-0 ml-1.5 transition-colors ${
                        isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                    }`} />
                )}
            </Link>
        );
    };

    const userInitials = user?.nombre_completo
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'JD';

    const username = user?.usuario?.split('@')[0] || user?.nombre_completo || 'jorgedoicela';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside
                style={{
                    width: isDesktop ? desktopWidth : undefined,
                    transition: isDesktop && !isDragging
                        ? `width ${SIDEBAR_TRANSITION_MS}ms ${SIDEBAR_EASING}, opacity 200ms ease`
                        : undefined
                }}
                className={`
          fixed inset-y-0 left-0 z-[70] bg-bg-deep border-r border-border-thin outline-none shrink-0 overflow-hidden
          lg:translate-x-0 lg:static lg:h-screen lg:relative
          ${isOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-auto'}
          ${isCollapsed && peekWidth === null ? 'lg:border-r-0 lg:opacity-0 lg:pointer-events-none lg:p-0' : 'lg:opacity-100'}
        `}
            >
                <div
                    className="flex flex-col h-full pt-4 pb-3"
                    style={{
                        width: SIDEBAR_WIDTH,
                        minWidth: SIDEBAR_WIDTH,
                        opacity: sidebarReveal,
                        transition: isDesktop && !isDragging
                            ? `opacity ${SIDEBAR_TRANSITION_MS}ms ${SIDEBAR_EASING}`
                            : undefined
                    }}
                >
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 text-text-dim hover:text-text-main lg:hidden"
                >
                    <X size={20} />
                </button>

                {/* Brand Header */}
                <Link
                    to="/dashboard"
                    onClick={() => {
                        if (onClose) onClose();
                    }}
                    className="px-4 mb-4 flex items-center gap-2 cursor-pointer select-none no-underline"
                >
                    <img
                        src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'}
                        alt="DIITRA Logo"
                        className="h-6 w-auto object-contain"
                    />
                    <span className="text-[14px] font-semibold text-text-main tracking-[0.2em] font-sans uppercase">
                        DIITRA
                    </span>
                </Link>

                {/* Navigator Search */}
                <div className="px-3 mb-4">
                    <div
                        onClick={triggerCommandPalette}
                        className="flex h-8.5 items-center gap-2 px-2.5 bg-surface border border-border-thin rounded-md group hover:border-text-dim/50 hover:bg-surface-hover/30 transition-all cursor-pointer"
                    >
                        <Search size={13} className="text-text-dim group-hover:text-text-main transition-colors" />
                        <span className="text-xs text-text-dim flex-1 font-medium group-hover:text-text-main transition-colors">Buscar</span>
                        <kbd className="text-[10px] font-sans font-semibold bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim shadow-sm">{searchShortcut}</kbd>
                    </div>
                </div>

                {/* Navigation list */}
                <nav className="flex-1 px-2.5 space-y-1 overflow-y-auto pr-1 select-none outline-none [mask-image:linear-gradient(to_bottom,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
                    {/* Grupo 1 */}
                    {group1.map(renderMenuItem)}

                    {group2.length > 0 && (
                        <>
                            <hr className="border-border-thin my-3" />
                            {group2.map(renderMenuItem)}
                        </>
                    )}

                    {group3.length > 0 && (
                        <>
                            <hr className="border-border-thin my-3" />
                            {group3.map(renderMenuItem)}
                        </>
                    )}
                </nav>

                {/* Vercel Footer profile section */}
                <div className="px-2.5 pt-3 mt-auto relative shrink-0 bg-bg-deep">
                    <div
                        className="pointer-events-none absolute -top-5 left-0 right-0 h-5 bg-gradient-to-b from-transparent to-bg-deep z-10"
                        aria-hidden
                    />
                    {isUserMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                            <div className="absolute bottom-14 left-3 right-3 bg-bg-deep border border-border-thin rounded-lg shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in duration-200 slide-in-from-bottom-2">
                                <div
                                    onClick={() => {
                                        toggleTheme();
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-dim hover:text-text-main hover:bg-surface-hover rounded-md cursor-pointer transition-colors"
                                >
                                    {currentTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                    <span>{currentTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                                </div>
                                <div
                                    onClick={() => {
                                        navigate('/configuracion');
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-dim hover:text-text-main hover:bg-surface-hover rounded-md cursor-pointer transition-colors"
                                >
                                    <Settings size={14} />
                                    <span>Configuración</span>
                                </div>
                                <hr className="border-border-thin my-1" />
                                <div
                                    onClick={async () => {
                                        setIsUserMenuOpen(false);
                                        await logout();
                                        navigate('/');
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-error hover:bg-error/10 rounded-md cursor-pointer transition-colors"
                                >
                                    <LogOut size={14} />
                                    <span>Cerrar Sesión</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-between gap-1 p-1 select-none">
                        <div
                            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1 group py-1"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            {/* User Avatar with circular hover shade wrapper */}
                            <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-surface-hover/50 transition-colors shrink-0">
                                <div className="w-5.5 h-5.5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-semibold text-white uppercase">
                                    {userInitials}
                                </div>
                            </div>
                            {/* Username & Role */}
                            <div className="flex-1 min-w-0 flex flex-col items-start leading-tight">
                                <span className="text-[12px] font-semibold text-text-main truncate w-full group-hover:text-text-main transition-colors">
                                    {user?.nombre_completo || username}
                                </span>
                                <span className="text-[9px] font-semibold text-text-dim truncate w-full uppercase tracking-wider mt-0.5">
                                    {roleDisplayName}
                                </span>
                            </div>
                            {/* Options Button with circular hover shade wrapper */}
                            <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-surface-hover/50 text-text-dim group-hover:text-text-main transition-colors shrink-0">
                                <MoreHorizontalIcon className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative shrink-0 ml-1.5">
                            <button
                                ref={bellRef}
                                onClick={() => {
                                    if (!isNotificationsOpen) updateNotifPanelPos();
                                    setIsNotificationsOpen(!isNotificationsOpen);
                                }}
                                className="w-7 h-7 rounded-full hover:bg-surface-hover/50 text-text-dim hover:text-text-main transition-colors relative flex items-center justify-center cursor-pointer"
                                title="Ver notificaciones"
                            >
                                <Bell size={14} strokeWidth={1.5} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                </div>

                {isSidebarClosing && (
                    <div
                        aria-hidden
                        className="absolute inset-y-0 right-0 pointer-events-none z-10"
                        style={{
                            width: Math.max(48, SIDEBAR_WIDTH - desktopWidth + 32),
                            background: 'linear-gradient(to right, transparent, var(--bg))',
                            opacity: 1 - sidebarReveal,
                            transition: isDragging
                                ? undefined
                                : `opacity ${SIDEBAR_TRANSITION_MS}ms ${SIDEBAR_EASING}`
                        }}
                    />
                )}

                {/* Drag Resizer Handle */}
                {!isCollapsed && (
                    <div
                        onMouseDown={startResizing}
                        className="hidden lg:block absolute top-0 -right-1.5 bottom-0 w-3 cursor-col-resize z-[80] outline-none group"
                        title="Clic para ocultar · Arrastrar para ajustar"
                    >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border-thin/60 group-hover:bg-text-dim/50 group-active:bg-text-dim/70 transition-colors" />
                    </div>
                )}
            </aside>

            {isNotificationsOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setIsNotificationsOpen(false)} />
                    <div
                        className="fixed z-[100] bg-bg-deep border border-border-thin rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-200"
                        style={{
                            bottom: notifPanelPos.bottom,
                            left: notifPanelPos.left,
                            width: notifPanelPos.width
                        }}
                    >
                        <header className="p-3 border-b border-border-thin bg-surface/30 flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[10px] font-semibold text-text-main uppercase tracking-widest">Notificaciones</h4>
                                {unreadCount > 0 && (
                                    <span className="bg-text-main text-bg-deep px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tighter">
                                        {unreadCount} Nuevas
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[9px] font-semibold text-brand hover:underline uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                                >
                                    Marcar todo leído
                                </button>
                            )}
                        </header>

                        <div className="max-h-[380px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                    <Bell size={20} className="mx-auto text-text-dim opacity-20" />
                                    <p className="text-[9px] text-text-dim uppercase font-semibold tracking-widest">Todo en orden</p>
                                </div>
                            ) : (
                                notifications.map((n: any) => (
                                    <div
                                        key={n.uuid}
                                        className={`p-3 border-b border-border-thin last:border-0 hover:bg-surface/50 transition-colors cursor-pointer group ${!n.leido ? 'bg-surface/30' : 'opacity-70'}`}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        <div className="flex gap-2.5">
                                            <div className="mt-0.5 shrink-0">
                                                {getNotificationIcon(n.categoria)}
                                            </div>
                                            <div className="space-y-0.5 flex-1 min-w-0 overflow-hidden">
                                                <div className="flex justify-between items-start gap-1">
                                                    <h5 className="text-[11px] font-semibold text-text-main leading-tight truncate">{stripHtmlToText(n.titulo)}</h5>
                                                    <span className="text-[8px] font-mono text-text-dim shrink-0">{new Date(n.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[10px] text-text-dim leading-relaxed line-clamp-2 break-words">{stripHtmlToText(n.mensaje)}</p>
                                                {n.url_accion && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-text-main uppercase mt-1 hover:underline cursor-pointer">
                                                        Ir al detalle
                                                    </span>
                                                )}
                                            </div>
                                            {!n.leido && (
                                                <div className="w-1.5 h-1.5 bg-text-main rounded-full mt-1 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <footer className="p-2 border-t border-border-thin bg-surface/30 text-center">
                            <button
                                onClick={() => { setIsNotificationsOpen(false); navigate('/notificaciones'); }}
                                className="text-[9px] font-semibold text-text-dim hover:text-text-main uppercase tracking-widest transition-colors bg-transparent border-0 cursor-pointer"
                            >
                                Ver todo el historial
                            </button>
                        </footer>
                    </div>
                </>,
                document.body
            )}

            {/* Zona de arrastre para reabrir (estilo Vercel) */}
            {isCollapsed && (
                <div
                    onMouseDown={startExpandDrag}
                    className="hidden lg:block fixed inset-y-0 left-0 w-3 z-[65] cursor-col-resize"
                    title="Arrastrar para mostrar panel"
                />
            )}
        </>
    );
};

export default Sidebar;
