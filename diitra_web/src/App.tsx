import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import UsersPage from './pages/Admin/UsersPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './api/AuthContext';
import { NotificationsProvider } from './api/NotificationsContext';
import ConvocatoriasPage from './pages/Investigacion/Convocatorias/ConvocatoriasPage';
import ResearchProjectsPage from './pages/Investigacion/Proyectos/ResearchProjectsPage';
import MyProjectsPage from './pages/Investigacion/Proyectos/MyProjectsPage';
import PeerReviewPage from './pages/Investigacion/PeerReview/PeerReviewPage';
import { ProjectWorkspace } from './pages/Investigacion/Proyectos/Workspace/ProjectWorkspace';
import GroupsPage from './pages/Admin/GroupsPage';
import AuditPage from './pages/Admin/AuditPage';
import PublicConvocatoriasPage from './pages/Investigacion/Convocatorias/PublicConvocatoriasPage';
import { Settings2 } from 'lucide-react';
import VerifyDocument from './pages/Public/VerifyDocument';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0070f3]"></div>
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
    const { isAuthenticated, isLoading, hasPermission, isAdmin } = useAuth();
    if (isLoading) return null;
    
    // Validar permiso modular O flag de administrador global
    if (!isAuthenticated || (!isAdmin && !hasPermission('USUARIOS', 'VER'))) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const ConvocatoriaRoute = () => {
    const { isAdmin } = useAuth();
    return isAdmin ? <ConvocatoriasPage /> : <PublicConvocatoriasPage />;
};

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
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
          <Route path="/verify/:code" element={<VerifyDocument />} />
          <Route path="/verify" element={<VerifyDocument />} />
          
          {/* Internal Pages with Layout (Stable) */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <Outlet />
              </DashboardLayout>
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-surface border border-border-thin rounded-2xl flex items-center justify-center text-text-dim">
                  <Settings2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-text-main uppercase tracking-tighter">Módulo en Desarrollo</h2>
                <p className="text-sm text-text-dim max-w-xs">La configuración de cuenta y preferencias institucionales estará disponible en la próxima actualización.</p>
              </div>
            } />
            <Route path="/admin" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
            <Route path="/admin/groups" element={<AdminRoute><GroupsPage /></AdminRoute>} />
            <Route path="/investigacion" element={<ResearchProjectsPage />} />
            <Route path="/investigacion/mis-proyectos" element={<MyProjectsPage />} />
            <Route path="/convocatorias" element={<ConvocatoriaRoute />} />
            <Route path="/revisiones" element={<PeerReviewPage />} />
          </Route>
          
          <Route path="/investigacion/workspace/:templateCode/:documentUuid" element={
            <ProtectedRoute>
                <ProjectWorkspace />
            </ProtectedRoute>
          } />

          <Route path="/analiticas" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
