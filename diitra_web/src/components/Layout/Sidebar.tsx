import { Home, ClipboardList, PenTool, BarChart3, Settings, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Home', icon: Home, active: true },
    { name: 'Mis Proyectos', icon: ClipboardList, active: false },
    { name: 'Convocatorias', icon: PenTool, active: false },
    { name: 'Evaluaciones', icon: ShieldCheck, active: false },
    { name: 'Reportes CACES', icon: BarChart3, active: false },
  ];

  return (
    <aside className="w-64 h-screen glass border-r border-glass-border flex flex-col p-4">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg shadow-lg shadow-primary/30 flex items-center justify-center">
            <span className="font-bold text-white">D</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white m-0">DIITRA</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 group ${
              item.active ? 'sidebar-item-active text-white' : 'text-gray-400'
            }`}
          >
            <item.icon size={20} className={item.active ? 'text-primary' : 'group-hover:text-gray-200'} />
            <span className="font-medium">{item.name}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-glass-border">
        <div className="flex items-center gap-3 px-3 py-3 text-gray-400 cursor-pointer hover:text-white">
          <Settings size={20} />
          <span className="font-medium">Ajustes</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
