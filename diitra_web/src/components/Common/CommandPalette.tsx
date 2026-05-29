import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Command,
    PlusCircle,
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ClipboardList,
    Activity,
    BarChart3,
    Award,
    ShieldCheck,
    FileDown,
    PenTool,
    Cpu,
    Bell,
    ListChecks
} from 'lucide-react';

interface SearchItem {
    id: string;
    label: string;
    category: 'Navegación' | 'Acciones' | 'Módulos';
    icon: any;
    path?: string;
    action?: () => void;
    shortcut?: string;
    roles?: string[];
}

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const items: SearchItem[] = [
        { id: 'dashboard', label: 'Tablero Principal', category: 'Navegación', icon: LayoutDashboard, path: '/dashboard', shortcut: 'D' },
        { id: 'investigacion', label: 'Investigación (Proyectos I+D+i)', category: 'Navegación', icon: ClipboardList, path: '/investigacion', shortcut: 'P' },
        { id: 'mis-proyectos', label: 'Mis Proyectos', category: 'Navegación', icon: ListChecks, path: '/investigacion/mis-proyectos' },
        { id: 'convocatorias', label: 'Convocatorias Activas', category: 'Navegación', icon: PenTool, path: '/convocatorias', shortcut: 'G' },
        { id: 'analiticas', label: 'Analíticas de Investigación', category: 'Navegación', icon: BarChart3, path: '/analiticas', shortcut: 'A' },
        { id: 'revisiones', label: 'Revisiones por Pares', category: 'Navegación', icon: ShieldCheck, path: '/revisiones', shortcut: 'R' },
        { id: 'grupos', label: 'Grupos de Investigación', category: 'Navegación', icon: Award, path: '/grupos' },
        { id: 'verificar', label: 'Verificar Documento (Trazabilidad)', category: 'Navegación', icon: ShieldCheck, path: '/verify' },
        { id: 'notificaciones', label: 'Centro de Notificaciones', category: 'Navegación', icon: Bell, path: '/notificaciones' },
        { id: 'usuarios', label: 'Gestión de Usuarios', category: 'Navegación', icon: Users, path: '/usuarios', shortcut: 'U', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'auditoria', label: 'Auditoría del Sistema', category: 'Navegación', icon: Activity, path: '/auditoria', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'configuracion', label: 'Configuración Institucional', category: 'Navegación', icon: Settings, path: '/configuracion', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'new-project', label: 'Nueva Postulación de Investigación', category: 'Acciones', icon: PlusCircle, shortcut: 'N', action: () => navigate('/investigacion') },
        { id: 'export-analiticas', label: 'Exportar Reporte PDF de Analíticas', category: 'Acciones', icon: FileDown, shortcut: 'E', action: () => navigate('/analiticas') },
        { id: 'builder', label: 'DIITRA Builder (Motor de Documentos)', category: 'Módulos', icon: Cpu, path: '/investigacion' },
        { id: 'logout', label: 'Cerrar Sesión', category: 'Acciones', icon: LogOut, action: () => navigate('/login') },
    ];

    const filteredItems = query === ''
        ? items
        : items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                setQuery('');
                setSelectedIndex(0);
            }

            if (!isOpen) return;

            if (e.key === 'Escape') {
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(filteredItems[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (item: SearchItem) => {
        if (!item) return;

        if (item.path) {
            navigate(item.path);
        } else if (item.action) {
            item.action();
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-[2px]" onClick={() => setIsOpen(false)}>
            <div
                className="w-full max-w-xl bg-bg-deep border border-border-thin rounded-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-4 border-b border-border-thin">
                    <Search size={16} className="text-text-dim mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Buscar módulos, páginas o comandos..."
                        className="flex-1 bg-transparent border-none outline-none text-text-main text-sm placeholder:text-text-dim font-sans"
                    />
                    <kbd className="text-[10px] bg-surface px-2 py-1 rounded border border-border-thin text-text-dim font-mono">ESC</kbd>
                </div>

                <div className="p-2 space-y-0.5 max-h-[50vh] overflow-y-auto">
                    {filteredItems.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-text-dim">No se encontraron resultados para "{query}"</p>
                        </div>
                    ) : (
                        <>
                            {Array.from(new Set(filteredItems.map(i => i.category))).map(category => (
                                <React.Fragment key={category}>
                                    <div className="px-3 pt-3 pb-1.5">
                                        <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{category}</h4>
                                    </div>
                                    {filteredItems
                                        .filter(item => item.category === category)
                                        .map((item) => {
                                            const globalIndex = filteredItems.indexOf(item);
                                            return (
                                                <PaletteItem
                                                    key={item.id}
                                                    icon={item.icon}
                                                    label={item.label}
                                                    shortcut={item.shortcut}
                                                    isActive={globalIndex === selectedIndex}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    onClick={() => handleSelect(item)}
                                                />
                                            );
                                        })
                                    }
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </div>

                <div className="bg-surface/30 px-4 py-3 border-t border-border-thin flex items-center justify-between">
                    <span className="text-[10px] text-text-dim font-mono tracking-tighter uppercase">DIITRA_ISTPET_v1.0</span>
                    <div className="flex items-center gap-1.5 text-[10px] bg-text-main text-bg-deep px-2 py-0.5 rounded-sm font-bold">
                        <Command size={10} />
                        <span>COMANDOS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PaletteItemProps {
    icon: any;
    label: string;
    shortcut?: string;
    isActive: boolean;
    onMouseEnter: () => void;
    onClick: () => void;
}

const PaletteItem = ({ icon: Icon, label, shortcut, isActive, onMouseEnter, onClick }: PaletteItemProps) => (
    <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-surface-hover text-text-main' : 'hover:bg-surface/50 text-text-dim'
            }`}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <Icon size={14} className={isActive ? 'text-text-main' : 'text-text-dim'} strokeWidth={1.5} />
            <span className={`text-sm transition-colors ${isActive ? 'text-text-main font-bold' : ''}`}>{label}</span>
        </div>
        {shortcut && (
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded border font-mono transition-colors ${isActive ? 'bg-bg-deep border-text-main text-text-main' : 'bg-bg-deep border-border-thin text-text-dim'
                }`}>
                {shortcut}
            </kbd>
        )}
    </div>
);
