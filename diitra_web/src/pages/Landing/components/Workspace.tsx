import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';

const Workspace: React.FC = () => {
    return (
        <section id="workspace" className="py-20 lg:-ml-24 lg:-mr-24">
            {/* Título superior al estilo Vercel */}
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl mb-16">
                Un espacio de trabajo <br className="hidden md:inline" /> para el investigador.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                {/* Izquierda (col-span-7): Mockup Interactivo */}
                <div className="lg:col-span-7 border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm select-none">
                    {/* Decoraciones del editor */}
                    <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
                        </div>
                        <span className="text-[10px] text-text-dim font-mono">Workspace://proyecto-investigacion-ia.doc</span>
                        <span className="px-2 py-0.5 rounded border border-success/30 bg-success-subtle text-success text-[9px] font-mono">EN EDICIÓN</span>
                    </div>

                    {/* Layout del mockup */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Panel Izquierdo (Estructura del Proyecto) */}
                        <div className="col-span-4 border-r border-border-thin pr-4 space-y-2 text-[10px] text-text-dim">
                            <p className="text-text-main font-semibold mb-2 font-mono">// ESTRUCTURA</p>
                            <div className="p-1.5 rounded bg-surface border border-border-thin text-text-main flex items-center justify-between font-sans">
                                <span>1. Resumen Ejecutivo</span>
                                <CheckCircle2 size={10} className="text-success" />
                            </div>
                            <div className="p-1.5 rounded border border-transparent flex items-center justify-between font-sans">
                                <span>2. Metodología</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                            </div>
                            <div className="p-1.5 rounded border border-transparent flex items-center justify-between font-sans">
                                <span>3. Presupuesto</span>
                                <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                            </div>
                            <div className="p-1.5 rounded border border-transparent flex items-center justify-between font-sans">
                                <span>4. Cronograma</span>
                                <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                            </div>
                        </div>

                        {/* Contenido del editor central */}
                        <div className="col-span-8 space-y-4 font-sans">
                            <div className="space-y-1">
                                <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// LÍNEA DE INVESTIGACIÓN</p>
                                <p className="text-text-main font-semibold">Desarrollo de Software y Automatización Industrial</p>
                            </div>
                            <div className="space-y-1 border-t border-border-thin pt-3">
                                <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// RESUMEN EJECUTIVO (Borrador)</p>
                                <p className="text-text-dim text-[10px] leading-relaxed">
                                    Este proyecto plantea el diseño de un módulo automatizado de control de procesos en tiempo real para optimizar la eficiencia operativa...
                                </p>
                            </div>
                            <div className="border border-border-thin rounded p-2.5 bg-surface/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                    <Users size={14} />
                                </div>
                                <div className="text-[10px]">
                                    <p className="text-text-main font-semibold font-mono">Docentes Colaborando</p>
                                    <p className="text-text-dim">Ing. M. Cevallos, Ing. J. Doicela</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Derecha (col-span-5): Párrafo descriptivo y menú de características */}
                <div className="lg:col-span-5 space-y-8">
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        Olvídate de los formularios rígidos secuenciales. DIITRA implementa un entorno dinámico donde coordinadores, docentes y estudiantes redactan propuestas, planifican el presupuesto y configuran hitos de forma simultánea.
                    </p>

                    <div className="space-y-4">
                        <span className="font-mono text-[10px] text-text-dim/80 uppercase tracking-[0.2em] font-semibold block">// Características</span>
                        <div className="flex flex-col border-t border-border-thin divide-y divide-border-thin">
                            {[
                                { title: 'Edición en tiempo real', desc: 'Protocolos colaborativos sin bloqueos.' },
                                { title: 'Doble ciego automático', desc: 'Evaluaciones anónimas y transparentes.' },
                                { title: 'Presupuesto modular', desc: 'Cronogramas e hitos vinculados.' },
                                { title: 'Control de distributivo', desc: 'Validación en tiempo real de horas de investigación.' }
                            ].map((item, idx) => (
                                <div key={idx} className="py-4 border-b border-border-thin flex justify-between items-center select-none">
                                    <div className="space-y-1">
                                        <span className="font-mono text-[11px] text-text-main font-bold tracking-wider uppercase block">{item.title}</span>
                                        <span className="text-[10px] text-text-dim block leading-none">{item.desc}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">0{idx + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Workspace;
