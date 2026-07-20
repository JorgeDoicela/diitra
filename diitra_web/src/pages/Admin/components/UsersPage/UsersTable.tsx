import React from 'react';
import { User as UserIcon, GraduationCap, Settings2 } from 'lucide-react';
import type { ManagedUser, Role } from '../../hooks/useUsersPage';
import { formatCarrera, formatNombre, highlightText } from './utils';

interface UsersTableProps {
    users: ManagedUser[];
    roles: Role[];
    search: string;
    userType: 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO';
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>> | ((page: number | ((p: number) => number)) => void);
    pageSize: number;
    totalCount: number;
    totalPages: number;
    loading: boolean;
    updating: string | null;
    detailUser: ManagedUser | null;
    setDetailUser: (user: ManagedUser | null) => void;
    lastActiveUserId: string | null;
    setLastActiveUserId: (id: string | null) => void;
    setSelectedUser: (user: ManagedUser | null) => void;
    handleRoleToggle: (userId: string, userName: string, roleCode: string, roleName: string, hasRole: boolean) => void;
    openedAtRef: React.MutableRefObject<number>;
}

export const UsersTable: React.FC<UsersTableProps> = ({
    users,
    roles,
    search,
    userType,
    page,
    setPage,
    pageSize,
    totalCount,
    totalPages,
    loading,
    updating,
    detailUser,
    setDetailUser,
    lastActiveUserId,
    setLastActiveUserId,
    setSelectedUser,
    handleRoleToggle,
    openedAtRef
}) => {
    return (
        <div className="bento-card static overflow-hidden animate-fade-up">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                            <th className="p-4 font-bold tracking-widest">Actor</th>
                            <th className="p-4 font-bold tracking-widest">Capacidad (SIGAFI)</th>
                            <th className="p-4 font-bold tracking-widest">Permisos / Roles</th>
                            <th className="p-4 font-bold tracking-widest text-right">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center">
                                    <p className="section-label text-text-dim justify-center">Cargando Personal...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="empty-state py-20">
                                        <p className="text-text-dim font-bold uppercase tracking-widest">No se encontraron registros</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.map((u) => (
                            <tr key={u.id_profesor}
                                className={`transition-all duration-300 group cursor-pointer ${detailUser?.id_profesor === u.id_profesor
                                    ? 'bg-brand/[0.08] border-brand/35'
                                    : (!detailUser && lastActiveUserId === u.id_profesor)
                                        ? 'row-last-active'
                                        : 'hover:bg-surface/30'
                                    }`}
                                onClick={() => { setDetailUser(u); openedAtRef.current = Date.now(); setLastActiveUserId(null); }}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all shrink-0">
                                            <UserIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-main tracking-tight">
                                                {highlightText(formatNombre(u.nombre_completo), search)}
                                            </p>
                                            <p className="text-[10px] text-text-dim font-mono uppercase opacity-60 tracking-tighter">
                                                {highlightText(u.id_profesor, search)} &bull; {highlightText(u.email, search)}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {u.type === 'DOCENTE' ? (
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                                                <span className="text-text-dim flex items-center gap-1.5" title="Horas Distributivo">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(u.horas_investigacion || 0) > 0 ? 'bg-success' : 'bg-error'}`} />
                                                    SIGAFI: <span className="font-semibold text-text-main">{u.horas_investigacion || 0}h</span>
                                                </span>
                                                <span className="text-text-dim flex items-center gap-1.5" title="Horas Comprometidas en Proyectos (DIITRA)">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(u.horas_asignadas || 0) > 0 ? 'bg-info' : 'bg-text-dim/40'}`} />
                                                    Asig: <span className="font-semibold text-text-main">{u.horas_asignadas || 0}h</span>
                                                </span>
                                                <span className="text-text-dim flex items-center gap-1.5" title="Horas Disponibles">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${((u.horas_investigacion || 0) - (u.horas_asignadas || 0)) > 0 ? 'bg-success' : 'bg-error'}`} />
                                                    Disp: <span className="font-semibold text-text-main">{Math.max(0, (u.horas_investigacion || 0) - (u.horas_asignadas || 0))}h</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-text-dim/80 font-semibold tracking-wide mt-1 pr-2">
                                                <GraduationCap size={11} className="text-text-dim/50 shrink-0" />
                                                <span className="truncate max-w-[190px]" title={u.carrera}>
                                                    {highlightText(formatCarrera(u.carrera), search)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : u.type === 'ESTUDIANTE' ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-text-dim/80 font-semibold tracking-wide pr-2">
                                                <GraduationCap size={11} className="text-text-dim/50 shrink-0" />
                                                <span className="truncate max-w-[190px]" title={u.carrera}>
                                                    {highlightText(formatCarrera(u.carrera), search)}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest opacity-70">
                                                {u.nivel || 'Nivel no definido'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-24 h-1.5 bg-bg-deep rounded-full overflow-hidden border border-border-thin">
                                                <div
                                                    className={`progress-fill ${u.orcid_id ? 'progress-fill--success' : 'progress-fill--brand'}`}
                                                    style={{ width: u.orcid_id ? '100%' : '33%' }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-text-dim font-medium">
                                                {u.orcid_id ? 'Completado' : 'Perfil Incompleto'}
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {roles.map(r => {
                                            const isActive = u.role_codes?.includes(r.codigo_rol);
                                            const isUpdating = updating === `${u.id_profesor}-${r.codigo_rol}`;
                                            return (
                                                <button
                                                    key={r.id_rol}
                                                    onClick={(e) => { e.stopPropagation(); handleRoleToggle(u.id_profesor, u.nombre_completo, r.codigo_rol, r.nombre, isActive); }}
                                                    className={`${isActive ? 'btn-vercel-primary' : 'btn-vercel-secondary'} !py-1 !px-2 !text-[8px] !tracking-tighter flex items-center gap-1.5 ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    {r.nombre}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                        className="p-2 hover:bg-surface rounded-md text-text-dim hover:text-text-main transition-all ml-auto"
                                        title="Editar Perfil Extendido"
                                    >
                                        <Settings2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="p-4 bg-surface/30 border-t border-border-thin flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest text-center md:text-left">
                    Mostrando <span className="text-text-main">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)}</span> de <span className="text-text-main">{totalCount}</span> {userType.toLowerCase()}s
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, (p as number) - 1))}
                        disabled={page === 1}
                        className="btn-vercel-secondary px-2 md:px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="hidden md:inline">Anterior</span>
                        <span className="md:hidden">{"<"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) return null;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all flex items-center justify-center ${page === p ? 'btn-vercel-primary' : 'text-text-dim hover:text-text-main hover:bg-surface'
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, (p as number) + 1))}
                        disabled={page === totalPages || totalPages === 0}
                        className="btn-vercel-secondary px-2 md:px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="hidden md:inline">Siguiente</span>
                        <span className="md:hidden">{">"}</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};
