import React from 'react';
import { Sun, Moon, Settings, Trash2, LogOut, Bell } from 'lucide-react';

const MoreHorizontalIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
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

interface SidebarFooterProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
    isUserMenuOpen: boolean;
    setIsUserMenuOpen: (v: boolean) => void;
    logout: () => Promise<void>;
    isAdmin: boolean;
    user: any;
    userInitials: string;
    username: string;
    roleDisplayName: string;
    bellRef: React.RefObject<HTMLButtonElement>;
    isNotificationsOpen: boolean;
    setIsNotificationsOpen: (v: boolean) => void;
    unreadCount: number;
    updateNotifPanelPos: () => void;
    navigate: (path: string) => void;
}

const NAV_FADE_HEIGHT = '3.5rem';

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
    currentTheme,
    toggleTheme,
    isUserMenuOpen,
    setIsUserMenuOpen,
    logout,
    isAdmin,
    user,
    userInitials,
    username,
    roleDisplayName,
    bellRef,
    isNotificationsOpen,
    setIsNotificationsOpen,
    unreadCount,
    updateNotifPanelPos,
    navigate
}) => {
    return (
        <div className="px-2.5 pt-2 mt-auto relative shrink-0 bg-bg-deep">
            <div
                className="pointer-events-none absolute left-0 right-0 h-14 bg-gradient-to-b from-transparent to-bg-deep z-10"
                style={{ top: `-${NAV_FADE_HEIGHT}` }}
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
                        {(isAdmin || user?.roles?.includes('DIITRA_DOCENTE')) && (
                            <div
                                onClick={() => {
                                    navigate('/papelera');
                                    setIsUserMenuOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-dim hover:text-text-main hover:bg-surface-hover rounded-md cursor-pointer transition-colors"
                            >
                                <Trash2 size={14} />
                                <span>Papelera</span>
                            </div>
                        )}
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
                        className="w-7 h-7 rounded-full hover:bg-surface-hover/50 text-text-dim hover:text-text-main transition-colors relative flex items-center justify-center cursor-pointer border-0 bg-transparent"
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
    );
};
