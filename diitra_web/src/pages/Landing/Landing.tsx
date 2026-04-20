import { ArrowRight, ShieldCheck, Cpu, Database, FileText, Activity, Sun, Moon, Zap, Award, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Landing = ({ currentTheme, toggleTheme }: LandingProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-text-main selection:text-bg-deep transition-all duration-700">
      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border-thin bg-bg-deep/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg width="18" height="18" viewBox="0 0 76 65" fill="none" className="text-text-main">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono leading-none">DIITRA</span>
              <span className="text-[8px] text-text-dim font-mono tracking-widest leading-none mt-1">ISTPET_CORE_v1</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-mono tracking-widest text-text-dim uppercase">
              <a href="#" className="hover:text-text-main transition-colors">Docs</a>
              <a href="#" className="hover:text-text-main transition-colors">Procesos</a>
              <a href="#" className="hover:text-text-main transition-colors">Normativa</a>
            </div>
            <div className="h-4 w-[1px] bg-border-thin hidden md:block" />
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-1 hover:text-text-main transition-colors text-text-dim"
              >
                {currentTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-vercel-primary text-[10px] h-7 px-4 uppercase tracking-widest flex items-center gap-2"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-2 py-1 rounded border border-border-thin bg-surface/30 text-[9px] font-mono tracking-widest uppercase text-text-dim animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-vercel animate-pulse" />
              <span>SISTEMA_OPERATIVO / INVESTIGACIÓN</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.05em] leading-[0.95] text-text-main animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              La infraestructura para la <br /> 
              ciencia en el ISTPET.
            </h1>
            
            <p className="text-sm md:text-base text-text-dim max-w-lg leading-relaxed font-mono animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Gestión integral de innovación, desarrollo tecnológico y 
              cumplimiento normativo para investigadores y docentes.
            </p>
            
            <div className="pt-6 flex flex-col md:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-vercel-primary w-full md:w-auto h-10 px-8 text-[10px] uppercase tracking-widest"
              >
                Iniciar Sesión
              </button>
              <button className="btn-vercel-secondary w-full md:w-auto h-10 px-8 text-[10px] uppercase tracking-widest">
                Consultar Repositorio
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative metadata - technical sober look */}
        <div className="absolute bottom-10 right-10 hidden xl:block text-right">
          <p className="text-[9px] font-mono text-text-dim/40 tracking-widest uppercase">system_status: operational</p>
          <p className="text-[9px] font-mono text-text-dim/40 tracking-widest uppercase">build: 0x4f2d9a_stable</p>
        </div>
      </section>

      {/* Grid Display Section (The "Sober" look) */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-border-thin grid grid-cols-1 md:grid-cols-3 gap-0 bg-surface/5">
        <div className="p-8 border-r border-border-thin group hover:bg-surface/10 transition-colors">
          <div className="text-[10px] font-mono text-text-dim mb-10 flex items-center gap-2">
            <span className="text-accent-vercel">[ 01 ]</span>
            <span>EFICIENCIA_OPERATIVA</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Digitalización Total</h3>
          <p className="text-xs text-text-dim leading-relaxed font-mono">100% de los procesos de investigación sin necesidad de formularios físicos.</p>
        </div>
        <div className="p-8 border-r border-border-thin group hover:bg-surface/10 transition-colors">
           <div className="text-[10px] font-mono text-text-dim mb-10 flex items-center gap-2">
            <span className="text-accent-vercel">[ 02 ]</span>
            <span>CUMPLIMIENTO_CACES</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Normativa Integrada</h3>
          <p className="text-xs text-text-dim leading-relaxed font-mono">Motor de auditoría diseñado para cumplir los estándares de evaluación superior.</p>
        </div>
        <div className="p-8 group hover:bg-surface/10 transition-colors">
           <div className="text-[10px] font-mono text-text-dim mb-10 flex items-center gap-2">
            <span className="text-accent-vercel">[ 03 ]</span>
            <span>SEGURIDAD_AVANZADA</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Doble Ciego</h3>
          <p className="text-xs text-text-dim leading-relaxed font-mono">Anonimización criptográfica para revisiones imparciales y transparentes.</p>
        </div>
      </section>

      {/* Visual Narrative Section */}
      <section className="py-24 px-6 border-t border-border-thin">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-6">
            <h3 className="text-4xl font-bold tracking-tighter leading-tight">Arquitectura para la excelencia.</h3>
            <p className="text-xs text-text-dim leading-relaxed font-mono">
              DIITRA conecta cada fase del ciclo de innovación. Desde la postulación inicial hasta la publicación institutional, bajo un entorno unificado y seguro.
            </p>
          </div>
          <div className="relative p-6 rounded border border-border-thin bg-surface/20 group overflow-hidden">
             <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-text-dim opacity-50">METRIC_VIEW_01</div>
             <div className="aspect-video bg-bg-deep border border-border-thin rounded flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/vercel/image/upload/v1645474324/docs-v2/frameworks/nextjs_q4ovq7.svg')] grayscale opacity-5 mix-blend-overlay scale-150 rotate-12" />
                <div className="text-center font-mono">
                  <div className="text-[10px] text-accent-vercel mb-2">OPERATIONAL</div>
                  <div className="h-[2px] w-8 bg-text-dim mx-auto" />
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

export default Landing;
