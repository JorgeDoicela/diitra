import React from 'react';
import { useAuth } from '../../api/AuthContext';
import Sidebar from './Sidebar';
import { CommandPalette } from '../Common/CommandPalette';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
    return (
        <div className="flex h-screen w-full bg-bg-deep overflow-hidden font-sans selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <CommandPalette />
            <Sidebar currentTheme={theme} toggleTheme={toggleTheme} />
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
