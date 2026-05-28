import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useParams } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import UsersPage from './pages/Admin/UsersPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import MagicLogin from './pages/Login/MagicLogin';
import PinHandoff from './pages/Login/PinHandoff';
import MagicResend from './pages/Login/MagicResend';
import { AuthProvider, useAuth } from './api/AuthContext';
import { NotificationsProvider } from './api/NotificationsContext';
import ConvocatoriasPage from './pages/Investigacion/Convocatorias/ConvocatoriasPage';
import ResearchProjectsPage from './pages/Investigacion/Proyectos/ResearchProjectsPage';
import MyProjectsPage from './pages/Investigacion/Proyectos/MyProjectsPage';
import PeerReviewPage from './pages/Investigacion/PeerReview/PeerReviewPage';
import EvaluacionPage from './pages/Investigacion/PeerReview/EvaluacionPage';
import ArbitrajePage from './pages/Investigacion/Arbitraje/ArbitrajePage';
import ArbitrajeProyecto from './pages/Investigacion/Arbitraje/ArbitrajeProyecto';
import { ProjectWorkspace } from './pages/Investigacion/Proyectos/Workspace/ProjectWorkspace';
import MonitoringPage from './pages/Investigacion/Monitoreo/MonitoringPage';
import GroupsPage from './pages/Admin/GroupsPage';
import AuditPage from './pages/Admin/AuditPage';
import ConfiguracionPage from './pages/Admin/ConfiguracionPage';
import PublicConvocatoriasPage from './pages/Investigacion/Convocatorias/PublicConvocatoriasPage';
import VerifyDocument from './pages/Public/VerifyDocument';
import UnderDevelopment from './components/Common/UnderDevelopment';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import NotificationsPage from './pages/Notificaciones/NotificationsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-deep transition-colors duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const AuthenticatedRedirect = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();
    if (isLoading) return null;

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const PermissionRoute = ({ children, module, op }: { children: React.ReactNode; module: string; op: string }) => {
    const { isAuthenticated, isLoading, hasPermission, isAdmin } = useAuth();
    if (isLoading) return null;

    if (!isAuthenticated || (!isAdmin && !hasPermission(module, op))) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
    const { isAuthenticated, isLoading, isAdmin, isDocente, isEstudiante, isRevisor, roles } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-deep transition-colors duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (allowedRoles.includes('ANY')) return <>{children}</>;

    if (isAdmin && allowedRoles.some(r => ['DIITRA_ADMIN', 'ADMIN_SISTEMA'].includes(r))) return <>{children}</>;

    if (isDocente && allowedRoles.some(r => ['DIITRA_DOCENTE', 'DOCENTE_INV', 'DIRECTOR_INV'].includes(r))) return <>{children}</>;

    if (isEstudiante && allowedRoles.some(r => ['DIITRA_ESTUDIANTE', 'ESTUDIANTE_COLAB'].includes(r))) return <>{children}</>;

    if (isRevisor && allowedRoles.some(r => ['DIITRA_REVISOR_EXTERNO', 'REVISOR_EXT', 'REVISOR_INT'].includes(r))) return <>{children}</>;

    if (roles.some(r => allowedRoles.map(a => a.toUpperCase()).includes(r.toUpperCase()))) return <>{children}</>;

    return <Navigate to="/dashboard" replace />;
};

const ConvocatoriaRoute = () => {
    const { isAdmin } = useAuth();
    return isAdmin ? <ConvocatoriasPage /> : <PublicConvocatoriasPage />;
};

const NavigateToProjectDetail = () => {
    const { projectUuid } = useParams();
    return <Navigate to={`/investigacion/monitoreo/${projectUuid}`} replace />;
};

function App() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <AuthProvider>
            <NotificationsProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Landing Page */}
                        <Route path="/" element={
                            <AuthenticatedRedirect>
                                <Landing currentTheme={theme} toggleTheme={toggleTheme} />
                            </AuthenticatedRedirect>
                        } />
                        <Route path="/login" element={
                            <AuthenticatedRedirect>
                                <Login currentTheme={theme} />
                            </AuthenticatedRedirect>
                        } />
                        <Route path="/auth/magic-login" element={
                            <MagicLogin currentTheme={theme} />
                        } />
                        <Route path="/auth/pin" element={
                            <PinHandoff currentTheme={theme} />
                        } />
                        <Route path="/auth/magic-resend" element={
                            <MagicResend currentTheme={theme} />
                        } />

                        {/* Internal Pages with Layout (Stable) */}
                        <Route element={
                            <ProtectedRoute>
                                <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                                    <Outlet />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/settings" element={<UnderDevelopment title="Módulo en Desarrollo" description="La configuración de cuenta y preferencias institucionales estará disponible en la próxima actualización." />} />
                            <Route path="/analiticas" element={<AnalyticsPage />} />
                            <Route path="/notificaciones" element={<NotificationsPage />} />
                            <Route path="/usuarios" element={<PermissionRoute module="USUARIOS" op="VER"><UsersPage /></PermissionRoute>} />
                            <Route path="/auditoria" element={<AdminRoute><AuditPage /></AdminRoute>} />
                            <Route path="/grupos" element={<RoleRoute allowedRoles={['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV']}><GroupsPage /></RoleRoute>} />
                            <Route path="/configuracion" element={<AdminRoute><ConfiguracionPage /></AdminRoute>} />
                            <Route path="/admin" element={<Navigate to="/usuarios" replace />} />
                            <Route path="/admin/groups" element={<Navigate to="/grupos" replace />} />
                            <Route path="/admin/audit" element={<Navigate to="/auditoria" replace />} />
                            <Route path="/admin/configuracion" element={<Navigate to="/configuracion" replace />} />
                            <Route path="/proyectos/:projectUuid" element={<NavigateToProjectDetail />} />
                            <Route path="/investigacion" element={<ResearchProjectsPage />} />
                            <Route path="/investigacion/mis-proyectos" element={<MyProjectsPage />} />
                            <Route path="/investigacion/monitoreo/:projectUuid" element={<MonitoringPage />} />
                            <Route path="/convocatorias" element={<ConvocatoriaRoute />} />
                            <Route path="/revisiones" element={<PeerReviewPage />} />
                            <Route path="/revisiones/:revisionUuid" element={<EvaluacionPage />} />
                            <Route path="/arbitraje" element={<RoleRoute allowedRoles={['DIITRA_ADMIN', 'ADMIN_SISTEMA', 'DIRECTOR_INV', 'DOCENTE_INV']}><ArbitrajePage /></RoleRoute>} />
                            <Route path="/arbitraje/proyecto/:projectUuid" element={<RoleRoute allowedRoles={['DIITRA_ADMIN', 'ADMIN_SISTEMA', 'DIRECTOR_INV', 'DOCENTE_INV']}><ArbitrajeProyecto /></RoleRoute>} />
                            <Route path="/verify" element={<VerifyDocument />} />
                        </Route>

                        {/* Public Verification Page (Accessible without authentication) */}
                        <Route path="/verify/:code" element={<VerifyDocument />} />

                        <Route path="/investigacion/workspace/:templateCode/:documentUuid" element={
                            <ProtectedRoute>
                                <ProjectWorkspace />
                            </ProtectedRoute>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </NotificationsProvider>
        </AuthProvider>
    );
}

export default App;
