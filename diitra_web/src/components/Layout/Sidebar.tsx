import { Home, ClipboardList, PenTool, BarChart3, Settings, ShieldCheck, Search, Sun, Moon, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Sidebar = ({ currentTheme, toggleTheme }: SidebarProps) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Tablero', icon: Home, path: '/dashboard' },
    { name: 'Investigación', icon: ClipboardList, path: '/investigacion' },
    { name: 'Convocatorias', icon: PenTool, path: '/convocatorias' },
    { name: 'Revisiones', icon: ShieldCheck, path: '/revisiones' },
    { name: 'Analíticas', icon: BarChart3, path: '/analiticas' },
  ];

  // Agregar Administración si tiene permiso para gestionar usuarios O es administrador global
  if (user?.administrador || hasPermission('USUARIOS', 'VER')) {
    menuItems.push({ name: 'Administración', icon: Users, path: '/admin' });
  }

  return (
    <aside className="w-64 h-screen bg-bg-deep border-r border-border-thin flex flex-col pt-8 pb-4 transition-colors duration-300">
      {/* Brand - Vercel Inspired */}
      <div className="mb-12 px-6 flex items-center cursor-pointer" onClick={() => navigate('/')}>
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
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 group ${
                isActive 
                  ? 'bg-surface text-text-main shadow-sm' 
                  : 'text-text-dim hover:text-text-main hover:bg-surface/50'
              }`}
            >
              <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`text-sm tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
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
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 px-3 py-2 text-text-dim cursor-pointer hover:bg-surface rounded-md transition-all group"
        >
          <Settings size={16} strokeWidth={1.5} className="group-hover:text-text-main transition-colors" />
          <span className="text-sm font-medium group-hover:text-text-main transition-colors">Configuración</span>
        </div>
        <div 
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="flex items-center gap-3 px-3 py-2 text-text-dim cursor-pointer hover:bg-red-500/10 hover:text-red-500 rounded-md transition-all group"
        >
          <LogOut size={16} strokeWidth={1.5} className="group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium transition-colors">Cerrar Sesión</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
