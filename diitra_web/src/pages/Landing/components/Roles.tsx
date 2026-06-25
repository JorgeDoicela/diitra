import React, { useState } from 'react';
import { Users, LayoutDashboard, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Roles: React.FC = () => {
    const [activeRole, setActiveRole] = useState<number>(0);

    const rolesData = [
        { 
            role: 'Investigador', 
            desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', 
            icon: Users,
            permissions: ['Crear propuestas de proyecto', 'Planificar presupuestos e hitos', 'Cargar evidencias de avance']
        },
        { 
            role: 'Director de Investigación', 
            desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', 
            icon: LayoutDashboard,
            permissions: ['Apertura de convocatorias', 'Asignación de pares doble ciego', 'Supervisión presupuestaria']
        },
        { 
            role: 'Comité de Ética / Revisores', 
            desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética de las propuestas.', 
            icon: Scale,
            permissions: ['Evaluación anónima doble ciego', 'Emisión de actas de dictamen', 'Firma electrónica de resoluciones']
        },
        { 
            role: 'Administrador', 
            desc: 'Configuración de períodos académicos, líneas de investigación e integraciones de API externas.', 
            icon: ShieldCheck,
            permissions: ['Configuración del sistema', 'Gestión de distributivos docentes', 'Integración y API (SIIES / DSpace)']
        },
    ];

    return (
        <section id="roles" className="py-20 lg:-ml-24 lg:-mr-24 space-y-16 select-none">
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                    Estructura & Niveles de Acceso.
                </h2>
                <p className="text-xs text-text-dim max-w-lg leading-relaxed font-medium">
                    Gestión de flujos institucionales con roles claramente definidos y segregación de funciones para asegurar la integridad de la producción científica. Clic en los roles para explorar sus permisos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesData.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveRole(idx)}
                        className={`p-6 flex flex-col justify-between text-left rounded-lg border transition-all duration-300 min-h-[220px] cursor-pointer ${
                            activeRole === idx 
                                ? 'bg-surface border-brand shadow-[0_4px_20px_rgba(0,112,243,0.1)]' 
                                : 'bg-surface border-border-thin hover:border-border-hover'
                        }`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className={`p-2 border rounded bg-bg-deep transition-colors ${activeRole === idx ? 'border-brand/40 text-brand' : 'border-border-thin text-text-main'}`}>
                                <item.icon size={18} strokeWidth={1.5} />
                            </div>
                            <span className={`text-[9px] font-mono px-2 py-0.5 border rounded-full uppercase transition-colors ${
                                activeRole === idx ? 'border-brand/30 bg-brand-subtle text-brand font-bold' : 'border-border-thin text-text-dim'
                            }`}>Nivel_0{idx + 1}</span>
                        </div>
                        
                        <div className="mt-6 space-y-2 w-full">
                            <h4 className={`text-xs font-semibold tracking-tight uppercase font-mono transition-colors ${activeRole === idx ? 'text-brand' : 'text-text-main'}`}>
                                {item.role}
                            </h4>
                            <p className="text-[11px] text-text-dim leading-relaxed">
                                {item.desc}
                            </p>

                            {/* Detalle dinámico de permisos */}
                            <div className={`pt-3 border-t border-border-thin/60 space-y-1.5 transition-all duration-500 overflow-hidden ${
                                activeRole === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <p className="text-[8px] font-mono text-text-dim uppercase tracking-wider">// ACCIONES PERMITIDAS</p>
                                {item.permissions.map((perm, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-1.5 text-[9px] text-text-main font-sans">
                                        <CheckCircle2 size={10} className="text-brand shrink-0" />
                                        <span>{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default Roles;
