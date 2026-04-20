import { Plus, Users, FileText, Zap } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { name: 'Proyectos Activos', value: '12', icon: FileText, color: 'text-blue-400' },
    { name: 'Carga Docente', value: '85h', icon: Users, color: 'text-green-400' },
    { name: 'Aprobación Media', value: '92%', icon: Zap, color: 'text-yellow-400' },
  ];

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Bienvenido, Docente</h2>
          <p className="text-gray-400">Aquí tienes un resumen de tu actividad investigativa.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          <span>Nueva Postulación</span>
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.name} className="glass p-6 rounded-2xl border border-glass-border">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 font-medium mb-1">{stat.name}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="glass rounded-2xl border border-glass-border overflow-hidden">
        <div className="p-6 border-b border-glass-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Proyectos Recientes</h3>
          <button className="text-primary text-sm font-medium hover:underline">Ver todos</button>
        </div>
        <div className="p-6">
          <div className="text-gray-500 text-center py-10">
            No tienes proyectos recientes. ¡Comienza uno nuevo para automatizar tu investigación!
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
