import { useState } from 'react';
import { Bell, ExternalLink, Mail, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../api/NotificationsContext';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const handleNotificationClick = async (n: any) => {
        if (!n.leido) {
            await markAsRead(n.uuid);
        }
        
        if (n.url_accion) {
            navigate(n.url_accion);
            setIsOpen(false);
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'INVESTIGACION': return <ExternalLink size={14} className="text-info" />;
            case 'SISTEMA': return <Info size={14} className="text-text-dim" />;
            case 'URGENTE': return <AlertTriangle size={14} className="text-error" />;
            default: return <Mail size={14} className="text-text-dim" />;
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
                            <div className="flex items-center gap-2">
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
                                    className="text-[9px] font-semibold text-brand hover:underline uppercase tracking-wider"
                                >
                                    Marcar todo leído
                                </button>
                            )}
                        </header>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <Bell size={24} className="mx-auto text-text-dim opacity-20" />
                                    <p className="text-[10px] text-text-dim uppercase font-semibold tracking-widest">Todo en orden</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.uuid} 
                                        className={`p-4 border-b border-border-thin last:border-0 hover:bg-surface/50 transition-colors cursor-pointer group ${!n.leido ? 'bg-surface/30' : 'opacity-70'}`}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(n.categoria)}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-[11px] font-semibold text-text-main leading-tight">{n.titulo}</h5>
                                                    <span className="text-[8px] font-mono text-text-dim">{new Date(n.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <p className="text-[10px] text-text-dim leading-relaxed line-clamp-2">{n.mensaje}</p>
                                                {n.url_accion && (
                                                    <span 
                                                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-text-main uppercase mt-2 hover:underline cursor-pointer"
                                                    >
                                                        Ir al detalle <ExternalLink size={10} />
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

                        <footer className="p-3 border-t border-border-thin bg-surface/30 text-center">
                            <button 
                                onClick={() => { setIsOpen(false); navigate('/notificaciones'); }}
                                className="text-[9px] font-semibold text-text-dim hover:text-text-main uppercase tracking-widest transition-colors"
                            >
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
