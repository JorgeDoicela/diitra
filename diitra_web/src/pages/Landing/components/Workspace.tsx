import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';

const Workspace: React.FC = () => {
    return (
        <section id="workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 items-center">

            {/* Izquierda: Título y descripción */}
            <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-dim uppercase tracking-wider">
                    <span>01 / Ecosistema Colaborativo</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[0.95] text-text-main">
                    Un espacio de trabajo para el investigador.
                </h2>
                <p className="text-xs text-text-dim leading-relaxed font-medium">
                    Olvídate de los formularios rígidos secuenciales. DIITRA implementa un entorno dinámico donde coordinadores, docentes y estudiantes redactan propuestas, planifican el presupuesto y configuran hitos de forma simultánea.
                </p>

                {/* Lista de sub-características */}
                <div className="space-y-3 pt-2">
                    {[
                        'Edición colaborativa en tiempo real de protocolos.',
                        'Ananonimización automática para evaluación doble ciego.',
                        'Construcción modular de metodología, cronograma y presupuesto.'
                    ].map((text, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-[11px] text-text-dim">
                            <CheckCircle2 size={13} className="text-text-main mt-0.5" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Derecha: Mockup Interactivo de la Interfaz en HTML/CSS */}
            <div className="lg:col-span-7 border border-border-thin rounded-xl bg-surface/35 shadow-xl p-4 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm group hover:border-border-hover transition-all duration-300">
                {/* Decoraciones del editor */}
                <div className="flex items-center justify-between border-b border-border-thin pb-3 mb-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
                        <span className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                        <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
                    </div>
                    <span className="text-[10px] text-text-dim">Workspace://proyecto-investigacion-ia.doc</span>
                    <span className="px-2 py-0.5 rounded border border-success/30 bg-success-subtle text-success text-[9px]">EN EDICIÓN</span>
                </div>

                {/* Layout del mockup */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Panel Izquierdo (Estructura del Proyecto) */}
                    <div className="col-span-4 border-r border-border-thin pr-4 space-y-2 text-[10px] text-text-dim">
                        <p className="text-text-main font-semibold mb-2">// ESTRUCTURA</p>
                        <div className="p-1.5 rounded bg-surface border border-border-thin text-text-main flex items-center justify-between">
                            <span>1. Resumen Ejecutivo</span>
                            <CheckCircle2 size={10} className="text-success" />
                        </div>
                        <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                            <span>2. Metodología</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                        </div>
                        <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                            <span>3. Presupuesto</span>
                            <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                        </div>
                        <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                            <span>4. Cronograma (Gantt)</span>
                            <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                        </div>
                    </div>

                    {/* Contenido del editor central */}
                    <div className="col-span-8 space-y-3">
                        <div className="space-y-1">
                            <p className="text-[10px] text-text-dim uppercase tracking-wider">// LÍNEA DE INVESTIGACIÓN</p>
                            <p className="text-text-main font-semibold">Desarrollo de Software y Automatización Industrial</p>
                        </div>
                        <div className="space-y-1 border-t border-border-thin pt-2">
                            <p className="text-[10px] text-text-dim uppercase tracking-wider">// RESUMEN EJECUTIVO (Borrador)</p>
                            <p className="text-text-dim text-[10px] leading-relaxed">
                                Este proyecto plantea el diseño de un módulo automatizado de control de procesos en tiempo real para optimizar la eficiencia operativa...
                            </p>
                        </div>
                        <div className="border border-border-thin rounded p-2 bg-surface/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                <Users size={14} />
                            </div>
                            <div className="text-[10px]">
                                <p className="text-text-main font-semibold">Docentes Colaborando</p>
                                <p className="text-text-dim">Ing. M. Cevallos, Ing. J. Doicela</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
};

export default Workspace;
