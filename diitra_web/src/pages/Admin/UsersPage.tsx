import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Shield, User as UserIcon, X,
    Settings2, GraduationCap, UserPlus, Globe,
    Activity, ChevronRight, Mail, Hash,
    Fingerprint, XCircle, AlertTriangle, CheckCircle, FileText
} from 'lucide-react';
import api from '../../api/axios_config';
import UserProfileModal from './components/UserProfileModal';
import { useSearchParams } from 'react-router-dom';

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
    horas_asignadas?: number;
    carrera?: string;
    nivel?: string;
}

interface Role {
    id_rol: number;
    nombre: string;
    codigo_rol: string;
}

const formatCarrera = (carrera: string | null | undefined) => {
    if (!carrera) return 'Sin carrera asignada';
    return carrera
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m) => m.toLowerCase());
};

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

const highlightText = (text: string | null | undefined, search: string) => {
    if (!text) return '';
    if (!search.trim()) return <>{text}</>;
    
    try {
        const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        const parts = text.split(regex);
        
        return (
            <>
                {parts.map((part, i) => 
                    regex.test(part) ? (
                        <mark key={i} className="bg-brand/20 text-brand font-semibold px-0.5 rounded-sm">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    } catch (e) {
        return <>{text}</>;
    }
};

const UsersPage = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const typeParam = searchParams.get('type');
    const userType = (typeParam === 'DOCENTE' || typeParam === 'ESTUDIANTE' || typeParam === 'EXTERNO') ? typeParam : 'DOCENTE';
    const openUuid = searchParams.get('open'); // deep-link from CommandPalette
    
    const setUserType = (type: 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO') => {
        setSearch('');
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('type', type);
            return next;
        });
    };
    
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(10);

    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
    const [showExternalForm, setShowExternalForm] = useState(false);
    const [error, setError] = useState('');

    // Researcher profile metadata draft states
    const [pendingUserDraft, setPendingUserDraft] = useState<{
        type: 'edit';
        uuid: string;
        userName: string;
        timestamp: number;
    } | null>(null);

    // External reviewer registration draft states
    const [isExternalDraftRestored, setIsExternalDraftRestored] = useState(false);
    const [pendingExternalDraft, setPendingExternalDraft] = useState<{
        name: string;
        timestamp: number;
    } | null>(null);
    const isExternalInitializedRef = useRef(false);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void | Promise<void>;
        type: 'danger' | 'warning' | 'info' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning'
    });

    const [externalForm, setExternalForm] = useState({
        cedula: '',
        nombres: '',
        apellidos: '',
        email: '',
        especialidad: '',
        grado_academico: '',
        institucion: '',
        orcid_id: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/users?search=${search}&type=${userType}&page=${page}&pageSize=${pageSize}`);
            const items: ManagedUser[] = response.data.items;
            setUsers(items);
            setTotalCount(response.data.total_count);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Deep-link from CommandPalette: ?open=CEDULA
    // Makes a direct targeted API call to find and open that specific user's
    // detail panel, regardless of which pagination page they fall on.
    useEffect(() => {
        if (!openUuid) return;
        let cancelled = false;

        const resolveOpenUser = async () => {
            try {
                // Search directly by cedula (id_profesor) — the most reliable identifier
                const res = await api.get(
                    `/Admin/users?search=${encodeURIComponent(openUuid)}&type=${userType}&page=1&pageSize=5`
                );
                if (cancelled) return;

                const items: ManagedUser[] = res.data.items ?? [];
                // Exact match on id_profesor or user_uuid
                const target = items.find(
                    u => u.id_profesor === openUuid || u.user_uuid === openUuid
                ) ?? items[0]; // fallback to first result if exact match not found

                if (target) {
                    setDetailUser(target);
                }

                // Clear param from URL so refreshing doesn't reopen
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('open');
                    return next;
                });
            } catch {
                // Silently fail — user just lands on the list
            }
        };

        resolveOpenUser();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openUuid]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/Admin/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    useEffect(() => {
        fetchRoles();

        // Check researcher draft
        const userMetaStr = localStorage.getItem('user_metadata_draft_metadata');
        if (userMetaStr) {
            try {
                setPendingUserDraft(JSON.parse(userMetaStr));
            } catch (e) {
                console.error("Error reading user draft metadata", e);
            }
        }

        // Check external evaluator draft
        const extMetaStr = localStorage.getItem('external_draft_metadata');
        if (extMetaStr) {
            try {
                setPendingExternalDraft(JSON.parse(extMetaStr));
            } catch (e) {
                console.error("Error reading external draft metadata", e);
            }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.tagName === 'SELECT' ||
                activeEl.getAttribute('contenteditable') === 'true'
            )) {
                return;
            }
            
            if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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

    // Auto-save externalForm
    useEffect(() => {
        if (!showExternalForm) {
            isExternalInitializedRef.current = false;
            setIsExternalDraftRestored(false);
            return;
        }

        if (!isExternalInitializedRef.current) {
            isExternalInitializedRef.current = true;
            return;
        }

        const hasData = Object.values(externalForm).some(v => v.trim() !== '');
        if (hasData) {
            localStorage.setItem('new_external_form_draft', JSON.stringify(externalForm));
            const name = `${externalForm.nombres} ${externalForm.apellidos}`.trim() || 'Evaluador sin nombre';
            const meta = {
                name,
                timestamp: Date.now()
            };
            localStorage.setItem('external_draft_metadata', JSON.stringify(meta));
        } else {
            localStorage.removeItem('new_external_form_draft');
            localStorage.removeItem('external_draft_metadata');
        }
    }, [externalForm, showExternalForm]);

    // Researcher profile draft handlers
    const handleRestoreUserDraft = () => {
        if (!pendingUserDraft) return;
        const user = users.find(u => u.user_uuid === pendingUserDraft.uuid);
        if (user) {
            setSelectedUser(user);
        } else {
            // Partial user since UserProfileModal only needs uuid and name
            setSelectedUser({
                user_uuid: pendingUserDraft.uuid,
                nombre_completo: pendingUserDraft.userName,
                id_profesor: '',
                email: '',
                type: '',
                roles: [],
                role_codes: [],
                firma_habilitada: false
            } as any);
        }
    };

    const handleDiscardUserDraft = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Descartar Borrador de Perfil',
            message: '¿Está seguro de descartar el borrador guardado del perfil de usuario? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => {
                localStorage.removeItem('user_metadata_draft_metadata');
                if (pendingUserDraft?.uuid) {
                    localStorage.removeItem(`edit_user_metadata_draft_${pendingUserDraft.uuid}`);
                }
                setPendingUserDraft(null);
                setConfirmDialog(p => ({ ...p, isOpen: false }));
            }
        });
    };

    // External reviewer draft handlers
    const handleRestoreExternalDraft = () => {
        const draftKey = 'new_external_form_draft';
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed && typeof parsed === 'object') {
                    const validated = {
                        cedula: typeof parsed.cedula === 'string' ? parsed.cedula : '',
                        nombres: typeof parsed.nombres === 'string' ? parsed.nombres : '',
                        apellidos: typeof parsed.apellidos === 'string' ? parsed.apellidos : '',
                        email: typeof parsed.email === 'string' ? parsed.email : '',
                        especialidad: typeof parsed.especialidad === 'string' ? parsed.especialidad : '',
                        grado_academico: typeof parsed.grado_academico === 'string' ? parsed.grado_academico : '',
                        institucion: typeof parsed.institucion === 'string' ? parsed.institucion : '',
                        orcid_id: typeof parsed.orcid_id === 'string' ? parsed.orcid_id : ''
                    };
                    setExternalForm(validated);
                    setIsExternalDraftRestored(true);
                    setShowExternalForm(true);
                } else {
                    throw new Error("Estructura de borrador de evaluador externo inválida");
                }
            } catch (e) {
                console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                localStorage.removeItem(draftKey);
                localStorage.removeItem('external_draft_metadata');
                setPendingExternalDraft(null);
                setIsExternalDraftRestored(false);
            }
        }
    };

    const handleDiscardExternalDraft = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Descartar Borrador de Evaluador',
            message: '¿Está seguro de descartar el borrador del nuevo evaluador externo? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => {
                localStorage.removeItem('new_external_form_draft');
                localStorage.removeItem('external_draft_metadata');
                setPendingExternalDraft(null);
                setExternalForm({
                    cedula: '',
                    nombres: '',
                    apellidos: '',
                    email: '',
                    especialidad: '',
                    grado_academico: '',
                    institucion: '',
                    orcid_id: ''
                });
                setIsExternalDraftRestored(false);
                setConfirmDialog(p => ({ ...p, isOpen: false }));
            }
        });
    };

    const clearExternalDraft = () => {
        localStorage.removeItem('new_external_form_draft');
        localStorage.removeItem('external_draft_metadata');
        setPendingExternalDraft(null);
        setIsExternalDraftRestored(false);
    };

    const handleCloseExternalModal = () => {
        const hasChanges = Object.values(externalForm).some(v => v.trim() !== '');
        if (hasChanges) {
            setConfirmDialog({
                isOpen: true,
                title: 'Cambios no guardados',
                message: '¿Está seguro de salir? Perderá todos los datos que ha ingresado en este formulario.',
                type: 'warning',
                onConfirm: () => {
                    clearExternalDraft();
                    setShowExternalForm(false);
                    setExternalForm({
                        cedula: '',
                        nombres: '',
                        apellidos: '',
                        email: '',
                        especialidad: '',
                        grado_academico: '',
                        institucion: '',
                        orcid_id: ''
                    });
                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                }
            });
        } else {
            clearExternalDraft();
            setShowExternalForm(false);
        }
    };

    const handleRoleToggle = (userId: string, userName: string, roleCode: string, roleName: string, hasRole: boolean) => {
        setConfirmDialog({
            isOpen: true,
            title: hasRole ? 'Revocar Rol' : 'Asignar Rol',
            message: hasRole
                ? `¿Está seguro de revocar el rol "${roleName}" al usuario "${userName}"?`
                : `¿Está seguro de asignar el rol "${roleName}" al usuario "${userName}"?`,
            type: hasRole ? 'danger' : 'success',
            onConfirm: async () => {
                await toggleRole(userId, roleCode, hasRole);
            }
        });
    };

    const toggleRole = async (userId: string, roleCode: string, hasRole: boolean) => {
        setUpdating(`${userId}-${roleCode}`);
        try {
            if (hasRole) {
                await api.post('/Admin/roles/revoke', { id_usuario: userId, role_code: roleCode, user_type: userType });
            } else {
                await api.post('/Admin/roles/assign', { id_usuario: userId, role_code: roleCode, user_type: userType });
            }
            await fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleRegisterExternal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const registeredCedula = externalForm.cedula;
        const registeredNombre = `${externalForm.nombres} ${externalForm.apellidos}`.toUpperCase().trim();
        try {
            await api.post('/Admin/external', externalForm);
            clearExternalDraft();
            setShowExternalForm(false);
            setExternalForm({ cedula: '', nombres: '', apellidos: '', email: '', especialidad: '', grado_academico: '', institucion: '', orcid_id: '' });
            fetchUsers();

            setConfirmDialog({
                isOpen: true,
                title: 'Evaluador Registrado con Éxito',
                message: `El evaluador externo "${registeredNombre}" ha sido registrado en el sistema.\n\n` +
                         `Credenciales de acceso convencional por defecto:\n` +
                         `• Usuario: ${registeredCedula}\n` +
                         `• Contraseña temporal: Diitra2026*\n\n` +
                         `Nota: Por favor comparta estas credenciales con el evaluador por si prefiere acceder utilizando el inicio de sesión convencional con contraseña.`,
                type: 'success',
                onConfirm: () => {}
            });
        } catch (err: any) {
            console.error('Error registering external:', err);
            const serverMsg = err?.response?.data?.message || err?.response?.data?.title || 'Error al registrar el evaluador.';
            setError(serverMsg);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto transition-colors duration-300">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-12 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-text-main">
                        <Shield size={10} strokeWidth={2} />
                        <span>Administración Central - DIITRA</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">Gestión Institucional</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Control de acceso institucional y gestión de evaluadores pares externos.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    {userType === 'EXTERNO' && (
                        <button
                            onClick={() => { setError(''); setShowExternalForm(true); }}
                            className="btn-brand w-full md:w-auto flex items-center justify-center gap-2"
                        >
                            <UserPlus size={14} /> Nuevo Externo
                        </button>
                    )}

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

                    <div className="relative group w-full md:w-80">
                        {loading ? (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand animate-spin">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        )}
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={`Buscar en ${userType}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    e.currentTarget.blur();
                                }
                            }}
                            className="input-vercel !pl-10 !pr-16 !py-2.5 !text-xs uppercase tracking-wider !font-mono placeholder:!lowercase w-full"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        searchInputRef.current?.focus();
                                    }}
                                    className="pointer-events-auto text-text-dim hover:text-text-main p-0.5 rounded hover:bg-surface-hover transition-all"
                                    title="Limpiar búsqueda"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <span className="hidden sm:inline font-mono text-[10px] text-text-dim select-none">
                                /
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Banner de Recuperación de Borrador de Perfil de Investigador */}
            {pendingUserDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-text-main">Perfil en borrador</h4>
                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                    No guardado
                                </span>
                            </div>
                            <p className="text-xs text-text-dim">
                                Tienes cambios sin guardar en el perfil de <span className="text-text-main font-medium">"{pendingUserDraft.userName}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingUserDraft.timestamp).toLocaleDateString()} a las {new Date(pendingUserDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreUserDraft}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar perfil
                        </button>
                        <button
                            onClick={handleDiscardUserDraft}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* Banner de Recuperación de Borrador de Evaluador Externo */}
            {pendingExternalDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-thin flex items-center justify-center text-text-main shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-text-main">Borrador de evaluador</h4>
                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                    No guardado
                                </span>
                            </div>
                            <p className="text-xs text-text-dim">
                                Tienes un borrador de nuevo evaluador externo: <span className="text-text-main font-medium">"{pendingExternalDraft.name}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingExternalDraft.timestamp).toLocaleDateString()} a las {new Date(pendingExternalDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreExternalDraft}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar evaluador
                        </button>
                        <button
                            onClick={handleDiscardExternalDraft}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

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
                                                     <span className="text-text-dim flex items-center gap-1.5" title="Horas Distributivo (SIGAFI)">
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

            {showExternalForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseExternalModal(); }}>
                    <div className="modal-card modal-card--lg animate-scale-up">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-info !p-2"><Globe size={20} /></div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Registro de Evaluador Académico</h3>
                                    <p className="section-label text-text-dim">Personal Externo DIITRA - IST Quito</p>
                                </div>
                            </div>
                            <button type="button" onClick={handleCloseExternalModal} className="text-text-dim hover:text-text-main transition-colors"><X size={20} /></button>
                        </div>
                        
                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 mx-6 mt-4 rounded-lg bg-error/15 border border-error/30 text-error text-xs font-semibold animate-fade-up">
                                <AlertTriangle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}
                        
                        <form id="external-register-form" onSubmit={handleRegisterExternal} className="modal-body">
                            {isExternalDraftRestored && (
                                <div className="col-span-2 border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-text-main shrink-0" />
                                        <p className="text-xs text-text-dim">
                                            <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado los datos del evaluador no guardados.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExternalForm({
                                                cedula: '',
                                                nombres: '',
                                                apellidos: '',
                                                email: '',
                                                especialidad: '',
                                                grado_academico: '',
                                                institucion: '',
                                                orcid_id: ''
                                            });
                                            localStorage.removeItem('new_external_form_draft');
                                            localStorage.removeItem('external_draft_metadata');
                                            setIsExternalDraftRestored(false);
                                            setPendingExternalDraft(null);
                                        }}
                                        className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                                    >
                                        Revertir al original
                                    </button>
                                </div>
                            )}
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
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Nombres</label>
                                            <input required type="text" value={externalForm.nombres} onChange={e => setExternalForm({ ...externalForm, nombres: e.target.value })} className="input-vercel !uppercase" placeholder="Ej: JUAN CARLOS" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Apellidos</label>
                                            <input required type="text" value={externalForm.apellidos} onChange={e => setExternalForm({ ...externalForm, apellidos: e.target.value })} className="input-vercel !uppercase" placeholder="Ej: PÉREZ MORA" />
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
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">Institución de Origen</label>
                                            <input type="text" value={externalForm.institucion} onChange={e => setExternalForm({ ...externalForm, institucion: e.target.value })} className="input-vercel" placeholder="Ej: Escuela Politécnica Nacional" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="section-label text-text-dim">ORCID iD</label>
                                            <input type="text" value={externalForm.orcid_id} onChange={e => setExternalForm({ ...externalForm, orcid_id: e.target.value })} className="input-vercel" placeholder="0000-0000-0000-0000" />
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
                                <button type="button" onClick={handleCloseExternalModal} className="btn-vercel-secondary">Cancelar</button>
                                <button type="submit" form="external-register-form" className="btn-vercel-primary">Registrar Evaluador</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => { setSelectedUser(null); fetchUsers(); }}
                    onDraftCleared={() => setPendingUserDraft(null)}
                />
            )}

            {detailUser && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setDetailUser(null)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <UserIcon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-text-main tracking-tight">{formatNombre(detailUser.nombre_completo)}</h3>
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
                                            <p className="section-label text-text-dim mb-1">Horas Distributivo (SIGAFI)</p>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                                <span className={`w-1.5 h-1.5 rounded-full ${(detailUser.horas_investigacion || 0) > 0 ? 'bg-success' : 'bg-error'}`} />
                                                {detailUser.horas_investigacion || 0}h
                                            </div>
                                        </div>
                                        <div>
                                            <p className="section-label text-text-dim mb-1">Horas Asignadas (DIITRA)</p>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                                <span className={`w-1.5 h-1.5 rounded-full ${(detailUser.horas_asignadas || 0) > 0 ? 'bg-info' : 'bg-text-dim/40'}`} />
                                                {detailUser.horas_asignadas || 0}h
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="section-label text-text-dim mb-1">Horas Disponibles</p>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                                <span className={`w-1.5 h-1.5 rounded-full ${((detailUser.horas_investigacion || 0) - (detailUser.horas_asignadas || 0)) > 0 ? 'bg-success' : 'bg-error'}`} />
                                                {Math.max(0, (detailUser.horas_investigacion || 0) - (detailUser.horas_asignadas || 0))}h
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="section-label text-text-dim mb-1">Carrera / Tecnología</p>
                                            <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                                                <GraduationCap size={14} className="text-text-dim" />
                                                {formatCarrera(detailUser.carrera)}
                                            </p>
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
                                            <p className="text-sm font-bold text-text-main">{formatCarrera(detailUser.carrera)}</p>
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
                                            <span key={code} className="text-xs font-semibold text-brand-light font-mono">
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
                                    <div className="flex items-center gap-2 text-xs font-medium text-text-main">
                                         <span className={`dot ${detailUser.firma_habilitada ? 'dot-success' : 'dot-neutral'}`} />
                                         {detailUser.firma_habilitada ? 'Habilitada' : 'No cargada'}
                                     </div>
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

            {confirmDialog.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-scale-up max-w-md">
                        <div className="modal-header !py-4">
                            <div className="flex items-center gap-3">
                                <div className={`icon-circle ${
                                    confirmDialog.type === 'danger' ? 'icon-circle-error' :
                                    confirmDialog.type === 'warning' ? 'icon-circle-warning' :
                                    confirmDialog.type === 'success' ? 'icon-circle-success' :
                                    'icon-circle-info'
                                }`}>
                                    {confirmDialog.type === 'danger' && <XCircle size={18} />}
                                    {confirmDialog.type === 'warning' && <AlertTriangle size={18} />}
                                    {confirmDialog.type === 'success' && <CheckCircle size={18} />}
                                    {confirmDialog.type === 'info' && <Shield size={18} />}
                                </div>
                                <h3 className="text-sm font-semibold text-text-main tracking-tight">
                                    {confirmDialog.title}
                                </h3>
                            </div>
                        </div>
                        <div className="modal-body py-6">
                            <div className="text-xs text-text-dim leading-relaxed font-medium whitespace-pre-wrap">
                                {confirmDialog.message}
                            </div>
                        </div>
                        <div className="modal-footer bg-surface/50 !py-3">
                            {confirmDialog.type === 'success' ? (
                                <button
                                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                    className="btn-vercel-primary !py-2 px-6"
                                >
                                    Entendido
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                        className="btn-vercel-secondary !py-2"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                            await confirmDialog.onConfirm();
                                        }}
                                        className={`!py-2 ${
                                            confirmDialog.type === 'danger' ? 'bg-error hover:opacity-90 border border-error text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                            confirmDialog.type === 'warning' ? 'bg-warning hover:opacity-90 border border-warning text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                            'btn-vercel-primary'
                                        }`}
                                    >
                                        Confirmar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default UsersPage;