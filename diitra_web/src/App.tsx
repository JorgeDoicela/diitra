import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/AuthContext';
import { NotificationsProvider } from './api/NotificationsContext';
import { ConfirmProvider } from './api/ConfirmContext';
import { buildWorkspacePath } from './core/documents/templateUrl';

// ─── Lazy imports: cada página se carga solo cuando se necesita ───────────────
const DashboardLayout        = lazy(() => import('./components/Layout/DashboardLayout'));
const UsersPage              = lazy(() => import('./pages/Admin/UsersPage'));
const Dashboard              = lazy(() => import('./pages/Dashboard/Dashboard'));
const Landing                = lazy(() => import('./pages/Landing/Landing'));
const Login                  = lazy(() => import('./pages/Login/Login'));
const MagicLogin             = lazy(() => import('./pages/Login/MagicLogin'));
const PinHandoff             = lazy(() => import('./pages/Login/PinHandoff'));
const MagicResend            = lazy(() => import('./pages/Login/MagicResend'));
const MicrosoftCallback      = lazy(() => import('./pages/Login/MicrosoftCallback'));
const RecuperarContrasenia   = lazy(() => import('./pages/Login/RecuperarContrasenia'));
const VerContrasenia         = lazy(() => import('./pages/Login/VerContrasenia'));
const ConvocatoriasPage      = lazy(() => import('./pages/Investigacion/Convocatorias/ConvocatoriasPage'));
const ResearchProjectsPage   = lazy(() => import('./pages/Investigacion/Proyectos/ResearchProjectsPage'));
const MyProjectsPage         = lazy(() => import('./pages/Investigacion/Proyectos/MyProjectsPage'));
const PeerReviewPage         = lazy(() => import('./pages/Investigacion/PeerReview/PeerReviewPage'));
const EvaluacionPage         = lazy(() => import('./pages/Investigacion/PeerReview/EvaluacionPage'));
const ArbitrajePage          = lazy(() => import('./pages/Investigacion/Arbitraje/ArbitrajePage'));
const ArbitrajeProyecto      = lazy(() => import('./pages/Investigacion/Arbitraje/ArbitrajeProyecto'));
const ProjectWorkspace       = lazy(() => import('./pages/Investigacion/Proyectos/Workspace/ProjectWorkspace').then(m => ({ default: m.ProjectWorkspace })));
const MonitoringPage         = lazy(() => import('./pages/Investigacion/Monitoreo/MonitoringPage'));
const GroupsPage             = lazy(() => import('./pages/Admin/GroupsPage'));
const AuditPage              = lazy(() => import('./pages/Admin/AuditPage'));
const ConfiguracionPage      = lazy(() => import('./pages/Admin/ConfiguracionPage'));
const PublicConvocatoriasPage = lazy(() => import('./pages/Investigacion/Convocatorias/PublicConvocatoriasPage'));
const VerifyDocument         = lazy(() => import('./pages/Public/VerifyDocument'));
const AnalyticsPage          = lazy(() => import('./pages/Analytics/AnalyticsPage'));
const NotificationsPage      = lazy(() => import('./pages/Notificaciones/NotificationsPage'));
const EmailEnginePage        = lazy(() => import('./pages/Admin/Emails/EmailEnginePage'));
const ProjectAdoptionPage    = lazy(() => import('./pages/Investigacion/Proyectos/ProjectAdoptionPage'));
const InformesAvancePage     = lazy(() => import('./pages/Investigacion/Proyectos/InformesAvancePage'));
const SettingsPage           = lazy(() => import('./pages/Settings/SettingsPage'));
const LopdpConsentPage       = lazy(() => import('./pages/Lopdp/LopdpConsentPage'));
const LopdpAdminPage         = lazy(() => import('./pages/Lopdp/LopdpAdminPage'));

// ─── Fallback de carga ────────────────────────────────────────────────────────
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
    </div>
);

// ─── Guards de ruta ───────────────────────────────────────────────────────────
const RedirectPreserveSearch = ({ to }: { to: string }) => {
    const location = useLocation();
    return <Navigate to={`${to}${location.search}`} replace />;
};

const RedirectVerifyCode = () => {
    const { code } = useParams<{ code: string }>();
    return <Navigate to={code ? `/verificacion/${code}` : '/verificacion'} replace />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
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

    // Intercept user if LOPDP terms have not been accepted yet
    if (user?.acepto_lopdp === false && location.pathname !== '/consentimiento-lopdp') {
        return <Navigate to="/consentimiento-lopdp" replace />;
    }

    // Redirect user to dashboard if trying to go back to consent screen after accepting
    if (user?.acepto_lopdp === true && location.pathname === '/consentimiento-lopdp') {
        return <Navigate to="/dashboard" replace />;
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

    if (isAdmin && allowedRoles.includes('DIITRA_ADMIN')) return <>{children}</>;

    if (roles.some(r => allowedRoles.map(a => a.toUpperCase()).includes(r.toUpperCase()))) return <>{children}</>;

    if (isDocente && allowedRoles.includes('DIITRA_DOCENTE')) return <>{children}</>;

    if (isEstudiante && allowedRoles.includes('DIITRA_ESTUDIANTE')) return <>{children}</>;

    if (isRevisor && allowedRoles.includes('DIITRA_REVISOR_EXTERNO')) return <>{children}</>;

    return <Navigate to="/dashboard" replace />;
};

const ResearcherRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-deep transition-colors duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    // Si es Administrador, lo redirigimos a la consola institucional de administración
    if (isAdmin) {
        return <Navigate to="/investigacion" replace />;
    }

    return <>{children}</>;
};

const ConvocatoriaRoute = () => {
    const { isAdmin, isEstudiante } = useAuth();
    if (isEstudiante) {
        return <Navigate to="/dashboard" replace />;
    }
    return isAdmin ? <ConvocatoriasPage /> : <PublicConvocatoriasPage />;
};

const NavigateToProjectDetail = () => {
    const { projectUuid } = useParams();
    const { isAdmin } = useAuth();
    const prefix = isAdmin ? '/investigacion' : '/investigacion/mis-proyectos';
    return <Navigate to={`${prefix}/monitoreo/${projectUuid}`} replace />;
};

const NavigateToWorkspaceDetail = () => {
    const { documentUuid } = useParams();
    const { isAdmin } = useAuth();
    const prefix = isAdmin ? '/investigacion' : '/investigacion/mis-proyectos';
    return <Navigate to={buildWorkspacePath('PROTOCOLO_INVESTIGACION', documentUuid!, '', prefix)} replace />;
};

const NavigateToResearchProjects = () => {
    const { isAdmin } = useAuth();
    const target = isAdmin ? '/investigacion' : '/investigacion/mis-proyectos';
    return <Navigate to={target} replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <ConfirmProvider>
                    <NotificationsProvider>
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public Landing Page */}
                        <Route path="/" element={
                            <AuthenticatedRedirect>
                                <Landing currentTheme={theme} toggleTheme={toggleTheme} />
                            </AuthenticatedRedirect>
                        } />
                        <Route path="/login" element={
                            <AuthenticatedRedirect>
                                <Login currentTheme={theme} toggleTheme={toggleTheme} />
                            </AuthenticatedRedirect>
                        } />
                        <Route path="/auth/magic-login" element={
                            <MagicLogin currentTheme={theme} toggleTheme={toggleTheme} />
                        } />
                        <Route path="/auth/pin" element={
                            <PinHandoff currentTheme={theme} toggleTheme={toggleTheme} />
                        } />
                        <Route path="/auth/magic-resend" element={
                            <MagicResend currentTheme={theme} toggleTheme={toggleTheme} />
                        } />
                        <Route path="/auth/microsoft-callback" element={
                            <MicrosoftCallback />
                        } />
                        <Route path="/auth/recuperar-contrasenia" element={
                            <RecuperarContrasenia currentTheme={theme} toggleTheme={toggleTheme} />
                        } />
                        <Route path="/auth/ver-contrasenia" element={
                            <VerContrasenia currentTheme={theme} toggleTheme={toggleTheme} />
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
                            <Route path="/configuracion" element={<SettingsPage />} />
                            <Route path="/settings" element={<RedirectPreserveSearch to="/configuracion" />} />
                            <Route path="/derechos-arco" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/admin/lopdp" element={<AdminRoute><LopdpAdminPage /></AdminRoute>} />
                            <Route path="/analiticas" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
                            <Route path="/notificaciones" element={<NotificationsPage />} />
                            <Route path="/usuarios" element={<PermissionRoute module="USUARIOS" op="VER"><UsersPage /></PermissionRoute>} />
                            <Route path="/auditoria" element={<AdminRoute><AuditPage /></AdminRoute>} />
                            <Route path="/grupos" element={<RoleRoute allowedRoles={['DIITRA_ADMIN', 'DIITRA_DOCENTE']}><GroupsPage /></RoleRoute>} />
                            <Route path="/parametros-normativos" element={<AdminRoute><ConfiguracionPage /></AdminRoute>} />
                            <Route path="/admin/emails" element={<AdminRoute><EmailEnginePage /></AdminRoute>} />
                            <Route path="/admin" element={<Navigate to="/usuarios" replace />} />
                            <Route path="/admin/groups" element={<RedirectPreserveSearch to="/grupos" />} />
                            <Route path="/admin/audit" element={<Navigate to="/auditoria" replace />} />
                            <Route path="/admin/configuracion" element={<RedirectPreserveSearch to="/parametros-normativos" />} />
                            <Route path="/proyectos/:projectUuid" element={<NavigateToProjectDetail />} />
                            <Route path="/investigacion/proyectos" element={<NavigateToResearchProjects />} />
                            <Route path="/investigacion/proyectos/workspace/:documentUuid" element={<NavigateToWorkspaceDetail />} />
                            <Route path="/lopdp/arco" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/lopdp/admin" element={<Navigate to="/admin/lopdp" replace />} />
                            
                            {/* Supervision Context (Admin Only) */}
                            <Route path="/investigacion" element={<AdminRoute><ResearchProjectsPage /></AdminRoute>} />
                            <Route path="/investigacion/workspace/:templateCode/:documentUuid" element={<AdminRoute><ProjectWorkspace /></AdminRoute>} />
                            <Route path="/investigacion/monitoreo/:projectUuid" element={<AdminRoute><MonitoringPage /></AdminRoute>} />
                            <Route path="/investigacion/informes-avance/:projectId" element={<AdminRoute><InformesAvancePage /></AdminRoute>} />
                            
                            {/* Researcher Context (Docentes, Estudiantes, Externos) */}
                            <Route path="/investigacion/mis-proyectos" element={<ResearcherRoute><MyProjectsPage /></ResearcherRoute>} />
                            <Route path="/investigacion/mis-proyectos/workspace/:templateCode/:documentUuid" element={<ResearcherRoute><ProjectWorkspace /></ResearcherRoute>} />
                            <Route path="/investigacion/mis-proyectos/monitoreo/:projectUuid" element={<ResearcherRoute><MonitoringPage /></ResearcherRoute>} />
                            <Route path="/investigacion/mis-proyectos/informes-avance/:projectId" element={<ResearcherRoute><InformesAvancePage /></ResearcherRoute>} />
                            
                            <Route path="/investigacion/adopcion" element={<RoleRoute allowedRoles={['DIITRA_ADMIN', 'DIITRA_DOCENTE']}><ProjectAdoptionPage /></RoleRoute>} />
                            <Route path="/convocatorias" element={<ConvocatoriaRoute />} />
                            <Route path="/revisiones" element={<PeerReviewPage />} />
                            <Route path="/revisiones/:revisionUuid" element={<EvaluacionPage />} />
                            <Route path="/arbitraje" element={<AdminRoute><ArbitrajePage /></AdminRoute>} />
                            <Route path="/arbitraje/proyecto/:projectUuid" element={<AdminRoute><ArbitrajeProyecto /></AdminRoute>} />
                            <Route path="/verificacion" element={<VerifyDocument />} />
                            <Route path="/verify" element={<RedirectPreserveSearch to="/verificacion" />} />
                        </Route>

                        {/* Public Verification Page (Accessible without authentication) */}
                        <Route path="/verificacion/:code" element={<VerifyDocument />} />
                        <Route path="/verify/:code" element={<RedirectVerifyCode />} />

                        <Route path="/consentimiento-lopdp" element={
                            <ProtectedRoute>
                                <LopdpConsentPage />
                            </ProtectedRoute>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                    </Suspense>
                </NotificationsProvider>
               </ConfirmProvider>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
