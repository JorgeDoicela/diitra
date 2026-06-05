import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import {
    Search,
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
    permission?: string;
}

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const { isAdmin, isDocente, isEstudiante, isRevisor, roles, hasPermission } = useAuth();

    const items: SearchItem[] = [
        { id: 'dashboard', label: 'Tablero Principal', category: 'Navegación', icon: LayoutDashboard, path: '/dashboard', shortcut: 'D', roles: ['ANY'] },
        { id: 'investigacion', label: 'Investigación (Proyectos I+D+i)', category: 'Navegación', icon: ClipboardList, path: '/investigacion', shortcut: 'P', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
        { id: 'mis-proyectos', label: 'Mis Proyectos', category: 'Navegación', icon: ListChecks, path: '/investigacion/mis-proyectos', roles: ['DIITRA_DOCENTE', 'DOCENTE_INV', 'DIITRA_ESTUDIANTE'] },
        { id: 'convocatorias', label: 'Convocatorias Activas', category: 'Navegación', icon: PenTool, path: '/convocatorias', shortcut: 'G', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
        { id: 'analiticas', label: 'Analíticas de Investigación', category: 'Navegación', icon: BarChart3, path: '/analiticas', shortcut: 'A', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'revisiones', label: 'Revisiones por Pares', category: 'Navegación', icon: ShieldCheck, path: '/revisiones', shortcut: 'R', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_REVISOR_EXTERNO'] },
        { id: 'grupos', label: 'Grupos de Investigación', category: 'Navegación', icon: Award, path: '/grupos', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
        { id: 'verificar', label: 'Verificar Documento (Trazabilidad)', category: 'Navegación', icon: ShieldCheck, path: '/verify', roles: ['ANY'] },
        { id: 'notificaciones', label: 'Centro de Notificaciones', category: 'Navegación', icon: Bell, path: '/notificaciones', roles: ['ANY'] },
        { id: 'derechos-arco', label: 'Derechos ARCO (LOPDP)', category: 'Navegación', icon: ShieldCheck, path: '/derechos-arco', roles: ['ANY'] },
        { id: 'usuarios', label: 'Gestión de Usuarios', category: 'Navegación', icon: Users, path: '/usuarios', shortcut: 'U', permission: 'USUARIOS:VER' },
        { id: 'auditoria', label: 'Auditoría del Sistema', category: 'Navegación', icon: Activity, path: '/auditoria', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'configuracion', label: 'Configuración Institucional', category: 'Navegación', icon: Settings, path: '/configuracion', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'lopdp-admin', label: 'Panel LOPDP (Administración)', category: 'Navegación', icon: ShieldCheck, path: '/admin/lopdp', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'new-project', label: 'Nueva Postulación de Investigación', category: 'Acciones', icon: PlusCircle, shortcut: 'N', action: () => navigate('/investigacion'), roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
        { id: 'export-analiticas', label: 'Exportar Reporte PDF de Analíticas', category: 'Acciones', icon: FileDown, shortcut: 'E', action: () => navigate('/analiticas'), roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
        { id: 'builder', label: 'DIITRA Builder (Motor de Documentos)', category: 'Módulos', icon: Cpu, path: '/investigacion', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
        { id: 'logout', label: 'Cerrar Sesión', category: 'Acciones', icon: LogOut, action: () => navigate('/login'), roles: ['ANY'] },
    ];

    const filteredItems = items
        .filter(item => {
            if (item.id === 'derechos-arco' && isAdmin) return false;

            if (isAdmin) return true;
            if (item.permission) {
                const [module, op] = item.permission.split(':');
                return hasPermission(module, op);
            }
            if (item.roles) {
                if (item.roles.includes('ANY')) return true;
                const checkRoles = item.roles.map(r => r.toUpperCase());
                if (checkRoles.includes('DIITRA_DOCENTE') || checkRoles.includes('DOCENTE_INV')) {
                    if (isDocente) return true;
                }
                if (checkRoles.includes('DIITRA_ESTUDIANTE')) {
                    if (isEstudiante) return true;
                }
                if (checkRoles.includes('DIITRA_REVISOR_EXTERNO')) {
                    if (isRevisor) return true;
                }
                return item.roles.some(r => roles.includes(r.toUpperCase()));
            }
            return true;
        })
        .filter(item =>
            query === '' ||
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'k') {
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
                        className="flex-1 bg-transparent border-none outline-none text-text-main text-sm placeholder:text-text-dim font-sans focus:!outline-none focus:!border-none focus:!shadow-none focus-visible:!outline-none focus-visible:!border-none focus-visible:!shadow-none"
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
