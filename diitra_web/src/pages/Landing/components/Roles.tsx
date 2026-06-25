import React from 'react';
import { Users, LayoutDashboard, Scale, ShieldCheck } from 'lucide-react';

const Roles: React.FC = () => {
    return (
        <section id="roles" className="py-24 border-y border-border-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-6">
                    <h2 className="text-4xl font-bold tracking-tighter leading-tight text-text-main">
                        Estructura & Niveles <br /> de Acceso.
                    </h2>
                    <p className="text-[10px] text-text-dim leading-relaxed font-mono uppercase tracking-widest">
                        Gestión de flujos institucionales con roles claramente definidos.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { role: 'Investigador', desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', icon: Users },
                        { role: 'Director de Investigación', desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', icon: LayoutDashboard },
                        { role: 'Comité de Ética / Revisores', desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética.', icon: Scale },
                        { role: 'Administrador', desc: 'Configuración de períodos académicos, líneas de investigación e integraciones externas.', icon: ShieldCheck },
                    ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-lg border border-border-thin bg-surface/10 hover:border-border-hover transition-colors group">
                            <div className="mt-1 p-2 rounded bg-surface border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-text-main transition-all flex-shrink-0">
                                <item.icon size={14} strokeWidth={1.5} />
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
    );
};

export default Roles;
