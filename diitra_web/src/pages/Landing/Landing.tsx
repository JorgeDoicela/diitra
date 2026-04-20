import { ArrowRight, ShieldCheck, Cpu, Database, FileText, Activity, Sun, Moon, Zap, Award, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Landing = ({ currentTheme, toggleTheme }: LandingProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-text-main selection:text-bg-deep transition-all duration-700 bg-glow">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border-thin bg-bg-deep/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 76 65" fill="none" className="text-text-main">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
            <span className="text-xs font-bold tracking-tighter uppercase font-mono">DIITRA | ISTPET</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-1.5 hover:bg-surface rounded-md transition-colors text-text-dim hover:text-text-main border border-transparent hover:border-border-thin"
            >
              {currentTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-vercel-primary text-[11px] h-8 flex items-center gap-2"
            >
              Ingresar <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative">
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin bg-surface/50 text-[10px] font-bold tracking-widest uppercase text-text-dim animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Zap size={10} className="text-accent-vercel" />
            <span>Infraestructura de Investigación v1.0</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-[-0.04em] leading-[0.85] text-text-main animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Investigación <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-dim">Sin Fricción.</span>
          </h1>
          <p className="text-base md:text-lg text-text-dim max-w-xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Automatiza la carga administrativa, gestiona presupuestos y 
            asegura el cumplimiento normativo del Tecnológico Traversari.
          </p>
          <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-vercel-primary w-full md:w-auto h-11 px-10 text-xs"
            >
              Comenzar Proyecto
            </button>
            <button className="btn-vercel-secondary w-full md:w-auto h-11 px-10 text-xs">
              Líneas de Investigación
            </button>
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-y border-border-thin bg-surface/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem label="Eficiencia" value="+40%" />
            <StatItem label="Cumplimiento" value="CACES" />
            <StatItem label="Digitalización" value="100%" />
            <StatItem label="Soporte" value="24/7" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Gestión Inteligente</h2>
            <p className="text-text-dim max-w-md text-sm font-medium">Diseñado para el rigor científico del ISTPET y las exigencias de la educación superior.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard 
              icon={<ShieldCheck size={18} className="text-text-main" />}
              title="Doble Ciego Automatizado"
              description="Elimina el sesgo en las revisiones con nuestro motor de anonimización distribuida y rúbricas dinámicas."
            />
            <FeatureCard 
              icon={<Activity size={18} className="text-text-main" />}
              title="Métricas en Tiempo Real"
              description="Visualiza el impacto de cada proyecto con dashboards alineados a los indicadores del CACES."
            />
            <FeatureCard 
              icon={<Cpu size={18} className="text-text-main" />}
              title="Firma Digital .p12"
              description="Autorizaciones legales instantáneas sin necesidad de papel, integradas nativamente en el flujo."
            />
          </div>
        </div>
      </section>

      {/* Secondary Feature Narrative */}
      <section className="py-32 px-6 border-t border-border-thin relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[radial-gradient(circle_at_20%_50%,rgba(0,112,243,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="text-5xl font-bold tracking-tighter leading-tight">Del borrador al repositorio institutional.</h3>
            <p className="text-text-dim text-base leading-relaxed">
              DIITRA conecta cada fase de la investigación. Desde la postulación inicial hasta la publicación en DSpace, todo ocurre en un ecosistema unificado.
            </p>
            <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-accent-vercel/10 border border-accent-vercel/20 flex items-center justify-center">
                        <ArrowRight size={10} className="text-accent-vercel" />
                    </div>
                    Asignación automática de revisores
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-accent-vercel/10 border border-accent-vercel/20 flex items-center justify-center">
                        <ArrowRight size={10} className="text-accent-vercel" />
                    </div>
                    Gestión de propiedad intelectual (SENADI)
                </li>
            </ul>
          </div>
          <div className="relative aspect-video rounded-xl border border-border-thin bg-surface/50 shadow-2xl overflow-hidden group">
            <div className="absolute inset-4 border border-border-thin rounded-lg bg-bg-deep flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('/research_growth_chart.png')] bg-cover bg-center grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700" />
                <div className="relative z-10 text-center">
                    <p className="text-[10px] font-mono text-text-dim mb-2">build_0x12f_output</p>
                    <div className="h-[1px] w-12 bg-accent-vercel mx-auto" />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border-thin text-text-dim">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 76 65" fill="none" className="text-text-main">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
              </svg>
              <span className="text-xs font-bold tracking-tight uppercase font-mono">DIITRA_SYSTEM</span>
            </div>
            <p className="text-[11px] max-w-xs leading-relaxed font-mono">
              Departamento de Investigación e Innovación Traversari. <br />
              Tecnológico Traversari, Quito. © 2026.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-vercel animate-pulse" />
              <span>DIITRA_ISTPET_STABLE_v1.0.4</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
    <div className="text-center md:text-left space-y-1">
        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-text-main">{value}</p>
    </div>
);

const FeatureCard = ({ icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="bento-card p-8 group">
    <div className="mb-6 p-2 rounded-md bg-bg-deep inline-block border border-border-thin group-hover:border-text-dim transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-bold tracking-tight mb-2 text-text-main">{title}</h3>
    <p className="text-xs text-text-dim leading-relaxed font-medium">{description}</p>
  </div>
);

export default Landing;
