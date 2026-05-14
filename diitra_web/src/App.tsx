import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import UsersPage from './pages/Admin/UsersPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './api/AuthContext';
import ConvocatoriasPage from './pages/Investigacion/Convocatorias/ConvocatoriasPage';
import ResearchProjectsPage from './pages/Investigacion/Proyectos/ResearchProjectsPage';
import PeerReviewPage from './pages/Investigacion/PeerReview/PeerReviewPage';
import DocumentWorkspace from './pages/Investigacion/DocumentWorkspace/DocumentWorkspace';
import GroupsPage from './pages/Admin/GroupsPage';
import AuditPage from './pages/Admin/AuditPage';
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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated, isLoading, hasPermission, roles } = useAuth();
    if (isLoading) return null;
    
    const normalizedRoles = roles.map(r => r.toUpperCase());
    const isSystemAdmin = user?.administrador || normalizedRoles.includes('DIITRA_ADMIN') || normalizedRoles.includes('ADMIN_SISTEMA');

    // Validar permiso modular O flag de administrador global
    if (!isAuthenticated || (!isSystemAdmin && !hasPermission('USUARIOS', 'VER'))) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
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
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={<Login currentTheme={theme} />} />
          <Route path="/verify/:code" element={<VerifyDocument />} />
          <Route path="/verify" element={<VerifyDocument />} />
          
          {/* Internal Pages with Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <UsersPage />
              </DashboardLayout>
            </AdminRoute>
          } />

          <Route path="/admin/audit" element={
            <AdminRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <AuditPage />
              </DashboardLayout>
            </AdminRoute>
          } />

          <Route path="/admin/groups" element={
            <AdminRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <GroupsPage />
              </DashboardLayout>
            </AdminRoute>
          } />

          {/* Redirections for common paths */}
          <Route path="/investigacion" element={
            <ProtectedRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <ResearchProjectsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/convocatorias" element={
            <ProtectedRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <ConvocatoriasPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/revisiones" element={
            <ProtectedRoute>
              <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
                <PeerReviewPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/investigacion/workspace/:templateCode/:documentUuid" element={
            <ProtectedRoute>
                <DocumentWorkspace />
            </ProtectedRoute>
          } />

          <Route path="/analiticas" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
