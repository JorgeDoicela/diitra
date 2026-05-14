import React, { useState } from 'react';
import { useAuth } from '../../api/AuthContext';
import Sidebar from './Sidebar';
import { CommandPalette } from '../Common/CommandPalette';
import { Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
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
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

