import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../api/axios_config';

export interface ManagedUser {
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

export interface Role {
    id_rol: number;
    nombre: string;
    codigo_rol: string;
}

export interface PendingUserDraft {
    type: 'edit';
    uuid: string;
    userName: string;
    timestamp: number;
}

export interface PendingExternalDraft {
    name: string;
    timestamp: number;
}

export interface ConfirmDialog {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    type: 'danger' | 'warning' | 'info' | 'success';
}

export interface ExternalForm {
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    especialidad: string;
    grado_academico: string;
    institucion: string;
    orcid_id: string;
}

export const useUsersPage = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastOpenedUuidRef = useRef<string | null>(null);
    const openedAtRef = useRef<number>(0);
    const isOverlayMouseDownRef = useRef(false);
    const typeParam = searchParams.get('type');
    const userType = (typeParam === 'DOCENTE' || typeParam === 'ESTUDIANTE' || typeParam === 'EXTERNO') ? typeParam : 'DOCENTE';
    const openUuid = searchParams.get('open');

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
    const [lastActiveUserId, setLastActiveUserId] = useState<string | null>(null);
    const [showExternalForm, setShowExternalForm] = useState(false);
    const [error, setError] = useState('');

    // Researcher profile metadata draft states
    const [pendingUserDraft, setPendingUserDraft] = useState<PendingUserDraft | null>(null);

    // External reviewer registration draft states
    const [isExternalDraftRestored, setIsExternalDraftRestored] = useState(false);
    const [pendingExternalDraft, setPendingExternalDraft] = useState<PendingExternalDraft | null>(null);
    const isExternalInitializedRef = useRef(false);

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const [externalForm, setExternalForm] = useState<ExternalForm>({
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

    // Deep-link from CommandPalette
    useEffect(() => {
        if (!openUuid) {
            lastOpenedUuidRef.current = null;
            return;
        }
        if (openUuid === lastOpenedUuidRef.current) return;
        let cancelled = false;

        const resolveOpenUser = async () => {
            try {
                lastOpenedUuidRef.current = openUuid;
                const res = await api.get(
                    `/Admin/users?search=${encodeURIComponent(openUuid)}&type=${userType}&page=1&pageSize=5`
                );
                if (cancelled) return;

                const items: ManagedUser[] = res.data.items ?? [];
                const target = items.find(
                    u => u.id_profesor === openUuid || u.user_uuid === openUuid
                ) ?? items[0];

                if (target) {
                    setDetailUser(target);
                    setSearch(target.id_profesor || target.nombre_completo);
                    setPage(1);
                    openedAtRef.current = Date.now();
                    setLastActiveUserId(null);
                }
            } catch {
                // Silently fail
            }
        };

        resolveOpenUser();
        return () => { cancelled = true; };
    }, [openUuid, userType]);

    const handleCloseDetail = () => {
        if (Date.now() - openedAtRef.current < 300) {
            return;
        }
        if (detailUser) {
            setLastActiveUserId(detailUser.id_profesor);
        }
        setDetailUser(null);
        lastOpenedUuidRef.current = null;
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('open');
            return next;
        }, { replace: true });
    };

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
            await fetchUsers();

            setConfirmDialog({
                isOpen: true,
                title: 'Evaluador Registrado con Éxito',
                message: `El evaluador externo "${registeredNombre}" ha sido registrado en el sistema.\n\n` +
                    `Credenciales de acceso convencional por defecto:\n` +
                    `• Usuario: ${registeredCedula}\n` +
                    `• Contraseña temporal: Diitra2026*\n\n` +
                    `Nota: Por favor comparta estas credenciales con el evaluador por si prefiere acceder utilizando el inicio de sesión convencional con contraseña.`,
                type: 'success',
                onConfirm: () => { }
            });
        } catch (err: any) {
            console.error('Error registering external:', err);
            const serverMsg = err?.response?.data?.message || err?.response?.data?.title || 'Error al registrar el evaluador.';
            setError(serverMsg);
        }
    };

    return {
        users,
        roles,
        search,
        setSearch,
        userType,
        setUserType,
        page,
        setPage,
        pageSize,
        totalCount,
        totalPages,
        loading,
        updating,
        selectedUser,
        setSelectedUser,
        detailUser,
        setDetailUser,
        lastActiveUserId,
        setLastActiveUserId,
        showExternalForm,
        setShowExternalForm,
        error,
        setError,
        pendingUserDraft,
        setPendingUserDraft,
        isExternalDraftRestored,
        setIsExternalDraftRestored,
        pendingExternalDraft,
        setPendingExternalDraft,
        confirmDialog,
        setConfirmDialog,
        externalForm,
        setExternalForm,
        searchInputRef,
        isOverlayMouseDownRef,
        fetchUsers,
        handleCloseDetail,
        handleRestoreUserDraft,
        handleDiscardUserDraft,
        handleRestoreExternalDraft,
        handleDiscardExternalDraft,
        handleCloseExternalModal,
        handleRoleToggle,
        handleRegisterExternal
    };
};
