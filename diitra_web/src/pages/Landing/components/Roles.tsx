import React from 'react';
import { Users, LayoutDashboard, Scale, ShieldCheck } from 'lucide-react';

const Roles: React.FC = () => {
    const rolesData = [
        { role: 'Investigador', desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', icon: Users },
        { role: 'Director de Investigación', desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', icon: LayoutDashboard },
        { role: 'Comité de Ética / Revisores', desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética de las propuestas.', icon: Scale },
        { role: 'Administrador', desc: 'Configuración de períodos académicos, líneas de investigación e integraciones de API externas.', icon: ShieldCheck },
    ];

    return (
        <section id="roles" className="py-20 lg:-ml-24 lg:-mr-24 space-y-16">
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                    Estructura & Niveles de Acceso.
                </h2>
                <p className="text-xs text-text-dim max-w-lg leading-relaxed font-medium">
                    Gestión de flujos institucionales con roles claramente definidos y segregación de funciones para asegurar la integridad de la producción científica.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesData.map((item, idx) => (
                    <div key={idx} className="bento-card-static p-6 flex flex-col justify-between relative min-h-[190px]">
                        <div className="flex justify-between items-start">
                            <div className="p-2 border border-border-thin rounded bg-bg-deep">
                                <item.icon size={18} strokeWidth={1.5} className="text-text-main" />
                            </div>
                            <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Nivel_0{idx + 1}</span>
                        </div>
                        <div className="mt-8 space-y-1.5">
                            <h4 className="text-xs font-semibold tracking-tight text-text-main uppercase font-mono">
                                {item.role}
                            </h4>
                            <p className="text-[11px] text-text-dim leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Roles;
