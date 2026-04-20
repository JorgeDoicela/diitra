import { Plus, FileText, Activity, TrendingUp, Clock, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../components/Common/BentoGrid';

const Dashboard = () => {
  return (
    <main className="flex-1 bg-bg-deep p-10 overflow-y-auto selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
      <header className="flex justify-between items-end mb-16 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
            <Activity size={10} className="text-text-main" />
            <span>Operacional - ISTPET</span>
          </div>
          <h2 className="text-4xl font-bold text-text-main tracking-tighter">Investigación Traversari</h2>
          <p className="text-sm text-text-dim max-w-lg font-medium">Gestión integral de innovación y desarrollo tecnológico para el ISTPET.</p>
        </div>
        
        <div className="flex gap-4">
            <button className="flex items-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-5 py-2 rounded-md border border-border-thin text-xs font-bold transition-all">
                <FileText size={14} className="text-text-dim" />
                <span>Reportes</span>
            </button>
            <button className="flex items-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-6 py-2 rounded-md text-xs font-bold transition-all">
                <Plus size={16} />
                <span>Nuevo Proyecto</span>
            </button>
        </div>
      </header>

      <BentoGrid className="px-2">
        {/* Performance Graph Card */}
        <BentoCard 
          title="Rendimiento de Producción" 
          description="Producción institucional vs pronóstico"
          icon={<TrendingUp size={14} />}
          className="md:col-span-3 md:row-span-2 relative overflow-hidden"
        >
          <div className="absolute inset-0 top-16 opacity-20 grayscale pointer-events-none group-hover:opacity-30 transition-opacity invert-[var(--invert-img,0)]">
            <img 
              src="/research_growth_chart.png" 
              className="w-full h-full object-cover" 
              alt="Gráfico de Crecimiento de Investigación" 
            />
          </div>
          <div className="relative z-10 mt-auto flex justify-between items-end pt-32">
            <div className="space-y-1">
                <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Cumplimiento Global</p>
                <p className="text-5xl font-bold text-text-main font-mono tracking-tighter">84.22%</p>
            </div>
            <div className="text-right space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 bg-text-main text-bg-deep text-[10px] font-bold rounded-sm mb-2">
                    <TrendingUp size={10} />
                    <span>+12.4%</span>
                </div>
                <p className="text-[10px] text-text-dim font-mono uppercase">hash: 0x4f2d</p>
            </div>
          </div>
        </BentoCard>

        {/* Load Balance */}
        <BentoCard 
            title="Carga de Trabajo" 
            description="Horas de investigación asignadas" 
            icon={<Clock size={14} />}
            className="md:col-span-1"
        >
            <div className="mt-4">
                <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">32.5h</p>
                <div className="w-full h-[2px] bg-border-thin mt-5 rounded-full overflow-hidden text-transparent">.</div>
                <div className="w-full h-[2px] bg-text-main -mt-[2px] w-[81%] rounded-full relative z-10" />
                <div className="flex justify-between mt-3 text-[10px] font-mono text-text-dim uppercase">
                    <span>Utilización</span>
                    <span>81.25%</span>
                </div>
            </div>
        </BentoCard>

        {/* Publications Index */}
        <BentoCard 
            title="Activos" 
            description="Productos de investigación validados"
            icon={<BarChart3 size={14} />}
            className="md:col-span-1"
        >
            <div className="mt-2 flex items-center justify-between">
                <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">04</p>
                <ArrowUpRight size={18} className="text-text-main" />
            </div>
            <div className="mt-6 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-text-dim uppercase">Articulos_Indexados</span>
                    <span className="text-text-main font-bold">03</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-text-dim uppercase">Prototipos_Activos</span>
                    <span className="text-text-main font-bold">01</span>
                </div>
            </div>
        </BentoCard>

        {/* Active Sprints / Convocations */}
        <BentoCard 
            title="Convocatorias Activas" 
            description="Llamados institucionales abiertos"
            className="md:col-span-2"
        >
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md border border-border-thin bg-surface hover:bg-surface-hover transition-colors group cursor-pointer">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-text-main uppercase tracking-wider">Innovación_IST_2024</p>
                        <p className="text-[10px] text-text-dim font-mono">Cierra_en_14_dias</p>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-1 bg-text-main text-bg-deep rounded-sm border border-border-thin uppercase tracking-tighter">Activo</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border border-border-thin bg-surface opacity-50">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-text-main uppercase tracking-wider">Investigación_Semilla</p>
                        <p className="text-[10px] text-text-dim font-mono">Estado_en_cola</p>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-1 bg-transparent text-text-dim rounded-sm border border-border-thin uppercase tracking-tighter">Bloqueado</div>
                </div>
            </div>
        </BentoCard>

        {/* Audit Log / Reviews */}
        <BentoCard 
            title="Registro" 
            description="Registro detallado de revisiones por pares"
            icon={<ShieldCheck size={14} />}
            className="md:col-span-2"
        >
             <div className="mt-4 overflow-hidden rounded-md border border-border-thin bg-bg-deep">
                <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-surface border-b border-border-thin text-text-dim uppercase font-bold">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">ESTADO</th>
                            <th className="p-3 text-right">FECHA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin">
                        <tr className="hover:bg-surface transition-colors cursor-pointer group">
                            <td className="p-3 text-text-main group-hover:underline">0xRD_0421</td>
                            <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 text-text-main">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-main animate-pulse" />
                                    <span>PENDIENTE</span>
                                </span>
                            </td>
                            <td className="p-3 text-right text-text-dim">2026.04.20</td>
                        </tr>
                        <tr className="hover:bg-surface transition-colors cursor-pointer group">
                            <td className="p-3 text-text-main group-hover:underline">0xRD_0312</td>
                            <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 text-text-dim">
                                    <div className="w-1.5 h-1.5 rounded-full bg-text-dim" />
                                    <span>FUSIONADO</span>
                                </span>
                            </td>
                            <td className="p-3 text-right text-text-dim">2026.04.15</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </BentoCard>
      </BentoGrid>
    </main>
  );
};
      </BentoGrid>
    </main>
  );
};

export default Dashboard;
