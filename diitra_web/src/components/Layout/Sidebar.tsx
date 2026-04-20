import { Home, ClipboardList, PenTool, BarChart3, Settings, ShieldCheck, Search, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Sidebar = ({ currentTheme, toggleTheme }: SidebarProps) => {
  const menuItems = [
    { name: 'Tablero', icon: Home, active: true },
    { name: 'Investigación', icon: ClipboardList, active: false },
    { name: 'Convocatorias', icon: PenTool, active: false },
    { name: 'Revisiones', icon: ShieldCheck, active: false },
    { name: 'Analíticas', icon: BarChart3, active: false },
  ];

  return (
    <aside className="w-64 h-screen bg-bg-deep border-r border-border-thin flex flex-col pt-8 pb-4 transition-colors duration-300">
      {/* Brand - Vercel Inspired */}
      <div className="mb-12 px-6 flex items-center gap-3">
        <svg 
            width="24" height="24" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="text-text-main hover:opacity-80 transition-opacity cursor-pointer"
        >
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
        </svg>
        <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-text-main m-0 transition-colors">DIITRA | ISTPET</h1>
            <span className="text-[10px] text-text-dim uppercase tracking-[0.2em] transition-colors">Investigación e Innovación</span>
        </div>
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
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 group ${
              item.active 
                ? 'bg-surface text-text-main' 
                : 'text-text-dim hover:text-text-main'
            }`}
          >
            <item.icon size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-tight">{item.name}</span>
          </div>
        ))}
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
        <div className="flex items-center gap-3 px-3 py-2 text-text-dim cursor-pointer hover:bg-surface rounded-md transition-all group">
          <Settings size={16} strokeWidth={1.5} className="group-hover:text-text-main transition-colors" />
          <span className="text-sm font-medium group-hover:text-text-main transition-colors">Configuración</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
