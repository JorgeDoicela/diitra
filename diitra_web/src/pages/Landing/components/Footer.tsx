import React from 'react';

interface FooterProps {
    currentTheme: 'dark' | 'light';
}

const Footer: React.FC<FooterProps> = ({ currentTheme }) => {
    const footerColumns = [
        {
            title: 'Ecosistema',
            links: [
                { label: 'Workspace', href: '#workspace' },
                { label: 'Acreditación', href: '#caces' },
                { label: 'Módulos', href: '#modulos' },
                { label: 'Estructura', href: '#roles' },
            ]
        },
        {
            title: 'Recursos',
            links: [
                { label: 'DSpace Repository', href: '#' },
                { label: 'SENESCYT Portal', href: '#' },
                { label: 'Reglamento CES', href: '#' },
                { label: 'Modelo CACES', href: '#' },
            ]
        },
        {
            title: 'Institución',
            links: [
                { label: 'ISTPET Principal', href: '#' },
                { label: 'Campus Traversari', href: '#' },
                { label: 'Contacto Directo', href: '#' },
                { label: 'Mesa de Ayuda', href: '#' },
            ]
        },
        {
            title: 'Seguridad',
            links: [
                { label: 'Firma.ec Integration', href: '#' },
                { label: 'Firma P12 Seguro', href: '#' },
                { label: 'Auditoría de Actas', href: '#' },
                { label: 'Respaldos Base', href: '#' },
            ]
        },
        {
            title: 'Legal',
            links: [
                { label: 'Términos de Uso', href: '#' },
                { label: 'Política Privacidad', href: '#' },
                { label: 'Licencia DIITRA', href: '#' },
            ]
        }
    ];

    return (
        <footer className="w-full border-t border-border-thin text-text-dim">
            <div className="max-w-7xl mx-auto px-6">
                <div className="py-20 lg:-ml-24 lg:-mr-24">
                    {/* Grid de 5 Columnas de Enlaces al estilo Vercel */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
                        {footerColumns.map((col, idx) => (
                            <div key={idx} className="space-y-4 flex flex-col">
                                <span className="text-text-main font-bold font-mono text-[10px] uppercase tracking-[0.2em]">
                                    {col.title}
                                </span>
                                <div className="flex flex-col gap-2.5 text-[11px] font-medium font-sans">
                                    {col.links.map((link, lIdx) => (
                                        <a key={lIdx} href={link.href} className="hover:text-text-main transition-colors w-fit">
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Copyright y Logotipos abajo */}
                    <div className="mt-20 pt-10 border-t border-border-thin flex flex-col sm:flex-row justify-between items-center gap-6 text-[9px] font-mono select-none">
                        <div className="flex items-center gap-4">
                            <img
                                src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                                alt="DIITRA Logo"
                                className="h-8 w-auto object-contain"
                            />
                            <span className="opacity-80">© {new Date().getFullYear()} DIITRA. TODOS LOS DERECHOS RESERVADOS.</span>
                        </div>
                        <span className="text-text-dim opacity-80">TECNOLÓGICO TRAVERSARI - ISTPET</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
