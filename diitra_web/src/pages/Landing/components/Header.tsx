import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTheme, toggleTheme }) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-[60] border-b theme-transition ${isScrolled ? 'border-border-thin bg-bg-deep' : 'border-transparent bg-bg-deep'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8 lg:-ml-24">
                    <img
                        src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                        alt="DIITRA Logo"
                        className="h-9 w-auto object-contain"
                    />
                    <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-text-dim">
                        <a href="#workspace" className="nav-link hover:text-text-main transition-colors">Workspace</a>
                        <a href="#caces" className="nav-link hover:text-text-main transition-colors">Acreditación</a>
                        <a href="#modulos" className="nav-link hover:text-text-main transition-colors">Módulos</a>
                        <a href="#roles" className="nav-link hover:text-text-main transition-colors">Estructura</a>
                    </div>
                </div>
                <div className="flex items-center gap-5 lg:-mr-24">
                    <button onClick={toggleTheme} className="p-2 text-text-dim hover:text-text-main transition-colors rounded-md hover:bg-surface-hover/30">
                        {currentTheme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-text-main text-bg-deep px-5 py-2 rounded-md text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all border border-transparent active:scale-95"
                    >
                        Acceder
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Header;
