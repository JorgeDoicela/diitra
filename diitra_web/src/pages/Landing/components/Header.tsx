import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTheme, toggleTheme }) => {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 w-full z-[60] border-b border-border-thin bg-bg-deep/70 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <img
                        src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                        alt="DIITRA Logo"
                        className="h-7 w-auto object-contain"
                    />
                    <div className="hidden md:flex items-center gap-6 text-[11px] font-medium text-text-dim">
                        <a href="#workspace" className="nav-link hover:text-text-main transition-colors">Workspace</a>
                        <a href="#caces" className="nav-link hover:text-text-main transition-colors">Acreditación</a>
                        <a href="#modulos" className="nav-link hover:text-text-main transition-colors">Módulos</a>
                        <a href="#roles" className="nav-link hover:text-text-main transition-colors">Estructura</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 text-text-dim hover:text-text-main transition-colors rounded-md hover:bg-surface-hover/30">
                        {currentTheme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-text-main text-bg-deep px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all border border-transparent active:scale-95"
                    >
                        Acceder
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Header;
