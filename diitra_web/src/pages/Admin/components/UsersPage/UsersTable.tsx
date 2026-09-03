import React from 'react';
import { User as UserIcon, Settings2, ShieldCheck, Activity } from 'lucide-react';
import type { ManagedUser, Role } from '../../hooks/useUsersPage';
import { formatCarrera, formatNombre, highlightText } from './utils';

interface UsersTableProps {
    users: ManagedUser[];
    roles: Role[];
    search: string;
    userType: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
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
        <div className="overflow-x-auto custom-scrollbar border border-border-thin rounded-xl bg-surface/50">
            <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Usuario / Identificación</th>
                        <th className="p-4 font-semibold tracking-widest">
                            {userType === 'DOCENTE' ? 'Horas / Carrera' : userType === 'ADMINISTRATIVO' ? 'Departamento / Cargo' : userType === 'ESTUDIANTE' ? 'Carrera / Estado' : 'Validación Perfil'}
                        </th>
                        <th className="p-4 font-semibold tracking-widest">Roles en el Sistema</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin text-xs">
                    {loading ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center">
                                <p className="section-label text-text-dim justify-center">Cargando Personal...</p>
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={4}>
                                <div className="empty-state py-20 text-center">
                                    <p className="text-text-dim font-bold uppercase tracking-widest">No se encontraron registros</p>
                                </div>
                            </td>
                        </tr>
                    ) : users.map((u) => {
                        const userActiveRoles = roles.filter(r => u.role_codes?.includes(r.codigo_rol));

                        return (
                            <tr
                                key={u.id_profesor}
                                className={`transition-colors duration-150 group cursor-pointer ${
                                    detailUser?.id_profesor === u.id_profesor
                                        ? 'bg-brand/[0.08]'
                                        : (!detailUser && lastActiveUserId === u.id_profesor)
                                            ? 'row-last-active'
                                            : 'hover:bg-surface/30'
                                }`}
                                onClick={() => { setDetailUser(u); openedAtRef.current = Date.now(); setLastActiveUserId(null); }}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-dim group-hover:text-text-main group-hover:border-border transition-colors shrink-0">
                                            <UserIcon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-text-main tracking-tight group-hover:text-brand transition-colors">
                                                {highlightText(formatNombre(u.nombre_completo), search)}
                                            </p>
                                            <p className="text-[10px] text-text-dim font-mono mt-0.5">
                                                {highlightText(u.id_profesor, search)} &bull; {highlightText(u.email, search)}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {u.type === 'DOCENTE' ? (
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                                                <span className="text-text-dim flex items-center gap-1.5" title="Horas Distributivo (SIGAFI)">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(u.horas_investigacion || 0) > 0 ? 'bg-success' : 'bg-text-dim/40'}`} />
                                                    SIGAFI: <span className="font-semibold text-text-main">{u.horas_investigacion || 0}h</span>
                                                </span>
                                                <span className="text-text-dim flex items-center gap-1.5" title="Horas Comprometidas en Proyectos (DIITRA)">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(u.horas_asignadas || 0) > 0 ? 'bg-info' : 'bg-text-dim/40'}`} />
                                                    Asig: <span className="font-semibold text-text-main">{u.horas_asignadas || 0}h</span>
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-text-dim font-medium tracking-wide">
                                                <span className="truncate max-w-[210px] inline-block align-bottom" title={u.carrera}>
                                                    {highlightText(formatCarrera(u.carrera), search)}
                                                </span>
                                                {u.cargo_instituto && (
                                                    <span className="text-[9px] text-text-dim/60 font-mono ml-1.5">
                                                        ({u.cargo_instituto})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : u.type === 'ADMINISTRATIVO' ? (
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-semibold text-text-main truncate max-w-[220px]" title={u.departamento}>
                                                {highlightText(u.departamento || 'Administración General', search)}
                                            </p>
                                            <p className="text-[10px] text-text-dim font-medium flex items-center gap-1.5">
                                                <span>{u.cargo_instituto || 'Personal Administrativo'}</span>
                                                {u.tipo_contrato && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-deep border border-border-thin text-text-dim/80 font-mono uppercase">
                                                        {u.tipo_contrato}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    ) : u.type === 'ESTUDIANTE' ? (
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-text-dim font-medium tracking-wide truncate max-w-[210px]" title={u.carrera}>
                                                {highlightText(formatCarrera(u.carrera), search)}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest opacity-70">
                                                    {u.nivel || 'Nivel no definido'}
                                                </span>
                                                {u.es_instituto === false ? (
                                                    <span className="badge-vercel badge-vercel-neutral !text-[8px] !py-0 !px-1.5">
                                                        Conducción
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-neutral !text-[8px] !py-0 !px-1.5">
                                                        ISTPET
                                                    </span>
                                                )}
                                                {u.es_graduado ? (
                                                    <span className="badge-vercel badge-vercel-warning !text-[8px] !py-0 !px-1.5">
                                                        Graduado
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-success !text-[8px] !py-0 !px-1.5">
                                                        Matriculado
                                                    </span>
                                                )}
                                            </div>
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
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {userActiveRoles.length > 0 ? (
                                            userActiveRoles.map(r => {
                                                const isAdmin = r.codigo_rol === 'DIITRA_ADMIN';
                                                return (
                                                    <span
                                                        key={r.id_rol}
                                                        className={`badge-vercel ${isAdmin ? 'badge-vercel-info font-bold' : 'badge-vercel-neutral font-medium'} text-[9px] tracking-wider uppercase py-0.5 px-2`}
                                                    >
                                                        {r.nombre}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[10px] text-text-dim/60 font-mono italic">
                                                Sin roles asignados
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                        className="btn-vercel-secondary !p-1.5 rounded-lg text-text-dim hover:text-text-main transition-colors ml-auto cursor-pointer"
                                        title="Configurar Perfil y Roles"
                                    >
                                        <Settings2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <footer className="p-4 bg-surface/30 border-t border-border-thin flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest text-center md:text-left">
                    Mostrando <span className="text-text-main">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)}</span> de <span className="text-text-main">{totalCount}</span> {userType.toLowerCase()}s
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, (p as number) - 1))}
                        disabled={page === 1}
                        className="btn-vercel-secondary px-2 md:px-3 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                                    className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                                        page === p ? 'btn-vercel-primary' : 'text-text-dim hover:text-text-main hover:bg-surface'
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
                        className="btn-vercel-secondary px-2 md:px-3 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span className="hidden md:inline">Siguiente</span>
                        <span className="md:hidden">{">"}</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};
