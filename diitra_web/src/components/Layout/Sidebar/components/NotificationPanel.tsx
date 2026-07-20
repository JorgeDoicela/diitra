import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Info, AlertTriangle, Mail, Bell } from 'lucide-react';
import { stripHtmlToText } from '../../../utils/notificationText';
import type { NotificationItem } from '../types';

interface NotificationPanelProps {
    isNotificationsOpen: boolean;
    setIsNotificationsOpen: (v: boolean) => void;
    notifPanelPos: { bottom: number; left: number; width: number };
    unreadCount: number;
    notifications: NotificationItem[];
    markAllAsRead: () => Promise<void>;
    handleNotificationClick: (n: NotificationItem) => Promise<void>;
    navigate: (path: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifPanelPos,
    unreadCount,
    notifications,
    markAllAsRead,
    handleNotificationClick,
    navigate
}) => {
    if (!isNotificationsOpen) return null;

    const getNotificationIcon = (category: string) => {
        switch (category) {
            case 'INVESTIGACION': return <ExternalLink size={12} className="text-info" />;
            case 'SISTEMA': return <Info size={12} className="text-text-dim" />;
            case 'URGENTE': return <AlertTriangle size={12} className="text-error" />;
            default: return <Mail size={12} className="text-text-dim" />;
        }
    };

    return createPortal(
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
                        notifications.map((n) => (
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
    );
};
