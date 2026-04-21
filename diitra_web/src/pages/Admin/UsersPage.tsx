import React, { useState, useEffect } from 'react';
import { Search, Shield, User as UserIcon, Check, X, RefreshCw, MoreVertical, ShieldAlert } from 'lucide-react';
import api from '../../api/axios_config';

interface ManagedUser {
    id_profesor: string;
    nombre_completo: string;
    email: string;
    roles: string[];
    role_codes: string[];
}

const UsersPage = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/users?search=${search}`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const toggleRole = async (userId: string, roleCode: string, hasRole: boolean) => {
        setUpdating(`${userId}-${roleCode}`);
        try {
            if (hasRole) {
                await api.post('/Admin/roles/revoke', { id_profesor: userId, role_code: roleCode });
            } else {
                await api.post('/Admin/roles/assign', { id_profesor: userId, role_code: roleCode });
            }
            await fetchUsers(); // Refresh
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-10 overflow-y-auto transition-colors duration-300">
            <header className="flex justify-between items-end mb-16 px-2 animate-fade-up">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Shield size={10} strokeWidth={2} className="text-text-main" />
                        <span>Panel Administrativo - ISTPET</span>
                    </div>
                    <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Gestión Institucional</h2>
                    <p className="text-sm text-text-dim max-w-lg font-medium leading-relaxed">Control de acceso y asignación de roles para el personal del Departamento de Investigación.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar profesor o cédula..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-bg-deep border border-border-thin rounded-md pl-10 pr-4 py-2 text-xs text-text-main focus:outline-none focus:border-text-main transition-all w-64 uppercase tracking-wider font-mono placeholder:lowercase"
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="p-2 border border-border-thin rounded-md hover:bg-surface text-text-dim hover:text-text-main transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="bento-card overflow-hidden animate-fade-up [animation-delay:200ms]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                            <th className="p-4 font-bold tracking-widest">Identidad</th>
                            <th className="p-4 font-bold tracking-widest">Roles DIITRA</th>
                            <th className="p-4 font-bold tracking-widest">Acciones Administrativas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin">
                        {users.map((u) => (
                            <tr key={u.id_profesor} className="hover:bg-surface/30 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-surface border border-border-thin flex items-center justify-center text-text-dim group-hover:text-text-main group-hover:border-text-main transition-all">
                                            <UserIcon size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-main tracking-tight uppercase">{u.nombre_completo}</p>
                                            <p className="text-[10px] text-text-dim font-mono">{u.id_profesor}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {u.roles.length > 0 ? (
                                            u.roles.map(r => (
                                                <span key={r} className="px-2 py-0.5 bg-text-main/10 border border-text-main/20 text-text-main text-[9px] font-bold uppercase tracking-tighter rounded-full">
                                                    {r}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-text-dim uppercase font-mono tracking-tighter">Sin_Roles_Asignados</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Toggle Admin Role */}
                                        <RoleToggleButton 
                                            label="Administrador"
                                            isActive={u.role_codes?.includes('ADMIN_SISTEMA')}
                                            loading={updating === `${u.id_profesor}-ADMIN_SISTEMA`}
                                            onClick={() => toggleRole(u.id_profesor, 'ADMIN_SISTEMA', u.role_codes?.includes('ADMIN_SISTEMA'))}
                                        />
                                        {/* Toggle Director Role */}
                                        <RoleToggleButton 
                                            label="Director"
                                            variant="secondary"
                                            isActive={u.role_codes?.includes('DIRECTOR_INV')}
                                            loading={updating === `${u.id_profesor}-DIRECTOR_INV`}
                                            onClick={() => toggleRole(u.id_profesor, 'DIRECTOR_INV', u.role_codes?.includes('DIRECTOR_INV'))}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-surface border border-border-thin text-text-dim">
                            <ShieldAlert size={24} />
                        </div>
                        <p className="text-sm text-text-dim font-medium">No se encontraron resultados para "{search}"</p>
                    </div>
                )}
            </div>
        </main>
    );
};

const RoleToggleButton = ({ label, isActive, loading, onClick, variant = 'primary' }: any) => {
    return (
        <button 
            onClick={onClick}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-[10px] font-bold uppercase tracking-widest ${
                isActive 
                    ? 'bg-text-main text-bg-deep border-text-main shadow-md' 
                    : 'bg-transparent text-text-dim border-border-thin hover:border-text-dim hover:text-text-main'
            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
            {loading ? <RefreshCw size={10} className="animate-spin" /> : (isActive ? <Check size={10} strokeWidth={3} /> : <Shield size={10} />)}
            <span>{label}</span>
        </button>
    );
};

export default UsersPage;
