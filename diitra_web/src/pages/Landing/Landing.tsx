import { ArrowRight, ShieldCheck, Cpu, Database, FileText, Activity, Sun, Moon, Zap, Award, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
  currentTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const Landing = ({ currentTheme, toggleTheme }: LandingProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-text-main selection:text-bg-deep transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border-thin bg-bg-deep/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 76 65" fill="none" className="text-text-main font-bold">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
            <span className="text-sm font-bold tracking-tighter uppercase">DIITRA</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-surface rounded-full transition-colors text-text-dim hover:text-text-main"
            >
              {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold bg-text-main text-bg-deep px-5 py-2 rounded-md hover:opacity-90 transition-all flex items-center gap-2"
            >
              Ingresar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin bg-surface/50 text-[10px] font-bold tracking-[0.2em] uppercase text-text-dim">
            <Zap size={10} className="text-text-main" />
            <span>Sistema oficial - Tecnológico Traversari</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-text-main transition-all">
            DIITRA <br /> 
            <span className="text-text-dim">ISTPET.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-dim max-w-2xl mx-auto leading-relaxed font-medium">
            Plataforma operativa exclusiva para el Departamento de Investigación e Innovación 
            del Tecnológico Traversari - ISTPET.
          </p>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full md:w-auto h-12 px-8 bg-text-main text-bg-deep rounded-md font-bold text-sm hover:opacity-90 transition-all"
            >
              Acceder al Tablero
            </button>
            <button className="w-full md:w-auto h-12 px-8 border border-border-thin hover:border-text-dim rounded-md font-bold text-sm transition-all">
              Líneas de Investigación
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section className="py-32 px-6 border-t border-border-thin bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">Gestión Institucional</h2>
            <p className="text-text-dim max-w-lg text-sm font-medium">Bajo la normativa de la SENESCYT y el CES, optimizado para los procesos específicos del ISTPET.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<ShieldCheck className="text-text-main" />}
              title="Flujo de Revisión por Pares"
              description="Sistema automatizado de evaluación doble ciego. Anonimización de manuscritos y calificación cifrada bajo estándares del CES."
            />
            <FeatureCard 
              icon={<Activity className="text-text-main" />}
              title="Indicadores CACES"
              description="Exportación de datos en tiempo real para procesos de acreditación. Generación automática de archivos CSV/PDF para métricas de calidad."
            />
            <FeatureCard 
              icon={<Cpu className="text-text-main" />}
              title="Firma Electrónica"
              description="Integración nativa con firmas .p12 para actas de aprobación y reportes mensuales de evidencia de investigación."
            />
          </div>
        </div>
      </section>

      {/* Detailed Narrative Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div>
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest block mb-4">01 / Gestión de Investigación</span>
              <h3 className="text-3xl font-bold tracking-tighter mb-6">Ciclo de Convocatorias Digital</h3>
              <p className="text-text-dim text-sm leading-relaxed">
                Automatización de los "cuellos de botella" administrativos. Desde la subida de protocolos con Gantt y presupuesto, hasta el registro de evidencias mensuales (bitácoras, fotos, facturas).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border-thin">
              <div className="space-y-2">
                <p className="text-2xl font-bold font-mono">100%</p>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Operación sin papeles</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold font-mono">En Vivo</p>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Control presupuestario</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center space-y-6">
            <div className="p-6 rounded-lg border border-border-thin bg-surface/50 group hover:border-text-dim transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <Award size={20} className="text-text-main" />
                    <h4 className="font-bold text-sm tracking-tight text-text-main m-0">Registro SENADI</h4>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">Seguimiento de propiedad intelectual para patentes, depósitos de software y marcas dentro del ecosistema institucional.</p>
            </div>
            <div className="p-6 rounded-lg border border-border-thin bg-surface/50 group hover:border-text-dim transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <BookOpen size={20} className="text-text-main" />
                    <h4 className="font-bold text-sm tracking-tight text-text-main m-0">Integración con Repositorios</h4>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">Exportación directa a repositorios institucionales (DSpace), asegurando que los artículos y prototipos se publiquen automáticamente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border-thin text-text-dim">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 76 65" fill="none" className="text-text-main font-bold">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
              </svg>
              <span className="text-xs font-bold tracking-tight uppercase">DIITRA_OS</span>
            </div>
            <p className="text-[10px] max-w-xs leading-loose font-mono">
              Diseñado para Educación Superior Tecnológica. <br />
              Santiago de Quito, EC. 2026.
            </p>
          </div>
          <div className="text-[10px] font-mono flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>SISTEMA_EN_LINEA: MODULOS_ESTABLES</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-8 rounded-lg border border-border-thin bg-bg-deep hover:border-text-dim transition-all group">
    <div className="mb-6 p-3 rounded-md bg-surface inline-block">
      {icon}
    </div>
    <h3 className="text-lg font-bold tracking-tighter mb-3">{title}</h3>
    <p className="text-xs text-text-dim leading-relaxed font-medium">{description}</p>
  </div>
);

export default Landing;
