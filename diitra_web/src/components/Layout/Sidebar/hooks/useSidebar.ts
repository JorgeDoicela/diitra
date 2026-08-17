import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, PenTool, BarChart3, ShieldCheck, Users, Activity, Mail, Bell, Calendar, Award, ListChecks, Gavel, FileCode2, Sparkles } from 'lucide-react';
import { useAuth } from '../../../../api/AuthContext';
import { useNotifications } from '../../../../api/NotificationsContext';
import api from '../../../../api/axios_config';
import type { MenuItem, SidebarProject, NotificationItem } from '../types';

const NOTIF_PANEL_WIDTH = 380;
const SIDEBAR_WIDTH = 248;
const SIDEBAR_REOPEN_WIDTH = 212;
const SIDEBAR_WIDTH_MAX = 368;
const SIDEBAR_AUTO_COLLAPSE_AT = 140;
const SIDEBAR_OPEN_MIN = 160;
const COLLAPSE_VISIBLE_RATIO = 0.72;
const COLLAPSE_INSTANT_RATIO = 0.9;
const DRAG_CLICK_THRESHOLD = 4;
const SIDEBAR_TRANSITION_MS = 280;
const SIDEBAR_COLLAPSE_MS = 420;

interface UseSidebarProps {
    isCollapsed: boolean;
    onCollapse: () => void;
    onExpand: () => void;
}

export const useSidebar = ({ isCollapsed, onCollapse, onExpand }: UseSidebarProps) => {
    const { logout, hasPermission, roles, isAdmin, isDocente, isEstudiante, isRevisor, user, roleDisplayName } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const searchShortcut = isMac ? '⌥K' : 'Alt+K';

    const [expandedWidth, setExpandedWidth] = useState(() => {
        const saved = localStorage.getItem('sidebar_width');
        const parsed = saved ? parseInt(saved, 10) : SIDEBAR_WIDTH;
        if (!Number.isFinite(parsed)) return SIDEBAR_WIDTH;
        if (parsed < SIDEBAR_WIDTH) return SIDEBAR_REOPEN_WIDTH;
        return Math.min(SIDEBAR_WIDTH_MAX, parsed);
    });

    const prevCollapsedRef = useRef(isCollapsed);
    const skipNextExpandEffectRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosingAnim, setIsClosingAnim] = useState(false);
    const [peekWidth, setPeekWidth] = useState<number | null>(null);
    const peekWidthRef = useRef<number | null>(null);

    const setPeek = (w: number | null) => {
        peekWidthRef.current = w;
        setPeekWidth(w);
    };

    const desktopWidth = peekWidth ?? (isCollapsed ? 0 : expandedWidth);
    const contentWidth = peekWidth ?? (isCollapsed ? SIDEBAR_WIDTH : expandedWidth);
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const sidebarReveal = isDesktop
        ? Math.min(1, Math.max(0, desktopWidth / expandedWidth))
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
    const [isInvestigacionOpen, setIsInvestigacionOpen] = useState(
        location.pathname === '/investigacion' || (location.pathname.startsWith('/investigacion/') && !location.pathname.startsWith('/investigacion/mis-proyectos') && !location.pathname.startsWith('/investigacion/adopcion'))
    );
    const [isMisProyectosOpen, setIsMisProyectosOpen] = useState(
        location.pathname.startsWith('/investigacion/mis-proyectos')
    );
    const [sidebarProjects, setSidebarProjects] = useState<SidebarProject[]>([]);
    const [sidebarProjectsLoading, setSidebarProjectsLoading] = useState(false);
    const [showAllProjects, setShowAllProjects] = useState(false);

    const isFirstRender = useRef(true);

    const fetchSidebarProjects = useCallback(async () => {
        if (!user) return;
        try {
            setSidebarProjectsLoading(true);
            const endpoint = isAdmin ? '/projects' : '/projects/my';
            const res = await api.get(endpoint);

            const sorted = (res.data || []).sort((a: any, b: any) => {
                const dateA = a.fecha_modificacion || a.fecha_registro || '';
                const dateB = b.fecha_modificacion || b.fecha_registro || '';
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            setSidebarProjects(sorted);
        } catch (err) {
            console.error('[DIITRA Sidebar] Error al cargar proyectos para el menú:', err);
        } finally {
            setSidebarProjectsLoading(false);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        if (!user) {
            setSidebarProjects([]);
            return;
        }
        fetchSidebarProjects();
    }, [user, isAdmin, fetchSidebarProjects]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (location.pathname === '/investigacion' || location.pathname === '/investigacion/mis-proyectos') {
            fetchSidebarProjects();
        }
    }, [location.pathname, fetchSidebarProjects]);

    useEffect(() => {
        const handleProjectsChanged = () => {
            fetchSidebarProjects();
        };
        window.addEventListener('diitra-projects-changed', handleProjectsChanged);
        return () => {
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
        };
    }, [fetchSidebarProjects]);

    const collapseAllMenus = useCallback(() => {
        setIsAnalyticsOpen(false);
        setIsUsersOpen(false);
        setIsParametrosOpen(false);
        setIsInvestigacionOpen(false);
        setIsMisProyectosOpen(false);
    }, []);

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
        if (location.pathname.startsWith('/investigacion/mis-proyectos')) {
            setIsMisProyectosOpen(true);
        }
        
        const isInvestigacionRoute = (location.pathname.startsWith('/investigacion') && !location.pathname.startsWith('/investigacion/adopcion') && !location.pathname.startsWith('/investigacion/mis-proyectos')) ||
            (location.pathname.includes('/workspace/') && !location.pathname.includes('/mis-proyectos/'));
        if (isInvestigacionRoute) {
            setIsInvestigacionOpen(true);
        }
    }, [location.pathname]);

    let notifications: NotificationItem[] = [];
    let unreadCount = 0;
    let markAsRead = async (_uuid: string) => {};
    let markAllAsRead = async () => {};

    try {
        const notificationsData = useNotifications();
        notifications = notificationsData.notifications;
        unreadCount = notificationsData.unreadCount;
        markAsRead = notificationsData.markAsRead;
        markAllAsRead = notificationsData.markAllAsRead;
    } catch (e) {
        // Fallback if context is not loaded
    }

    const handleNotificationClick = async (n: NotificationItem) => {
        if (!n.leido) {
            await markAsRead(n.uuid);
        }

        if (n.url_accion) {
            if (n.url_accion.startsWith('http://') || n.url_accion.startsWith('https://')) {
                try {
                    const urlObj = new URL(n.url_accion);
                    if (urlObj.host === window.location.host) {
                        navigate(urlObj.pathname + urlObj.search + urlObj.hash);
                    } else {
                        window.open(n.url_accion, '_blank');
                    }
                } catch {
                    window.location.href = n.url_accion;
                }
            } else {
                navigate(n.url_accion);
            }
            setIsNotificationsOpen(false);
        }
    };

    const allMenuItems: MenuItem[] = [
        // ── Orientación y contexto personal ────────────────────────────────
        { name: 'Tablero', icon: Home, path: '/dashboard', roles: ['ANY'], group: 1 },
        { name: 'Notificaciones', icon: Bell, path: '/notificaciones', roles: ['ANY'], group: 1 },
        { name: 'Calendario', icon: Calendar, path: '/calendario', roles: ['ANY'], group: 1 },
        // ── Ciclo de investigación (inicio → postulación → revisión → evaluación) ──
        { name: 'Investigación', icon: ClipboardList, path: '/investigacion', roles: ['DIITRA_ADMIN'], group: 1, hasChevron: true },
        { name: 'Mis Proyectos', icon: ListChecks || ShieldCheck, path: '/investigacion/mis-proyectos', roles: ['DIITRA_DOCENTE', 'DIITRA_ESTUDIANTE'], group: 1, hasChevron: true },
        { name: 'Innovación', icon: Sparkles, path: '/innovacion', roles: ['ANY'], group: 1 },
        { name: 'Convocatorias', icon: PenTool, path: '/convocatorias', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], group: 1 },
        { name: 'Grupos', icon: Award, path: '/grupos', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], group: 1 },
        { name: 'Mis Revisiones', icon: ShieldCheck, path: '/revisiones', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_REVISOR_EXTERNO'], group: 1 },
        { name: 'Evaluación', icon: Gavel || ShieldCheck, path: '/evaluacion-pares', roles: ['DIITRA_ADMIN'], group: 1 },
        // ── Resultados, evidencias y observabilidad ─────────────────────────
        { name: 'Mis Certificados', icon: Award, path: '/mis-certificados', roles: ['ANY'], group: 2 },
        { name: 'Verificación', icon: ShieldCheck, path: '/verificacion', roles: ['ANY'], group: 2 },
        { name: 'Analíticas', icon: BarChart3, path: '/analiticas', roles: ['DIITRA_ADMIN'], group: 2, hasChevron: true },
        // ── Administración del sistema ──────────────────────────────────────
        { name: 'Usuarios', icon: Users, path: '/usuarios', permission: 'USUARIOS:VER', group: 3, hasChevron: true },
        { name: 'Plantillas', icon: FileCode2, path: '/admin/plantillas', roles: ['DIITRA_ADMIN'], group: 3 },
        { name: 'Correos', icon: Mail, path: '/emails', roles: ['DIITRA_ADMIN'], group: 3 },
        { name: 'Auditoría', icon: Activity, path: '/auditoria', roles: ['DIITRA_ADMIN'], group: 3 },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (item.path === '/investigacion/mis-proyectos' && isAdmin) return false;

        if (isAdmin) return true;
        if (item.permission) {
            const [module, op] = item.permission.split(':');
            return hasPermission(module, op);
        }
        if (item.roles) {
            if (item.roles.includes('ANY')) return true;
            const checkRoles = item.roles.map(r => r.toUpperCase());
            if (checkRoles.includes('DIITRA_DOCENTE')) {
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

    const activeItem = menuItems.reduce<MenuItem | null>((best, item) => {
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

    const resolveExpandTarget = () => SIDEBAR_REOPEN_WIDTH;

    const persistExpandedWidth = (width: number) => {
        const clamped = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_OPEN_MIN, Math.round(width)));
        setExpandedWidth(clamped);
        localStorage.setItem('sidebar_width', String(clamped));
        return clamped;
    };

    const animatePeekWidth = (target: number, onDone?: () => void) => {
        const from = peekWidthRef.current ?? (isCollapsed ? 0 : expandedWidth);
        const isClosing = target === 0;
        const duration = isClosing ? SIDEBAR_COLLAPSE_MS : SIDEBAR_TRANSITION_MS;

        if (isClosing) {
            setIsClosingAnim(true);
        }

        setPeek(from);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setPeek(target);
                window.setTimeout(() => {
                    onDone?.();
                    setPeek(null);
                    if (isClosing) {
                        setIsClosingAnim(false);
                    }
                }, duration);
            });
        });
    };

    const collapseWithAnimation = () => {
        if (isCollapsed || isClosingAnim) return;
        animatePeekWidth(0, onCollapse);
    };

    useEffect(() => {
        const wasCollapsed = prevCollapsedRef.current;
        prevCollapsedRef.current = isCollapsed;

        if (!wasCollapsed || isCollapsed) return;

        const target = resolveExpandTarget();
        if (target !== expandedWidth) {
            setExpandedWidth(target);
            localStorage.setItem('sidebar_width', String(target));
        }

        if (skipNextExpandEffectRef.current) {
            skipNextExpandEffectRef.current = false;
            return;
        }

        if (peekWidthRef.current === null) {
            animatePeekWidth(target);
        }
    }, [isCollapsed]);

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
        const startWidth = peekWidthRef.current ?? expandedWidth;
        setPeek(startWidth);
        const startX = mouseDownEvent.clientX;
        let maxDelta = 0;

        const stopDrag = () => {
            setIsDragging(false);
            cleanupDragListeners(doDrag, stopDrag);

            const currentWidth = peekWidthRef.current ?? expandedWidth;
            const clicked = maxDelta <= DRAG_CLICK_THRESHOLD;
            const releasedInCollapseZone = maxDelta > DRAG_CLICK_THRESHOLD
                && currentWidth < SIDEBAR_AUTO_COLLAPSE_AT;
            const shouldCollapse = clicked || releasedInCollapseZone;

            if (shouldCollapse) {
                collapseWithAnimation();
            } else {
                const finalWidth = persistExpandedWidth(currentWidth);
                if (Math.abs(finalWidth - currentWidth) > 2) {
                    animatePeekWidth(finalWidth);
                } else {
                    setPeek(null);
                }
            }
        };

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const delta = mouseMoveEvent.clientX - startX;
            maxDelta = Math.max(maxDelta, Math.abs(delta));
            const nextWidth = startWidth + delta;
            setPeek(Math.min(SIDEBAR_WIDTH_MAX, Math.max(0, nextWidth)));
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
        const expandTarget = resolveExpandTarget();
        let lastReveal = 0;

        const stopDrag = () => {
            setIsDragging(false);
            cleanupDragListeners(doDrag, stopDrag);

            const currentWidth = peekWidthRef.current ?? 0;
            const clicked = lastReveal <= DRAG_CLICK_THRESHOLD;
            const shouldExpand = clicked || currentWidth >= expandTarget * COLLAPSE_VISIBLE_RATIO;

            if (shouldExpand) {
                if (expandTarget !== expandedWidth) {
                    setExpandedWidth(expandTarget);
                    localStorage.setItem('sidebar_width', String(expandTarget));
                }
                skipNextExpandEffectRef.current = true;
                animatePeekWidth(expandTarget, onExpand);
            } else {
                animatePeekWidth(0);
            }
        };

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const reveal = Math.max(0, mouseMoveEvent.clientX - startX);
            lastReveal = reveal;

            if (reveal >= expandTarget * COLLAPSE_INSTANT_RATIO) {
                setIsDragging(false);
                document.body.style.removeProperty('user-select');
                document.body.style.removeProperty('cursor');
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
                if (expandTarget !== expandedWidth) {
                    setExpandedWidth(expandTarget);
                    localStorage.setItem('sidebar_width', String(expandTarget));
                }
                skipNextExpandEffectRef.current = true;
                onExpand();
                setPeek(null);
                return;
            }

            setPeek(Math.min(expandTarget, reveal));
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

    const userInitials = user?.nombre_completo
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'JD';

    const username = user?.usuario?.split('@')[0] || user?.nombre_completo || 'jorgedoicela';

    return {
        logout,
        isAdmin,
        user,
        roleDisplayName,
        navigate,
        location,
        searchShortcut,
        isDragging,
        isClosingAnim,
        peekWidth,
        desktopWidth,
        contentWidth,
        isDesktop,
        sidebarReveal,
        isSidebarClosing,
        bellRef,
        notifPanelPos,
        isUserMenuOpen,
        setIsUserMenuOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isAnalyticsOpen,
        setIsAnalyticsOpen,
        isUsersOpen,
        setIsUsersOpen,
        isParametrosOpen,
        setIsParametrosOpen,
        isInvestigacionOpen,
        setIsInvestigacionOpen,
        isMisProyectosOpen,
        setIsMisProyectosOpen,
        sidebarProjects,
        sidebarProjectsLoading,
        showAllProjects,
        setShowAllProjects,
        notifications,
        unreadCount,
        markAllAsRead,
        handleNotificationClick,
        activeItem,
        group1,
        group2,
        group3,
        startResizing,
        startExpandDrag,
        triggerCommandPalette,
        userInitials,
        username,
        updateNotifPanelPos,
        expandedWidth,
        collapseAllMenus
    };
};
