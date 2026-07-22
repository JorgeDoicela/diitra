import React from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, 
    Calendar, 
    Tag, 
    Globe, 
    Activity, 
    GraduationCap, 
    Users, 
    TrendingUp, 
    ShieldCheck, 
    ClipboardList, 
    Loader2 
} from 'lucide-react';
import type { MenuItem, SidebarProject } from '../types';

const ChevronRightIcon = ({ className = "w-3 h-3", size = 12 }: { className?: string; size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const MoreHorizontalIcon = ({ className = "w-4 h-4", size = 16 }: { className?: string; size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

interface SidebarNavProps {
    group1: MenuItem[];
    group2: MenuItem[];
    group3: MenuItem[];
    activeItem: MenuItem | null;
    isInvestigacionOpen: boolean;
    setIsInvestigacionOpen: (v: boolean) => void;
    isMisProyectosOpen: boolean;
    setIsMisProyectosOpen: (v: boolean) => void;
    isAnalyticsOpen: boolean;
    setIsAnalyticsOpen: (v: boolean) => void;
    isUsersOpen: boolean;
    setIsUsersOpen: (v: boolean) => void;
    isParametrosOpen: boolean;
    setIsParametrosOpen: (v: boolean) => void;
    sidebarProjects: SidebarProject[];
    sidebarProjectsLoading: boolean;
    showAllProjects: boolean;
    setShowAllProjects: (v: boolean) => void;
    navigate: (path: string) => void;
    location: { pathname: string; search: string };
    onClose?: () => void;
}

const NAV_SCROLL_SPACER = 'h-24';

export const SidebarNav: React.FC<SidebarNavProps> = ({
    group1,
    group2,
    group3,
    activeItem,
    isInvestigacionOpen,
    setIsInvestigacionOpen,
    isMisProyectosOpen,
    setIsMisProyectosOpen,
    isAnalyticsOpen,
    setIsAnalyticsOpen,
    isUsersOpen,
    setIsUsersOpen,
    isParametrosOpen,
    setIsParametrosOpen,
    sidebarProjects,
    sidebarProjectsLoading,
    showAllProjects,
    setShowAllProjects,
    navigate,
    location,
    onClose
}) => {
    const renderMenuItem = (item: MenuItem) => {
        const isActive = item === activeItem;

        if (item.name === 'Investigación' || item.name === 'Mis Proyectos') {
            const isMenuOpen = item.name === 'Investigación' ? isInvestigacionOpen : isMisProyectosOpen;
            const toggleOpen = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.name === 'Investigación') {
                    setIsInvestigacionOpen(!isInvestigacionOpen);
                } else {
                    setIsMisProyectosOpen(!isMisProyectosOpen);
                }
            };

            const displayLimit = 6;
            const shownProjects = showAllProjects ? sidebarProjects : sidebarProjects.slice(0, displayLimit);
            const hasMore = sidebarProjects.length > displayLimit;

            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${isActive
                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                            : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                            }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (item.name === 'Investigación') {
                                    setIsInvestigacionOpen(true);
                                    if (location.pathname !== '/investigacion') {
                                        navigate('/investigacion');
                                    }
                                } else {
                                    setIsMisProyectosOpen(true);
                                    if (location.pathname !== '/investigacion/mis-proyectos') {
                                        navigate('/investigacion/mis-proyectos');
                                    }
                                }
                                if (onClose) onClose();
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isActive
                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                               : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[14px] tracking-tight truncate ${isActive ? 'font-semibold text-text-main' : 'font-medium'
                                }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={toggleOpen}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title="Expandir"
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''
                                } ${isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                                }`} />
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {sidebarProjectsLoading && sidebarProjects.length === 0 ? (
                                <div className="flex items-center gap-2.5 px-2.5 py-1 ml-2 pl-2.5 text-[13px] text-text-dim/40 font-medium italic select-none">
                                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                        <Loader2 size={13} className="shrink-0 animate-spin opacity-40" />
                                    </div>
                                    <span>Cargando...</span>
                                </div>
                            ) : sidebarProjects.length === 0 ? (
                                <div className="flex items-center gap-2.5 px-2.5 py-1 ml-2 pl-2.5 text-[13px] text-text-dim/40 font-medium italic select-none">
                                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                        <BookOpen size={13} strokeWidth={1} className="shrink-0 opacity-40" />
                                    </div>
                                    <span>Sin proyectos</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                                        {shownProjects.map((p) => {
                                            const projectPath = item.name === 'Investigación'
                                                ? `/investigacion/workspace/protocolo-investigacion/${p.uuid}`
                                                : `/investigacion/mis-proyectos/workspace/protocolo-investigacion/${p.uuid}`;

                                            const isSubActive = location.pathname.includes(`/workspace/`) && location.pathname.includes(p.uuid);

                                            return (
                                                <Link
                                                    key={p.uuid}
                                                    to={projectPath}
                                                    onClick={() => {
                                                        if (onClose) onClose();
                                                    }}
                                                    className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${isSubActive
                                                        ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                                        <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isSubActive
                                                            ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                            : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                                            }`}>
                                                            <BookOpen size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                                        </div>
                                                        <span className={`text-[13px] tracking-tight truncate ${isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                                            }`} title={p.titulo?.trim() || '(Sin título)'}>
                                                            {p.titulo?.trim() || '(Sin título)'}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    {hasMore && !showAllProjects && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowAllProjects(true);
                                            }}
                                            className="flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 text-text-dim hover:text-text-main hover:bg-surface-hover/50 border-0 bg-transparent w-full text-left"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                                <div className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 bg-transparent border border-transparent text-text-dim group-hover:text-text-main">
                                                    <MoreHorizontalIcon className="shrink-0" />
                                                </div>
                                                <span className="text-[12px] font-semibold tracking-tight">
                                                    Ver {sidebarProjects.length - displayLimit} más
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                    {hasMore && showAllProjects && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowAllProjects(false);
                                            }}
                                            className="flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 text-text-dim hover:text-text-main hover:bg-surface-hover/50 border-0 bg-transparent w-full text-left"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                                <div className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 bg-transparent border border-transparent text-text-dim group-hover:text-text-main">
                                                    <ChevronRightIcon className="shrink-0 -rotate-90" />
                                                </div>
                                                <span className="text-[12px] font-semibold tracking-tight">
                                                    Ver menos
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        if (item.name === 'Analíticas') {
            const isMenuOpen = isAnalyticsOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${isActive
                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                            : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                            }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsAnalyticsOpen(true);
                                if (!location.pathname.startsWith('/analiticas')) {
                                    navigate('/analiticas');
                                }
                                if (onClose) onClose();
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isActive
                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[14px] tracking-tight truncate ${isActive ? 'font-semibold text-text-main' : 'font-medium'
                                }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsAnalyticsOpen(!isAnalyticsOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title="Expandir"
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''
                                } ${isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                                }`} />
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Métricas de I+D', path: '/analiticas?tab=general', icon: TrendingUp },
                                { name: 'Cumplimiento CACES', path: '/analiticas?tab=caces', icon: ShieldCheck },
                                { name: 'Proyectos y Producción', path: '/analiticas?tab=productos', icon: ClipboardList }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/analiticas' && (
                                    (subItem.path.includes('tab=general') && (!location.search || location.search.includes('tab=general'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );

                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${isSubActive
                                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isSubActive
                                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                                }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[13px] tracking-tight truncate ${isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                                }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (item.name === 'Usuarios') {
            const isMenuOpen = isUsersOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${isActive
                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                            : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                            }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsUsersOpen(true);
                                if (!location.pathname.startsWith('/usuarios')) {
                                    navigate('/usuarios');
                                }
                                if (onClose) onClose();
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isActive
                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[14px] tracking-tight truncate ${isActive ? 'font-semibold text-text-main' : 'font-medium'
                                }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsUsersOpen(!isUsersOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title="Expandir"
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''
                                } ${isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                                }`} />
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Docentes', path: '/usuarios?type=DOCENTE', icon: GraduationCap },
                                { name: 'Alumnos', path: '/usuarios?type=ESTUDIANTE', icon: Users },
                                { name: 'Externos', path: '/usuarios?type=EXTERNO', icon: Globe }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/usuarios' && (
                                    (subItem.path.includes('type=DOCENTE') && (!location.search || location.search.includes('type=DOCENTE'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );

                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${isSubActive
                                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isSubActive
                                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                                }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[12px] tracking-tight truncate ${isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                                }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (item.path === '/parametros-normativos') {
            const isMenuOpen = isParametrosOpen;
            return (
                <div key={item.name} className="flex flex-col gap-0.5">
                    <div
                        className={`flex items-center justify-between rounded-lg transition-all duration-150 group w-full ${isActive
                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                            : 'bg-transparent text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                            }`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsParametrosOpen(true);
                                if (!location.pathname.startsWith('/parametros-normativos')) {
                                    navigate('/parametros-normativos');
                                }
                                if (onClose) onClose();
                            }}
                            className="flex items-center gap-2.5 min-w-0 py-1.5 px-2.5 rounded-lg border-0 bg-transparent text-inherit cursor-pointer flex-1 text-left"
                        >
                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isActive
                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                }`}>
                                <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                            </div>
                            <span className={`text-[13px] tracking-tight truncate ${isActive ? 'font-semibold text-text-main' : 'font-medium'
                                }`}>
                                {item.name}
                            </span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsParametrosOpen(!isParametrosOpen);
                            }}
                            className="p-1.5 mr-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-inherit border-0 bg-transparent cursor-pointer flex items-center justify-center transition-colors shrink-0"
                            title="Expandir"
                        >
                            <ChevronRightIcon className={`shrink-0 transition-all duration-200 ${isMenuOpen ? 'rotate-90' : ''
                                } ${isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                                }`} />
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 duration-150">
                            {[
                                { name: 'Líneas de Investigación', path: '/parametros-normativos?tab=lineas', icon: BookOpen },
                                { name: 'Períodos Académicos', path: '/parametros-normativos?tab=periodos', icon: Calendar },
                                { name: 'Tipos de Producto', path: '/parametros-normativos?tab=productos', icon: Tag },
                                { name: 'Dominios Académicos', path: '/parametros-normativos?tab=dominios', icon: Globe },
                                { name: 'Indicadores CACES', path: '/parametros-normativos?tab=indicadores', icon: Activity }
                            ].map((subItem) => {
                                const isSubActive = location.pathname === '/parametros-normativos' && (
                                    (subItem.path.includes('tab=lineas') && (!location.search || location.search.includes('tab=lineas'))) ||
                                    location.search.includes(subItem.path.split('?')[1])
                                );

                                return (
                                    <Link
                                        key={subItem.name}
                                        to={subItem.path}
                                        onClick={() => {
                                            if (onClose) onClose();
                                        }}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ml-2 pl-2.5 ${isSubActive
                                            ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                                            : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                                            <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isSubActive
                                                ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                                                : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                                                }`}>
                                                <subItem.icon size={13} strokeWidth={isSubActive ? 2 : 1.5} className="shrink-0" />
                                            </div>
                                            <span className={`text-[12px] tracking-tight truncate ${isSubActive ? 'font-semibold text-text-main' : 'font-medium'
                                                }`}>
                                                {subItem.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                    if (onClose) onClose();
                }}
                className={`flex items-center justify-between px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 group no-underline ${item.indent ? 'ml-2 pl-2.5' : ''
                    } ${isActive
                        ? 'bg-[#ededed] dark:bg-[#1a1a1a] text-text-main'
                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                    }`}
            >
                <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0 ${isActive
                        ? 'bg-white dark:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-black/10 dark:border-white/10 text-text-main'
                        : 'bg-transparent border border-transparent text-text-dim group-hover:text-text-main'
                        }`}>
                        <item.icon size={item.indent ? 13 : 15} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    </div>
                    <span className={`text-[14px] tracking-tight truncate ${item.indent ? 'text-[13px]' : ''
                        } ${isActive ? 'font-semibold text-text-main' : 'font-medium'
                        }`}>
                        {item.name}
                    </span>
                </div>
                {item.hasChevron && (
                    <ChevronRightIcon className={`shrink-0 ml-1.5 transition-colors ${isActive ? 'text-text-main/50' : 'text-text-dim/30 group-hover:text-text-dim/70'
                        }`} />
                )}
            </Link>
        );
    };

    return (
        <nav className="flex-1 min-h-0 overflow-y-auto pr-1 scroll-pb-24 select-none outline-none relative">
            <div className="px-2.5 space-y-1">
                {group1.map(renderMenuItem)}

                {group2.length > 0 && (
                    <>
                        <hr className="border-border-thin my-3" />
                        {group2.map(renderMenuItem)}
                    </>
                )}

                {group3.length > 0 && (
                    <>
                        <hr className="border-border-thin my-3" />
                        {group3.map(renderMenuItem)}
                    </>
                )}
            </div>
            <div className={`${NAV_SCROLL_SPACER} shrink-0`} aria-hidden="true" />
        </nav>
    );
};
