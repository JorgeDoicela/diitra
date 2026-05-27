import { useState, useEffect, useMemo } from 'react';
import {
    Bell, ExternalLink, Mail, Info, AlertTriangle,
    CheckCheck, Filter, Search, ChevronDown, Inbox,
    RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

interface NotificationItem {
    uuid: string;
    titulo: string;
    mensaje: string;
    categoria: string;
    fecha_envio: string;
    leido: boolean;
    url_accion?: string;
}

const categoryConfig: Record<string, { icon: typeof Info; color: string; bg: string; label: string }> = {
    INVESTIGACION: { icon: ExternalLink, color: 'text-info', bg: 'bg-info/10', label: 'Investigación' },
    SISTEMA: { icon: Info, color: 'text-text-dim', bg: 'bg-text-main/5', label: 'Sistema' },
    URGENTE: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', label: 'Urgente' },
};

const getCategoryConfig = (cat: string) => categoryConfig[cat] || { icon: Mail, color: 'text-text-dim', bg: 'bg-text-main/5', label: cat };

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, fetchNotifications, isLoading, isConnected } = useNotifications();
    const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'investigacion' | 'sistema' | 'urgente'>('all');
    const [search, setSearch] = useState('');
    const [loadingAll, setLoadingAll] = useState(false);

    useEffect(() => {
        document.title = "Centro de Notificaciones | DIITRA";
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setLoadingAll(true);
            try {
                const res = await api.get('/Admin/notifications/my?limit=0');
                setAllNotifications(res.data);
            } catch {
                setAllNotifications(notifications as unknown as NotificationItem[]);
            } finally {
                setLoadingAll(false);
            }
        };
        loadAll();
    }, [notifications]);

    const handleNotificationClick = async (n: NotificationItem) => {
        if (!n.leido) {
            await markAsRead(n.uuid);
            setAllNotifications(prev => prev.map(x => x.uuid === n.uuid ? { ...x, leido: true } : x));
        }
        if (n.url_accion) {
            navigate(n.url_accion);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setAllNotifications(prev => prev.map(x => ({ ...x, leido: true })));
    };

    const handleRefresh = async () => {
        await fetchNotifications();
        try {
            const res = await api.get('/Admin/notifications/my?limit=0');
            setAllNotifications(res.data);
        } catch { /* fallback to context data */ }
    };

    const filtered = useMemo(() => {
        let list = allNotifications;

        if (filter === 'unread') list = list.filter(n => !n.leido);
        else if (filter === 'investigacion') list = list.filter(n => n.categoria === 'INVESTIGACION');
        else if (filter === 'sistema') list = list.filter(n => n.categoria === 'SISTEMA');
        else if (filter === 'urgente') list = list.filter(n => n.categoria === 'URGENTE');

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(n =>
                n.titulo.toLowerCase().includes(q) || n.mensaje.toLowerCase().includes(q)
            );
        }

        return list;
    }, [allNotifications, filter, search]);

    const unreadCount = allNotifications.filter(n => !n.leido).length;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatFullDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-EC', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const groupedByDate = useMemo(() => {
        const groups: Record<string, NotificationItem[]> = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        filtered.forEach(n => {
            const date = new Date(n.fecha_envio);
            let key: string;

            if (date.toDateString() === today.toDateString()) key = 'Hoy';
            else if (date.toDateString() === yesterday.toDateString()) key = 'Ayer';
            else if (today.getTime() - date.getTime() < 7 * 86400000) key = 'Esta Semana';
            else key = date.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

            if (!groups[key]) groups[key] = [];
            groups[key].push(n);
        });

        return groups;
    }, [filtered]);

    const filters = [
        { key: 'all' as const, label: 'Todas' },
        { key: 'unread' as const, label: 'Sin leer', count: unreadCount },
        { key: 'investigacion' as const, label: 'Investigación' },
        { key: 'sistema' as const, label: 'Sistema' },
        { key: 'urgente' as const, label: 'Urgente' },
    ];

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto vercel-grid-fade bg-glow custom-scrollbar">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-2 animate-fade-up">
                <div className="space-y-1.5">
                    <div className="section-label text-brand animate-pulse">
                        <Bell size={10} />
                        <span>Centro de Notificaciones</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                        Historial Completo
                    </h1>
                    <p className="text-xs text-text-dim max-w-lg font-medium leading-relaxed">
                        Registro inmutable de actividad del sistema, alertas de investigación y comunicados institucionales.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="btn-vercel-secondary flex items-center gap-2 h-10"
                        >
                            <CheckCheck size={14} />
                            <span>Marcar leídas</span>
                        </button>
                    )}
                    <button
                        onClick={handleRefresh}
                        disabled={loadingAll}
                        className="btn-vercel-secondary !p-2.5 h-10 w-10 flex items-center justify-center"
                        title="Sincronizar notificaciones"
                    >
                        <RefreshCw size={14} className={loadingAll || isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-up [animation-delay:50ms]">
                <div className="bento-card vercel-card-glow p-5 flex flex-col gap-2 relative overflow-hidden">
                    <span className="section-label text-text-dim">Notificaciones Totales</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="stat-number stat-number--sm font-mono">{allNotifications.length}</span>
                        <span className="text-[10px] text-text-dim font-medium uppercase">Registros</span>
                    </div>
                    <div className="absolute right-4 bottom-4 text-text-dim opacity-10 pointer-events-none">
                        <Inbox size={48} strokeWidth={1} />
                    </div>
                </div>

                <div className="bento-card vercel-card-glow p-5 flex flex-col gap-2 relative overflow-hidden">
                    <span className="section-label text-text-dim">Por Leer</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`stat-number stat-number--sm font-mono ${unreadCount > 0 ? 'text-brand' : 'text-text-main'}`}>
                            {unreadCount}
                        </span>
                        <span className="text-[10px] text-text-dim font-medium uppercase">Pendientes</span>
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-surface border border-brand/20 px-2 py-0.5 rounded-sm">
                            <span className="dot dot-brand dot-pulse w-1.5 h-1.5" />
                            <span className="text-[8px] font-black text-brand uppercase tracking-widest">Nuevas</span>
                        </div>
                    )}
                    <div className="absolute right-4 bottom-4 text-text-dim opacity-10 pointer-events-none">
                        <Bell size={48} strokeWidth={1} />
                    </div>
                </div>

                <div className="bento-card vercel-card-glow p-5 flex flex-col gap-2 relative overflow-hidden">
                    <span className="section-label text-text-dim">Canal en Tiempo Real</span>
                    <div className="flex items-center gap-2 mt-3">
                        <span className={`dot ${isConnected ? 'dot-success dot-pulse' : 'dot-neutral'} w-2.5 h-2.5`} />
                        <span className="text-xs font-bold text-text-main uppercase tracking-tight">
                            {isConnected ? 'Activo (WebSocket)' : 'Sincronizado'}
                        </span>
                    </div>
                    <p className="text-[10px] text-text-dim mt-1">
                        {isConnected 
                            ? 'Conexión activa con el servidor. Recibiendo alertas instantáneas.' 
                            : 'Actualizado mediante protocolo HTTPS convencional.'}
                    </p>
                    <div className="absolute right-4 bottom-4 text-text-dim opacity-10 pointer-events-none">
                        {isConnected ? <Wifi size={48} strokeWidth={1} /> : <WifiOff size={48} strokeWidth={1} />}
                    </div>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bento-card static p-4 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 animate-fade-up [animation-delay:100ms]">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    <Filter size={13} className="text-text-dim shrink-0" />
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors ${
                                filter === f.key
                                    ? 'bg-text-main text-bg-deep'
                                    : 'bg-surface border border-border-thin text-text-dim hover:text-text-main'
                            }`}
                        >
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className="ml-1.5 text-[8px] font-black">({f.count})</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full md:w-auto md:min-w-[240px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar en notificaciones..."
                        className="input-vercel !pl-8 w-full"
                    />
                </div>
            </div>

            {/* Contenido */}
            <div className="animate-fade-up [animation-delay:200ms]">
                {loadingAll && allNotifications.length === 0 ? (
                    <div className="bento-card static p-16 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-text-dim border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-xs text-text-dim uppercase tracking-widest font-bold">Cargando notificaciones...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bento-card static p-16 text-center">
                        <Inbox size={40} className="mx-auto text-text-dim opacity-20 mb-4" />
                        <p className="text-sm text-text-dim font-bold uppercase tracking-widest">
                            {search || filter !== 'all' ? 'Sin resultados para este filtro' : 'Todo en orden'}
                        </p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase tracking-wider">
                            {search || filter !== 'all' ? 'Intenta con otros términos o cambia el filtro' : 'No hay notificaciones pendientes'}
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedByDate).map(([groupLabel, items]) => (
                        <div key={groupLabel} className="mb-8">
                            <div className="flex items-center gap-3 mb-3 px-2">
                                <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest">{groupLabel}</h3>
                                <div className="flex-1 border-t border-border-thin" />
                                <span className="text-[9px] font-mono text-text-dim">{items.length}</span>
                            </div>

                            <div className="space-y-2">
                                {items.map(n => {
                                    const config = getCategoryConfig(n.categoria);
                                    const IconComp = config.icon;

                                    return (
                                        <div
                                            key={n.uuid}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`bento-card p-4 cursor-pointer group transition-all ${
                                                !n.leido ? 'border-l-2 border-l-brand' : 'opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`shrink-0 p-2.5 rounded-md flex items-center justify-center ${config.bg} ${config.color}`}>
                                                    <IconComp size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h5 className={`text-xs font-bold text-text-main leading-tight truncate ${!n.leido ? '' : 'font-medium'}`}>
                                                            {n.titulo}
                                                        </h5>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[9px] font-mono text-text-dim">
                                                                {formatDate(n.fecha_envio)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-text-dim leading-relaxed line-clamp-2">
                                                        {n.mensaje}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className={`badge-vercel badge-vercel-${
                                                            n.categoria === 'URGENTE' ? 'error' :
                                                            n.categoria === 'INVESTIGACION' ? 'info' : 'neutral'
                                                        } text-[7px]`}>
                                                            {config.label}
                                                        </span>
                                                        {n.url_accion && (
                                                            <span className="text-[9px] font-bold text-text-main uppercase hover:underline flex items-center gap-1">
                                                                Ir al detalle <ExternalLink size={8} />
                                                            </span>
                                                        )}
                                                        <span className="text-[8px] font-mono text-text-dim ml-auto hidden md:inline">
                                                            {formatFullDate(n.fecha_envio)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!n.leido && (
                                                    <div className="w-2 h-2 bg-brand rounded-full mt-2 shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Stats */}
            {allNotifications.length > 0 && (
                <div className="mt-8 text-center">
                    <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
                        {allNotifications.length} notificaciones en total · {unreadCount} sin leer · Sincronizado en tiempo real
                    </p>
                </div>
            )}
        </main>
    );
};

export default NotificationsPage;