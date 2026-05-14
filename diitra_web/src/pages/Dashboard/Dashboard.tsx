import React, { useMemo } from 'react';
import { useAuth } from '../../api/AuthContext';
import { AdminDashboard } from './Roles/AdminDashboard';
import { DocenteDashboard } from './Roles/DocenteDashboard';
import { EstudianteDashboard } from './Roles/EstudianteDashboard';
import { RevisorDashboard } from './Roles/RevisorDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user, roles, isLoading } = useAuth();

    const roleDashboard = useMemo(() => {
        if (isLoading) return null;
        
        // Normalize roles to uppercase for safe comparison
        const normalizedRoles = roles.map(r => r.toUpperCase());
        
        // 1. Admin Check (Global flag or specific codes)
        if (user?.administrador || normalizedRoles.includes('DIITRA_ADMIN') || normalizedRoles.includes('ADMIN_SISTEMA')) {
            return <AdminDashboard />;
        }

        // 2. Docente Check
        if (normalizedRoles.includes('DIITRA_DOCENTE') || normalizedRoles.includes('DOCENTE_INV') || normalizedRoles.includes('DIRECTOR_INV')) {
            return <DocenteDashboard />;
        }

        // 3. Estudiante Check
        if (normalizedRoles.includes('DIITRA_ESTUDIANTE') || normalizedRoles.includes('ESTUDIANTE_COLAB')) {
            return <EstudianteDashboard />;
        }

        // 4. Revisor Check
        if (normalizedRoles.includes('DIITRA_REVISOR_EXTERNO') || normalizedRoles.includes('REVISOR_EXT') || normalizedRoles.includes('REVISOR_INT')) {
            return <RevisorDashboard />;
        }
        
        return <DocenteDashboard />; // Global Fallback
    }, [user, roles, isLoading]);

    return (
        <main className="flex-1 bg-bg-deep overflow-y-auto selection:bg-selection-bg selection:text-selection-fg transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto p-4 md:p-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                        <Loader2 className="animate-spin text-text-main/20" size={40} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-dim">Preparando Entorno...</p>
                    </div>
                ) : (
                    roleDashboard
                )}
            </div>
        </main>
    );
};

export default Dashboard;
