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
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasPermission: (module: string, operation: string) => boolean;
    roles: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error: any) {
            // Manejo silencioso: si es 401 simplemente no hay sesión
            setUser(null);
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
        setUser(response.data);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    const hasPermission = useCallback((module: string, operation: string): boolean => {
        if (!user || !user.permissions) return false;
        const target = `${module}:${operation}`.toUpperCase();
        return user.permissions.includes(target);
    }, [user]);

    const roles = React.useMemo(() => {
        if (!user) return [];
        return user.roles || (user.role ? [user.role] : []);
    }, [user]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated: !!user, 
            isLoading, 
            login, 
            logout, 
            refreshUser,
            hasPermission,
            roles
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
