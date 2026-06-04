import {
    ArrowRight, Activity, TrendingUp, Clock,
    ShieldCheck, Sun, Moon, Cpu,
    Users, Fingerprint, Scale, FileSignature,
    LayoutDashboard, Globe, MessageSquareCode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Landing = ({ currentTheme, toggleTheme }: LandingProps) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-selection-bg selection:text-selection-fg transition-all duration-500 overflow-x-hidden">
            {/* Grid Overlay */}


            {/* Header Navigation */}
            <nav className="fixed top-0 w-full z-[60] border-b border-border-thin bg-bg-deep/70 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img 
                            src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'} 
                            alt="DIITRA Logo" 
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 text-text-dim hover:text-text-main transition-colors">
                            {currentTheme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-text-main text-bg-deep px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Acceder
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Space */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-40 space-y-32">

                {/* Hero Title Area */}
                <section className="space-y-6 animate-fade-up">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-text-main uppercase tracking-[0.3em]">
                        <Activity size={10} strokeWidth={2} />
                        <span>Tecnológico Traversari - ISTPET</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-semibold text-text-main tracking-tighter leading-[0.85]">
                        Departamento de <br />
                        Investigación e Innovación
                    </h1>
                    <p className="text-sm md:text-base text-text-dim max-w-2xl font-medium leading-relaxed">
                        DIITRA es un sistema diseñado para el Tecnológico Traversari - ISTPET.
                        Alineado con SENESCYT, CES y CACES, transformamos la burocracia científica en excelencia operativa institucional.
                    </p>
                    <div className="pt-6 flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-8 py-3 rounded-md text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Iniciar Gestión
                            <ArrowRight size={14} />
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-bg-deep text-text-main px-8 py-3 rounded-md border border-border-thin text-[11px] font-semibold uppercase tracking-widest hover:bg-surface transition-all">
                            Consultar Normativa IST
                        </button>
                    </div>
                </section>

                {/* Section: Contexto Normativo */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-t border-border-thin animate-fade-up">
                    <div className="space-y-4">
                        <div className="text-accent-vercel font-mono text-[10px] uppercase font-semibold tracking-[0.2em]">[ 01 ]</div>
                        <h3 className="text-xl font-semibold tracking-tight">Régimen Académico</h3>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">Cumplimiento estricto del Reglamento de Régimen Académico del CES para la validación de horas de investigación.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-accent-vercel font-mono text-[10px] uppercase font-semibold tracking-[0.2em]">[ 02 ]</div>
                        <h3 className="text-xl font-semibold tracking-tight">Estándar CACES</h3>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">Arquitectura de datos optimizada para generar las evidencias requeridas en los procesos de acreditación del ISTPET.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-accent-vercel font-mono text-[10px] uppercase font-semibold tracking-[0.2em]">[ 03 ]</div>
                        <h3 className="text-xl font-semibold tracking-tight">Impacto SENESCYT</h3>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">Categorización de proyectos y productos tecnológicos alineados a las líneas de investigación prioritarias.</p>
                    </div>
                </section>

                {/* Section: Modulos Bento Grid */}
                <section className="space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold tracking-tight">Módulos Esenciales</h2>
                        <div className="h-[1px] w-20 bg-text-main" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* A: Proyectos */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <TrendingUp size={20} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-1 border border-border-thin rounded-full uppercase">Fase_Postulación</span>
                            </div>
                            <div className="mt-12 space-y-3">
                                <h4 className="text-lg font-semibold tracking-tight">Gestión de Proyectos & Peer Review</h4>
                                <p className="text-[11px] text-text-dim leading-relaxed pr-6">
                                    Postulación digital completa con cronogramas Gantt y presupuestos.
                                    Sistema de **Doble Ciego** que anonimiza documentos automáticamente para evaluadores.
                                </p>
                            </div>
                        </div>

                        {/* B: Seguimiento */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <Clock size={20} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-1 border border-border-thin rounded-full uppercase">Monitoreo_Control</span>
                            </div>
                            <div className="mt-12 space-y-3">
                                <h4 className="text-lg font-semibold tracking-tight">Control & Seguimiento Presupuestario</h4>
                                <p className="text-[11px] text-text-dim leading-relaxed pr-6">
                                    Evidencias mensuales con carga de fotos y facturas.
                                    Alertas inteligentes de plazos y control de ejecución de fondos asignados.
                                </p>
                            </div>
                        </div>

                        {/* C: Innovacion */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <Cpu size={20} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-1 border border-border-thin rounded-full uppercase">Transferencia_IP</span>
                            </div>
                            <div className="mt-12 space-y-3">
                                <h4 className="text-lg font-semibold tracking-tight">Propiedad Intelectual & Repositorio</h4>
                                <p className="text-[11px] text-text-dim leading-relaxed pr-6">
                                    Registro de patentes y software vinculados al SENADI.
                                    Integración automática con bibliotecas digitales para publicación institucional inmediata.
                                </p>
                            </div>
                        </div>

                        {/* D: Calidad */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <ShieldCheck size={20} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-1 border border-border-thin rounded-full uppercase">Acreditación_CACES</span>
                            </div>
                            <div className="mt-12 space-y-3">
                                <h4 className="text-lg font-semibold tracking-tight">Calidad & Reportes de Acreditación</h4>
                                <p className="text-[11px] text-text-dim leading-relaxed pr-6">
                                    Generación de reportes operativos en formato CACES para el proceso de evaluación institucional del ISTPET.
                                    Dashboard de indicadores institucionales en tiempo real.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Roles (The Flow) */}
                <section className="py-24 border-y border-border-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-semibold tracking-tighter leading-tight">Estructura & Roles <br /> de Trabajo.</h2>
                            <p className="text-xs text-text-dim leading-relaxed font-mono uppercase tracking-widest">
                                Un sistema eficiente para Ecuador requiere jerarquías claras.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { role: 'Investigador', desc: 'Docentes y estudiantes que gestionan proyectos y reportan evidencias.', icon: Users },
                                { role: 'Director de Investigación', desc: 'Aprueba convocatorias y supervisa el presupuesto institucional.', icon: LayoutDashboard },
                                { role: 'Comité de Ética / Revisores', desc: 'Evalúan la pertinencia ética y científica de las propuestas.', icon: Scale },
                                { role: 'Administrador', desc: 'Gestión de períodos académicos y seguridad de usuarios.', icon: ShieldCheck },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-md border border-border-thin bg-surface/20 group hover:border-text-main transition-colors">
                                    <div className="mt-1 flex-shrink-0">
                                        <item.icon size={16} strokeWidth={1.5} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-[11px] font-semibold text-text-main uppercase tracking-widest">{item.role}</h5>
                                        <p className="text-[10px] text-text-dim leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section: Tecnologia Contextual */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bento-card static p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <FileSignature size={24} strokeWidth={1.5} />
                            <h3 className="text-2xl font-semibold tracking-tight">Firma Electrónica IST</h3>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            Integración nativa con archivos **.p12**. Permite que las resoluciones y actas de aprobación tengan validez legal inmediata sin necesidad de papeles físicos, agilizando la burocracia administrativa.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-accent-vercel uppercase font-semibold">
                            <Fingerprint size={12} />
                            <span>Seguridad Nivel Gubernamental</span>
                        </div>
                    </div>
                    <div className="bento-card static p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <Cpu size={24} strokeWidth={1.5} />
                            <h3 className="text-2xl font-semibold tracking-tight">Inteligencia Artificial</h3>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            Asistente normativo que verifica automáticamente si los proyectos se alinean a las líneas institucionales.
                            Detección de plagio preventiva y generación automática de resúmenes ejecutivos para CACES.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-accent-vercel uppercase font-semibold">
                            <MessageSquareCode size={12} />
                            <span>Automatización Predictiva</span>
                        </div>
                    </div>
                </section>

                {/* Section: Interoperabilidad */}
                <section className="text-center space-y-8 py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <Globe size={10} />
                        Interoperabilidad Total
                    </div>
                    <h3 className="text-3xl md:text-5xl font-semibold tracking-tighter">Sincronizado con su <br /> Gestión Académica.</h3>
                    <p className="text-sm text-text-dim max-w-xl mx-auto font-medium">
                        DIITRA se conecta con sus bases de datos existentes para validar cronogramas,
                        cargas horarias de docentes y distributivos académicos en tiempo real.
                    </p>
                </section>

            </main>

            {/* Detailed Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-border-thin text-text-dim">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <img 
                                src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'} 
                                alt="DIITRA Logo" 
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <p className="text-[11px] max-w-xs leading-relaxed font-mono">
                            Tecnológico Traversari, Quito - Ecuador. <br />
                            Automatización de procesos científicos e innovación tecnológica institucional.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">
                        <div className="space-y-4 flex flex-col">
                            <span className="text-text-main">Recursos</span>
                            <a href="#" className="hover:text-text-main transition-colors">Repositorio</a>
                            <a href="#" className="hover:text-text-main transition-colors">Normativa</a>
                            <a href="#" className="hover:text-text-main transition-colors">Formatos</a>
                        </div>
                        <div className="space-y-4 flex flex-col">
                            <span className="text-text-main">Soporte</span>
                            <a href="#" className="hover:text-text-main transition-colors">Help Center</a>
                            <a href="#" className="hover:text-text-main transition-colors">Seguridad</a>
                            <a href="#" className="hover:text-text-main transition-colors">CACES</a>
                        </div>
                    </div>
                </div>
                <div className="mt-20 pt-10 border-t border-border-thin flex justify-between items-center text-[9px] font-mono">
                    <span>© 2026 DIITRA. TODOS LOS DERECHOS RESERVADOS.</span>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
