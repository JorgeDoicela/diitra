import React, { useMemo } from 'react';
import { useAuth } from '../../api/AuthContext';
import { AdminDashboard } from './Roles/AdminDashboard';
import { DocenteDashboard } from './Roles/DocenteDashboard';
import { EstudianteDashboard } from './Roles/EstudianteDashboard';
import { RevisorDashboard } from './Roles/RevisorDashboard';
import { FullscreenLoader } from '../../components/Common/FullscreenLoader';

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

    if (isLoading) {
        return <FullscreenLoader message="Cargando panel de control..." />;
    }

    return (
        <main className="flex-1 bg-bg-deep selection:bg-selection-bg selection:text-selection-fg transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto p-4 md:p-10">
                {roleDashboard}
            </div>
        </main>
    );
};

export default Dashboard;
