import React, { useState, useEffect } from 'react';
import { 
    Search, Shield, User as UserIcon, Check, X, RefreshCw, 
    ShieldAlert, Filter, Settings2, ExternalLink, GraduationCap, 
    Users as UsersIcon, Award, UserPlus, History, Clock, Globe,
    Activity
} from 'lucide-react';
import api from '../../api/axios_config';
import UserProfileModal from './components/UserProfileModal';

interface ManagedUser {
    id_profesor: string;
    nombre_completo: string;
    email: string;
    user_uuid: string;
    type: string;
    roles: string[];
    role_codes: string[];
    orcid_id?: string;
    firma_habilitada: boolean;
    horas_investigacion?: number;
    tipo_dedicacion?: string;
}

interface Role {
    id_rol: number;
    nombre: string;
    codigo_rol: string;
}

interface AuditLog {
    id_audit: number;
    admin_name: string;
    target_name: string;
    action: string;
    details: string;
    date: string;
}

const UsersPage = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [search, setSearch] = useState('');
    const [userType, setUserType] = useState<'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO'>('DOCENTE');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [showExternalForm, setShowExternalForm] = useState(false);
    const [showAudit, setShowAudit] = useState(false);

    const [externalForm, setExternalForm] = useState({
        cedula: '',
        full_name: '',
        email: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/users?search=${search}&type=${userType}`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/Admin/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await api.get('/Admin/audit');
            setAuditLogs(response.data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchAuditLogs();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, userType]);

    const toggleRole = async (userId: string, roleCode: string, hasRole: boolean) => {
        setUpdating(`${userId}-${roleCode}`);
        try {
            if (hasRole) {
                await api.post('/Admin/roles/revoke', { id_usuario: userId, role_code: roleCode, user_type: userType });
            } else {
                await api.post('/Admin/roles/assign', { id_usuario: userId, role_code: roleCode, user_type: userType });
            }
            await fetchUsers(); 
            fetchAuditLogs();
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleRegisterExternal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/Admin/external', externalForm);
            setShowExternalForm(false);
            setExternalForm({ cedula: '', full_name: '', email: '' });
            fetchUsers();
            fetchAuditLogs();
        } catch (error) {
            console.error('Error registering external:', error);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-10 overflow-y-auto transition-colors duration-300 relative">
            <header className="flex justify-between items-end mb-12 px-2 animate-fade-up">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Shield size={10} strokeWidth={2} className="text-text-main" />
                        <span>Administración Central - DIITRA Production</span>
                    </div>
                    <h2 className="text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Gestión Institucional</h2>
                    <p className="text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Control de acceso institucional y gestión de evaluadores pares externos.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowAudit(!showAudit)}
                        className={`p-2.5 border rounded-md transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                            showAudit ? 'bg-text-main text-bg-deep border-text-main' : 'border-border-thin text-text-dim hover:text-text-main'
                        }`}
                    >
                        <History size={14} /> Auditoría
                    </button>
                    
                    {userType === 'EXTERNO' && (
                        <button 
                            onClick={() => setShowExternalForm(true)}
                            className="bg-text-main text-bg-deep px-4 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-text-main/10"
                        >
                            <UserPlus size={14} /> Nuevo Externo
                        </button>
                    )}

                    <div className="bg-surface border border-border-thin p-1 rounded-lg flex">
                        <button 
                            onClick={() => setUserType('DOCENTE')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                userType === 'DOCENTE' ? 'bg-surface-elevated text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            Docentes
                        </button>
                        <button 
                            onClick={() => setUserType('ESTUDIANTE')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                userType === 'ESTUDIANTE' ? 'bg-surface-elevated text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            Alumnos
                        </button>
                        <button 
                            onClick={() => setUserType('EXTERNO')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                userType === 'EXTERNO' ? 'bg-surface-elevated text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            <Globe size={12} /> Externos
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder={`Buscar en ${userType}...`} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-bg-deep border border-border-thin rounded-md pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all w-64 uppercase tracking-wider font-mono placeholder:lowercase"
                        />
                    </div>
                </div>
            </header>

            <div className={`grid transition-all duration-500 gap-6 ${showAudit ? 'grid-cols-[1fr,350px]' : 'grid-cols-1'}`}>
                <div className="bento-card overflow-hidden animate-fade-up">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                <th className="p-4 font-bold tracking-widest">Actor</th>
                                <th className="p-4 font-bold tracking-widest">Capacidad (SIGAFI)</th>
                                <th className="p-4 font-bold tracking-widest">Permisos / Roles</th>
                                <th className="p-4 font-bold tracking-widest text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {users.map((u) => (
                                <tr key={u.id_profesor} className="hover:bg-surface/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-dim group-hover:text-text-main group-hover:border-text-main transition-all shadow-inner">
                                                <UserIcon size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main tracking-tight uppercase">{u.nombre_completo}</p>
                                                <p className="text-[10px] text-text-dim font-mono uppercase opacity-60 tracking-tighter">{u.id_profesor} • {u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {u.type === 'DOCENTE' ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                                        (u.horas_investigacion || 0) > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                        <Activity size={10} className="inline mr-1" />
                                                        {u.horas_investigacion || 0}h Investigación
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest opacity-70">
                                                    {u.tipo_dedicacion || 'Sin contrato activo'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-24 h-1.5 bg-bg-deep rounded-full overflow-hidden border border-border-thin">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${u.orcid_id ? 'w-full bg-green-500' : 'w-1/3 bg-red-500/50'}`}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">
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
                                                        onClick={() => toggleRole(u.id_profesor, r.codigo_rol, isActive)}
                                                        className={`px-2 py-1 rounded border text-[8px] font-black uppercase tracking-tighter transition-all flex items-center gap-1.5 ${
                                                            isActive 
                                                                ? 'bg-text-main text-bg-deep border-text-main' 
                                                                : 'bg-transparent text-text-dim border-border-thin hover:border-text-dim'
                                                        } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        {r.nombre}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setSelectedUser(u)}
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

                {/* Sidebar de Auditoría */}
                {showAudit && (
                    <aside className="bento-card bg-surface/50 border-l border-border-thin p-6 animate-fade-left flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                <History size={14} /> Registro de Actividad
                            </h4>
                            <button onClick={fetchAuditLogs} className="text-text-dim hover:text-text-main transition-colors">
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {auditLogs.map((log) => (
                                <div key={log.id_audit} className="p-3 bg-bg-deep/50 rounded-lg border border-border-thin space-y-2 group hover:border-text-main/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-black text-text-main bg-text-main/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                            {log.action}
                                        </span>
                                        <span className="text-[8px] text-text-dim font-mono">{new Date(log.date).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-[10px] text-text-main font-medium leading-tight">
                                        <span className="text-text-dim">Por:</span> {log.admin_name}
                                    </p>
                                    <p className="text-[10px] text-text-main font-medium leading-tight">
                                        <span className="text-text-dim">A:</span> {log.target_name}
                                    </p>
                                    <p className="text-[9px] text-text-dim italic leading-snug border-t border-border-thin pt-2 mt-2">
                                        {log.details}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>

            {/* Modal Registro Externo */}
            {showExternalForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-deep/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <form onSubmit={handleRegisterExternal}>
                            <header className="p-6 border-b border-border-thin bg-bg-deep/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-text-main/10 text-text-main rounded-lg"><UserPlus size={20} /></div>
                                    <div>
                                        <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Registro de Evaluador</h3>
                                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Personal Externo DIITRA</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowExternalForm(false)} className="text-text-dim hover:text-text-main"><X size={20} /></button>
                            </header>
                            <div className="p-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Identificación / Cédula</label>
                                    <input required type="text" value={externalForm.cedula} onChange={e => setExternalForm({...externalForm, cedula: e.target.value})} className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main" placeholder="1712345678" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombres Completos</label>
                                    <input required type="text" value={externalForm.full_name} onChange={e => setExternalForm({...externalForm, full_name: e.target.value})} className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main uppercase" placeholder="Ej: Dr. Juan Pérez" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Correo Electrónico</label>
                                    <input required type="email" value={externalForm.email} onChange={e => setExternalForm({...externalForm, email: e.target.value})} className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main" placeholder="juan.perez@universidad.edu.ec" />
                                </div>
                            </div>
                            <footer className="p-6 bg-bg-deep/50 border-t border-border-thin flex justify-end gap-3">
                                <button type="button" onClick={() => setShowExternalForm(false)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">Cancelar</button>
                                <button type="submit" className="bg-text-main text-bg-deep px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest">Registrar y Asignar Rol</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {selectedUser && (
                <UserProfileModal 
                    user={selectedUser} 
                    onClose={() => { setSelectedUser(null); fetchUsers(); fetchAuditLogs(); }} 
                />
            )}
        </main>
    );
};

export default UsersPage;
