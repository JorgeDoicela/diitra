import React, { useMemo } from 'react';
import { useAuth } from '../../api/AuthContext';
import { AdminDashboard } from './Roles/AdminDashboard';
import { DocenteDashboard } from './Roles/DocenteDashboard';
import { EstudianteDashboard } from './Roles/EstudianteDashboard';
import { RevisorDashboard } from './Roles/RevisorDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { isAdmin, isDocente, isEstudiante, isRevisor, isLoading } = useAuth();

    const roleDashboard = useMemo(() => {
        if (isLoading) return null;
        
        if (isAdmin) return <AdminDashboard />;
        if (isDocente) return <DocenteDashboard />;
        if (isEstudiante) return <EstudianteDashboard />;
        if (isRevisor) return <RevisorDashboard />;
        
        return <DocenteDashboard />; // Global Fallback
    }, [isAdmin, isDocente, isEstudiante, isRevisor, isLoading]);

    return (
        <main className="flex-1 bg-bg-deep overflow-y-auto selection:bg-selection-bg selection:text-selection-fg transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto p-4 md:p-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                        <Loader2 className="animate-spin text-text-main/20" size={40} />
                        <p className="section-label text-text-dim">Cargando panel...</p>
                    </div>
                ) : (
                    roleDashboard
                )}
            </div>
        </main>
    );
};

export default Dashboard;
