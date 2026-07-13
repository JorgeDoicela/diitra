import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../api/AuthContext';

interface HeaderProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentTheme, toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogoClick = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate('/');
                // Esperamos un instante o forzamos el scroll arriba
                window.scrollTo({ top: 0 });
            }
        }
    };

    return (
        <nav className={`fixed top-0 w-full z-[60] border-b theme-transition ${isScrolled ? 'border-border-thin bg-bg-deep' : 'border-transparent bg-bg-deep'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8 lg:-ml-24">
                    <img
                        src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                        alt="DIITRA Logo"
                        className="h-9 w-auto object-contain cursor-pointer"
                        onClick={handleLogoClick}
                    />
                    {isHome ? (
                        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-text-dim">
                            <a href="#workspace" className="nav-link hover:text-text-main transition-colors">Workspace</a>
                            <a href="#caces" className="nav-link hover:text-text-main transition-colors">Acreditación</a>
                            <a href="#modulos" className="nav-link hover:text-text-main transition-colors">Módulos</a>
                            <a href="#roles" className="nav-link hover:text-text-main transition-colors">Estructura</a>
                            <Link to="/grupos-investigacion" className="nav-link hover:text-text-main transition-colors">Grupos</Link>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-text-dim">
                            <Link to="/" className="nav-link hover:text-text-main transition-colors">Inicio</Link>
                            <Link to="/grupos-investigacion" className="nav-link hover:text-text-main transition-colors">Grupos</Link>
                        </div>
                    )}
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
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-text-dim hover:text-text-main md:hidden transition-colors rounded-md hover:bg-surface-hover/30"
                    >
                        {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
            
            {/* Mobile menu drawer */}
            {isOpen && (
                <div className="md:hidden border-t border-border-thin bg-bg-deep px-6 py-4 flex flex-col gap-4 animate-fade-in">
                    {isHome ? (
                        <>
                            <a href="#workspace" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Workspace</a>
                            <a href="#caces" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Acreditación</a>
                            <a href="#modulos" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Módulos</a>
                            <a href="#roles" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Estructura</a>
                            <Link to="/grupos-investigacion" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Grupos</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Inicio</Link>
                            <Link to="/grupos-investigacion" onClick={() => setIsOpen(false)} className="text-[13px] font-medium text-text-dim hover:text-text-main transition-colors">Grupos</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Header;
