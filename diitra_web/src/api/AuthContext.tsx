import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './axios_config';

interface User {
    id_referencia: string;
    nombre_completo: string;
    role: string;
    tipo_usuario: string;
    permissions: string[];
    administrador: boolean; 
    roles: string[];
    usuario?: string;
    id_usuario?: number;
    role_codes?: string[];
    acepto_lopdp?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<User>;
    loginWithMicrosoft: (idToken: string) => Promise<User>;
    magicLogin: (token: string) => Promise<{ user: User; pin: string | null; token: string }>;
    confirmMagicLogin: (user: User, token: string) => Promise<void>;
    handoffLogin: (pin: string) => Promise<User>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasPermission: (module: string, operation: string) => boolean;
    roles: string[];
    isAdmin: boolean;
    isDocente: boolean;
    isEstudiante: boolean;
    isRevisor: boolean;
    roleDisplayName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        if (!localStorage.getItem('diitra_logged_in')) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        try {
            const response = await api.get('/auth/me');
            const data = response.data;
            const normalized: User = {
                ...data,
                acepto_lopdp: data.acepto_lopdp !== undefined ? data.acepto_lopdp : data.aceptoLopdp
            };
            setUser(normalized);
        } catch (error: any) {
            setUser(null);
            localStorage.removeItem('diitra_logged_in');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Ejecución única al montar el proveedor
        refreshUser();
    }, [refreshUser]);

    const login = async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        const data = response.data;
        
        // Normalizar los roles para usar los códigos de roles (role_codes) en lugar de los nombres descriptivos.
        // Esto mantiene la coherencia entre el estado posterior al login y el obtenido al refrescar la página.
        const normalizedUser: User = {
            ...data,
            roles: data.role_codes || data.roles || [],
            role: data.role_codes?.[0] || data.role,
            acepto_lopdp: data.acepto_lopdp !== undefined ? data.acepto_lopdp : data.aceptoLopdp
        };
        
        setUser(normalizedUser);
        localStorage.setItem('diitra_logged_in', 'true');
        return normalizedUser;
    };

    const loginWithMicrosoft = async (idToken: string) => {
        const response = await api.post('/auth/microsoft-login', { idToken });
        const data = response.data;

        const normalizedUser: User = {
            ...data,
            roles: data.role_codes || data.roles || [],
            role: data.role_codes?.[0] || data.role,
            acepto_lopdp: data.acepto_lopdp !== undefined ? data.acepto_lopdp : data.aceptoLopdp
        };

        setUser(normalizedUser);
        localStorage.setItem('diitra_logged_in', 'true');
        return normalizedUser;
    };

    const magicLogin = async (token: string) => {
        const response = await api.post('/auth/magic-login', { token });
        const { auth, pin } = response.data;
        
        const normalizedUser: User = {
            ...auth,
            roles: auth.role_codes || auth.roles || [],
            role: auth.role_codes?.[0] || auth.role,
            acepto_lopdp: auth.acepto_lopdp !== undefined ? auth.acepto_lopdp : auth.aceptoLopdp
        };
        
        // Retornamos sin iniciar la sesión en este dispositivo de forma automática.
        // La sesión se establecerá explícitamente cuando el usuario confirme el acceso.
        return { user: normalizedUser, pin: pin || null, token: auth.token };
    };

    const confirmMagicLogin = async (user: User, token: string) => {
        await api.post('/auth/magic-confirm', { token });
        setUser(user);
        localStorage.setItem('diitra_logged_in', 'true');
    };

    const handoffLogin = async (pin: string) => {
        const response = await api.post('/auth/magic-handoff', { pin });
        const data = response.data;
        
        const normalizedUser: User = {
            ...data,
            roles: data.role_codes || data.roles || [],
            role: data.role_codes?.[0] || data.role,
            acepto_lopdp: data.acepto_lopdp !== undefined ? data.acepto_lopdp : data.aceptoLopdp
        };
        
        setUser(normalizedUser);
        localStorage.setItem('diitra_logged_in', 'true');
        return normalizedUser;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {}
        setUser(null);
        localStorage.removeItem('diitra_logged_in');
    };

    const hasPermission = useCallback((module: string, operation: string): boolean => {
        if (!user || !user.permissions) return false;
        const target = `${module}:${operation}`.toUpperCase();
        return user.permissions.includes(target);
    }, [user]);

    const roles = React.useMemo(() => {
        if (!user) return [];
        const rawRoles = user.roles || (user.role ? [user.role] : []);
        return rawRoles.map(r => r.toUpperCase());
    }, [user]);

    const isAdmin = React.useMemo(() => {
        return user?.administrador || roles.includes('DIITRA_ADMIN') || roles.includes('ADMIN_SISTEMA');
    }, [user, roles]);

    const isDocente = React.useMemo(() => {
        return roles.includes('DIITRA_DOCENTE') || roles.includes('DOCENTE_INV') || roles.includes('DIRECTOR_INV');
    }, [roles]);

    const isEstudiante = React.useMemo(() => {
        return roles.includes('DIITRA_ESTUDIANTE');
    }, [roles]);

    const isRevisor = React.useMemo(() => {
        return roles.includes('DIITRA_REVISOR_EXTERNO');
    }, [roles]);

    const roleDisplayName = React.useMemo(() => {
        if (isAdmin) return 'Administrador';
        if (isDocente) return 'Investigador';
        if (isEstudiante) return 'Estudiante';
        if (isRevisor) return 'Revisor';
        return 'Usuario';
    }, [isAdmin, isDocente, isEstudiante, isRevisor]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated: !!user, 
            isLoading, 
            login, 
            loginWithMicrosoft,
            magicLogin,
            confirmMagicLogin,
            handoffLogin,
            logout, 
            refreshUser,
            hasPermission,
            roles,
            isAdmin,
            isDocente,
            isEstudiante,
            isRevisor,
            roleDisplayName
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
