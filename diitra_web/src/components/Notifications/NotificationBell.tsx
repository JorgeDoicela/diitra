import React, { useState } from 'react';
import { Bell, ExternalLink, Mail, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../api/NotificationsContext';

interface Notification {
    uuid: string;
    titulo: string;
    mensaje: string;
    categoria: string;
    fecha_envio: string;
    leido: boolean;
    url_accion?: string;
}

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead } = useNotifications();

    const getIcon = (category: string) => {
        switch (category) {
            case 'INVESTIGACION': return <ExternalLink size={14} className="text-blue-500" />;
            case 'SISTEMA': return <Info size={14} className="text-gray-500" />;
            case 'URGENTE': return <AlertTriangle size={14} className="text-red-500" />;
            default: return <Mail size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all relative"
            >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-text-main rounded-full border-2 border-bg-deep animate-pulse" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-80 md:w-96 bg-bg-deep border border-border-thin rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <header className="p-4 border-b border-border-thin bg-surface/30 flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-text-main uppercase tracking-widest">Notificaciones</h4>
                            {unreadCount > 0 && (
                                <span className="bg-text-main text-bg-deep px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                    {unreadCount} Nuevas
                                </span>
                            )}
                        </header>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <Bell size={24} className="mx-auto text-text-dim opacity-20" />
                                    <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Todo en orden</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.uuid} 
                                        className={`p-4 border-b border-border-thin last:border-0 hover:bg-surface/50 transition-colors cursor-pointer group ${!n.leido ? 'bg-surface/30' : 'opacity-70'}`}
                                        onClick={() => !n.leido && markAsRead(n.uuid)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(n.categoria)}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-[11px] font-bold text-text-main leading-tight">{n.titulo}</h5>
                                                    <span className="text-[8px] font-mono text-text-dim">{new Date(n.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <p className="text-[10px] text-text-dim leading-relaxed line-clamp-2">{n.mensaje}</p>
                                                {n.url_accion && (
                                                    <a 
                                                        href={n.url_accion} 
                                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-text-main uppercase mt-2 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Ir al detalle <ExternalLink size={10} />
                                                    </a>
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

                        <footer className="p-3 border-t border-border-thin bg-surface/30 text-center">
                            <button className="text-[9px] font-bold text-text-dim hover:text-text-main uppercase tracking-widest transition-colors">
                                Ver todo el historial
                            </button>
                        </footer>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
