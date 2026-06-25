import React from 'react';

interface FooterProps {
    currentTheme: 'dark' | 'light';
}

const Footer: React.FC<FooterProps> = ({ currentTheme }) => {
    return (
        <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-border-thin text-text-dim lg:-ml-24 lg:-mr-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <img
                            src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                            alt="DIITRA Logo"
                            className="h-9 w-auto object-contain"
                        />
                    </div>
                    <p className="text-[10px] max-w-xs leading-relaxed font-mono">
                        Tecnológico Traversari, Quito - Ecuador. <br />
                        Automatización de procesos científicos e innovación tecnológica institucional.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-8 text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">
                    <div className="space-y-4 flex flex-col">
                        <span className="text-text-main font-bold">// Recursos</span>
                        <a href="#" className="hover:text-text-main transition-colors">DSpace</a>
                        <a href="#" className="hover:text-text-main transition-colors">SENESCYT</a>
                        <a href="#" className="hover:text-text-main transition-colors">Normativas</a>
                    </div>
                    <div className="space-y-4 flex flex-col">
                        <span className="text-text-main font-bold">// Soporte</span>
                        <a href="#" className="hover:text-text-main transition-colors">Ayuda</a>
                        <a href="#" className="hover:text-text-main transition-colors">Seguridad</a>
                        <a href="#" className="hover:text-text-main transition-colors">CACES</a>
                    </div>
                </div>
            </div>
            <div className="mt-20 pt-10 border-t border-border-thin flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono">
                <span>© {new Date().getFullYear()} DIITRA. TODOS LOS DERECHOS RESERVADOS.</span>
                <span className="text-text-dim">TECNOLÓGICO TRAVERSARI - ISTPET</span>
            </div>
        </footer>
    );
};

export default Footer;
