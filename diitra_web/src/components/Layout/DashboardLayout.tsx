import React, { useState } from 'react';
import { useAuth } from '../../api/AuthContext';
import Sidebar from './Sidebar';
import { CommandPalette } from '../Common/CommandPalette';
import { Menu } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
    const { user, roleDisplayName } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-bg-deep overflow-hidden font-sans selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <CommandPalette />
            
            <Sidebar 
                currentTheme={theme} 
                toggleTheme={toggleTheme} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop TopBar */}
                <header className="hidden lg:flex items-center justify-between px-10 py-4 bg-bg-deep border-b border-border-thin sticky top-0 z-[40]">
                    <div className="flex items-center gap-4">
                        <div className="h-4 w-[1px] bg-border-thin mx-2" />
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">Instituto Superior Tecnológico Traversari</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 pr-6 border-r border-border-thin">
                            <div className="text-right hidden xl:block">
                                <p className="text-[10px] font-bold text-text-main uppercase tracking-tighter leading-none mb-1">{user?.nombre_completo || 'Usuario'}</p>
                                <p className="text-[8px] font-bold text-text-dim uppercase tracking-widest leading-none">
                                    {roleDisplayName}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-bold text-text-main uppercase">
                                {user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'JD'}
                            </div>
                        </div>
                        <NotificationBell />
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
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

