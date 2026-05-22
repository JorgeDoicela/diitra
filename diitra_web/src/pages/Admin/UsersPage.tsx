import React, { useState, useEffect } from 'react';
import {
    Search, Shield, User as UserIcon, X, RefreshCw,
    Settings2, GraduationCap, UserPlus, History, Globe,
    Activity, ChevronRight, Mail, Hash,
    Fingerprint
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
    carrera?: string;
    nivel?: string;
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
    
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(10);

    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
    const [showExternalForm, setShowExternalForm] = useState(false);
    const [showAudit, setShowAudit] = useState(false);

    const [externalForm, setExternalForm] = useState({
        cedula: '',
        full_name: '',
        email: '',
        especialidad: '',
        grado_academico: '',
        institucion: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/users?search=${search}&type=${userType}&page=${page}&pageSize=${pageSize}`);
            setUsers(response.data.items);
            setTotalCount(response.data.total_count);
            setTotalPages(response.data.total_pages);
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
        setPage(1);
    }, [search, userType]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, userType, page]);

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
            setExternalForm({ cedula: '', full_name: '', email: '', especialidad: '', grado_academico: '', institucion: '' });
            fetchUsers();
            fetchAuditLogs();
        } catch (error) {
            console.error('Error registering external:', error);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto transition-colors duration-300">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-12 px-2 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-text-main">
                        <Shield size={10} strokeWidth={2} />
                        <span>Administración Central - DIITRA</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Gestión Institucional</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Control de acceso institucional y gestión de evaluadores pares externos.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAudit(!showAudit)}
                            className={`flex-1 md:flex-none p-2.5 border rounded-md transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${showAudit ? 'btn-vercel-primary' : 'btn-vercel-secondary'}`}
                        >
                            <History size={14} /> Auditoría
                        </button>

                        {userType === 'EXTERNO' && (
                            <button
                                onClick={() => setShowExternalForm(true)}
                                className="btn-brand flex-1 md:flex-none flex items-center justify-center gap-2"
                            >
                                <UserPlus size={14} /> Nuevo Externo
                            </button>
                        )}
                    </div>

                    <div className="bg-surface border border-border-thin p-1 rounded-lg flex overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setUserType('DOCENTE')}
                            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'DOCENTE' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Docentes
                        </button>
                        <button
                            onClick={() => setUserType('ESTUDIANTE')}
                            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'ESTUDIANTE' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Alumnos
                        </button>
                        <button
                            onClick={() => setUserType('EXTERNO')}
                            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'EXTERNO' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                        >
                            <Globe size={12} /> Externos
                        </button>
                    </div>

                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder={`Buscar en ${userType}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-vercel !pl-10 !py-2.5 !text-xs uppercase tracking-wider !font-mono placeholder:!lowercase"
                        />
                    </div>
                </div>
            </header>

            <div className={`grid transition-all duration-500 gap-6 ${showAudit ? 'lg:grid-cols-[1fr,350px]' : 'grid-cols-1'}`}>
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
                                <tr key={u.id_profesor} className="hover:bg-surface/30 transition-colors group cursor-pointer"
                                    onClick={() => setDetailUser(u)}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all shrink-0">
                                                <UserIcon size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main tracking-tight uppercase">{u.nombre_completo}</p>
                                                <p className="text-[10px] text-text-dim font-mono uppercase opacity-60 tracking-tighter">{u.id_profesor} &bull; {u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {u.type === 'DOCENTE' ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge-vercel ${(u.horas_investigacion || 0) > 0 ? 'badge-vercel-success' : 'badge-vercel-error'}`}>
                                                        <Activity size={10} />
                                                        {u.horas_investigacion || 0}h Investigación
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest opacity-70">
                                                    {u.tipo_dedicacion || 'Sin contrato activo'}
                                                </p>
                                            </div>
                                        ) : u.type === 'ESTUDIANTE' ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="badge-vercel badge-vercel-neutral">
                                                        <GraduationCap size={10} />
                                                        {u.carrera || 'Sin Carrera'}
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
                                                <span className="status-tag text-text-dim border-border-thin">
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
                                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                                            className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all flex items-center justify-center ${
                                                page === p ? 'btn-vercel-primary' : 'text-text-dim hover:text-text-main hover:bg-surface'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="btn-vercel-secondary px-2 md:px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <span className="hidden md:inline">Siguiente</span>
                                <span className="md:hidden">{">"}</span>
                            </button>
                        </div>
                    </footer>
                </div>

                {showAudit && (
                    <aside className="bento-card static p-6 animate-fade-left flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h4 className="section-label text-text-main">
                                <History size={14} /> Registro de Actividad
                            </h4>
                            <button onClick={fetchAuditLogs} className="text-text-dim hover:text-text-main transition-colors">
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {auditLogs.map((log) => (
                                <div key={log.id_audit} className="p-3 bg-bg-deep/50 rounded-lg border border-border-thin space-y-2 group hover:border-border-hover transition-all">
                                    <div className="flex justify-between items-start">
                                        <span className="status-tag text-text-dim border-border-thin">
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

            {showExternalForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowExternalForm(false); }}>
                    <div className="modal-card modal-card--lg animate-fade-up">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-info !p-2"><Globe size={20} /></div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Registro de Evaluador Académico</h3>
                                    <p className="section-label text-text-dim">Personal Externo DIITRA - IST Quito</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowExternalForm(false)} className="text-text-dim hover:text-text-main transition-colors"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleRegisterExternal} className="modal-body">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-4">
                                    <label className="section-label text-text-main">Identificación y Contacto</label>
                                    <div className="divider-vercel !my-0" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Cédula / Pasaporte</label>
                                            <input required type="text" value={externalForm.cedula} onChange={e => setExternalForm({ ...externalForm, cedula: e.target.value })} className="input-vercel" placeholder="1712345678" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Correo Electrónico</label>
                                            <input required type="email" value={externalForm.email} onChange={e => setExternalForm({ ...externalForm, email: e.target.value })} className="input-vercel" placeholder="dr.perez@universidad.edu.ec" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="section-label text-text-dim">Nombres Completos (Grado Académico + Nombres)</label>
                                            <input required type="text" value={externalForm.full_name} onChange={e => setExternalForm({ ...externalForm, full_name: e.target.value })} className="input-vercel !uppercase" placeholder="Ej: PhD. Juan Pérez Arrieta" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-4 mt-4">
                                    <label className="section-label text-text-main">Perfil Profesional (Contexto SENESCYT)</label>
                                    <div className="divider-vercel !my-0" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Grado Máximo</label>
                                            <select 
                                                value={externalForm.grado_academico} 
                                                onChange={e => setExternalForm({ ...externalForm, grado_academico: e.target.value })}
                                                className="input-vercel"
                                            >
                                                <option value="">Seleccionar...</option>
                                                <option value="PHD">Doctorado / PhD</option>
                                                <option value="MAESTRIA">Maestría / Magíster</option>
                                                <option value="ESPECIALIDAD">Especialidad Médica</option>
                                                <option value="TERCER_NIVEL">Tercer Nivel</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Especialidad (Línea de Inv.)</label>
                                            <input type="text" value={externalForm.especialidad} onChange={e => setExternalForm({ ...externalForm, especialidad: e.target.value })} className="input-vercel" placeholder="Ej: Inteligencia Artificial" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="section-label text-text-dim">Institución de Origen</label>
                                            <input type="text" value={externalForm.institucion} onChange={e => setExternalForm({ ...externalForm, institucion: e.target.value })} className="input-vercel" placeholder="Ej: Escuela Politécnica Nacional" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="modal-footer">
                            <div className="flex items-center gap-2 text-text-dim text-[9px]">
                                <Shield size={10} />
                                <span>Se asignará automáticamente el rol de Revisor Externo DIITRA</span>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowExternalForm(false)} className="btn-vercel-secondary">Cancelar</button>
                                <button type="submit" className="btn-vercel-primary">Registrar Evaluador</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => { setSelectedUser(null); fetchUsers(); fetchAuditLogs(); }}
                />
            )}

            {detailUser && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setDetailUser(null)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <UserIcon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">{detailUser.nombre_completo}</h3>
                                    <p className="section-label text-text-dim">
                                        {detailUser.type === 'DOCENTE' ? 'Docente Investigador' : detailUser.type === 'ESTUDIANTE' ? 'Estudiante' : 'Evaluador Externo'} — DIITRA
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDetailUser(null)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-2">
                                        <Mail size={12} /> Correo Electrónico
                                    </label>
                                    <p className="text-sm font-bold text-text-main break-all">{detailUser.email}</p>
                                </div>
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-2">
                                        <Hash size={12} /> Cédula / ID
                                    </label>
                                    <p className="text-sm font-bold text-text-main font-mono">{detailUser.id_profesor}</p>
                                </div>
                            </div>

                            {detailUser.type === 'DOCENTE' && (
                                <div className="bento-card static p-4 space-y-3">
                                    <label className="section-label text-text-main">
                                        <Activity size={12} /> Capacidades Docentes
                                    </label>
                                    <div className="divider-vercel !my-0" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="section-label text-text-dim mb-1">Horas Investigación</p>
                                            <div className={`badge-vercel ${(detailUser.horas_investigacion || 0) > 0 ? 'badge-vercel-success' : 'badge-vercel-error'}`}>
                                                <Activity size={10} />
                                                {detailUser.horas_investigacion || 0}h
                                            </div>
                                        </div>
                                        <div>
                                            <p className="section-label text-text-dim mb-1">Dedicación</p>
                                            <p className="text-sm font-bold text-text-main">{detailUser.tipo_dedicacion || 'Sin contrato'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailUser.type === 'ESTUDIANTE' && (
                                <div className="bento-card static p-4 space-y-3">
                                    <label className="section-label text-text-main">
                                        <GraduationCap size={12} /> Información Académica
                                    </label>
                                    <div className="divider-vercel !my-0" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="section-label text-text-dim mb-1">Carrera</p>
                                            <p className="text-sm font-bold text-text-main">{detailUser.carrera || 'Sin carrera'}</p>
                                        </div>
                                        <div>
                                            <p className="section-label text-text-dim mb-1">Nivel</p>
                                            <p className="text-sm font-bold text-text-main">{detailUser.nivel || 'Sin nivel'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailUser.type === 'EXTERNO' && (
                                <div className="bento-card static p-4 space-y-3">
                                    <label className="section-label text-text-main">
                                        <Globe size={12} /> Perfil Externo
                                    </label>
                                    <div className="divider-vercel !my-0" />
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="section-label text-text-dim">ORCID</span>
                                            <span className={`badge-vercel ${detailUser.orcid_id ? 'badge-vercel-success' : 'badge-vercel-error'}`}>
                                                {detailUser.orcid_id ? 'Verificado' : 'No registrado'}
                                            </span>
                                        </div>
                                        {detailUser.orcid_id && (
                                            <p className="text-xs font-mono text-text-dim break-all">{detailUser.orcid_id}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-main">
                                    <Shield size={12} /> Permisos Asignados
                                </label>
                                <div className="divider-vercel !my-0" />
                                <div className="flex flex-wrap gap-2">
                                    {detailUser.role_codes && detailUser.role_codes.length > 0 ? (
                                        detailUser.role_codes.map(code => (
                                            <span key={code} className="badge-vercel badge-vercel-info">
                                                {code}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-text-dim">Sin roles asignados</p>
                                    )}
                                </div>
                            </div>

                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-main">
                                    <Fingerprint size={12} /> Firma Electrónica
                                </label>
                                <div className="divider-vercel !my-0" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-dim">Estado del Certificado</span>
                                    <span className={`badge-vercel ${detailUser.firma_habilitada ? 'badge-vercel-success' : 'badge-vercel-neutral'}`}>
                                        <span className={`dot ${detailUser.firma_habilitada ? 'dot-success' : 'dot-neutral'}`} />
                                        {detailUser.firma_habilitada ? 'Habilitada' : 'No cargada'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setDetailUser(null)} className="btn-vercel-secondary">Cerrar</button>
                            <button 
                                onClick={() => { setSelectedUser(detailUser); setDetailUser(null); }}
                                className="btn-vercel-primary flex items-center gap-2"
                            >
                                <Settings2 size={14} /> Editar Perfil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default UsersPage;