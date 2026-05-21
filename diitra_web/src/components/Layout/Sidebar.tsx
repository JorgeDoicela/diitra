import { Home, ClipboardList, PenTool, BarChart3, Settings, ShieldCheck, Search, Sun, Moon, Users, LogOut, Award, X, Activity, ListChecks } from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ currentTheme, toggleTheme, isOpen, onClose }: SidebarProps) => {
  const { logout, hasPermission, roles, isAdmin, isDocente, isEstudiante, isRevisor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const allMenuItems = [
    { name: 'Tablero', icon: Home, path: '/dashboard', roles: ['ANY'] },
    { name: 'Investigación', icon: ClipboardList, path: '/investigacion', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
    { name: 'Mis Proyectos', icon: ListChecks, path: '/investigacion/mis-proyectos', roles: ['DIITRA_DOCENTE', 'DOCENTE_INV', 'DIITRA_ESTUDIANTE'], indent: true },
    { name: 'Convocatorias', icon: PenTool, path: '/convocatorias', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_ESTUDIANTE', 'DOCENTE_INV'] },
    { name: 'Revisiones', icon: ShieldCheck, path: '/revisiones', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_REVISOR_EXTERNO'] },
    { name: 'Verificador', icon: ShieldCheck, path: '/verify', roles: ['ANY'] },
    { name: 'Analíticas', icon: BarChart3, path: '/analiticas', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'] },
    { name: 'Usuarios', icon: Users, path: '/admin', permission: 'USUARIOS:VER' },
    { name: 'Auditoría', icon: Activity, path: '/admin/audit', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
    { name: 'Grupos', icon: Award, path: '/admin/groups', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DOCENTE_INV'] },
    { name: 'Configuración', icon: Settings, path: '/admin/configuracion', roles: ['DIITRA_ADMIN', 'ADMIN_SISTEMA'] },
  ];

  const menuItems = allMenuItems.filter(item => {
    // 1. Admins see everything
    if (isAdmin) return true;

    // 2. Specific permission check
    if (item.permission) {
        const [module, op] = item.permission.split(':');
        return hasPermission(module, op);
    }

    // 3. Role-based restrictions
    if (item.roles) {
        if (item.roles.includes('ANY')) return true;
        
        const checkRoles = item.roles.map(r => r.toUpperCase());
        
        if (checkRoles.includes('DIITRA_DOCENTE') || checkRoles.includes('DOCENTE_INV')) {
            if (isDocente) return true;
        }
        
        if (checkRoles.includes('DIITRA_ESTUDIANTE')) {
            if (isEstudiante) return true;
        }
        
        if (checkRoles.includes('DIITRA_REVISOR_EXTERNO')) {
            if (isRevisor) return true;
        }

        // Generic fallback for any other roles
        return item.roles.some(r => roles.includes(r.toUpperCase()));
    }

    return true;
  });

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-bg-deep border-r border-border-thin flex flex-col pt-8 pb-4 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-8 p-2 text-text-dim hover:text-text-main lg:hidden"
        >
          <X size={20} />
        </button>

        {/* Brand - Vercel Inspired */}
        <div className="mb-12 px-6 flex items-center cursor-pointer" onClick={() => handleNavigation('/')}>
          <img 
            src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'} 
            alt="DIITRA Logo" 
            className="h-10 w-auto object-contain transition-all duration-300 hover:opacity-80"
          />
        </div>

        {/* Navigator Search */}
        <div className="px-4 mb-10">
          <div className="flex h-10 items-center gap-2 px-3 bg-surface border border-border-thin rounded-md group hover:border-text-dim transition-colors cursor-pointer">
              <Search size={14} className="text-text-dim" />
              <span className="text-xs text-text-dim flex-1">Buscar...</span>
              <kbd className="text-[10px] bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim font-sans transition-colors">⌘K</kbd>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
                || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <div
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 group ${
                  (item as any).indent ? 'ml-3 border-l border-border-thin pl-4' : ''
                } ${
                  isActive 
                    ? 'bg-surface text-text-main shadow-sm' 
                    : 'text-text-dim hover:text-text-main hover:bg-surface/50'
                }`}
              >
                <item.icon size={(item as any).indent ? 14 : 16} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-sm tracking-tight ${
                  (item as any).indent ? 'text-xs' : ''
                } ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
              </div>
            );
          })}
        </nav>

        {/* Theme Toggle & Bottom Actions */}
        <div className="px-3 pt-4 border-t border-border-thin space-y-1">
          <div 
            onClick={toggleTheme}
            className="flex items-center justify-between px-3 py-2 text-text-dim cursor-pointer hover:bg-surface rounded-md transition-all group"
          >
            <div className="flex items-center gap-3">
              {currentTheme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
              <span className="text-sm font-medium group-hover:text-text-main transition-colors">
                {currentTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            </div>
          </div>
          <div 
            onClick={() => handleNavigation('/settings')}
            className="flex items-center gap-3 px-3 py-2 text-text-dim cursor-pointer hover:bg-surface rounded-md transition-all group"
          >
            <Settings size={16} strokeWidth={1.5} className="group-hover:text-text-main transition-colors" />
            <span className="text-sm font-medium group-hover:text-text-main transition-colors">Configuración</span>
          </div>
          <div 
            onClick={async () => {
              await logout();
              handleNavigation('/');
            }}
            className="flex items-center gap-3 px-3 py-2 text-text-dim cursor-pointer hover:bg-red-500/10 hover:text-red-500 rounded-md transition-all group"
          >
            <LogOut size={16} strokeWidth={1.5} className="group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-medium transition-colors">Cerrar Sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

