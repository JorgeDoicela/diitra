import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import UsersPage from './pages/Admin/UsersPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './api/AuthContext';

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
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    if (isLoading) return null;
    
    // Validar permiso modular para administración de usuarios
    if (!isAuthenticated || !hasPermission('USUARIOS', 'VER')) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing currentTheme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={<Login />} />
          
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

          {/* Redirections for common paths */}
          <Route path="/investigacion" element={<Navigate to="/dashboard" replace />} />
          <Route path="/convocatorias" element={<Navigate to="/dashboard" replace />} />
          <Route path="/revisiones" element={<Navigate to="/dashboard" replace />} />
          <Route path="/analiticas" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
